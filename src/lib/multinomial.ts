/**
 * multinomial.ts — Intervalos de confianza simultáneos para la multinomial
 * y auditoría Monte Carlo de su cobertura.
 *
 * Contexto docente (vigilancia de serotipos/variantes): la pregunta ya no es
 * "¿dónde está p?" sino "¿dónde está el vector pi completo?". Un IC por celda
 * con z_{1-alpha/2} no es simultáneo: la probabilidad de que LOS k intervalos
 * cubran a la vez queda por debajo del nominal, y cae más cuando hay celdas
 * raras (baja entropía).
 *
 * Métodos (convención de González, Correa & Vélez 2015, Rev. Fac. Ciencias
 * UNAL 4(2):150-163; Sison & Glaz 1995; Goodman 1965; Quesenberry & Hurst
 * 1964):
 *
 *   - tcl:       Wald por celda con z_{1-a/2} — NI siquiera nominal
 *                simultáneo; es el contraejemplo docente.
 *   - qh:        Quesenberry-Hurst, región chi^2 con B = chi2_{k-1,1-a}.
 *   - goodman:   misma forma cuadrática con B = chi2_{1,1-a/k} (Bonferroni);
 *                intervalos más cortos que QH.
 *   - sisonGlaz: [x_i - b, x_i + b], con b el menor entero tal que
 *                P_phat(max_i |X_i - n*phat_i| <= b) >= conf, calibrado por
 *                Monte Carlo sobre la multinomial con pi = phat (la receta
 *                de Sison-Glaz usa la aproximación de Levin; aquí se calibra
 *                la misma región de forma empírica y se reporta J).
 *
 * La cobertura de cada método se audita por Monte Carlo con EE explícito:
 * se reporta cov = p_hat +/- 2*se, nunca un punto solo.
 */

import { normQuantile } from '@/lib/exact2x2';
import { qchisq } from '@/lib/precision';

/* ------------------------------------------------------------------ */
/* RNG con semilla (el mismo mulberry32 de EpiSims, exportable)         */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Piezas básicas                                                      */
/* ------------------------------------------------------------------ */

/** Entropía normalizada H(pi)/log(k) en [0,1]: 1 = celdas equilibradas. */
export function entropy(p: number[]): number {
  let h = 0;
  for (const pi of p) if (pi > 0) h -= pi * Math.log(pi);
  return h / Math.log(p.length);
}

/** Una muestra Multinomial(n, p): conteos por celda. */
export function rmultinom(n: number, p: number[], rng: () => number): number[] {
  const k = p.length;
  const x = new Array<number>(k).fill(0);
  const cum = new Float64Array(k);
  let s = 0;
  for (let i = 0; i < k; i++) {
    s += p[i];
    cum[i] = s;
  }
  for (let i = 0; i < n; i++) {
    const u = rng();
    let j = 0;
    while (u > cum[j]) j++;
    x[j]++;
  }
  return x;
}

export interface Band {
  lo: number[];
  hi: number[];
}

const clip = (v: number) => Math.max(0, Math.min(1, v));

/* ------------------------------------------------------------------ */
/* Métodos de IC simultáneo                                            */
/* ------------------------------------------------------------------ */

/** Wald por celda (contraejemplo: no es simultáneo ni nominal por celda). */
export function tclMarginal(x: number[], n: number, conf: number): Band {
  const z = normQuantile(1 - (1 - conf) / 2);
  const lo: number[] = [];
  const hi: number[] = [];
  for (const xi of x) {
    const ph = xi / n;
    const hw = z * Math.sqrt((ph * (1 - ph)) / n);
    lo.push(clip(ph - hw));
    hi.push(clip(ph + hw));
  }
  return { lo, hi };
}

/** Forma cuadrática compartida por QH y Goodman (difieren solo en B). */
function quadraticBand(x: number[], n: number, B: number): Band {
  const lo: number[] = [];
  const hi: number[] = [];
  for (const xi of x) {
    const d = Math.sqrt(B * (B + (4 * xi * (n - xi)) / n));
    lo.push(clip((B + 2 * xi - d) / (2 * (n + B))));
    hi.push(clip((B + 2 * xi + d) / (2 * (n + B))));
  }
  return { lo, hi };
}

/** Quesenberry & Hurst (1964): B = chi2_{k-1, 1-a}. Conservador. */
export function quesenberryHurst(x: number[], n: number, conf: number): Band {
  return quadraticBand(x, n, qchisq(conf, x.length - 1));
}

/** Goodman (1965): B = chi2_{1, 1-a/k} = z^2_{1-a/(2k)} (Bonferroni). */
export function goodman(x: number[], n: number, conf: number): Band {
  const z = normQuantile(1 - (1 - conf) / (2 * x.length));
  return quadraticBand(x, n, z * z);
}

export interface SisonGlazResult {
  band: Band;
  /** Semiamplitud entera calibrada (en conteos). */
  b: number;
  /** Replicas usadas en la calibracion de b. */
  J: number;
}

/**
 * Sison-Glaz (1995): IC simultáneo de amplitud común b (en conteos).
 * b = min{ entero : P_{phat}( max_i |X_i - n*phat_i| <= b ) >= conf }.
 * Calibrado por Monte Carlo bajo pi = phat (J réplicas); la publicación
 * original aproxima esa probabilidad con la fórmula de Levin.
 */
export function sisonGlaz(
  x: number[],
  n: number,
  conf: number,
  rng: () => number,
  J = 1500
): SisonGlazResult {
  const k = x.length;
  const phat = x.map((xi) => xi / n);
  const dev = new Float64Array(J);
  for (let j = 0; j < J; j++) {
    const xs = rmultinom(n, phat, rng);
    let mx = 0;
    for (let i = 0; i < k; i++) {
      const d = Math.abs(xs[i] - n * phat[i]);
      if (d > mx) mx = d;
    }
    dev[j] = mx;
  }
  dev.sort();
  const b = Math.ceil(dev[Math.min(J - 1, Math.floor(conf * J))] - 1e-9);
  return {
    band: {
      lo: x.map((xi) => clip((xi - b) / n)),
      hi: x.map((xi) => clip((xi + b) / n)),
    },
    b,
    J,
  };
}

export type MultinomMethodKey = 'tcl' | 'qh' | 'goodman' | 'sisonGlaz';

export interface MultinomMethod {
  label: string;
  short: string;
  fn: (x: number[], n: number, conf: number, rng: () => number) => Band;
  /** true si el método necesita calibración MC interna (más costoso). */
  costly?: boolean;
}

export const MN_METHODS: Record<MultinomMethodKey, MultinomMethod> = {
  tcl: {
    label: 'TCL por celda',
    short: 'TCL',
    fn: (x, n, conf) => tclMarginal(x, n, conf),
  },
  qh: {
    label: 'Quesenberry–Hurst',
    short: 'QH',
    fn: (x, n, conf) => quesenberryHurst(x, n, conf),
  },
  goodman: {
    label: 'Goodman (Bonferroni)',
    short: 'Goodman',
    fn: (x, n, conf) => goodman(x, n, conf),
  },
  sisonGlaz: {
    label: 'Sison–Glaz (b calibrado)',
    short: 'SG',
    fn: (x, n, conf, rng) => sisonGlaz(x, n, conf, rng).band,
    costly: true,
  },
};

/* ------------------------------------------------------------------ */
/* Auditoría de cobertura                                              */
/* ------------------------------------------------------------------ */

export interface CoverageResult {
  key: MultinomMethodKey;
  cov: number;
  se: number;
}

/**
 * Cobertura simultánea empírica: fracción de réplicas donde el vector pi
 * completo queda dentro de los k intervalos. EE = sqrt(c(1-c)/R).
 */
export function coverageAudit(
  pi: number[],
  n: number,
  methods: MultinomMethodKey[],
  conf: number,
  reps: number,
  seed = 42
): CoverageResult[] {
  const rng = mulberry32(seed);
  const hits = new Float64Array(methods.length);
  for (let r = 0; r < reps; r++) {
    const x = rmultinom(n, pi, rng);
    methods.forEach((m, mi) => {
      const band = MN_METHODS[m].fn(x, n, conf, rng);
      let ok = true;
      for (let i = 0; i < pi.length; i++) {
        if (pi[i] < band.lo[i] || pi[i] > band.hi[i]) {
          ok = false;
          break;
        }
      }
      if (ok) hits[mi]++;
    });
  }
  return methods.map((m, mi) => {
    const cov = hits[mi] / reps;
    return { key: m, cov, se: Math.sqrt((cov * (1 - cov)) / reps) };
  });
}
