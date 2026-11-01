'use client';

// Panel de privacidad (derechos ARCO): muestra el estado del consentimiento,
// permite ver los propios datos (/api/mis-datos), cambiar el opt-in de
// contenido (/api/consent) y retirarse (/api/withdraw, borrado en cascada).
// Especificación: prueba-campo/docs/04-etica-consentimiento.md §4.2.

import { useEffect, useState } from 'react';
import {
  disableTelemetry,
  getTelemetryCtx,
  initTelemetry,
  type TelemetryCtx,
} from '@/lib/telemetry';

export function PrivacyToggle() {
  const [ctx, setCtx] = useState<TelemetryCtx | null>(null);
  const [data, setData] = useState<unknown | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setCtx(getTelemetryCtx());
  }, []);

  const showData = async () => {
    setStatus('Cargando…');
    const res = await fetch('/api/mis-datos', {
      headers: { 'x-participant-token': ctx?.token ?? '' },
    });
    setData(res.ok ? await res.json() : { error: `HTTP ${res.status}` });
    setStatus('');
  };

  const toggleOptIn = async (value: boolean) => {
    if (!ctx?.token) return;
    await fetch('/api/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-participant-token': ctx.token },
      body: JSON.stringify({ consentVersion: ctx.consentVersion, contentOptIn: value }),
    });
    initTelemetry(ctx.token, {
      contentOptIn: value,
      consentVersion: ctx.consentVersion,
      participantCode: ctx.participantCode,
    });
    setCtx(getTelemetryCtx());
  };

  const withdraw = async () => {
    if (!ctx?.token) return;
    if (!window.confirm(
      'Se borrará toda tu actividad registrada (eventos, sesiones, encuestas) ' +
      'y se desvinculará tu código. Esta acción no se puede deshacer. ¿Continuar?',
    )) return;
    setStatus('Retirando…');
    await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'x-participant-token': ctx.token },
    }).catch(() => {});
    disableTelemetry();
    setCtx(null);
    setData(null);
    setStatus('Listo: tu registro fue eliminado. El curso sigue funcionando sin telemetría.');
  };

  if (!ctx) {
    return (
      <div className="rounded border border-ink-200 bg-white p-5 text-sm text-ink-700">
        <p className="font-semibold text-ink-800">Sin registro activo</p>
        <p className="mt-1">
          La telemetría está desactivada en este navegador. Si participas en la
          prueba de campo y quieres activarla, vuelve a enrolarte con tu código.
        </p>
        {status && <p className="mt-2 text-success-700">{status}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border border-ink-200 bg-white p-5 text-sm text-ink-700">
      <div>
        <p className="font-semibold text-ink-800">Registro de prueba de campo activo</p>
        <p className="mt-1">
          Código de participante: <strong>{ctx.participantCode ?? '—'}</strong> ·
          Versión del consentimiento: <code>{ctx.consentVersion ?? '—'}</code>
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={!!ctx.contentOptIn}
          onChange={(e) => toggleOptIn(e.target.checked)}
          className="mt-0.5 accent-brand-600"
        />
        Guardar además el texto que escribo (código R, preguntas al asistente).
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={showData}
          className="rounded border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
        >
          Ver mis datos registrados
        </button>
        <button
          type="button"
          onClick={withdraw}
          className="rounded border border-danger-300 px-3 py-1.5 text-xs font-medium text-danger-700 hover:bg-danger-50"
        >
          Retirar mi consentimiento (borra todo)
        </button>
      </div>

      {status && <p className="text-success-700">{status}</p>}

      {data !== null && (
        <pre className="max-h-96 overflow-auto rounded bg-ink-900 p-3 text-xs text-ink-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
