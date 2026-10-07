import type { LLMMessage, LLMProvider } from '../../types/blackboard';
import type { ToolDef, ToolSpec } from './types';
import { validateAndSanitize, type ValidateOptions } from './validate';

const MAX_TOOL_TURNS = 5;

function toolResultMessage(call: { id: string }, result: unknown): LLMMessage {
  return {
    id: `tool-${call.id}`,
    role: 'tool',
    toolCallId: call.id,
    content: JSON.stringify(result),
    createdAt: new Date().toISOString(),
  };
}

async function executeToolCalls(
  calls: { id: string; name: string; arguments: string }[],
  tools: Record<string, ToolDef>,
  onToolResult?: (name: string, result: unknown) => void,
): Promise<LLMMessage[]> {
  return Promise.all(
    calls.map(async (call) => {
      const tool = tools[call.name];
      let result: unknown;
      try {
        if (!tool) throw new Error(`unknown tool: ${call.name}`);
        result = await tool.run(JSON.parse(call.arguments));
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
      }
      onToolResult?.(call.name, result);
      return toolResultMessage(call, result);
    }),
  );
}

function toSpec(tools: Record<string, ToolDef>): ToolSpec[] {
  return Object.values(tools).map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

async function fallbackChatOnce(
  provider: LLMProvider,
  messages: LLMMessage[],
  options: { model: string },
): Promise<{ content: string; toolCalls: [] }> {
  let content = '';
  for await (const chunk of provider.chat(messages, { model: options.model })) {
    content += chunk;
  }
  return { content, toolCalls: [] };
}

export interface AssistantTurnOptions {
  provider: LLMProvider;
  model: string;
  tools?: Record<string, ToolDef>;
  validate?: ValidateOptions;
  signal?: AbortSignal;
  /** Executed tool calls/results, appended for audit. */
  onToolResult?: (name: string, result: unknown) => void;
}

/**
 * One assistant turn with tool use: asks the provider, executes any tool
 * calls, feeds results back, repeats until a plain answer or 5 iterations.
 * The final text is sanitized (citations, DOI/ISBN, LaTeX) before returning.
 */
export async function runAssistantTurn(
  messages: LLMMessage[],
  opts: AssistantTurnOptions,
): Promise<{ content: string; citations: string[] }> {
  const tools = opts.tools ?? {};
  const specs = toSpec(tools);
  const msgs = [...messages];

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const res = opts.provider.chatOnce
      ? await opts.provider.chatOnce(msgs, {
          model: opts.model,
          tools: specs,
          signal: opts.signal,
        })
      : await fallbackChatOnce(opts.provider, msgs, { model: opts.model });

    if (res.toolCalls.length === 0) {
      const validated = opts.validate
        ? validateAndSanitize(res.content, opts.validate)
        : { content: res.content, citations: [] };
      return validated;
    }

    const toolMsgs = await executeToolCalls(res.toolCalls, tools, opts.onToolResult);
    msgs.push(...toolMsgs);
  }
  throw new Error('assistant tool-loop exhausted (5 turns)');
}
