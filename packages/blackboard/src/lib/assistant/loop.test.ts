import { describe, expect, it } from 'vitest';
import { runAssistantTurn } from './loop';
import type { LLMMessage, LLMProvider } from '../../types/blackboard';
import type { ToolDef } from './types';

const baseMessage: LLMMessage = {
  id: 'u1',
  role: 'user',
  content: 'inserta la formula del LMM',
  createdAt: new Date().toISOString(),
};

function makeProvider(
  responses: { content: string; toolCalls: { id: string; name: string; arguments: string }[] }[],
): LLMProvider {
  const queue = [...responses];
  return {
    id: 'none',
    async *chat() {
      yield '';
    },
    async chatOnce() {
      return queue.shift() ?? { content: '', toolCalls: [] };
    },
    async listModels() {
      return ['m'];
    },
    supportsVision: () => false,
    dispose() {},
  };
}

const tools: Record<string, ToolDef> = {
  insert_math: {
    name: 'insert_math',
    description: 'Insert a LaTeX formula',
    parameters: {},
    async run(input: unknown) {
      return { ok: true, latex: (input as { latex: string }).latex };
    },
  },
};

describe('runAssistantTurn', () => {
  it('executes a tool call then returns the final answer', async () => {
    const provider = makeProvider([
      {
        content: '',
        toolCalls: [{ id: 'c1', name: 'insert_math', arguments: '{"latex":"y=X\\\\beta"}' }],
      },
      { content: 'Listo, fórmula insertada.', toolCalls: [] },
    ]);
    const seen: string[] = [];
    const out = await runAssistantTurn([baseMessage], {
      provider,
      model: 'm',
      tools,
      onToolResult: (name) => seen.push(name),
    });
    expect(seen).toEqual(['insert_math']);
    expect(out.content).toContain('fórmula insertada');
  });

  it('feeds tool errors back instead of throwing', async () => {
    const provider = makeProvider([
      { content: '', toolCalls: [{ id: 'c1', name: 'nope', arguments: '{}' }] },
      { content: 'Falló la herramienta desconocida.', toolCalls: [] },
    ]);
    const out = await runAssistantTurn([baseMessage], { provider, model: 'm', tools });
    expect(out.content).toContain('Falló');
  });

  it('sanitizes the final content through the validator', async () => {
    const provider = makeProvider([{ content: 'Ver [inventada-2024].', toolCalls: [] }]);
    const out = await runAssistantTurn([baseMessage], {
      provider,
      model: 'm',
      validate: { allowedCitationIds: new Set() },
    });
    expect(out.content).toContain('[referencia no verificada]');
  });

  it('aborts after 5 tool turns', async () => {
    const provider = makeProvider(
      Array.from({ length: 6 }, (_, i) => ({
        content: '',
        toolCalls: [{ id: `c${i}`, name: 'insert_math', arguments: '{"latex":"x"}' }],
      })),
    );
    await expect(
      runAssistantTurn([baseMessage], { provider, model: 'm', tools }),
    ).rejects.toThrow('tool-loop exhausted');
  });
});
