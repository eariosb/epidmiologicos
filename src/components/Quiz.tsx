'use client';

import { useId, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import clsx from 'clsx';
import { MathText } from '@/lib/math-text';
import { useTelemetry } from '@/components/TelemetryGate';
import { currentModuleSlug } from '@/lib/telemetry';

export interface QuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /**
   * Nota opcional por opción (mismo orden que `options`): se muestra bajo
   * cada opción tras enviar, para explicar también por qué falla cada
   * distractor, no solo por qué acierta la correcta.
   */
  optionNotes?: (string | undefined)[];
}

/**
 * Pregunta de opción múltiple con retroalimentación inmediata y explicación.
 * Cierre metacognitivo estándar de cada módulo.
 */
export function Quiz({ question, options, correctIndex, explanation, optionNotes }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const groupName = useId();
  const attempts = useRef(0);
  const { track } = useTelemetry();

  const handleVerify = () => {
    attempts.current += 1;
    setSubmitted(true);
    track('quiz-answer', {
      q: question.slice(0, 120),
      chosen: selected,
      correct: selected === correctIndex,
      attempts: attempts.current,
    }, currentModuleSlug());
  };

  const isCorrect = submitted && selected === correctIndex;

  return (
    <div className="my-6 rounded border border-ink-200 bg-white p-5 shadow-sm">
      <p className="mb-3 flex items-start gap-2 font-medium text-ink-900">
        <CircleHelp aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
        <MathText text={question} />
      </p>
      <fieldset disabled={submitted} className="space-y-2">
        <legend className="sr-only">Opciones de respuesta</legend>
        {options.map((opt, i) => (
          <label
            key={i}
            className={clsx(
              'flex cursor-pointer items-start gap-2.5 rounded border px-3 py-2 text-sm transition-colors',
              submitted && i === correctIndex && 'border-success-300 bg-success-50',
              submitted && selected === i && i !== correctIndex && 'border-danger-300 bg-danger-50',
              !submitted && selected === i && 'border-brand-400 bg-brand-50',
              !submitted && selected !== i && 'border-ink-200 hover:bg-ink-50'
            )}
          >
            <input
              type="radio"
              name={groupName}
              checked={selected === i}
              onChange={() => setSelected(i)}
              className="mt-0.5 accent-brand-600"
            />
            <span className="text-ink-700">
              <MathText text={opt} />
              {submitted && optionNotes?.[i] && (
                <span className="mt-0.5 block text-xs text-ink-500">
                  <MathText text={optionNotes[i]!} />
                </span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      {!submitted ? (
        <button
          type="button"
          disabled={selected === null}
          onClick={handleVerify}
          className="mt-4 rounded bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Verificar
        </button>
      ) : (
        <div
          className={clsx(
            'mt-4 rounded border px-4 py-3 text-sm animate-fade-in',
            isCorrect ? 'border-success-200 bg-success-50 text-success-900' : 'border-warning-200 bg-warning-50 text-warning-900'
          )}
          role="status"
        >
          <p className="mb-1 font-semibold">{isCorrect ? '✓ ¡Correcto!' : '✗ No exactamente.'}</p>
          <p><MathText text={explanation} /></p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setSelected(null);
            }}
            className="mt-2 text-xs font-medium underline hover:no-underline"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
