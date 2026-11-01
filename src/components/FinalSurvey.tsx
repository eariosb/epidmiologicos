'use client';

// Instrumento C: encuesta final, SUS (ES) + ítems de la propuesta +
// abiertas + NPS (doc 05). Solo visible con telemetría activa.

import { FeedbackForm } from '@/components/FeedbackForm';
import { susFinalItems } from '@/lib/survey-items';

const COURSE_ITEMS = [
  { id: 'sas_acordeones', type: 'likert' as const, label: 'Los acordeones con el equivalente en SAS me ayudaron a comparar con R.' },
  { id: 'decision_panels', type: 'likert' as const, label: 'Los paneles de decisión metodológica me obligaron a pensar, no solo a ejecutar código.' },
];

export function FinalSurvey() {
  return (
    <FeedbackForm
      instrument="sus-final"
      items={susFinalItems(COURSE_ITEMS)}
      title="Encuesta final de la prueba de campo (~7 min)"
      intro="Escala 1–5: 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo. Anónima; orienta la siguiente versión del curso."
      submitLabel="Enviar encuesta final"
    />
  );
}
