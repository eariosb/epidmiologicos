import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  BlackboardProvider,
  MemoryStorageProvider,
  useBlackboardContext,
  SCHEMA_VERSIONS,
  type BlackboardScene,
} from '@cursos/blackboard';
import { PageNav } from './PageNav';
import { useEffect, type RefObject } from 'react';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

const makeScene = (id: string, slug: string, ts: number): BlackboardScene => ({
  version: SCHEMA_VERSIONS.scene,
  id,
  moduleSlug: slug,
  elements: [],
  appState: {},
  notes: '',
  matrixStates: {},
  currentStep: 0,
  updatedAt: new Date(ts).toISOString(),
});

const canvasRef = {
  current: {
    flush: vi.fn(),
    getScene: vi.fn(async () => null),
  },
} as unknown as RefObject<BlackboardCanvasRef | null> & {
  current: { flush: import("vitest").Mock; getScene: import("vitest").Mock };
};

function Seed({
  scenes,
  active,
  moduleSlug,
}: {
  scenes: BlackboardScene[];
  active: string;
  moduleSlug?: string;
}) {
  const { dispatch } = useBlackboardContext();
  useEffect(() => {
    if (moduleSlug) {
      dispatch({
        type: 'SET_MODULE_CONTEXT',
        context: { slug: moduleSlug, title: moduleSlug, objective: [], datasets: [], order: 1 },
      });
    }
    for (const s of scenes) dispatch({ type: 'UPSERT_SCENE', scene: s });
    dispatch({ type: 'SELECT_SCENE', id: active });
  }, [dispatch, scenes, active, moduleSlug]);
  return null;
}

async function setup(
  scenes: BlackboardScene[],
  active: string,
  opts: { storage?: MemoryStorageProvider; moduleSlug?: string } = {},
) {
  const storage = opts.storage ?? new MemoryStorageProvider();
  for (const s of scenes) await storage.saveScene(s);
  await act(async () => {
    render(
      <BlackboardProvider storage={storage}>
        <Seed scenes={scenes} active={active} moduleSlug={opts.moduleSlug} />
        <PageNav canvasRef={canvasRef} />
      </BlackboardProvider>,
    );
  });
  return storage;
}

describe('PageNav', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the current page counter and navigates forward', async () => {
    await setup([makeScene('p1', 'm1', 1000), makeScene('p2', 'm1', 2000)], 'p1');
    expect(screen.getByText('1/2')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Página siguiente de la pizarra'));
    });
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(canvasRef.current.flush).toHaveBeenCalled();
  });

  it('disables prev/next at the list bounds', async () => {
    await setup([makeScene('p1', 'm1', 1000)], 'p1');
    expect(screen.getByLabelText('Página anterior de la pizarra')).toBeDisabled();
    expect(screen.getByLabelText('Página siguiente de la pizarra')).toBeDisabled();
  });

  it('creates a new page, selects it and flushes the current one first', async () => {
    const storage = await setup(
      [makeScene('blackboard/m1', 'm1', 1000)],
      'blackboard/m1',
      { moduleSlug: 'm1' },
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Nueva página de pizarra'));
    });
    expect(canvasRef.current.flush).toHaveBeenCalled();
    expect(screen.getByText('2/2')).toBeInTheDocument();
    // The new scene was persisted under the module slug.
    const stored = await storage.listScenes('m1');
    expect(stored).toHaveLength(2);
    expect(stored.map((s) => s.id)).toContainEqual(expect.stringMatching(/^blackboard\/m1\//));
  });

  it('scopes the page list to the module when a context exists', async () => {
    await setup(
      [makeScene('p1', 'm1', 1000), makeScene('p2', 'm2', 2000)],
      'p1',
      { moduleSlug: 'm1' },
    );
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('deletes the current page and falls back to a neighbor', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const storage = await setup(
      [makeScene('p1', 'm1', 1000), makeScene('p2', 'm1', 2000)],
      'p2',
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Eliminar página actual'));
    });
    expect(await storage.getScene('p2')).toBeNull();
    expect(screen.getByText('1/1')).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('lists all scenes when no module context is present', async () => {
    await setup([makeScene('p1', 'm1', 1000), makeScene('p2', 'm2', 2000)], 'p1');
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });
});
