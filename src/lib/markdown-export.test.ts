import { describe, expect, it } from 'vitest';
import { buildSessionMarkdown } from './markdown-export';
import type { Session, Capture } from './session-store';

const session: Session = {
  version: 2,
  id: 's1',
  title: 'Clase 5 — LMM',
  courseId: 'mlm',
  moduleSlug: 'lmm',
  startedAt: 1700000000000,
  endedAt: 1700003600000,
  status: 'ended',
  updatedAt: 1700003600000,
  visitedSections: [{ slug: 'lmm-intro', title: 'Introducción', timestamp: 1700000100000 }],
  captureIds: ['c1'],
  questions: [{ id: 'q1', text: '¿Por qué efectos aleatorios?', timestamp: 1700000200000, resolved: true }],
};

const captures: Capture[] = [
  {
    version: 2,
    id: 'c1',
    name: 'Modelo lmer',
    dataUrl: 'data:image/png;base64,x',
    thumbnail: 'data:image/png;base64,t',
    type: 'code',
    tags: ['lme4'],
    code: 'lmer(y ~ x + (1|id), data = d)',
    outputText: 'REML criterion: 1743.6',
    timestamp: 1700000300000,
  },
];

const chat = {
  messages: [
    { role: 'user', content: '¿Qué es ICC?' },
    { role: 'assistant', content: 'El coeficiente de correlación intraclase…', citations: ['bib:verbeke-2000'] },
  ],
};

describe('buildSessionMarkdown', () => {
  const md = buildSessionMarkdown(session, captures, chat);

  it('includes header, sections, captures, questions and chat', () => {
    expect(md).toContain('# Clase 5 — LMM');
    expect(md).toContain('## Secciones navegadas');
    expect(md).toContain('lmm-intro');
    expect(md).toContain('## Capturas');
    expect(md).toContain('**Modelo lmer**');
    expect(md).toContain('```r');
    expect(md).toContain('REML criterion');
    expect(md).toContain('- [x] ¿Por qué efectos aleatorios?');
    expect(md).toContain('## Interacciones con el asistente');
    expect(md).toContain('_Citas verificadas: bib:verbeke-2000_');
  });

  it('handles an empty session', () => {
    const empty = buildSessionMarkdown(null, [], null);
    expect(empty).toContain('# Sesión de clase');
    expect(empty).not.toContain('## Capturas');
  });
});
