import { describe, expect, it } from 'vitest';
import {
  coverageAudit,
  entropy,
  goodman,
  quesenberryHurst,
  rmultinom,
  sisonGlaz,
  tclMarginal,
} from '@/lib/multinomial';
import { mulberry32 } from '@/lib/rng';

const UNIFORM4 = [0.25, 0.25, 0.25, 0.25];
const SKEWED4 = [0.85, 0.08, 0.045, 0.025];

describe('entropy', () => {
  it('es 1 en uniforme y cae al desequilibrar', () => {
    expect(entropy(UNIFORM4)).toBeCloseTo(1, 10);
    expect(entropy(SKEWED4)).toBeLessThan(0.7);
    expect(entropy([1, 0, 0, 0])).toBeCloseTo(0, 10);
  });
});

describe('rmultinom', () => {
  it('suma n y respeta frecuencias con semilla fija', () => {
    const rng = mulberry32(7);
    const x = rmultinom(5000, UNIFORM4, rng);
    expect(x.reduce((a, b) => a + b, 0)).toBe(5000);
    for (const xi of x) expect(xi / 5000).toBeCloseTo(0.25, 1);
  });
});

describe('bandas', () => {
  const x = [30, 20, 15, 5];
  const n = 70;

  it('todas quedan dentro de [0,1] y contienen p-hat razonable', () => {
    for (const band of [
      tclMarginal(x, n, 0.95),
      quesenberryHurst(x, n, 0.95),
      goodman(x, n, 0.95),
    ]) {
      band.lo.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(band.hi[i]);
      });
      // QH/Goodman deben cubrir p-hat salvo desvíos grandes
      expect(band.lo[0]).toBeLessThan(0.5);
      expect(band.hi[0]).toBeGreaterThan(0.3);
    }
  });

  it('QH es más ancho que Goodman (misma forma, B mayor)', () => {
    const qh = quesenberryHurst(x, n, 0.95);
    const go = goodman(x, n, 0.95);
    for (let i = 0; i < x.length; i++) {
      expect(qh.hi[i] - qh.lo[i]).toBeGreaterThanOrEqual(
        go.hi[i] - go.lo[i] - 1e-12
      );
    }
  });
});

describe('sisonGlaz', () => {
  it('b crece cuando crece conf', () => {
    const x = [30, 20, 15, 5];
    const a = sisonGlaz(x, 70, 0.9, mulberry32(1));
    const b = sisonGlaz(x, 70, 0.99, mulberry32(1));
    expect(b.b).toBeGreaterThanOrEqual(a.b);
    expect(b.band.hi[0]).toBeGreaterThanOrEqual(a.band.hi[0]);
  });
});

describe('coverageAudit', () => {
  it('TCL subcubre vs métodos simultáneos (n moderado, uniforme)', () => {
    const res = coverageAudit(
      UNIFORM4,
      80,
      ['tcl', 'qh', 'goodman'],
      0.95,
      1500,
      11
    );
    const tcl = res.find((r) => r.key === 'tcl')!;
    const qh = res.find((r) => r.key === 'qh')!;
    const go = res.find((r) => r.key === 'goodman')!;
    // TCL de 4 celdas: cobertura simultánea muy por debajo de 0.95
    expect(tcl.cov).toBeLessThan(0.93);
    expect(qh.cov).toBeGreaterThan(tcl.cov);
    expect(go.cov).toBeGreaterThan(tcl.cov);
    // EE reportada y coherente
    for (const r of res) {
      expect(r.se).toBeCloseTo(Math.sqrt((r.cov * (1 - r.cov)) / 1500), 12);
    }
  });
});
