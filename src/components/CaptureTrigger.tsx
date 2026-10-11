'use client';

import { Camera } from 'lucide-react';
import { useBroadcast } from '@/hooks/useBroadcast';

export function CaptureTrigger() {
  const { mode } = useBroadcast();
  if (mode === 'student') return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('start-capture'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="capture-fab fixed bottom-20 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      title="Capturar región (Ctrl+Shift+S)"
    >
      <Camera aria-hidden className="h-4 w-4" />
      Capturar
    </button>
  );
}
