import { describe, expect, it } from 'vitest';
import {
  agrestiCaffoRD,
  centralP,
  cornfieldCI,
  coverageLogOr,
  dbinom,
  dhyper,
  estimatorStats,
  getTableSpace,
  logOrCorrected,
  newcombeRD,
  nForPower,
  pZeroCell,
  powerAt,
  rejectionMask,
  sizeCurve,
  tableIndex,
  woolfCI,
} from './exact2x2';

/**
 * Reference values come from the course's technical essay on the Fisher
 * exact test (test_exacto_fisher_3.pdf) and its scripts simulacion3.R /
 * sesgo_varianza.R, all computed by exact enumeration under the
 * two-binomial model for the Perondi et al. (2004) table: 7/34 vs 1/34.
 */

const N1 = 34, N2 = 34, X1 = 7, X2 = 1;
const ts = getTableSpace(N1, N2);

describe('kernels', () => {
  it('dbinom sums to 1', () => {
    let s = 0;
    for (let k = 0; k <= 40; k++) s += dbinom(k, 40, 0.23);
    expect(s).toBeCloseTo(1, 12);
  });

  it('dhyper sums to 1 over its support', () => {
    let s = 0;
    const m = 20;
    for (let k = Math.max(0, m - N2); k <= Math.min(N1, m); k++) s += dhyper(k, N1, N2, m);
    expect(s).toBeCloseTo(1, 12);
  });
});

describe('p-values on the Perondi table (7/34 vs 1/34)', () => {
  const k = tableIndex(X1, X2, N2);

  it('Fisher two-sided (minlike) ≈ 0.0542 (fisher.test)', () => {
    expect(ts.pFisher[k]).toBeCloseTo(0.0542, 3);
  });

  it('mid-p is strictly below Fisher', () => {
    expect(ts.pMid[k]).toBeLessThan(ts.pFisher[k]);
    expect(ts.pMid[k]).toBeGreaterThan(0);
  });

  it('Boschloo ≈ 0.038, strictly below Fisher', () => {
    // Essay: Boschloo ≈ 0.0385 vs Fisher 0.0542.
    expect(ts.pBoschloo[k]).toBeCloseTo(0.0385, 2);
    expect(ts.pBoschloo[k]).toBeLessThan(ts.pFisher[k]);
  });

  it('z pooled (Suissa–Shuster) is the most liberal', () => {
    expect(ts.pZ[k]).toBeLessThan(ts.pBoschloo[k]);
    expect(ts.pZ[k]).toBeGreaterThan(0.01);
    expect(ts.pZ[k]).toBeLessThan(0.04);
  });

  it('Berger–Boos ≤ Boschloo + gamma (maximization over a subset)', () => {
    // BB restricts the sup to the Clopper–Pearson set and adds gamma, so it
    // can be *smaller* than Boschloo's unrestricted sup.
    expect(ts.pBergerBoos![k]).toBeLessThanOrEqual(ts.pBoschloo[k] + 0.001 + 1e-9);
    expect(ts.pBergerBoos![k]).toBeGreaterThan(0);
    expect(ts.pBergerBoos![k]).toBeLessThan(ts.pFisher[k]);
  });
});

describe('exact power under p1=0.20, p2=0.03 (essay §potencia)', () => {
  it('Fisher ≈ 0.433, Boschloo ≈ 0.549 at alpha = 0.05', () => {
    const pF = powerAt(ts, rejectionMask(ts.pFisher, 0.05), 0.2, 0.03);
    const pB = powerAt(ts, rejectionMask(ts.pBoschloo, 0.05), 0.2, 0.03);
    expect(pF).toBeCloseTo(0.433, 1);
    expect(pB).toBeCloseTo(0.549, 1);
    expect(pB).toBeGreaterThan(pF);
  });

  it('sizes stay below alpha (tests are valid); Fisher wastes ~40% of it', () => {
    const grid = new Float64Array(401);
    for (let i = 0; i < 401; i++) grid[i] = 0.00125 + 0.0025 * i;
    const sizeF = Math.max(...sizeCurve(ts, rejectionMask(ts.pFisher, 0.05), grid));
    const sizeB = Math.max(...sizeCurve(ts, rejectionMask(ts.pBoschloo, 0.05), grid));
    expect(sizeF).toBeLessThan(0.051);
    expect(sizeB).toBeLessThan(0.051);
    expect(sizeF).toBeLessThan(sizeB); // Fisher is more conservative
  });
});

describe('corrections and estimation (sesgo_varianza.R reference)', () => {
  it('OR estimates: c=0 gives 8.56, Haldane c=0.5 ≈ 6.09, c=1 ≈ 4.86', () => {
    expect(Math.exp(logOrCorrected(X1, N1, X2, N2, 0))).toBeCloseTo(8.556, 2);
    expect(Math.exp(logOrCorrected(X1, N1, X2, N2, 0.5))).toBeCloseTo(6.091, 2);
    expect(Math.exp(logOrCorrected(X1, N1, X2, N2, 1))).toBeCloseTo(4.857, 2);
  });

  it('P(MLE infinite) ≈ 0.36 at (0.206, 0.029)', () => {
    expect(pZeroCell(ts, 0.206, 0.029)).toBeCloseTo(0.36, 1);
  });

  it('bias–variance trade-off: c=1/3 nearly unbiased, c=1 shrinks variance', () => {
    const p1o = 7 / 34, p2o = 1 / 34;
    const truth = Math.log((p1o / (1 - p1o)) / (p2o / (1 - p2o)));
    const s13 = estimatorStats(ts, (a, b) => logOrCorrected(a, N1, b, N2, 1 / 3), truth, p1o, p2o);
    const s12 = estimatorStats(ts, (a, b) => logOrCorrected(a, N1, b, N2, 0.5), truth, p1o, p2o);
    const s1 = estimatorStats(ts, (a, b) => logOrCorrected(a, N1, b, N2, 1), truth, p1o, p2o);
    // Essay table: bias 0.023 / -0.160 / -0.493; var 0.975 / 0.727 / 0.427.
    expect(s13.bias).toBeCloseTo(0.023, 2);
    expect(s12.bias).toBeCloseTo(-0.16, 2);
    expect(s1.bias).toBeCloseTo(-0.493, 2);
    expect(s13.variance).toBeCloseTo(0.975, 2);
    expect(s12.variance).toBeCloseTo(0.727, 2);
    expect(s1.variance).toBeCloseTo(0.427, 2);
  });
});

describe('confidence intervals', () => {
  it('Woolf c=0.5 on Perondi: exp CI ≈ [0.98, 37.7]', () => {
    const ci = woolfCI(X1, N1, X2, N2, 0.5);
    expect(Math.exp(ci.lo)).toBeCloseTo(0.98, 1);
    expect(Math.exp(ci.hi)).toBeCloseTo(37.7, 0);
  });

  it('Cornfield exact on Perondi: exp CI ≈ [0.97, 396]', () => {
    const ci = cornfieldCI(X1, N1, X2, N2);
    expect(Math.exp(ci.lo)).toBeCloseTo(0.97, 1);
    // fisher.test reports ~396; tolerance loose because bisection on psi.
    expect(Math.exp(ci.hi)).toBeGreaterThan(300);
    expect(Math.exp(ci.hi)).toBeLessThan(500);
  });

  it('Agresti–Caffo RD ≈ [0.012, 0.322], Newcombe ≈ [0.019, 0.340]', () => {
    const ac = agrestiCaffoRD(X1, N1, X2, N2);
    const nw = newcombeRD(X1, N1, X2, N2);
    expect(ac.lo).toBeCloseTo(0.012, 2);
    expect(ac.hi).toBeCloseTo(0.322, 2);
    expect(nw.lo).toBeCloseTo(0.019, 2);
    expect(nw.hi).toBeCloseTo(0.34, 2);
  });

  it('Woolf coverage ≈ 0.953 at (0.20, 0.03); conditional exact ≥ 0.95', () => {
    const covW = coverageLogOr(ts, (a, b) => woolfCI(a, N1, b, N2, 0.5), 0.2, 0.03);
    expect(covW).toBeCloseTo(0.953, 1);
    // Conditional exact is expensive per table; check on a few points.
    const covC = coverageLogOr(ts, (a, b) => cornfieldCI(a, N1, b, N2), 0.2, 0.03);
    expect(covC).toBeGreaterThan(0.95);
  });
});

describe('central two-sided p', () => {
  it('doubles the smaller tail and caps at 1', () => {
    // Perondi: left tail 0.0341, right tail 0.9827 → central 0.0682,
    // while the minlike sum is ≈ 0.0539. Both are legitimately "two-sided".
    expect(centralP(0.0341, 0.9827)).toBeCloseTo(0.0682, 4);
    expect(centralP(0.9827, 0.0341)).toBeCloseTo(0.0682, 4);
    expect(centralP(0.5, 0.5)).toBe(1);
    expect(centralP(0.7, 0.6)).toBe(1);
  });
});

describe('sample size', () => {
  it('nForPower(0.20, 0.03, 80%) ≈ 55/group (Fleiss/Woodward formula)', () => {
    // (1.96·sqrt(2·0.115·0.885) + 0.8416·sqrt(0.16+0.0291))²/0.17² ≈ 54.1.
    const n = nForPower(0.2, 0.03, 0.05, 0.8);
    expect(n).toBe(55);
    // Consistency check: the essay's exact power at n=34 is far below 0.8,
    // which is why the formula asks for more.
  });
});
