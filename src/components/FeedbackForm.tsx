'use client';

// Formulario genérico de encuestas de la prueba de campo.
// Recibe instrument + items (likert|choice|open|nps), POSTea a /api/feedback
// con el token del participante y emite el evento survey-submit.
// Especificación: prueba-campo/docs/05-instrumentos-encuesta.md §implementación.

import { useState, type ReactNode } from 'react';
import { getTelemetryCtx, track, telemetryEnabled } from '@/lib/telemetry';
import type { SurveyItem, SurveyResponses } from '@/lib/survey-items';

const LIKERT = ['1', '2', '3', '4', '5'];
const LIKERT_LABELS = { 1: 'Totalmente en desacuerdo', 5: 'Totalmente de acuerdo' };

interface FeedbackFormProps {
  instrument: 'pretest' | 'post-module' | 'sus-final' | 'exit';
  items: SurveyItem[];
  /** Requerido para post-module. */
  moduleSlug?: string;
  title: ReactNode;
  intro?: ReactNode;
  submitLabel?: string;
  onSubmitted?: () => void;
}

export function FeedbackForm({
  instrument,
  items,
  moduleSlug,
  title,
  intro,
  submitLabel = 'Enviar respuestas',
  onSubmitted,
}: FeedbackFormProps) {
  const [answers, setAnswers] = useState<SurveyResponses>({});
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  if (!telemetryEnabled()) return null;
  const token = getTelemetryCtx()?.token;

  const likertCount = items.filter((i) => i.type === 'likert').length;
  const likertDone = items.filter(
    (i) => i.type === 'likert' && answers[i.id] !== undefined,
  ).length;
  const npsOk = !items.some((i) => i.type === 'nps') || answers['nps'] !== undefined;
  const ready = likertDone === likertCount && npsOk;

  const submit = async () => {
    if (!ready || !token) return;
    setState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-participant-token': token },
        body: JSON.stringify({ instrument, moduleSlug, responses: answers }),
      });
      if (!res.ok) throw new Error();
      track('survey-submit', { instrument }, moduleSlug);
      setState('done');
      onSubmitted?.();
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="my-6 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
        ✓ Gracias: tu respuesta quedó registrada.
      </div>
    );
  }

  return (
    <section className="my-8 rounded-lg border border-brand-200 bg-brand-50/40 px-5 py-4">
      <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      {intro && <p className="mt-1 text-xs text-ink-500">{intro}</p>}

      <div className="mt-3 space-y-4">
        {items.map((item) => (
          <div key={item.id}>
            <p className="mb-1.5 text-xs font-medium text-ink-700">{item.label}</p>

            {item.type === 'likert' && (
              <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label={item.label}>
                {LIKERT.map((v) => (
                  <label
                    key={v}
                    className={`cursor-pointer rounded border px-2.5 py-1 text-xs ${
                      answers[item.id] === Number(v)
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      className="sr-only"
                      checked={answers[item.id] === Number(v)}
                      onChange={() => setAnswers({ ...answers, [item.id]: Number(v) })}
                    />
                    {v}
                  </label>
                ))}
                <span className="ml-1 text-[10px] text-ink-400">
                  {LIKERT_LABELS[1]} → {LIKERT_LABELS[5]}
                </span>
              </div>
            )}

            {item.type === 'choice' && (
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={item.label}>
                {item.options.map((opt) => (
                  <label
                    key={opt}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                      answers[item.id] === opt
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      className="sr-only"
                      checked={answers[item.id] === opt}
                      onChange={() => setAnswers({ ...answers, [item.id]: opt })}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {item.type === 'open' && (
              <textarea
                rows={item.rows ?? 3}
                className="w-full rounded border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-800 focus:border-brand-400 focus:outline-none"
                value={(answers[item.id] as string) ?? ''}
                onChange={(e) => setAnswers({ ...answers, [item.id]: e.target.value })}
              />
            )}

            {item.type === 'nps' && (
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={item.label}>
                {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                  <label
                    key={v}
                    className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                      answers[item.id] === v
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      className="sr-only"
                      checked={answers[item.id] === v}
                      onChange={() => setAnswers({ ...answers, [item.id]: v })}
                    />
                    {v}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!ready || state === 'sending'}
          className="rounded bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === 'sending' ? 'Enviando…' : submitLabel}
        </button>
        {!ready && (
          <span className="text-[11px] text-ink-400">
            Responde las escala 1–5{items.some((i) => i.type === 'nps') ? ' y el 0–10' : ''} para enviar.
          </span>
        )}
        {state === 'error' && (
          <span className="text-xs text-danger-600" role="alert">No se pudo enviar. Intenta de nuevo.</span>
        )}
      </div>
    </section>
  );
}
