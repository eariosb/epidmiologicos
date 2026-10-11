'use client';

import clsx from 'clsx';
import { MathText } from '@/lib/math-text';

interface EpiTableProps {
  rows: string[];
  cols: string[];
  data: (string | number)[][];
  caption?: string;
  title?: string;
}

/**
 * Tabla de datos epidemiológicos con encabezado de filas.
 * Pensada para exhibir cifras históricas o resumenes de un texto
 * (no es una tabla 2×2 de contingencia editable).
 */
export function EpiTable({ rows, cols, data, caption, title }: EpiTableProps) {
  return (
    <figure className="my-6">
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {title}
        </p>
      )}
      <div className="w-full overflow-x-auto rounded border border-ink-200">
        <table className="min-w-full divide-y divide-ink-200 text-sm">
          <thead className="bg-brand-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-brand-800" />
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-brand-800"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r}>
                <td className="border-t border-ink-100 px-4 py-2.5 font-medium text-ink-800">
                  {r}
                </td>
                {data[i].map((cell, j) => (
                  <td
                    key={j}
                    className="border-t border-ink-100 px-4 py-2.5 text-right tabular-nums text-ink-700"
                  >
                    <MathText text={String(cell)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs italic text-ink-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export interface HillItem {
  criterion: string;
  status: 'si' | 'parcial' | 'no';
  note: string;
}

interface BradfordHillProps {
  title?: string;
  items: HillItem[];
}

const STATUS_STYLE: Record<HillItem['status'], string> = {
  si: 'border-success-300 bg-success-50 text-success-800',
  parcial: 'border-warning-300 bg-warning-50 text-warning-800',
  no: 'border-ink-200 bg-ink-50 text-ink-500',
};

const STATUS_LABEL: Record<HillItem['status'], string> = {
  si: 'sí',
  parcial: 'parcial',
  no: 'no',
};

/**
 * Panel de evaluación con los criterios de Bradford Hill.
 * Cada criterio lleva un estado (sí / parcial / no) y una nota breve:
 * visualiza que la causalidad se acumula, no se demuestra por checklist.
 */
export function BradfordHill({ title, items }: BradfordHillProps) {
  return (
    <div className="my-6">
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {title}
        </p>
      )}
      <div className="divide-y divide-ink-100 overflow-hidden rounded border border-ink-200">
        {items.map((item) => (
          <div key={item.criterion} className="flex items-start gap-4 px-4 py-3">
            <span className="min-w-32 pt-0.5 text-sm font-medium text-ink-800">
              <MathText text={item.criterion} />
            </span>
            <span
              className={clsx(
                'mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                STATUS_STYLE[item.status]
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
            <span className="text-sm leading-relaxed text-ink-600">
              <MathText text={item.note} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
