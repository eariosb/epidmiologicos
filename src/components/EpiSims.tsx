'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { MathText } from '@/lib/math-text';
import { SimGuide, SimLegend } from '@/components/SimBits';

const BTN_MAIN =
  'rounded bg-accent-600 px-3 py-1 text-xs font-medium text-white hover:bg-accent-700';
const BTN_GHOST =
  'rounded border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:bg-ink-100';
const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const CELL_INPUT =
  'w-16 rounded border border-ink-200 px-1.5 py-0.5 text-center text-xs focus:border-accent-400 focus:outline-none';
const SLIDER = 'w-full accent-accent-600';

const EXP_COLOR = '#dc2626'; // rojo: expuestos / casos
const UNEXP_COLOR = '#0284c7'; // azul: no expuestos / controles
const GOLD = '#b45309';
const GRAY = '#9ca3af';

const fmt = (x: number, d = 3) =>
  Number.isFinite(x) ? x.toFixed(d) : '—';
/** Coordenadas SVG redondeadas: evita hydration mismatch por diferencias
 *  de punto flotante entre Node (SSR) y el navegador. */
const rnd = (v: number) => Math.round(v * 100) / 100;

/* ================================================================== */
/* 1. TwoByTwoExplorer: la tabla 2×2 como instrumento de medida        */
/* ================================================================== */

interface TwoByTwoProps {
  title?: ReactNode;
  /** Convención Woodward: filas = exposición, columnas = desenlace. */
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  labelE?: string;
  labelD?: string;
}

/**
 * a = E+ D+, b = E+ D−, c = E− D+, d = E− D−.
 * Todas las medidas de M1 salen en vivo al editar las celdas.
 */
export function TwoByTwoExplorer({
  title,
  a = 38,
  b = 9,
  c = 31,
  d = 22,
  labelE = 'practica deporte',
  labelD = 'depresión',
}: TwoByTwoProps) {
  const [cells, setCells] = useState({ a, b, c, d });
  const [pe, setPe] = useState(0.4); // prevalencia de exposición en la población
  const { a: A, b: B, c: C, d: D } = cells;
  const n1 = A + B;
  const n0 = C + D;
  const m1 = A + C;
  const n = n1 + n0;

  const r1 = n1 > 0 ? A / n1 : NaN;
  const r0 = n0 > 0 ? C / n0 : NaN;
  const rr = r0 > 0 ? r1 / r0 : NaN;
  const or = B * C > 0 ? (A * D) / (B * C) : NaN;
  const rd = r1 - r0;
  const nnt = rd !== 0 ? 1 / Math.abs(rd) : NaN;
  const pra = Number.isFinite(rr) && rr > 0 ? (rr - 1) / rr : NaN;
  const prap =
    Number.isFinite(rr) && rr > 0 ? (pe * (rr - 1)) / (1 + pe * (rr - 1)) : NaN;
  // IC95% (método logarítmico de Woolf)
  const seLnRR =
    A > 0 && B > 0 && C > 0 && D > 0
      ? Math.sqrt(B / (A * n1) + D / (C * n0))
      : NaN;
  const seLnOR =
    A > 0 && B > 0 && C > 0 && D > 0
      ? Math.sqrt(1 / A + 1 / B + 1 / C + 1 / D)
      : NaN;
  const rrLo = Number.isFinite(rr) ? Math.exp(Math.log(rr) - 1.96 * seLnRR) : NaN;
  const rrHi = Number.isFinite(rr) ? Math.exp(Math.log(rr) + 1.96 * seLnRR) : NaN;
  const orLo = Number.isFinite(or) ? Math.exp(Math.log(or) - 1.96 * seLnOR) : NaN;
  const orHi = Number.isFinite(or) ? Math.exp(Math.log(or) + 1.96 * seLnOR) : NaN;
  // χ² de Pearson
  const chi2 =
    n > 0 && n1 > 0 && n0 > 0 && m1 > 0 && n - m1 > 0
      ? (n * Math.pow(A * D - B * C, 2)) / (n1 * n0 * m1 * (n - m1))
      : NaN;
  const pChi = Number.isFinite(chi2) ? chi2P1(chi2) : NaN;

  const W = 340;
  const H = 140;
  const y = (v: number) => rnd(H - 18 - v * (H - 34));

  const setCell = (k: keyof typeof cells) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(9999, Math.round(Number(e.target.value) || 0)));
    setCells((s) => ({ ...s, [k]: v }));
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La tabla 2×2 como instrumento'}</div>
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div>
          <table className="border-collapse text-center text-xs">
            <thead>
              <tr className="text-ink-500">
                <th className="p-1" />
                <th className="p-1 font-semibold text-red-700">{labelD}: sí</th>
                <th className="p-1 font-semibold text-ink-600">{labelD}: no</th>
                <th className="p-1 font-medium text-ink-500">total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1 pr-2 text-left font-semibold text-red-700">Sí {labelE}</td>
                <td className="border border-red-200 bg-red-50 p-1">
                  <input type="number" min={0} value={A} onChange={setCell('a')} className={CELL_INPUT} aria-label="a" />
                  <div className="text-[10px] text-ink-400">a</div>
                </td>
                <td className="border border-ink-200 p-1">
                  <input type="number" min={0} value={B} onChange={setCell('b')} className={CELL_INPUT} aria-label="b" />
                  <div className="text-[10px] text-ink-400">b</div>
                </td>
                <td className="p-1 font-mono text-ink-600">{n1}</td>
              </tr>
              <tr>
                <td className="p-1 pr-2 text-left font-semibold text-sky-700">No {labelE}</td>
                <td className="border border-ink-200 p-1">
                  <input type="number" min={0} value={C} onChange={setCell('c')} className={CELL_INPUT} aria-label="c" />
                  <div className="text-[10px] text-ink-400">c</div>
                </td>
                <td className="border border-sky-200 bg-sky-50 p-1">
                  <input type="number" min={0} value={D} onChange={setCell('d')} className={CELL_INPUT} aria-label="d" />
                  <div className="text-[10px] text-ink-400">d</div>
                </td>
                <td className="p-1 font-mono text-ink-600">{n0}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-ink-500">
            Ejemplo de clase (Salazar): a=38, b=9, c=31, d=22; deporte y depresión.
          </p>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img"
            aria-label="Riesgos comparados entre expuestos y no expuestos">
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <g key={g}>
                <line x1={40} x2={W - 8} y1={y(g)} y2={y(g)} stroke="#e5e7eb" />
                <text x={36} y={y(g) + 3} textAnchor="end" fontSize={8} fill={GRAY}>
                  {g.toFixed(2)}
                </text>
              </g>
            ))}
            <rect x={80} y={y(Math.min(Math.max(r1, 0), 1))}
              width={70} height={H - 18 - y(Math.min(Math.max(r1, 0), 1))}
              fill={EXP_COLOR} rx={2} />
            <rect x={190} y={y(Math.min(Math.max(r0, 0), 1))}
              width={70} height={H - 18 - y(Math.min(Math.max(r0, 0), 1))}
              fill={UNEXP_COLOR} rx={2} />
            <text x={115} y={y(Math.min(Math.max(r1, 0), 1)) - 4} textAnchor="middle" fontSize={9}
              fontWeight="bold" fill={EXP_COLOR}>{fmt(r1, 3)}</text>
            <text x={225} y={y(Math.min(Math.max(r0, 0), 1)) - 4} textAnchor="middle" fontSize={9}
              fontWeight="bold" fill={UNEXP_COLOR}>{fmt(r0, 3)}</text>
            <text x={115} y={H - 6} textAnchor="middle" fontSize={9} fill={EXP_COLOR}>expuestos</text>
            <text x={225} y={H - 6} textAnchor="middle" fontSize={9} fill={UNEXP_COLOR}>no expuestos</text>
            <text x={12} y={12} fontSize={8} fill={GRAY}>riesgo</text>
          </svg>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:grid-cols-4">
        <Measure label="RR" tex="\widehat{RR}" value={fmt(rr)} sub={`IC95% (${fmt(rrLo, 2)}–${fmt(rrHi, 2)})`} />
        <Measure label="OR" tex="\widehat{OR}" value={fmt(or)} sub={`IC95% (${fmt(orLo, 2)}–${fmt(orHi, 2)})`} />
        <Measure label="RD" tex="R_1-R_0" value={fmt(rd)}
          sub={Number.isFinite(nnt) ? `${rd > 0 ? 'NNH' : 'NNT'} = ${fmt(nnt, 0)}` : '—'} />
        <Measure label="χ²" tex="\chi^2" value={fmt(chi2, 2)} sub={`p = ${fmt(pChi, 4)}`} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:grid-cols-4">
        <Measure label="PRA" tex="\frac{RR-1}{RR}" value={Number.isFinite(pra) ? `${(pra * 100).toFixed(1)}%` : '—'} sub="entre expuestos" />
        <div>
          <div className="font-semibold text-ink-800">
            PRAP = {Number.isFinite(prap) ? `${(prap * 100).toFixed(1)}%` : '—'}
          </div>
          <label className="mt-0.5 block text-[11px] text-ink-500">
            P(E=1) en la población: {(pe * 100).toFixed(0)}%
            <input type="range" min={0.02} max={0.9} step={0.02} value={pe}
              onChange={(e) => setPe(Number(e.target.value))} className={SLIDER} />
          </label>
        </div>
      </div>

      <SimLegend items={[
        { color: EXP_COLOR, label: 'riesgo en expuestos r₁ = a/(a+b)', mark: 'bar' },
        { color: UNEXP_COLOR, label: 'riesgo en no expuestos r₀ = c/(c+d)', mark: 'bar' },
      ]} className="mt-2" />
      <SimGuide>
        Mueve las celdas y observa: el OR se aleja del RR cuando el riesgo basal
        crece (prueba c = 200, d = 800 → enfermedad común). El NNT convierte la
        diferencia de riesgos en una decisión clínica. El PRAP necesita la
        prevalencia de exposición: baja el slider y verás que un RR grande puede
        explicar pocos casos poblacionales.
      </SimGuide>
      <p className={NOTE}>
        Convención de Woodward: la exposición en filas, el desenlace en columnas.
        RD y NNT solo tienen sentido si el diseño estima riesgos (cohorte o
        ensayo); en casos y controles solo el OR es legítimo.
      </p>
    </div>
  );
}

function Measure({ label, tex, value, sub }: { label: string; tex: string; value: string; sub: string }) {
  return (
    <div>
      <div className="font-semibold text-ink-800">
        {label} = {value}
      </div>
      <div className="text-[10px] text-ink-400">
        <MathText text={`$${tex}$`} /> · {sub}
      </div>
    </div>
  );
}

/* χ²(1) survival function via the regularized incomplete gamma. */
function chi2P1(x: number): number {
  // P(χ²_1 ≥ x) = 2·(1 − Φ(√x))
  const z = Math.sqrt(Math.max(0, x));
  return Math.min(1, Math.max(0, 2 * (1 - normCdf(z))));
}
/* χ²(df) survival: aproximación Wilson–Hilferty (suficiente para docencia). */
function chi2Sf(x: number, df: number): number {
  if (x <= 0) return 1;
  const z = (Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  return Math.min(1, Math.max(0, 1 - normCdf(z)));
}
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly =
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = 1 - (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI)) * poly;
  return z >= 0 ? p : 1 - p;
}

/* ================================================================== */
/* 2. ConfusionExplorer: la confusión nace de dos flechas             */
/* ================================================================== */

/**
 * Población sintética con confusor binario C (p. ej. edad).
 * P(E=1|C=1) controla la flecha C→E; el OR C→D controla C→D.
 * Solo si AMBAS flechas existen el OR crudo ≠ OR de Mantel-Haenszel.
 */
const CONF_PRESETS = [
  { name: 'Asociación espuria (Woodward 4.1)', orCE: 6, orCD: 6, orED: 1, prevC: 0.5 },
  { name: 'Efecto enmascarado (Woodward 4.2)', orCE: 5, orCD: 5, orED: 2.45, prevC: 0.5 },
  { name: 'SHHS real (Woodward 4.9)', orCE: 2, orCD: 2.5, orED: 1.3, prevC: 0.55 },
];

export function ConfusionExplorer({ title }: { title?: ReactNode }) {
  const [orCE, setOrCE] = useState(4); // C→E: los viejos se exponen más
  const [orCD, setOrCD] = useState(5); // C→D: los viejos enferman más
  const [orED, setOrED] = useState(1); // verdadero efecto E→D
  const [prevC, setPrevC] = useState(0.5);

  // Construye la tabla de probabilidades conjunta P(C,E,D)
  const res = useMemo(() => {
    // odds helpers
    const odds = (p: number) => p / (1 - p);
    const unodds = (o: number) => o / (1 + o);
    const pE0 = 0.3;
    const pE1 = unodds(odds(pE0) * orCE); // P(E|C=1)
    // riesgo basal de D en C=0, E=0
    const r00 = 0.05;
    const pD = (e: number, c: number) =>
      unodds(odds(r00) * Math.pow(orED, e) * Math.pow(orCD, c));

    // Tablas 2x2 por estrato, con N = 5000 por estrato ponderado
    const stratum = (c: 0 | 1, n: number) => {
      const pE = c === 1 ? pE1 : pE0;
      const a = n * pE * pD(1, c);
      const b = n * pE * (1 - pD(1, c));
      const cc = n * (1 - pE) * pD(0, c);
      const dd = n * (1 - pE) * (1 - pD(0, c));
      return { a, b, c: cc, d: dd };
    };
    const s1 = stratum(1, 5000 * prevC * 2);
    const s0 = stratum(0, 5000 * (1 - prevC) * 2);
    const crude = { a: s1.a + s0.a, b: s1.b + s0.b, c: s1.c + s0.c, d: s1.d + s0.d };
    const orOf = (t: { a: number; b: number; c: number; d: number }) =>
      (t.a * t.d) / (t.b * t.c);
    // Mantel-Haenszel OR: Σ a_k d_k / n_k ÷ Σ b_k c_k / n_k
    const mhNum = (s1.a * s1.d) / (s1.a + s1.b + s1.c + s1.d) + (s0.a * s0.d) / (s0.a + s0.b + s0.c + s0.d);
    const mhDen = (s1.b * s1.c) / (s1.a + s1.b + s1.c + s1.d) + (s0.b * s0.c) / (s0.a + s0.b + s0.c + s0.d);
    // Riesgos por brazo dentro de cada estrato y del agregado
    const risk = (t: { a: number; b: number; c: number; d: number }) => ({
      e: t.a / (t.a + t.b),
      n: t.c / (t.c + t.d),
    });
    const r1 = risk(s1), r0 = risk(s0), rC = risk(crude);
    return { s1, s0, crude, or1: orOf(s1), or0: orOf(s0), orCrude: orOf(crude), orMH: mhNum / mhDen, r1, r0, rC };
  }, [orCE, orCD, orED, prevC]);

  const biased = Math.abs(Math.log(res.orCrude) - Math.log(res.orMH)) > 0.08;
  // Paradoja de Simpson: el signo de la diferencia de riesgos del agregado
  // difiere del signo dentro de los estratos.
  const sgn = (x: number) => (x > 0.0005 ? 1 : x < -0.0005 ? -1 : 0);
  const simpson =
    sgn(res.rC.e - res.rC.n) !== 0 &&
    sgn(res.rC.e - res.rC.n) !== sgn(res.r1.e - res.r1.n) &&
    sgn(res.rC.e - res.rC.n) !== sgn(res.r0.e - res.r0.n);

  const SliderRow = ({ label, value, min, max, step, set, color }:
    { label: ReactNode; value: number; min: number; max: number; step: number; set: (v: number) => void; color?: string }) => (
    <label className="block text-[11px] text-ink-600">
      {label}: <strong style={{ color }}>{value.toFixed(1)}</strong>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))} className={SLIDER} />
    </label>
  );

  const bar = (v: number, max = 8) => (
    <svg width={120} height={10} className="inline-block align-middle">
      <rect x={0} y={0} width={120} height={10} fill="#f3f4f6" rx={2} />
      <rect x={0} y={0} width={rnd(Math.min(120, (Math.log(Math.max(v, 0.05)) + 3) / (Math.log(max) + 3) * 120))}
        height={10} fill={v > 1.3 || v < 0.7 ? EXP_COLOR : GRAY} rx={2} />
      <line x1={rnd((Math.log(1) + 3) / (Math.log(max) + 3) * 120)} y1={0}
        x2={rnd((Math.log(1) + 3) / (Math.log(max) + 3) * 120)}
        y2={10} stroke="#111" strokeWidth={1} />
    </svg>
  );

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La confusión necesita dos flechas'}</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {CONF_PRESETS.map((p) => (
          <button key={p.name} type="button" className={BTN_GHOST}
            onClick={() => { setOrCE(p.orCE); setOrCD(p.orCD); setOrED(p.orED); setPrevC(p.prevC); }}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <SliderRow label="OR del confusor → exposición (C→E)" value={orCE} min={1} max={8} step={0.5} set={setOrCE} color={EXP_COLOR} />
          <SliderRow label="OR del confusor → desenlace (C→D)" value={orCD} min={1} max={8} step={0.5} set={setOrCD} color={EXP_COLOR} />
          <SliderRow label="OR verdadero exposición → desenlace (E→D)" value={orED} min={0.25} max={4} step={0.25} set={setOrED} color="#111" />
          <SliderRow label="prevalencia del confusor" value={prevC} min={0.1} max={0.9} step={0.05} set={setPrevC} />
        </div>
        <div className="text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-ink-500">
                <th className="py-0.5 font-medium">estimación</th>
                <th className="py-0.5 font-medium">OR</th>
                <th />
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr><td className="py-0.5">estrato C=1</td><td>{fmt(res.or1, 2)}</td><td>{bar(res.or1)}</td></tr>
              <tr><td className="py-0.5">estrato C=0</td><td>{fmt(res.or0, 2)}</td><td>{bar(res.or0)}</td></tr>
              <tr className="border-t border-ink-200 font-semibold">
                <td className="py-0.5">crudo (ignorando C)</td><td className="text-red-700">{fmt(res.orCrude, 2)}</td><td>{bar(res.orCrude)}</td></tr>
              <tr className="font-semibold">
                <td className="py-0.5">Mantel–Haenszel</td><td className="text-sky-700">{fmt(res.orMH, 2)}</td><td>{bar(res.orMH)}</td></tr>
            </tbody>
          </table>
          <p className={`mt-2 rounded px-2 py-1 text-[11px] font-medium ${biased ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {simpson
              ? `¡Paradoja de Simpson! El crudo invierte el signo: la exposición parece ${res.rC.e > res.rC.n ? 'dañina' : 'protectora'} agregada pero es ${res.r1.e > res.r1.n ? 'dañina' : 'protectora'} en cada estrato.`
              : biased
                ? `Confusión: el OR crudo (${fmt(res.orCrude, 2)}) no coincide con el ajustado (${fmt(res.orMH, 2)}).`
                : `Sin confusión neta: crudo ≈ ajustado (${fmt(res.orCrude, 2)} vs ${fmt(res.orMH, 2)}).`}
          </p>

          {/* Riesgos por brazo dentro de cada estrato: la inversión se ve */}
          <div className="mt-2 space-y-1">
            {([
              ['estrato C=1', res.r1],
              ['estrato C=0', res.r0],
              ['agregado (sin C)', res.rC],
            ] as const).map(([lab, r]) => {
              const max = Math.max(r.e, r.n, 0.001);
              const row = (v: number, color: string) => (
                <svg width={90} height={8} className="inline-block align-middle">
                  <rect width={90} height={8} fill="#f3f4f6" rx={2} />
                  <rect width={rnd((v / max) * 90)} height={8} fill={color} rx={2} />
                </svg>
              );
              return (
                <div key={lab} className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="w-24 text-ink-500">{lab}</span>
                  {row(r.e, EXP_COLOR)}
                  <span className="w-9 text-right">{(r.e * 100).toFixed(0)}%</span>
                  {row(r.n, UNEXP_COLOR)}
                  <span className="w-9 text-right">{(r.n * 100).toFixed(0)}%</span>
                </div>
              );
            })}
            <p className="text-[10px] text-ink-500">
              <span style={{ color: EXP_COLOR }}>■</span> riesgo expuestos ·{' '}
              <span style={{ color: UNEXP_COLOR }}>■</span> riesgo no expuestos.
              En Simpson el agregado muestra la dirección contraria a los estratos.
            </p>
          </div>
        </div>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'OR ≠ 1 (asociación)', mark: 'bar' },
        { color: GRAY, label: 'OR ≈ 1', mark: 'bar' },
        { color: '#111', label: 'OR = 1 (referencia)' },
      ]} className="mt-2" />
      <SimGuide>
        La confusión solo aparece si C→E y C→D existen a la vez: pon cualquiera
        de los dos sliders en 1 y el OR crudo se pega al de Mantel–Haenszel.
        Cambia el OR verdadero y verifica que el ajustado lo recupera.
      </SimGuide>
      <p className={NOTE}>
        Modelo exacto sobre probabilidades (no simulación): las tablas son las
        esperadas con N grande. Si los OR por estrato difieren entre sí, no hay
        resumen válido: eso es interacción, no confusión (test de Breslow–Day).
      </p>
    </div>
  );
}

/* ================================================================== */
/* 3. PvalueVsEffect: significancia no es tamaño                       */
/* ================================================================== */

export function PvalueVsEffect({ title }: { title?: ReactNode }) {
  const [logOR, setLogOR] = useState(0.3);
  const [nPer, setNPer] = useState(200);
  const [seed, setSeed] = useState(0);
  const R = 600;

  const hist = useMemo(() => {
    void seed;
    const p0 = 0.2;
    const odds0 = p0 / (1 - p0);
    const p1 = (odds0 * Math.exp(logOR)) / (1 + odds0 * Math.exp(logOR));
    const bins = new Array(20).fill(0);
    let sig = 0;
    const rng = mulberry(20240 + seed);
    for (let r = 0; r < R; r++) {
      const a = binom(rng, nPer, p1);
      const c = binom(rng, nPer, p0);
      const b = nPer - a;
      const d = nPer - c;
      const chi = (2 * nPer * Math.pow(a * d - b * c, 2)) /
        ((a + b) * (c + d) * (a + c) * (b + d));
      const p = chi2P1(chi);
      bins[Math.min(19, Math.floor(p / 0.05))]++;
      if (p < 0.05) sig++;
    }
    return { bins, power: sig / R };
  }, [logOR, nPer, seed]);

  const W = 340;
  const H = 140;
  const maxB = Math.max(...hist.bins, 1);

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'El valor p no mide el tamaño del efecto'}</div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
            aria-label="Distribución de valores p simulados">
            {hist.bins.map((v, i) => (
              <rect key={i} x={rnd(30 + (i * (W - 44)) / 20)} y={rnd(H - 20 - (v / maxB) * (H - 40))}
                width={rnd((W - 44) / 20 - 1.5)} height={rnd((v / maxB) * (H - 40))}
                fill={i === 0 ? '#16a34a' : i * 0.05 < 0.05 ? '#86efac' : '#cbd5e1'} rx={1} />
            ))}
            <line x1={30 + (W - 44) / 20} x2={30 + (W - 44) / 20} y1={20} y2={H - 20}
              stroke="#b91c1c" strokeDasharray="3 3" />
            <text x={30 + (W - 44) / 20} y={14} textAnchor="middle" fontSize={8} fill="#b91c1c">p = 0.05</text>
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <text key={g} x={30 + g * (W - 44)} y={H - 8} textAnchor="middle" fontSize={8} fill={GRAY}>
                {g.toFixed(2)}
              </text>
            ))}
            <text x={12} y={14} fontSize={8} fill={GRAY}>valor p →</text>
          </svg>
          <SimLegend items={[
            { color: '#16a34a', label: 'p < 0.05 (declarado "significativo")', mark: 'bar' },
            { color: '#cbd5e1', label: 'p ≥ 0.05', mark: 'bar' },
          ]} className="mt-1" />
        </div>
        <div className="w-48 space-y-2 text-[11px] text-ink-600">
          <label className="block">
            efecto verdadero, OR = {Math.exp(logOR).toFixed(2)}
            <input type="range" min={0} max={1.6} step={0.05} value={logOR}
              onChange={(e) => setLogOR(Number(e.target.value))} className={SLIDER} />
          </label>
          <label className="block">
            n por grupo = {nPer}
            <input type="range" min={40} max={1500} step={20} value={nPer}
              onChange={(e) => setNPer(Number(e.target.value))} className={SLIDER} />
          </label>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className={BTN_GHOST}>
            Repetir el experimento
          </button>
          <p className="rounded bg-accent-50 px-2 py-1 font-semibold text-accent-800">
            potencia: {(hist.power * 100).toFixed(0)}% de los análisis dan p &lt; 0.05
          </p>
        </div>
      </div>
      <SimGuide>
        Con OR = 1 el histograma es uniforme: el 5% cae bajo la línea por azar
        (error tipo I). Con OR = 3 y n = 40 solo ~60% de las réplicas detecta el
        efecto aunque sea grande: efecto real sin "significancia" por falta de
        datos. Con OR ≈ 1.3 y n = 1500 ~80% de las réplicas sale "significativa"
        con un efecto clínicamente trivial: el valor
        p mezcla tamaño del efecto y tamaño muestral; por eso Woodward exige
        reportar el IC antes que el p.
      </SimGuide>
      <p className={NOTE}>
        {R} réplicas por configuración: en cada una se genera una tabla 2×2 con
        riesgo basal 0.20 y el OR elegido, y se aplica la prueba χ² de Pearson.
      </p>
    </div>
  );
}

function mulberry(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function binom(rng: () => number, n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (rng() < p) k++;
  return k;
}

/* ================================================================== */
/* 4. KaplanMeierSim: la curva escalonada con censura                  */
/* ================================================================== */

const LEUK_TREAT: [number, number][] = [
  [6, 1], [6, 1], [6, 1], [7, 1], [10, 1], [13, 1], [16, 1], [22, 1], [23, 1],
  [6, 0], [9, 0], [10, 0], [11, 0], [17, 0], [19, 0], [20, 0], [25, 0],
  [32, 0], [32, 0], [34, 0], [35, 0],
];
const LEUK_PLACEBO: [number, number][] = [
  [1, 1], [1, 1], [2, 1], [2, 1], [3, 1], [4, 1], [4, 1], [5, 1], [5, 1],
  [8, 1], [8, 1], [8, 1], [8, 1], [11, 1], [11, 1], [12, 1], [12, 1],
  [15, 1], [17, 1], [22, 1], [23, 1],
];

function kmCurve(data: [number, number][]): { t: number; s: number; d: number; nrisk: number }[] {
  const times = [...new Set(data.filter(([, st]) => st === 1).map(([t]) => t))].sort((x, y) => x - y);
  let s = 1;
  return times.map((t) => {
    const nrisk = data.filter(([tt]) => tt >= t).length;
    const d = data.filter(([tt, st]) => tt === t && st === 1).length;
    s *= 1 - d / nrisk;
    return { t, s, d, nrisk };
  });
}

export function KaplanMeierSim({ title }: { title?: ReactNode }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const km1 = useMemo(() => kmCurve(LEUK_TREAT), []);
  const km0 = useMemo(() => kmCurve(LEUK_PLACEBO), []);
  const maxStep = Math.max(km1.length, km0.length);
  const tNow = step === 0 ? 0 : Math.max(
    km1[Math.min(step, km1.length) - 1]?.t ?? 0,
    km0[Math.min(step, km0.length) - 1]?.t ?? 0,
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(id);
  }, [playing, maxStep]);

  const W = 520;
  const H = 220;
  const T = 35;
  const x = (t: number) => rnd(36 + (t / T) * (W - 52));
  const y = (s: number) => rnd(14 + (1 - s) * (H - 56));

  const path = (km: { t: number; s: number }[], upto: number) => {
    let p = `M ${x(0)} ${y(1)}`;
    let prev = 1;
    const lim = Math.min(upto, km.length);
    for (let i = 0; i < lim; i++) {
      p += ` L ${x(km[i].t)} ${y(prev)} L ${x(km[i].t)} ${y(km[i].s)}`;
      prev = km[i].s;
    }
    if (lim > 0) p += ` L ${x(km[lim - 1].t)} ${y(prev)}`;
    else p += ` L ${x(0)} ${y(1)}`;
    return p;
  };

  const cens = (data: [number, number][], km: { t: number; s: number }[]) =>
    data.filter(([, st]) => st === 0).map(([t], i) => {
      const prev = km.filter((k) => k.t <= t).pop();
      return { t, s: prev ? prev.s : 1, i };
    });

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'Kaplan–Meier en la leucemia (Freireich 1963)'}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label="Curvas de supervivencia Kaplan-Meier">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={36} x2={W - 16} y1={y(g)} y2={y(g)} stroke="#e5e7eb" />
            <text x={32} y={y(g) + 3} textAnchor="end" fontSize={8} fill={GRAY}>{g.toFixed(2)}</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20, 25, 30, 35].map((t) => (
          <text key={t} x={x(t)} y={H - 32} textAnchor="middle" fontSize={8} fill={GRAY}>{t}</text>
        ))}
        <path d={path(km0, step)} fill="none" stroke={EXP_COLOR} strokeWidth={2} />
        <path d={path(km1, step)} fill="none" stroke={UNEXP_COLOR} strokeWidth={2} />
        {step >= maxStep && (
          <>
            {cens(LEUK_TREAT, km1).map((c) => (
              <line key={c.i} x1={x(c.t) - 3} x2={x(c.t) + 3} y1={y(c.s) - 3} y2={y(c.s) + 3}
                stroke={UNEXP_COLOR} strokeWidth={1.6} />
            ))}
          </>
        )}
        <text x={x(24)} y={y(0.62)} fontSize={9} fontWeight="bold" fill={UNEXP_COLOR}>6-MP (n=21)</text>
        <text x={x(17)} y={y(0.28)} fontSize={9} fontWeight="bold" fill={EXP_COLOR}>placebo (n=21)</text>
        {step > 0 && step <= maxStep && (
          <line x1={x(tNow)} x2={x(tNow)} y1={14} y2={H - 40} stroke={GOLD} strokeDasharray="4 3" />
        )}
        <text x={x(17.5)} y={H - 18} textAnchor="middle" fontSize={9} fill={GRAY}>semanas hasta recaída</text>
      </svg>
      <SimLegend items={[
        { color: UNEXP_COLOR, label: 'Ŝ(t) grupo 6-MP' },
        { color: EXP_COLOR, label: 'Ŝ(t) grupo placebo' },
        { color: UNEXP_COLOR, label: 'censura (paciente sin recaída al final)', mark: 'dot' },
        { color: GOLD, label: 'tiempo actual del paso a paso', dash: true },
      ]} className="mt-2" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className={BTN_MAIN}
          onClick={() => { if (step >= maxStep) setStep(0); else setPlaying((p) => !p); }}>
          {playing ? 'Pausar' : step >= maxStep ? 'Reiniciar' : step > 0 ? 'Seguir' : 'Construir la curva'}
        </button>
        {playing || step > 0 ? (
          <button type="button" className={BTN_GHOST} onClick={() => { setPlaying(false); setStep((s) => Math.min(s + 1, maxStep)); }}>
            Paso +
          </button>
        ) : null}
        <span className="text-xs text-ink-600">
          {step === 0 ? 'Cada escalón cae en un tiempo de evento' : `evento ${step}/${maxStep} · t = ${tNow} sem`}
        </span>
      </div>
      <SimGuide>
        La curva roja cae en cada recaída; la azul también, pero sus cruces son
        censuras, no eventos. Al final, 12 de 21 pacientes con 6-MP seguían sin
        recaer: la censura conserva su información hasta ese punto, no los
        elimina. Compara con el placebo: todos recayeron antes de la semana 24.
      </SimGuide>
      <p className={NOTE}>
        Datos clásicos del ensayo de Freireich et al. (1963), el mismo archivo
        <code>leucemia.txt</code> del laboratorio. El log-rank formal está en el
        RCell del módulo (χ² = 16.8, p &lt; 0.001).
      </p>
    </div>
  );
}

/* ================================================================== */
/* 5. McNemarCmhDemo: McNemar = CMH en pareamiento 1:1                 */
/* ================================================================== */

/**
 * pares: cada pareja caso-control muestra su exposición.
 * b = caso expuesto / control no, c = caso no / control expuesto.
 */
export function McNemarCmhDemo({ title }: { title?: ReactNode }) {
  const [b, setB] = useState(29);
  const [c, setC] = useState(8);
  const aConc = 14; // ambos expuestos
  const dConc = 13; // ninguno expuesto

  const mcn = Math.pow(b - c, 2) / (b + c);
  const pMcN = chi2P1(mcn);
  // En pareamiento 1:1, el OR de CMH colapsa a b/c.
  const orMH = c > 0 ? b / c : NaN;
  const orLo = c > 0 ? Math.exp(Math.log(b / c) - 1.96 * Math.sqrt(1 / b + 1 / c)) : NaN;
  const orHi = c > 0 ? Math.exp(Math.log(b / c) + 1.96 * Math.sqrt(1 / b + 1 / c)) : NaN;

  const pairs = [
    ...Array(aConc).fill('aa'),
    ...Array(b).fill('b'),
    ...Array(c).fill('c'),
    ...Array(dConc).fill('dd'),
  ];

  const cellColor: Record<string, string> = {
    aa: '#d1d5db',
    dd: '#e5e7eb',
    b: EXP_COLOR,
    c: UNEXP_COLOR,
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'McNemar: solo los discordantes votan'}</div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap gap-1" role="img"
            aria-label="Parejas caso-control coloreadas por discordancia">
            {pairs.map((p, i) => (
              <span key={i} title={
                p === 'b' ? 'caso expuesto / control no' :
                p === 'c' ? 'caso no / control expuesto' : 'pareja concordante'
              } className="inline-flex gap-0.5 rounded border border-ink-200 p-0.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p === 'aa' ? EXP_COLOR : p === 'b' ? EXP_COLOR : '#f3f4f6', outline: p === 'aa' || p === 'b' ? 'none' : '1px solid #d1d5db' }} />
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p === 'aa' ? EXP_COLOR : p === 'c' ? EXP_COLOR : '#f3f4f6', outline: p === 'aa' || p === 'c' ? 'none' : '1px solid #d1d5db' }} />
                <span className="h-2.5 w-1 rounded-sm" style={{ background: cellColor[p] }} />
              </span>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            Cada icono es una pareja: punto izquierdo = caso, derecho = control;
            relleno rojo = expuesto. La barra lateral marca el tipo de pareja.
          </p>
        </div>
        <div className="w-52 space-y-2 text-[11px] text-ink-600">
          <label className="block">
            discordantes b (caso E+, control E−): <strong>{b}</strong>
            <input type="range" min={1} max={60} value={b} onChange={(e) => setB(Number(e.target.value))} className={SLIDER} />
          </label>
          <label className="block">
            discordantes c (caso E−, control E+): <strong>{c}</strong>
            <input type="range" min={1} max={60} value={c} onChange={(e) => setC(Number(e.target.value))} className={SLIDER} />
          </label>
          <div className="rounded bg-ink-50 p-2 font-mono text-[11px]">
            <div>χ² McNemar = (b−c)²/(b+c) = <strong>{fmt(mcn, 2)}</strong></div>
            <div>χ² CMH (1:1) = <strong>{fmt(mcn, 2)}</strong>: idéntico</div>
            <div>OR<sub>MH</sub> = b/c = <strong>{fmt(orMH, 2)}</strong> ({fmt(orLo, 2)}–{fmt(orHi, 2)})</div>
            <div>p = {fmt(pMcN, 4)}</div>
          </div>
        </div>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: `discordante caso-expuesto (b = ${b})`, mark: 'bar' },
        { color: UNEXP_COLOR, label: `discordante control-expuesto (c = ${c})`, mark: 'bar' },
        { color: '#d1d5db', label: `parejas concordantes (a = ${aConc}, d = ${dConc}); no aportan`, mark: 'bar' },
      ]} className="mt-2" />
      <SimGuide>
        Mueve b y c: los concordantes nunca entran a la fórmula. Con b = c el χ²
        colapsa a 0 aunque haya miles de parejas; la evidencia está solo en el
        desbalance discordante. La igualdad χ²<sub>McNemar</sub> = χ²<sub>CMH</sub>
        es la equivalencia que Salazar demuestra en clase con los datos BCG.
      </SimGuide>
      <p className={NOTE}>
        Ejemplo de clase: BCG y meningitis, b = 29, c = 8 → OR = 3.6. En
        pareamiento 1:1 cada estrato es una pareja, y el estimador de
        Mantel–Haenszel se reduce exactamente a b/c.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 5b. DiagnosticTestExplorer: Se/Sp → VPP según prevalencia           */
/* ================================================================== */

/**
 * La prueba diagnóstica perfecta no existe: con prevalencia baja, una
 * sensibilidad y especificidad altas aún producen mayoría de falsos
 * positivos. Woodward lo usa para discutir tamización (Ch. 2); en clase
 * aparece con el ejemplo VIH (Clase 10).
 */
export function DiagnosticTestExplorer({ title }: { title?: ReactNode }) {
  const [se, setSe] = useState(0.95);
  const [sp, setSp] = useState(0.95);
  const [prev, setPrev] = useState(0.02);
  const N = 10000;

  const vp = N * prev * se;
  const fn = N * prev * (1 - se);
  const fp = N * (1 - prev) * (1 - sp);
  const vn = N * (1 - prev) * sp;
  const ppv = vp / (vp + fp);
  const npv = vn / (vn + fn);

  const W = 340;
  const H = 130;
  const barW = 60;
  const yv = (x: number, max: number) => rnd(H - 24 - (x / max) * (H - 40));
  const maxBar = Math.max(vp + fn, fp + vn);

  const stacks = [
    { label: 'enfermos', parts: [{ v: vp, c: EXP_COLOR, n: 'VP' }, { v: fn, c: '#fecaca', n: 'FN' }] },
    { label: 'sanos', parts: [{ v: fp, c: GOLD, n: 'FP' }, { v: vn, c: UNEXP_COLOR, n: 'VN' }] },
  ];

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La tamización: una buena prueba en una enfermedad rara'}</div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="space-y-1.5 text-[11px] text-ink-600">
          <label className="block">sensibilidad Se = {(se * 100).toFixed(0)}%
            <input type="range" min={0.5} max={0.999} step={0.005} value={se}
              onChange={(e) => setSe(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">especificidad Sp = {(sp * 100).toFixed(0)}%
            <input type="range" min={0.5} max={0.999} step={0.005} value={sp}
              onChange={(e) => setSp(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">prevalencia = {(prev * 100).toFixed(1)}%
            <input type="range" min={0.002} max={0.3} step={0.002} value={prev}
              onChange={(e) => setPrev(Number(e.target.value))} className={SLIDER} /></label>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img"
            aria-label="Desenlaces de la prueba en 10000 personas">
            {stacks.map((s, i) => {
              let acc = 0;
              const x0 = 70 + i * 130;
              return (
                <g key={s.label}>
                  {s.parts.map((p) => {
                    const y0 = yv(acc + p.v, maxBar);
                    const h = (p.v / maxBar) * (H - 40);
                    acc += p.v;
                    return (
                      <g key={p.n}>
                        <rect x={x0} y={y0} width={barW} height={rnd(h)} fill={p.c} />
                        {p.v / maxBar > 0.05 && (
                          <text x={x0 + barW / 2} y={y0 + h / 2 + 3} textAnchor="middle"
                            fontSize={8} fill="#fff" fontWeight="bold">{p.n}</text>
                        )}
                      </g>
                    );
                  })}
                  <text x={x0 + barW / 2} y={H - 10} textAnchor="middle" fontSize={9}
                    fill={GRAY}>{s.label} ({Math.round(s.parts[0].v + s.parts[1].v)})</text>
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex gap-4 text-xs">
            <span className="font-semibold text-ink-800">
              VPP = {(ppv * 100).toFixed(1)}%
              <span className="ml-1 font-normal text-ink-500">de los positivos, enfermos de verdad</span>
            </span>
            <span className="font-semibold text-ink-800">
              VPN = {(npv * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'verdaderos positivos (VP)', mark: 'bar' },
        { color: '#fecaca', label: 'falsos negativos (FN)', mark: 'bar' },
        { color: GOLD, label: 'falsos positivos (FP)', mark: 'bar' },
        { color: UNEXP_COLOR, label: 'verdaderos negativos (VN)', mark: 'bar' },
      ]} className="mt-2" />
      <SimGuide>
        Con prevalencia 2% y Se = Sp = 95%, el VPP ronda el 28%: de cada 4
        positivos, 3 son falsos. Sube la prevalencia y el VPP despega; por eso
        la tamización masiva en población de bajo riesgo produce avalanchas de
        falsos positivos. La sensibilidad perfecta no rescata el VPP: es la
        especificidad y la prevalencia las que mandan.
      </SimGuide>
      <p className={NOTE}>
        Valores esperados sobre N = 10 000: VPP = Se·prev / [Se·prev +
        (1−Sp)(1−prev)]: el teorema de Bayes en su versión epidemiológica.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 6. DesignTree: el diseño determina lo estimable                     */
/* ================================================================== */

interface DesignNode {
  q?: string;
  yes?: string;
  no?: string;
  leaf?: { name: string; estima: string; noEstima: string; ejemplo: string };
}

const TREE: Record<string, DesignNode> = {
  start: {
    q: '¿El investigador asigna la exposición?',
    yes: 'exp',
    no: 'obs',
  },
  exp: {
    leaf: {
      name: 'Ensayo clínico (ECA)',
      estima: 'RR, RD, NNT, tasas; la aleatorización equilibra confusores',
      noEstima: 'Nada queda fuera: es el diseño más completo',
      ejemplo: 'Freireich 1963: 6-MP vs. placebo en leucemia',
    },
  },
  obs: {
    q: '¿Se selecciona a los participantes por el desenlace (enfermedad)?',
    yes: 'cc',
    no: 'obs2',
  },
  cc: {
    q: '¿Los controles se parean caso a caso?',
    yes: 'ccm',
    no: 'ccu',
  },
  ccm: {
    leaf: {
      name: 'Casos y controles pareados',
      estima: 'OR (McNemar / CMH / clogit); el matching controla confusores por diseño',
      noEstima: 'Riesgo, tasas, prevalencia de exposición poblacional',
      ejemplo: 'BCG y meningitis: pares 1:1, OR = b/c',
    },
  },
  ccu: {
    leaf: {
      name: 'Casos y controles no pareados',
      estima: 'OR, y solo OR ≈ RR si la enfermedad es rara',
      noEstima: 'Riesgo e incidencia (los denominadores son ficticios)',
      ejemplo: 'Doll & Hill 1950: fumadores en casos de cáncer vs. controles',
    },
  },
  obs2: {
    q: '¿Se sigue a los participantes hacia adelante en el tiempo?',
    yes: 'coh',
    no: 'cross',
  },
  coh: {
    leaf: {
      name: 'Cohorte',
      estima: 'Riesgo, RR, tasas, SMR, supervivencia, NNT',
      noEstima: 'Eficiencia en enfermedades raras (costosa y lenta)',
      ejemplo: 'Doll & Hill 1964: médicos británicos, SHHS de Woodward',
    },
  },
  cross: {
    q: '¿La unidad de análisis es el individuo o el grupo?',
    yes: 'xs',
    no: 'eco',
  },
  xs: {
    leaf: {
      name: 'Corte transversal',
      estima: 'Prevalencias y OR de prevalencia',
      noEstima: 'Incidencia ni secuencia temporal (la foto no dice qué fue primero)',
      ejemplo: 'Encuestas de salud: depresión y deporte en una fecha fija',
    },
  },
  eco: {
    leaf: {
      name: 'Ecológico',
      estima: 'Correlaciones entre agregados: hipótesis, no pruebas',
      noEstima: 'Cualquier inferencia individual (falacia ecológica)',
      ejemplo: 'Consumo de tabaco por país vs. mortalidad por país',
    },
  },
};

export function DesignTree({ title }: { title?: ReactNode }) {
  const [path, setPath] = useState<string[]>(['start']);
  const node = TREE[path[path.length - 1]];
  const leaf = node.leaf;

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'El árbol de diseños: qué puedes estimar según el camino'}</div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px]">
        {path.map((k, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <span className="text-ink-300">→</span>}
            <button type="button" onClick={() => setPath(path.slice(0, i + 1))}
              className={`rounded px-1.5 py-0.5 ${i === path.length - 1 ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
              {i === 0 ? 'inicio' : TREE[path[i - 1]].yes === k ? 'sí' : 'no'}
            </button>
          </span>
        ))}
      </div>
      {leaf ? (
        <div className="rounded-lg border border-accent-200 bg-accent-50/60 p-3">
          <div className="text-sm font-bold text-accent-900">{leaf.name}</div>
          <div className="mt-1 grid gap-2 text-xs md:grid-cols-3">
            <p><strong className="text-emerald-700">Estima:</strong> {leaf.estima}</p>
            <p><strong className="text-red-700">No estima:</strong> {leaf.noEstima}</p>
            <p><strong className="text-ink-600">Ejemplo:</strong> {leaf.ejemplo}</p>
          </div>
          <button type="button" onClick={() => setPath(['start'])} className={`${BTN_GHOST} mt-2`}>
            Explorar otro camino
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-ink-200 bg-white p-3">
          <p className="text-sm font-medium text-ink-800">{node.q}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={BTN_MAIN} onClick={() => setPath([...path, node.yes!])}>Sí</button>
            <button type="button" className={BTN_GHOST} onClick={() => setPath([...path, node.no!])}>No</button>
          </div>
        </div>
      )}
      <SimGuide>
        Recorre los caminos y fíjate en la fila "No estima": el diseño decide
        antes que el análisis. El caso clave es casos y controles: con miles de
        sujetos perfectos jamás estimarás el riesgo, porque los denominadores
        los eligió el investigador, no la naturaleza.
      </SimGuide>
      <p className={NOTE}>
        Principio rector de Woodward: la epidemiología es comparativa, pero el
        tipo de comparación disponible lo fija el diseño, no el estadístico.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 7. PrevalenceExplorer: P ≈ I × D en estado estacionario             */
/* ================================================================== */

/**
 * Simulación de flujo: puntos susceptibles -> enfermos (duración media D)
 * -> recuperados. La prevalencia observada se compara con I·D/(1+I·D).
 */
export function PrevalenceExplorer({ title }: { title?: ReactNode }) {
  const [incid, setIncid] = useState(0.08); // nuevos casos por persona-año
  const [dur, setDur] = useState(4);        // duración media en años
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<number[]>(() => new Array(300).fill(0));
  const [histP, setHistP] = useState<number[]>([]);
  const ref = useRef<number[]>(state);

  const N = 300;
  const steadyP = useMemo(() => {
    const id = incid * dur;
    return id / (1 + id);
  }, [incid, dur]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = ref.current.slice();
      for (let i = 0; i < N; i++) {
        if (s[i] > 0) {
          s[i] += 1 / 12;                      // un mes por tick
          if (s[i] >= dur) s[i] = 0;           // recupera tras D años
        } else if (Math.random() < incid / 12) {
          s[i] = 1 / 12;                       // nuevo caso
        }
      }
      ref.current = s;
      setState(s);
      setHistP((h) => [...h.slice(-119), s.filter((v) => v > 0).length / N]);
    }, 90);
    return () => clearInterval(id);
  }, [running, incid, dur]);

  const pNow = state.filter((v) => v > 0).length / N;
  const W = 460;
  const H = 90;

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'P ≈ I × D: el balance del depósito de casos'}</div>
      <div className="mb-2 flex flex-wrap gap-1" role="img" aria-label="Población simulada: cada punto es una persona">
        {state.map((v, i) => (
          <span key={i} className="h-2 w-2 rounded-[2px]"
            style={{ background: v > 0 ? EXP_COLOR : '#e5e7eb' }} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Prevalencia observada vs teórica">
          <line x1={20} x2={W - 10} y1={H - 40 * steadyP - 10} y2={H - 40 * steadyP - 10}
            stroke={UNEXP_COLOR} strokeDasharray="4 3" />
          <text x={W - 12} y={H - 40 * steadyP - 14} textAnchor="end" fontSize={8} fill={UNEXP_COLOR}>
            I·D/(1+I·D) = {(steadyP * 100).toFixed(1)}%
          </text>
          {histP.length > 1 && (
            <path
              d={histP.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${20 + (i / 119) * (W - 34)} ${H - 40 * Math.min(p, 2) - 10}`).join(' ')}
              fill="none" stroke={EXP_COLOR} strokeWidth={1.8} />
          )}
          {[0, 0.25, 0.5].map((g) => (
            <text key={g} x={16} y={H - 40 * g - 7} textAnchor="end" fontSize={8} fill={GRAY}>{(g * 100).toFixed(0)}%</text>
          ))}
        </svg>
        <div className="w-44 space-y-1.5 text-[11px] text-ink-600">
          <label className="block">incidencia I = {incid.toFixed(2)} /persona-año
            <input type="range" min={0.01} max={0.4} step={0.01} value={incid}
              onChange={(e) => setIncid(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">duración media D = {dur} años
            <input type="range" min={0.5} max={12} step={0.5} value={dur}
              onChange={(e) => setDur(Number(e.target.value))} className={SLIDER} /></label>
          <button type="button" className={BTN_MAIN}
            onClick={() => setRunning((r) => !r)}>
            {running ? 'Pausar' : 'Simular flujo'}
          </button>
          {histP.length > 5 && (
            <p className="rounded bg-ink-50 px-2 py-1 font-mono">
              P observada = {(pNow * 100).toFixed(1)}% · teórica = {(steadyP * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'persona enferma (punto rojo) / prevalencia observada (línea)' },
        { color: UNEXP_COLOR, label: 'prevalencia teórica de estado estacionario', dash: true },
        { color: '#e5e7eb', label: 'persona susceptible', mark: 'bar' },
      ]} className="mt-2" />
      <SimGuide>
        P ≈ I × D vale en estado estacionario con enfermedad rara. Sube la
        duración y la prevalencia crece aunque la incidencia no cambie; por
        eso una enfermedad puede ser "común" (alta P) sin ser "frecuente"
        (baja I). La fórmula exacta es P = ID/(1+ID); la aproximación falla
        cuando P deja de ser pequeña.
      </SimGuide>
      <p className={NOTE}>
        Cada tick es un mes; los puntos rojos permanecen enfermos en promedio
        D años. La relación P = I × D exige población estacionaria;
        migraciones o cambios de letalidad la rompen (Woodward, Ch. 2).
      </p>
    </div>
  );
}

/* ================================================================== */
/* 8. StandardizationExplorer: crudo vs. ajustado (directo/indirecto)   */
/* ================================================================== */

/**
 * Dos poblaciones con estructuras de edad distintas y tasas específicas
 * por edad. La tasa cruda puede invertir el orden que tienen las tasas
 * específicas; la estandarización deshace el truco.
 */
export function StandardizationExplorer({ title }: { title?: ReactNode }) {
  const [mixA, setMixA] = useState(0.6); // fracción de mayores en A
  const rates = [1, 4, 15];              // tasas por 1000 p-a por edad
  const [diff, setDiff] = useState(1.5); // factor extra de A sobre B

  const strata = useMemo(() => {
    const pa = [(1 - mixA) * 0.7, (1 - mixA) * 0.3, mixA];       // A: muchos mayores
    const pb = [0.55, 0.35, 0.10];                               // B: estándar joven
    const crude = (p: number[], mult: number) =>
      p.reduce((s, pi, i) => s + pi * rates[i] * mult, 0);
    // Directa: aplicar tasas de cada población al estándar B.
    const dirA = pb.reduce((s, pi, i) => s + pi * rates[i] * diff, 0);
    const dirB = crude(pb, 1);
    // Indirecta: SMR de A usando tasas de B como referencia.
    const esperadosA = pa.reduce((s, pi, i) => s + pi * rates[i], 0);
    const obsA = crude(pa, diff);
    return {
      crudeA: crude(pa, diff), crudeB: dirB,
      dirA, dirB, smrA: obsA / esperadosA,
      pa, pb,
    };
  }, [mixA, diff]);

  const invierte = Math.sign(strata.crudeA - strata.crudeB) !== Math.sign(strata.dirA - strata.dirB);
  const W = 420;
  const H = 150;
  const bars = [
    { label: 'cruda A', v: strata.crudeA, c: EXP_COLOR },
    { label: 'cruda B', v: strata.crudeB, c: UNEXP_COLOR },
    { label: 'ajustada A (directa)', v: strata.dirA, c: '#f87171' },
    { label: 'ajustada B (referencia)', v: strata.dirB, c: '#38bdf8' },
  ];
  const maxV = Math.max(...bars.map((b) => b.v), 1);

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La estandarización: comparar lo comparable'}</div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="w-56 space-y-1.5 text-[11px] text-ink-600">
          <label className="block">% de mayores en población A = {(mixA * 100).toFixed(0)}%
            <input type="range" min={0.05} max={0.9} step={0.05} value={mixA}
              onChange={(e) => setMixA(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">riesgo real de A sobre B = ×{diff.toFixed(1)}
            <input type="range" min={0.5} max={3} step={0.1} value={diff}
              onChange={(e) => setDiff(Number(e.target.value))} className={SLIDER} /></label>
          <div className="mt-1 rounded bg-ink-50 p-2 text-[11px]">
            <div>tasas específicas por edad: {rates.join(' / ')} ‰ (joven/adulto/mayor)</div>
            <div className="mt-1">SMR de A = <strong>{strata.smrA.toFixed(2)}</strong>
              <span className="text-ink-500"> (debería ≈ {diff.toFixed(1)})</span></div>
          </div>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="Tasas crudas y ajustadas">
            {bars.map((b, i) => (
              <g key={b.label}>
                <text x={150} y={20 + i * 32 + 9} textAnchor="end" fontSize={9} fill={GRAY}>{b.label}</text>
                <rect x={158} y={20 + i * 32} width={rnd((b.v / maxV) * (W - 220))} height={16} fill={b.c} rx={2} />
                <text x={rnd(162 + (b.v / maxV) * (W - 220))} y={20 + i * 32 + 11} fontSize={9}
                  fontWeight="bold" fill={b.c}>{b.v.toFixed(1)}</text>
              </g>
            ))}
          </svg>
          <p className={`mt-1 rounded px-2 py-1 text-[11px] font-medium ${invierte ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {invierte
              ? 'El orden se invirtió: las tasas crudas dicen lo contrario que las ajustadas. Es la paradoja de Glasgow (Ej. 4.6 de Woodward).'
              : 'Crudo y ajustado cuentan la misma historia aquí; la estructura de edad no distorsiona esta comparación.'}
          </p>
        </div>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'tasa cruda A (población envejecida)', mark: 'bar' },
        { color: UNEXP_COLOR, label: 'tasa cruda B (población estándar)', mark: 'bar' },
        { color: '#f87171', label: 'A ajustada a la estructura de B', mark: 'bar' },
        { color: '#38bdf8', label: 'B ajustada (referencia)', mark: 'bar' },
      ]} className="mt-2" />
      <SimGuide>
        Sube "% de mayores en A": la tasa cruda de A se dispara por la edad,
        no por el riesgo. Con riesgo real ×1.5 y muchos mayores, la cruda
        puede superar a B por razones demográficas, o invertirse si el
        riesgo real es &lt;1. La directa aplica las tasas de cada población a
        la estructura estándar; el SMR (indirecta) responde
        observados/esperados.
      </SimGuide>
      <p className={NOTE}>
        Réplica del ejemplo de privación socioeconómica en Glasgow (Woodward,
        Ej. 4.6): crudo y ajustado pueden cambiar de orden cuando las
        poblaciones difieren en edad.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 9. InteractionExplorer: el diagrama R00/R10/R01/R11                  */
/* ================================================================== */

const INT_PRESETS = [
  { name: 'Sin interacción', r: [0.05, 0.10, 0.08, 0.16] },
  { name: 'Sinergismo', r: [0.05, 0.10, 0.08, 0.30] },
  { name: 'Antagonismo (SHHS 4.13)', r: [0.10, 0.24, 0.25, 0.16] },
  { name: 'Unilateralismo', r: [0.05, 0.05, 0.05, 0.20] },
];

/**
 * R_ij = riesgo con exposición E=i y modificador M=j. En la escala
 * aditiva, "no interacción" es R11 - R10 = R01 - R00; en la
 * multiplicativa, R11/R10 = R01/R00.
 */
export function InteractionExplorer({ title }: { title?: ReactNode }) {
  const [risks, setRisks] = useState([0.05, 0.10, 0.08, 0.16]);
  const [r00, r10, r01, r11] = risks; // E=0/1 × M=0/1

  const rdE_M0 = r10 - r00;
  const rdE_M1 = r11 - r01;
  const rrE_M0 = r00 > 0 ? r10 / r00 : NaN;
  const rrE_M1 = r01 > 0 ? r11 / r01 : NaN;
  const additiva = Math.abs(rdE_M1 - rdE_M0) > 0.01;
  const multiplicativa = Math.abs(rrE_M1 - rrE_M0) > 0.08;
  const tipo =
    Math.sign(rdE_M0) !== Math.sign(rdE_M1) && Math.abs(rdE_M0) > 0.005 && Math.abs(rdE_M1) > 0.005
      ? 'antagonismo (el efecto cambia de signo)'
      : Math.abs(rdE_M0) < 0.005 && Math.abs(rdE_M1) > 0.005
        ? 'unilateralismo (efecto solo con M=1)'
        : Math.abs(rdE_M1) > 1.5 * Math.abs(rdE_M0) && rdE_M1 > 0
          ? 'sinergismo'
          : 'sin patrón claro / no interacción fuerte';

  const W = 380;
  const H = 170;
  const maxR = Math.max(...risks, 0.01);
  const y = (v: number) => rnd(H - 30 - (v / (maxR * 1.15)) * (H - 50));
  const xs = [70, 160, 230, 320];
  const labs = ['E− M−', 'E+ M−', 'E− M+', 'E+ M+'];

  const setR = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRisks((s) => s.map((v, j) => (j === i ? Number(e.target.value) : v)));

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'El diagrama de interacción: dos estratos, una historia'}</div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {INT_PRESETS.map((p) => (
          <button key={p.name} type="button" className={BTN_GHOST}
            onClick={() => setRisks(p.r.slice())}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg" role="img" aria-label="Diagrama de riesgos por combinación E×M">
          <line x1={xs[0]} x2={xs[1]} y1={y(r00)} y2={y(r10)} stroke={UNEXP_COLOR} strokeWidth={2.2} />
          <line x1={xs[2]} x2={xs[3]} y1={y(r01)} y2={y(r11)} stroke={EXP_COLOR} strokeWidth={2.2} />
          {[r00, r10, r01, r11].map((v, i) => (
            <g key={i}>
              <circle cx={xs[i]} cy={y(v)} r={5.5} fill={i < 2 ? UNEXP_COLOR : EXP_COLOR} />
              <text x={xs[i]} y={y(v) - 9} textAnchor="middle" fontSize={9} fontWeight="bold"
                fill={i < 2 ? UNEXP_COLOR : EXP_COLOR}>{v.toFixed(2)}</text>
              <text x={xs[i]} y={H - 14} textAnchor="middle" fontSize={9} fill={GRAY}>{labs[i]}</text>
            </g>
          ))}
          <text x={xs[0] - 14} y={y(r00)} textAnchor="end" fontSize={8} fill={GRAY}>estrato M−</text>
          <text x={xs[2] - 14} y={y(r01)} textAnchor="end" fontSize={8} fill={GRAY}>estrato M+</text>
        </svg>
        <div className="w-52 space-y-1 text-[11px] text-ink-600">
          {labs.map((l, i) => (
            <label key={l} className="block">{l}: {risks[i].toFixed(2)}
              <input type="range" min={0.01} max={0.5} step={0.01} value={risks[i]}
                onChange={setR(i)} className={SLIDER} /></label>
          ))}
        </div>
      </div>
      <div className="mt-2 grid gap-1 rounded bg-ink-50 p-2 font-mono text-[11px] md:grid-cols-2">
        <div>RD(E)|M− = {rdE_M0.toFixed(2)} · RD(E)|M+ = {rdE_M1.toFixed(2)} → {additiva ? 'interacción aditiva' : 'sin interacción aditiva'}</div>
        <div>RR(E)|M− = {fmt(rrE_M0, 2)} · RR(E)|M+ = {fmt(rrE_M1, 2)} → {multiplicativa ? 'interacción multiplicativa' : 'sin interacción multiplicativa'}</div>
        <div className="font-semibold text-ink-800 md:col-span-2">Patrón: {tipo}</div>
      </div>
      <SimLegend items={[
        { color: UNEXP_COLOR, label: 'riesgo vs. exposición en el estrato M−' },
        { color: EXP_COLOR, label: 'riesgo vs. exposición en el estrato M+' },
      ]} className="mt-2" />
      <SimGuide>
        Líneas paralelas = no interacción en la escala aditiva. El preset
        SHHS reproduce el Ejemplo 4.13 de Woodward: fumar tiene RR = 2.4 en
        quienes no tuvieron infarto, pero 0.64 en quienes sí: antagonismo.
        El mismo patrón puede ser interacción en una escala y no en la otra.
      </SimGuide>
      <p className={NOTE}>
        Woodward advierte (Ch. 4.8.3): la interacción depende de la escala.
        La epidemiología de salud pública privilegia la aditiva (importa el
        exceso absoluto); la analítica clásica reporta la multiplicativa.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 10. CohortGantt: seguimiento individual, censura y persona-tiempo    */
/* ================================================================== */

interface Subject { inicio: number; fin: number; evento: boolean }

const SUBJECTS: Subject[] = [
  { inicio: 0, fin: 24, evento: true }, { inicio: 2, fin: 30, evento: false },
  { inicio: 0, fin: 12, evento: true }, { inicio: 4, fin: 36, evento: true },
  { inicio: 6, fin: 40, evento: false }, { inicio: 1, fin: 18, evento: false },
  { inicio: 3, fin: 27, evento: true }, { inicio: 8, fin: 44, evento: false },
  { inicio: 0, fin: 9, evento: true }, { inicio: 5, fin: 33, evento: true },
  { inicio: 10, fin: 46, evento: false }, { inicio: 2, fin: 20, evento: false },
  { inicio: 7, fin: 38, evento: true }, { inicio: 12, fin: 48, evento: false },
];

/** Cohortes móviles (staggered entries) + cierre administrativo. */
export function CohortGantt({ title }: { title?: ReactNode }) {
  const [cierre, setCierre] = useState(48);
  const W = 480;
  const H = 240;
  const T = 50;
  const x = (t: number) => rnd(40 + (t / T) * (W - 60));
  const rowH = (H - 50) / SUBJECTS.length;

  const visibles = SUBJECTS.map((s) => {
    const censuradoPorCierre = s.fin > cierre;
    return { ...s, finVisto: Math.min(s.fin, cierre), perdido: censuradoPorCierre };
  });
  const pt = visibles.reduce((sum, s) => sum + Math.max(0, s.finVisto - s.inicio), 0);
  const eventos = visibles.filter((s) => s.evento && !s.perdido).length;

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La cohorte en diagrama de Gantt: cada fila es una persona'}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
        aria-label="Seguimiento individual con entradas escalonadas y censura">
        <line x1={x(cierre)} x2={x(cierre)} y1={8} y2={H - 36} stroke={GOLD} strokeDasharray="5 3" strokeWidth={1.6} />
        <text x={x(cierre)} y={6} textAnchor="middle" fontSize={8} fill={GOLD}>cierre del estudio</text>
        {visibles.map((s, i) => {
          const y0 = 14 + i * rowH;
          if (s.inicio >= cierre) {
            return (
              <text key={i} x={x(s.inicio)} y={y0 + rowH / 2 + 3} fontSize={7.5} fill={GRAY}>
                #{i + 1} no ingresó
              </text>
            );
          }
          return (
            <g key={i}>
              <line x1={x(s.inicio)} x2={x(s.finVisto)} y1={y0 + rowH / 2} y2={y0 + rowH / 2}
                stroke={s.evento && !s.perdido ? EXP_COLOR : UNEXP_COLOR} strokeWidth={3.4} strokeLinecap="round" />
              {s.evento && !s.perdido ? (
                <circle cx={x(s.finVisto)} cy={y0 + rowH / 2} r={4} fill={EXP_COLOR} />
              ) : (
                <line x1={x(s.finVisto) - 3.4} x2={x(s.finVisto) + 3.4} y1={y0 + rowH / 2 - 4} y2={y0 + rowH / 2 + 4}
                  stroke={s.perdido ? GOLD : UNEXP_COLOR} strokeWidth={1.8} />
              )}
              <text x={x(s.inicio) - 5} y={y0 + rowH / 2 + 3} textAnchor="end" fontSize={7.5} fill={GRAY}>#{i + 1}</text>
            </g>
          );
        })}
        {[0, 10, 20, 30, 40, 50].map((t) => (
          <text key={t} x={x(t)} y={H - 20} textAnchor="middle" fontSize={8} fill={GRAY}>{t}</text>
        ))}
        <text x={x(25)} y={H - 8} textAnchor="middle" fontSize={9} fill={GRAY}>meses de calendario</text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-ink-600">
        <label className="w-60">fecha de cierre: mes {cierre}
          <input type="range" min={10} max={50} step={1} value={cierre}
            onChange={(e) => setCierre(Number(e.target.value))} className={SLIDER} /></label>
        <span className="rounded bg-ink-50 px-2 py-1 font-mono">
          persona-meses = {pt.toFixed(0)} · eventos = {eventos} · tasa = {(1200 * eventos / pt).toFixed(1)} /100 p-año
        </span>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'seguimiento que termina en evento (punto)' },
        { color: UNEXP_COLOR, label: 'seguimiento que termina en censura (marca)' },
        { color: GOLD, label: 'cierre administrativo / censura por cierre', dash: true },
      ]} className="mt-2" />
      <SimGuide>
        Las entradas son escalonadas (cohorte móvil, clase 13): cada persona
        aporta meses distintos. Mueve el cierre a la izquierda: los eventos
        posteriores se convierten en censuras y el persona-tiempo se achica.
        La tasa usa ese denominador honesto, no el número de sujetos.
      </SimGuide>
      <p className={NOTE}>
        Punto de quiebre del riesgo acumulado: con entradas y salidas
        escalonadas solo el denominador persona-tiempo es correcto; base
        del SMR y de la regresión de Poisson (módulo 13).
      </p>
    </div>
  );
}

/* ================================================================== */
/* 11. BerksonExplorer: la fuente de controles distorsiona el OR        */
/* ================================================================== */

/**
 * Sesgo de Berkson/Sackett: en la población E y D son independientes
 * (OR = 1), pero hospitalizarse depende de E y de D: entre hospitalizados
 * aparece una asociación espuria.
 */
export function BerksonExplorer({ title }: { title?: ReactNode }) {
  const [hE, setHE] = useState(0.15); // P(hospitalización) por la exposición
  const [hD, setHD] = useState(0.35); // por la enfermedad estudiada
  const [hO, setHO] = useState(0.05); // por otras causas (base)

  const res = useMemo(() => {
    // P(hosp | E, D) = 1 - (1-hE)^E (1-hD)^D (1-hO)
    const ph = (e: number, d: number) =>
      1 - Math.pow(1 - hE, e) * Math.pow(1 - hD, d) * (1 - hO);
    const N = 1e5;
    // Población: E y D independientes (prev 0.3 y 0.1)
    const pe = 0.3, pd = 0.1;
    const cells = {
      a: N * pe * pd, b: N * pe * (1 - pd),
      c: N * (1 - pe) * pd, d: N * (1 - pe) * (1 - pd),
    };
    // Entre hospitalizados:
    const hosp = {
      a: cells.a * ph(1, 1), b: cells.b * ph(1, 0),
      c: cells.c * ph(0, 1), d: cells.d * ph(0, 0),
    };
    const orPob = (cells.a * cells.d) / (cells.b * cells.c);
    const orHosp = (hosp.a * hosp.d) / (hosp.b * hosp.c);
    return { orPob, orHosp };
  }, [hE, hD, hO]);

  const W = 320;
  const H = 120;
  const y = (v: number) => rnd(H - 30 - (Math.min(Math.max(v, 0), 3) / 3) * (H - 50));

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'Sesgo de Berkson: el OR hospitalario no es el OR poblacional'}</div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="w-56 space-y-1.5 text-[11px] text-ink-600">
          <label className="block">P(hospitalización | exposición) = {hE.toFixed(2)}
            <input type="range" min={0.02} max={0.6} step={0.02} value={hE}
              onChange={(e) => setHE(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">P(hospitalización | enfermedad) = {hD.toFixed(2)}
            <input type="range" min={0.05} max={0.9} step={0.05} value={hD}
              onChange={(e) => setHD(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">P(hospitalización | base) = {hO.toFixed(2)}
            <input type="range" min={0.01} max={0.3} step={0.01} value={hO}
              onChange={(e) => setHO(Number(e.target.value))} className={SLIDER} /></label>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm" role="img" aria-label="OR poblacional vs hospitalario">
            <line x1={30} x2={W - 10} y1={y(1)} y2={y(1)} stroke={GRAY} strokeDasharray="4 3" />
            <text x={W - 12} y={y(1) - 3} textAnchor="end" fontSize={8} fill={GRAY}>OR = 1</text>
            <line x1={90} x2={90} y1={y(res.orPob)} y2={y(1)} stroke={UNEXP_COLOR} strokeWidth={3} />
            <circle cx={90} cy={y(res.orPob)} r={5} fill={UNEXP_COLOR} />
            <text x={90} y={y(res.orPob) - 8} textAnchor="middle" fontSize={9} fontWeight="bold" fill={UNEXP_COLOR}>
              {res.orPob.toFixed(2)}
            </text>
            <text x={90} y={H - 12} textAnchor="middle" fontSize={9} fill={UNEXP_COLOR}>poblacional</text>
            <line x1={230} x2={230} y1={y(res.orHosp)} y2={y(1)} stroke={EXP_COLOR} strokeWidth={3} />
            <circle cx={230} cy={y(res.orHosp)} r={5} fill={EXP_COLOR} />
            <text x={230} y={y(res.orHosp) - 8} textAnchor="middle" fontSize={9} fontWeight="bold" fill={EXP_COLOR}>
              {res.orHosp.toFixed(2)}
            </text>
            <text x={230} y={H - 12} textAnchor="middle" fontSize={9} fill={EXP_COLOR}>en hospitalizados</text>
          </svg>
          <p className="mt-1 text-[11px] text-ink-500">
            Verdad poblacional: E y D independientes (OR = 1). Controles del
            hospital → OR aparente {res.orHosp.toFixed(2)}.
          </p>
        </div>
      </div>
      <SimLegend items={[
        { color: UNEXP_COLOR, label: 'OR verdadero en la población', mark: 'dot' },
        { color: EXP_COLOR, label: 'OR si los controles son hospitalizados', mark: 'dot' },
        { color: GRAY, label: 'OR = 1 (sin asociación)', dash: true },
      ]} className="mt-2" />
      <SimGuide>
        Aunque E y D sean independientes, ambos llevan gente al hospital:
        entre hospitalizados la exposición queda sobrerrepresentada en los
        "sanos". Es el sesgo de Sackett (1979), el ejemplo del curso con
        n = 2784 donde cambiar la fuente de controles cambia la conclusión.
      </SimGuide>
      <p className={NOTE}>
        La morbilidad de los controles hospitalarios compite con la
        exposición: si el control típico está hospitalizado por algo que la
        exposición también causa, la asociación se atenúa o se invierte.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 12. RocExplorer: el umbral mueve Se y Sp sobre la curva ROC          */
/* ================================================================== */

export function RocExplorer({ title }: { title?: ReactNode }) {
  const [thr, setThr] = useState(0.5);
  const [separ, setSepar] = useState(1.4); // distancia entre distribuciones

  // Dos normales: sanos N(0,1), enfermos N(separ,1)
  const t = thr * 4 - 2; // umbral en desv. estándar desde el centro sano
  const sens = 1 - normCdf(t - separ);
  const fpr = 1 - normCdf(t);
  const sp = 1 - fpr;
  const auc = normCdf(separ / Math.SQRT2);

  const W = 460;
  const H = 180;
  const x = (f: number) => rnd(40 + f * (W - 60));
  const y = (s: number) => rnd(H - 30 - s * (H - 55));
  const rocPath = useMemo(() => {
    let p = '';
    for (let i = 0; i <= 100; i++) {
      const tt = 3 - (i / 100) * 6;
      const f = 1 - normCdf(tt);
      const s = 1 - normCdf(tt - separ);
      p += `${i === 0 ? 'M' : 'L'} ${x(f)} ${y(s)}`;
    }
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [separ]);

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'La curva ROC: cada punto es un umbral de decisión'}</div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="w-52 space-y-1.5 text-[11px] text-ink-600">
          <label className="block">umbral del test = {thr.toFixed(2)}
            <input type="range" min={0.02} max={0.98} step={0.01} value={thr}
              onChange={(e) => setThr(Number(e.target.value))} className={SLIDER} /></label>
          <label className="block">separación de distribuciones = {separ.toFixed(1)}σ
            <input type="range" min={0.3} max={2.8} step={0.1} value={separ}
              onChange={(e) => setSepar(Number(e.target.value))} className={SLIDER} /></label>
          <div className="rounded bg-ink-50 p-2 font-mono text-[11px]">
            <div>Se = {(sens * 100).toFixed(0)}% · Sp = {(sp * 100).toFixed(0)}%</div>
            <div>AUC = {auc.toFixed(3)}</div>
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Curva ROC con punto operativo">
          <rect x={x(0)} y={y(1)} width={x(1) - x(0)} height={y(0) - y(1)} fill="none" stroke="#e5e7eb" />
          <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(1)} stroke={GRAY} strokeDasharray="4 3" />
          <text x={x(0.5)} y={y(0.45)} textAnchor="middle" fontSize={8} fill={GRAY}>azar (AUC = 0.5)</text>
          <path d={rocPath} fill="none" stroke={EXP_COLOR} strokeWidth={2.4} />
          <circle cx={x(fpr)} cy={y(sens)} r={6} fill={UNEXP_COLOR} stroke="#fff" strokeWidth={2} />
          <text x={x(fpr)} y={y(sens) - 10} textAnchor="middle" fontSize={9} fontWeight="bold" fill={UNEXP_COLOR}>
            umbral actual
          </text>
          <text x={x(0.5)} y={H - 12} textAnchor="middle" fontSize={9} fill={GRAY}>1 − especificidad (falsos positivos)</text>
          <text x={14} y={y(0.5)} fontSize={9} fill={GRAY} transform={`rotate(-90 14 ${y(0.5)})`} textAnchor="middle">sensibilidad</text>
        </svg>
      </div>
      <SimLegend items={[
        { color: EXP_COLOR, label: 'curva ROC (todos los umbrales posibles)' },
        { color: UNEXP_COLOR, label: 'punto operativo del umbral actual', mark: 'dot' },
        { color: GRAY, label: 'diagonal del azar', dash: true },
      ]} className="mt-2" />
      <SimGuide>
        Mueve el umbral: subirlo aumenta Se pero degrada Sp; el trade-off es
        estructural, no del test. La separación de las distribuciones fija el
        AUC: con 0.3σ casi no hay discriminación; con 2.8σ el test es casi
        perfecto. El AUC es la probabilidad de que un caso supere en score a
        un control.
      </SimGuide>
      <p className={NOTE}>
        Modelo binormal estándar: sanos N(0,1), enfermos N(Δ,1), AUC = Φ(Δ/√2).
        En la práctica la curva se estima empíricamente sobre los scores del
        modelo logístico.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 13. MetaExplorer: forest plot, fijo vs. aleatorio, I²               */
/* ================================================================== */

interface Study { name: string; rr: number; lo: number; hi: number }

// Datos reales: Hine et al. (1989), via dat.hine1989 de metafor y
// Normand (1999, Table I). n1i/n2i = pacientes lido/control, ai/ci = muertes.
// Normand analiza RD; aqui se muestran RR computados de los conteos.
const LIDOCAINE: Study[] = [
  { name: 'Chopra 1971', rr: 2.21, lo: 0.21, hi: 23.44 },
  { name: 'Mogensen 1970', rr: 1.00, lo: 0.27, hi: 3.75 },
  { name: 'Pitt 1971', rr: 1.54, lo: 0.45, hi: 5.31 },
  { name: 'Darby 1972', rr: 1.36, lo: 0.45, hi: 4.14 },
  { name: 'Bennett 1970', rr: 2.25, lo: 0.60, hi: 8.46 },
  { name: "O'Brien 1973", rr: 2.61, lo: 0.85, hi: 8.00 },
];

// Desplazamientos fijos por estudio: el slider de heterogeneidad dispersa
// los efectos verdaderos en direcciones deterministas (Σ ≈ 0).
const HET_OFF = [-0.85, 0.55, -0.5, 0.7, -0.45, 0.75];

/**
 * Meta-análisis de lidocaína profiláctica en IAM (Normand 1999): fija vs.
 * aleatorios. El peso fijo domina por el estudio grande; el aleatorio
 * reparte peso cuando hay heterogeneidad. El slider dispersa los efectos
 * para ver cómo reaccionan Q, I², τ², los pesos y el rombo combinado.
 */
export function MetaExplorer({ title }: { title?: ReactNode }) {
  const [random, setRandom] = useState(false);
  const [hetero, setHetero] = useState(0);

  const pooled = useMemo(() => {
    const y = LIDOCAINE.map((s, i) => Math.log(s.rr) + hetero * HET_OFF[i]);
    const v = LIDOCAINE.map((s) => Math.pow((Math.log(s.hi) - Math.log(s.lo)) / 3.92, 2));
    const w = v.map((x) => 1 / x);
    const k = LIDOCAINE.length;
    const yF = w.reduce((s, wi, i) => s + wi * y[i], 0) / w.reduce((a, b) => a + b, 0);
    // Q y tau² de DerSimonian-Laird
    const Q = w.reduce((s, wi, i) => s + wi * Math.pow(y[i] - yF, 2), 0);
    const c = w.reduce((a, b) => a + b, 0) - w.reduce((s, wi) => s + wi * wi, 0) / w.reduce((a, b) => a + b, 0);
    const tau2 = Math.max(0, (Q - (k - 1)) / c);
    const i2 = Math.max(0, (Q - (k - 1)) / Math.max(Q, 1e-9));
    const wR = v.map((x) => 1 / (x + tau2));
    const yR = wR.reduce((s, wi, i) => s + wi * y[i], 0) / wR.reduce((a, b) => a + b, 0);
    const vPool = random ? 1 / wR.reduce((a, b) => a + b, 0) : 1 / w.reduce((a, b) => a + b, 0);
    const wrSum = wR.reduce((a, b) => a + b, 0);
    return {
      est: Math.exp(random ? yR : yF),
      lo: Math.exp((random ? yR : yF) - 1.96 * Math.sqrt(vPool)),
      hi: Math.exp((random ? yR : yF) + 1.96 * Math.sqrt(vPool)),
      Q, i2, tau2,
      pQ: chi2Sf(Q, k - 1),
      y,
      w: (random ? wR : w).map((x) => x / (random ? wrSum : w.reduce((a, b) => a + b, 0))),
    };
  }, [random, hetero]);

  const W = 480;
  const H = 200;
  const lo = 0.05;
  const hi = 12;
  const lx = (v: number) => rnd(150 + ((Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 200));
  const rowH = 24;

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'Meta-análisis de lidocaína en IAM (Hine 1989 / Normand 1999): el conjunto contradice a cada estudio'}</div>
      <div className="mb-2 flex gap-2 text-[11px]">
        <button type="button" className={!random ? BTN_MAIN : BTN_GHOST} onClick={() => setRandom(false)}>Efecto fijo</button>
        <button type="button" className={random ? BTN_MAIN : BTN_GHOST} onClick={() => setRandom(true)}>Efectos aleatorios</button>
      </div>
      <div className="mb-2 grid gap-3 md:grid-cols-2">
        <label className="block text-[11px] text-ink-600">
          heterogeneidad entre estudios (desplaza los θ verdaderos):{' '}
          <strong>{hetero.toFixed(2)}</strong>
          <input type="range" min={0} max={1} step={0.05} value={hetero}
            onChange={(e) => setHetero(Number(e.target.value))} className={SLIDER} />
        </label>
        <p className="self-center text-[11px] text-ink-500">
          {pooled.i2 < 0.3
            ? 'I² < 30%: la variación entre estudios cabe en el azar; fijo ≈ aleatorio.'
            : pooled.i2 < 0.6
              ? 'I² moderado: el aleatorio empieza a repartir peso hacia los estudios pequeños.'
              : 'I² alto: heterogeneidad sustantiva; el aleatorio iguala pesos y ensancha el IC.'}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Forest plot de los seis estudios">
        <line x1={lx(1)} x2={lx(1)} y1={10} y2={H - 34} stroke={GRAY} strokeDasharray="4 3" />
        <text x={lx(1)} y={H - 24} textAnchor="middle" fontSize={8} fill={GRAY}>RR = 1</text>
        {[0.1, 0.5, 1, 2, 5, 10].map((g) => (
          <text key={g} x={lx(g)} y={H - 10} textAnchor="middle" fontSize={8} fill={GRAY}>{g}</text>
        ))}
        {LIDOCAINE.map((s, i) => {
          const y0 = 22 + i * rowH;
          const rr = Math.exp(pooled.y[i]);
          const shift = Math.exp(pooled.y[i]) / s.rr;
          const sz = 4 + 10 * Math.sqrt(pooled.w[i]);
          return (
            <g key={s.name}>
              <text x={140} y={y0 + 4} textAnchor="end" fontSize={9} fill={GRAY}>{s.name}</text>
              <text x={W - 4} y={y0 + 3} textAnchor="end" fontSize={8} fill={GRAY}>
                {(pooled.w[i] * 100).toFixed(0)}%
              </text>
              <line x1={lx(Math.max(lo, s.lo * shift))} x2={lx(Math.min(hi, s.hi * shift))} y1={y0} y2={y0} stroke={UNEXP_COLOR} strokeWidth={1.6} />
              <rect x={lx(rr) - sz / 2} y={y0 - sz / 2} width={sz} height={sz}
                fill={UNEXP_COLOR} transform={`rotate(45 ${lx(rr)} ${y0})`} />
            </g>
          );
        })}
        {(() => {
          const y0 = 22 + LIDOCAINE.length * rowH;
          return (
            <g>
              <text x={140} y={y0 + 4} textAnchor="end" fontSize={9} fontWeight="bold" fill={EXP_COLOR}>
                combinado ({random ? 'aleatorio' : 'fijo'})
              </text>
              <polygon
                points={`${lx(pooled.est)},${y0 - 7} ${lx(pooled.hi)},${y0} ${lx(pooled.est)},${y0 + 7} ${lx(pooled.lo)},${y0}`}
                fill={EXP_COLOR} />
            </g>
          );
        })()}
      </svg>
      <div className="mt-1 font-mono text-[11px] text-ink-700">
        RR combinado = {pooled.est.toFixed(2)} ({pooled.lo.toFixed(2)}–{pooled.hi.toFixed(2)})
        · Q = {pooled.Q.toFixed(1)} (p = {pooled.pQ.toFixed(3)}) · I² = {(pooled.i2 * 100).toFixed(0)}% · τ² = {pooled.tau2.toFixed(3)}
      </div>
      <SimLegend items={[
        { color: UNEXP_COLOR, label: 'estudio individual (rombo ∝ peso; línea = IC95%; % = peso)', mark: 'dot' },
        { color: EXP_COLOR, label: 'estimación combinada (el rombo ancho es su IC)', mark: 'dot' },
        { color: GRAY, label: 'RR = 1', dash: true },
      ]} className="mt-2" />
      <SimGuide>
        Con heterogeneidad en 0 los datos reales dan I² = 0% y los dos modelos
        coinciden. Sube el slider: los efectos se dispersan, Q crece, I² y τ²
        despegan, y el aleatorio reparte peso a los estudios pequeños y
        ensancha su rombo. Ningún estudio solo es concluyente, pero la
        síntesis sí: la lidocaína profiláctica no reduce mortalidad pese a su
        beneficio antiarrítmico.
      </SimGuide>
      <p className={NOTE}>
        Datos reales de Hine et al. (1989), Tabla I de Normand (1999,
        <em>Stat Med</em> 18:321–359), también en <code>dat.hine1989</code> del
        paquete metafor. Normand analizó la diferencia de riesgos (+2.94 pp,
        IC95% 0.4–5.5); aquí se muestran los RR computados de los conteos.
      </p>
    </div>
  );
}
