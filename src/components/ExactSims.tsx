'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { MathText } from '@/lib/math-text';
import { SimGuide, SimLegend } from '@/components/SimBits';
import {
  agrestiCaffoRD,
  cornfieldCI,
  logOrCorrected,
  newcombeRD,
  nForPower,
  normCdf,
  normQuantile,
  pZeroCell,
  powerAt,
  rejectionMask,
  tableIndex,
  woolfCI,
} from '@/lib/exact2x2';
import { runExact } from '@/lib/exactRunner';
import { uiGrid } from '@/lib/exactTasks';
import { tokens } from '@/lib/tokens';
import { useExactTask } from '@/hooks/useExactTask';
import {
  CI_METHODS,
  type CIMethodKey,
  exactCoverage,
  lengthDistribution,
  nClassic,
  nGuaranteeExact,
  nOriginalFormula,
  probL,
} from '@/lib/precision';

const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const CELL_INPUT =
  'w-16 rounded border border-ink-200 px-1.5 py-0.5 text-center text-xs focus:border-brand-400 focus:outline-none';
const SLIDER = 'w-full accent-brand-600';
const fmt = (x: number, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '—');
/** Coordenadas SVG redondeadas: evita hydration mismatch por diferencias
 *  de punto flotante entre Node (SSR) y el navegador. */
const rr = (v: number) => Math.round(v * 100) / 100;

/** Malla del parámetro de estorbo de los exploradores (la misma del worker). */
const GRID_UI_SIZE = uiGrid().length;

/* ================================================================== */
/* Shared bits                                                          */
/* ================================================================== */

function CountInput({
  label, value, onChange, max = 60,
}: {
  label: string; value: number; onChange: (v: number) => void; max?: number;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-ink-600">
      <span className="font-mono">{label}</span>
      <input
        type="number" min={0} max={max} value={value}
        onChange={(e) => {
          const v = Math.max(0, Math.min(max, Math.round(Number(e.target.value) || 0)));
          onChange(v);
        }}
        className={CELL_INPUT}
      />
    </label>
  );
}

interface TableInput {
  x1: number; n1: number; x2: number; n2: number;
}

function TableInputs({
  t, setT, max = 60, label1 = 'grupo 1', label2 = 'grupo 2',
}: {
  t: TableInput; setT: (t: TableInput) => void; max?: number;
  label1?: string; label2?: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
      <fieldset className="rounded border border-danger-200 bg-danger-50/50 px-2 pb-1.5 pt-0.5">
        <legend className="px-1 text-[10px] font-semibold text-danger-700">{label1}</legend>
        <div className="flex gap-3">
          <CountInput label="x₁" value={t.x1} max={t.n1}
            onChange={(v) => setT({ ...t, x1: Math.min(v, t.n1) })} />
          <CountInput label="n₁" value={t.n1} max={max}
            onChange={(v) => setT({ ...t, n1: Math.max(1, v), x1: Math.min(t.x1, Math.max(1, v)) })} />
        </div>
      </fieldset>
      <fieldset className="rounded border border-info-200 bg-info-50/50 px-2 pb-1.5 pt-0.5">
        <legend className="px-1 text-[10px] font-semibold text-info-700">{label2}</legend>
        <div className="flex gap-3">
          <CountInput label="x₂" value={t.x2} max={t.n2}
            onChange={(v) => setT({ ...t, x2: Math.min(v, t.n2) })} />
          <CountInput label="n₂" value={t.n2} max={max}
            onChange={(v) => setT({ ...t, n2: Math.max(1, v), x2: Math.min(t.x2, Math.max(1, v)) })} />
        </div>
      </fieldset>
    </div>
  );
}

/** Generic SVG line chart for small series. */
function LinePlot({
  series, width = 560, height = 190, xLabel, yLabel, xTicks, yTicks,
  xmin, xmax, ymin, ymax, hline,
}: {
  series: { x: number[]; y: number[]; color: string; dash?: boolean }[];
  width?: number; height?: number;
  xLabel: string; yLabel: string;
  xTicks?: number[]; yTicks?: number[];
  xmin: number; xmax: number; ymin: number; ymax: number;
  hline?: { y: number; label?: string };
}) {
  const L = 46, R = 10, T = 10, B = 30;
  const px = (v: number) => rr(L + ((v - xmin) / (xmax - xmin)) * (width - L - R));
  const py = (v: number) => rr(T + (1 - (v - ymin) / (ymax - ymin)) * (height - T - B));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl" role="img"
      aria-label={`${yLabel} en función de ${xLabel}`}>
      {(yTicks ?? []).map((v) => (
        <g key={v}>
          <line x1={px(xmin)} x2={px(xmax)} y1={py(v)} y2={py(v)} stroke={tokens.chart.grid} />
          <text x={L - 5} y={py(v) + 3} textAnchor="end" fontSize={9} fill={tokens.chart.text}>{v}</text>
        </g>
      ))}
      {(xTicks ?? []).map((v) => (
        <text key={v} x={px(v)} y={height - B + 13} textAnchor="middle" fontSize={9} fill={tokens.chart.text}>{v}</text>
      ))}
      {hline && (
        <>
          <line x1={px(xmin)} x2={px(xmax)} y1={py(hline.y)} y2={py(hline.y)}
            stroke={tokens.chart.tick} strokeDasharray="4 3" />
          {hline.label && (
            <text x={px(xmax) - 4} y={py(hline.y) - 3} textAnchor="end" fontSize={9} fill={tokens.chart.text}>
              {hline.label}
            </text>
          )}
        </>
      )}
      {series.map((s, i) => (
        <polyline key={i} fill="none" stroke={s.color} strokeWidth={1.8}
          strokeDasharray={s.dash ? '4 2.5' : undefined}
          points={s.x.map((v, j) => `${px(v)},${py(s.y[j])}`).join(' ')} />
      ))}
      <line x1={px(xmin)} x2={px(xmax)} y1={py(ymin)} y2={py(ymin)} stroke={tokens.chart.tick} />
      <line x1={px(xmin)} x2={px(xmin)} y1={py(ymin)} y2={py(ymax)} stroke={tokens.chart.tick} />
      <foreignObject x={px((xmin + xmax) / 2) - 60} y={height - 18} width={120} height={16}>
        <div style={{ fontSize: 10, color: tokens.chart.title, textAlign: 'center', lineHeight: '16px' }}>
          <MathText text={`$${xLabel}$`} />
        </div>
      </foreignObject>
      <foreignObject x={4} y={py(ymax) + 1} width={200} height={16}>
        <div style={{ fontSize: 10, color: tokens.chart.title, lineHeight: '16px' }}>
          <MathText text={`$${yLabel}$`} />
        </div>
      </foreignObject>
    </svg>
  );
}

/* ================================================================== */
/* 1. ExactTestExplorer: todos los valores p y el mapa de decisiones     */
/* ================================================================== */

const PROCEDURES = [
  { key: 'pFisher', name: 'Fisher (condicional)', kind: 'condicional' },
  { key: 'pMid', name: 'Fisher mid-p', kind: 'condicional' },
  { key: 'pZ', name: 'z agrupada (incondicional)', kind: 'incondicional' },
  { key: 'pBoschloo', name: 'Boschloo', kind: 'incondicional' },
  { key: 'pBergerBoos', name: 'Berger–Boos (γ = 0.001)', kind: 'incondicional' },
] as const;

type PKey = (typeof PROCEDURES)[number]['key'];

const CELL_STATE = {
  neither: tokens.chart.gridSoft,
  both: tokens.chart.primary,
  onlyU: tokens.chart.secondary, // incondicional rechaza, Fisher no
  onlyF: tokens.chart.alert, // Fisher rechaza, incondicional no
} as const;

export function ExactTestExplorer({ title }: { title?: ReactNode }) {
  const [t, setT] = useState<TableInput>({ x1: 7, n1: 34, x2: 1, n2: 34 });
  const [alpha, setAlpha] = useState(0.05);
  const [compare, setCompare] = useState<PKey>('pBoschloo');

  // Table space computed in the worker (synchronous fallback when disabled).
  const { result: ts, pending: tsPending } = useExactTask(
    'tableSpace',
    t.n1 <= 60 && t.n2 <= 60
      ? { n1: t.n1, n2: t.n2, grid: 'ui', bergerBoos: true }
      : null,
    [t.n1, t.n2],
  );

  const obs = ts ? tableIndex(t.x1, t.x2, t.n2) : 0;
  const maskF = useMemo(() => (ts ? rejectionMask(ts.pFisher, alpha) : null), [ts, alpha]);
  const maskU = useMemo(
    () => (ts ? rejectionMask(ts[compare] as Float64Array, alpha) : null),
    [ts, alpha, compare]
  );

  // Classification of each table cell for the decision map.
  const counts = useMemo(() => {
    if (!ts || !maskF || !maskU) return null;
    let both = 0, onlyU = 0, onlyF = 0, neither = 0;
    for (let k = 0; k < ts.count; k++) {
      const f = maskF[k] === 1, u = maskU[k] === 1;
      if (f && u) both++; else if (u) onlyU++; else if (f) onlyF++; else neither++;
    }
    return { both, onlyU, onlyF, neither };
  }, [ts, maskF, maskU]);

  const pVals = ts
    ? PROCEDURES.map((p) => ({
        ...p,
        p: p.key === 'pBergerBoos' ? (ts.pBergerBoos?.[obs] ?? NaN) : ts[p.key as 'pFisher'][obs],
      }))
    : [];

  // Decision-map cell size.
  const W = 320, H = 320;
  const cw = ts ? W / (t.n2 + 1) : 0;
  const ch = ts ? H / (t.n1 + 1) : 0;
  const cellColor = (x1: number, x2: number) => {
    const k = tableIndex(x1, x2, t.n2);
    const f = maskF![k] === 1, u = maskU![k] === 1;
    if (f && u) return CELL_STATE.both;
    if (u) return CELL_STATE.onlyU;
    if (f) return CELL_STATE.onlyF;
    return CELL_STATE.neither;
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'La misma tabla, cinco procedimientos: quién rechaza y dónde'}
      </div>

      <TableInputs t={t} setT={setT} />

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-600">
        <label>
          α ={' '}
          <select value={alpha} onChange={(e) => setAlpha(Number(e.target.value))}
            className="rounded border border-ink-200 px-1 py-0.5">
            <option value={0.01}>0.01</option>
            <option value={0.05}>0.05</option>
            <option value={0.10}>0.10</option>
          </select>
        </label>
        <label>
          Comparar contra:{' '}
          <select value={compare} onChange={(e) => setCompare(e.target.value as PKey)}
            className="rounded border border-ink-200 px-1 py-0.5">
            <option value="pBoschloo">Boschloo</option>
            <option value="pZ">z agrupada</option>
            <option value="pMid">mid-p</option>
            <option value="pBergerBoos">Berger–Boos</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="py-1 pr-2 font-medium">procedimiento</th>
                <th className="py-1 pr-2 font-medium">tipo</th>
                <th className="py-1 pr-2 text-right font-medium">valor p</th>
                <th className="py-1 text-right font-medium">rechaza α</th>
              </tr>
            </thead>
            <tbody>
              {pVals.map((r) => (
                <tr key={r.key} className="border-b border-ink-100">
                  <td className="py-1 pr-2 text-ink-700">{r.name}</td>
                  <td className="py-1 pr-2 text-ink-500">{r.kind}</td>
                  <td className="py-1 pr-2 text-right font-mono">{fmt(r.p, 4)}</td>
                  <td className="py-1 text-right">
                    {r.p <= alpha ? (
                      <span className="font-semibold text-danger-700">sí</span>
                    ) : (
                      <span className="text-ink-400">no</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
            Los valores p condicionales (Fisher, mid-p) suponen ambos márgenes fijos;
            los incondicionales maximizan sobre el parámetro de estorbo bajo el modelo
            de dos binomiales independientes.
          </p>
        </div>

        <div>
          {ts && maskF && maskU && (
            <div className="animate-fade-in">
              <svg viewBox={`0 0 ${W + 60} ${H + 34}`} className="w-full" role="img"
                aria-label="Mapa de decisiones sobre el espacio de tablas">
                {Array.from({ length: t.n1 + 1 }, (_, x1) =>
                  Array.from({ length: t.n2 + 1 }, (_, x2) => (
                    <rect
                      key={`${x1}-${x2}`}
                      x={40 + x2 * cw}
                      y={4 + (t.n1 - x1) * ch}
                      width={Math.max(cw - 0.4, 0.6)}
                      height={Math.max(ch - 0.4, 0.6)}
                      fill={cellColor(x1, x2)}
                    />
                  ))
                )}
                {/* observed cell marker */}
                <rect
                  x={40 + t.x2 * cw - 1}
                  y={4 + (t.n1 - t.x1) * ch - 1}
                  width={cw + 2}
                  height={ch + 2}
                  fill="none"
                  stroke={tokens.chart.axis}
                  strokeWidth={1.6}
                />
                <text x={40 + W / 2} y={H + 22} textAnchor="middle" fontSize={10} fill={tokens.chart.title}>x₂</text>
                <text x={14} y={H / 2} fontSize={10} fill={tokens.chart.title}
                  transform={`rotate(-90 14 ${H / 2})`} textAnchor="middle">x₁</text>
              </svg>
              <SimLegend
                className="mt-1"
                items={[
                  { color: CELL_STATE.both, label: 'ambos rechazan', mark: 'bar' },
                  { color: CELL_STATE.onlyU, label: `solo ${PROCEDURES.find(p => p.key === compare)?.name.split(' ')[0]}`, mark: 'bar' },
                  { color: CELL_STATE.onlyF, label: 'solo Fisher', mark: 'bar' },
                  { color: CELL_STATE.neither, label: 'ninguno rechaza', mark: 'bar' },
                ]}
              />
              {counts && (
                <p className="mt-1 text-[11px] text-ink-500">
                  {(t.n1 + 1) * (t.n2 + 1)} tablas posibles: {counts.onlyU} con veredicto
                  «{PROCEDURES.find(p => p.key === compare)?.name} sí / Fisher no»
                  {counts.onlyF > 0 ? `, ${counts.onlyF} al revés` : ''}. El recuadro negro
                  marca tu tabla observada.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {(t.n1 > 60 || t.n2 > 60) && (
        <p className="mt-3 rounded border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-800">
          La enumeración exhaustiva se calcula para n₁, n₂ ≤ 60 por fluidez en el
          navegador; reduce los tamaños para ver el mapa de decisiones.
        </p>
      )}
      {t.n1 <= 60 && t.n2 <= 60 && !ts && tsPending && (
        <p className="mt-3 text-center text-xs text-ink-400">Calculando…</p>
      )}
      <SimGuide>
        La tabla por defecto es Perondi et al. (2004): 7/34 niños sobrevivieron 24 h con
        dosis estándar (grupo 1) vs. 1/34 con dosis alta (grupo 2). Con α = 0.05 el
        veredicto depende del procedimiento: Fisher dice «no», Boschloo dice «sí». Mueve
        x₁, x₂ o los tamaños y mira cómo cambia la franja naranja del mapa: esas son las
        tablas donde elegir el test cambia la conclusión.
      </SimGuide>
      <p className={NOTE}>
        Cálculo exacto por enumeración de las (n₁+1)(n₂+1) tablas bajo dos binomiales
        independientes; el supremo sobre el parámetro de estorbo se evalúa en una malla
        de {GRID_UI_SIZE} puntos. Con n₁, n₂ ≤ 60 el cálculo es inmediato en el
        navegador. «Exacto» describe el cómputo, no la adecuación del modelo al diseño.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 2. ExactPowerExplorer: potencia y tamaño reales por enumeración       */
/* ================================================================== */

export function ExactPowerExplorer({ title }: { title?: ReactNode }) {
  const [p1, setP1] = useState(0.2);
  const [p2, setP2] = useState(0.03);
  const [alpha, setAlpha] = useState(0.05);
  const [nSel, setNSel] = useState(34);
  const [busy, setBusy] = useState(false);

  // Rejection regions at the selected n (per procedure), in the worker.
  const { result: tsN } = useExactTask(
    'tableSpace',
    { n1: nSel, n2: nSel, grid: 'ui' },
    [nSel],
  );
  const masks = useMemo(
    () =>
      tsN
        ? {
            fisher: rejectionMask(tsN.pFisher, alpha),
            midp: rejectionMask(tsN.pMid, alpha),
            z: rejectionMask(tsN.pZ, alpha),
            boschloo: rejectionMask(tsN.pBoschloo, alpha),
          }
        : null,
    [tsN, alpha]
  );

  const { result: sizeCurves } = useExactTask('sizeCurves', { n: nSel, alpha }, [nSel, alpha]);

  // Power-vs-n and discordance-vs-n, computed on demand for n = 10..60.
  const [curves, setCurves] = useState<{
    n: number[]; fisher: number[]; boschloo: number[]; z: number[]; disc: number[];
  } | null>(null);

  const computeCurves = () => {
    setBusy(true);
    const ns = Array.from({ length: 51 }, (_, i) => i + 10);
    runExact('powerCurves', { ns, alpha, p1, p2 })
      .then(setCurves)
      .catch(() => setCurves(null))
      .finally(() => setBusy(false));
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Potencia y tamaño reales: Fisher vs. procedimientos incondicionales'}
      </div>

      <div className="grid gap-x-6 gap-y-2 text-xs text-ink-600 md:grid-cols-4">
        <label>
          p₁ (referencia) = {fmt(p1, 3)}
          <input type="range" min={0.01} max={0.6} step={0.005} value={p1}
            onChange={(e) => setP1(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          p₂ = {fmt(p2, 3)}
          <input type="range" min={0.005} max={0.6} step={0.005} value={p2}
            onChange={(e) => setP2(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          n por grupo = {nSel}
          <input type="range" min={8} max={60} step={1} value={nSel}
            onChange={(e) => setNSel(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          α ={' '}
          <select value={alpha} onChange={(e) => setAlpha(Number(e.target.value))}
            className="rounded border border-ink-200 px-1 py-0.5">
            <option value={0.01}>0.01</option>
            <option value={0.05}>0.05</option>
            <option value={0.10}>0.10</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-medium text-ink-600">
            Potencia exacta en (p₁, p₂) con n = {nSel} por grupo
          </p>
          {(!tsN || !masks || !sizeCurves) && (
            <p className="py-6 text-center text-xs text-ink-400">Calculando…</p>
          )}
          {tsN && masks && sizeCurves && (
            <div className="animate-fade-in">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="py-1 font-medium">procedimiento</th>
                <th className="py-1 text-right font-medium">potencia</th>
                <th className="py-1 text-right font-medium">tamaño máx. bajo H₀</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Fisher', 'fisher', sizeCurves.fisher],
                  ['mid-p', 'midp', sizeCurves.midp],
                  ['z agrupada', 'z', sizeCurves.z],
                  ['Boschloo', 'boschloo', sizeCurves.boschloo],
                ] as const
              ).map(([name, key, sc]) => (
                <tr key={key} className="border-b border-ink-100">
                  <td className="py-1 text-ink-700">{name}</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(powerAt(tsN, masks[key], p1, p2), 3)}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {sc ? fmt(Math.max(...sc), 4) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LinePlot
            series={[
              { x: Array.from(sizeCurves.grid), y: Array.from(sizeCurves.fisher), color: tokens.chart.primary },
              { x: Array.from(sizeCurves.grid), y: Array.from(sizeCurves.boschloo), color: tokens.chart.secondary },
              { x: Array.from(sizeCurves.grid), y: Array.from(sizeCurves.z), color: tokens.chart.tertiary },
            ]}
            xmin={0} xmax={1} ymin={0} ymax={Math.max(0.06, alpha * 1.4)}
            xLabel="p" yLabel="P_p(\mathrm{rechazo})"
            xTicks={[0, 0.25, 0.5, 0.75, 1]}
            yTicks={[0, alpha, Math.max(0.06, alpha * 1.4)].map(v => Math.round(v * 100) / 100)}
            hline={{ y: alpha, label: 'α' }}
            height={170}
          />
            </div>
          )}
          <p className="mt-1 text-[11px] text-ink-500">
            Probabilidad de rechazar bajo H₀ como función del valor común p. Las curvas
            escalonadas reflejan que el espacio muestral es discreto: ningún α nominal
            se agota exactamente.
          </p>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium text-ink-600">
            Potencia y discordancia como función de n (enumeración exacta por cada n)
          </p>
          {!curves && (
            <button
              onClick={computeCurves}
              disabled={busy}
              className="rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Calculando…' : `Calcular para n = 10…60 en (p₁, p₂) actuales`}
            </button>
          )}
          {curves && (
            <>
              <LinePlot
                series={[
                  { x: curves.n, y: curves.fisher, color: tokens.chart.primary },
                  { x: curves.n, y: curves.boschloo, color: tokens.chart.secondary },
                  { x: curves.n, y: curves.z, color: tokens.chart.tertiary },
                ]}
                xmin={10} xmax={60} ymin={0} ymax={1}
                xLabel="n" yLabel="\mathrm{potencia}"
                xTicks={[10, 20, 30, 40, 50, 60]}
                yTicks={[0, 0.25, 0.5, 0.75, 1]}
                height={180}
              />
              <LinePlot
                series={[{ x: curves.n, y: curves.disc, color: tokens.chart.alert }]}
                xmin={10} xmax={60} ymin={0} ymax={Math.max(0.15, ...curves.disc) * 1.15}
                xLabel="n" yLabel="\mathrm{discordancia}"
                xTicks={[10, 20, 30, 40, 50, 60]}
                height={130}
              />
              <button onClick={() => setCurves(null)} className="mt-1 rounded border border-ink-200 px-2 py-0.5 text-[11px] text-ink-600 hover:bg-ink-100">
                Recalcular con otros (p₁, p₂, α)
              </button>
            </>
          )}
        </div>
      </div>

      <SimLegend
        className="mt-2"
        items={[
          { color: tokens.chart.primary, label: 'Fisher' },
          { color: tokens.chart.secondary, label: 'Boschloo' },
          { color: tokens.chart.tertiary, label: 'z agrupada' },
          { color: tokens.chart.alert, label: 'P(decisiones opuestas Fisher–Boschloo)' },
        ]}
      />
      <SimGuide>
        Fija p₁ y p₂ en un escenario clínicamente plausible y calcula las curvas: la
        discordancia oscila con n porque el espacio muestral es discreto; más datos no
        siempre significan menos desacuerdo. En un escenario hipotético tipo Perondi
        (p₁ = 0.20, p₂ = 0.03) la potencia de Fisher a n = 34 es ~0.43 y la de Boschloo
        ~0.55.
      </SimGuide>
      <p className={NOTE}>
        Toda la curva es exacta por enumeración (sin Monte Carlo); el supremo sobre el
        parámetro de estorbo usa una malla de {GRID_UI_SIZE} puntos. La «potencia
        observada» post hoc no es esto: esto es un cálculo prospectivo sobre un
        escenario declarado antes de ver los datos.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 3. CorrectionExplorer: correcciones, sesgo-varianza y cobertura       */
/* ================================================================== */

export function CorrectionExplorer({ title }: { title?: ReactNode }) {
  const [t, setT] = useState<TableInput>({ x1: 7, n1: 34, x2: 1, n2: 34 });
  const [c, setC] = useState(0.5);
  const [showCoverage, setShowCoverage] = useState(false);

  const { result: ts } = useExactTask(
    'tableSpace',
    { n1: t.n1, n2: t.n2, grid: 'ui' },
    [t.n1, t.n2],
  );

  const p1o = t.x1 / t.n1, p2o = t.x2 / t.n2;
  const thetaTrue =
    p1o > 0 && p1o < 1 && p2o > 0 && p2o < 1
      ? Math.log((p1o / (1 - p1o)) / (p2o / (1 - p2o)))
      : NaN;

  // ECM curve over c evaluated at (p1o, p2o), in the worker.
  const { result: curve } = useExactTask(
    'ecmCurve',
    Number.isFinite(thetaTrue)
      ? { n1: t.n1, n2: t.n2, thetaTrue, p1: p1o, p2: p2o }
      : null,
    [t.n1, t.n2, thetaTrue, p1o, p2o],
  );

  const orEst = Math.exp(logOrCorrected(t.x1, t.n1, t.x2, t.n2, c));
  const wCI = woolfCI(t.x1, t.n1, t.x2, t.n2, c);
  const exactCI = cornfieldCI(t.x1, t.n1, t.x2, t.n2);
  const pZero = ts ? pZeroCell(ts, p1o, p2o) : NaN;
  const rdAC = agrestiCaffoRD(t.x1, t.n1, t.x2, t.n2);
  const rdNW = newcombeRD(t.x1, t.n1, t.x2, t.n2);
  const rd = p1o - p2o;

  const { result: coverage } = useExactTask(
    'coveragePair',
    showCoverage && Number.isFinite(thetaTrue)
      ? { n1: t.n1, n2: t.n2, c, p1: p1o, p2: p2o }
      : null,
    [showCoverage, t.n1, t.n2, c, p1o, p2o, thetaTrue],
  );

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Correcciones con celdas en cero: el precio de un estimador finito'}
      </div>

      <TableInputs t={t} setT={setT} />

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-xs text-ink-600">
            corrección aditiva c = {fmt(c, 2)}
            <input type="range" min={0} max={2} step={0.05} value={c}
              onChange={(e) => setC(Number(e.target.value))} className={SLIDER} />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">OR estimado</div>
              <div className="font-mono text-sm font-semibold text-ink-800">
                {Number.isFinite(orEst) ? fmt(orEst, 2) : '∞ (celda en cero)'}
              </div>
            </div>
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">IC Woolf (OR)</div>
              <div className="font-mono text-sm text-ink-800">
                [{fmt(Math.exp(wCI.lo), 2)}, {Number.isFinite(wCI.hi) ? fmt(Math.exp(wCI.hi), 1) : '∞'}]
              </div>
            </div>
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">IC exacto condicional (OR)</div>
              <div className="font-mono text-sm text-ink-800">
                [{fmt(Math.exp(exactCI.lo), 2)}, {Number.isFinite(exactCI.hi) ? fmt(Math.exp(exactCI.hi), 1) : '∞'}]
              </div>
            </div>
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">P(celda en cero) en (p̂₁, p̂₂)</div>
              <div className="font-mono text-sm text-ink-800">{fmt(pZero, 3)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-ink-600">
            <span className="font-semibold">RD = {fmt(rd, 3)}</span>{' '}
            · Agresti–Caffo [{fmt(rdAC.lo, 3)}, {fmt(rdAC.hi, 3)}]
            · Newcombe [{fmt(rdNW.lo, 3)}, {fmt(rdNW.hi, 3)}]
          </div>
        </div>

        <div>
          {curve && (
            <div className="animate-fade-in">
            <LinePlot
              series={[
                { x: curve.cs, y: curve.bias2, color: tokens.chart.bias },
                { x: curve.cs, y: curve.va, color: tokens.chart.variance },
                { x: curve.cs, y: curve.mse, color: tokens.chart.axis },
              ]}
              xmin={0} xmax={2}
              ymin={0} ymax={Math.max(...curve.mse, ...curve.va, ...curve.bias2) * 1.05}
              xLabel="c" yLabel="\mathrm{sesgo}^2,\ \mathrm{var},\ \mathrm{ECM}"
              xTicks={[0, 0.5, 1, 1.5, 2]}
              height={200}
            />
            </div>
          )}
          <SimLegend
            className="mt-1"
            items={[
              { color: tokens.chart.bias, label: 'sesgo² en (p̂₁, p̂₂)' },
              { color: tokens.chart.variance, label: 'varianza' },
              { color: tokens.chart.axis, label: 'ECM = sesgo² + varianza' },
            ]}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-ink-600">
            <input type="checkbox" checked={showCoverage}
              onChange={(e) => setShowCoverage(e.target.checked)} />
            Calcular cobertura exacta de los IC en (p̂₁, p̂₂); tarda unos segundos
          </label>
          {coverage && (
            <p className="mt-1 text-xs text-ink-700">
              Cobertura real: Woolf (c={fmt(c, 2)}) = <b>{fmt(coverage.woolf, 3)}</b> · exacto
              condicional = <b>{fmt(coverage.exact, 3)}</b> (nominal 0.95).
            </p>
          )}
        </div>
      </div>

      <SimGuide>
        Con c = 0 el OR suele ser ∞ si hay celdas en cero. Sube c: la varianza cae pero el
        sesgo crece; el ECM tiene un mínimo interior. En Perondi el óptimo puntual está
        cerca de c ≈ 0.8, pero promediado sobre la posterior de Jeffreys cae a ≈ 0.5:
        casi exactamente la corrección de Haldane. La RD apenas se mueve: la fragilidad
        es de la escala OR, no de los datos.
      </SimGuide>
      <p className={NOTE}>
        Estimador corregido θ̂_c = log[(x₁+c)(n₂−x₂+c) / ((n₁−x₁+c)(x₂+c))]; ECM calculado por
        enumeración exacta evaluado en (p̂₁, p̂₂) de tu tabla. Un c óptimo en un punto no
        es una recomendación universal: depende del escenario verdadero, que es lo que
        se estima.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 4. SampleSizeExplorer (módulo 5): precisión vs. potencia             */
/* ================================================================== */

export function SampleSizeExplorer({ title }: { title?: ReactNode }) {
  const [p2, setP2] = useState(0.03); // referencia
  const [p1, setP1] = useState(0.2);
  const alpha = 0.05; // la fórmula y la tabla se presentan a α = 5% bilateral
  const [targetPower, setTargetPower] = useState(0.8);
  const [loss, setLoss] = useState(0.1);

  const nFormula = nForPower(p1, p2, alpha, targetPower);
  const nAdj = Math.ceil(nFormula / (1 - loss));

  // Exact power of the pooled-z rejection region at n = nFormula and nAdj (worker).
  const { result: exact } = useExactTask(
    'exactPowerPair',
    Number.isFinite(nFormula) && nFormula <= 80 && nFormula >= 4
      ? { nFormula, nAdj, alpha, p1, p2 }
      : null,
    [nFormula, nAdj, p1, p2, alpha],
  );

  // Power-vs-n normal-approx curve (instant) + exact dots at the two n's.
  const curve = useMemo(() => {
    const ns: number[] = [], pw: number[] = [];
    const za = normQuantile(1 - alpha / 2);
    const d = Math.abs(p1 - p2);
    if (d === 0) return null;
    const nMax = Math.min(200, Math.max(20, Math.ceil(nAdj * 1.6)));
    for (let n = 5; n <= nMax; n += 1) {
      const pb = (p1 + p2) / 2;
      const se0 = Math.sqrt(2 * pb * (1 - pb) / n);
      const se1 = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n);
      const z = (d - za * se0) / se1;
      // power ≈ Φ(z) for the two-sided test when p1 > p2
      const pow = normCdf(z);
      ns.push(n);
      pw.push(Math.min(1, Math.max(0, pow)));
    }
    return { ns, pw };
  }, [p1, p2, alpha, nAdj]);

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Tamaño muestral: la fórmula y su calibración exacta'}
      </div>

      <div className="grid gap-x-6 gap-y-2 text-xs text-ink-600 md:grid-cols-4">
        <label>
          p₁ (grupo 1) = {fmt(p1, 3)}
          <input type="range" min={0.01} max={0.7} step={0.005} value={p1}
            onChange={(e) => setP1(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          p₂ (grupo 2) = {fmt(p2, 3)}
          <input type="range" min={0.005} max={0.7} step={0.005} value={p2}
            onChange={(e) => setP2(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          potencia deseada = {fmt(targetPower, 2)}
          <input type="range" min={0.5} max={0.95} step={0.05} value={targetPower}
            onChange={(e) => setTargetPower(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          pérdidas en seguimiento = {(loss * 100).toFixed(0)}%
          <input type="range" min={0} max={0.4} step={0.05} value={loss}
            onChange={(e) => setLoss(Number(e.target.value))} className={SLIDER} />
        </label>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">n por grupo (fórmula)</div>
              <div className="font-mono text-sm font-semibold text-ink-800">
                {Number.isFinite(nFormula) ? nFormula : '—'}
              </div>
            </div>
            <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-ink-500">ajustado por pérdidas</div>
              <div className="font-mono text-sm font-semibold text-ink-800">
                {Number.isFinite(nAdj) ? nAdj : '—'}
              </div>
            </div>
          </div>
          {exact ? (
            <div className="animate-fade-in">
            <p className="mt-2 rounded bg-ink-50/60 px-2 py-1.5 text-[11px] leading-snug text-ink-600">
              {exact.fisherA >= targetPower ? (
                <>Con n={nAdj} por grupo, Fisher entrega {fmt(exact.fisherA * 100, 1)}%:
                  cumple el objetivo de {fmt(targetPower * 100, 0)}%. El n={nFormula} de la
                  fórmula se quedaba en {fmt(exact.fisherF * 100, 1)}%.</>
              ) : (
                <>Ni siquiera el n={nAdj} ajustado alcanza el objetivo: Fisher entrega
                  {' '}{fmt(exact.fisherA * 100, 1)}% frente al {fmt(targetPower * 100, 0)}%
                  pedido. Los tests incondicionales (z, Boschloo) llegan más cerca.</>
              )}
            </p>
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-500">
                  <th className="py-1 font-medium">test</th>
                  <th className="py-1 text-right font-medium">n={nFormula} (fórmula)</th>
                  <th className="py-1 text-right font-medium">n={nAdj} (ajustado)</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['Fisher', exact.fisherF, exact.fisherA],
                  ['z agrupada', exact.zF, exact.zA],
                  ['Boschloo', exact.boschF, exact.boschA],
                ] as const).map(([name, f, a]) => (
                  <tr key={name} className="border-b border-ink-100">
                    <td className="py-1 text-ink-700">{name}</td>
                    <td className={`py-1 text-right font-mono ${f >= targetPower ? 'text-success-700 font-semibold' : 'text-danger-650'}`}>
                      {fmt(f, 3)}
                    </td>
                    <td className={`py-1 text-right font-mono ${a >= targetPower ? 'text-success-700 font-semibold' : 'text-danger-650'}`}>
                      {fmt(a, 3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-[10px] text-ink-400">
              Verde: alcanza la potencia deseada ({fmt(targetPower * 100, 0)}%); rojo: queda por debajo.
            </p>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-ink-500">
              La verificación exacta por enumeración se muestra cuando n ≤ 80 por grupo.
            </p>
          )}
          <p className="mt-2 text-[11px] leading-snug text-ink-500">
            La fórmula asume el test z asintótico. La potencia exacta muestra lo que el
            diseño realmente entrega con cada procedimiento: con p₂ pequeña la χ² deja
            de cumplir el nominal y la fórmula queda corta.
          </p>
        </div>

        <div>
          {curve && (
            <LinePlot
              series={[{ x: curve.ns, y: curve.pw, color: tokens.chart.primary }]}
              xmin={5} xmax={curve.ns[curve.ns.length - 1]}
              ymin={0} ymax={1}
              xLabel="n" yLabel="\mathrm{potencia}"
              xTicks={[0, Math.round(nAdj / 2), nAdj, curve.ns[curve.ns.length - 1]].filter((v, i, a) => v >= 0 && a.indexOf(v) === i)}
              yTicks={[0, 0.25, 0.5, 0.75, 1]}
              hline={{ y: targetPower, label: 'objetivo' }}
              height={190}
            />
          )}
          <SimLegend
            className="mt-1"
            items={[{ color: tokens.chart.primary, label: 'potencia (aproximación normal del test z)' }]}
          />
        </div>
      </div>

      <SimGuide>
        Pon un escenario hipotético tipo Perondi (p₁ = 0.20, p₂ = 0.03, 80%): la fórmula
        pide ~55 por grupo; el ensayo real usó 34, así que con ese escenario su potencia
        con Fisher habría sido ~0.43. Baja
        p₂ hacia eventos raros y verás cómo la potencia exacta se aleja de la curva
        asintótica: ahí es donde el módulo 6 calibra la fórmula por enumeración.
      </SimGuide>
      <p className={NOTE}>
        Fórmula de Fleiss/Woodward para dos proporciones balanceadas, α = 5% bilateral;
        el ajuste por pérdidas es n/(1 − ℓ). La curva es la aproximación normal; la tabla
        es potencia exacta por enumeración del espacio de tablas, no Monte Carlo.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 5. CIMethodsExplorer: métodos de IC para una proporción + cobertura   */
/* ================================================================== */

const METHOD_COLORS: Record<CIMethodKey, string> = {
  wald: tokens.chart.alert,
  wilson: tokens.chart.primary,
  agrestiCoull: tokens.chart.tertiary,
  jeffreys: tokens.chart.aux,
  clopperPearson: tokens.ui.boardWood,
  lr: tokens.chart.secondary,
};

export function CIMethodsExplorer({ title }: { title?: ReactNode }) {
  const [x, setX] = useState(2);
  const [n, setN] = useState(30);
  const [conf, setConf] = useState(0.95);
  const [sel, setSel] = useState<CIMethodKey[]>(['wald', 'wilson', 'jeffreys', 'lr']);

  const xc = Math.max(0, Math.min(Math.round(x), Math.round(n)));
  const nc = Math.max(1, Math.min(Math.round(n), 400));

  const rows = useMemo(
    () =>
      sel.map((k) => {
        const ci = CI_METHODS[k].fn(xc, nc, conf);
        return {
          key: k,
          label: CI_METHODS[k].label,
          ...ci,
          L: ci.hi - ci.lo,
          admisible: ci.lo >= 0 && ci.hi <= 1 && ci.hi > ci.lo,
        };
      }),
    [sel, xc, nc, conf]
  );

  const coverage = useMemo(() => {
    const grid = new Float64Array(241);
    for (let i = 0; i < 241; i++) grid[i] = 0.002 + 0.004133 * i;
    return {
      grid,
      curves: sel.map((k) => ({
        key: k,
        label: CI_METHODS[k].label,
        color: METHOD_COLORS[k],
        cov: exactCoverage(grid, nc, k, conf),
      })),
    };
  }, [sel, nc, conf]);

  const phat = xc / nc;
  const W = 340, H = 30 + rows.length * 26;
  const px = (v: number) => rr(40 + v * (W - 60));

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Una proporción, seis intervalos: admisibilidad y cobertura'}
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 text-xs text-ink-600">
        <CountInput label="x" value={x} max={400} onChange={(v) => setX(v)} />
        <CountInput label="n" value={n} max={400} onChange={(v) => setN(Math.max(1, v))} />
        <label>
          1 − α ={' '}
          <select value={conf} onChange={(e) => setConf(Number(e.target.value))}
            className="rounded border border-ink-200 px-1 py-0.5">
            <option value={0.9}>0.90</option>
            <option value={0.95}>0.95</option>
            <option value={0.99}>0.99</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(Object.keys(CI_METHODS) as CIMethodKey[]).map((k) => (
            <label key={k} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={sel.includes(k)}
                onChange={(e) =>
                  setSel(e.target.checked ? [...sel, k] : sel.filter((s) => s !== k))
                }
              />
              <span style={{ color: METHOD_COLORS[k] }}>{CI_METHODS[k].label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
            aria-label="Intervalos de confianza por método">
            {/* inadmissible zones */}
            <rect x={40} y={4} width={px(0) - 40} height={H - 22} fill={tokens.status.dangerSoft} opacity={0.4} />
            <rect x={px(1)} y={4} width={W - 20 - px(1)} height={H - 22} fill={tokens.status.dangerSoft} opacity={0.4} />
            <line x1={px(0)} x2={px(0)} y1={4} y2={H - 22} stroke={tokens.chart.tick} />
            <line x1={px(1)} x2={px(1)} y1={4} y2={H - 22} stroke={tokens.chart.tick} />
            <line x1={px(phat)} x2={px(phat)} y1={4} y2={H - 22}
              stroke={tokens.chart.deep} strokeDasharray="3 3" />
            {rows.map((r, i) => {
              const yc = 16 + i * 26;
              return (
                <g key={r.key}>
                  <line x1={px(Math.max(-0.05, r.lo))} x2={px(Math.min(1.05, r.hi))}
                    y1={yc} y2={yc} stroke={METHOD_COLORS[r.key]} strokeWidth={3.5} />
                  <text x={8} y={yc + 3} fontSize={8} fill={r.admisible ? tokens.chart.deep : tokens.status.dangerText}>
                    {r.label.slice(0, 7)}
                  </text>
                </g>
              );
            })}
            <text x={px(phat)} y={H - 6} textAnchor="middle" fontSize={9} fill={tokens.chart.text}>
              p̂ = {fmt(phat, 3)}
            </text>
          </svg>
          <table className="mt-1 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="py-1 font-medium">método</th>
                <th className="py-1 text-right font-medium">inferior</th>
                <th className="py-1 text-right font-medium">superior</th>
                <th className="py-1 text-right font-medium">L</th>
                <th className="py-1 text-right font-medium">admisible</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-ink-100">
                  <td className="py-1" style={{ color: METHOD_COLORS[r.key] }}>{r.label}</td>
                  <td className="py-1 text-right font-mono">{fmt(r.lo, 4)}</td>
                  <td className="py-1 text-right font-mono">{fmt(r.hi, 4)}</td>
                  <td className="py-1 text-right font-mono">{fmt(r.L, 4)}</td>
                  <td className="py-1 text-right">
                    {r.admisible ? (
                      <span className="text-ink-400">sí</span>
                    ) : (
                      <span className="font-semibold text-danger-700">no</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <LinePlot
            series={coverage.curves.map((c) => ({
              x: Array.from(coverage.grid),
              y: Array.from(c.cov),
              color: c.color,
            }))}
            xmin={0} xmax={1}
            ymin={Math.max(0, conf - 0.28)} ymax={1.005}
            xLabel="p" yLabel="\mathrm{cobertura\ real}"
            xTicks={[0, 0.25, 0.5, 0.75, 1]}
            yTicks={[Math.max(0, Math.round((conf - 0.2) * 100) / 100), conf, 1]}
            hline={{ y: conf, label: `nominal ${conf}` }}
            height={230}
          />
          <SimLegend
            className="mt-1"
            items={coverage.curves.map((c) => ({ color: c.color, label: c.label }))}
          />
          <p className="mt-1 text-[11px] leading-snug text-ink-500">
            Cobertura exacta por enumeración binomial (sin Monte Carlo). La diente de
            sierra es la discreción del conteo; Wald subcubre con p extremos y puede dar
            límites fuera de [0,1].
          </p>
        </div>
      </div>

      <SimGuide>
        Pon x = 0 (brote sin casos): Wald colapsa a un punto, Wilson y Jeffreys dan
        cotas superiores honestas. Sube x/n cerca de 1 y observa quién se sale de
        [0,1]. La curva de cobertura muestra que ningún método nominal 95% cubre
        95% en todo p — pero Wilson y Jeffreys se quedan mucho más cerca que Wald.
      </SimGuide>
      <p className={NOTE}>
        Cobertura y admisibilidad calculadas por enumeración exacta de los n+1
        resultados posibles. Brown, Cai &amp; DasGupta (2001) documentan el comportamiento
        errático de Wald y recomiendan Wilson/Jeffreys en muestras pequeñas.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 6. PrecisionSampleSizeExplorer: L aleatoria y n con garantía          */
/* ================================================================== */

export function PrecisionSampleSizeExplorer({ title }: { title?: ReactNode }) {
  const [p, setP] = useState(0.1);
  const [usePrior, setUsePrior] = useState(false);
  const [priorA, setPriorA] = useState(5);
  const [priorB, setPriorB] = useState(45);
  const [L0, setL0] = useState(0.1);
  const conf = 0.95; // confianza del IC cuya longitud se garantiza
  const [garantia, setGarantia] = useState(0.9);
  const [method, setMethod] = useState<CIMethodKey>('wilson');
  const [nView, setNView] = useState(50);
  const [computed, setComputed] = useState<{
    nClassic: number; nExact: number; nOrig: number;
    sens: { L0: number[]; nc: number[]; ne: number[] };
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const prior: [number, number] | null = usePrior ? [priorA, priorB] : null;
  const pEff = usePrior ? priorA / (priorA + priorB) : p;

  const dist = useMemo(
    () => lengthDistribution(Math.min(nView, 500), usePrior ? null : p, method, conf, prior),
    [nView, p, method, conf, priorA, priorB, usePrior]
  );
  const pL = useMemo(
    () => probL(Math.min(nView, 500), L0, usePrior ? null : p, method, conf, prior),
    [nView, L0, p, method, conf, priorA, priorB, usePrior]
  );

  // Aggregate L mass function for the bar chart (L takes ≤ n+1 values but
  // many coincide; bin them for display).
  const bars = useMemo(() => {
    const m = new Map<number, number>();
    for (let i = 0; i < dist.L.length; i++) {
      const k = Math.round(dist.L[i] * 10000) / 10000;
      m.set(k, (m.get(k) ?? 0) + dist.prob[i]);
    }
    const entries = [...m.entries()].sort((a, b) => a[0] - b[0]).filter((e) => e[1] > 1e-5);
    return entries;
  }, [dist]);

  const compute = () => {
    setBusy(true);
    setTimeout(() => {
      const beta = 1 - garantia;
      const arg = usePrior ? null : p;
      const nc = nClassic(pEff, L0, conf);
      const no = nOriginalFormula(pEff, L0, 1 - conf, beta);
      let ne = NaN;
      try {
        ne = nGuaranteeExact(L0, arg, beta, method, conf, prior);
      } catch {
        ne = NaN;
      }
      const L0s: number[] = [], ncs: number[] = [], nes: number[] = [];
      for (let i = 0; i < 9; i++) {
        const l = L0 / 2 + ((L0 * 2 - L0 / 2) * i) / 8;
        L0s.push(l);
        ncs.push(nClassic(pEff, l, conf));
        try {
          nes.push(nGuaranteeExact(l, arg, beta, method, conf, prior, 30));
        } catch {
          nes.push(NaN);
        }
      }
      setComputed({ nClassic: nc, nExact: ne, nOrig: no, sens: { L0: L0s, nc: ncs, ne: nes } });
      setBusy(false);
    }, 30);
  };

  const WL = 340, HL = 180;
  const maxProb = Math.max(...bars.map((b) => b[1]), 0.01);
  const maxL = Math.max(...bars.map((b) => b[0]), L0 * 1.2);
  const lx = (v: number) => rr(40 + (v / maxL) * (WL - 55));
  const ly = (v: number) => rr(12 + (1 - v / maxProb) * (HL - 35));
  const bw = bars.length > 1 ? (lx(bars[1][0]) - lx(bars[0][0])) * 0.9 : 8;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'La longitud L es una variable aleatoria: distribución exacta y n con garantía'}
      </div>

      <div className="grid gap-x-5 gap-y-2 text-xs text-ink-600 md:grid-cols-4">
        <label>
          p (o media de la prior) = {fmt(pEff, 3)}
          <input type="range" min={0.005} max={0.5} step={0.005} value={pEff}
            disabled={usePrior}
            onChange={(e) => setP(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          L₀ tolerada = {fmt(L0, 3)}
          <input type="range" min={0.02} max={0.3} step={0.005} value={L0}
            onChange={(e) => setL0(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          garantía 1 − β = {fmt(garantia, 2)}
          <input type="range" min={0.5} max={0.99} step={0.01} value={garantia}
            onChange={(e) => setGarantia(Number(e.target.value))} className={SLIDER} />
        </label>
        <label>
          método de IC ={' '}
          <select value={method} onChange={(e) => setMethod(e.target.value as CIMethodKey)}
            className="rounded border border-ink-200 px-1 py-0.5">
            {(Object.keys(CI_METHODS) as CIMethodKey[]).filter((k) => k !== 'lr').map((k) => (
              <option key={k} value={k}>{CI_METHODS[k].label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-1 flex items-center gap-2 text-xs text-ink-600">
        <input type="checkbox" checked={usePrior} onChange={(e) => setUsePrior(e.target.checked)} />
        Incertidumbre sobre p: prior Beta(a, b) con
        a = <input type="number" min={0.1} step={0.5} value={priorA} disabled={!usePrior}
          onChange={(e) => setPriorA(Math.max(0.1, Number(e.target.value) || 0.1))}
          className={CELL_INPUT} /> y
        b = <input type="number" min={0.1} step={0.5} value={priorB} disabled={!usePrior}
          onChange={(e) => setPriorB(Math.max(0.1, Number(e.target.value) || 0.1))}
          className={CELL_INPUT} /> (garantía bayesiana, assurance)
      </label>
      {method === 'wald' && (
        <p className="mt-1 rounded border border-warning-200 bg-warning-50 px-2 py-1 text-[11px] text-warning-800">
          Ojo con Wald: cuando x = 0 la varianza estimada se anula y el IC colapsa a un
          punto (L = 0), así que esos resultados cuentan como «precisión lograda» y
          sobrestiman la garantía. Es exactamente la falla de Wald cerca del borde;
          compara con Wilson o Agresti–Coull en la misma configuración.
        </p>
      )}

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] font-medium text-ink-600">
            Distribución exacta de L con n = {nView} (desliza para cambiar n)
          </p>
          <input type="range" min={10} max={400} step={5} value={nView}
            onChange={(e) => setNView(Number(e.target.value))} className={SLIDER} />
          <svg viewBox={`0 0 ${WL} ${HL}`} className="mt-1 w-full" role="img"
            aria-label="Distribución de masa de la longitud L">
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <g key={g}>
                <line x1={40} x2={WL - 15} y1={ly(g * maxProb)} y2={ly(g * maxProb)} stroke={tokens.chart.grid} />
                <text x={36} y={ly(g * maxProb) + 3} textAnchor="end" fontSize={8} fill={tokens.chart.text}>
                  {(g * maxProb).toFixed(2)}
                </text>
              </g>
            ))}
            {bars.map(([L, pr]) => (
              <rect key={L}
                x={lx(L) - bw / 2} y={ly(pr)}
                width={Math.max(bw, 1.2)} height={ly(0) - ly(pr)}
                fill={L <= L0 ? tokens.chart.primary : tokens.chart.border} />
            ))}
            <line x1={lx(L0)} x2={lx(L0)} y1={12} y2={ly(0)}
              stroke={tokens.chart.alert} strokeDasharray="4 3" />
            <text x={lx(L0)} y={9} fontSize={9} fill={tokens.chart.alert} textAnchor="middle">L₀</text>
            <text x={(40 + WL - 15) / 2} y={HL - 4} textAnchor="middle" fontSize={10} fill={tokens.chart.title}>
              L
            </text>
          </svg>
          <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-ink-700">
            <span>E[L] = <b className="font-mono">{fmt(dist.E_L, 4)}</b></span>
            <span>P(L ≤ L₀) = <b className="font-mono">{fmt(pL, 3)}</b></span>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium text-ink-600">
            Tamaño muestral con P(L ≤ L₀) ≥ {fmt(garantia, 2)} garantizado
          </p>
          {!computed && (
            <button onClick={compute} disabled={busy}
              className="rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Calculando…' : 'Calcular n y curva de sensibilidad'}
            </button>
          )}
          {computed && (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-ink-500">clásica (≈50%)</div>
                  <div className="font-mono text-sm font-semibold">{computed.nClassic.toLocaleString()}</div>
                </div>
                <div className="rounded border border-brand-200 bg-brand-50/60 px-2 py-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-brand-700">exacta, garantía</div>
                  <div className="font-mono text-sm font-semibold">
                    {Number.isFinite(computed.nExact) ? computed.nExact.toLocaleString() : 'no alcanza'}
                  </div>
                </div>
                <div className="rounded border border-ink-100 bg-ink-50/60 px-2 py-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-ink-500">fórmula original (defectuosa)</div>
                  <div className="font-mono text-sm">{computed.nOrig.toLocaleString()}</div>
                </div>
              </div>
              <LinePlot
                series={[
                  { x: computed.sens.L0, y: computed.sens.nc, color: tokens.chart.tick },
                  {
                    x: computed.sens.L0.filter((_, i) => Number.isFinite(computed.sens.ne[i])),
                    y: computed.sens.ne.filter(Number.isFinite),
                    color: tokens.chart.primary,
                  },
                ]}
                xmin={computed.sens.L0[0]} xmax={computed.sens.L0[8]}
                ymin={0} ymax={Math.max(...computed.sens.ne.filter(Number.isFinite), ...computed.sens.nc) * 1.05}
                xLabel="L_0" yLabel="n"
                xTicks={computed.sens.L0.filter((_, i) => i % 4 === 0).map((v) => Math.round(v * 1000) / 1000)}
                height={180}
              />
              <button onClick={() => setComputed(null)}
                className="mt-1 rounded border border-ink-200 px-2 py-0.5 text-[11px] text-ink-600 hover:bg-ink-100">
                Recalcular con otros parámetros
              </button>
            </>
          )}
        </div>
      </div>

      <SimLegend
        className="mt-2"
        items={[
          { color: tokens.chart.primary, label: 'L ≤ L₀ (garantía)', mark: 'bar' },
          { color: tokens.chart.border, label: 'L > L₀', mark: 'bar' },
        ]}
      />
      <SimGuide>
        La fórmula clásica n = z²p(1−p)/δ² da una garantía de apenas ~50–60%: buena
        parte de los estudios replica un IC más ancho que el objetivo. Exigir
        P(L ≤ L₀) ≥ 0.90 cuesta el n «exacta» de la tabla. Activa la prior Beta
        para ver la garantía bayesiana: cuando p es incierto, un n calculado en el
        punto optimista queda corto; el mismo argumento del assurance del módulo 6.
      </SimGuide>
      <p className={NOTE}>
        Enumeración exacta de los n+1 valores de X; con prior Beta(a,b) los pesos son
        beta-binomiales (predictiva a priori). Ojo: P(L ≤ L₀) no es monótona en n
        (dientes de sierra por la discreción); el n reportado es el menor a partir del
        cual la garantía se sostiene en toda la ventana evaluada. La «fórmula original»
        se muestra solo para comparar: confunde L con la semiamplitud y trata z_β como
        si multiplicara la desviación de L. Por eso su n no es interpretable — suele
        quedar muy por encima del necesario, no por debajo. Referencias: Correa
        (seminario), Brown, Cai y DasGupta (2001), Rothman y Greenland (2018) y
        el paquete presize de R.
      </p>
    </div>
  );
}
