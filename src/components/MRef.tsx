import Link from 'next/link';
import type { ReactNode } from 'react';
import { getAllModules } from '@/lib/modules';

interface MRefProps {
  /** Número de módulo (0 = repaso); lo inyecta remarkModuleRefs. */
  n?: string | number;
  children?: ReactNode;
}

/**
 * Referencia a módulo: enlace directo a `/cursos/<slug>` con el mismo
 * tooltip en hover/focus que <Term> — "Módulo 3 — Medición de la
 * enfermedad". Si el número no resuelve un módulo, queda como texto.
 */
export function MRef({ n, children }: MRefProps) {
  const order = Number(n);
  const mod = Number.isInteger(order)
    ? getAllModules().find((m) => m.meta.order === order)
    : undefined;
  if (!mod) return <>{children}</>;

  const title = mod.meta.title.replace(/^\d+\.\s*/, '');
  const tip = order === 0 ? `Repaso — ${title}` : `Módulo ${order} — ${title}`;

  return (
    <Link
      href={`/cursos/${mod.meta.slug}`}
      title={tip}
      className="group relative inline cursor-pointer border-b border-dotted border-brand-600 decoration-1 text-brand-700 transition-colors hover:border-brand-800 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      {children ?? `M${order}`}
      <span className="sr-only"> ({tip})</span>
      <span
        role="note"
        className="invisible pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-64 max-w-[80vw] -translate-x-1/2 rounded-md bg-ink-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {tip} · Ir al módulo →
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-ink-900" />
      </span>
    </Link>
  );
}
