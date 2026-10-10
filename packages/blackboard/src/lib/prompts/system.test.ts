import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, GENERIC_PROFILE, setAssistantProfile } from './system';
import type { AssistantProfile } from './system';

const LMM_PROFILE: AssistantProfile = {
  courseIntro:
    'Eres el asistente docente de un curso de modelos lineales mixtos con R: efectos fijos y aleatorios, estructuras de covarianza, lme4.',
  conventions: [
    'El código R debe correr en el navegador; lme4 no está disponible, usa base R para ilustrar.',
    'Orden de reporte: estimador -> IC -> valor p con procedimiento declarado.',
  ],
};

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

  it('falls back to the generic profile when none is injected', () => {
    const prompt = buildSystemPrompt(input);
    expect(prompt).toContain(GENERIC_PROFILE.courseIntro);
    expect(prompt).toContain(GENERIC_PROFILE.conventions[0]);
  });

  it('accepts a per-call profile and a registered profile', () => {
    const byInput = buildSystemPrompt({ ...input, profile: LMM_PROFILE });
    expect(byInput).toContain(LMM_PROFILE.courseIntro);
    expect(byInput).toContain('lme4 no está disponible');

    setAssistantProfile(LMM_PROFILE);
    const byRegistration = buildSystemPrompt(input);
    expect(byRegistration).toContain(LMM_PROFILE.courseIntro);
    setAssistantProfile(GENERIC_PROFILE); // restore for other tests
  });

  it('matches the fixture snapshot', () => {
    expect(buildSystemPrompt({ ...input, profile: LMM_PROFILE })).toMatchSnapshot();
  });
});
