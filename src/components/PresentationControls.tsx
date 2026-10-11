'use client';

import type { RefObject } from 'react';
import { ChevronLeft, ChevronRight, Flashlight, Pause, MonitorPlay } from 'lucide-react';
import { useBlackboardContext, usePresentation } from '@cursos/blackboard';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

interface PresentationControlsProps {
  canvasRef: RefObject<BlackboardCanvasRef | null>;
  /** Render as a vertical icon rail (right-side rail layout). */
  vertical?: boolean;
}

/**
 * Progressive-reveal controls: step navigation, presentation toggle and
 * spotlight arming. Advancing stamps the current step on any elements drawn
 * since the last transition so reveal order stays correct.
 */
export function PresentationControls({ canvasRef, vertical }: PresentationControlsProps) {
  const { dispatch } = useBlackboardContext();
  const { currentStep, maxStep, presentationMode, setPresentation, nextStep, prevStep } =
    usePresentation();

  const advance = () => {
    canvasRef.current?.stampCurrentStep(currentStep);
    nextStep();
  };
  const back = () => {
    canvasRef.current?.stampCurrentStep(currentStep);
    prevStep();
  };

  return (
    <div className={vertical ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1'}>
      <button
        type="button"
        onClick={back}
        disabled={currentStep === 0}
        title="Paso anterior (←)"
        className="rounded border border-ink-200 px-1.5 py-0.5 text-xs text-ink-600 hover:bg-ink-100 disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
      >
        <ChevronLeft aria-hidden className="h-3.5 w-3.5" />
      </button>
      <span
        className="min-w-[3.5rem] text-center text-[11px] tabular-nums text-ink-500 dark:text-ink-400"
        title="Paso actual / total de pasos"
      >
        {currentStep}/{maxStep}
      </span>
      <button
        type="button"
        onClick={advance}
        title="Siguiente paso (→ o Espacio)"
        className="rounded border border-ink-200 px-1.5 py-0.5 text-xs text-ink-600 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
      >
        <ChevronRight aria-hidden className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'SET_SPOTLIGHT_ARMED', armed: true })}
        title="Spotlight: arrastra sobre el lienzo para enfocar una zona (S)"
        className="rounded border border-ink-200 px-1.5 py-0.5 text-xs text-ink-600 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
      >
        <Flashlight aria-hidden className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setPresentation(!presentationMode)}
        title={presentationMode ? 'Salir de presentación (Esc)' : 'Modo presentación (P)'}
        className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
          presentationMode
            ? 'border-brand-400 bg-brand-100 text-brand-700'
            : 'border-ink-200 text-ink-600 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800'
        }`}
      >
        {vertical ? (
          presentationMode ? (
            <Pause aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <MonitorPlay aria-hidden className="h-3.5 w-3.5" />
          )
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {presentationMode ? (
              <Pause aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <MonitorPlay aria-hidden className="h-3.5 w-3.5" />
            )}
            {presentationMode ? 'Editar' : 'Presentar'}
          </span>
        )}
      </button>
    </div>
  );
}
