import { describe, expect, it } from 'vitest';
import {
  agrestiCoullCI,
  boundsForAllX,
  clopperPearsonCI,
  dbetabinom,
  exactCoverage,
  jeffreysCI,
  lengthDistribution,
  likelihoodRatioCI,
  nClassic,
  nExponentialClosed,
  nExponentialExact,
  nGuaranteeExact,
  nOriginalFormula,
  outcomeWeights,
  pgamma,
  probL,
  qchisq,
  waldCI,
  wilsonCI,
} from '@/lib/precision';
import { dbinom, normQuantile, qbeta } from '@/lib/exact2x2';

describe('CI methods for a proportion', () => {
  it('Wald at x=0 collapses to a point (inadmissible)', () => {
    const ci = waldCI(0, 50);
    expect(ci.lo).toBe(0);
    expect(ci.hi).toBe(0);
    const ciN = waldCI(50, 50);
    expect(ciN.lo).toBe(1);
    expect(ciN.hi).toBe(1);
  });

  it('Wald can leave [0,1] with extreme proportions', () => {
    // p = 0.98, n = 50: upper limit > 1
    const ci = waldCI(49, 50);
    expect(ci.hi).toBeGreaterThan(1);
  });

  it('Wilson CI matches the score-interval closed form (x=3, n=30)', () => {
    // Reference: Wilson (3,30,0.95) ≈ [0.0346, 0.2566]
    const ci = wilsonCI(3, 30);
    expect(ci.lo).toBeCloseTo(0.0346, 3);
    expect(ci.hi).toBeCloseTo(0.2566, 3);
    expect(ci.lo).toBeGreaterThanOrEqual(0);
    expect(ci.hi).toBeLessThanOrEqual(1);
  });

  it('Wilson at x=0 gives an honest upper bound', () => {
    const ci = wilsonCI(0, 34);
    expect(ci.lo).toBe(0);
    expect(ci.hi).toBeGreaterThan(0.05);
    expect(ci.hi).toBeLessThan(0.2);
  });

  it('Jeffreys CI = Beta(x+1/2, n-x+1/2) quantiles with edge correction', () => {
    const ci = jeffreysCI(3, 30);
    expect(ci.lo).toBeCloseTo(qbeta(0.025, 3.5, 27.5), 12);
    expect(ci.hi).toBeCloseTo(qbeta(0.975, 3.5, 27.5), 12);
    // sanity bounds against the R reference ≈ [0.029, 0.243]
    expect(ci.lo).toBeCloseTo(0.029, 2);
    expect(ci.hi).toBeCloseTo(0.243, 2);
    const edge = jeffreysCI(0, 30);
    expect(edge.lo).toBe(0);
    expect(edge.hi).toBeLessThan(wilsonCI(0, 30).hi + 1e-9);
  });

  it('Clopper–Pearson is wider than Wilson (conservative)', () => {
    const cp = clopperPearsonCI(3, 30);
    const w = wilsonCI(3, 30);
    expect(cp.lo).toBeLessThan(w.lo);
    expect(cp.hi).toBeGreaterThan(w.hi);
    // CP(3,30,0.95) ≈ [0.021, 0.266]
    expect(cp.lo).toBeCloseTo(0.021, 2);
    expect(cp.hi).toBeCloseTo(0.266, 2);
  });

  it('Agresti–Coull equals adding z²/2 successes and failures', () => {
    const ci = agrestiCoullCI(3, 30);
    const z = normQuantile(0.975);
    const z2 = z * z;
    const nt = 30 + z2;
    const pt = (3 + z2 / 2) / nt;
    const hw = z * Math.sqrt((pt * (1 - pt)) / nt);
    expect(ci.lo).toBeCloseTo(pt - hw, 10);
    expect(ci.hi).toBeCloseTo(pt + hw, 10);
  });

  it('LR CI solves the likelihood-ratio equation at the edges', () => {
    // x = 0: lmax - l(p) = q  =>  -n·log(1-p) = q  =>  hi = 1 - exp(-q/n)
    const n = 34;
    const q = 1.959964 ** 2 / 2;
    const ci = likelihoodRatioCI(0, n);
    expect(ci.lo).toBe(0);
    expect(ci.hi).toBeCloseTo(1 - Math.exp(-q / n), 3);
  });
});

describe('weights and exact distribution of L', () => {
  it('binomial weights sum to 1', () => {
    const w = outcomeWeights(40, 0.1);
    let s = 0;
    for (const v of w) s += v;
    expect(s).toBeCloseTo(1, 12);
    expect(w[4]).toBeCloseTo(dbinom(4, 40, 0.1), 15);
  });

  it('beta-binomial weights sum to 1 and match the closed form', () => {
    const w = outcomeWeights(20, null, [5, 45]);
    let s = 0;
    for (const v of w) s += v;
    expect(s).toBeCloseTo(1, 10);
    expect(w[2]).toBeCloseTo(dbetabinom(2, 20, 5, 45), 15);
  });

  it('E[L] of the classic formula reproduces ~50% guarantee', () => {
    // At n = nClassic, P(L <= L0) should sit near 0.5 (not 0.9)
    const p = 0.1, L0 = 0.1;
    const n = nClassic(p, L0);
    const g = probL(n, L0, p, 'wilson');
    expect(g).toBeGreaterThan(0.3);
    expect(g).toBeLessThan(0.75);
  });

  it('length distribution sums to 1 and E[L] is finite', () => {
    const d = lengthDistribution(50, 0.1, 'wilson');
    let s = 0;
    for (const v of d.prob) s += v;
    expect(s).toBeCloseTo(1, 12);
    expect(d.E_L).toBeGreaterThan(0.1);
    expect(d.E_L).toBeLessThan(0.4);
  });
});

describe('exact coverage', () => {
  it('Wald coverage is symmetric in p and 1-p (same n)', () => {
    const grid = new Float64Array([0.1, 0.9]);
    const cov = exactCoverage(grid, 40, 'wald');
    expect(cov[0]).toBeCloseTo(cov[1], 10);
  });

  it('Clopper–Pearson never undercovers on a coarse grid', () => {
    const grid = new Float64Array(51);
    for (let i = 0; i < 51; i++) grid[i] = 0.01 + 0.0196 * i;
    const cov = exactCoverage(grid, 30, 'clopperPearson');
    for (const c of cov) expect(c).toBeGreaterThanOrEqual(0.95 - 1e-9);
  });

  it('Wald severely undercovers for extreme p in small n', () => {
    const grid = new Float64Array([0.02, 0.05, 0.95, 0.98]);
    const cov = exactCoverage(grid, 25, 'wald');
    expect(cov[0]).toBeLessThan(0.9);
    expect(cov[3]).toBeLessThan(0.9);
  });
});

describe('sample size with guarantee', () => {
  it('nClassic matches z²p(1−p)/δ²', () => {
    // p=0.1, L0=0.1 → n = 3.8416·0.09/0.0025 ≈ 138.3 → 139
    expect(nClassic(0.1, 0.1)).toBe(139);
    expect(nClassic(0.5, 0.1)).toBe(385);
  });

  it('nGuaranteeExact delivers P(L<=L0) >= 1−β and exceeds nClassic', () => {
    const p = 0.1, L0 = 0.1, beta = 0.1;
    const n = nGuaranteeExact(L0, p, beta, 'wilson');
    expect(n).toBeGreaterThan(nClassic(p, L0));
    expect(probL(n, L0, p, 'wilson')).toBeGreaterThanOrEqual(1 - beta);
  });

  it('the defective original formula diverges from the exact n (it is not a guarantee calculation)', () => {
    const p = 0.1, L0 = 0.1, beta = 0.1;
    const nOrig = nOriginalFormula(p, L0, 0.05, beta);
    const nExact = nGuaranteeExact(L0, p, beta, 'wilson');
    // The original sums z_beta to z_alpha as in a power calculation and
    // confuses L with the half-width: it can overshoot (here) or
    // undershoot; it is structurally not a P(L<=L0) calculation.
    expect(nOrig).not.toBe(nExact);
    expect(probL(nExact, L0, p, 'wilson')).toBeGreaterThanOrEqual(1 - beta);
  });

  it('Bayesian guarantee with a spread prior demands more n', () => {
    const L0 = 0.1, beta = 0.1;
    const nPoint = nGuaranteeExact(L0, 0.1, beta, 'wilson');
    const nPrior = nGuaranteeExact(L0, null, beta, 'wilson', 0.95, [5, 45]);
    expect(nPrior).toBeGreaterThanOrEqual(nPoint);
  });
});

describe('pgamma / qchisq / exponential case', () => {
  it('pgamma matches the exponential CDF for shape=1', () => {
    expect(pgamma(2, 1)).toBeCloseTo(1 - Math.exp(-2), 10);
    expect(pgamma(1, 2)).toBeCloseTo(1 - Math.exp(-1) * (1 + 1), 10);
  });

  it('qchisq inverts pgamma', () => {
    expect(qchisq(0.95, 1)).toBeCloseTo(3.841459, 4);
    expect(qchisq(0.975, 4)).toBeCloseTo(11.14329, 3);
  });

  it('exponential closed form recovers n=(2zμ/L0)² when β→0.5', () => {
    const mu0 = 10, L0 = 4;
    const n = nExponentialClosed(mu0, L0, 0.95, 0.5);
    const target = Math.ceil(((2 * 1.959964 * mu0) / L0) ** 2);
    expect(n).toBe(target);
  });

  it('exponential exact n achieves the guarantee; the doc formula under-delivers', () => {
    const mu0 = 10, L0 = 6, beta = 0.1;
    const n = nExponentialExact(mu0, L0, 0.95, beta);
    expect(n).toBeGreaterThan(10);
    expect(n).toBeLessThan(1000);
    // Original seminar formula ((z_a + z_b)mu/L0)² omits the factor 2:
    // it gives a smaller n that cannot sustain P(L<=L0) >= 1-beta.
    const alpha = 0.05;
    const nOrig = Math.ceil(
      ((normQuantile(1 - alpha / 2) + normQuantile(1 - beta)) * mu0) / L0
    ) ** 2;
    expect(nOrig).toBeLessThan(n);
    const a = 1 - 0.95;
    const k = (nn: number) =>
      2 * nn * (1 / qchisq(a / 2, 2 * nn) - 1 / qchisq(1 - a / 2, 2 * nn));
    const P = (nn: number) => pgamma(((L0 / k(nn)) * nn) / mu0, nn);
    expect(P(nOrig)).toBeLessThan(1 - beta);
    expect(P(n)).toBeGreaterThanOrEqual(1 - beta);
  });
});
