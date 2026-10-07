/**
 * Funciones matemáticas puras para el DistExplorer.
 *
 * Implementa PDF y CDF de las distribuciones más usadas en GAMLSS
 * usando la parametrización de Rigby et al. (2019):
 *
 *   NO    — Normal                    (μ, σ)
 *   GA    — Gamma                     (μ, σ)
 *   LOGNO — Log-Normal                (μ, σ)
 *   WEI3  — Weibull (3 parámetros)    (μ, σ, ν)
 *   BCCG  — Box-Cox Cole-Green        (μ, σ, ν)
 *   BCT   — Box-Cox t                 (μ, σ, ν, τ)
 *   BE    — Beta                      (μ, σ, ν)
 *   NBI   — Binomial Negativa I       (μ, σ)
 *   ZIP   — Zero-Inflated Poisson     (μ, σ)
 *   ZINBI — Zero-Inflated NBI         (μ, σ, ν)
 *   GB2   — Generalized Beta 2        (μ, σ, ν, τ)
 *
 * Referencias: Rigby, Stasinopoulos, Heller & De Bastiani (2019),
 * "Distributions for Modeling Location, Scale, and Shape".
 */

// ─── Funciones especiales ───────────────────────────────────────────

/** Log-gamma via Lanczos approximation (precision ~1e-15). */
export function lgamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  const a = c[0];
  const t = x + g - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x - 0.5) * Math.log(t) - t + Math.log(a);
}

/** Gamma function Γ(x) = exp(lgamma(x)). */
export function gamma(x: number): number {
  return Math.exp(lgamma(x));
}

/** Log-beta: ln B(a,b) = lgamma(a) + lgamma(b) - lgamma(a+b). */
function lbeta(a: number, b: number): number {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

/** Beta function B(a,b). */
export function beta(a: number, b: number): number {
  return Math.exp(lbeta(a, b));
}

/** Incomplete beta function (regularized) I_x(a,b) via continued fraction. */
function betacf(a: number, b: number, x: number): number {
  const maxIter = 200;
  const eps = 3e-12;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < eps) d = eps;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    const aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    h *= d * c;
    const aa2 = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa2 * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa2 / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a,b) = P(X <= x) for Beta(a,b). */
export function betainc(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Lower incomplete gamma P(a,x) via series or continued fraction. */
function gammaincLower(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    // Series expansion
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  // Continued fraction
  let b = x + 1 - a;
  let c = 1e30;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - h * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

// ─── Tipos ──────────────────────────────────────────────────────────

export interface DistParams {
  mu: number;
  sigma: number;
  nu: number;
  tau: number;
}

export interface DistributionDef {
  key: string;
  label: string;
  support: string;
  params: ('mu' | 'sigma' | 'nu' | 'tau')[];
  defaults: Partial<DistParams>;
  /** PDF en x. */
  pdf: (x: number, p: DistParams) => number;
  /** CDF en x. */
  cdf: (x: number, p: DistParams) => number;
  /** Rango sugerido para el eje x. */
  xRange: (p: DistParams) => [number, number];
}

// ─── Distribuciones ─────────────────────────────────────────────────

const SQRT2PI = Math.sqrt(2 * Math.PI);

export const DISTRIBUTIONS: DistributionDef[] = [
  // ── NO: Normal ─────────────────────────────────────────────────────
  {
    key: 'NO',
    label: 'Normal (NO)',
    support: 'ℝ',
    params: ['mu', 'sigma'],
    defaults: { mu: 0, sigma: 1, nu: 0, tau: 0 },
    pdf: (x, p) => {
      const z = (x - p.mu) / p.sigma;
      return Math.exp(-0.5 * z * z) / (p.sigma * SQRT2PI);
    },
    cdf: (x, p) => {
      const z = (x - p.mu) / p.sigma;
      return 0.5 * (1 + erf(z / Math.SQRT2));
    },
    xRange: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
  },

  // ── GA: Gamma (μ = media, σ = CV) ──────────────────────────────────
  {
    key: 'GA',
    label: 'Gamma (GA)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma'],
    defaults: { mu: 50, sigma: 0.5, nu: 0, tau: 0 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const shape = 1 / (p.sigma * p.sigma);
      const rate = shape / p.mu;
      return Math.exp(-rate * x + (shape - 1) * Math.log(x) - lgamma(shape) + shape * Math.log(rate));
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const shape = 1 / (p.sigma * p.sigma);
      const rate = shape / p.mu;
      return gammaincLower(shape, rate * x);
    },
    xRange: (p) => [0, p.mu * (1 + 4 * p.sigma)],
  },

  // ── LOGNO: Log-Normal ──────────────────────────────────────────────
  {
    key: 'LOGNO',
    label: 'Log-Normal (LOGNO)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma'],
    defaults: { mu: 3, sigma: 0.5, nu: 0, tau: 0 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const logx = Math.log(x);
      const z = (logx - p.mu) / p.sigma;
      return Math.exp(-0.5 * z * z) / (x * p.sigma * SQRT2PI);
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const z = (Math.log(x) - p.mu) / p.sigma;
      return 0.5 * (1 + erf(z / Math.SQRT2));
    },
    xRange: (p) => [0, Math.exp(p.mu + 3 * p.sigma)],
  },

  // ── WEI3: Weibull (3 parámetros) ───────────────────────────────────
  // En gamlss: Y = μ * (-log(1-U))^(σ/ν) donde U ~ Uniform(0,1)
  // PDF: (ν/σ) * (x/μ)^(ν/σ - 1) * exp(-(x/μ)^(ν/σ)) / μ
  {
    key: 'WEI3',
    label: 'Weibull 3-parm (WEI3)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma', 'nu'],
    defaults: { mu: 100, sigma: 0.5, nu: 2, tau: 0 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const alpha = p.nu / p.sigma;
      const scale = p.mu;
      const r = x / scale;
      return (alpha / scale) * Math.pow(r, alpha - 1) * Math.exp(-Math.pow(r, alpha));
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const alpha = p.nu / p.sigma;
      return 1 - Math.exp(-Math.pow(x / p.mu, alpha));
    },
    xRange: (p) => [0, p.mu * 3],
  },

  // ── BCCG: Box-Cox Cole-Green ───────────────────────────────────────
  // Y ~ BCCG(μ, σ, ν): si ν≠0, Z = ((Y/μ)^ν - 1) / (νσ) ~ N(0,1)
  // Si ν=0, Z = log(Y/μ) / σ ~ N(0,1)
  {
    key: 'BCCG',
    label: 'Box-Cox Cole-Green (BCCG)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma', 'nu'],
    defaults: { mu: 50, sigma: 0.15, nu: 1, tau: 0 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu } = p;
      let z: number;
      let logJ: number;
      if (Math.abs(nu) < 1e-8) {
        z = Math.log(x / mu) / sigma;
        logJ = -Math.log(x);
      } else {
        const r = Math.pow(x / mu, nu);
        z = (r - 1) / (nu * sigma);
        logJ = (nu - 1) * Math.log(x) - nu * Math.log(mu);
      }
      return Math.exp(-0.5 * z * z - logJ - Math.log(sigma) - 0.5 * Math.log(2 * Math.PI));
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu } = p;
      let z: number;
      if (Math.abs(nu) < 1e-8) {
        z = Math.log(x / mu) / sigma;
      } else {
        z = (Math.pow(x / mu, nu) - 1) / (nu * sigma);
      }
      return 0.5 * (1 + erf(z / Math.SQRT2));
    },
    xRange: (p) => [0, p.mu * (1 + 3 * p.sigma)],
  },

  // ── BCT: Box-Cox t ─────────────────────────────────────────────────
  // Z = ((Y/μ)^ν - 1)/(νσ) ~ t_τ, con corrección por la transformación.
  // Aproximación: usar t distribution para Z y luego Jacobiano.
  {
    key: 'BCT',
    label: 'Box-Cox t (BCT)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma', 'nu', 'tau'],
    defaults: { mu: 50, sigma: 0.15, nu: 1, tau: 5 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu, tau } = p;
      let z: number;
      let logJ: number;
      if (Math.abs(nu) < 1e-8) {
        z = Math.log(x / mu) / sigma;
        logJ = -Math.log(x);
      } else {
        const r = Math.pow(x / mu, nu);
        z = (r - 1) / (nu * sigma);
        logJ = (nu - 1) * Math.log(x) - nu * Math.log(mu);
      }
      // t distribution PDF: f(z) = Γ((τ+1)/2) / (√(τπ) Γ(τ/2)) * (1 + z²/τ)^(-(τ+1)/2)
      const logTpdf =
        lgamma((tau + 1) / 2) - lgamma(tau / 2) - 0.5 * Math.log(tau * Math.PI) -
        ((tau + 1) / 2) * Math.log(1 + (z * z) / tau);
      return Math.exp(logTpdf + logJ - Math.log(sigma));
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu, tau } = p;
      let z: number;
      if (Math.abs(nu) < 1e-8) {
        z = Math.log(x / mu) / sigma;
      } else {
        z = (Math.pow(x / mu, nu) - 1) / (nu * sigma);
      }
      return tCDF(z, tau);
    },
    xRange: (p) => [0, p.mu * (1 + 4 * p.sigma)],
  },

  // ── BE: Beta (μ = media, σ = precisión-related) ────────────────────
  // En gamlss: Y ~ Beta(μ, σ) donde mean = μ, precision = 1/σ²
  // α = μ * (1/σ² - 1), β = (1-μ) * (1/σ² - 1)
  {
    key: 'BE',
    label: 'Beta (BE)',
    support: '(0, 1)',
    params: ['mu', 'sigma'],
    defaults: { mu: 0.5, sigma: 0.2, nu: 0, tau: 0 },
    pdf: (x, p) => {
      if (x <= 0 || x >= 1) return 0;
      const precision = 1 / (p.sigma * p.sigma);
      const alpha = p.mu * (precision - 1);
      const betaP = (1 - p.mu) * (precision - 1);
      if (alpha <= 0 || betaP <= 0) return 0;
      return Math.exp(
        (alpha - 1) * Math.log(x) + (betaP - 1) * Math.log(1 - x) - lbeta(alpha, betaP)
      );
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      const precision = 1 / (p.sigma * p.sigma);
      const alpha = p.mu * (precision - 1);
      const betaP = (1 - p.mu) * (precision - 1);
      if (alpha <= 0 || betaP <= 0) return 0;
      return betainc(x, alpha, betaP);
    },
    xRange: () => [0, 1],
  },

  // ── NBI: Binomial Negativa I ───────────────────────────────────────
  // Y ~ NBI(μ, σ): P(Y=k) = Γ(k+1/σ)/(Γ(1/σ) k!) * (σμ/(1+σμ))^k * (1/(1+σμ))^(1/σ)
  {
    key: 'NBI',
    label: 'Binomial Negativa I (NBI)',
    support: 'ℕ₀',
    params: ['mu', 'sigma'],
    defaults: { mu: 5, sigma: 0.5, nu: 0, tau: 0 },
    pdf: (x, p) => {
      const k = Math.round(x);
      if (k < 0) return 0;
      const r = 1 / p.sigma;
      const prob = p.sigma * p.mu / (1 + p.sigma * p.mu);
      return Math.exp(
        lgamma(k + r) - lgamma(r) - lgamma(k + 1) +
        k * Math.log(prob) + r * Math.log(1 - prob)
      );
    },
    cdf: (x, p) => {
      const k = Math.floor(x);
      if (k < 0) return 0;
      let sum = 0;
      for (let i = 0; i <= k; i++) {
        sum += DISTRIBUTIONS.find((d) => d.key === 'NBI')!.pdf(i, p);
      }
      return Math.min(sum, 1);
    },
    xRange: (p) => [0, Math.ceil(p.mu * (1 + 4 * p.sigma))],
  },

  // ── ZIP: Zero-Inflated Poisson ─────────────────────────────────────
  // P(Y=0) = σ + (1-σ)*exp(-μ), P(Y=k) = (1-σ)*exp(-μ)*μ^k/k! for k>0
  {
    key: 'ZIP',
    label: 'Zero-Inflated Poisson (ZIP)',
    support: 'ℕ₀',
    params: ['mu', 'sigma'],
    defaults: { mu: 5, sigma: 0.3, nu: 0, tau: 0 },
    pdf: (x, p) => {
      const k = Math.round(x);
      if (k < 0) return 0;
      const poiProb = Math.exp(-p.mu + k * Math.log(p.mu) - lgamma(k + 1));
      if (k === 0) {
        return p.sigma + (1 - p.sigma) * poiProb;
      }
      return (1 - p.sigma) * poiProb;
    },
    cdf: (x, p) => {
      const k = Math.floor(x);
      if (k < 0) return 0;
      let sum = 0;
      for (let i = 0; i <= k; i++) {
        sum += DISTRIBUTIONS.find((d) => d.key === 'ZIP')!.pdf(i, p);
      }
      return Math.min(sum, 1);
    },
    xRange: (p) => [0, Math.ceil(p.mu * 3)],
  },

  // ── ZINBI: Zero-Inflated NBI ───────────────────────────────────────
  // P(Y=k) = (1-ν)*NBI(μ,σ) for k>0, P(Y=0) = ν + (1-ν)*NBI(0;μ,σ)
  {
    key: 'ZINBI',
    label: 'Zero-Inflated NBI (ZINBI)',
    support: 'ℕ₀',
    params: ['mu', 'sigma', 'nu'],
    defaults: { mu: 5, sigma: 0.5, nu: 0.3, tau: 0 },
    pdf: (x, p) => {
      const k = Math.round(x);
      if (k < 0) return 0;
      const nbiDist = DISTRIBUTIONS.find((d) => d.key === 'NBI')!;
      const nbiProb = nbiDist.pdf(k, { mu: p.mu, sigma: p.sigma, nu: 0, tau: 0 });
      if (k === 0) {
        return p.nu + (1 - p.nu) * nbiProb;
      }
      return (1 - p.nu) * nbiProb;
    },
    cdf: (x, p) => {
      const k = Math.floor(x);
      if (k < 0) return 0;
      let sum = 0;
      for (let i = 0; i <= k; i++) {
        sum += DISTRIBUTIONS.find((d) => d.key === 'ZINBI')!.pdf(i, p);
      }
      return Math.min(sum, 1);
    },
    xRange: (p) => [0, Math.ceil(p.mu * (1 + 3 * p.sigma))],
  },

  // ── GB2: Generalized Beta 2 ────────────────────────────────────────
  // Y ~ GB2(μ, σ, ν, τ) con parametrización gamlss:
  // f(y) = |ν| * y^(ντ-1) * (μ/σ)^(ντ) / [B(τ, ν) * (1 + (y/μ)^ν)^(τ+ν) * μ * σ]
  // Aproximación numérica estable usando logs.
  {
    key: 'GB2',
    label: 'Generalized Beta 2 (GB2)',
    support: 'ℝ⁺',
    params: ['mu', 'sigma', 'nu', 'tau'],
    defaults: { mu: 50, sigma: 0.5, nu: 1, tau: 5 },
    pdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu, tau } = p;
      const a = tau;
      const b = nu;
      const logPdf =
        Math.log(Math.abs(nu)) +
        (nu * tau - 1) * Math.log(x) +
        nu * tau * (Math.log(mu) - Math.log(sigma)) -
        lbeta(a, b) -
        (tau + nu) * Math.log(1 + Math.pow(x / mu, nu)) -
        Math.log(mu) - Math.log(sigma);
      return Math.exp(logPdf);
    },
    cdf: (x, p) => {
      if (x <= 0) return 0;
      const { mu, sigma, nu, tau } = p;
      // CDF via incomplete beta: z = (x/μ)^ν / (1 + (x/μ)^ν)
      const r = Math.pow(x / mu, nu);
      const z = r / (1 + r);
      return betainc(z, tau, nu);
    },
    xRange: (p) => [0, p.mu * 4],
  },
];

// ─── Utilidades ─────────────────────────────────────────────────────

/** Error function approximation (Abramowitz & Stegun 7.1.26). */
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1 + 0.70473081 * t + 1.59762932 * t * t) * t + 0.43612389 * t * t * t) * t +
      0.02028114 * t * t * t * t) * t +
      0.00033411 * t * t * t * t * t) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/** CDF of Student's t with df degrees of freedom. */
function tCDF(x: number, df: number): number {
  // P(T <= x) = 1 - 0.5 * I_{df/(df+x²)}(df/2, 1/2) for x > 0
  //           = 0.5 * I_{df/(df+x²)}(df/2, 1/2) for x <= 0
  const xx = df / (df + x * x);
  const ibeta = betainc(xx, df / 2, 0.5);
  return x > 0 ? 1 - 0.5 * ibeta : 0.5 * ibeta;
}

export function getDistribution(key: string): DistributionDef | undefined {
  return DISTRIBUTIONS.find((d) => d.key === key);
}
