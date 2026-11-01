/**
 * precision.ts: La longitud del IC como variable aleatoria.
 *
 * Puerto TypeScript del módulo Shiny auditado (modulo_precision/R/):
 * intervalos de confianza/credibilidad para una proporción binomial,
 * distribución exacta de la longitud L por enumeración (sin Monte Carlo),
 * cobertura exacta y tamaño muestral con garantía P(L <= L0) >= 1 - beta.
 *
 * Idea central (igual que en exact2x2): X ~ Bin(n, p) toma solo n+1 valores,
 * así que cualquier funcional de un IC (cobertura, E[L], P(L <= L0)) es una
 * suma finita ponderada por dbinom(). Exacta e instantánea.
 *
 * La fórmula del seminario original (z_alpha + z_beta) está marcada como
 * incorrecta en la fuente R: confunde L con semiamplitud y trata z_beta como
 * en un cálculo de potencia. Se conserva solo para comparar.
 */

import { dbinom, lchoose, lgamma, normQuantile, qbeta } from '@/lib/exact2x2';

export interface CI {
  lo: number;
  hi: number;
}

const zOf = (conf: number) => normQuantile(1 - (1 - conf) / 2);

/* ---------------------------------------------------------------- */
/* Métodos de IC para una proporción (devuelven límites para un x)    */
/* ---------------------------------------------------------------- */

/** Wald sin truncar: se conserva inadmisible a propósito (contraejemplo). */
export function waldCI(x: number, n: number, conf = 0.95): CI {
  const p = x / n;
  const hw = zOf(conf) * Math.sqrt((p * (1 - p)) / n);
  return { lo: p - hw, hi: p + hw };
}

/** Wilson (score): siempre dentro de [0,1]. */
export function wilsonCI(x: number, n: number, conf = 0.95): CI {
  const z = zOf(conf);
  const center = (x + (z * z) / 2) / (n + z * z);
  const hw = (z / (n + z * z)) * Math.sqrt((x * (n - x)) / n + (z * z) / 4);
  return { lo: Math.max(0, center - hw), hi: Math.min(1, center + hw) };
}

/** Agresti–Coull: "sumar 2 éxitos y 2 fracasos" generalizado. */
export function agrestiCoullCI(x: number, n: number, conf = 0.95): CI {
  const z = zOf(conf);
  const nt = n + z * z;
  const pt = (x + (z * z) / 2) / nt;
  const hw = z * Math.sqrt((pt * (1 - pt)) / nt);
  return { lo: Math.max(0, pt - hw), hi: Math.min(1, pt + hw) };
}

/** Jeffreys de colas iguales; límite 0 si x = 0 y 1 si x = n (convención de Brown, Cai y DasGupta, 2001). */
export function jeffreysCI(x: number, n: number, conf = 0.95): CI {
  const a = (1 - conf) / 2;
  return {
    lo: x === 0 ? 0 : qbeta(a, x + 0.5, n - x + 0.5),
    hi: x === n ? 1 : qbeta(1 - a, x + 0.5, n - x + 0.5),
  };
}

/** Clopper–Pearson ("exacto"): cobertura >= nominal garantizada, conservador. */
export function clopperPearsonCI(x: number, n: number, conf = 0.95): CI {
  const a = (1 - conf) / 2;
  return {
    lo: x === 0 ? 0 : qbeta(a, x, n - x + 1),
    hi: x === n ? 1 : qbeta(1 - a, x + 1, n - x),
  };
}

const xlogy = (x: number, y: number) => (x === 0 ? 0 : x * Math.log(y));

/**
 * Razón de verosimilitudes: {p : 2(l(phat) - l(p)) <= chi2_1}.
 * En los bordes la bisección arranca en el extremo (la solución cerrada en
 * x=0 es hi = 1 - exp(-q/n); la bisección la encuentra igual).
 */
export function likelihoodRatioCI(x: number, n: number, conf = 0.95): CI {
  const q = normQuantile(1 - (1 - conf) / 2) ** 2 / 2;
  const ll = (p: number) => xlogy(x, p) + xlogy(n - x, 1 - p);
  const phat = x / n;
  const lmax = ll(phat);
  const f = (p: number) => lmax - ll(p) - q;
  const bisect = (a: number, b: number) => {
    let lo = a, hi = b;
    for (let i = 0; i < 80; i++) {
      const m = (lo + hi) / 2;
      if (f(m) > 0 === f(a) > 0) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  return {
    lo: x === 0 ? 0 : bisect(1e-12, phat),
    hi: x === n ? 1 : bisect(phat, 1 - 1e-12),
  };
}

export type PropCIFunction = typeof waldCI;

export const CI_METHODS = {
  wald: { label: 'Wald', fn: waldCI },
  wilson: { label: 'Wilson', fn: wilsonCI },
  agrestiCoull: { label: 'Agresti–Coull', fn: agrestiCoullCI },
  jeffreys: { label: 'Jeffreys', fn: jeffreysCI },
  clopperPearson: { label: 'Clopper–Pearson', fn: clopperPearsonCI },
  lr: { label: 'Verosimilitud (LR)', fn: likelihoodRatioCI },
} as const;

export type CIMethodKey = keyof typeof CI_METHODS;

/** Límites para cada x = 0..n; base de todas las cantidades exactas. */
function boundsForAllX(
  n: number,
  method: CIMethodKey,
  conf = 0.95
): { lo: Float64Array; hi: Float64Array } {
  const fn = CI_METHODS[method].fn;
  const lo = new Float64Array(n + 1);
  const hi = new Float64Array(n + 1);
  for (let x = 0; x <= n; x++) {
    const ci = fn(x, n, conf);
    lo[x] = ci.lo;
    hi[x] = ci.hi;
  }
  return { lo, hi };
}

/* ---------------------------------------------------------------- */
/* Pesos: binomial (p puntual) o beta-binomial (prior sobre p)        */
/* ---------------------------------------------------------------- */

const lbeta = (a: number, b: number) => lgamma(a) + lgamma(b) - lgamma(a + b);

/** P(X = x) con p ~ Beta(a, b): predictiva a priori beta-binomial. */
export function dbetabinom(x: number, n: number, a: number, b: number): number {
  return Math.exp(lchoose(n, x) + lbeta(x + a, n - x + b) - lbeta(a, b));
}

/** Pesos sobre x = 0..n: binomial si p, beta-binomial si prior = [a, b]. */
export function outcomeWeights(
  n: number,
  p: number | null,
  prior: [number, number] | null = null
): Float64Array {
  const w = new Float64Array(n + 1);
  for (let x = 0; x <= n; x++)
    w[x] = prior ? dbetabinom(x, n, prior[0], prior[1]) : dbinom(x, n, p!);
  return w;
}

/* ---------------------------------------------------------------- */
/* Distribución exacta de L, cobertura exacta                          */
/* ---------------------------------------------------------------- */

export interface LDistribution {
  x: Float64Array;
  L: Float64Array;
  prob: Float64Array;
  E_L: number;
}

/** Distribución exacta de la longitud del IC: a lo sumo n+1 valores. */
export function lengthDistribution(
  n: number,
  p: number | null,
  method: CIMethodKey,
  conf = 0.95,
  prior: [number, number] | null = null
): LDistribution {
  const { lo, hi } = boundsForAllX(n, method, conf);
  const prob = outcomeWeights(n, p, prior);
  const x = new Float64Array(n + 1);
  const L = new Float64Array(n + 1);
  let E_L = 0;
  for (let i = 0; i <= n; i++) {
    x[i] = i;
    L[i] = hi[i] - lo[i];
    E_L += L[i] * prob[i];
  }
  return { x, L, prob, E_L };
}

/** P(L <= L0) exacta; con prior es la garantía bayesiana (assurance). */
export function probL(
  n: number,
  L0: number,
  p: number | null,
  method: CIMethodKey,
  conf = 0.95,
  prior: [number, number] | null = null
): number {
  const d = lengthDistribution(n, p, method, conf, prior);
  let s = 0;
  for (let i = 0; i <= n; i++) if (d.L[i] <= L0 + 1e-12) s += d.prob[i];
  return s;
}

/** Cobertura exacta P_p(p ∈ IC), vectorizada en p. */
export function exactCoverage(
  p: Float64Array | number[],
  n: number,
  method: CIMethodKey,
  conf = 0.95
): Float64Array {
  const { lo, hi } = boundsForAllX(n, method, conf);
  const out = new Float64Array(p.length);
  for (let j = 0; j < p.length; j++) {
    const pi = p[j];
    let s = 0;
    for (let x = 0; x <= n; x++)
      if (lo[x] <= pi && pi <= hi[x]) s += dbinom(x, n, pi);
    out[j] = s;
  }
  return out;
}

/* ---------------------------------------------------------------- */
/* Tamaño muestral                                                    */
/* ---------------------------------------------------------------- */

/** Fórmula clásica n = z² p(1-p) / (L0/2)²; equivale a una garantía ≈ 50 %. */
export function nClassic(p: number, L0: number, conf = 0.95): number {
  return Math.ceil((zOf(conf) ** 2 * p * (1 - p)) / (L0 / 2) ** 2);
}

/**
 * La fórmula del seminario original: INCORRECTA, se conserva solo para
 * comparar (trata z_beta como en un cálculo de potencia y confunde L con
 * la semiamplitud).
 */
export function nOriginalFormula(p: number, L0: number, alpha = 0.05, beta = 0.1): number {
  const za = normQuantile(1 - alpha / 2);
  const zb = normQuantile(1 - beta);
  return Math.ceil((((za + zb) * Math.sqrt(p * (1 - p))) / (L0 / 2)) ** 2);
}

/**
 * n mínimo con P(L <= L0) >= 1 - beta, EXACTO por enumeración.
 * P(L <= L0) no es monótona en n (dientes de sierra); se devuelve el menor
 * n a partir del cual la garantía se sostiene en toda la ventana evaluada.
 */
export function nGuaranteeExact(
  L0: number,
  p: number | null,
  beta = 0.1,
  method: CIMethodKey = 'wilson',
  conf = 0.95,
  prior: [number, number] | null = null,
  margin = 60,
  nMax = 100000
): number {
  const P = (n: number) => probL(n, L0, p, method, conf, prior);
  let nSup = 8;
  while (P(nSup) < 1 - beta) {
    nSup *= 2;
    if (nSup > nMax)
      throw new Error('No se alcanza la garantía con n <= ' + nMax);
  }
  const lo = Math.max(1, Math.floor(nSup / 2));
  const hi = nSup + margin;
  const pr: number[] = [];
  for (let n = lo; n <= hi; n++) pr.push(P(n));
  // cummin invertido: ok[n] si toda la cola de la ventana cumple
  let suffix = Infinity;
  const ok = new Array(pr.length).fill(false);
  for (let i = pr.length - 1; i >= 0; i--) {
    suffix = Math.min(suffix, pr[i]);
    ok[i] = suffix >= 1 - beta;
  }
  const first = ok.findIndex(Boolean);
  return first >= 0 ? lo + first : NaN;
}

/* ---------------------------------------------------------------- */
/* Gamma incompleta y chi-cuadrado (caso exponencial)                  */
/* ---------------------------------------------------------------- */

/**
 * Gama incompleta regularizada (Numerical Recipes): devuelve P(a, x) y
 * Q(a, x) = 1 − P(a, x), cada una calculada por su propio desarrollo
 * (serie si x < a + 1, fracción continua si no) para no perder
 * precisión relativa en la cola.
 */
function gammaPQ(x: number, shape: number): { P: number; Q: number } {
  if (x <= 0) return { P: 0, Q: 1 };
  const logPre = -x + shape * Math.log(x) - lgamma(shape);
  if (x < shape + 1) {
    let ap = shape;
    let sum = 1 / shape;
    let del = sum;
    for (let i = 0; i < 500; i++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-15) break;
    }
    const P = Math.min(1, sum * Math.exp(logPre));
    return { P, Q: 1 - P };
  }
  const FPMIN = 1e-300;
  let b = x + 1 - shape;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - shape);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-15) break;
  }
  const Q = Math.min(1, Math.exp(logPre) * h);
  return { P: 1 - Q, Q };
}

/** P(a, x): gama incompleta regularizada inferior. */
export function pgamma(x: number, shape: number): number {
  return gammaPQ(x, shape).P;
}

/** P(χ²_df ≥ x): cola superior exacta de la chi-cuadrado. */
export function pchisqUpper(x: number, df: number): number {
  if (!(x > 0)) return 1;
  return gammaPQ(x / 2, df / 2).Q;
}

/** Cuantil chi-cuadrado: χ²_df = Gamma(df/2, tasa 1/2); Wilson–Hilferty + bisección. */
export function qchisq(p: number, df: number): number {
  const cdf = (x: number) => pgamma(x / 2, df / 2);
  let lo = 1e-10;
  let hi = df * Math.pow(1 - 2 / (9 * df) + normQuantile(p) * Math.sqrt(2 / (9 * df)), 3);
  hi = Math.max(hi * 2, lo * 4);
  while (cdf(hi) < p) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (cdf(m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * n exacto para la media de una exponencial con IC chi-cuadrado:
 *   IC = [2n x̄ / χ²_{2n,1-α/2}, 2n x̄ / χ²_{2n,α/2}],  x̄ ~ Gamma(n, tasa n/μ)
 *   L  = k_n x̄  ⇒  P(L <= L0) = pgamma(L0/k_n, n, tasa n/μ).
 */
export function nExponentialExact(
  mu0: number,
  L0: number,
  conf = 0.95,
  beta = 0.1,
  nMax = 100000
): number {
  const a = 1 - conf;
  const P = (n: number) => {
    const k = 2 * n * (1 / qchisq(a / 2, 2 * n) - 1 / qchisq(1 - a / 2, 2 * n));
    return pgamma((L0 / k) * (n / mu0), n);
  };
  let n = 1;
  while (P(n) < 1 - beta) {
    n += 1;
    if (n > nMax) throw new Error('nMax excedido');
  }
  return n;
}

/**
 * Forma cerrada (IC de Wald, L = 2z x̄/√n, x̄ ≈ N(μ, μ²/n)):
 *   √n = [μ + √(μ² + 4aμ z_β)] / (2a),  a = L0/(2z).
 * Cuando beta -> 0.5 se recupera n = (2zμ/L0)².
 */
export function nExponentialClosed(mu0: number, L0: number, conf = 0.95, beta = 0.1): number {
  const z = zOf(conf);
  const zb = normQuantile(1 - beta);
  const a = L0 / (2 * z);
  const s = (mu0 + Math.sqrt(mu0 * mu0 + 4 * a * mu0 * zb)) / (2 * a);
  return Math.ceil(s * s);
}
