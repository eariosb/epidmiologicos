/**
 * Exact unconditional inference for the 2×2 table under the two-binomial
 * design: group sizes n1, n2 are fixed; the success counts X1 ~ Bin(n1,p1),
 * X2 ~ Bin(n2,p2) are random.
 *
 * Port of the enumeration machinery used in the course's technical essay
 * (simulacion3.R / sesgo_varianza.R): Fisher, mid-p, pooled-z
 * (Suissa–Shuster), Boschloo, Berger–Boos, additive corrections for the
 * log-OR, exact bias/variance/MSE, CI coverage and exact power — all by
 * enumeration of the (n1+1)(n2+1) tables, no Monte Carlo.
 *
 * Numerics: log-space kernels throughout (lgamma-based); the unconditional
 * supremum over the nuisance parameter uses a fixed grid (default 1999
 * points, as in the essay) and is therefore a certified lower bound, not a
 * proof of exactness.
 */

const REL_TOL = 1e-7; // tie tolerance, mirroring fisher.test
const DEFAULT_GRID = (() => {
  const g = new Float64Array(1999);
  for (let i = 0; i < 1999; i++) g[i] = 0.0005 + 0.0005 * i;
  return g;
})();

/* ------------------------------------------------------------------ */
/* Special functions                                                   */
/* ------------------------------------------------------------------ */

/** log Gamma (Lanczos approximation, g=7). */
export function lgamma(x: number): number {
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  for (let i = 1; i < c.length; i++) a += c[i] / (x + i);
  const t = x + 7.5; // x + g + 0.5 with g = 7
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** log binomial coefficient. */
export function lchoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
}

/** Binomial pmf, log-safe. */
export function dbinom(x: number, n: number, p: number): number {
  if (x < 0 || x > n) return 0;
  if (p <= 0) return x === 0 ? 1 : 0;
  if (p >= 1) return x === n ? 1 : 0;
  return Math.exp(lchoose(n, x) + x * Math.log(p) + (n - x) * Math.log(1 - p));
}

/**
 * Central hypergeometric pmf: P(X1 = x | X1 + X2 = m) when
 * X1 ~ Bin(n1, p), X2 ~ Bin(n2, p) — independent of p under H0.
 */
export function dhyper(x: number, n1: number, n2: number, m: number): number {
  if (x < Math.max(0, m - n2) || x > Math.min(n1, m)) return 0;
  return Math.exp(lchoose(n1, x) + lchoose(n2, m - x) - lchoose(n1 + n2, m));
}

/** Regularized incomplete beta I_x(a,b) — continued fraction (NR betacf). */
function pbeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const betacf = (x: number, a: number, b: number): number => {
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  };
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(x, a, b)) / a : 1 - (bt * betacf(1 - x, b, a)) / b;
}

/** Beta quantile by bisection (adequate for CI bounds, not for tail extremes). */
export function qbeta(p: number, a: number, b: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0, hi = 1;
  // Initial bracket refinement via bisection; monotone CDF.
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (pbeta(mid, a, b) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Complementary error function, Numerical Recipes `erfcc` (Chebyshev
 * fit). Fractional error below 1.2e-7 everywhere, so tail probabilities
 * keep their relative precision (the Abramowitz–Stegun 7.1.26 form used
 * before only had absolute error 1.5e-7, useless for p < 1e-6).
 */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z - 1.26551223 +
        t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
        t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 +
        t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}

/** Standard normal CDF. */
export function normCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

/* ------------------------------------------------------------------ */
/* Table space: enumeration of all (x1, x2) tables                     */
/* ------------------------------------------------------------------ */

export interface TableSpace {
  n1: number;
  n2: number;
  /** Flat arrays, index k = x1 * (n2 + 1) + x2. */
  count: number;
  pFisher: Float64Array; // minlike two-sided (fisher.test)
  pFisherStrict: Float64Array; // same tail, ties excluded
  pMid: Float64Array;
  zAbs: Float64Array; // pooled |z| (Suissa–Shuster statistic)
  pZ: Float64Array; // unconditional p-value ordering by |z|
  pBoschloo: Float64Array; // unconditional p-value ordering by Fisher p
  pBergerBoos: Float64Array | null; // Berger–Boos on Boschloo ordering, gamma = 0.001
}

export interface TableSpaceOptions {
  /** Nuisance-parameter grid; defaults to 1999 points at 0.0005. */
  grid?: Float64Array;
  /** Include Berger–Boos (extra maximization pass). Default true. */
  bergerBoos?: boolean;
}

const spaceCache = new Map<string, TableSpace>();

function idx(x1: number, x2: number, n2: number): number {
  return x1 * (n2 + 1) + x2;
}

/**
 * Enumerates the table space once and computes every procedure's p-value
 * for every table. Memoized per (n1, n2); the expensive part is the
 * unconditional maximization, O(tables × grid).
 */
export function getTableSpace(
  n1: number,
  n2: number,
  opts: TableSpaceOptions = {}
): TableSpace {
  const grid = opts.grid ?? DEFAULT_GRID;
  const withBB = opts.bergerBoos !== false;
  const key = `${n1}x${n2}x${grid.length}x${withBB ? 1 : 0}`;
  const hit = spaceCache.get(key);
  if (hit) return hit;

  const count = (n1 + 1) * (n2 + 1);
  const pFisher = new Float64Array(count);
  const pFisherStrict = new Float64Array(count);
  const pMid = new Float64Array(count);
  const zAbs = new Float64Array(count);
  const N = n1 + n2;

  // Per-margin hypergeometric distribution: tables sharing m = x1+x2 share
  // the distribution of X1 | m.
  for (let m = 0; m <= N; m++) {
    const lo = Math.max(0, m - n2);
    const hi = Math.min(n1, m);
    const sup: number[] = [];
    const pr: number[] = [];
    for (let s = lo; s <= hi; s++) {
      sup.push(s);
      pr.push(dhyper(s, n1, n2, m));
    }
    for (let x1 = lo; x1 <= hi; x1++) {
      const x2 = m - x1;
      const d0 = dhyper(x1, n1, n2, m);
      let pMin = 0, pStrict = 0;
      for (let i = 0; i < sup.length; i++) {
        if (pr[i] <= d0 * (1 + REL_TOL)) pMin += pr[i];
        if (pr[i] < d0 / (1 + REL_TOL)) pStrict += pr[i];
      }
      const k = idx(x1, x2, n2);
      pFisher[k] = Math.min(1, pMin);
      pFisherStrict[k] = pStrict;
      pMid[k] = Math.min(1, pStrict + 0.5 * (pMin - pStrict));
    }
  }

  for (let x1 = 0; x1 <= n1; x1++) {
    for (let x2 = 0; x2 <= n2; x2++) {
      const m = x1 + x2;
      const pb = m / N;
      const se = Math.sqrt(pb * (1 - pb) * (1 / n1 + 1 / n2));
      zAbs[idx(x1, x2, n2)] = se > 0 ? Math.abs(x1 / n1 - x2 / n2) / se : 0;
    }
  }

  const pZ = unconditionalP(zAbs, n1, n2, false, grid);
  const pBoschloo = unconditionalP(pFisher, n1, n2, true, grid);
  const pBergerBoos = withBB ? bergerBoos(pFisher, n1, n2, grid) : null;

  const ts: TableSpace = {
    n1, n2, count, pFisher, pFisherStrict, pMid, zAbs, pZ, pBoschloo, pBergerBoos,
  };
  spaceCache.set(key, ts);
  if (spaceCache.size > 12) {
    // Bound memory: keep the most recent spaces only.
    const first = spaceCache.keys().next().value;
    if (first) spaceCache.delete(first);
  }
  return ts;
}

/**
 * Unconditional p-value of every table: p(x) = sup_{p in grid} P_p(T as or
 * more extreme than T(x)). Implements the ordered-accumulation scheme of
 * p_incondicional(): tables are processed in order of extremeness; after
 * each group of ties the accumulated probability vector over the nuisance
 * grid gives the tail probability for every p, and its max is the p-value.
 */
function unconditionalP(
  stat: Float64Array,
  n1: number,
  n2: number,
  smallerIsExtreme: boolean,
  grid: Float64Array
): Float64Array {
  const G = grid.length;
  const count = (n1 + 1) * (n2 + 1);
  // Binomial weights per grid point for each group: B1[k][g] = P(X1 = k)
  const B1 = new Float64Array((n1 + 1) * G);
  const B2 = new Float64Array((n2 + 1) * G);
  for (let g = 0; g < G; g++) {
    const p = grid[g];
    for (let k = 0; k <= n1; k++) B1[k * G + g] = dbinom(k, n1, p);
    for (let k = 0; k <= n2; k++) B2[k * G + g] = dbinom(k, n2, p);
  }

  const keyOf = (k: number) => (smallerIsExtreme ? stat[k] : -stat[k]);
  const order = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => keyOf(a) - keyOf(b)
  );

  const acum = new Float64Array(G);
  const out = new Float64Array(count);
  let i = 0;
  while (i < count) {
    let j = i;
    const lim = keyOf(order[i]) + REL_TOL * Math.max(Math.abs(keyOf(order[i])), 1e-300);
    while (j + 1 < count && keyOf(order[j + 1]) <= lim) j++;
    for (let t = i; t <= j; t++) {
      const k = order[t];
      const x1 = Math.floor(k / (n2 + 1));
      const x2 = k % (n2 + 1);
      const r1 = B1.subarray(x1 * G, x1 * G + G);
      const r2 = B2.subarray(x2 * G, x2 * G + G);
      for (let g = 0; g < G; g++) acum[g] += r1[g] * r2[g];
    }
    let mx = 0;
    for (let g = 0; g < G; g++) if (acum[g] > mx) mx = acum[g];
    for (let t = i; t <= j; t++) out[order[t]] = Math.min(1, mx);
    i = j + 1;
  }
  return out;
}

/**
 * Berger–Boos: p = gamma + sup over p in C_gamma of the same tail
 * probability, where C_gamma is the Clopper–Pearson interval for the
 * pooled nuisance parameter based on the margin m = x1 + x2.
 */
function bergerBoos(
  pFisher: Float64Array,
  n1: number,
  n2: number,
  grid: Float64Array,
  gamma = 0.001
): Float64Array {
  const N = n1 + n2;
  const count = (n1 + 1) * (n2 + 1);
  const G = grid.length;
  const order = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => pFisher[a] - pFisher[b]
  );

  // Precompute per-margin Clopper–Pearson intervals.
  const cpLo = new Float64Array(N + 1);
  const cpHi = new Float64Array(N + 1);
  for (let m = 0; m <= N; m++) {
    cpLo[m] = m === 0 ? 0 : qbeta(gamma / 2, m, N - m + 1);
    cpHi[m] = m === N ? 1 : qbeta(1 - gamma / 2, m + 1, N - m);
  }

  const B1 = new Float64Array((n1 + 1) * G);
  const B2 = new Float64Array((n2 + 1) * G);
  for (let g = 0; g < G; g++) {
    for (let k = 0; k <= n1; k++) B1[k * G + g] = dbinom(k, n1, grid[g]);
    for (let k = 0; k <= n2; k++) B2[k * G + g] = dbinom(k, n2, grid[g]);
  }

  const acum = new Float64Array(G);
  const out = new Float64Array(count);
  let i = 0;
  while (i < count) {
    let j = i;
    const lim = pFisher[order[i]] * (1 + REL_TOL);
    while (j + 1 < count && pFisher[order[j + 1]] <= lim) j++;
    for (let t = i; t <= j; t++) {
      const k = order[t];
      const x1 = Math.floor(k / (n2 + 1));
      const x2 = k % (n2 + 1);
      for (let g = 0; g < G; g++) acum[g] += B1[x1 * G + g] * B2[x2 * G + g];
    }
    for (let t = i; t <= j; t++) {
      const k = order[t];
      const x1 = Math.floor(k / (n2 + 1));
      const x2 = k % (n2 + 1);
      const m = x1 + x2;
      let mx = 0;
      for (let g = 0; g < G; g++) {
        if (grid[g] >= cpLo[m] && grid[g] <= cpHi[m] && acum[g] > mx) mx = acum[g];
      }
      out[k] = Math.min(1, mx + gamma);
    }
    i = j + 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Public per-table lookups                                            */
/* ------------------------------------------------------------------ */

export function tableIndex(x1: number, x2: number, n2: number): number {
  return idx(x1, x2, n2);
}

/** Rejection region mask at level alpha for a p-value array. */
export function rejectionMask(pvals: Float64Array, alpha: number): Uint8Array {
  const m = new Uint8Array(pvals.length);
  for (let i = 0; i < pvals.length; i++) m[i] = pvals[i] <= alpha * (1 + REL_TOL) ? 1 : 0;
  return m;
}

/** Exact unconditional power P_{p1,p2}(reject) over a mask. */
export function powerAt(ts: TableSpace, mask: Uint8Array, p1: number, p2: number): number {
  const { n1, n2 } = ts;
  let s = 0;
  for (let x1 = 0; x1 <= n1; x1++) {
    const w1 = dbinom(x1, n1, p1);
    if (w1 === 0) continue;
    for (let x2 = 0; x2 <= n2; x2++) {
      if (mask[idx(x1, x2, n2)]) s += w1 * dbinom(x2, n2, p2);
    }
  }
  return s;
}

/**
 * Rejection probability under H0 for each nuisance value p in `grid`
 * (common p1 = p2 = p). The maximum is the actual size of the test.
 */
export function sizeCurve(ts: TableSpace, mask: Uint8Array, grid: Float64Array = DEFAULT_GRID): Float64Array {
  const { n1, n2 } = ts;
  const out = new Float64Array(grid.length);
  for (let g = 0; g < grid.length; g++) {
    const p = grid[g];
    let s = 0;
    for (let x1 = 0; x1 <= n1; x1++) {
      const w1 = dbinom(x1, n1, p);
      if (w1 === 0) continue;
      for (let x2 = 0; x2 <= n2; x2++) {
        if (mask[idx(x1, x2, n2)]) s += w1 * dbinom(x2, n2, p);
      }
    }
    out[g] = s;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Estimation with additive corrections                                */
/* ------------------------------------------------------------------ */

/**
 * log-OR with additive correction c on every cell:
 * theta_c = log((x1+c)(n2-x2+c) / ((n1-x1+c)(x2+c))).
 * Table layout: rows = groups (1 exposed/dose, 2 unexposed), cells a=x1,
 * b=n1-x1, c_=x2, d=n2-x2.
 */
export function logOrCorrected(x1: number, n1: number, x2: number, n2: number, c: number): number {
  return Math.log(((x1 + c) * (n2 - x2 + c)) / ((n1 - x1 + c) * (x2 + c)));
}

export interface EstimatorStats {
  bias: number;
  variance: number;
  mse: number;
}

/** Exact bias/variance/MSE of a per-table estimator at (p1, p2). */
export function estimatorStats(
  ts: TableSpace,
  est: (x1: number, x2: number) => number,
  truth: number,
  p1: number,
  p2: number
): EstimatorStats {
  const { n1, n2 } = ts;
  let m1 = 0, m2 = 0;
  for (let x1 = 0; x1 <= n1; x1++) {
    const w1 = dbinom(x1, n1, p1);
    if (w1 === 0) continue;
    for (let x2 = 0; x2 <= n2; x2++) {
      const w = w1 * dbinom(x2, n2, p2);
      if (w === 0) continue;
      const e = est(x1, x2);
      m1 += w * e;
      m2 += w * e * e;
    }
  }
  const variance = m2 - m1 * m1;
  const bias = m1 - truth;
  return { bias, variance, mse: bias * bias + variance };
}

/** Exact P(any cell = 0) at (p1, p2): the MLE of log-OR is infinite there. */
export function pZeroCell(ts: TableSpace, p1: number, p2: number): number {
  const { n1, n2 } = ts;
  let s = 0;
  for (let x1 = 0; x1 <= n1; x1++) {
    const w1 = dbinom(x1, n1, p1);
    if (w1 === 0) continue;
    for (let x2 = 0; x2 <= n2; x2++) {
      const zero = x1 === 0 || x1 === n1 || x2 === 0 || x2 === n2;
      if (zero) s += w1 * dbinom(x2, n2, p2);
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Confidence intervals                                                */
/* ------------------------------------------------------------------ */

export interface CI {
  lo: number;
  hi: number;
}

/** Woolf interval for log-OR with additive correction c. */
export function woolfCI(x1: number, n1: number, x2: number, n2: number, c: number, alpha = 0.05): CI {
  const z = normQuantile(1 - alpha / 2);
  const th = logOrCorrected(x1, n1, x2, n2, c);
  const se = Math.sqrt(
    1 / (x1 + c) + 1 / (n1 - x1 + c) + 1 / (x2 + c) + 1 / (n2 - x2 + c)
  );
  return { lo: th - z * se, hi: th + z * se };
}

/** Inverse normal CDF (Acklam's algorithm). */
export function normQuantile(p: number): number {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
  const plow = 0.02425, phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Cornfield's exact conditional CI for the odds ratio: inverts two
 * one-sided conditional tests under the noncentral hypergeometric. This
 * is the interval fisher.test() reports. Bounds may be 0 or +Infinity.
 */
export function cornfieldCI(x1: number, n1: number, x2: number, n2: number, alpha = 0.05): CI {
  const m = x1 + x2;
  const lo = Math.max(0, m - n2), hi = Math.min(n1, m);
  // Noncentral hypergeometric tails at odds ratio psi (log-space weights).
  const tail = (psi: number) => {
    const lp = Math.log(psi);
    let mx = -Infinity;
    const ws: number[] = [];
    for (let s = lo; s <= hi; s++) {
      const w = lchoose(n1, s) + lchoose(n2, m - s) + s * lp;
      ws.push(w);
      if (w > mx) mx = w;
    }
    let tot = 0, le = 0, ge = 0;
    for (let i = 0, s = lo; s <= hi; i++, s++) {
      const w = Math.exp(ws[i] - mx);
      tot += w;
      if (s <= x1) le += w;
      if (s >= x1) ge += w;
    }
    return { le: le / tot, ge: ge / tot };
  };

  let ciLo = 0, ciHi = Infinity;
  if (x1 > lo) {
    // ge(psi) = P(X1 >= x1 | psi) is increasing in psi; lower bound solves
    // ge(psi_lo) = alpha/2, so psi_lo < observed-consistent region.
    let a = 1e-10, b = 1;
    while (tail(b).ge <= alpha / 2 && b < 1e12) b *= 4;
    for (let i = 0; i < 80; i++) {
      const mid = Math.sqrt(a * b);
      if (tail(mid).ge > alpha / 2) b = mid; else a = mid;
    }
    ciLo = Math.sqrt(a * b);
  }
  if (x1 < hi) {
    // le(psi) = P(X1 <= x1 | psi) is decreasing in psi; upper bound solves
    // le(psi_hi) = alpha/2.
    let a = 1, b = 1e10;
    while (tail(a).le <= alpha / 2 && a > 1e-10) a /= 4;
    for (let i = 0; i < 80; i++) {
      const mid = Math.sqrt(a * b);
      if (tail(mid).le > alpha / 2) a = mid; else b = mid;
    }
    ciHi = Math.sqrt(a * b);
  }
  return { lo: Math.log(ciLo), hi: Number.isFinite(ciHi) ? Math.log(ciHi) : Infinity };
}

/** Wilson score interval for a single proportion (used by Newcombe). */
function wilsonCI(x: number, n: number, alpha = 0.05): CI {
  const z = normQuantile(1 - alpha / 2);
  const p = x / n;
  const den = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const half = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { lo: (center - half) / den, hi: (center + half) / den };
}

/** Agresti–Caffo interval for the risk difference (adds ~1 pseudo-count). */
export function agrestiCaffoRD(x1: number, n1: number, x2: number, n2: number, alpha = 0.05): CI {
  const z = normQuantile(1 - alpha / 2);
  const p1 = (x1 + 1) / (n1 + 2), p2 = (x2 + 1) / (n2 + 2);
  const d = p1 - p2;
  const se = Math.sqrt((p1 * (1 - p1)) / (n1 + 2) + (p2 * (1 - p2)) / (n2 + 2));
  return { lo: d - z * se, hi: d + z * se };
}

/** Newcombe hybrid (score) interval for the risk difference, method 10. */
export function newcombeRD(x1: number, n1: number, x2: number, n2: number, alpha = 0.05): CI {
  const l1 = wilsonCI(x1, n1, alpha);
  const l2 = wilsonCI(x2, n2, alpha);
  const p1 = x1 / n1, p2 = x2 / n2, d = p1 - p2;
  return {
    lo: d - Math.sqrt((p1 - l1.lo) ** 2 + (l2.hi - p2) ** 2),
    hi: d + Math.sqrt((l1.hi - p1) ** 2 + (p2 - l2.lo) ** 2),
  };
}

/** Cornfield bounds for every table in the space (memoized; expensive). */
const cornfieldCache = new Map<string, { lo: Float64Array; hi: Float64Array }>();
export function cornfieldBounds(n1: number, n2: number, alpha = 0.05) {
  const key = `${n1}x${n2}@${alpha}`;
  let hit = cornfieldCache.get(key);
  if (!hit) {
    const count = (n1 + 1) * (n2 + 1);
    const lo = new Float64Array(count);
    const hi = new Float64Array(count);
    for (let x1 = 0; x1 <= n1; x1++)
      for (let x2 = 0; x2 <= n2; x2++) {
        const ci = cornfieldCI(x1, n1, x2, n2, alpha);
        const k = idx(x1, x2, n2);
        lo[k] = ci.lo;
        hi[k] = ci.hi;
      }
    hit = { lo, hi };
    cornfieldCache.set(key, hit);
    if (cornfieldCache.size > 8) {
      const first = cornfieldCache.keys().next().value;
      if (first) cornfieldCache.delete(first);
    }
  }
  return hit;
}

/** Exact coverage of a precomputed CI bound pair for theta = log OR. */
export function coverageFromBounds(
  ts: TableSpace,
  bounds: { lo: Float64Array; hi: Float64Array },
  p1: number,
  p2: number
): number {
  return coverageLogOr(ts, (x1, x2) => ({ lo: bounds.lo[idx(x1, x2, ts.n2)], hi: bounds.hi[idx(x1, x2, ts.n2)] }), p1, p2);
}

/** Exact coverage of a CI builder for theta = log OR at (p1, p2). */
export function coverageLogOr(
  ts: TableSpace,
  ciOf: (x1: number, x2: number) => CI,
  p1: number,
  p2: number
): number {
  const { n1, n2 } = ts;
  const th = Math.log((p1 / (1 - p1)) / (p2 / (1 - p2)));
  let s = 0;
  for (let x1 = 0; x1 <= n1; x1++) {
    const w1 = dbinom(x1, n1, p1);
    if (w1 === 0) continue;
    for (let x2 = 0; x2 <= n2; x2++) {
      const w = w1 * dbinom(x2, n2, p2);
      if (w === 0) continue;
      const ci = ciOf(x1, x2);
      if (ci.lo <= th && th <= ci.hi) s += w;
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Sample size (module 5): normal-approx and exact power               */
/* ------------------------------------------------------------------ */

/**
 * Standard two-proportion sample size per group (balanced), Woodward
 * cap. 8 / Fleiss form. Returns n per group for two-sided alpha and
 * target power at (p1, p2).
 */
export function nForPowerRaw(p1: number, p2: number, alpha = 0.05, power = 0.8): number {
  const za = normQuantile(1 - alpha / 2);
  const zb = normQuantile(power);
  const pb = (p1 + p2) / 2;
  const d = Math.abs(p1 - p2);
  if (d === 0) return Infinity;
  return Math.pow(za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) / (d * d);
}

export function nForPower(p1: number, p2: number, alpha = 0.05, power = 0.8): number {
  return Math.ceil(nForPowerRaw(p1, p2, alpha, power));
}

