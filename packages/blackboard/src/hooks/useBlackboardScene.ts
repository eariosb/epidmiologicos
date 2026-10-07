'use client';

import { useCallback, useMemo } from 'react';
import { useBlackboardContext } from '../lib/context';
import { SCHEMA_VERSIONS } from '../lib/persistence/version';
import type { BlackboardScene } from '../types/blackboard';

export function useBlackboardScene() {
  const { state, dispatch, storage } = useBlackboardContext();

  const activeScene = useMemo(() => {
    if (!state.activeSceneId) return null;
    return state.scenes[state.activeSceneId] ?? null;
  }, [state.activeSceneId, state.scenes]);

  const moduleScenes = useMemo(() => {
    const slug = state.moduleContext?.slug;
    if (!slug) return [];
    return Object.values(state.scenes).filter((s) => s.moduleSlug === slug);
  }, [state.scenes, state.moduleContext?.slug]);

  const loadScene = useCallback(
    async (id: string) => {
      const scene = await storage.getScene(id);
      if (scene) {
        dispatch({ type: 'UPSERT_SCENE', scene });
      }
    },
    [dispatch, storage],
  );

  const saveScene = useCallback(
    async (scene: BlackboardScene) => {
      const updated = { ...scene, updatedAt: new Date().toISOString() };
      await storage.saveScene(updated);
      dispatch({ type: 'UPSERT_SCENE', scene: updated });
    },
    [dispatch, storage],
  );

  const deleteScene = useCallback(
    async (id: string) => {
      await storage.deleteScene(id);
      dispatch({ type: 'DELETE_SCENE', id });
    },
    [dispatch, storage],
  );

  const createScene = useCallback(
    (moduleSlug: string, id?: string) => {
      const sceneId = id ?? `${moduleSlug}/${Date.now()}`;
      const scene: BlackboardScene = {
        version: SCHEMA_VERSIONS.scene,
        id: sceneId,
        moduleSlug,
        elements: [],
        appState: {},
        notes: '',
        matrixStates: {},
        currentStep: 0,
        updatedAt: new Date().toISOString(),
      };
      return saveScene(scene);
    },
    [saveScene],
  );

  return {
    activeScene,
    activeSceneId: state.activeSceneId,
    moduleScenes,
    loadScene,
    saveScene,
    deleteScene,
    createScene,
  };
}
