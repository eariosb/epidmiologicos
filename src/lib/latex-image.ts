import katex from 'katex';
import { toPng } from 'html-to-image';

export async function latexToDataUrl(
  latex: string,
  opts: { color?: string; scale?: number; background?: string } = {},
): Promise<string> {
  const { color = '#1f2937', scale = 2, background = 'transparent' } = opts;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.padding = '12px 16px';
  container.style.background = background;
  container.style.color = color;
  container.style.fontSize = '18px';
  container.style.display = 'inline-block';
  container.style.whiteSpace = 'nowrap';
  container.innerHTML = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: true,
  });
  document.body.appendChild(container);
  try {
    const dataUrl = await toPng(container, {
      pixelRatio: scale,
      cacheBust: true,
      backgroundColor: background === 'transparent' ? undefined : background,
    });
    return dataUrl;
  } finally {
    document.body.removeChild(container);
  }
}
