'use client';

import { useCallback, useMemo } from 'react';
import { useBlackboardContext } from '../lib/context';
import { maxBoardStep } from '../lib/steps';

/**
 * Progressive-reveal controls bound to the active scene.
 * `currentStep` lives in the persisted scene (survives reload); step changes
 * write through to storage immediately since they don't come from onChange.
 */
export function usePresentation() {
  const { state, dispatch, storage } = useBlackboardContext();

  const scene = state.activeSceneId ? state.scenes[state.activeSceneId] : null;
  const currentStep = scene?.currentStep ?? 0;
  const maxStep = useMemo(() => maxBoardStep(scene?.elements ?? []), [scene]);
  const presentationMode = state.presentationMode;

  const setStep = useCallback(
    (step: number) => {
      if (!scene) return;
      const clamped = Math.max(0, Math.min(step, maxStep));
      const updated = { ...scene, currentStep: clamped, updatedAt: new Date().toISOString() };
      dispatch({ type: 'SET_SCENE_STEP', sceneId: scene.id, step: clamped });
      storage.saveScene(updated).catch(() => {});
    },
    [scene, maxStep, dispatch, storage],
  );

  const nextStep = useCallback(() => setStep(currentStep + 1), [setStep, currentStep]);
  const prevStep = useCallback(() => setStep(currentStep - 1), [setStep, currentStep]);

  const setPresentation = useCallback(
    (on: boolean) => {
      dispatch({ type: 'SET_PRESENTATION', on });
      if (!on) dispatch({ type: 'SET_SPOTLIGHT', rect: null });
    },
    [dispatch],
  );

  const setSpotlight = useCallback(
    (rect: { x: number; y: number; w: number; h: number } | null) => {
      dispatch({ type: 'SET_SPOTLIGHT', rect });
    },
    [dispatch],
  );

  return {
    currentStep,
    maxStep,
    presentationMode,
    spotlight: state.spotlight,
    setStep,
    nextStep,
    prevStep,
    setPresentation,
    setSpotlight,
  };
}
