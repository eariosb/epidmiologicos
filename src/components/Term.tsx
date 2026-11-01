import type { ReactNode } from 'react';
import Link from 'next/link';
import { GLOSSARY, GLOSSARY_ALIASES, glossaryAnchor } from '@/lib/glossary';

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
 * historiográfico. Cuando la clave existe en el glosario el término
 * además enlaza a /glosario#clave; el tooltip refresca y el clic lleva
 * a la entrada completa, tejiendo el grafo interno del curso.
 *
 * Componente de servidor: el tooltip es CSS puro y no necesita estado. La
 * telemetría de `term-view` la resuelve `TermTracker` por delegación sobre
 * el `data-term`, así que un módulo con 40 términos no hidrata 40
 * componentes.
 */
export function Term({ k: rawK, tip, children }: TermProps) {
  const k = rawK ? (GLOSSARY_ALIASES[rawK] ?? rawK) : rawK;
  const text = tip ?? (k ? GLOSSARY[k] : undefined);
  const label = children ?? rawK;
  const href = k && k in GLOSSARY ? `/glosario#${glossaryAnchor(k)}` : null;
  const termKey = k ?? (typeof label === 'string' ? label.slice(0, 60) : 'term');
  const inner = (
    <>
      {label}
      {text && (
        <>
          <span className="sr-only">({text})</span>
          <span
            role="note"
            className="hidden pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-64 max-w-[80vw] -translate-x-1/2 rounded-md bg-ink-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/term:block group-hover/term:opacity-100 group-focus-within/term:block group-focus-within/term:opacity-100"
          >
            {text}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-ink-900" />
          </span>
        </>
      )}
    </>
  );
  const className =
    'group/term relative inline cursor-help border-b border-dotted border-brand-600 decoration-1';
  if (href) {
    return (
      <Link
        href={href}
        data-term={termKey}
        className={`${className} text-inherit no-underline hover:text-inherit focus-visible:text-inherit`}
      >
        {inner}
      </Link>
    );
  }
  return (
    <span tabIndex={0} data-term={termKey} className={className}>
      {inner}
    </span>
  );
}
