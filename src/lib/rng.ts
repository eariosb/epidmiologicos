/**
 * Generadores aleatorios con semilla, compartidos por todos los
 * simuladores: la misma semilla produce la misma figura en el servidor y
 * en el navegador.
 */

/** mulberry32: generador uniforme de 32 bits (Tommy Ettinger). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar por Box–Muller. */
export function rnorm(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Binomial exacta como suma de Bernoulli (n moderado). */
export function rbinomExact(rng: () => number, n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (rng() < p) k++;
  return k;
}

/**
 * Binomial: exacta por ensayos cuando n·p o n·(1−p) es pequeño;
 * aproximación normal redondeada y truncada a [0, n] cuando ambos superan 40.
 */
export function rbinom(rng: () => number, n: number, p: number): number {
  if (n * p > 40 && n * (1 - p) > 40) {
    const x = Math.round(n * p + Math.sqrt(n * p * (1 - p)) * rnorm(rng));
    return Math.min(n, Math.max(0, x));
  }
  return rbinomExact(rng, n, p);
}

/**
 * Poisson: algoritmo de Knuth para λ ≤ 40; aproximación normal
 * redondeada (y truncada en 0) para λ mayor.
 */
export function rpois(rng: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 40) {
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * rnorm(rng)));
  }
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L);
  return k - 1;
}
