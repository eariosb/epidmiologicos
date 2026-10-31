import { describe, expect, it } from 'vitest';
import {
  diagnostic,
  kmCurve,
  rocBinormal,
  twoByTwo,
  wilsonInterval,
} from './epi-formulas';

// Referencia: los mismos cálculos en R (Rscript, ver prueba de la sesión).
describe('tabla 2×2 (valores verificados en R)', () => {
  // a=38 b=9 / c=31 d=22  →  n1=47, n0=53, n=100, m1=69
  const m = twoByTwo({ a: 38, b: 9, c: 31, d: 22 });

  it('riesgos, RR, OR y RD', () => {
    expect(m.riskExposed).toBeCloseTo(38 / 47, 10);
    expect(m.riskUnexposed).toBeCloseTo(31 / 53, 10);
    expect(m.rr).toBeCloseTo(1.3822923816, 8);
    expect(m.or).toBeCloseTo(2.9964157706, 8);
    expect(m.rd).toBeCloseTo(0.2236049779, 8);
    expect(m.nnt).toBeCloseTo(4.4721723519, 6);
  });

  it('fracciones atribuibles: en expuestos y de Levin', () => {
    expect(m.pafExposed).toBeCloseTo(0.2765640516, 8);
    // pe = 0.4 → PAF = 0.4·0.3822924/(1+0.4·0.3822924)
    expect(m.pafPopulation(0.4)).toBeCloseTo(0.1326348375, 8);
  });

  it('intervalos de Woolf para RR y OR', () => {
    expect(m.seLnRR).toBeCloseTo(0.1357546821, 8);
    expect(m.ciRR[0]).toBeCloseTo(1.0593590868, 8);
    expect(m.ciRR[1]).toBeCloseTo(1.8036681349, 8);
    expect(m.seLnOR).toBeCloseTo(0.4638313385, 8);
    expect(m.ciOR[0]).toBeCloseTo(1.2072045625, 8);
    expect(m.ciOR[1]).toBeCloseTo(7.4374366611, 8);
  });

  it('χ² de Pearson', () => {
    expect(m.chi2).toBeCloseTo(5.8227196214, 8);
  });

  it('celda vacía: RR y OR quedan indefinidos en vez de infinitos silenciosos', () => {
    const z = twoByTwo({ a: 0, b: 10, c: 5, d: 10 });
    expect(Number.isNaN(z.seLnOR)).toBe(true);
    expect(Number.isNaN(z.ciOR[0])).toBe(true);
    expect(Number.isNaN(z.rr)).toBe(false); // r0 = 5/15 > 0, sí se puede calcular
  });
});

describe('Kaplan–Meier', () => {
  it('producto-límite en un ejemplo a mano', () => {
    const data: [number, number][] = [
      [1, 1],
      [2, 1],
      [2, 1],
      [3, 1],
    ];
    const km = kmCurve(data);
    expect(km.map((p) => p.t)).toEqual([1, 2, 3]);
    expect(km[0]).toMatchObject({ nrisk: 4, d: 1 });
    expect(km[0].s).toBeCloseTo(0.75, 10);
    expect(km[1].s).toBeCloseTo(0.25, 10); // 0.75·(1 − 2/3)
    expect(km[2].s).toBeCloseTo(0, 10); // último en riesgo muere
  });

  it('las censuras no son eventos pero sí reducen el riesgo', () => {
    const data: [number, number][] = [
      [1, 1],
      [2, 0],
      [3, 1],
    ];
    const km = kmCurve(data);
    expect(km.map((p) => p.t)).toEqual([1, 3]);
    expect(km[0].s).toBeCloseTo(2 / 3, 10);
    // en t = 3 el censurado en 2 ya salió del riesgo: solo queda [3, 1]
    expect(km[1]).toMatchObject({ nrisk: 1, d: 1 });
    expect(km[1].s).toBeCloseTo(0, 10);
  });
});

describe('prueba diagnóstica', () => {
  const d = diagnostic(0.95, 0.95, 0.02);

  it('celdas y valores predictivos con prevalencia baja', () => {
    expect(d.vp).toBeCloseTo(190, 8);
    expect(d.fn).toBeCloseTo(10, 8);
    expect(d.fp).toBeCloseTo(490, 8);
    expect(d.vn).toBeCloseTo(9310, 8);
    expect(d.ppv).toBeCloseTo(190 / 680, 10); // 0.279
    expect(d.npv).toBeCloseTo(9310 / 9320, 10); // 0.9989
  });

  it('razones de verosimilitud', () => {
    expect(d.lrPositive).toBeCloseTo(19, 10);
    expect(d.lrNegative).toBeCloseTo(1 / 19, 10);
  });

  it('con prevalencia alta el VPP sube y el VPN baja', () => {
    const alta = diagnostic(0.95, 0.95, 0.5);
    expect(alta.ppv).toBeCloseTo(0.95, 6);
    expect(alta.npv).toBeCloseTo(0.95, 6);
  });
});

describe('ROC binormal', () => {
  it('AUC = Φ(d/√2) y los puntos operativos son coherentes', () => {
    const roc = rocBinormal(1.4);
    expect(roc.auc).toBeCloseTo(0.8389005969, 7); // erfc: error ~1e-9
    const at0 = roc.at(0);
    expect(at0.sens).toBeCloseTo(1 - 0.080757, 5); // 1 − Φ(−1.4)
    expect(at0.fpr).toBeCloseTo(0.5, 7); // erfc: error ~1e-8
    // Con separación 0 la curva es la diagonal.
    const nula = rocBinormal(0);
    expect(nula.auc).toBeCloseTo(0.5, 7);
    expect(nula.at(0.3).sens).toBeCloseTo(nula.at(0.3).fpr, 10);
  });
});

describe('intervalo de Wilson', () => {
  it('10/100 y 0/20 (donde Wald falla)', () => {
    const [lo, hi] = wilsonInterval(10, 100);
    expect(lo).toBeCloseTo(0.0552285416, 8);
    expect(hi).toBeCloseTo(0.1743673044, 8);
    const [lo0, hi0] = wilsonInterval(0, 20);
    expect(lo0).toBe(0);
    expect(hi0).toBeCloseTo(0.1611301255, 8);
  });
});
