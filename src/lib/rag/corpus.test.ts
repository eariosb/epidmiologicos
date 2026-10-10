import { describe, expect, it } from 'vitest';
import { buildCorpus, stripMdx } from './corpus';
import { BIBLIOGRAPHY } from './bibliography';
import { Bm25Index } from '@cursos/blackboard/rag';

const docs = buildCorpus();

describe('rag corpus', () => {
  it('has unique ids and the expected sources', () => {
    const ids = docs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(docs.filter((d) => d.source === 'module').length).toBeGreaterThan(100);
    expect(docs.filter((d) => d.source === 'quiz').length).toBeGreaterThan(15);
    expect(docs.filter((d) => d.source === 'bibliography').length).toBe(BIBLIOGRAPHY.length);
  });

  it('leaks no executable code into BM25 text', () => {
    // Mencionar `survfit` o `fisher.test` en prosa es contenido de
    // recuperación legítimo; lo que no debe llegar al índice es código:
    // asignaciones, literales de plantilla, fences y etiquetas JSX.
    const leaks = docs.filter((d) =>
      /<-|\{`|```|<RCell|<LabExercise|<Quiz|matrix\(c\(|cat\(sprintf\(/.test(d.text),
    );
    expect(leaks.map((d) => d.id)).toEqual([]);
  });

  it('indexes quiz docs with question, options and explanation', () => {
    const quiz = docs.filter((d) => d.source === 'quiz');
    expect(quiz.every((d) => d.text.startsWith('Pregunta de autoevaluación:'))).toBe(true);
    const m1 = quiz.find((d) => d.id === 'quiz:01-epidemiologia-cuantitativa:1');
    expect(m1?.text).toContain('Tuskegee');
    expect(m1?.text).toContain('Respuesta correcta:');
  });

  it('stripMdx keeps prose but drops code and JSX', () => {
    const out = stripMdx(
      'Texto con `inline` y ```r\ncat(x)\n``` más <RCell code={`a <- 1`} /> y <Quiz question="q" />.',
    );
    expect(out).toContain('Texto con');
    expect(out).not.toMatch(/cat\(|a <-|<RCell|<Quiz/);
  });

  // Las diez preguntas de referencia del plan: cada una debe recuperar,
  // en el top-5 de BM25, un documento del módulo/quiz/bibliografía esperado.
  const REFERENCE: Array<{ q: string; expect: string[] }> = [
    {
      q: 'razón de tasas John Snow cólera Lambeth Southwark',
      expect: ['bib:snow-1855', 'mod:01-epidemiologia-cuantitativa'],
    },
    {
      q: 'diferencia entre odds ratio y riesgo relativo enfermedad rara',
      expect: ['bib:molinero-or-rr', 'mod:04-rr-or-rd', 'mod:03-medicion-incidencia-prevalencia'],
    },
    {
      q: 'corrección de Yates chi-cuadrado tabla 2x2',
      expect: ['mod:04-rr-or-rd', 'mod:05-nnt', 'mod:06-', 'quiz:04-rr-or-rd'],
    },
    {
      q: 'test de Boschloo más potente que Fisher',
      expect: ['bib:boschloo-1970', 'mod:06-', 'quiz:06-'],
    },
    {
      q: 'sesgo de Berkson selección hospitalaria',
      expect: ['mod:14-', 'quiz:14-', 'bib:sackett-1979-sesgos'],
    },
    {
      q: 'curva de Kaplan-Meier VALUNG log-rank',
      expect: ['mod:12-', 'bib:R-survival'],
    },
    {
      q: 'McNemar datos pareados equivalencia CMH',
      expect: ['mod:15-', 'quiz:15-'],
    },
    {
      q: 'SMR razón de mortalidad estandarizada persona-tiempo',
      expect: ['mod:13-', 'mod:09-'],
    },
    {
      q: 'NNT número necesario a tratar lidocaína',
      expect: ['mod:05-', 'bib:hine-1989-lidocaina'],
    },
    {
      q: 'meta-análisis predicción conforme incertidumbre',
      expect: ['mod:17-', 'bib:izbicki-uq'],
    },
  ];

  it.each(REFERENCE)('recovers a relevant doc for "$q"', ({ q, expect: prefixes }) => {
    const idx = new Bm25Index();
    idx.add(docs);
    const hits = idx.search(q, 5).map((h) => h.id);
    const ok = hits.some((id) => prefixes.some((p) => id.startsWith(p)));
    expect(ok, `ningún hit esperado en top-5: ${hits.join(', ')}`).toBe(true);
  });
});
