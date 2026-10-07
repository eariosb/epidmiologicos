export interface ProcessStep {
  title: string;
  content: string;
}

export interface ProcessStepsProps {
  steps: ProcessStep[];
}

/**
 * Lista numerada vertical para descomponer un procedimiento en pasos
 * secuenciales (ej. construcción de un modelo GAMLSS, diagnóstico, etc.).
 * Mismo lenguaje visual que el curso MLM.
 */
export function ProcessSteps({ steps }: ProcessStepsProps) {
  return (
    <ol className="my-6 space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-700 text-sm font-bold text-white"
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 pb-2">
            <p className="font-semibold text-ink-900">{step.title}</p>
            <p className="mt-0.5 text-sm text-ink-600">{step.content}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
