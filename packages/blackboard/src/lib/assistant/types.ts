/** OpenAI-style tool/function-calling types shared by providers and the loop. */

export interface ToolSpec {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  /** Raw JSON string of arguments (OpenAI-compatible). */
  arguments: string;
}

export interface ChatOnceResult {
  content: string;
  toolCalls: ToolCall[];
}

export interface ToolDef<I = unknown, O = unknown> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run(input: I): Promise<O>;
}
