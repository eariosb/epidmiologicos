import { describe, expect, it } from 'vitest';
import { postModuleItems, susFinalItems, susScore, PRETEST_ITEMS } from './survey-items';

describe('instrumentos de encuesta', () => {
  it('susScore: ítems impares favorables 5 y pares 1 → 100; inverso → 0', () => {
    const fav = Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, i % 2 === 1 ? 5 : 1]));
    const unfav = Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, i % 2 === 1 ? 1 : 5]));
    expect(susScore(fav)).toBe(100);
    expect(susScore(unfav)).toBe(0);
    // respuestas uniformes no discriminan → 50
    const five = Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, 5]));
    expect(susScore(five)).toBe(50);
  });

  it('susScore: ítems pares se invierten (ejemplo doc: impares 4, pares 2 → 75)', () => {
    const r = Object.fromEntries(
      [1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, i % 2 === 1 ? 4 : 2]),
    );
    // 2.5·(20−5 + 25−10) = 2.5·30 = 75
    expect(susScore(r)).toBe(75);
  });

  it('susScore: respuesta incompleta/fuera de rango → null', () => {
    expect(susScore({ sus1: 3 })).toBeNull();
    const bad = Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, i === 4 ? 9 : 3]));
    expect(susScore(bad)).toBeNull();
  });

  it('post-module: 3 likert + 1 abierta, la primera menciona el concepto', () => {
    const items = postModuleItems('la propiedad de Markov');
    expect(items.filter((i) => i.type === 'likert')).toHaveLength(3);
    expect(items.filter((i) => i.type === 'open')).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: expect.stringContaining('propiedad de Markov') });
  });

  it('sus-final: 10 SUS + abiertas + nps incluidos', () => {
    const items = susFinalItems([{ id: 'x', type: 'likert', label: 'x' }]);
    expect(items.filter((i) => i.id.startsWith('sus'))).toHaveLength(10);
    expect(items.some((i) => i.type === 'nps')).toBe(true);
    expect(items.some((i) => i.id === 'x')).toBe(true);
  });

  it('pretest: incluye perfil, experiencia likert y preguntas abiertas', () => {
    expect(PRETEST_ITEMS.some((i) => i.id === 'programa')).toBe(true);
    expect(PRETEST_ITEMS.filter((i) => i.type === 'likert').length).toBeGreaterThanOrEqual(3);
    expect(PRETEST_ITEMS.some((i) => i.id === 'preocupacion')).toBe(true);
  });
});
