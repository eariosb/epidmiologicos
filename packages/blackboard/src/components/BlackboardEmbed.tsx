'use client';

import { useEffect, useState } from 'react';
import { useBlackboardContext } from '../lib/context';

interface BlackboardEmbedProps {
  sceneId: string;
  height?: number;
}

export function BlackboardEmbed({ sceneId, height = 300 }: BlackboardEmbedProps) {
  const { storage } = useBlackboardContext();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const scene = await storage.getScene(sceneId);
      if (cancelled || !scene) return;
      // For now, show a placeholder. Rendering Excalidraw as read-only inline
      // will be implemented in a later phase.
      setSrc('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E');
    })();
    return () => { cancelled = true; };
  }, [sceneId, storage]);

  if (!src) return <div className="h-full w-full animate-pulse bg-ink-100" style={{ height }} />;

  return (
    <div
      className="overflow-hidden rounded border border-ink-200 bg-white"
      style={{ height }}
    >
      <p className="p-4 text-sm text-ink-500">Escena {sceneId} (vista previa en construcción)</p>
    </div>
  );
}
