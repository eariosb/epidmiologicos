'use client';

import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Envuelve un interactivo y le añade un botón "Reiniciar" que remonta el
 * componente (cambia la key → todo el estado vuelve a los props iniciales,
 * incluidas animaciones en marcha).
 */
export function SimReset({ children }: { children: ReactNode }) {
  const [k, setK] = useState(0);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setK(k + 1)}
        title="Reiniciar el interactivo"
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded border border-ink-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-ink-500 shadow-sm hover:bg-ink-50 hover:text-ink-700"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
        Reiniciar
      </button>
      <div key={k}>{children}</div>
    </div>
  );
}
