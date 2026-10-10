'use client';

import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import clsx from 'clsx';
import { MathText } from '@/lib/math-text';

export interface QuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * Pregunta de opción múltiple con retroalimentación inmediata y explicación.
 * Cierre metacognitivo estándar de cada módulo.
 */
export function Quiz({ question, options, correctIndex, explanation }: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
              submitted && i === correctIndex && 'border-emerald-300 bg-emerald-50',
              submitted && selected === i && i !== correctIndex && 'border-red-300 bg-red-50',
              !submitted && selected === i && 'border-accent-400 bg-accent-50',
              !submitted && selected !== i && 'border-ink-200 hover:bg-ink-50'
            )}
          >
            <input
              type="radio"
              name={question}
              checked={selected === i}
              onChange={() => setSelected(i)}
              className="mt-0.5 accent-accent-600"
            />
            <span className="text-ink-700"><MathText text={opt} /></span>
          </label>
        ))}
      </fieldset>

      {!submitted ? (
        <button
          type="button"
          disabled={selected === null}
          onClick={() => setSubmitted(true)}
          className="mt-4 rounded bg-accent-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
        >
          Verificar
        </button>
      ) : (
        <div
          className={clsx(
            'mt-4 rounded border px-4 py-3 text-sm animate-fade-in',
            isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
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
