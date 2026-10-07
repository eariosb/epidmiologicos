import type { RagFragment } from '../rag/types';
import type { ToolDef } from './types';
import { getBoardOps } from './board-ops';

const JSON_SCHEMA_STRING = (description: string) => ({ type: 'string', description });

function matrixLatex(values: number[][]): string {
  const rows = values
    .map((row) => row.map((v) => (Number.isInteger(v) ? String(v) : String(v))).join(' & '))
    .join(' \\\\ ');
  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
}

function noOps<T>(name: string): Promise<T> {
  return Promise.reject(new Error(`tool "${name}" requires board integration (no BoardToolOps injected)`));
}

/**
 * The four assistant tools bound to the board via injected BoardToolOps.
 * `fragments` is the RAG corpus injected for the current turn — cite() can
 * only resolve ids present there.
 */
export function createAssistantTools(fragments: RagFragment[]): Record<string, ToolDef> {
  const byId = new Map(fragments.map((f) => [f.id, f]));
  const ops = () => getBoardOps();

  return {
    insert_math: {
      name: 'insert_math',
      description: 'Insert a LaTeX formula into the blackboard as a raster element.',
      parameters: {
        type: 'object',
        properties: {
          latex: JSON_SCHEMA_STRING('LaTeX source, without surrounding $ or $$'),
        },
        required: ['latex'],
      },
      async run(input: unknown): Promise<unknown> {
        const { latex } = input as { latex: string };
        const board = ops();
        if (!board) return noOps('insert_math');
        const dataUrl = await board.renderLatex(latex);
        board.insertImage(dataUrl, {
          boardKind: 'math',
          boardId: '',
          payload: { latex, display: true, label: 'assistant' },
          rasterDpr: 2,
        });
        return { ok: true, inserted: 'math', latex };
      },
    },

    insert_matrix: {
      name: 'insert_matrix',
      description: 'Insert a numeric matrix into the blackboard (rendered as bmatrix).',
      parameters: {
        type: 'object',
        properties: {
          values: {
            type: 'array',
            description: 'Row-major matrix values, e.g. [[1,0.3],[0.3,1]]',
            items: { type: 'array', items: { type: 'number' } },
          },
        },
        required: ['values'],
      },
      async run(input: unknown): Promise<unknown> {
        const { values } = input as { values: number[][] };
        if (!Array.isArray(values) || values.length === 0 || !Array.isArray(values[0])) {
          return { error: 'values must be a non-empty 2D array' };
        }
        const board = ops();
        if (!board) return noOps('insert_matrix');
        const latex = matrixLatex(values);
        const dataUrl = await board.renderLatex(latex);
        board.insertImage(dataUrl, {
          boardKind: 'matrix',
          boardId: '',
          payload: { rows: values.length, cols: values[0].length, values },
          rasterDpr: 2,
        });
        return { ok: true, inserted: 'matrix', rows: values.length, cols: values[0].length };
      },
    },

    run_r: {
      name: 'run_r',
      description:
        'Execute R code in the browser (WebR) and return captured stdout/plots. ' +
        'Use for numeric checks or quick demonstrations the teacher asks to run live.',
      parameters: {
        type: 'object',
        properties: {
          source: JSON_SCHEMA_STRING('R source code to execute'),
        },
        required: ['source'],
      },
      async run(input: unknown): Promise<unknown> {
        const { source } = input as { source: string };
        const board = ops();
        if (!board?.runR) {
          return { error: 'run_r not available: WebR is not wired into the board' };
        }
        const result = await board.runR(source);
        return {
          output: result.text,
          ...(result.error ? { error: result.error } : {}),
          plots: result.plots?.length ?? 0,
        };
      },
    },

    cite: {
      name: 'cite',
      description:
        'Fetch the full text/metadata of a corpus source by id, to ground a citation. ' +
        'Only ids listed in the injected corpus are valid.',
      parameters: {
        type: 'object',
        properties: {
          id: JSON_SCHEMA_STRING('Corpus document id, e.g. bib:pinheiro-bates-2000'),
        },
        required: ['id'],
      },
      async run(input: unknown): Promise<unknown> {
        const { id } = input as { id: string };
        const frag = byId.get(id);
        if (!frag) {
          return { error: `citation id "${id}" is not in this turn's corpus — do not cite it` };
        }
        return { id: frag.id, source: frag.source, text: frag.text, meta: frag.meta };
      },
    },
  };
}
