'use client';

import { useEffect } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';

function isDarkTheme(theme: 'light' | 'dark' | 'auto'): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeSync() {
  const { state } = useBlackboardContext();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => {
      document.documentElement.classList.toggle('dark', isDarkTheme(state.settings.theme));
    };
    update();
    if (state.settings.theme === 'auto') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
  }, [state.settings.theme]);

  return null;
}
