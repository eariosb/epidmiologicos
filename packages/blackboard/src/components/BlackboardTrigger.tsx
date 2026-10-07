'use client';

import { PenLine, X } from 'lucide-react';
import { useBlackboardContext } from '../lib/context';

interface BlackboardTriggerProps {
  label?: string;
}

export function BlackboardTrigger({ label = 'Pizarra' }: BlackboardTriggerProps) {
  const { state, dispatch } = useBlackboardContext();

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'TOGGLE_PANEL' })}
      aria-expanded={state.isOpen}
      aria-controls="blackboard-panel"
      className="bb-trigger-fab fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-lg transition-all hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    >
      <span aria-hidden className="inline-flex">
        {state.isOpen ? <X className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
      </span>
      <span>{state.isOpen ? 'Cerrar' : label}</span>
    </button>
  );
}
