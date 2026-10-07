'use client';

import { useEffect, type ReactNode } from 'react';
import { useBlackboardContext } from '../lib/context';

interface BlackboardPanelProps {
  children?: ReactNode;
}

export function BlackboardPanel({ children }: BlackboardPanelProps) {
  const { state, dispatch } = useBlackboardContext();

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const shortcut = state.settings.panelShortcut;
      const mod = e.metaKey || e.ctrlKey;
      const shift = e.shiftKey;
      const key = shortcut.split('+').pop()?.toLowerCase() ?? 'b';
      if (mod && shift && e.key.toLowerCase() === key) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PANEL' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, state.settings.panelShortcut]);

  if (!state.isOpen) {
    return (
      <div
        id="blackboard-panel"
        role="complementary"
        aria-label="Pizarra"
        aria-hidden="true"
        className="hidden"
      />
    );
  }

  const wrapperClass = state.isFullscreen
    ? 'fixed inset-0 z-50 bg-white'
    : 'fixed inset-0 z-40 border-r border-ink-200 bg-white shadow-2xl md:left-0 md:right-auto md:inset-y-0';

  return (
    <div
      id="blackboard-panel"
      role="complementary"
      aria-label="Pizarra"
      className={`${wrapperClass} flex flex-col transition-all duration-300 ease-out`}
      style={
        state.isFullscreen
          ? undefined
          : { width: '60vw' }
      }
    >
      {children}
    </div>
  );
}
