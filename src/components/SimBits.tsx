import type { ReactNode } from 'react';

/* Leyenda explícita: mapea color/forma -> significado de cada curva.   */
export function SimLegend({
  items,
  className = '',
}: {
  items: { color: string; label: ReactNode; mark?: 'line' | 'dot' | 'bar'; dash?: boolean }[];
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] leading-snug text-ink-600 ${className}`}
    >
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <svg width="18" height="9" aria-hidden="true" className="shrink-0">
            {it.mark === 'dot' ? (
              <circle cx={9} cy={4.5} r={3.2} fill={it.color} />
            ) : it.mark === 'bar' ? (
              <rect x={2} y={1} width={14} height={7} rx={1.5} fill={it.color} />
            ) : (
              <line
                x1={0}
                y1={4.5}
                x2={18}
                y2={4.5}
                stroke={it.color}
                strokeWidth={2.4}
                strokeDasharray={it.dash ? '4 2.5' : undefined}
              />
            )}
          </svg>
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

/* Guía de lectura: qué observar y cómo interpretar el interactivo.     */
export function SimGuide({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border border-warning-200 bg-warning-50/80 px-3 py-1.5 text-[11px] leading-snug text-warning-900">
      <strong className="mr-1 font-semibold">Qué mirar:</strong>
      {children}
    </p>
  );
}
