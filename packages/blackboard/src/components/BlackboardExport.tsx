'use client';

import { useCallback, useState } from 'react';
import { useBlackboardContext } from '../lib/context';

interface BlackboardExportProps {
  onClose?: () => void;
  canvasRef?: { current: { getImage?: () => Promise<Blob | null> } | null };
}

export function BlackboardExport({ onClose, canvasRef }: BlackboardExportProps) {
  const { state } = useBlackboardContext();
  const [copied, setCopied] = useState<string | null>(null);

  const scene = state.activeSceneId ? state.scenes[state.activeSceneId] : null;

  const download = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportPng = async () => {
    const blob = await canvasRef?.current?.getImage?.();
    if (!blob) return;
    const slug = scene?.moduleSlug || 'scene';
    download(blob, `${slug}-${Date.now()}.png`);
    onClose?.();
  };

  const handleExportExcalidraw = async () => {
    if (!scene) return;
    const blob = new Blob([JSON.stringify(scene)], { type: 'application/json' });
    const slug = scene.moduleSlug || 'scene';
    download(blob, `${slug}.excalidraw`);
    onClose?.();
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const lastLatex = extractLastBlock(state.llmMessages, '$$', '$$');
  const lastR = extractLastCodeBlock(state.llmMessages, 'r');

  return (
    <div className="w-56 rounded border border-ink-200 bg-white p-2 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-ink-800">Exportar</p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleExportPng}
          className="w-full rounded px-2 py-1 text-left text-xs text-ink-700 hover:bg-ink-100"
        >
          Descargar PNG
        </button>
        <button
          type="button"
          onClick={handleExportExcalidraw}
          disabled={!scene}
          className="w-full rounded px-2 py-1 text-left text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
        >
          Descargar .excalidraw
        </button>
        <button
          type="button"
          onClick={() => lastLatex && handleCopy(lastLatex, 'latex')}
          disabled={!lastLatex}
          className="w-full rounded px-2 py-1 text-left text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
        >
          {copied === 'latex' ? '¡Copiado!' : 'Copiar LaTeX'}
        </button>
        <button
          type="button"
          onClick={() => lastR && handleCopy(lastR, 'r')}
          disabled={!lastR}
          className="w-full rounded px-2 py-1 text-left text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
        >
          {copied === 'r' ? '¡Copiado!' : 'Copiar código R'}
        </button>
      </div>
    </div>
  );
}

function extractLastCodeBlock(messages: { role: string; content: string }[], lang: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i].content;
    const re = new RegExp('```' + lang + '\\s*\\n?([\\s\\S]*?)```');
    const m = content.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function extractLastBlock(messages: { role: string; content: string }[], start: string, end: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i].content;
    const idx = content.lastIndexOf(start);
    if (idx === -1) continue;
    const after = content.slice(idx + start.length);
    const endIdx = after.indexOf(end);
    if (endIdx === -1) continue;
    return after.slice(0, endIdx).trim();
  }
  return null;
}
