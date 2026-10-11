import type { ReactNode } from 'react';
import { GLOSSARY } from '@/lib/glossary';

interface TermProps {
  /** Clave del glosario de siglas (src/lib/glossary.ts). */
  k?: string;
  /** Texto libre del tooltip (personas, resultados, métodos). */
  tip?: string;
  children?: ReactNode;
}

/**
 * Término con tooltip en hover/focus: subrayado punteado discreto en el
 * texto y, al pasar el cursor, la expansión de la sigla o el recorderis
 * historiográfico. CSS puro — sin estado, funciona en SSR y en lectores
 * de pantalla vía el sr-only y el tabIndex.
 */
export function Term({ k, tip, children }: TermProps) {
  const text = tip ?? (k ? GLOSSARY[k] : undefined);
  const label = children ?? k;
  return (
    <span
      tabIndex={0}
      className="group relative inline cursor-help border-b border-dotted border-brand-600 decoration-1"
    >
      {label}
      {text && (
        <>
          <span className="sr-only">({text})</span>
          <span
            role="note"
            className="invisible pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-64 max-w-[80vw] -translate-x-1/2 rounded-md bg-ink-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            {text}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-ink-900" />
          </span>
        </>
      )}
    </span>
  );
}
