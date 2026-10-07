import { describe, expect, it } from 'vitest';
import { Bm25Index, tokenize } from './bm25';
import type { RagDoc } from './types';

const docs: RagDoc[] = [
  {
    id: 'mod:lmm:definicion',
    source: 'module',
    text: 'Modelo lineal mixto: combina efectos fijos beta con efectos aleatorios gaussianos para datos agrupados y longitudinales',
    meta: { moduleSlug: 'lmm', sectionAnchor: '#definicion' },
  },
  {
    id: 'mod:lmm:covarianza',
    source: 'module',
    text: 'Estructuras de covarianza CS AR1 UN para modelar la correlación residual entre mediciones repetidas',
    meta: { moduleSlug: 'lmm', sectionAnchor: '#covarianza' },
  },
  {
    id: 'mod:gee:intro',
    source: 'module',
    text: 'Ecuaciones de estimación generalizadas GEE modelos marginales población correlación de trabajo',
    meta: { moduleSlug: 'gee', sectionAnchor: '#intro' },
  },
  {
    id: 'bib:pinheiro-bates-2000',
    source: 'bibliography',
    text: 'Mixed-Effects Models in S and S-PLUS. Pinheiro Bates Springer 2000. nlme REML ML estructuras covarianza',
    meta: { authors: 'Pinheiro, Bates', year: 2000 },
  },
];

describe('tokenize', () => {
  it('lowercases, strips accents, removes stopwords and stems lightly', () => {
    const tokens = tokenize('Los Modelos mixtos y the estimación DE varianzas');
    expect(tokens).not.toContain('los');
    expect(tokens).not.toContain('y');
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('de');
    expect(tokens).toContain('modelo'); // modelos → light stem
    expect(tokens).toContain('mixto'); // mixtos → light stem
    expect(tokens).toContain('varianza'); // varianzas → light stem
    expect(tokens).toContain('estimacion'); // estimación → diacritics stripped
  });
});

describe('Bm25Index', () => {
  const index = new Bm25Index();
  index.add(docs);

  it('ranks the covariance doc first for a covariance query', () => {
    const hits = index.search('estructura covarianza correlación', 3);
    expect(hits[0].id).toBe('mod:lmm:covarianza');
  });

  it('ranks the GEE doc first for a marginal-models query', () => {
    const hits = index.search('modelos marginales gee', 3);
    expect(hits[0].id).toBe('mod:gee:intro');
  });

  it('returns bibliography docs for an nlme query', () => {
    const hits = index.search('nlme reml', 3);
    expect(hits.some((h) => h.id === 'bib:pinheiro-bates-2000')).toBe(true);
  });

  it('returns empty array for an unrelated query', () => {
    expect(index.search('pizza horno receta', 3)).toHaveLength(0);
  });

  it('respects topK', () => {
    expect(index.search('modelo', 1)).toHaveLength(1);
  });
});
