'use client';

// Micro-encuesta post-módulo (instrumento B del doc 05): 3 Likert + 1 abierta,
// <60 s. Se renderiza al final de cada módulo solo si la telemetría está
// activa. Estados locales:
//   ft-survey:<slug>       respondida — nunca más se muestra
//   ft-survey-later:<slug> pospuesta (timestamp de re-show, +3 días)
// El dedup real lo garantiza el servidor (última respuesta gana).

import { useEffect, useState } from 'react';
import { telemetryEnabled } from '@/lib/telemetry';
import { conceptFor } from '@/lib/survey-concepts';
import { postModuleItems } from '@/lib/survey-items';
import { FeedbackForm } from '@/components/FeedbackForm';

const doneKey = (slug: string) => `ft-survey:${slug}`;
const laterKey = (slug: string) => `ft-survey-later:${slug}`;
const REMIND_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function ModuleSurvey({ slug }: { slug: string }) {
  const [visible, setVisible] = useState(false); // optimista: no parpadear

  useEffect(() => {
    if (localStorage.getItem(doneKey(slug))) return;
    const later = Number(localStorage.getItem(laterKey(slug)) ?? 0);
    if (later && Date.now() < later) return;
    setVisible(true);
  }, [slug]);

  if (!telemetryEnabled() || !visible) return null;

  return (
    <div>
      <FeedbackForm
        instrument="post-module"
        moduleSlug={slug}
        items={postModuleItems(conceptFor(slug))}
        title="60 segundos: ¿cómo te fue con este módulo?"
        intro="Tu respuesta alimenta la revisión del material — es anónima y no afecta calificaciones."
        onSubmitted={() => {
          localStorage.setItem(doneKey(slug), '1');
          setVisible(false);
        }}
      />
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(laterKey(slug), String(Date.now() + REMIND_AFTER_MS));
          setVisible(false);
        }}
        className="mt-1 text-[11px] text-ink-400 underline decoration-dotted hover:text-ink-600"
      >
        Responder más tarde
      </button>
    </div>
  );
}
