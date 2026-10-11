import { MathText } from '@/lib/math-text';
import type { ProcessStep, ProcessStepsProps } from '@/types/course';

export type { ProcessStep, ProcessStepsProps };

/**
 * Lista numerada vertical para descomponer un procedimiento en pasos
 * secuenciales (mecanismo de ramificación, cómputo de π, Gillespie, etc.).
 * Los pasos llevan `title` + `description` (con LaTeX $…$ permitido) y el
 * componente admite un `title` de encabezado.
 */
export function ProcessSteps({ steps, title }: ProcessStepsProps) {
  return (
    <div className="my-6">
      {title && (
        <p className="mb-3 text-sm font-semibold text-ink-800">{title}</p>
      )}
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 pb-2">
              <p className="font-semibold text-ink-900">
                <MathText text={step.title} />
              </p>
              <p className="mt-0.5 text-sm text-ink-600">
                <MathText text={step.description} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
