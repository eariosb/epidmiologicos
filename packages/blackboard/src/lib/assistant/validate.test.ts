import { describe, expect, it } from 'vitest';
import { isValidDoi, isValidIsbn, validateAndSanitize } from './validate';

const allowed = new Set(['mod:lmm:intro', 'bib:pinheiro-2000']);

describe('validateAndSanitize — citations', () => {
  it('keeps corpus citations and collects them', () => {
    const out = validateAndSanitize('Ver [mod:lmm:intro] y [bib:pinheiro-2000].', {
      allowedCitationIds: allowed,
    });
    expect(out.content).toContain('[mod:lmm:intro]');
    expect(out.citations.sort()).toEqual(['bib:pinheiro-2000', 'mod:lmm:intro']);
  });

  it('replaces an invented citation with a warning marker', () => {
    const out = validateAndSanitize('Según [Smith-2024-mdlmm], el modelo…', {
      allowedCitationIds: allowed,
    });
    expect(out.content).toContain('[referencia no verificada]');
    expect(out.citations).toHaveLength(0);
  });
});

describe('DOI / ISBN', () => {
  it('accepts a well-formed DOI', () => {
    expect(isValidDoi('10.18637/jss.v067.i01')).toBe(true);
  });

  it('marks a malformed DOI', () => {
    // Detected as DOI-shaped (10.xxxx/…) but rejected by strict validation.
    const out = validateAndSanitize('ver doi:10.1234/x<y en el texto', {
      allowedCitationIds: allowed,
    });
    expect(out.content).toContain('[DOI no verificado]');
  });

  it('validates ISBN-13 check digit', () => {
    expect(isValidIsbn('978-0-13-468599-1')).toBe(true);
    expect(isValidIsbn('978-0-13-468599-9')).toBe(false);
  });
});

describe('KaTeX validation', () => {
  const goodLatex = () => true;
  const badIfContainsBad = (s: string) => !s.includes('\\badcmd');

  it('leaves valid display math untouched', () => {
    const out = validateAndSanitize('$$y = \\beta_0 + \\varepsilon$$', {
      allowedCitationIds: allowed,
      validateLatex: goodLatex,
    });
    expect(out.content).toContain('y = \\beta_0');
  });

  it('replaces broken display math with a placeholder', () => {
    const out = validateAndSanitize('$$\\badcmd{x}$$', {
      allowedCitationIds: allowed,
      validateLatex: badIfContainsBad,
    });
    expect(out.content).toContain('[fórmula con error de sintaxis]');
  });
});
