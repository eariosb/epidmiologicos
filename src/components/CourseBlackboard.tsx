'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, ChevronRight, GraduationCap, Presentation, Sparkles, X } from 'lucide-react';
import {
  BlackboardPanel,
  BlackboardToolbar,
  BlackboardCanvas,
  BlackboardAssistant,
  useBlackboardScene,
  useBlackboardContext,
  usePresentation,
} from '@cursos/blackboard';
import type { BlackboardCanvasRef } from '@cursos/blackboard';
import { RCell } from './RCell';
import { SessionToolbar } from './SessionToolbar';
import type { ModuleBlock, ModuleNavItem } from './ModulesMenu';
import { ShortcutsHelp } from './ShortcutsHelp';
import { ToolsDrawer, TOOL_TABS, type ToolTabId } from './ToolsDrawer';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PresentationControls } from './PresentationControls';
import { PresentationSync } from './PresentationSync';
import { AssistantContextBridge } from './AssistantContextBridge';
import { ElementEditor, type EditTarget } from './ElementEditor';
import { PageNav } from './PageNav';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useBroadcast } from '@/hooks/useBroadcast';
import { drainPendingInserts, type SendToBlackboardDetail } from '@/lib/send-to-blackboard';
import { getActiveSession, setSessionActiveScene } from '@/lib/session-store';

const AUX_PANELS_KEY = 'bb-aux-panels';

function readAuxPanelState(): {
  assistantOpen: boolean;
  toolTab: ToolTabId;
  toolDrawerOpen: boolean;
} {
  const fallback = { assistantOpen: false, toolTab: 'capturas' as ToolTabId, toolDrawerOpen: false };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(AUX_PANELS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<typeof fallback>;
    return {
      assistantOpen: !!parsed.assistantOpen,
      toolTab: TOOL_TABS.some((t) => t.id === parsed.toolTab) ? (parsed.toolTab as ToolTabId) : 'capturas',
      toolDrawerOpen: !!parsed.toolDrawerOpen,
    };
  } catch {
    return fallback;
  }
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return (
    t.tagName === 'INPUT' ||
    t.tagName === 'TEXTAREA' ||
    t.isContentEditable ||
    t.closest('.cm-editor') !== null
  );
}

/**
 * Course-specific blackboard wrapper.
 *
 * Layout: toolbar + session bar + tools strip at top, then the Excalidraw
 * canvas (ALWAYS mounted so insertImage and drag & drop keep working while
 * the professor browses resource tabs), a pages strip, the AI assistant and
 * a collapsible bottom drawer with captures, formulas, matrices, notes,
 * student questions and the model comparator.
 *
 * In presentation mode the chrome is hidden (CSS only — nothing unmounts)
 * and arrow keys drive the progressive reveal frontier.
 */
export function CourseBlackboard({
  modules,
  blocks,
}: {
  modules: ModuleNavItem[];
  blocks: readonly ModuleBlock[];
}) {
  const canvasRef = useRef<BlackboardCanvasRef>(null);
  const { state, dispatch } = useBlackboardContext();
  const { activeScene, saveScene, loadScene } = useBlackboardScene();
  const { presentationMode, currentStep, nextStep, prevStep, setPresentation } =
    usePresentation();
  const { mode, setTeacherMode, setStudentMode } = useBroadcast();
  const [scratchCode, setScratchCode] = useState<string | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  // Auxiliary panels collapse to slim strips; the canvas owns the space.
  // Their open/closed state persists across sessions.
  const aux = readAuxPanelState();
  const [assistantOpen, setAssistantOpen] = useState(aux.assistantOpen);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [toolTab, setToolTab] = useState<ToolTabId>(aux.toolTab);
  const [toolDrawerOpen, setToolDrawerOpen] = useState(aux.toolDrawerOpen);
  useChatPersistence();

  useEffect(() => {
    localStorage.setItem(AUX_PANELS_KEY, JSON.stringify({ assistantOpen, toolTab, toolDrawerOpen }));
  }, [assistantOpen, toolTab, toolDrawerOpen]);

  const sceneId = activeScene?.id ?? 'default';
  const spotlightArmed = state.spotlightArmed;

  // Pointer mode (touch board / IR pen): enlarge panel targets via a class
  // on <html> so the CSS applies regardless of the panel subtree.
  useEffect(() => {
    document.documentElement.classList.toggle('bb-pointer', !!state.settings.pointerMode);
    return () => document.documentElement.classList.remove('bb-pointer');
  }, [state.settings.pointerMode]);

  useEffect(() => {
    const resolve = () => {
      if (state.settings.theme === 'dark') setResolvedTheme('dark');
      else if (state.settings.theme === 'light') setResolvedTheme('light');
      else setResolvedTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    };
    resolve();
    if (state.settings.theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', resolve);
      return () => media.removeEventListener('change', resolve);
    }
  }, [state.settings.theme]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as SendToBlackboardDetail;
      detail.handled = true;
      canvasRef.current?.insertImage(detail.dataUrl, detail.opts ?? {});
    };
    window.addEventListener('send-to-blackboard', handler);
    const editHandler = (e: Event) => {
      const { elementId, customData } = (e as CustomEvent).detail as {
        elementId: string;
        customData?: { boardKind?: string; payload?: Record<string, unknown> };
      };
      const kind = customData?.boardKind;
      if (kind === 'math' || kind === 'matrix') {
        setEditTarget({ elementId, boardKind: kind, payload: customData?.payload ?? {} });
      }
    };
    window.addEventListener('board-element-edit', editHandler);
    // Drain inserts queued while the panel was closed.
    for (const item of drainPendingInserts()) {
      canvasRef.current?.insertImage(item.dataUrl, item.opts ?? {});
    }
    return () => {
      window.removeEventListener('send-to-blackboard', handler);
      window.removeEventListener('board-element-edit', editHandler);
    };
  }, []);

  // Remember which board page the class was on: the session record carries
  // activeSceneId so resuming restores the exact page.
  useEffect(() => {
    if (!state.activeSceneId) return;
    void setSessionActiveScene(state.activeSceneId);
  }, [state.activeSceneId]);

  // On mount, resume the board page recorded in the session — but only when
  // it belongs to the current module (never jump to another module's page).
  const restoredSceneRef = useRef(false);
  useEffect(() => {
    if (restoredSceneRef.current) return;
    restoredSceneRef.current = true;
    void (async () => {
      try {
        const session = await getActiveSession();
        const target = session?.activeSceneId;
        if (!target || target === state.activeSceneId) return;
        const slug = state.moduleContext?.slug;
        if (slug && !target.startsWith(`blackboard/${slug}`)) return;
        await loadScene(target);
        dispatch({ type: 'SELECT_SCENE', id: target });
      } catch (err) {
        console.error('[blackboard] session scene restore failed', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presentation keyboard controls. Arrow keys override Excalidraw's nudge
  // only while presenting; typing inside inputs/editors is never hijacked.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'p' || e.key === 'P') {
        setPresentation(!presentationMode);
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        dispatch({ type: 'SET_SPOTLIGHT_ARMED', armed: !spotlightArmed });
        return;
      }
      if (e.key === 'Escape') {
        if (spotlightArmed) dispatch({ type: 'SET_SPOTLIGHT_ARMED', armed: false });
        else if (state.spotlight) dispatch({ type: 'SET_SPOTLIGHT', rect: null });
        else if (presentationMode) setPresentation(false);
        return;
      }
      if (!presentationMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        canvasRef.current?.stampCurrentStep(currentStep);
        nextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        canvasRef.current?.stampCurrentStep(currentStep);
        prevStep();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presentationMode, currentStep, spotlightArmed, state.spotlight, nextStep, prevStep, setPresentation, dispatch]);

  return (
    <BlackboardPanel>
      <div className="flex h-full flex-col bg-white dark:bg-ink-900">
        {!presentationMode && (
          <PanelErrorBoundary name="toolbar">
            <SessionToolbar canvasRef={canvasRef} modules={modules} blocks={blocks} />
          </PanelErrorBoundary>
        )}
        {presentationMode && (
          <div className="border-b border-ink-200 bg-white px-2 py-1 dark:bg-ink-900 dark:border-ink-700">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-700 dark:text-ink-200">
                Presentando: → revelar, ← retroceder, Esc salir
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <PresentationControls canvasRef={canvasRef} />
              </div>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          {!presentationMode && (
            <nav
              aria-label="Menú de herramientas"
              className="flex w-11 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-ink-200 bg-ink-50 py-1.5 dark:border-ink-700 dark:bg-ink-800"
            >
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('start-capture'))}
                title="Capturar región de la pantalla (Ctrl+Shift+S)"
                aria-label="Capturar región de la pantalla"
                className="rounded p-1.5 text-sm text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
              >
                <Camera aria-hidden className="h-4 w-4" />
              </button>
              <span className="my-0.5 h-px w-6 bg-ink-200 dark:bg-ink-600" />
              <PageNav canvasRef={canvasRef} />
              <span className="my-0.5 h-px w-6 bg-ink-200 dark:bg-ink-600" />
              {TOOL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (toolDrawerOpen && toolTab === tab.id) {
                      setToolDrawerOpen(false);
                    } else {
                      setToolTab(tab.id);
                      setToolDrawerOpen(true);
                    }
                  }}
                  aria-pressed={toolDrawerOpen && toolTab === tab.id}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`rounded p-1.5 text-sm transition-colors ${
                    toolDrawerOpen && toolTab === tab.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-700'
                  }`}
                >
                  <tab.Icon aria-hidden className="h-4 w-4" />
                </button>
              ))}
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <PanelErrorBoundary name="canvas">
              <BlackboardCanvas
              ref={canvasRef}
              sceneId={sceneId}
              initialScene={activeScene}
              onChange={saveScene}
              theme={resolvedTheme}
            />
          </PanelErrorBoundary>
          {!presentationMode && (
            <>
              <PanelErrorBoundary name="assistant">
                <div className="border-t border-ink-200 dark:border-ink-700">
                  <button
                    type="button"
                    onClick={() => {
                      setAssistantOpen((v) => !v);
                      setLastSeenCount(state.llmMessages.length);
                    }}
                    className="flex w-full items-center gap-2 bg-ink-50 px-3 py-1.5 text-[11px] font-medium text-ink-600 hover:bg-ink-100 dark:bg-ink-800 dark:text-ink-300"
                  >
                    {assistantOpen ? (
                      <ChevronDown aria-hidden className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight aria-hidden className="h-3.5 w-3.5" />
                    )}
                    <span className="flex items-center gap-1.5">
                      <Sparkles aria-hidden className="h-3.5 w-3.5" />
                      Asistente
                    </span>
                    {state.llmStatus === 'streaming' && (
                      <span className="text-brand-500">● generando…</span>
                    )}
                    {!assistantOpen &&
                      state.llmMessages.length - lastSeenCount > 0 && (
                        <span className="rounded-full bg-brand-100 px-1.5 text-brand-700">
                          {state.llmMessages.length - lastSeenCount} nuevos
                        </span>
                      )}
                    <span className="ml-auto text-ink-400">Preguntar · Explicar · Generar R · Graficar</span>
                  </button>
                  <div className={assistantOpen ? '' : 'hidden'}>
                    <BlackboardAssistant onExecuteR={setScratchCode} />
                  </div>
                </div>
              </PanelErrorBoundary>
              <PanelErrorBoundary name="tools">
                <ToolsDrawer canvasRef={canvasRef} active={toolTab} open={toolDrawerOpen} />
              </PanelErrorBoundary>
            </>
          )}
          </div>
          {!presentationMode && (
            <nav
              aria-label="Controles de la pizarra"
              className="flex w-11 shrink-0 flex-col items-center gap-1 overflow-y-auto border-l border-ink-200 bg-ink-50 py-1.5 dark:border-ink-700 dark:bg-ink-800"
            >
              <BlackboardToolbar canvasRef={canvasRef} vertical />
              <span className="my-0.5 h-px w-6 bg-ink-200 dark:bg-ink-600" />
              <PresentationControls canvasRef={canvasRef} vertical />
              <span className="my-0.5 h-px w-6 bg-ink-200 dark:bg-ink-600" />
              <ShortcutsHelp />
              <button
                type="button"
                onClick={() => (mode === 'teacher' ? setStudentMode() : setTeacherMode())}
                title={mode === 'teacher' ? 'Modo docente; clic para estudiante' : 'Modo estudiante; clic para docente'}
                aria-label="Cambiar modo docente/estudiante"
                aria-pressed={mode === 'teacher'}
                className={`rounded p-1.5 text-sm transition-colors ${
                  mode === 'teacher'
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-700'
                }`}
              >
                {mode === 'teacher' ? (
                  <Presentation aria-hidden className="h-4 w-4" />
                ) : (
                  <GraduationCap aria-hidden className="h-4 w-4" />
                )}
              </button>
              <span className="my-0.5 h-px w-6 bg-ink-200 dark:bg-ink-600" />
              <button
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_PANEL' })}
                title="Cerrar pizarra (Ctrl+Shift+B)"
                aria-label="Cerrar pizarra"
                className="rounded p-1.5 text-sm text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-700"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>

        {scratchCode !== null && !presentationMode && (
          <div className="border-t border-ink-200">
            <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-3 py-1.5">
              <span className="text-xs font-medium text-ink-700">Sandbox R</span>
              <button
                type="button"
                onClick={() => setScratchCode(null)}
                className="text-xs text-ink-500 hover:text-danger-600"
              >
                Cerrar
              </button>
            </div>
            <RCell id="blackboard-sandbox" code={scratchCode} title="Código generado por la pizarra" />
          </div>
        )}
      </div>
      <PresentationSync />
      <AssistantContextBridge canvasRef={canvasRef} />
      {editTarget && (
        <ElementEditor
          target={editTarget}
          canvasRef={canvasRef}
          onClose={() => setEditTarget(null)}
        />
      )}
    </BlackboardPanel>
  );
}

