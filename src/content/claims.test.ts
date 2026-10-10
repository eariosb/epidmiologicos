import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { computeClaims } from '@/lib/claims';

// Las cifras de la prosa (src/content/claims.json) deben salir del mismo
// código que los simuladores. Si este test falla tras cambiar una
// librería, regenerar con `pnpm claims` y revisar la diferencia.
const onDisk: Record<string, number> = JSON.parse(
  readFileSync('src/content/claims.json', 'utf-8')
);

describe('claims.json', () => {
  const computed = computeClaims();

  it('mismas claves que el código', () => {
    expect(Object.keys(onDisk).sort()).toEqual(Object.keys(computed).sort());
  });

  it.each(Object.keys(computed))('%s coincide con la librería', (k) => {
    expect(onDisk[k]).toBeCloseTo(computed[k], 12);
  });

  it('los valores de referencia de Perondi no se movieron', () => {
    expect(computed['m6.perondi.fisher']).toBeCloseTo(0.0544, 3);
    expect(computed['m6.perondi.midp']).toBeCloseTo(0.0297, 3);
    expect(computed['m6.perondi.boschloo']).toBeCloseTo(0.0385, 3);
    expect(computed['m6.power.fisher']).toBeCloseTo(0.433, 2);
    expect(computed['m6.power.boschloo']).toBeCloseTo(0.549, 2);
    expect(computed['m5.precision.pLgtMean']).toBeCloseTo(0.569, 2);
    expect(computed['m5.precision.nGuarantee']).toBe(126);
  });
});
