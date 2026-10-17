import katex from 'katex';
import { toPng } from 'html-to-image';

/**
 * Render an offscreen DOM node to a PNG data URL. Shared by the LaTeX
 * pipeline and the table builder.
 */
export async function nodeToDataUrl(node: HTMLElement, scale = 2): Promise<string> {
  document.body.appendChild(node);
  try {
    return await toPng(node, { pixelRatio: scale, cacheBust: true });
  } finally {
    document.body.removeChild(node);
  }
}

export async function latexToDataUrl(
  latex: string,
  opts: { color?: string; scale?: number; background?: string } = {},
): Promise<string> {
  const { color = '#1f2937', scale = 2, background = '#ffffff' } = opts;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.padding = '12px 16px';
  // A light "paper" card keeps the raster readable on the dark canvas:
  // dark glyphs on a transparent PNG vanish there.
  container.style.background = background;
  container.style.border = '1px solid #e5e7eb';
  container.style.borderRadius = '8px';
  container.style.color = color;
  container.style.fontSize = '18px';
  container.style.display = 'inline-block';
  container.style.whiteSpace = 'nowrap';
  container.innerHTML = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: true,
  });
  // toPng receives no backgroundColor so the rounded corners stay
  // transparent; the card face comes from the container itself.
  return nodeToDataUrl(container, scale);
}
