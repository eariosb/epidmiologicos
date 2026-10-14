'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { tokens } from '@/lib/tokens';
import { SimGuide, SimLegend } from '@/components/SimBits';
import {
  MN_METHODS,
  coverageAudit,
  entropy,
  mulberry32,
  rmultinom,
  type MultinomMethodKey,
} from '@/lib/multinomial';

const BTN_MAIN =
  'rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700';
const BTN_GHOST =
  'rounded border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:bg-ink-100';
const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const SLIDER = 'w-full accent-brand-600';
const fmt = (x: number, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const rnd = (v: number) => Math.round(v * 100) / 100;

const METHOD_COLORS: Record<MultinomMethodKey, string> = {
  tcl: tokens.chart.alert,
  qh: tokens.chart.tertiary,
  goodman: tokens.chart.primary,
  sisonGlaz: tokens.chart.aux,
};

/* ================================================================== */
/* AuditCard: la ficha que reporta nivel nominal vs nivel empírico     */
/* (con EE de Monte Carlo). Todos los laboratorios de auditoría la     */
/* usan, para que la comparación se lea igual en todo el curso.        */
/* ================================================================== */

export interface AuditRow {
  label: string;
  color?: string;
  /** Nivel prometido por el procedimiento (p. ej. 0.95). */
  nominal: number;
  /** Nivel observado en la auditoría. */
  estimate: number;
  /** Error estándar Monte Carlo; undefined => cálculo exacto. */
  se?: number;
  extra?: string;
}

export function AuditCard({ rows, title }: { rows: AuditRow[]; title?: ReactNode }) {
  const verdict = (r: AuditRow) => {
    const tol = 2 * (r.se ?? 0);
    if (r.estimate - tol > r.nominal)
      return { t: 'conservador', c: tokens.status.warning };
    if (r.estimate + tol < r.nominal)
      return { t: 'subcubre', c: tokens.status.danger };
    return { t: 'cumple', c: tokens.status.ok };
  };
  return (
    <div className="rounded border border-ink-200 bg-ink-50/60 p-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        {title ?? 'Ficha de auditoría: nominal vs. empírico'}
      </p>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-ink-200 text-left text-ink-500">
            <th className="py-1 font-medium">método</th>
            <th className="py-1 text-right font-medium">nominal</th>
            <th className="py-1 text-right font-medium">empírico ± 2EE</th>
            <th className="py-1 text-right font-medium">veredicto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const v = verdict(r);
            return (
              <tr key={r.label} className="border-b border-ink-100 align-top">
                <td className="py-1 pr-2">
                  <span style={{ color: r.color ?? tokens.chart.deep }}>{r.label}</span>
                  {r.extra && (
                    <span className="block text-[10px] text-ink-500">{r.extra}</span>
                  )}
                </td>
                <td className="py-1 text-right font-mono">{fmt(r.nominal, 2)}</td>
                <td className="py-1 text-right font-mono">
                  {fmt(r.estimate, 3)}
                  {r.se !== undefined && ` ± ${fmt(2 * r.se, 3)}`}
                  {r.se === undefined && ' (exacto)'}
                </td>
                <td className="py-1 text-right">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ background: v.c }}
                  >
                    {v.t}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/* 1. MultinomCIExplorer: serotipos y cobertura simultánea             */
/*    (M06 — vigilancia de variantes, González-Correa-Vélez 2015)      */
/* ================================================================== */

const SEROTYPES = ['DENV-1', 'DENV-2', 'DENV-3', 'DENV-4'];
const UNIFORM4 = [0.25, 0.25, 0.25, 0.25];
const SKEWED4 = [0.8, 0.1, 0.07, 0.03];

export function MultinomCIExplorer({ title }: { title?: ReactNode }) {
  const [n, setN] = useState(60);
  const [imbalance, setImbalance] = useState(0.55);
  const [conf, setConf] = useState(0.95);
  const [sel, setSel] = useState<MultinomMethodKey[]>(['tcl', 'qh', 'goodman']);
  const [seed, setSeed] = useState(7);
  const [reps, setReps] = useState(800);
  const [audit, setAudit] = useState<ReturnType<typeof coverageAudit> | null>(null);
  const [busy, setBusy] = useState(false);

  const pi = useMemo(
    () => UNIFORM4.map((u, i) => (1 - imbalance) * u + imbalance * SKEWED4[i]),
    [imbalance]
  );

  const sample = useMemo(() => {
    const rng = mulberry32(seed);
    return rmultinom(n, pi, rng);
  }, [seed, n, pi]);

  const bands = useMemo(() => {
    const rng = mulberry32(seed + 1000);
    return sel.map((k) => ({
      key: k,
      label: MN_METHODS[k].short,
      color: METHOD_COLORS[k],
      band: MN_METHODS[k].fn(sample, n, conf, rng),
    }));
  }, [sel, sample, n, conf, seed]);

  const runAudit = () => {
    setBusy(true);
    // El cómputo es síncrono pero acotado; se cede un frame para pintar "…".
    setTimeout(() => {
      setAudit(coverageAudit(pi, n, sel, conf, reps, 2026 + seed));
      setBusy(false);
    }, 30);
  };

  const W = 340;
  const rowH = 15;
  const groupH = bands.length * rowH + 12;
  const H = 14 + 4 * groupH + 14;
  const px = (v: number) => rnd(52 + v * (W - 70));

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Cuatro serotipos, cuatro intervalos: ¿cubren al mismo tiempo?'}
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 text-xs text-ink-600">
        <label className="w-40">
          n muestra = {n}
          <input type="range" min={30} max={200} step={10} value={n}
            onChange={(e) => { setN(Number(e.target.value)); setAudit(null); }}
            className={SLIDER} />
        </label>
        <label className="w-44">
          desequilibrio = {imbalance.toFixed(2)}
          <input type="range" min={0} max={0.9} step={0.05} value={imbalance}
            onChange={(e) => { setImbalance(Number(e.target.value)); setAudit(null); }}
            className={SLIDER} />
        </label>
        <label>
          1 − α ={' '}
          <select value={conf} onChange={(e) => { setConf(Number(e.target.value)); setAudit(null); }}
            className="rounded border border-ink-200 px-1 py-0.5">
            <option value={0.9}>0.90</option>
            <option value={0.95}>0.95</option>
            <option value={0.99}>0.99</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(Object.keys(MN_METHODS) as MultinomMethodKey[]).map((k) => (
            <label key={k} className="flex items-center gap-1">
              <input type="checkbox" checked={sel.includes(k)}
                onChange={(e) => {
                  setSel(e.target.checked ? [...sel, k] : sel.filter((s) => s !== k));
                  setAudit(null);
                }} />
              <span style={{ color: METHOD_COLORS[k] }}>{MN_METHODS[k].short}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] text-ink-500">
            Una muestra de n = {n}: los tramos son los IC de cada método por
            serotipo; la línea punteada es el π verdadero.
          </p>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
            aria-label="Intervalos simultáneos por método y serotipo">
            {SEROTYPES.map((sero, gi) => {
              const y0 = 12 + gi * groupH;
              return (
                <g key={sero}>
                  <text x={8} y={y0 + (bands.length * rowH) / 2 + 3}
                    fontSize={9} fontWeight="bold" fill={tokens.chart.text}>
                    {sero}
                  </text>
                  <line x1={px(pi[gi])} x2={px(pi[gi])} y1={y0 - 2}
                    y2={y0 + bands.length * rowH + 4}
                    stroke={tokens.chart.tick} strokeDasharray="3 3" />
                  {bands.map((b, bi) => {
                    const yc = y0 + bi * rowH + 6;
                    const covers =
                      b.band.lo[gi] <= pi[gi] && pi[gi] <= b.band.hi[gi];
                    return (
                      <g key={b.key}>
                        <line x1={px(b.band.lo[gi])} x2={px(b.band.hi[gi])}
                          y1={yc} y2={yc}
                          stroke={covers ? b.color : tokens.status.danger}
                          strokeWidth={3}
                          strokeDasharray={covers ? undefined : '2 2'} />
                        <text x={W - 6} y={yc + 3} textAnchor="end" fontSize={7.5}
                          fill={b.color}>
                          {b.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-600">
            <button type="button" className={BTN_GHOST}
              onClick={() => { setSeed((s) => s + 1); setAudit(null); }}>
              Nueva muestra
            </button>
            <span className="font-mono">
              x = ({sample.join(', ')}) · H(π)/ln k = {entropy(pi).toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-end gap-3 text-xs text-ink-600">
            <label className="w-32">
              réplicas R = {reps}
              <input type="range" min={200} max={3000} step={200} value={reps}
                onChange={(e) => setReps(Number(e.target.value))} className={SLIDER} />
            </label>
            <button type="button" className={BTN_MAIN} disabled={busy || sel.length === 0}
              onClick={runAudit}>
              {busy ? 'Simulando…' : 'Auditar cobertura'}
            </button>
          </div>
          {audit ? (
            <AuditCard
              title="Cobertura simultánea (los k intervalos a la vez)"
              rows={audit.map((r) => ({
                label: MN_METHODS[r.key].label,
                color: METHOD_COLORS[r.key],
                nominal: conf,
                estimate: r.cov,
                se: r.se,
                extra:
                  r.key === 'sisonGlaz'
                    ? 'b calibrado por MC en cada réplica'
                    : undefined,
              }))}
            />
          ) : (
            <p className="rounded border border-dashed border-ink-200 p-3 text-[11px] text-ink-500">
              La auditoría repite el estudio R veces con datos nuevos del mismo
              π y cuenta en cuántas los k intervalos cubren a la vez. El TCL por
              celda promete {(conf * 100).toFixed(0)}% — mira qué entrega.
            </p>
          )}
          <SimGuide>
            Con desequilibrio en 0 los serotipos están parejos y hasta el TCL
            se acerca al nominal. Súbelo: aparece una variante rara (DENV-4)
            y la cobertura simultánea del TCL se desploma — la celda con casi
            nada de información es la que rompe el conjunto. QH es honesto
            pero ancho; Goodman da casi la misma cobertura con intervalos
            más cortos.
          </SimGuide>
        </div>
      </div>

      <SimLegend items={[
        { color: tokens.chart.tick, label: 'π verdadero del serotipo', dash: true },
        { color: tokens.status.danger, label: 'intervalo que no cubre su π', dash: true },
      ]} className="mt-2" />
      <p className={NOTE}>
        Auditoría por Monte Carlo con EE = √(c(1−c)/R) — no es enumeración
        como en el caso binomial. González, Correa &amp; Vélez (2015,
        <em> Rev. Fac. Ciencias</em> 4(2):150–163) compararon 13 métodos por
        nivel real y longitud: el TCL rinde mal y recomiendan los basados en
        la F, verosimilitud relativa y Quesenberry–Hurst. Sison &amp; Glaz
        (1995) calibran la semiamplitud común b con la aproximación de Levin;
        aquí b se calibra por simulación bajo π = p̂.
      </p>
    </div>
  );
}

/* ================================================================== */
/* 2. Tau2Audit: el estimador de la heterogeneidad también falla       */
/*    (M17 — meta-análisis, DerSimonian–Laird vs. Paule–Mandel)        */
/* ================================================================== */

function rnorm(rng: () => number) {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Q(τ²) = Σ w_i (y_i − ȳ_w)² con w_i = 1/(v_i + τ²); decreciente en τ². */
function qOfTau2(y: number[], v: number[], t2: number) {
  let sw = 0, swy = 0;
  const w = v.map((vi) => 1 / (vi + t2));
  for (let i = 0; i < y.length; i++) {
    sw += w[i];
    swy += w[i] * y[i];
  }
  const mu = swy / sw;
  let q = 0;
  for (let i = 0; i < y.length; i++) q += w[i] * (y[i] - mu) ** 2;
  return { q, mu, sw };
}

function dlTau2(y: number[], v: number[]) {
  const k = y.length;
  const { q } = qOfTau2(y, v, 0);
  let sw = 0, sww = 0;
  for (const vi of v) {
    const wi = 1 / vi;
    sw += wi;
    sww += wi * wi;
  }
  const c = sw - sww / sw;
  return Math.max(0, (q - (k - 1)) / c);
}

/** Paule–Mandel: la raíz de Q(τ²) = k − 1, por bisección. */
function pmTau2(y: number[], v: number[]) {
  const k = y.length;
  if (qOfTau2(y, v, 0).q <= k - 1) return 0;
  let lo = 0, hi = 4;
  while (qOfTau2(y, v, hi).q > k - 1 && hi < 1e6) hi *= 4;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (qOfTau2(y, v, m).q > k - 1) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function Tau2Audit({ title }: { title?: ReactNode }) {
  const [k, setK] = useState(10);
  const [tau, setTau] = useState(0.2);
  const [reps, setReps] = useState(1200);
  const [res, setRes] = useState<{
    dl: number[]; pm: number[];
    covFE: number; covDL: number; covPM: number;
    truncDL: number; truncPM: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      const rng = mulberry32(99);
      const dl: number[] = [], pm: number[] = [];
      let covFE = 0, covDL = 0, covPM = 0, truncDL = 0, truncPM = 0;
      const z = 1.96;
      for (let r = 0; r < reps; r++) {
        const v = Array.from({ length: k }, () => 0.01 + 0.08 * rng());
        const y = v.map((vi) => rnorm(rng) * tau + rnorm(rng) * Math.sqrt(vi));
        const t2dl = dlTau2(y, v);
        const t2pm = pmTau2(y, v);
        dl.push(t2dl);
        pm.push(t2pm);
        if (t2dl === 0) truncDL++;
        if (t2pm === 0) truncPM++;
        // IC del combinado bajo cada tau² (mu verdadero = 0)
        const fe = qOfTau2(y, v, 0);
        if (Math.abs(fe.mu) < z * Math.sqrt(1 / fe.sw)) covFE++;
        const reDL = qOfTau2(y, v, t2dl);
        if (Math.abs(reDL.mu) < z * Math.sqrt(1 / reDL.sw)) covDL++;
        const rePM = qOfTau2(y, v, t2pm);
        if (Math.abs(rePM.mu) < z * Math.sqrt(1 / rePM.sw)) covPM++;
      }
      setRes({
        dl, pm,
        covFE: covFE / reps, covDL: covDL / reps, covPM: covPM / reps,
        truncDL: truncDL / reps, truncPM: truncPM / reps,
      });
      setBusy(false);
    }, 30);
  };

  const W = 340;
  const H = 150;
  const BIN = 30;
  const hist = useMemo(() => {
    if (!res) return null;
    const mk = (arr: number[]) => {
      const h = new Array(BIN).fill(0);
      for (const v of arr) h[Math.min(BIN - 1, Math.floor((v / 0.8) * BIN))]++;
      return h.map((c) => c / arr.length);
    };
    return { dl: mk(res.dl), pm: mk(res.pm) };
  }, [res]);

  const maxH = hist ? Math.max(...hist.dl, ...hist.pm) : 1;
  const bw = (W - 50) / BIN;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'τ² por momentos puede ser negativo: la auditoría del estimador'}
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 text-xs text-ink-600">
        <label className="w-36">
          k estudios = {k}
          <input type="range" min={4} max={30} step={1} value={k}
            onChange={(e) => { setK(Number(e.target.value)); setRes(null); }}
            className={SLIDER} />
        </label>
        <label className="w-36">
          τ verdadero = {tau.toFixed(2)}
          <input type="range" min={0} max={0.5} step={0.05} value={tau}
            onChange={(e) => { setTau(Number(e.target.value)); setRes(null); }}
            className={SLIDER} />
        </label>
        <label className="w-32">
          réplicas = {reps}
          <input type="range" min={400} max={3000} step={200} value={reps}
            onChange={(e) => setReps(Number(e.target.value))} className={SLIDER} />
        </label>
        <button type="button" className={BTN_MAIN} disabled={busy} onClick={run}>
          {busy ? 'Simulando…' : 'Auditar τ²'}
        </button>
      </div>

      {res && hist ? (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
              aria-label="Distribución Monte Carlo de tau² estimado">
              <line x1={40} x2={W - 6} y1={H - 20} y2={H - 20} stroke={tokens.chart.tick} />
              <line x1={rnd(40 + (tau / 0.8) * (W - 50))} x2={rnd(40 + (tau / 0.8) * (W - 50))}
                y1={8} y2={H - 20} stroke={tokens.chart.tick} strokeDasharray="4 3" />
              <text x={rnd(40 + (tau / 0.8) * (W - 50))} y={H - 6} textAnchor="middle"
                fontSize={8} fill={tokens.chart.text}>
                τ = {tau.toFixed(2)}
              </text>
              {hist.dl.map((h, i) => (
                <rect key={i} x={rnd(40 + i * bw)} y={rnd(H - 20 - (h / maxH) * (H - 36))}
                  width={Math.max(0.5, bw - 1)} height={rnd((h / maxH) * (H - 36))}
                  fill={tokens.chart.primary} opacity={0.45} />
              ))}
              {hist.pm.map((h, i) => (
                <rect key={i} x={rnd(40 + i * bw)} y={rnd(H - 20 - (h / maxH) * (H - 36))}
                  width={Math.max(0.5, bw - 1)} height={rnd((h / maxH) * (H - 36))}
                  fill="none" stroke={tokens.chart.secondary} strokeWidth={1} />
              ))}
              <text x={44} y={14} fontSize={8} fill={tokens.chart.primary}>DL (relleno)</text>
              <text x={44} y={24} fontSize={8} fill={tokens.chart.secondary}>Paule–Mandel (borde)</text>
            </svg>
            <SimLegend items={[
              { color: tokens.chart.primary, label: `τ̂² DL — truncado a 0 en ${(res.truncDL * 100).toFixed(0)}% de réplicas`, mark: 'bar' },
              { color: tokens.chart.secondary, label: `τ̂² PM — truncado en ${(res.truncPM * 100).toFixed(0)}%`, mark: 'bar' },
              { color: tokens.chart.tick, label: 'τ² verdadero', dash: true },
            ]} className="mt-1" />
          </div>
          <div>
            <AuditCard
              title="Cobertura del IC95% combinado para μ"
              rows={[
                {
                  label: 'Efecto fijo (τ² = 0)',
                  color: tokens.chart.tick,
                  nominal: 0.95,
                  estimate: res.covFE,
                  se: Math.sqrt(res.covFE * (1 - res.covFE) / reps),
                  extra: 'ignora la heterogeneidad',
                },
                {
                  label: 'DerSimonian–Laird',
                  color: tokens.chart.primary,
                  nominal: 0.95,
                  estimate: res.covDL,
                  se: Math.sqrt(res.covDL * (1 - res.covDL) / reps),
                  extra: `τ̂² = 0 en ${(res.truncDL * 100).toFixed(0)}%`,
                },
                {
                  label: 'Paule–Mandel',
                  color: tokens.chart.secondary,
                  nominal: 0.95,
                  estimate: res.covPM,
                  se: Math.sqrt(res.covPM * (1 - res.covPM) / reps),
                  extra: `τ̂² = 0 en ${(res.truncPM * 100).toFixed(0)}%`,
                },
              ]}
            />
            <SimGuide>
              Con τ = 0 el efecto fijo es legítimo y todo coincide. Sube τ y
              mira dos cosas: la masa de τ̂² en el borde 0 (el estimador por
              momentos sale del espacio paramétrico y hay que truncarlo) y la
              caída de la cobertura del IC combinado — con pocos estudios,
              estimar τ² cuesta más precisión de la que anuncia el IC.
            </SimGuide>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded border border-dashed border-ink-200 p-3 text-[11px] text-ink-500">
          Cada réplica inventa un meta-análisis completo: k estudios con
          varianzas vᵢ realistas, efectos θᵢ ~ N(0, τ) y estimaciones
          yᵢ ~ N(θᵢ, √vᵢ). Sobre esos datos se estima τ² dos veces y se
          audita el IC del combinado.
        </p>
      )}

      <p className={NOTE}>
        DL trunca Q − (k − 1) a cero: un estimador por momentos que produce
        una varianza negativa — el caso canónico de estimación inadmisible
        resuelto a martillazos. Langan et al. (2019) y Veroniki et al. (2016)
        documentan que con k pequeño o τ² ≈ 0 los métodos frecuentistas
        subcubren el efecto combinado; el remedio práctico es reportar el
        estimador usado y el τ̂², no solo I².
      </p>
    </div>
  );
}

/* ================================================================== */
/* 3. BootstrapStress: caso-control con n chico — ¿cuándo colapsa?     */
/*    (M14 — enfermedad rara, Woolf vs. bootstrap percentil)            */
/* ================================================================== */

export function BootstrapStress({ title }: { title?: ReactNode }) {
  const [nG, setNG] = useState(15);
  const [orTrue, setOrTrue] = useState(2);
  const [p0, setP0] = useState(0.2);
  const [reps, setReps] = useState(800);
  const [B, setB] = useState(400);
  const [res, setRes] = useState<{
    covWoolf: number; covWoolfH: number; covBoot: number; undefined: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const e1 = (orTrue * p0) / (1 - p0 + orTrue * p0);

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      const rng = mulberry32(4242);
      const z = 1.96;
      const bin = (nn: number, p: number) => {
        let c = 0;
        for (let i = 0; i < nn; i++) if (rng() < p) c++;
        return c;
      };
      let covW = 0, covWH = 0, covB = 0, undef = 0;
      for (let r = 0; r < reps; r++) {
        const x1 = bin(nG, e1);
        const x0 = bin(nG, p0);
        const a = x1, b = nG - x1, c = x0, d = nG - x0;
        // Woolf estricto: se indefinido si hay celda 0
        if (a * b * c * d === 0) undef++;
        else {
          const lo = Math.log((a * d) / (b * c));
          const seL = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
          if (Math.exp(lo - z * seL) <= orTrue && orTrue <= Math.exp(lo + z * seL)) covW++;
        }
        // Woolf + 0.5 (siempre definido)
        {
          const A = a + 0.5, Bc = b + 0.5, Cc = c + 0.5, D = d + 0.5;
          const lo = Math.log((A * D) / (Bc * Cc));
          const seL = Math.sqrt(1 / A + 1 / Bc + 1 / Cc + 1 / D);
          if (Math.exp(lo - z * seL) <= orTrue && orTrue <= Math.exp(lo + z * seL)) covWH++;
        }
        // Bootstrap percentil: remuestra dentro de cada grupo
        const ors = new Float64Array(B);
        for (let j = 0; j < B; j++) {
          const bx1 = bin(nG, x1 / nG);
          const bx0 = bin(nG, x0 / nG);
          const A = bx1 + 0.5, Bc = nG - bx1 + 0.5;
          const Cc = bx0 + 0.5, D = nG - bx0 + 0.5;
          ors[j] = Math.log((A * D) / (Bc * Cc));
        }
        ors.sort();
        const lo = ors[Math.floor(0.025 * B)];
        const hi = ors[Math.floor(0.975 * B)];
        if (Math.exp(lo) <= orTrue && orTrue <= Math.exp(hi)) covB++;
      }
      setRes({
        covWoolf: covW / (reps - undef),
        covWoolfH: covWH / reps,
        covBoot: covB / reps,
        undefined: undef / reps,
      });
      setBusy(false);
    }, 30);
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'n = 15 por grupo: el IC del OR bajo estrés'}
      </div>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 text-xs text-ink-600">
        <label className="w-32">
          n por grupo = {nG}
          <input type="range" min={8} max={60} step={1} value={nG}
            onChange={(e) => { setNG(Number(e.target.value)); setRes(null); }}
            className={SLIDER} />
        </label>
        <label className="w-36">
          OR verdadero = {orTrue.toFixed(2)}
          <input type="range" min={1} max={5} step={0.25} value={orTrue}
            onChange={(e) => { setOrTrue(Number(e.target.value)); setRes(null); }}
            className={SLIDER} />
        </label>
        <label className="w-36">
          P(exp | control) = {p0.toFixed(2)}
          <input type="range" min={0.05} max={0.5} step={0.05} value={p0}
            onChange={(e) => { setP0(Number(e.target.value)); setRes(null); }}
            className={SLIDER} />
        </label>
        <label className="w-28">
          R = {reps}
          <input type="range" min={300} max={2000} step={100} value={reps}
            onChange={(e) => setReps(Number(e.target.value))} className={SLIDER} />
        </label>
        <label className="w-28">
          B = {B}
          <input type="range" min={100} max={1000} step={100} value={B}
            onChange={(e) => setB(Number(e.target.value))} className={SLIDER} />
        </label>
        <button type="button" className={BTN_MAIN} disabled={busy} onClick={run}>
          {busy ? 'Simulando…' : 'Auditar ICs'}
        </button>
      </div>

      {res ? (
        <div className="mt-3">
          <AuditCard
            title="Cobertura del IC95% para el OR"
            rows={[
              {
                label: 'Woolf (log-OR) estricto',
                color: tokens.chart.alert,
                nominal: 0.95,
                estimate: res.covWoolf,
                se: Math.sqrt(res.covWoolf * (1 - res.covWoolf) / reps),
                extra: `indefinido en ${(res.undefined * 100).toFixed(0)}% de las tablas (celda en 0)`,
              },
              {
                label: 'Woolf + 0.5',
                color: tokens.chart.primary,
                nominal: 0.95,
                estimate: res.covWoolfH,
                se: Math.sqrt(res.covWoolfH * (1 - res.covWoolfH) / reps),
                extra: 'corrección de Haldane–Anscombe',
              },
              {
                label: 'Bootstrap percentil',
                color: tokens.chart.tertiary,
                nominal: 0.95,
                estimate: res.covBoot,
                se: Math.sqrt(res.covBoot * (1 - res.covBoot) / reps),
                extra: `B = ${B} remuestras por réplica`,
              },
            ]}
          />
          <SimGuide>
            Baja n hacia 10: primero aparecen tablas con celda en cero donde
            Woolf no existe, y la cobertura de lo que sobrevive se cae del
            nominal. El bootstrap responde mejor, pero tampoco es magia: con
            n ≈ 10 y exposición rara ni él alcanza 0.95 — el límite está en
            la información, no en la técnica.
          </SimGuide>
        </div>
      ) : (
        <p className="mt-3 rounded border border-dashed border-ink-200 p-3 text-[11px] text-ink-500">
          R estudios independientes de casos (n = {nG}, exposición {fmt(e1, 2)})
          y controles (n = {nG}, exposición {p0.toFixed(2)}), cada uno con OR
          verdadero {orTrue.toFixed(2)}. A cada tabla se le calculan tres IC y
          se audita cuántos cubren.
        </p>
      )}

      <p className={NOTE}>
        La capa externa (R réplicas del estudio) audita el procedimiento; la
        capa interna (B remuestras bootstrap) es la aproximación a la
        distribución muestral — dos Monte Carlo distintos que no deben
        confundirse. Con B = 400 el EE interno del percentil es ~1–2 pp;
        la ficha reporta el EE de la capa externa.
      </p>
    </div>
  );
}
