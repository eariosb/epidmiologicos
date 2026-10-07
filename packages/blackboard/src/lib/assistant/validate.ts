/**
 * Post-generation sanitizer: enforces that every citation in an assistant
 * response belongs to the corpus injected for that turn, that DOI/ISBN look
 * structurally valid, and that display-math blocks parse under KaTeX.
 * KaTeX itself is injected so the package stays dependency-free.
 */

export interface ValidateOptions {
  /** Citation ids injected into this turn's system prompt. */
  allowedCitationIds: ReadonlySet<string>;
  /** Optional LaTeX syntax check (e.g. katex.renderToString try/catch). */
  validateLatex?: (latex: string) => boolean;
}

export interface ValidateResult {
  content: string;
  /** Citation ids actually used and verified. */
  citations: string[];
}

const CITATION_RE = /\[([^\]\n]{1,60})\]/g;
const DOI_RE = /\b10\.\d{4,9}\/\S+/g;
const ISBN_RE = /\b97[89][-\d ]{10,17}\b/g;
const DISPLAY_MATH_RE = /\$\$([\s\S]+?)\$\$/g;

export function isValidDoi(doi: string): boolean {
  return /^10\.\d{4,9}\/[^\s"<>]+$/.test(doi);
}

/** ISBN-13 check digit (EAN-13). */
export function isValidIsbn(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10 === Number(digits[12]);
}

export function validateAndSanitize(content: string, opts: ValidateOptions): ValidateResult {
  const { allowedCitationIds, validateLatex } = opts;
  const used = new Set<string>();
  let out = content;

  out = out.replace(CITATION_RE, (full, inner: string) => {
    const id = inner.trim();
    if (allowedCitationIds.has(id)) {
      used.add(id);
      return full;
    }
    return '[referencia no verificada]';
  });

  out = out.replace(DOI_RE, (doi) => (isValidDoi(doi) ? doi : '[DOI no verificado]'));
  out = out.replace(ISBN_RE, (isbn) => (isValidIsbn(isbn) ? isbn : '[ISBN no verificado]'));

  if (validateLatex) {
    out = out.replace(DISPLAY_MATH_RE, (full, latex: string) =>
      validateLatex(latex) ? full : String.raw`$$\text{[fórmula con error de sintaxis]}$$`,
    );
  }

  return { content: out, citations: [...used] };
}
