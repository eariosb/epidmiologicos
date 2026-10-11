'use client';

import { useMemo, useState } from 'react';
import katex from 'katex';
import { latexToDataUrl } from '@/lib/latex-image';
import { MatrixBuilder } from './MatrixBuilder';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

export interface EditTarget {
  elementId: string;
  boardKind: 'math' | 'matrix';
  payload: Record<string, unknown>;
}

/**
 * Re-edit overlay for technical board elements (double-click on a raster
 * carrying customData.boardKind). Commit regenerates the PNG and swaps the
 * element's raster via canvasRef.replaceImage — position is preserved.
 */
export function ElementEditor({
  target,
  canvasRef,
  onClose,
}: {
  target: EditTarget;
  canvasRef: React.RefObject<BlackboardCanvasRef | null>;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-ink-900">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2 dark:border-ink-700">
          <span className="text-sm font-semibold text-ink-800 dark:text-ink-100">
            Editar {target.boardKind === 'matrix' ? 'matriz' : 'fórmula'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-500 hover:text-danger-600"
          >
            Cerrar
          </button>
        </div>
        <div className="p-4">
          {target.boardKind === 'matrix' ? (
            <MatrixBuilder
              canvasRef={canvasRef}
              initialValues={target.payload.values as number[][]}
              editElementId={target.elementId}
              onDone={onClose}
            />
          ) : (
            <MathEditor
              latex={(target.payload.latex as string) ?? ''}
              elementId={target.elementId}
              canvasRef={canvasRef}
              onDone={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MathEditor({
  latex: initialLatex,
  elementId,
  canvasRef,
  onDone,
}: {
  latex: string;
  elementId: string;
  canvasRef: React.RefObject<BlackboardCanvasRef | null>;
  onDone: () => void;
}) {
  const [latex, setLatex] = useState(initialLatex);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(
    () =>
      katex.renderToString(latex || '\\;\\;', {
        throwOnError: false,
        displayMode: true,
      }),
    [latex],
  );

  const handleSave = async () => {
    if (!canvasRef.current || !latex.trim()) return;
    setSaving(true);
    try {
      const dataUrl = await latexToDataUrl(latex);
      canvasRef.current.replaceImage(elementId, dataUrl, {
        boardKind: 'math',
        boardId: elementId,
        payload: { latex, display: true },
        rasterDpr: 2,
      });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <textarea
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        rows={4}
        className="w-full rounded border border-ink-200 p-2 font-mono text-xs dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
        placeholder="\beta_0 + b_{0i}"
        autoFocus
      />
      <div
        className="my-3 min-h-[3rem] rounded border border-ink-200 bg-white p-3 text-center dark:border-ink-700"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !latex.trim()}
        className="rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {saving ? 'Actualizando…' : 'Actualizar fórmula'}
      </button>
    </div>
  );
}
