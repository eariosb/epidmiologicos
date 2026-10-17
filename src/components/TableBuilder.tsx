'use client';

import { useState, useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import { nodeToDataUrl } from '@/lib/latex-image';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

interface TableBuilderProps {
  canvasRef?: React.RefObject<BlackboardCanvasRef | null>;
}

/** Rasterize the draft as a styled HTML table: a light card with ink
 *  borders so the insert stays readable on the dark canvas theme. */
function buildTableNode(cells: string[][], headerRow: boolean): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-9999px';
  wrap.style.top = '0';
  wrap.style.padding = '14px 18px';
  wrap.style.background = '#ffffff';
  wrap.style.border = '1px solid #e5e7eb';
  wrap.style.borderRadius = '8px';
  wrap.style.display = 'inline-block';

  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.fontFamily = 'ui-sans-serif, system-ui, sans-serif';
  table.style.fontSize = '15px';
  table.style.color = '#1f2937';

  cells.forEach((row, i) => {
    const tr = document.createElement('tr');
    row.forEach((text) => {
      const cell = document.createElement(headerRow && i === 0 ? 'th' : 'td');
      cell.textContent = text;
      cell.style.border = '1px solid #9ca3af';
      cell.style.padding = '6px 14px';
      cell.style.textAlign = 'center';
      if (headerRow && i === 0) {
        cell.style.background = '#f8f4f2';
        cell.style.fontWeight = '600';
        cell.style.color = '#8B0000';
      }
      tr.appendChild(cell);
    });
    table.appendChild(tr);
  });
  wrap.appendChild(table);
  return wrap;
}

export function TableBuilder({ canvasRef }: TableBuilderProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [cells, setCells] = useState<string[][]>(() =>
    Array.from({ length: 3 }, (_, i) =>
      Array.from({ length: 3 }, (_, j) => (i === 0 ? `Col ${j + 1}` : '')),
    ),
  );
  const [inserting, setInserting] = useState(false);
  const [insertError, setInsertError] = useState<string | null>(null);

  const resize = (nextRows: number, nextCols: number) => {
    const r = Math.min(8, Math.max(1, nextRows));
    const c = Math.min(8, Math.max(1, nextCols));
    setRows(r);
    setCols(c);
    setCells((prev) =>
      Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (_, j) => prev[i]?.[j] ?? ''),
      ),
    );
  };

  const updateCell = (i: number, j: number, value: string) => {
    setCells((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[i][j] = value;
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
      const dataUrl = await nodeToDataUrl(buildTableNode(cells, headerRow));
      canvasRef.current.insertImage(dataUrl, {
        meta: {
          boardKind: 'table',
          payload: { rows, cols, headerRow, cells },
        },
      });
    } catch (err) {
      console.error('[table] insert failed', err);
      setInsertError(
        `No se pudo insertar la tabla: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setInserting(false);
    }
  }, [canvasRef, cells, headerRow, rows, cols]);

  const stepBtn =
    'inline-flex h-6 w-6 items-center justify-center rounded border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
        <p className="text-sm font-semibold text-ink-800">Editor de tablas</p>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-600">
              Filas
              <button type="button" aria-label="Menos filas" className={stepBtn}
                disabled={rows <= 1} onClick={() => resize(rows - 1, cols)}>
                <Minus aria-hidden className="h-3 w-3" />
              </button>
              <span className="w-4 text-center font-mono text-xs text-ink-700">{rows}</span>
              <button type="button" aria-label="Más filas" className={stepBtn}
                disabled={rows >= 8} onClick={() => resize(rows + 1, cols)}>
                <Plus aria-hidden className="h-3 w-3" />
              </button>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-600">
              Columnas
              <button type="button" aria-label="Menos columnas" className={stepBtn}
                disabled={cols <= 1} onClick={() => resize(rows, cols - 1)}>
                <Minus aria-hidden className="h-3 w-3" />
              </button>
              <span className="w-4 text-center font-mono text-xs text-ink-700">{cols}</span>
              <button type="button" aria-label="Más columnas" className={stepBtn}
                disabled={cols >= 8} onClick={() => resize(rows, cols + 1)}>
                <Plus aria-hidden className="h-3 w-3" />
              </button>
            </span>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <input
                type="checkbox"
                checked={headerRow}
                onChange={(e) => setHeaderRow(e.target.checked)}
                className="accent-brand-500"
              />
              Fila de encabezado
            </label>
          </div>

          <div className="mb-2 inline-block rounded border border-ink-200 p-2">
            <table className="border-collapse">
              <tbody>
                {cells.map((row, i) => (
                  <tr key={i}>
                    {row.map((_, j) => (
                      <td key={j} className="p-0.5">
                        <input
                          type="text"
                          value={cells[i][j]}
                          onChange={(e) => updateCell(i, j, e.target.value)}
                          aria-label={`Celda ${i + 1},${j + 1}`}
                          className="w-20 rounded border border-ink-200 px-1 py-0.5 text-center text-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleInsert}
              disabled={inserting || !canvasRef?.current}
              className="inline-flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" />
              {inserting ? 'Insertando…' : 'Insertar en pizarra'}
            </button>
            {insertError && (
              <span className="text-xs text-danger-600">{insertError}</span>
            )}
          </div>
        </div>

        <div className="flex min-h-0 w-2/5 shrink-0 items-center justify-center overflow-auto border-l border-ink-200 bg-white p-3">
          <table aria-hidden className="border-collapse text-[11px] text-ink-800">
            <tbody>
              {cells.map((row, i) => (
                <tr key={i}>
                  {row.map((text, j) =>
                    headerRow && i === 0 ? (
                      <th
                        key={j}
                        className="border border-ink-400 bg-[#f8f4f2] px-2 py-1 font-semibold text-brand-700"
                      >
                        {text}
                      </th>
                    ) : (
                      <td key={j} className="border border-ink-400 px-2 py-1 text-center">
                        {text}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
