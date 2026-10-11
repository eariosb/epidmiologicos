'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { tokens } from '@/lib/tokens';
import { SimGuide } from '@/components/SimBits';

const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const SLIDER = 'w-full accent-brand-600';
const CELL_INPUT =
  'w-16 rounded border border-ink-200 px-1.5 py-0.5 text-center text-xs focus:border-brand-400 focus:outline-none';
const TH = 'px-3 py-1.5 text-left text-xs font-semibold text-ink-600';
const TD = 'px-3 py-1.5 text-xs text-ink-800';

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: Row = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

function useCsvRows(file: string) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/data/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => live && setRows(parseCsv(t)))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [file]);
  return { rows, error };
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');

/* =========================== MissingDataLab ========================= */

type Mechanism = 'MCAR' | 'MAR' | 'MNAR';

const MECH_LABEL: Record<Mechanism, string> = {
  MCAR: 'MCAR — faltar no depende de nada',
  MAR: 'MAR — faltar depende de la edad (observada)',
  MNAR: 'MNAR — faltar depende del propio Kps',
};

/**
 * Tres mecanismos de Rubin inducidos sobre el Kps completo de VALUNG
 * (verdad conocida): el estudiante compara casos completos, imputación
 * por la media e imputación por regresión sobre la edad, y ve en qué
 * mecanismo falla cada método.
 */
export function MissingDataLab({ title }: { title?: ReactNode }) {
  const [mech, setMech] = useState<Mechanism>('MAR');
  const [rate, setRate] = useState(0.3);
  const { rows, error } = useCsvRows('valung.csv');

  const data = useMemo(() => {
    if (!rows) return null;
    return rows.map((r) => ({
      kps: parseFloat(r.Kps),
      age: parseFloat(r.Age),
    })).filter((d) => Number.isFinite(d.kps) && Number.isFinite(d.age));
  }, [rows]);

  const result = useMemo(() => {
    if (!data) return null;
    const truth = data.reduce((a, d) => a + d.kps, 0) / data.length;
    // Probabilidad de faltar segun el mecanismo (escalada a `rate`).
    const probs = data.map((d) => {
      if (mech === 'MCAR') return rate;
      if (mech === 'MAR') {
        // mayor edad -> mas probable faltar (logit centrado en la media)
        const meanAge = data.reduce((a, x) => a + x.age, 0) / data.length;
        const z = (d.age - meanAge) / 10;
        return Math.min(0.95, Math.max(0.02, rate * 2 * (1 / (1 + Math.exp(-z)))));
      }
      // MNAR: el propio valor decide — Kps bajo -> mas probable faltar
      const z = (80 - d.kps) / 20;
      return Math.min(0.95, Math.max(0.02, rate * 2 * (1 / (1 + Math.exp(-z)))));
    });
    // Bernoulli con probabilidad individual (semilla fija: captura estable)
    const rand = mulberry32(42);
    const isNa = probs.map((p) => rand() < p);
    const nMiss = isNa.filter(Boolean).length;
    const obs = data.filter((_, i) => !isNa[i]);
    const cc = obs.reduce((a, d) => a + d.kps, 0) / obs.length;
    // Imputacion por la media de los observados
    const meanImp =
      data.reduce((a, d, i) => a + (isNa[i] ? cc : d.kps), 0) / data.length;
    // Imputacion por regresion kps ~ age sobre observados
    const mx = obs.reduce((a, d) => a + d.age, 0) / obs.length;
    const my = cc;
    const b = obs.reduce((a, d) => a + (d.age - mx) * (d.kps - my), 0) /
      obs.reduce((a, d) => a + (d.age - mx) ** 2, 0);
    const regImp = data.reduce(
      (a, d, i) => a + (isNa[i] ? my + b * (d.age - mx) : d.kps),
      0
    ) / data.length;
    const actualRate = nMiss / data.length;
    return {
      truth,
      cc,
      meanImp,
      regImp,
      nMiss,
      actualRate,
      methods: [
        { name: 'Casos completos', value: cc },
        { name: 'Imputación por la media', value: meanImp },
        { name: 'Imputación por regresión (edad)', value: regImp },
      ],
    };
  }, [data, mech, rate]);

  const W = 540;
  const H = 180;
  if (error) return <div className={FIG}><p className="text-xs text-danger-600">{error}</p></div>;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Tres formas de faltar: MCAR, MAR y MNAR sobre el Kps de VALUNG'}
      </div>

      <div className="grid gap-x-4 gap-y-1 text-[11px] text-ink-600 sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-56 shrink-0">mecanismo: {mech}</span>
          <select
            value={mech}
            onChange={(e) => setMech(e.target.value as Mechanism)}
            className="rounded border border-ink-200 px-2 py-1"
          >
            {(['MCAR', 'MAR', 'MNAR'] as Mechanism[]).map((m) => (
              <option key={m} value={m}>{MECH_LABEL[m]}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44 shrink-0">tasa de faltantes ≈ {(rate * 100).toFixed(0)}%</span>
          <input
            type="range" min={0.05} max={0.6} step={0.05} value={rate}
            onChange={(e) => setRate(+e.target.value)} className={SLIDER}
          />
        </label>
      </div>

      {result && (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img"
            aria-label="Estimación de la media de Kps por método, contra la verdad completa">
            {(() => {
              const vals = [result.truth, ...result.methods.map((m) => m.value)];
              const lo = Math.min(...vals) - 2;
              const hi = Math.max(...vals) + 2;
              const y = (v: number) => H - 14 - ((v - lo) / (hi - lo)) * (H - 40);
              const xs = [90, 220, 350, 480];
              return (
                <>
                  <line x1={40} x2={W - 10} y1={y(result.truth)} y2={y(result.truth)}
                    stroke={tokens.status.ok} strokeWidth={2} strokeDasharray="6 3" />
                  <text x={W - 12} y={y(result.truth) - 5} textAnchor="end" fontSize={10}
                    fill={tokens.status.ok}>verdad completa = {fmt(result.truth, 1)}</text>
                  {result.methods.map((m, i) => (
                    <g key={m.name}>
                      <circle cx={xs[i + 1] - 30} cy={y(m.value)} r={5}
                        fill={Math.abs(m.value - result.truth) < 1.5 ? tokens.chart.primary : tokens.status.danger} />
                      <text x={xs[i + 1] - 30} y={H - 2} textAnchor="middle" fontSize={9}
                        fill={tokens.chart.tick}>
                        {['casos', 'media', 'regresión'][i]}
                      </text>
                      <text x={xs[i + 1] - 30} y={y(m.value) - 10} textAnchor="middle" fontSize={10}
                        fill={tokens.chart.tick}>{fmt(m.value, 1)}</text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>

          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr className="border-b border-ink-200">
                <th className={TH}>Método</th>
                <th className={`${TH} text-right`}>Media Kps</th>
                <th className={`${TH} text-right`}>Sesgo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink-100">
                <td className={TD}>Verdad (base completa)</td>
                <td className={`${TD} text-right`}>{fmt(result.truth, 2)}</td>
                <td className={`${TD} text-right`}>—</td>
              </tr>
              {result.methods.map((m) => (
                <tr key={m.name} className="border-b border-ink-100">
                  <td className={TD}>{m.name}</td>
                  <td className={`${TD} text-right`}>{fmt(m.value, 2)}</td>
                  <td className={`${TD} text-right ${Math.abs(m.value - result.truth) > 1.5 ? 'font-semibold text-danger-700' : 'text-ink-500'}`}>
                    {fmt(m.value - result.truth, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={NOTE}>
            {result.nMiss} de {data?.length ?? 0} valores borrados
            ({(result.actualRate * 100).toFixed(0)}% real). {mech === 'MCAR' &&
              'MCAR: los casos completos no sesgan, solo pierden precisión.'}
            {mech === 'MAR' &&
              'MAR: la edad explica quién falta — la regresión sobre la edad recupera parte del sesgo que los casos completos dejan.'}
            {mech === 'MNAR' &&
              'MNAR: quien falta tiene Kps bajo — ni la media ni la edad lo reparan; hace falta un análisis de sensibilidad.'}
          </p>
        </>
      )}

      <SimGuide>
        <li>Sube la tasa de faltantes bajo MNAR: el sesgo de casos completos crece en la dirección del mecanismo (Kps alto de sobra).</li>
        <li>Bajo MAR, compara casos completos vs. regresión: la variable observada rescata la estimación.</li>
        <li>Bajo MCAR todos los métodos son insesgados — la decisión entre ellos es de precisión, no de sesgo.</li>
      </SimGuide>
    </div>
  );
}

/* ========================== EValueCalculator ======================== */

function eValue(rr: number): number {
  const r = rr >= 1 ? rr : 1 / rr;
  return r + Math.sqrt(r * (r - 1));
}

/**
 * El E-value (VanderWeele & Ding 2017): qué tan fuerte tendría que ser
 * un confusor no medido — asociado con exposición y desenlace por ese
 * factor— para explicar por completo el RR observado, y para mover el
 * límite del IC más cercano a 1 hasta 1.
 */
export function EValueCalculator({ title }: { title?: ReactNode }) {
  const [rr, setRr] = useState(2.0);
  const [ciLo, setCiLo] = useState(1.4);

  const ePoint = eValue(rr);
  const eBound = ciLo > 0 && ciLo !== 1 ? eValue(ciLo) : null;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'E-value: ¿qué tan fuerte tendría que ser el confusor no medido?'}
      </div>

      <div className="grid gap-x-4 gap-y-2 text-[11px] text-ink-600 sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-44 shrink-0">RR observado = {rr.toFixed(2)}</span>
          <input type="range" min={1.01} max={10} step={0.01} value={rr}
            onChange={(e) => setRr(+e.target.value)} className={SLIDER} />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44 shrink-0">límite IC hacia 1 = {ciLo.toFixed(2)}</span>
          <input type="range" min={0.8} max={rr} step={0.01} value={Math.min(ciLo, rr)}
            onChange={(e) => setCiLo(+e.target.value)} className={SLIDER} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-brand-200 bg-brand-50/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-500">
            E-value del estimador
          </p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">
            {fmt(ePoint, 2)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">
            Un confusor no medido tendría que asociarse con la exposición{' '}
            <em>y</em> con el desenlace con RR ≥ {fmt(ePoint, 2)} cada uno,
            por encima de los ajustados, para anular el efecto observado.
          </p>
        </div>
        <div className="rounded border border-ink-200 p-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-500">
            E-value del límite del IC
          </p>
          <p className="mt-1 text-2xl font-semibold text-ink-800">
            {eBound ? fmt(eBound, 2) : '—'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-600">
            El confusor necesitaría RR ≥ {eBound ? fmt(eBound, 2) : '—'} en
            ambos caminos para que el intervalo de confianza incluya el nulo.
          </p>
        </div>
      </div>

      <p className={NOTE}>
        E = RR + √(RR·(RR−1)). No prueba causalidad ni ausencia de
        confusión — cuantifica cuánta confusión no medida haría falta, en
        la misma escala del efecto.
      </p>

      <SimGuide>
        <li>Prueba RR = 2: el confusor necesita dos asociaciones de 3.41 — más fuerte que la mayoría de confusores clínicos.</li>
        <li>Con RR = 1.2 el E-value cae a ~1.68: efectos modestos se explican con confusión plausible.</li>
        <li>El E-value del límite es la versión honesta: cuenta lo robusto que queda el hallazgo tras la incertidumbre.</li>
      </SimGuide>
    </div>
  );
}

/* ========================== BiasAnalysis2x2 ========================= */

/**
 * Análisis de sesgo cuantitativo en su forma más simple (Lash & Fox):
 * corregir la tabla 2×2 por una sensibilidad y especificidad supuestas
 * de la clasificación de la exposición. P_obs corregido vía
 * P_real = (P_obs + Sp − 1) / (Se + Sp − 1), por fila (caso/control).
 */
export function BiasAnalysis2x2({ title }: { title?: ReactNode }) {
  const [a, setA] = useState(33);   // caso, expuesto
  const [b, setB] = useState(55);   // caso, no expuesto
  const [c, setC] = useState(27);   // control, expuesto
  const [d, setD] = useState(55);   // control, no expuesto
  const [se, setSe] = useState(0.9);
  const [sp, setSp] = useState(0.9);

  const orObs = (a * d) / (b * c);

  const corrected = useMemo(() => {
    const p1 = a / (a + b);
    const p0 = c / (c + d);
    const fix = (p: number) => (p + sp - 1) / (se + sp - 1);
    const q1 = fix(p1);
    const q0 = fix(p0);
    if (!(q1 > 0 && q1 < 1 && q0 > 0 && q0 < 1)) return null;
    const a2 = q1 * (a + b);
    const c2 = q0 * (c + d);
    return { or: (a2 * (c + d - c2)) / ((a + b - a2) * c2), a2, c2 };
  }, [a, b, c, d, se, sp]);

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Análisis de sesgo cuantitativo: ¿y si la exposición se midió mal?'}
      </div>

      <p className="mb-2 text-xs text-ink-600">
        Tabla caso–control (filas: caso/control; columnas: expuesto/no):
      </p>
      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-700">
        <span>caso exp.
          <input type="number" value={a} min={0} className={CELL_INPUT}
            onChange={(e) => setA(Math.max(0, +e.target.value))} /></span>
        <span>caso no exp.
          <input type="number" value={b} min={0} className={CELL_INPUT}
            onChange={(e) => setB(Math.max(0, +e.target.value))} /></span>
        <span>control exp.
          <input type="number" value={c} min={0} className={CELL_INPUT}
            onChange={(e) => setC(Math.max(0, +e.target.value))} /></span>
        <span>control no exp.
          <input type="number" value={d} min={0} className={CELL_INPUT}
            onChange={(e) => setD(Math.max(0, +e.target.value))} /></span>
      </div>

      <div className="mt-3 grid gap-x-4 gap-y-1 text-[11px] text-ink-600 sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <span className="w-44 shrink-0">sensibilidad Se = {se.toFixed(2)}</span>
          <input type="range" min={0.5} max={1} step={0.01} value={se}
            onChange={(e) => setSe(+e.target.value)} className={SLIDER} />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-44 shrink-0">especificidad Sp = {sp.toFixed(2)}</span>
          <input type="range" min={0.5} max={1} step={0.01} value={sp}
            onChange={(e) => setSp(+e.target.value)} className={SLIDER} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-ink-200 p-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-500">OR observado</p>
          <p className="mt-1 text-2xl font-semibold text-ink-800">{fmt(orObs, 2)}</p>
        </div>
        <div className="rounded border border-brand-200 bg-brand-50/60 p-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-500">OR corregido</p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">
            {corrected ? fmt(corrected.or, 2) : 'no corregible'}
          </p>
          {corrected && (
            <p className="mt-1 text-xs text-ink-600">
              prevalencia corregida: casos {fmt(corrected.a2 / (a + b), 3)} ·
              controles {fmt(corrected.c2 / (c + d), 3)}
            </p>
          )}
          {!corrected && (
            <p className="mt-1 text-xs text-ink-600">
              Con Se = {se.toFixed(2)} y Sp = {sp.toFixed(2)} la prevalencia
              corregida sale de [0,1]: esa combinación es incompatible con
              los datos observados — también es un hallazgo.
            </p>
          )}
        </div>
      </div>

      <p className={NOTE}>
        La mala clasificación <em>no diferencial</em> (misma Se/Sp en casos y
        controles) suele atenuar el OR hacia 1 — pero no siempre: el sesgo
        depende de dónde queda la prevalencia corregida. Si la clasificación
        difiere entre casos y controles (recuerdo), la corrección necesita
        Se/Sp por fila.
      </p>

      <SimGuide>
        <li>Con Se = Sp = 1 el OR corregido = el observado: el ejercicio calibra.</li>
        <li>Baja Se a 0.8 manteniendo Sp: el OR corregido se aleja de 1 — el observado estaba atenuado.</li>
        <li>Lleva Se+Sp cerca de 1 (p. ej. 0.55/0.55): la corrección explota — medición casi aleatoria.</li>
      </SimGuide>
    </div>
  );
}
