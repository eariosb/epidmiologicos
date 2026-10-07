import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './system';

const input = {
  module: {
    slug: 'lmm',
    title: 'Modelos lineales mixtos',
    objective: ['Formular LMM', 'Estimar con lme4'],
    datasets: ['sleepstudy'],
    order: 3,
  },
  visitedSections: ['lmm#introduccion', 'lmm#estimacion'],
  boardInventory: { formulas: 2, matrices: 1, captures: 3, questions: 1 },
  ragFragments: [
    {
      id: 'mod:lmm:definicion',
      source: 'module' as const,
      text: 'Modelo lineal mixto: efectos fijos y aleatorios',
      score: 4.2,
      meta: { moduleSlug: 'lmm', sectionAnchor: '#definicion' },
    },
    {
      id: 'bib:pinheiro-bates-2000',
      source: 'bibliography' as const,
      text: 'Mixed-Effects Models in S and S-PLUS. Pinheiro Bates 2000.',
      score: 3.1,
      meta: {},
    },
  ],
  assistantMode: 'ask' as const,
};

describe('buildSystemPrompt', () => {
  it('contains the module context, corpus fragments and mode', () => {
    const prompt = buildSystemPrompt(input);
    expect(prompt).toContain('Modelos lineales mixtos');
    expect(prompt).toContain('Formular LMM');
    expect(prompt).toContain('lmm#introduccion → lmm#estimacion');
    expect(prompt).toContain('fórmulas:2 matrices:1 capturas:3 preguntas:1');
    expect(prompt).toContain('[mod:lmm:definicion]');
    expect(prompt).toContain('[bib:pinheiro-bates-2000]');
    expect(prompt).toContain('formato de 5 secciones');
  });

  it('embeds only injected citations (no external refs possible)', () => {
    const prompt = buildSystemPrompt(input);
    expect(prompt).toContain('Cita SOLO con [id] de fuentes inyectadas');
    expect(prompt).not.toContain('Smith');
  });

  it('handles an empty corpus gracefully', () => {
    const prompt = buildSystemPrompt({ ...input, ragFragments: [] });
    expect(prompt).toContain('(sin fragmentos recuperados)');
  });

  it('matches the fixture snapshot', () => {
    expect(buildSystemPrompt(input)).toMatchSnapshot();
  });
});
