'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useBlackboardContext } from '../lib/context';

interface BlackboardPanelProps {
  children?: ReactNode;
}

/**
 * Resuelve el tema del panel: 'auto' sigue prefers-color-scheme del SO.
 * La clase `dark` se aplica SOLO al panel — el contenido del curso no
 * tiene superficies oscuras y `dark` en <html> rompía el contraste.
 */
function usePanelDark(theme: 'light' | 'dark' | 'auto'): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const resolve = () => {
      if (theme === 'dark') setIsDark(true);
      else if (theme === 'light') setIsDark(false);
      else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    resolve();
    if (theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', resolve);
      return () => media.removeEventListener('change', resolve);
    }
  }, [theme]);

  return isDark;
}

export function BlackboardPanel({ children }: BlackboardPanelProps) {
  const { state, dispatch } = useBlackboardContext();
  const isDark = usePanelDark(state.settings.theme);

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
    ? 'fixed inset-0 z-50 bg-white dark:bg-ink-900'
    : 'fixed inset-0 z-40 border-r border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900 md:left-0 md:right-auto md:inset-y-0';

  return (
    <div
      id="blackboard-panel"
      role="complementary"
      aria-label="Pizarra"
      className={`${isDark ? 'dark ' : ''}${wrapperClass} flex flex-col transition-all duration-300 ease-out`}
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
