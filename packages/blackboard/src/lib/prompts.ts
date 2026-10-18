import type { AssistantMode } from '../types/blackboard';

export function buildUserPrompt(
  mode: AssistantMode,
  text: string,
  imageDataUrl?: string | null,
): string {
  const base = text.trim();
  // Only claim an image exists when one was actually attached AND the
  // provider can see it — the caller strips it for text-only models.
  const imageNote = imageDataUrl
    ? '\n\n[Tienes disponible una captura del lienzo como imagen adjunta.]'
    : '';

  switch (mode) {
    case 'ask':
      return imageDataUrl
        ? `${base || 'Explica lo que aparece en la imagen.'}${imageNote}`
        : base || '¿Qué puedes decirme sobre este tema?';
    case 'explain-selection':
      return `Explica el contenido seleccionado o visible en el lienzo${base ? `: ${base}` : '.'}${imageNote}`;
    case 'generate-r':
      return `Genera el código R equivalente a la fórmula o procedimiento descrito${base ? `: ${base}` : ''}.${imageNote}`;
    case 'plot-r':
      return `Genera código R con curve() o ggplot2 para graficar la función o modelo indicado${base ? `: ${base}` : ''}.${imageNote}`;
    default:
      return base;
  }
}
