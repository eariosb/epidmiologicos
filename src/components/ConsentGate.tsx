'use client';

// Consentimiento informado v1 ('v1-2026-10'): texto del doc 04 §3.
// Dos casillas (aceptar registro / opt-in de contenido) + salida sin registro.
// Al aceptar: persiste en /api/consent (auditoría servidor) e inicia la
// telemetría local con initTelemetry.

import { useState } from 'react';
import { disableTelemetry, initTelemetry } from '@/lib/telemetry';

const CONSENT_VERSION = 'v1-2026-10';

interface ConsentGateProps {
  courseName: string;
  token: string;
  participantCode: string;
  /** Llamado tras decidir (aceptar o continuar sin registro). */
  onDone: (consented: boolean) => void;
}

export function ConsentGate({ courseName, token, participantCode, onDone }: ConsentGateProps) {
  const [accept, setAccept] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!accept) return;
    setBusy(true);
    initTelemetry(token, {
      contentOptIn: optIn,
      consentVersion: CONSENT_VERSION,
      participantCode,
    });
    // Registro del consentimiento en servidor (mejor esfuerzo: el uso no se
    // bloquea si esta llamada falla).
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-participant-token': token },
      body: JSON.stringify({ consentVersion: CONSENT_VERSION, contentOptIn: optIn }),
    }).catch(() => {});
    onDone(true);
  };

  const skip = () => {
    disableTelemetry();
    onDone(false);
  };

  return (
    <section className="mx-auto my-10 max-w-2xl rounded-lg border border-brand-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-bold text-ink-900">
        Consentimiento informado · Prueba de campo de la plataforma de cursos
      </h1>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
        <p>
          Estás invitado(a) a participar en una prueba de uso de la plataforma
          interactiva del curso <strong>{courseName}</strong>, Universidad
          Nacional de Colombia, con fines de mejoramiento docente y evaluación
          del material.
        </p>
        <p className="font-semibold text-ink-800">Qué se registra si aceptas:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Qué módulos visitas y cuánto tiempo permaneces en cada uno.</li>
          <li>Con qué simuladores interactúas (botones, parámetros que mueves).</li>
          <li>Qué celdas de código ejecutas y si producen error.</li>
          <li>Qué siglas consultas con el cursor, tus respuestas a los quizzes, tus capturas en la pizarra y tu uso del asistente.</li>
          <li>Datos técnicos básicos: tipo de navegador y tamaño de pantalla.</li>
        </ul>
        <p>
          <strong>Qué NO se registra:</strong> tu nombre, correo, dirección IP,
          calificaciones, ni nada fuera de la plataforma.
        </p>
        <p>
          Tus datos se identifican con tu código <strong>{participantCode}</strong>,
          no con tu nombre. Solo el docente investigador accede a los datos; los
          resultados se reportan de forma agregada. Puedes revisar tus datos,
          corregirlos o <strong>retirarte en cualquier momento</strong> desde la
          página de privacidad o escribiendo al docente; el retiro borra todo
          lo registrado. Participar o no participar{' '}
          <strong>no afecta tus calificaciones</strong>.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 accent-brand-600"
          />
          He leído y acepto el registro descrito.
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 accent-brand-600"
          />
          Además, acepto que se guarde el texto que escriba en la plataforma
          (código R que modifique, preguntas al asistente), <em>opcional</em>.
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={!accept || busy}
          className="rounded bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Acepto participar
        </button>
        <button
          type="button"
          onClick={skip}
          className="text-sm text-ink-500 underline decoration-dotted hover:text-ink-700"
        >
          Continuar sin registro
        </button>
      </div>
    </section>
  );
}
