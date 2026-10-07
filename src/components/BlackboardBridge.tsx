'use client';

import { useEffect } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';
import type { SendToBlackboardDetail } from '@/lib/send-to-blackboard';

/**
 * Listens for `send-to-blackboard` events globally. When the blackboard
 * panel is closed, it opens it so the queued insert can be applied once
 * the canvas mounts.
 */
export function BlackboardBridge() {
  const { state, dispatch } = useBlackboardContext();

  useEffect(() => {
    const handler = (e: Event) => {
      if (state.isOpen) return;
      const detail = (e as CustomEvent).detail as SendToBlackboardDetail | undefined;
      if (detail?.handled) return;
      dispatch({ type: 'SET_PANEL', isOpen: true });
    };
    window.addEventListener('send-to-blackboard', handler);
    return () => window.removeEventListener('send-to-blackboard', handler);
  }, [dispatch, state.isOpen]);

  return null;
}
