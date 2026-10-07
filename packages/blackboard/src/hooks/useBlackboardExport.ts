'use client';

import { useCallback } from 'react';
import { useBlackboardContext } from '../lib/context';

export function useBlackboardExport() {
  const { state } = useBlackboardContext();

  const download = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  return {
    scene: state.activeSceneId ? state.scenes[state.activeSceneId] ?? null : null,
    download,
    copyToClipboard,
  };
}
