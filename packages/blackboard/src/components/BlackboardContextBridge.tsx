'use client';

import { useEffect } from 'react';
import { useBlackboardContext } from '../lib/context';
import { SCHEMA_VERSIONS } from '../lib/persistence/version';
import { setAssistantProfile } from '../lib/prompts/system';
import type { AssistantProfile } from '../lib/prompts/system';
import type { ModuleContext } from '../types/blackboard';

interface BlackboardContextBridgeProps {
  context: ModuleContext;
  /** Perfil del asistente del curso anfitrión; se registra una vez. */
  profile?: AssistantProfile;
}

export function BlackboardContextBridge({ context, profile }: BlackboardContextBridgeProps) {
  const { state, dispatch, storage } = useBlackboardContext();

  useEffect(() => {
    if (profile) setAssistantProfile(profile);
    dispatch({ type: 'SET_MODULE_CONTEXT', context });

    const defaultSceneId = `blackboard/${context.slug}`;
    if (state.activeSceneId?.startsWith(`blackboard/${context.slug}`)) return;

    let cancelled = false;
    (async () => {
      // Hydrate every stored page of this module so PageNav can list them —
      // upserting with activate:false must not steal the current selection.
      const stored = await storage.listScenes(context.slug);
      if (cancelled) return;
      for (const s of stored) {
        dispatch({ type: 'UPSERT_SCENE', scene: s, activate: false });
      }
      const existing = stored.find((s) => s.id === defaultSceneId);
      if (existing) {
        dispatch({ type: 'UPSERT_SCENE', scene: existing });
      } else {
        const scene = {
          version: SCHEMA_VERSIONS.scene,
          id: defaultSceneId,
          moduleSlug: context.slug,
          elements: [],
          appState: {},
          notes: '',
          matrixStates: {},
          currentStep: 0,
          updatedAt: new Date().toISOString(),
        };
        await storage.saveScene(scene);
        if (cancelled) return;
        dispatch({ type: 'UPSERT_SCENE', scene });
      }
    })().catch((err) => {
      console.error('[blackboard] scene bootstrap failed', err);
    });

    return () => { cancelled = true; };
  }, [context, profile, dispatch, storage, state.activeSceneId]);

  return null;
}
