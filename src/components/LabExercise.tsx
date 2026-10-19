'use client';

import { FlaskConical } from 'lucide-react';
import { RCell } from './RCell';
import { MathText } from '@/lib/math-text';
import type { LabExerciseProps } from '@/types/course';

/**
 * Guided executable lab rendered at the end of a module. Wraps an editable
 * WebR cell (RCell) with a statement, an analysis checklist ("Tu turno"),
 * and collapsible hint / guide-answer sections. Intended for small simulated
 * datasets and cheap epidemiological analyses — the expensive real-course models stay
 * precomputed in RCells.
 */
export function LabExercise({
  id,
  title,
  code,
  tasks,
  hint,
  solution,
  children,
}: LabExerciseProps) {
  return (
    <section
      className="my-8 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm"
      data-lab-id={id}
    >
      <div className="flex items-center gap-2.5 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <FlaskConical aria-hidden className="h-4 w-4 text-brand-700" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Laboratorio
        </span>
        <span className="text-sm font-semibold text-ink-800">{title}</span>
      </div>

      {children && (
        <div className="prose prose-sm max-w-none px-4 py-3 text-ink-700 prose-p:my-1.5 prose-code:before:content-none prose-code:after:content-none prose-code:bg-code prose-code:text-gray-100">
          {children}
        </div>
      )}

      <p className="px-4 pb-2 text-xs text-ink-500">
        La primera ejecución instala los paquetes de R y puede tardar ~30–60 s.
        Las celdas comparten una misma sesión de R.
      </p>

      <div className="px-4 pb-4">
        <RCell id={id} code={code} />
      </div>

      {tasks && tasks.length > 0 && (
        <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Tu turno: analiza e interpreta
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-700">
            {tasks.map((task, i) => (
              <li key={i}><MathText text={task} /></li>
            ))}
          </ol>
        </div>
      )}

      {(hint || solution) && (
        <div className="space-y-1 border-t border-ink-100 px-4 py-2.5">
          {hint && (
            <details>
              <summary className="cursor-pointer select-none text-sm font-medium text-brand-700 transition-colors hover:text-brand-800">
                Ver pista
              </summary>
              <div className="prose prose-sm mt-1.5 max-w-none whitespace-pre-line text-ink-600">
                <MathText text={hint} />
              </div>
            </details>
          )}
          {solution && (
            <details>
              <summary className="cursor-pointer select-none text-sm font-medium text-brand-700 transition-colors hover:text-brand-800">
                Ver respuestas guía
              </summary>
              <div className="prose prose-sm mt-1.5 max-w-none whitespace-pre-line text-ink-600">
                <MathText text={solution} />
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
