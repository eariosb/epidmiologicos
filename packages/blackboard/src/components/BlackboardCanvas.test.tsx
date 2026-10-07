/**
 * Regression: a debounced save scheduled on page A must never write page B's
 * elements under page A's sceneId (and vice versa). The guard tags every
 * pending change with its sceneId; this suite mounts the real canvas with a
 * fake Excalidraw API to exercise it.
 */
import { act, render, waitFor } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { BlackboardProvider } from '../lib/context';
import { MemoryStorageProvider } from '../lib/storage/memory';
import { BlackboardCanvas, type BlackboardCanvasRef } from './BlackboardCanvas';
import type { BlackboardScene } from '../types/blackboard';

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

function simulateEdit(elements: unknown[]) {
  (api.props.onChange as (e: unknown[], s: unknown) => void)(elements, {});
}

interface MountResult {
  ref: RefObject<BlackboardCanvasRef | null>;
  onChange: import("vitest").Mock<(s: BlackboardScene) => void>;
  rerender: (sceneId: string) => void;
}

async function mount(sceneId: string): Promise<MountResult> {
  const storage = new MemoryStorageProvider();
  const ref = createRef<BlackboardCanvasRef>();
  const onChange = vi.fn<(s: BlackboardScene) => void>();
  const tree = (sid: string) => (
    <BlackboardProvider storage={storage}>
      <BlackboardCanvas ref={ref} sceneId={sid} onChange={onChange} />
    </BlackboardProvider>
  );
  const utils = render(tree(sceneId));
  // Let the dynamic import() of the mocked module resolve and mount the fake.
  await act(async () => {});
  await waitFor(() => expect(api.props.onChange).toBeDefined());
  return {
    ref,
    onChange,
    rerender: (sid) => utils.rerender(tree(sid)),
  };
}

describe('BlackboardCanvas cross-scene save guard', () => {
  beforeEach(() => {
    api.elements = [];
    api.appState = {};
    api.files = {};
    api.props = {};
    // shouldAdvanceTime: waitFor()/async effects inside mount() need real
    // ticks; the debounce assertions still use explicit advanceTimersByTime.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists changes for the current scene after the debounce', async () => {
    const { onChange } = await mount('s1');
    act(() => simulateEdit([{ id: 'e1', type: 'line' }]));
    act(() => vi.advanceTimersByTime(500));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].id).toBe('s1');
    expect(onChange.mock.calls[0][0].elements).toHaveLength(1);
  });

  it('never persists elements under the wrong sceneId on page switch', async () => {
    const { ref, onChange, rerender } = await mount('s1');
    act(() => simulateEdit([{ id: 'old-stroke', type: 'line' }]));
    // Page switch: the same mounted canvas now shows s2 while s1's debounced
    // save is still pending. flush() runs the CURRENT closure (s2), which
    // must reject the s1-tagged pending change. The unmount-flush effect
    // may still write the s1 change — under s1, which is correct.
    act(() => rerender('s2'));
    act(() => ref.current?.flush());
    for (const [scene] of onChange.mock.calls) {
      expect(scene.id).toBe('s1');
      expect(
        (scene.elements as { id: string }[]).every((el) => el.id === 'old-stroke'),
      ).toBe(true);
    }
    // Now an edit on s2 must land under s2, never under s1.
    act(() => simulateEdit([{ id: 'new-stroke', type: 'line' }]));
    act(() => vi.advanceTimersByTime(500));
    const s2Calls = onChange.mock.calls.filter(([s]) => s.id === 's2');
    expect(s2Calls).toHaveLength(1);
    expect((s2Calls[0][0].elements as { id: string }[])[0].id).toBe('new-stroke');
  });

  it('includes binary files in the persisted scene', async () => {
    const { onChange } = await mount('s1');
    api.files['file-1'] = { mimeType: 'image/png', dataURL: 'data:image/png;base64,x' };
    act(() => simulateEdit([{ id: 'img1', type: 'image', fileId: 'file-1' }]));
    act(() => vi.advanceTimersByTime(500));
    expect(onChange.mock.calls[0][0].files?.['file-1']).toMatchObject({
      mimeType: 'image/png',
    });
  });
});
