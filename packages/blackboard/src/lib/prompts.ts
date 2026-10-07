import type { AssistantMode } from '../types/blackboard';

export function buildUserPrompt(
  mode: AssistantMode,
  text: string,
  imageDataUrl?: string | null,
): string {
  const base = text.trim();
  const hasImage = Boolean(imageDataUrl);

  switch (mode) {
    case 'ask':
      return hasImage
        ? `${base || 'Explica lo que aparece en la imagen.'}\n\n[Tienes disponible una captura del lienzo como imagen.]`
        : base || '¿Qué puedes decirme sobre este tema?';
    case 'explain-selection':
      return `Explica la selección del lienzo${base ? `: ${base}` : '.'}\n\n[Tienes disponible una captura de la selección como imagen.]`;
    case 'generate-r':
      return `Genera el código R equivalente a la fórmula o procedimiento descrito${base ? `: ${base}` : ''}.\n\n[Tienes disponible una captura del lienzo como imagen.]`;
    case 'plot-r':
      return `Genera código R con curve() o ggplot2 para graficar la función o modelo indicado${base ? `: ${base}` : ''}.\n\n[Tienes disponible una captura del lienzo como imagen.]`;
    default:
      return base;
  }
}
