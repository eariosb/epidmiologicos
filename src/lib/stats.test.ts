import { describe, expect, it } from 'vitest';
import { erfc, normCdf } from '@/lib/exact2x2';
import { pchisqUpper } from '@/lib/precision';
import { mulberry32, rbinom, rpois } from '@/lib/rng';
import { rmultinom } from '@/lib/multinomial';

/** Error relativo. */
const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('normCdf / erfc', () => {
  it('conserva precisión relativa en la cola (valores de R: pnorm)', () => {
    expect(rel(normCdf(-5), 2.86651571879194e-7)).toBeLessThan(2e-7);
    expect(rel(normCdf(-8), 6.22096057427178e-16)).toBeLessThan(2e-7);
    expect(normCdf(1.2)).toBeCloseTo(0.884930329778292, 7);
  });
  it('erfc(0) = 1 y erfc(−x) = 2 − erfc(x)', () => {
    expect(erfc(0)).toBeCloseTo(1, 7);
    expect(erfc(-0.7) + erfc(0.7)).toBeCloseTo(2, 12);
  });
});

describe('pchisqUpper (valores de R: pchisq(..., lower.tail = FALSE))', () => {
  it('coincide con R en el centro y en colas extremas', () => {
    expect(pchisqUpper(3.841458820694124, 1)).toBeCloseTo(0.05, 9);
    expect(pchisqUpper(10, 4)).toBeCloseTo(0.0404276819945128, 9);
    expect(pchisqUpper(0.5, 7)).toBeCloseTo(0.999446481390425, 9);
    expect(rel(pchisqUpper(152.233, 12), 1.99677213733531e-26)).toBeLessThan(1e-6);
  });
  it('x ≤ 0 da 1', () => {
    expect(pchisqUpper(0, 3)).toBe(1);
  });
});

describe('rng', () => {
  it('mulberry32 es reproducible y uniforme en [0, 1)', () => {
    const a = mulberry32(7), b = mulberry32(7);
    let m = 0;
    for (let i = 0; i < 20000; i++) {
      const u = a();
      expect(u).toBe(b());
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      m += u;
    }
    expect(m / 20000).toBeCloseTo(0.5, 2);
  });
  it('rbinom y rpois respetan media y soporte', () => {
    const rng = mulberry32(11);
    let sb = 0, sp = 0;
    for (let i = 0; i < 4000; i++) {
      const x = rbinom(rng, 400, 0.3);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(400);
      sb += x;
      sp += rpois(rng, 3.5);
    }
    expect(sb / 4000).toBeCloseTo(120, 0);
    expect(sp / 4000).toBeCloseTo(3.5, 1);
  });
});

describe('rmultinom', () => {
  it('no indexa fuera del vector aunque p sume un ulp menos de 1', () => {
    const p = [0.1, 0.2, 0.3, 0.39999999999999997];
    const rng = () => 0.9999999999999999; // u mayor que la suma acumulada
    const x = rmultinom(5, p, rng);
    expect(x).toHaveLength(4);
    expect(x.reduce((a, b) => a + b, 0)).toBe(5);
  });
});
