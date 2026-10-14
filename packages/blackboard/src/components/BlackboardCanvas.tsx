'use client';

import '@excalidraw/excalidraw/index.css';
import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle, type ComponentType } from 'react';
import { useBlackboardContext } from '../lib/context';
import { SCHEMA_VERSIONS } from '../lib/persistence/version';
import { applyStepVisibility, canonicalElements, stampBoardStep } from '../lib/steps';
import { logEvent } from '../lib/events';
import { BlackboardSkeleton } from './BlackboardSkeleton';
import type { BlackboardScene, BoardElementMeta, BoardInsertOpts, MatrixState } from '../types/blackboard';

interface ExcalidrawAPI {
  getSceneElements(): readonly unknown[];
  getAppState(): Record<string, unknown>;
  getFiles(): Record<string, unknown>;
  // Excalidraw 0.18: addFiles takes BinaryFileData[] (an ARRAY, not a map).
  addFiles(files: { mimeType: string; dataURL: string; id: string; created: number }[]): void;
  updateScene(scene: {
    elements?: readonly unknown[];
    appState?: Record<string, unknown>;
    commit?: boolean;
  }): void;
}

type ExcalidrawComponent = ComponentType<Record<string, unknown>>;

const PERSISTED_APPSTATE_KEYS = [
  'viewBackgroundColor',
  'gridSize',
  'zoom',
  'scrollX',
  'scrollY',
] as const;

export interface BlackboardCanvasRef {
  getScene: () => Promise<BlackboardScene | null>;
  getImage: () => Promise<Blob | null>;
  clear: () => void;
  /** Flushes any pending debounced save immediately. */
  flush: () => void;
  /** Stamps `customData.boardStep` on elements lacking it (call before changing step). */
  stampCurrentStep: (step: number) => void;
  insertImage: (dataUrl: string, opts?: BoardInsertOpts) => void;
  /** Replaces the raster of an existing technical element, keeping its position. */
  replaceImage: (elementId: string, dataUrl: string, meta?: BoardElementMeta) => void;
}

interface BlackboardCanvasProps {
  sceneId: string;
  initialScene?: BlackboardScene | null;
  onChange?: (scene: BlackboardScene) => void;
  theme?: 'light' | 'dark';
}

export const BlackboardCanvas = forwardRef<BlackboardCanvasRef, BlackboardCanvasProps>(
  function BlackboardCanvas({ sceneId, initialScene, onChange, theme = 'light' }, ref) {
    const { state } = useBlackboardContext();
    const currentStep = state.scenes[sceneId]?.currentStep ?? 0;
    const [Excalidraw, setExcalidraw] = useState<ExcalidrawComponent | null>(null);
    const [api, setApi] = useState<ExcalidrawAPI | null>(null);
    // Excalidraw's own toolbars can cover a big slice of the canvas; the
    // teacher may fold them away and still draw (shortcuts keep working).
    const [toolsMinimized, setToolsMinimized] = useState(
      () =>
        typeof window !== 'undefined' &&
        localStorage.getItem('bb-tools-min') === '1',
    );
    // The left properties panel (stroke/fill colors, width, opacity, layers)
    // can be collapsed on its own while keeping the top tool bar visible.
    const [propsMinimized, setPropsMinimized] = useState(
      () =>
        typeof window !== 'undefined' &&
        localStorage.getItem('bb-props-min') === '1',
    );
    // The properties panel (.App-menu__left) only exists while the active
    // tool exposes props — track its presence so the toggle appears with it.
    const [propsPanelVisible, setPropsPanelVisible] = useState(false);
    const canvasRootRef = useRef<HTMLDivElement | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedSceneId = useRef<string | null>(null);
    // Watch Excalidraw's DOM: the properties panel mounts/unmounts with the
    // active tool, so the minimize toggle must appear and disappear with it.
    useEffect(() => {
      const root = canvasRootRef.current;
      if (!root || !Excalidraw) return;
      const check = () =>
        setPropsPanelVisible(Boolean(root.querySelector('.App-menu__left')));
      const observer = new MutationObserver(check);
      observer.observe(root, { childList: true, subtree: true });
      check();
      return () => observer.disconnect();
    }, [Excalidraw]);
    const mountedInitialData = useRef<BlackboardScene | null>(null);
    const matrixStatesRef = useRef<Record<string, MatrixState>>({});
    const pendingInsertsRef = useRef<{ dataUrl: string; opts: BoardInsertOpts }[]>([]);
    const latestChangeRef = useRef<{
      sceneId: string;
      elements: readonly unknown[];
      appState: unknown;
    } | null>(null);

    // Lazy-load Excalidraw manually — avoids next/dynamic ssr:false quirks
    // inside a workspace package.
    useEffect(() => {
      let cancelled = false;
      import('@excalidraw/excalidraw')
        .then((mod) => {
          if (!cancelled) setExcalidraw(() => mod.Excalidraw as unknown as ExcalidrawComponent);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []);

    // Capture initial data ONCE per sceneId. Re-creating it on every save
    // causes Excalidraw to re-apply initialData → updateScene → onChange →
    // save → new initialData → infinite loop that blocks drawing.
    if (mountedSceneId.current !== sceneId) {
      mountedSceneId.current = sceneId;
      mountedInitialData.current = initialScene ?? null;
      matrixStatesRef.current = (initialScene?.matrixStates as Record<string, MatrixState>) ?? {};
    }

    // Excalidraw ignores changes to the `initialData` prop after mount.
    // Once the API is available we explicitly restore files (binary rasters
    // for formulas/matrices/captures) and then the scene so saved strokes
    // AND images come back.
    useEffect(() => {
      if (!api || !mountedInitialData.current) return;
      const files = mountedInitialData.current.files;
      if (files && Object.keys(files).length > 0) {
        api.addFiles(
          Object.entries(files).map(([id, f]) => ({
            id,
            ...(f as { mimeType: string; dataURL: string; created: number }),
          })),
        );
      }
      api.updateScene({
        elements: mountedInitialData.current.elements,
        appState: mountedInitialData.current.appState,
        commit: true,
      });
    }, [api, sceneId]);

    // Progressive reveal: when presenting, elements with boardStep above the
    // frontier are projected hidden (opacity 0 + locked, opacity preserved).
    // Canonical restoration first keeps re-applying idempotent.
    useEffect(() => {
      if (!api) return;
      const canonical = canonicalElements(api.getSceneElements());
      const projected = state.presentationMode
        ? applyStepVisibility(canonical, currentStep)
        : canonical;
      api.updateScene({ elements: projected });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, state.presentationMode, currentStep]);

    const insertImageNow = useCallback(
      (dataUrl: string, opts: BoardInsertOpts = {}) => {
        if (!api) return;
        insertImageIntoApi(api, dataUrl, opts, (id, matrixState) => {
          if (matrixState) matrixStatesRef.current[id] = matrixState;
        }).catch((err) => {
          console.error('[blackboard] insertImage failed', err);
          void logEvent('insert-failed', String(err), {
            boardKind: opts.meta?.boardKind,
            sceneId,
          });
        });
      },
      [api],
    );

    const replaceImageNow = useCallback(
      (elementId: string, dataUrl: string, meta?: BoardElementMeta) => {
        if (!api) return;
        replaceImageIntoApi(api, elementId, dataUrl, meta).catch((err) => {
          console.error('[blackboard] replaceImage failed', err);
          void logEvent('replace-failed', String(err), { elementId });
        });
      },
      [api],
    );

    useImperativeHandle(ref, () => ({
      getScene: () => {
        if (!api) return Promise.resolve(null);
        const elements = stampBoardStep(canonicalElements(api.getSceneElements()), currentStep);
        const appState = api.getAppState();
        return Promise.resolve({
          version: SCHEMA_VERSIONS.scene,
          id: sceneId,
          moduleSlug: initialScene?.moduleSlug ?? state.moduleContext?.slug ?? '',
          elements,
          appState: pickAppState(appState),
          files: api.getFiles(),
          notes: initialScene?.notes ?? '',
          matrixStates: matrixStatesRef.current,
          currentStep,
          updatedAt: new Date().toISOString(),
        });
      },
      getImage: async () => {
        if (!api) return null;
        const { exportToBlob } = (await import('@excalidraw/excalidraw')) as unknown as {
          exportToBlob: (opts: {
            elements: readonly unknown[];
            appState: Record<string, unknown>;
            files: Record<string, unknown>;
            mimeType: string;
          }) => Promise<Blob>;
        };
        return exportToBlob({
          elements: api.getSceneElements(),
          appState: api.getAppState(),
          files: api.getFiles(),
          mimeType: 'image/png',
        });
      },
      clear: () => {
        api?.updateScene({ elements: [] });
      },
      flush: () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        persistSceneNow();
      },
      stampCurrentStep: (step: number) => {
        if (!api) return;
        const stamped = stampBoardStep(api.getSceneElements(), step);
        api.updateScene({ elements: stamped });
      },
      insertImage: (dataUrl, opts = {}) => {
        if (!api) {
          pendingInsertsRef.current.push({ dataUrl, opts });
          return;
        }
        insertImageNow(dataUrl, opts);
      },
      replaceImage: (elementId, dataUrl, meta) => {
        replaceImageNow(elementId, dataUrl, meta);
      },
    }));

    // Flush any inserts queued before Excalidraw finished loading.
    useEffect(() => {
      if (!api || pendingInsertsRef.current.length === 0) return;
      const pending = pendingInsertsRef.current.splice(0);
      for (const item of pending) {
        insertImageNow(item.dataUrl, item.opts);
      }
    }, [api, insertImageNow]);

    const persistSceneNow = useCallback(() => {
      const latest = latestChangeRef.current;
      // Only persist changes that belong to this scene. A debounced save
      // scheduled before a page switch must never write the new scene's
      // elements under the old sceneId.
      if (!latest || latest.sceneId !== sceneId) return;
      // Drain BEFORE building the scene: persistence must be idempotent.
      // Otherwise every save re-renders the parent (new scene object → new
      // persistSceneNow identity) and the unmount-flush effect below would
      // re-fire this same pending change forever — an infinite
      // save → dispatch → rerender → flush loop that freezes the page.
      latestChangeRef.current = null;
      const scene: BlackboardScene = {
        version: SCHEMA_VERSIONS.scene,
        id: sceneId,
        moduleSlug: state.moduleContext?.slug ?? initialScene?.moduleSlug ?? '',
        elements: stampBoardStep(canonicalElements(latest.elements), currentStep),
        appState: pickAppState(latest.appState),
        files: api?.getFiles() ?? {},
        notes: initialScene?.notes ?? '',
        matrixStates: matrixStatesRef.current,
        currentStep,
        updatedAt: new Date().toISOString(),
      };
      onChange?.(scene);
    }, [sceneId, initialScene, onChange, state.moduleContext, currentStep, api]);

    const handleChange = useCallback(
      (elements: readonly unknown[], appState: unknown) => {
        latestChangeRef.current = { sceneId, elements, appState };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(persistSceneNow, 400);
      },
      [persistSceneNow],
    );

    // The flush effect must be STABLE: persistSceneNow changes identity on
    // every save (its deps include initialScene/onChange objects), and a
    // re-running cleanup would flush on each choke point. Keep a ref to the
    // latest persister and mount this effect once.
    const persistSceneNowRef = useRef(persistSceneNow);
    useEffect(() => {
      persistSceneNowRef.current = persistSceneNow;
    }, [persistSceneNow]);

    // lastKnownGood: flush pending saves when the tab is hidden, closed or
    // this canvas unmounts — worst-case loss is the last <400 ms of strokes.
    useEffect(() => {
      const flush = () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        persistSceneNowRef.current();
      };
      const onVisibility = () => {
        if (document.visibilityState === 'hidden') flush();
      };
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', flush);
      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pagehide', flush);
        flush();
      };
    }, []);

    /**
     * Double-click on a technical element (math/matrix raster carrying
     * customData.boardKind) fires `board-element-edit` instead of letting
     * Excalidraw enter image-crop mode. Other elements keep native behavior
     * (double-click on text opens the text editor).
     */
    const handleDoubleClickCapture = useCallback(
      (e: React.MouseEvent) => {
        if (!api) return;
        const sel = api.getAppState().selectedElementIds as
          | Record<string, boolean>
          | undefined;
        const selId = sel ? Object.keys(sel).find((k) => sel[k]) : undefined;
        if (!selId) return;
        const el = api
          .getSceneElements()
          .find((x) => (x as { id?: string }).id === selId) as
          | { customData?: Record<string, unknown> }
          | undefined;
        const kind = (el?.customData as { boardKind?: string } | undefined)?.boardKind;
        if (kind === 'math' || kind === 'matrix') {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent('board-element-edit', {
              detail: { elementId: selId, customData: el?.customData },
            }),
          );
        }
      },
      [api],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        const dataUrl = e.dataTransfer.getData('text/plain');
        if (!dataUrl.startsWith('data:image/')) return;
        const captureId = e.dataTransfer.getData('capture/id');
        insertImageNow(dataUrl, {
          meta: captureId
            ? { boardKind: 'capture', boardId: captureId, payload: { captureId } }
            : undefined,
        });
      },
      [insertImageNow],
    );

    const initialData = mountedInitialData.current
      ? {
          elements: mountedInitialData.current.elements,
          appState: mountedInitialData.current.appState,
        }
      : undefined;

    return (
      <div
        ref={canvasRootRef}
        className={`relative isolate flex-1 overflow-hidden ${toolsMinimized ? 'bb-min-tools' : ''} ${propsMinimized ? 'bb-min-props' : ''}`}
        style={{ minHeight: 200 }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDoubleClickCapture={handleDoubleClickCapture}
      >
        <button
          type="button"
          onClick={() => {
            setToolsMinimized((v) => {
              try {
                localStorage.setItem('bb-tools-min', v ? '0' : '1');
              } catch {
                // private mode — keep it in memory only
              }
              return !v;
            });
          }}
          title={toolsMinimized ? 'Mostrar herramientas de dibujo' : 'Minimizar herramientas de dibujo (los atajos numerados siguen activos)'}
          aria-label={toolsMinimized ? 'Mostrar herramientas de dibujo' : 'Minimizar herramientas de dibujo'}
          aria-pressed={toolsMinimized}
          // Inline z-index: must sit above Excalidraw's toolbar/dropdown
          // regardless of Tailwind scanning coverage of this package.
          // Matches Excalidraw's large island buttons exactly: 40px square
          // (--lg-button-size), 12px top offset, 12px gap after the 40px
          // hamburger that starts 12px from the edge.
          style={{ zIndex: 9999 }}
          className="bb-chrome-btn absolute left-14 top-4 flex h-6 w-6 items-center justify-center text-base font-semibold leading-none"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {toolsMinimized ? (
              <><line x1="10" y1="4" x2="10" y2="16" /><line x1="4" y1="10" x2="16" y2="10" /></>
            ) : (
              <line x1="4" y1="10" x2="16" y2="10" />
            )}
          </svg>
        </button>
        {propsPanelVisible && !toolsMinimized ? (
        <button
          type="button"
          onClick={() =>
            setPropsMinimized((v) => {
              localStorage.setItem('bb-props-min', v ? '0' : '1');
              return !v;
            })
          }
          title={propsMinimized ? 'Mostrar propiedades de la herramienta (colores, trazo, opacidad)' : 'Minimizar propiedades de la herramienta'}
          aria-label={propsMinimized ? 'Mostrar propiedades de la herramienta' : 'Minimizar propiedades de la herramienta'}
          aria-pressed={propsMinimized}
          // The properties panel is 12.5rem wide, pinned to the left edge.
          // The toggle hugs its right border when expanded, and stays on the
          // left edge as a restore handle once collapsed.
          // Same 40px island-button metric, hugging the panel's right edge.
          style={{ zIndex: 9999, left: propsMinimized ? '0.75rem' : '13.25rem' }}
          className="bb-chrome-btn absolute top-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-base font-semibold leading-none"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            {propsMinimized ? (
              <><line x1="10" y1="4" x2="10" y2="16" /><line x1="4" y1="10" x2="16" y2="10" /></>
            ) : (
              <line x1="4" y1="10" x2="16" y2="10" />
            )}
          </svg>
        </button>
        ) : null}
        {Excalidraw ? (
          <Excalidraw
            theme={theme}
            initialData={initialData}
            onChange={handleChange}
            excalidrawAPI={setApi}
            UIOptions={{
              canvasActions: {
                saveToActiveFile: false,
                loadScene: false,
                export: false,
                toggleTheme: false,
                changeViewBackgroundColor: true,
              },
            }}
          />
        ) : (
          <BlackboardSkeleton />
        )}
        <SpotlightLayer />
      </div>
    );
  },
);

/**
 * Spotlight overlay. When armed (teacher clicked the spotlight button or pressed S) it captures
 * a pointer drag to define the focus rect — stored normalized (0..1 of the
 * canvas box) so it renders identically on other screens via broadcast.
 * When only `spotlight` is set, the mask is view-only (pointer-events: none).
 */
function SpotlightLayer() {
  const { state, dispatch } = useBlackboardContext();
  const boxRef = useRef<HTMLDivElement>(null);
  const draftStartRef = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const toNorm = (e: React.PointerEvent) => {
    const b = boxRef.current?.getBoundingClientRect();
    if (!b || b.width === 0 || b.height === 0) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)),
      y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)),
    };
  };

  if (!state.spotlightArmed && !state.spotlight && !draft) return null;
  const rect = state.spotlightArmed ? draft : state.spotlight;
  const armed = state.spotlightArmed;

  return (
    <div
      ref={boxRef}
      className={`absolute inset-0 z-30 ${armed ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={(e) => {
        if (!armed) return;
        const p = toNorm(e);
        if (!p) return;
        draftStartRef.current = p;
        setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const start = draftStartRef.current;
        if (!armed || !start) return;
        const p = toNorm(e);
        if (!p) return;
        setDraft({
          x: Math.min(start.x, p.x),
          y: Math.min(start.y, p.y),
          w: Math.abs(p.x - start.x),
          h: Math.abs(p.y - start.y),
        });
      }}
      onPointerUp={() => {
        if (!armed) return;
        const start = draftStartRef.current;
        draftStartRef.current = null;
        setDraft((d) => {
          if (d && d.w > 0.02 && d.h > 0.02) {
            dispatch({ type: 'SET_SPOTLIGHT', rect: d });
          } else if (!start) {
            // click without drag while a spotlight exists → clear it
            if (state.spotlight) dispatch({ type: 'SET_SPOTLIGHT', rect: null });
          }
          return null;
        });
        dispatch({ type: 'SET_SPOTLIGHT_ARMED', armed: false });
      }}
    >
      {rect && (
        <div
          className="absolute"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.w * 100}%`,
            height: `${rect.h * 100}%`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
            borderRadius: 4,
          }}
        />
      )}
    </div>
  );
}

async function insertImageIntoApi(
  api: ExcalidrawAPI,
  dataUrl: string,
  opts: BoardInsertOpts,
  onInsert: (elementId: string, matrixState?: MatrixState) => void,
) {
  const img = await loadImage(dataUrl);
  const max = 400;
  const naturalWidth = opts.width ?? img.naturalWidth;
  const naturalHeight = opts.height ?? img.naturalHeight;
  const scale = Math.min(1, max / Math.max(naturalWidth, naturalHeight));
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const fileId = makeExcalidrawId('file');
  const elId = makeExcalidrawId('el');

  const appState = api.getAppState();
  const viewportWidth = typeof appState.width === 'number' ? appState.width : 800;
  const viewportHeight = typeof appState.height === 'number' ? appState.height : 600;
  const scrollX = typeof appState.scrollX === 'number' ? appState.scrollX : 0;
  const scrollY = typeof appState.scrollY === 'number' ? appState.scrollY : 0;
  const zoom = typeof appState.zoom === 'number' ? appState.zoom : 1;
  const x = (viewportWidth / 2 - scrollX) / zoom;
  const y = (viewportHeight / 2 - scrollY) / zoom;

  api.addFiles([
    {
      mimeType: 'image/png',
      dataURL: dataUrl,
      id: fileId,
      created: Date.now(),
    },
  ]);

  // Insert a COMPLETE Excalidraw element: partial element objects crash the
  // renderer when it reads a missing field (angle, seed, scale, styles…).
  const element = {
    id: elId,
    type: 'image',
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    boundElements: [],
    isDeleted: false,
    link: null,
    locked: false,
    scale: [1, 1],
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: Date.now(),
    fileId,
    status: 'saved',
    // Source of truth for re-editing: the raster is visual only.
    customData: opts.meta
      ? {
          boardKind: opts.meta.boardKind,
          boardId: opts.meta.boardId ?? elId,
          payload: opts.meta.payload,
          rasterDpr: opts.meta.rasterDpr ?? 2,
        }
      : undefined,
  };

  api.updateScene({
    elements: [...api.getSceneElements(), element],
  });

  onInsert(elId, opts.matrixState ? { ...opts.matrixState, elementId: elId } : undefined);
}

/**
 * Replaces an element's raster while preserving position, width and
 * structured customData (merged when a new meta is provided). Used by the
 * re-edit flow: editor commit → regenerate PNG → swap fileId.
 */
async function replaceImageIntoApi(
  api: ExcalidrawAPI,
  elementId: string,
  dataUrl: string,
  meta?: BoardElementMeta,
) {
  const img = await loadImage(dataUrl);
  const fileId = makeExcalidrawId('file');

  api.addFiles([
    {
      mimeType: 'image/png',
      dataURL: dataUrl,
      id: fileId,
      created: Date.now(),
    },
  ]);

  const elements = api.getSceneElements().map((raw) => {
    const el = raw as {
      id?: string;
      width?: number;
      customData?: Record<string, unknown>;
      version?: number;
      versionNonce?: number;
      status?: string;
    };
    if (el.id !== elementId) return raw;
    const width = el.width ?? img.naturalWidth;
    const height = width * (img.naturalHeight / Math.max(1, img.naturalWidth));
    return {
      ...el,
      fileId,
      height,
      status: 'saved',
      version: (el.version ?? 0) + 1,
      versionNonce: (el.versionNonce ?? 0) + 1,
      customData: meta ? { ...(el.customData ?? {}), ...meta } : el.customData,
    };
  });
  api.updateScene({ elements });
}

function pickAppState(appState: unknown): Record<string, unknown> {
  const typed = appState as Record<string, unknown> | undefined;
  const out: Record<string, unknown> = {};
  for (const key of PERSISTED_APPSTATE_KEYS) {
    if (typed?.[key] !== undefined) out[key] = typed[key];
  }
  return out;
}

let idCounter = 0;

function makeExcalidrawId(prefix: string): string {
  const suffix =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : `${++idCounter}`;
  return `${prefix}-${Date.now()}-${suffix}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
