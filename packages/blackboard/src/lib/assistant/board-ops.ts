import type { BoardElementMeta } from '../../types/blackboard';

/**
 * Operations the assistant tools perform on the host app: rasterize LaTeX,
 * insert the result into the canvas, and run R code. Injected by the app
 * (KaTeX and WebR live in the app bundle, not the package).
 */
export interface BoardToolOps {
  /** latex → PNG data URL at ≥2× density. */
  renderLatex(latex: string): Promise<string>;
  /** Inserts a raster element carrying structured customData. */
  insertImage(dataUrl: string, meta: BoardElementMeta): void;
  /** Runs R code (WebR). Optional — the run_r tool reports unavailable if unset. */
  runR?(code: string): Promise<{ text: string; error?: string; plots?: string[] }>;
}

let ops: BoardToolOps | null = null;

export function setBoardOps(next: BoardToolOps | null): void {
  ops = next;
}

export function getBoardOps(): BoardToolOps | null {
  return ops;
}
