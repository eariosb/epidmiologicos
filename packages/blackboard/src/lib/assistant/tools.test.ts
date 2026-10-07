import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createAssistantTools } from './tools';
import { setBoardOps } from './board-ops';
import type { RagFragment } from '../rag/types';

const fragments: RagFragment[] = [
  {
    id: 'bib:pinheiro-bates-2000',
    source: 'bibliography',
    text: 'Mixed-Effects Models in S and S-PLUS.',
    meta: { year: 2000 },
    score: 1,
  },
];

describe('createAssistantTools', () => {
  const inserted: { dataUrl: string; meta: Record<string, unknown> }[] = [];

  beforeEach(() => {
    inserted.length = 0;
    setBoardOps({
      renderLatex: (latex) => Promise.resolve(`data:image/png;base64,${latex}`),
      insertImage: (dataUrl, meta) => {
        inserted.push({ dataUrl, meta });
      },
      runR: (code) =>
        Promise.resolve({ text: `[1] ran: ${code}`, plots: [] }),
    });
  });

  afterEach(() => setBoardOps(null));

  const tools = () => createAssistantTools(fragments);

  it('insert_math renders latex and inserts with boardKind math', async () => {
    const out = (await tools().insert_math.run({ latex: 'y = X\\beta' })) as { ok: boolean };
    expect(out.ok).toBe(true);
    expect(inserted[0].meta.boardKind).toBe('math');
    expect((inserted[0].meta.payload as { latex: string }).latex).toBe('y = X\\beta');
  });

  it('insert_matrix renders a bmatrix and inserts with boardKind matrix', async () => {
    const out = (await tools().insert_matrix.run({
      values: [
        [1, 0.3],
        [0.3, 1],
      ],
    })) as { ok: boolean; rows: number };
    expect(out.ok).toBe(true);
    expect(out.rows).toBe(2);
    expect(inserted[0].meta.boardKind).toBe('matrix');
    expect((inserted[0].meta.payload as { values: number[][] }).values[1][0]).toBe(0.3);
  });

  it('insert_matrix rejects malformed input', async () => {
    const out = (await tools().insert_matrix.run({ values: [] })) as { error?: string };
    expect(out.error).toBeTruthy();
    expect(inserted).toHaveLength(0);
  });

  it('run_r delegates to the injected WebR runner', async () => {
    const out = (await tools().run_r.run({ source: '1+1' })) as { output: string };
    expect(out.output).toContain('[1] ran: 1+1');
  });

  it('cite resolves a corpus id to its fragment', async () => {
    const out = (await tools().cite.run({ id: 'bib:pinheiro-bates-2000' })) as {
      id: string;
      text: string;
    };
    expect(out.id).toBe('bib:pinheiro-bates-2000');
    expect(out.text).toContain('S-PLUS');
  });

  it('cite rejects an id outside the injected corpus', async () => {
    const out = (await tools().cite.run({ id: 'bib:inventado' })) as { error?: string };
    expect(out.error).toContain('not in this turn');
  });
});
