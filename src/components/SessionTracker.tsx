'use client';

import { useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/telemetry';

interface SessionTrackerProps {
  slug: string;
  title: string;
}

/**
 * Registra la visita local (useSession) y, al salir del módulo, emite el
 * evento de telemetría `module-visit` con `dwellMs`: tiempo con la pestaña
 * VISIBLE (pausa cuando document.hidden). Si la pestaña se cierra sin
 * unmount, la duración la reconstruyen los `session-ping` del heartbeat.
 */
export function SessionTracker({ slug, title }: SessionTrackerProps) {
  const { visit } = useSession();

  useEffect(() => {
    visit(slug, title);

    let dwellMs = 0;
    let last = Date.now();
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        dwellMs += Date.now() - last;
      } else {
        last = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (document.visibilityState === 'visible') dwellMs += Date.now() - last;
      track('module-visit', { dwellMs }, slug);
    };
  }, [slug, title, visit]);

  return null;
}
