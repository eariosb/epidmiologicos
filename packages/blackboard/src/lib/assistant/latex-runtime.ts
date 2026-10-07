type LatexValidator = (latex: string) => boolean;

let validator: LatexValidator | null = null;

/**
 * App-injected LaTeX syntax checker (KaTeX lives in the app bundle; the
 * package stays dependency-free). Falls back to "accept" when unset.
 */
export function setLatexValidator(fn: LatexValidator | null): void {
  validator = fn;
}

export function getLatexValidator(): LatexValidator | undefined {
  return validator ?? undefined;
}
