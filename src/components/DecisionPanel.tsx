'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Scale } from 'lucide-react';

const SLIDER = 'w-full accent-brand-600';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '—');

interface DecisionPanelProps {
  /** Id opcional para que la DecisionCard capture el estado del panel. */
  panelId?: string;
  /** Reducción absoluta de riesgo puntual (r_control − r_tratamiento). */
  arr: number;
  /** Límites del IC95% de la reducción absoluta. */
  arrLo?: number;
  arrHi?: number;
  /** Nombre del evento que se evita, p. ej. "recaída" o "muerte". */
  eventLabel?: string;
  title?: ReactNode;
  note?: ReactNode;
}

/**
 * Panel de decisión con umbral NNT de Sinclair (J Clin Epidemiol 2001):
 * tratar cuando NNT < NNT_T, con NNT_T = V·(1 − AER·RV) / Ct.
 *   V   = valor de evitar un evento (en $)
 *   Ct  = costo de tratar a un paciente
 *   AER = tasa de eventos adversos atribuibles al tratamiento
 *   RV  = peso relativo del evento adverso frente al evento evitado
 * El veredicto compara el IC del NNT contra el umbral: recomendar /
 * no recomendar / zona gris (la evidencia no decide).
 */
export function DecisionPanel({
  panelId,
  arr,
  arrLo,
  arrHi,
  eventLabel = 'evento',
  title,
  note,
}: DecisionPanelProps) {
  const [v, setV] = useState(100000);       // valor de evitar el evento, $
  const [ct, setCt] = useState(500);        // costo por paciente tratado, $
  const [aer, setAer] = useState(0.02);     // tasa de eventos adversos
  const [rv, setRv] = useState(0.2);        // peso relativo del AE

  const harmWeight = aer * rv;
  const nntT =
    ct > 0 && harmWeight < 1 ? (v * (1 - harmWeight)) / ct : NaN;

  const harmful = arrHi !== undefined && arrHi <= 0;
  const ciCrossesZero =
    arrLo !== undefined && arrHi !== undefined && arrLo <= 0 && arrHi > 0;
  const nnt = arr > 0 ? 1 / arr : NaN;
  // Peor y mejor NNT dentro del IC (solo si el IC no cruza cero)
  const nntWorst = !ciCrossesZero && !harmful && arrLo !== undefined && arrLo > 0
    ? 1 / arrLo
    : NaN;
  const nntBest = !ciCrossesZero && !harmful && arrHi !== undefined && arrHi > 0
    ? 1 / arrHi
    : NaN;

  let verdict: 'si' | 'no' | 'gris';
  let why: string;
  if (harmful) {
    verdict = 'no';
    why = 'El IC completo está del lado del daño: el tratamiento aumenta el evento. No es un problema de umbral, es daño.';
  } else if (ciCrossesZero) {
    verdict = 'gris';
    why = 'El IC95% de la reducción incluye el cero: la evidencia no descarta ni beneficio ni daño. Respuesta honesta: más información.';
  } else if (Number.isFinite(nntWorst) && nntWorst <= nntT) {
    verdict = 'si';
    why = `Incluso en el peor caso del IC (NNT = ${fmt(nntWorst, 0)}), el tratamiento está por debajo del umbral NNT_T = ${fmt(nntT, 0)}.`;
  } else if (Number.isFinite(nntBest) && nntBest > nntT) {
    verdict = 'no';
    why = `Ni el mejor caso del IC (NNT = ${fmt(nntBest, 0)}) alcanza el umbral NNT_T = ${fmt(nntT, 0)}.`;
  } else if (Number.isFinite(nnt) && Number.isFinite(nntT)) {
    verdict = 'gris';
    why = `El umbral (${fmt(nntT, 0)}) cruza el IC del NNT [${fmt(nntWorst, 0)}–${fmt(nntBest, 0)}]: la decisión es sensible a la incertidumbre.`;
  } else {
    verdict = 'gris';
    why = 'Se necesitan ARR y umbrales válidos para emitir veredicto.';
  }

  const chip =
    verdict === 'si'
      ? 'bg-success-100 text-success-800 border-success-300'
      : verdict === 'no'
        ? 'bg-danger-100 text-danger-800 border-danger-300'
        : 'bg-warning-100 text-warning-800 border-warning-300';
  const chipLabel =
    verdict === 'si' ? 'Recomendar' : verdict === 'no' ? 'No recomendar' : 'Zona gris: más evidencia';

  // Publica el estado del panel para que la DecisionCard lo capture.
  useEffect(() => {
    if (!panelId) return;
    window.dispatchEvent(
      new CustomEvent('epi:decision-panel', {
        detail: {
          panelId,
          verdict,
          chipLabel,
          nnt,
          nntBest,
          nntWorst,
          nntT,
          v,
          ct,
          aer,
          rv,
        },
      }),
    );
  }, [panelId, verdict, chipLabel, nnt, nntBest, nntWorst, nntT, v, ct, aer, rv]);

  const sliders: Array<{
    label: string; val: number; set: (x: number) => void;
    min: number; max: number; step: number; fmt: (x: number) => string;
  }> = [
    { label: `Valor de evitar un ${eventLabel} (V)`, val: v, set: setV,
      min: 10000, max: 500000, step: 5000, fmt: (x) => `$${(x / 1000).toFixed(0)}k` },
    { label: 'Costo por paciente tratado (Ct)', val: ct, set: setCt,
      min: 50, max: 5000, step: 50, fmt: (x) => `$${x}` },
    { label: 'Tasa de eventos adversos (AER)', val: aer, set: setAer,
      min: 0, max: 0.3, step: 0.005, fmt: (x) => `${(x * 100).toFixed(1)}%` },
    { label: 'Peso relativo del AE vs. evento (RV)', val: rv, set: setRv,
      min: 0, max: 1, step: 0.05, fmt: (x) => x.toFixed(2) },
  ];

  return (
    <figure className="my-6 rounded border border-ink-200 bg-white p-4 shadow-sm">
      <figcaption className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
        <Scale className="h-4 w-4 text-brand-700" aria-hidden />
        {title ?? <>Panel de decisión: umbral NNT de Sinclair</>}
      </figcaption>

      <div className="grid gap-3 sm:grid-cols-2">
        {sliders.map((s) => (
          <label key={s.label} className="block text-xs text-ink-600">
            {s.label}: <strong className="text-ink-800">{s.fmt(s.val)}</strong>
            <input
              type="range"
              className={SLIDER}
              min={s.min} max={s.max} step={s.step}
              value={s.val}
              onChange={(e) => s.set(Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${chip}`}>
          {chipLabel}
        </span>
        <span className="text-xs text-ink-600">
          NNT observado = <strong>{fmt(nnt, 0)}</strong>
          {Number.isFinite(nntWorst) && Number.isFinite(nntBest) && (
            <> · IC [{fmt(nntBest, 0)}–{fmt(nntWorst, 0)}]</>
          )}
          {' · '}umbral NNT_T = <strong>{Number.isFinite(nntT) ? fmt(nntT, 0) : 'imposible (daños ≥ beneficio)'}</strong>
        </span>
      </div>
      <p className="mt-1.5 text-xs text-ink-600">{why}</p>

      {note && <p className={NOTE}>{note}</p>}
      <p className={NOTE}>
        NNT_T = V·(1 − AER·RV)/Ct, el umbral de Sinclair: los daños del
        tratamiento (AER·RV) se descuentan del valor del evento evitado antes
        de dividir por el costo. La zona gris es una respuesta legítima: cuando
        el IC cruza el umbral, la respuesta correcta es más información, no
        una moneda al aire (value of information, módulo 17).
      </p>
    </figure>
  );
}
