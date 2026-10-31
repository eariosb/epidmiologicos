/**
 * Fórmulas epidemiológicas que dibujan los simuladores y las tablas.
 *
 * Vivían dentro de los componentes; aquí se pueden probar contra valores
 * calculados a mano o con R. Convención de la tabla 2×2 del curso:
 *
 *            desenlace +   desenlace −
 *   expuesto      a             b        (n1 = a + b)
 *   no exp.       c             d        (n0 = c + d)
 *
 * `a` y `c` son casos entre expuestos y no expuestos, así que los riesgos
 * son a/n1 y c/n0.
 */

import { normCdf } from './exact2x2';

export interface TwoByTwo {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface TwoByTwoMeasures {
  riskExposed: number;
  riskUnexposed: number;
  /** Riesgo relativo r1/r0. */
  rr: number;
  /** Razón de odds (a·d)/(b·c). */
  or: number;
  /** Diferencia de riesgos r1 − r0. */
  rd: number;
  /** Número necesario a tratar/dañar: 1/|RD|. */
  nnt: number;
  /** Fracción etiológica en expuestos (RR − 1)/RR. */
  pafExposed: number;
  /** Fracción atribuible poblacional de Levin con prevalencia `pe`. */
  pafPopulation: (pe: number) => number;
  seLnRR: number;
  seLnOR: number;
  ciRR: [number, number];
  ciOR: [number, number];
  /** χ² de Pearson sin corrección por continuidad. */
  chi2: number;
}

/** Medidas de asociación e intervalos de Woolf para una tabla 2×2. */
export function twoByTwo({ a, b, c, d }: TwoByTwo): TwoByTwoMeasures {
  const n1 = a + b;
  const n0 = c + d;
  const n = n1 + n0;
  const m1 = a + c;
  const riskExposed = n1 > 0 ? a / n1 : NaN;
  const riskUnexposed = n0 > 0 ? c / n0 : NaN;
  const rr = riskUnexposed > 0 ? riskExposed / riskUnexposed : NaN;
  const or = b * c > 0 ? (a * d) / (b * c) : NaN;
  const rd = riskExposed - riskUnexposed;
  const nnt = rd !== 0 ? 1 / Math.abs(rd) : NaN;
  const pafExposed = Number.isFinite(rr) && rr > 0 ? (rr - 1) / rr : NaN;
  const pafPopulation = (pe: number) =>
    Number.isFinite(rr) && rr > 0 ? (pe * (rr - 1)) / (1 + pe * (rr - 1)) : NaN;
  const positive = a > 0 && b > 0 && c > 0 && d > 0;
  const seLnRR = positive ? Math.sqrt(b / (a * n1) + d / (c * n0)) : NaN;
  const seLnOR = positive ? Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d) : NaN;
  const ci = (est: number, se: number): [number, number] =>
    Number.isFinite(est) && Number.isFinite(se)
      ? [Math.exp(Math.log(est) - 1.96 * se), Math.exp(Math.log(est) + 1.96 * se)]
      : [NaN, NaN];
  const chi2 =
    n > 0 && n1 > 0 && n0 > 0 && m1 > 0 && n - m1 > 0
      ? (n * (a * d - b * c) ** 2) / (n1 * n0 * m1 * (n - m1))
      : NaN;
  return {
    riskExposed,
    riskUnexposed,
    rr,
    or,
    rd,
    nnt,
    pafExposed,
    pafPopulation,
    seLnRR,
    seLnOR,
    ciRR: ci(rr, seLnRR),
    ciOR: ci(or, seLnOR),
    chi2,
  };
}

export interface KmPoint {
  t: number;
  /** Supervivencia acumulada S(t). */
  s: number;
  /** Muertes en t. */
  d: number;
  /** Personas en riesgo justo antes de t. */
  nrisk: number;
}

/**
 * Estimador producto-límite de Kaplan–Meier. `data` son pares
 * [tiempo, indicador] con indicador 1 = evento y 0 = censura.
 */
export function kmCurve(data: [number, number][]): KmPoint[] {
  const times = [...new Set(data.filter(([, st]) => st === 1).map(([t]) => t))].sort(
    (x, y) => x - y,
  );
  let s = 1;
  return times.map((t) => {
    const nrisk = data.filter(([tt]) => tt >= t).length;
    const d = data.filter(([tt, st]) => tt === t && st === 1).length;
    s *= 1 - d / nrisk;
    return { t, s, d, nrisk };
  });
}

export interface DiagnosticMeasures {
  vp: number;
  fn: number;
  fp: number;
  vn: number;
  ppv: number;
  npv: number;
  /** Razón de verosimilitud positiva Se/(1−Sp). */
  lrPositive: number;
  /** Razón de verosimilitud negativa (1−Se)/Sp. */
  lrNegative: number;
}

/** Desempeño de una prueba en una población de tamaño `n` y prevalencia `prev`. */
export function diagnostic(
  se: number,
  sp: number,
  prev: number,
  n = 10_000,
): DiagnosticMeasures {
  const vp = n * prev * se;
  const fn = n * prev * (1 - se);
  const fp = n * (1 - prev) * (1 - sp);
  const vn = n * (1 - prev) * sp;
  return {
    vp,
    fn,
    fp,
    vn,
    ppv: vp + fp > 0 ? vp / (vp + fp) : NaN,
    npv: vn + fn > 0 ? vn / (vn + fn) : NaN,
    lrPositive: 1 - sp > 0 ? se / (1 - sp) : Infinity,
    lrNegative: sp > 0 ? (1 - se) / sp : NaN,
  };
}

/**
 * ROC binormal: sanos ~ N(0,1) y enfermos ~ N(d,1).
 * Con umbral u (en desviaciones del sano), Se = 1 − Φ(u − d), FPR = 1 − Φ(u)
 * y el área bajo la curva es Φ(d/√2).
 */
export function rocBinormal(separation: number) {
  return {
    auc: normCdf(separation / Math.SQRT2),
    at: (u: number) => ({
      sens: 1 - normCdf(u - separation),
      fpr: 1 - normCdf(u),
    }),
  };
}

/**
 * Intervalo de confianza de Wilson para una proporción: mejor cobertura que
 * Wald cuando k es pequeño o p̂ está cerca de 0 o 1.
 */
export function wilsonInterval(k: number, n: number, z = 1.96): [number, number] {
  if (n <= 0) return [NaN, NaN];
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z / denom) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
