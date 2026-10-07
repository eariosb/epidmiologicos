'use client';

import { useEffect, useRef } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';
import { useBroadcast } from '@/hooks/useBroadcast';

/**
 * Teacher → student sync over BroadcastChannel.
 * Teacher emits focus/step/present/spotlight on every change; students apply
 * them read-only. Works between tabs of the same browser (see useBroadcast).
 */
export function PresentationSync() {
  const { state, dispatch } = useBlackboardContext();
  const { mode, subscribe, broadcast } = useBroadcast();
  const lastSent = useRef<string>('');

  const scene = state.activeSceneId ? state.scenes[state.activeSceneId] : null;
  const step = scene?.currentStep ?? 0;

  // Teacher: emit when page, step, mode or spotlight change.
  useEffect(() => {
    if (mode !== 'teacher' || !scene) return;
    const key = `${scene.id}:${step}`;
    if (lastSent.current === key) return;
    lastSent.current = key;
    broadcast({ type: 'focus', sceneId: scene.id, step });
  }, [mode, scene, step, broadcast]);

  useEffect(() => {
    if (mode !== 'teacher') return;
    broadcast({ type: 'present', on: state.presentationMode });
  }, [mode, state.presentationMode, broadcast]);

  useEffect(() => {
    if (mode !== 'teacher') return;
    broadcast({ type: 'spotlight', rect: state.spotlight });
  }, [mode, state.spotlight, broadcast]);

  // Student: apply teacher state.
  useEffect(() => {
    if (mode !== 'student') return;
    const unsubscribe = subscribe((msg) => {
      switch (msg.type) {
        case 'focus': {
          dispatch({ type: 'SELECT_SCENE', id: msg.sceneId });
          dispatch({ type: 'SET_SCENE_STEP', sceneId: msg.sceneId, step: msg.step });
          break;
        }
        case 'step': {
          if (state.activeSceneId) {
            dispatch({ type: 'SET_SCENE_STEP', sceneId: state.activeSceneId, step: msg.step });
          }
          break;
        }
        case 'spotlight':
          dispatch({ type: 'SET_SPOTLIGHT', rect: msg.rect });
          break;
        case 'present':
          dispatch({ type: 'SET_PRESENTATION', on: msg.on });
          break;
        default:
          break;
      }
    });
    return unsubscribe;
  }, [mode, subscribe, dispatch, state.activeSceneId]);

  return null;
}
