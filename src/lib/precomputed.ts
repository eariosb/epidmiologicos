import manifest from '@/content/precomputed.json';

/** Salida de una celda R calculada con R de escritorio (scripts/precompute_r.py). */
export interface PrecomputedOutput {
  hash: string;
  console: string;
  plots: string[];
}

const PRE = manifest as Record<string, PrecomputedOutput>;

/** FNV-1a de 32 bits sobre el texto en UTF-8; idéntico al de precompute_r.py. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Devuelve la salida precalculada solo si corresponde exactamente al código
 * actual de la celda: si el código del módulo cambió y nadie volvió a correr
 * el precálculo, no se muestra una salida que ya no es la suya.
 */
export function precomputedFor(id: string | undefined, code: string): PrecomputedOutput | null {
  if (!id) return null;
  const entry = PRE[id];
  if (!entry) return null;
  const ok = entry.hash === fnv1a(code) || entry.hash === fnv1a(code.replace(/^\n/, ''));
  return ok ? entry : null;
}
