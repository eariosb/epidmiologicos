'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import katex from 'katex';
import clsx from 'clsx';
import { latexToDataUrl } from '@/lib/latex-image';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

type MatrixType = 'CS' | 'AR1' | 'UN' | 'TOEP' | 'ARH1' | 'custom';

interface MatrixBuilderProps {
  initialSize?: number;
  canvasRef?: React.RefObject<BlackboardCanvasRef | null>;
  /** Preload a matrix for re-editing an existing board element. */
  initialValues?: number[][];
  /** When set, commit replaces that element's raster instead of inserting. */
  editElementId?: string;
  onDone?: () => void;
}

const MATRIX_LABELS: Record<MatrixType, string> = {
  CS: 'Compound Symmetry',
  AR1: 'AR(1)',
  UN: 'Unstructured',
  TOEP: 'Toeplitz',
  ARH1: 'ARH(1) Heterogeneous',
  custom: 'Personalizada',
};

function buildMatrix(type: MatrixType, size: number, rho: number): number[][] {
  const m: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i === j) {
        m[i][j] = 1;
      } else if (type === 'CS') {
        m[i][j] = rho;
      } else if (type === 'AR1' || type === 'TOEP') {
        m[i][j] = Math.pow(rho, Math.abs(i - j));
      } else if (type === 'UN') {
        m[i][j] = rho * (1 - Math.abs(i - j) / size) + (Math.random() - 0.5) * 0.1;
      } else if (type === 'ARH1') {
        const sdI = 1 + i * 0.1;
        const sdJ = 1 + j * 0.1;
        m[i][j] = Math.pow(rho, Math.abs(i - j)) * sdI * sdJ;
      }
    }
  }
  return m;
}

/** Display helper: strings for editing come from numbers without NaN/undefined leaking. */
function formatCell(v: number): string {
  return Number.isFinite(v) ? String(v) : '0';
}

function matrixToLatex(values: number[][]): string {
  const rows = values
    .map((row) => row.map((v) => Number(v).toFixed(3).replace(/\.?0+$/, '')).join(' & '))
    .join(' \\\\ ');
  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
}

function matrixToR(values: number[][]): string {
  const rows = values.map((row) => `c(${row.map((v) => Number(v).toFixed(4)).join(', ')})`).join(', ');
  return `matrix(c(${rows}), nrow=${values.length}, byrow=TRUE)`;
}

export function MatrixBuilder({ initialSize = 4, canvasRef, initialValues, editElementId, onDone }: MatrixBuilderProps) {
  const [type, setType] = useState<MatrixType>('custom');
  const [size, setSize] = useState(initialValues?.length ?? initialSize);
  const [rho, setRho] = useState(0.5);
  // Cells are edited as RAW STRINGS so intermediate states "-", "0.", "1."
  // are not destroyed by immediate numeric coercion (which made decimals
  // impossible to type). Parsing happens only at generation time.
  const [drafts, setDrafts] = useState<string[][]>(() =>
    (initialValues ??
      Array.from({ length: initialSize }, () => Array(initialSize).fill(0))
    ).map((row) => row.map((v) => formatCell(v))),
  );
  const [inserting, setInserting] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  /** Numeric view for generate/preview/insert — NaN and "" cells become 0. */
  const customValues = useMemo(
    () =>
      drafts.map((row) =>
        row.map((v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        }),
      ),
    [drafts],
  );

  const generated = useMemo(() => {
    if (type === 'custom') return customValues;
    return buildMatrix(type, size, rho);
  }, [type, size, rho, customValues]);

  const latex = useMemo(() => matrixToLatex(generated), [generated]);
  const rCode = useMemo(() => matrixToR(generated), [generated]);

  const rendered = useMemo(
    () =>
      katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      }),
    [latex],
  );

  const updateSize = (next: number) => {
    setSize(next);
    setDrafts((prev) =>
      Array.from({ length: next }, (_, i) =>
        Array.from({ length: next }, (_, j) =>
          prev[i]?.[j] !== undefined ? prev[i][j] : i === j ? '1' : '0',
        ),
      ),
    );
  };

  const updateCell = (i: number, j: number, raw: string) => {
    setDrafts((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[i][j] = raw;
      return copy;
    });
    setInsertError(null);
  };

  const handleInsert = useCallback(async () => {
    if (!canvasRef?.current) {
      setInsertError('La pizarra no está disponible. Abre el panel e inténtalo de nuevo.');
      return;
    }
    setInserting(true);
    setInsertError(null);
    try {
      const dataUrl = await latexToDataUrl(latex);
      const rows = generated.length;
      const cols = generated[0]?.length ?? rows;
      if (editElementId) {
        canvasRef.current.replaceImage(editElementId, dataUrl, {
          boardKind: 'matrix',
          boardId: editElementId,
          payload: { rows, cols, values: generated },
          rasterDpr: 2,
        });
        onDone?.();
      } else {
        canvasRef.current.insertImage(dataUrl, {
          matrixState: {
            elementId: '',
            rows,
            cols,
            values: generated,
          },
          meta: {
            boardKind: 'matrix',
            payload: { rows, cols, values: generated },
          },
        });
      }
    } catch (err) {
      console.error('[matrix] insert failed', err);
      setInsertError(
        `No se pudo insertar la matriz: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setInserting(false);
    }
  }, [canvasRef, generated, latex, editElementId, onDone]);

  const handleCopyR = async () => {
    await navigator.clipboard.writeText(rCode);
  };

  const handleCopyLaTeX = async () => {
    await navigator.clipboard.writeText(latex);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
        <p className="text-sm font-semibold text-ink-800">Editor de matrices</p>
      </div>

      {/* Two-column layout so everything fits without scroll: controls and
          cells on the left, the KaTeX preview on the right. */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-ink-600">
              Estructura:
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MatrixType)}
                className="ml-2 rounded border border-ink-200 bg-white px-2 py-1 text-xs"
              >
                {Object.entries(MATRIX_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-ink-600">
              Dimensión:
              <input
                type="range"
                min={2}
                max={8}
                value={size}
                onChange={(e) => updateSize(Number(e.target.value))}
                className="ml-2 accent-brand-500"
              />
              <span className="ml-1 font-mono text-xs text-ink-700">{size}×{size}</span>
            </label>

            {type !== 'custom' && (
              <label className="text-xs font-medium text-ink-600">
                ρ:
                <input
                  type="range"
                  min={0}
                  max={0.99}
                  step={0.01}
                  value={rho}
                  onChange={(e) => setRho(Number(e.target.value))}
                  className="ml-2 accent-brand-500"
                />
                <span className="ml-1 font-mono text-xs text-ink-700">{rho.toFixed(2)}</span>
              </label>
            )}
          </div>

          {type === 'custom' && (
            <div className="mb-2 inline-block rounded border border-ink-200 p-2">
              <table className="border-collapse">
                <tbody>
                  {drafts.map((row, i) => (
                    <tr key={i}>
                      {row.map((_, j) => (
                        <td key={j} className="p-0.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={drafts[i][j]}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => updateCell(i, j, e.target.value)}
                            aria-label={`Celda ${i + 1},${j + 1}`}
                            className="w-16 rounded border border-ink-200 px-1 py-0.5 text-center text-xs font-mono"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInsert}
              disabled={inserting || !canvasRef?.current}
              className="inline-flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {inserting ? 'Guardando…' : editElementId ? 'Actualizar matriz' : (
                <>
                  <Plus aria-hidden className="h-3.5 w-3.5" />
                  Insertar en pizarra
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCopyLaTeX}
              className="rounded border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Copiar LaTeX
            </button>
            <button
              type="button"
              onClick={handleCopyR}
              className="rounded border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Copiar R
            </button>
            {insertError && (
              <span className="text-xs text-danger-600">{insertError}</span>
            )}
          </div>
        </div>

        {/* Live preview, right side of the same view */}
        <div className="flex min-h-0 w-2/5 shrink-0 items-center justify-center overflow-auto border-l border-ink-200 bg-white p-3">
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>
      </div>
    </div>
  );
}
