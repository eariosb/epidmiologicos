/**
 * End-to-end page flow, wired exactly like CourseBlackboard:
 * Provider + ContextBridge + PageNav + BlackboardCanvas, with the Excalidraw
 * component stubbed by a faithful store-backed fake whose updateScene FIRES
 * onChange (the real component does on every commit — earlier unit mocks
 * skipped that, hiding integration bugs).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import {
  BlackboardProvider,
  MemoryStorageProvider,
  useBlackboardScene,
  BlackboardContextBridge,
  type BlackboardCanvasRef,
  type BlackboardScene,
} from '@cursos/blackboard';
import { BlackboardCanvas } from '../../packages/blackboard/src/components/BlackboardCanvas';
import { PageNav } from './PageNav';

interface FakeApi {
  elements: unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
  props: Record<string, unknown>;
  getSceneElements(): unknown[];
  getAppState(): Record<string, unknown>;
  getFiles(): Record<string, unknown>;
  addFiles(f: { mimeType: string; dataURL: string; id: string; created: number }[]): void;
  updateScene(s: { elements?: readonly unknown[]; appState?: Record<string, unknown> }): void;
}

vi.mock('@excalidraw/excalidraw', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const api: FakeApi = {
    elements: [],
    appState: {},
    files: {},
    props: {},
    getSceneElements() {
      return this.elements;
    },
    getAppState() {
      return this.appState;
    },
    getFiles() {
      return this.files;
    },
    addFiles(f) {
      for (const file of f) {
        this.files[file.id] = file;
      }
    },
    updateScene(s) {
      if (s.elements) this.elements = [...s.elements];
      if (s.appState) this.appState = { ...this.appState, ...s.appState };
      // Faithful to Excalidraw: programmatic scene updates emit onChange.
      const onChange = api.props?.onChange as
        | ((e: unknown[], s: Record<string, unknown>) => void)
        | undefined;
      if (onChange) {
        queueMicrotask(() => {
          const cb = api.props?.onChange as typeof onChange;
          cb?.([...api.elements], api.appState);
        });
      }
    },
  };
  return {
    __api: api,
    Excalidraw: (props: Record<string, unknown>) => {
      api.props = props;
      React.useEffect(() => {
        (props.excalidrawAPI as (a: unknown) => void)(api);
      });
      return React.createElement('div', { 'data-testid': 'fake-excalidraw' });
    },
  };
});

const { __api: api } = (await vi.importMock<{ __api: FakeApi }>('@excalidraw/excalidraw')) as unknown as { __api: FakeApi };

/** Paint strokes like Excalidraw really does: internal state first, then onChange. */
function draw(elements: unknown[]) {
  api.elements = [...elements];
  (api.props.onChange as (e: unknown[], s: unknown) => void)(api.elements, api.appState);
}

/** Harness replicating CourseBlackboard's wiring (sceneId/activeScene/onChange). */
function Harness() {
  const canvasRef = createRef<BlackboardCanvasRef>();
  const { activeScene, saveScene } = useBlackboardScene();
  const sceneId = activeScene?.id ?? 'default';
  return (
    <>
      <PageNav canvasRef={canvasRef as React.RefObject<BlackboardCanvasRef | null>} />
      <BlackboardCanvas
        ref={canvasRef}
        sceneId={sceneId}
        initialScene={activeScene}
        onChange={saveScene}
      />
    </>
  );
}

const CTX = { slug: 'm1', title: 'M1', objective: [], datasets: [], order: 1 };

describe('course blackboard page flow (integration)', () => {
  let storage: MemoryStorageProvider;

  beforeEach(() => {
    api.elements = [];
    api.appState = {};
    api.files = {};
    api.props = {};
    storage = new MemoryStorageProvider();
  });

  async function boot() {
    const utils = render(
      <BlackboardProvider storage={storage}>
        <BlackboardContextBridge context={CTX} />
        <Harness />
      </BlackboardProvider>,
    );
    // Bridge bootstrap + dynamic import of the fake Excalidraw.
    await act(async () => {});
    await waitFor(() => expect(api.props.onChange).toBeDefined());
    await waitFor(() => expect(screen.getByText(/1\/1/)).toBeInTheDocument());
    return utils;
  }

  it('creates pages, switches canvases, navigates and deletes', async () => {
    await boot();

    // Draw one stroke on page 1.
    act(() => {
      draw([{ id: 'stroke-A', type: 'line' }]);
    });

    // "+" → page 2 must exist, be selected, and show an EMPTY canvas.
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Nueva página de pizarra'));
    });
    expect(await screen.findByText('2/2')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (api.elements as { id: string }[]).some((el) => el.id === 'stroke-A'),
      ).toBe(false),
    );

    // Draw on page 2.
    act(() => {
      draw([{ id: 'stroke-B', type: 'line' }]);
    });

    // ‹ back to page 1 → its stroke must reappear.
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Página anterior de la pizarra'));
    });
    expect(await screen.findByText('1/2')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (api.elements as { id: string }[]).some((el) => el.id === 'stroke-A'),
      ).toBe(true),
    );

    // › forward to page 2 → page 2's stroke.
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Página siguiente de la pizarra'));
    });
    expect(await screen.findByText('2/2')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (api.elements as { id: string }[]).some((el) => el.id === 'stroke-B'),
      ).toBe(true),
    );

    // 🗑 delete page 2 → falls back to page 1 with its stroke.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Eliminar página actual'));
    });
    expect(await screen.findByText('1/1')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (api.elements as { id: string }[]).some((el) => el.id === 'stroke-A'),
      ).toBe(true),
    );
    const remaining = await storage.listScenes('m1');
    expect(remaining).toHaveLength(1);
  });

  it('persists created pages across remounts (reload simulation)', async () => {
    const first = await boot();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Nueva página de pizarra'));
    });
    expect(await screen.findByText('2/2')).toBeInTheDocument();
    first.unmount();

    // Reload simulation: fresh provider + bridge over the SAME storage.
    api.elements = [];
    api.props = {};
    render(
      <BlackboardProvider storage={storage}>
        <BlackboardContextBridge context={CTX} />
        <Harness />
      </BlackboardProvider>,
    );
    await act(async () => {});
    await waitFor(() => expect(api.props.onChange).toBeDefined());
    // The bridge hydration must surface BOTH stored pages in PageNav.
    await waitFor(() => expect(screen.getByText(/\/2$/)).toBeInTheDocument());
  });
});
