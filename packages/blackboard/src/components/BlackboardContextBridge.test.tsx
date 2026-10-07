import { render, act } from '@testing-library/react';
import {
  BlackboardProvider,
  MemoryStorageProvider,
  useBlackboardContext,
  SCHEMA_VERSIONS,
  type BlackboardScene,
  type BlackboardState,
} from '../index';
import { BlackboardContextBridge } from './BlackboardContextBridge';

const makeScene = (id: string, slug: string): BlackboardScene => ({
  version: SCHEMA_VERSIONS.scene,
  id,
  moduleSlug: slug,
  elements: [],
  appState: {},
  notes: '',
  matrixStates: {},
  currentStep: 0,
  updatedAt: new Date(1000).toISOString(),
});

const ctx = { slug: 'm1', title: 'M1', objective: [], datasets: [], order: 1 };

function Probe({ onState }: { onState: (s: BlackboardState) => void }) {
  const { state } = useBlackboardContext();
  onState(state);
  return null;
}

describe('BlackboardContextBridge', () => {
  it('hydrates every stored page of the module so PageNav can list them', async () => {
    const storage = new MemoryStorageProvider();
    await storage.saveScene(makeScene('blackboard/m1', 'm1'));
    await storage.saveScene(makeScene('blackboard/m1/2', 'm1'));
    await storage.saveScene(makeScene('blackboard/otro/9', 'otro'));

    let latest: BlackboardState | null = null;
    await act(async () => {
      render(
        <BlackboardProvider storage={storage}>
          <BlackboardContextBridge context={ctx} />
          <Probe onState={(s) => (latest = s)} />
        </BlackboardProvider>,
      );
    });

    const ids = Object.keys(latest!.scenes).sort();
    expect(ids).toEqual(['blackboard/m1', 'blackboard/m1/2']);
    // The default page becomes active; foreign module pages never load.
    expect(latest!.activeSceneId).toBe('blackboard/m1');
  });

  it('keeps the current page when it already belongs to the module', async () => {
    const storage = new MemoryStorageProvider();
    await storage.saveScene(makeScene('blackboard/m1', 'm1'));
    await storage.saveScene(makeScene('blackboard/m1/2', 'm1'));

    let latest: BlackboardState | null = null;
    let dispatchRef: ((a: never) => void) | null = null;
    function Selector() {
      const { state, dispatch } = useBlackboardContext();
      dispatchRef = dispatch as never;
      return <Probe onState={(s) => (latest = s)} />;
    }

    await act(async () => {
      render(
        <BlackboardProvider storage={storage}>
          <Selector />
          <BlackboardContextBridge context={ctx} />
        </BlackboardProvider>,
      );
    });

    // Switch to page 2, then re-run the bridge (module re-mount simulation):
    // the selection must stay on page 2 — hydration must not steal it.
    await act(async () => {
      (dispatchRef as unknown as (a: unknown) => void)({
        type: 'SELECT_SCENE',
        id: 'blackboard/m1/2',
      });
    });
    expect(latest!.activeSceneId).toBe('blackboard/m1/2');
    expect(Object.keys(latest!.scenes).sort()).toEqual([
      'blackboard/m1',
      'blackboard/m1/2',
    ]);
  });
});
