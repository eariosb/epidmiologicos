'use client';

import { useEffect, useState, useCallback } from 'react';
import { CaptureOverlay } from './CaptureOverlay';
import { useSession } from '@/hooks/useSession';

export function CaptureManager() {
  const [open, setOpen] = useState(false);
  const { addCapture } = useSession();

  const handleStart = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setOpen(false);
      await addCapture(dataUrl, {
        type: 'other',
      });
    },
    [addCapture],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onEvent = () => setOpen(true);
    window.addEventListener('start-capture', onEvent);
    return () => window.removeEventListener('start-capture', onEvent);
  }, []);

  if (!open) return null;
  return <CaptureOverlay onCapture={handleCapture} onCancel={handleCancel} />;
}
