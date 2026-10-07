'use client';

import { useBlackboardContext } from '../lib/context';
import type { ReactNode } from 'react';

interface BlackboardAnchorProps {
  id: string;
  children?: ReactNode;
}

export function BlackboardAnchor({ id, children }: BlackboardAnchorProps) {
  const { state, dispatch } = useBlackboardContext();
  const isActive = state.activeSceneId === id;

  return (
    <button
      type="button"
      onClick={() => {
        dispatch({ type: 'SET_PANEL', isOpen: true });
        dispatch({ type: 'SELECT_SCENE', id });
      }}
      className={`rounded border px-2 py-1 text-xs transition-colors ${
        isActive
          ? 'border-accent-300 bg-accent-50 text-accent-700'
          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
      }`}
    >
      {children ?? 'Abrir en pizarra'}
    </button>
  );
}
