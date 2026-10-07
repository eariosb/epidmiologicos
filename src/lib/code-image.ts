import { toPng } from 'html-to-image';

export async function codeToDataUrl(code: string, language = 'R'): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.padding = '12px 16px';
  container.style.background = '#ffffff';
  container.style.borderRadius = '6px';
  container.style.border = '1px solid #e5e7eb';
  container.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.5';
  container.style.color = '#1f2937';
  container.style.whiteSpace = 'pre';
  container.style.maxWidth = '640px';

  const label = document.createElement('div');
  label.textContent = language;
  label.style.fontSize = '10px';
  label.style.fontWeight = '600';
  label.style.textTransform = 'uppercase';
  label.style.color = '#6b7280';
  label.style.marginBottom = '6px';

  const pre = document.createElement('pre');
  pre.style.margin = '0';
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.wordBreak = 'break-word';
  pre.textContent = code;

  container.appendChild(label);
  container.appendChild(pre);
  document.body.appendChild(container);

  try {
    return await toPng(container, { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' });
  } finally {
    container.remove();
  }
}
