import clsx from 'clsx';
import type { ComponentType, ReactNode } from 'react';
import { BookOpen, ChevronDown, Cog } from 'lucide-react';

/**
 * Capa plegable de profundidad dentro de un módulo. Dos variantes con
 * contrato didáctico distinto:
 *
 *  - `<Profundiza>`: teoría, demostraciones y literatura. Optativa pero
 *    conceptual — para quien quiere llegar al fondo.
 *  - `<SalaDeMaquinas>`: implementación, trampas de software y detalles
 *    de cómputo. Técnica — para quien ejecuta o audita.
 *
 * `<details>` nativo: funciona sin JS, es accesible por teclado y se
 * imprime abierto con `open`.
 */

interface DeepProps {
  title?: string;
  /** Nota pequeña junto al título, p.ej. "optativo" o "anexo II-1". */
  hint?: string;
  open?: boolean;
  children: ReactNode;
}

interface Variant {
  wrap: string;
  badge: string;
  Icon: ComponentType<{ className?: string }>;
  label: string;
}

const VARIANTS = {
  profundiza: {
    wrap: 'border-brand-200 bg-brand-50/60',
    badge: 'text-brand-700',
    Icon: BookOpen,
    label: 'Profundiza',
  },
  sala: {
    wrap: 'border-ink-300 bg-ink-50',
    badge: 'text-ink-700',
    Icon: Cog,
    label: 'Sala de máquinas',
  },
} satisfies Record<string, Variant>;

function DeepBox({ variant, title, hint, open, children }: DeepProps & { variant: keyof typeof VARIANTS }) {
  const v = VARIANTS[variant];
  return (
    <details open={open} className={clsx('group my-6 rounded border', v.wrap)}>
      <summary className={clsx(
        'flex cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-sm font-semibold',
        'list-none [&::-webkit-details-marker]:hidden focus-visible:outline',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        v.badge,
      )}>
        <v.Icon aria-hidden className="h-4 w-4 shrink-0" />
        <span>{title ?? v.label}</span>
        {hint && <span className="font-normal text-ink-500">· {hint}</span>}
        <ChevronDown aria-hidden
          className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform [details[open]>&]:rotate-180" />
      </summary>
      <div className="border-t border-ink-200/70 px-4 py-3">
        <div className="prose prose-sm max-w-none text-ink-700 prose-p:my-1 prose-code:before:content-none prose-code:after:content-none prose-code:bg-code prose-code:text-gray-100">
          {children}
        </div>
      </div>
    </details>
  );
}

export function Profundiza(props: DeepProps) {
  return <DeepBox {...props} variant="profundiza" />;
}

export function SalaDeMaquinas(props: DeepProps) {
  return <DeepBox {...props} variant="sala" />;
}
