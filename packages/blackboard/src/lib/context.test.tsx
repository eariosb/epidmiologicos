import { renderHook, act } from '@testing-library/react';
import { BlackboardProvider, useBlackboardContext } from './context';
import { SCHEMA_VERSIONS } from './persistence/version';
import type { BlackboardScene } from '../types/blackboard';

function wrapper({ children }: { children: React.ReactNode }) {
  return <BlackboardProvider>{children}</BlackboardProvider>;
}

describe('BlackboardProvider', () => {
  it('initializes with closed panel and default settings', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.settings.llmProvider).toBe('none');
  });

  it('toggles panel', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    act(() => result.current.dispatch({ type: 'TOGGLE_PANEL' }));
    expect(result.current.state.isOpen).toBe(true);
    act(() => result.current.dispatch({ type: 'TOGGLE_PANEL' }));
    expect(result.current.state.isOpen).toBe(false);
  });

  it('sets panel open/closed', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    act(() => result.current.dispatch({ type: 'SET_PANEL', isOpen: true }));
    expect(result.current.state.isOpen).toBe(true);
    act(() => result.current.dispatch({ type: 'SET_PANEL', isOpen: false }));
    expect(result.current.state.isOpen).toBe(false);
  });

  it('toggles fullscreen', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    act(() => result.current.dispatch({ type: 'TOGGLE_FULLSCREEN' }));
    expect(result.current.state.isFullscreen).toBe(true);
  });

  it('upserts and deletes scenes', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    const scene: BlackboardScene = {
      version: SCHEMA_VERSIONS.scene,
      id: 'test-scene',
      moduleSlug: 'mod1',
      elements: [],
      appState: {},
      notes: '',
      matrixStates: {},
      currentStep: 0,
      updatedAt: new Date().toISOString(),
    };
    act(() => result.current.dispatch({ type: 'UPSERT_SCENE', scene }));
    expect(result.current.state.scenes['test-scene']).toBeDefined();
    expect(result.current.state.activeSceneId).toBe('test-scene');
    act(() => result.current.dispatch({ type: 'DELETE_SCENE', id: 'test-scene' }));
    expect(result.current.state.scenes['test-scene']).toBeUndefined();
    expect(result.current.state.activeSceneId).toBeNull();
  });

  it('appends and clears LLM messages', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    const message = {
      id: 'm1',
      role: 'user' as const,
      content: 'Hola',
      createdAt: new Date().toISOString(),
    };
    act(() => result.current.dispatch({ type: 'APPEND_LLM_MESSAGE', message }));
    expect(result.current.state.llmMessages).toHaveLength(1);
    act(() => result.current.dispatch({ type: 'STREAM_LLM_CHUNK', id: 'm1', chunk: ' mundo' }));
    expect(result.current.state.llmMessages[0].content).toBe('Hola mundo');
    act(() => result.current.dispatch({ type: 'CLEAR_LLM_MESSAGES' }));
    expect(result.current.state.llmMessages).toHaveLength(0);
  });

  it('updates module context', () => {
    const { result } = renderHook(() => useBlackboardContext(), { wrapper });
    const context = {
      slug: 'mod1',
      title: 'Mod 1',
      objective: ['a'],
      datasets: [],
      order: 1,
    };
    act(() => result.current.dispatch({ type: 'SET_MODULE_CONTEXT', context }));
    expect(result.current.state.moduleContext).toEqual(context);
  });
});
