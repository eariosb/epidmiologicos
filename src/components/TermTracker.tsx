'use client';

// Telemetría de `term-view` por delegación: escucha hover/focus dentro del
// artículo y reporta el `data-term` del término más cercano. Así `Term`
// puede seguir siendo un componente de servidor (sin hidratar cada término).
// Un evento por clave cada 2 s como máximo (doc 03 §3).

import { useEffect, useRef, type ReactNode } from 'react';
import { currentModuleSlug, track } from '@/lib/telemetry';

const THROTTLE_MS = 2000;

export function TermTracker({ children }: { children: ReactNode }) {
  const last = useRef(new Map<string, number>());

  useEffect(() => {
    const emit = (key: string | undefined) => {
      if (!key) return;
      const now = Date.now();
      if (now - (last.current.get(key) ?? 0) < THROTTLE_MS) return;
      last.current.set(key, now);
      track('term-view', { key }, currentModuleSlug());
    };
    const onHover = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-term]');
      if (el) emit(el.getAttribute('data-term') ?? undefined);
    };
    const onFocus = (e: Event) => onHover(e);
    document.addEventListener('mouseover', onHover, { passive: true });
    document.addEventListener('focusin', onFocus, { passive: true });
    return () => {
      document.removeEventListener('mouseover', onHover);
      document.removeEventListener('focusin', onFocus);
    };
  }, []);

  return <>{children}</>;
}
