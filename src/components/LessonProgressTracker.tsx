'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

export interface LessonProgressTrackerProps {
  /** Número de módulo actual (1-20). */
  current: number;
  /** Total de módulos (por defecto 20). */
  total?: number;
}

/**
 * Barra de progreso que indica la posición del estudiante dentro del curso.
 * Se fija al borde superior del contenido en desktop y muestra el porcentaje
 * de avance. Mismo patrón visual que el curso MLM.
 */
export function LessonProgressTracker({ current, total = 20 }: LessonProgressTrackerProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const coursePercent = Math.round((current / total) * 100);

  return (
    <div className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-2 lg:px-10">
        <span className="text-xs font-medium text-ink-500">
          Módulo {current} / {total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
          <div
            className="h-full rounded-full bg-accent-600 transition-all duration-300"
            style={{ width: `${coursePercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-accent-700">{coursePercent}%</span>
      </div>
      <div className="h-0.5 bg-accent-200">
        <div
          className={clsx('h-full bg-accent-400 transition-all duration-150')}
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
