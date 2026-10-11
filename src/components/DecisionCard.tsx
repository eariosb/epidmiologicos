'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

const INPUT =
  'w-full rounded border border-ink-200 px-2.5 py-1.5 text-sm text-ink-800 focus:border-brand-400 focus:outline-none bg-white';

interface DecisionCardProps {
  /** Identificador único, p. ej. "decision-05-lidocaina". */
  id: string;
  title: string;
  /** Si se pasa, captura en vivo el estado del DecisionPanel con ese panelId. */
  panelId?: string;
  /** Opciones de decisión; por defecto recomendar / no / más evidencia. */
  options?: string[];
}

interface PanelState {
  verdict: 'si' | 'no' | 'gris';
  chipLabel: string;
  nnt: number;
  nntBest: number;
  nntWorst: number;
  nntT: number;
  v: number;
  ct: number;
  aer: number;
  rv: number;
}

interface CardState {
  decision: string;
  rationale: string;
  reflection: string;
  savedAt?: string;
}

const fmt = (x: number, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : '—');

/**
 * Tarjeta de decisión: memo evaluable del laboratorio de decisión.
 * Si recibe panelId, captura en vivo el estado del DecisionPanel
 * (veredicto, NNT, umbral, sliders) y lo inserta en el memo — el
 * estudiante escribe solo los juicios. Persiste en localStorage.
 */
export function DecisionCard({ id, title, panelId, options }: DecisionCardProps) {
  const key = `epi-decision:${id}`;
  const opts = options ?? [
    'Recomendar la intervención',
    'No recomendar la intervención',
    'La evidencia no decide: recolectar más información',
  ];
  const [st, setSt] = useState<CardState>({ decision: '', rationale: '', reflection: '' });
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const s = JSON.parse(raw) as CardState;
        setSt(s);
        if (s.savedAt) setSaved(s.savedAt);
      }
    } catch { /* storage no disponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!panelId) return;
    const onState = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.panelId === panelId) setPanel(d as PanelState);
    };
    window.addEventListener('epi:decision-panel', onState);
    return () => window.removeEventListener('epi:decision-panel', onState);
  }, [panelId]);

  const save = () => {
    const s: CardState = { ...st, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(key, JSON.stringify({ ...s, panel }));
      setSaved(s.savedAt!);
    } catch { /* storage no disponible */ }
  };

  const chip =
    !panel
      ? 'border-ink-200 bg-white text-ink-500'
      : panel.verdict === 'si'
        ? 'bg-success-100 text-success-800 border-success-300'
        : panel.verdict === 'no'
          ? 'bg-danger-100 text-danger-800 border-danger-300'
          : 'bg-warning-100 text-warning-800 border-warning-300';

  return (
    <section className="my-6 overflow-hidden rounded-lg border border-brand-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-brand-200 bg-brand-50 px-4 py-2">
        <ClipboardCheck className="h-4 w-4 text-brand-700" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Memo de decisión
        </span>
        <span className="text-sm font-semibold text-ink-800">{title}</span>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Lo que los datos y el panel ya calcularon — se ve en el memo */}
        <div className="rounded border border-ink-200 bg-ink-50 px-3 py-2 text-xs">
          <p className="mb-1 font-semibold text-ink-600">Evidencia capturada del panel</p>
          {panel ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-ink-700">
              <span>NNT = <strong>{fmt(panel.nnt)}</strong></span>
              {Number.isFinite(panel.nntBest) && Number.isFinite(panel.nntWorst) && (
                <span>IC [{fmt(panel.nntBest)}–{fmt(panel.nntWorst)}]</span>
              )}
              <span>umbral NNT_T = <strong>{Number.isFinite(panel.nntT) ? fmt(panel.nntT) : '∅'}</strong></span>
              <span className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-semibold ${chip}`}>
                {panel.chipLabel}
              </span>
            </div>
          ) : (
            <p className="text-ink-500">
              Mueve los sliders del panel de decisión de arriba; este memo
              captura el veredicto y los números automáticamente.
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold text-ink-600">Mi decisión</p>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <label
                key={o}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                  st.decision === o
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name={`dec-${id}`}
                  className="sr-only"
                  checked={st.decision === o}
                  onChange={() => setSt({ ...st, decision: o })}
                />
                {o}
              </label>
            ))}
          </div>
        </div>

        <label className="block text-xs font-semibold text-ink-600">
          Justificación: por qué los números de arriba sostienen (o no) mi decisión
          <textarea
            className={`${INPUT} mt-1`}
            rows={2}
            placeholder="Ej.: el IC completo está del lado del daño; el umbral nunca entra en juego."
            value={st.rationale}
            onChange={(e) => setSt({ ...st, rationale: e.target.value })}
          />
        </label>

        <label className="block text-xs font-semibold text-ink-600">
          Principio de Woodward que pesa aquí y sensibilidad de la decisión
          <textarea
            className={`${INPUT} mt-1`}
            rows={2}
            placeholder="Ej.: principio 4: el IC, no el p, condena a la lidocaína. La decisión es insensible a los sliders porque…"
            value={st.reflection}
            onChange={(e) => setSt({ ...st, reflection: e.target.value })}
          />
        </label>

        {/* Vista previa del memo tal como queda en el portafolio */}
        {(st.decision || st.rationale || st.reflection) && (
          <div className="rounded border-l-4 border-brand-500 bg-brand-50/50 px-3 py-2 text-xs text-ink-700">
            <p className="font-semibold text-ink-800">MEMO: {title}</p>
            {st.decision && <p><strong>Decisión:</strong> {st.decision}</p>}
            {panel && (
              <p><strong>Con umbral:</strong> NNT {fmt(panel.nnt)} vs NNT_T {Number.isFinite(panel.nntT) ? fmt(panel.nntT) : '∅'} → {panel.chipLabel}</p>
            )}
            {st.rationale && <p><strong>Hechos:</strong> {st.rationale}</p>}
            {st.reflection && <p><strong>Juicio:</strong> {st.reflection}</p>}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            className="rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            Guardar en el portafolio
          </button>
          {saved && (
            <span className="text-xs text-success-700">
              Guardada · {new Date(saved).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
