import type { LLMProvider, LLMMessage, LLMChatOptions } from '../../types/blackboard';

type OpenAIProviderId = 'openai' | 'deepseek';
type OpenAIMessage = { role: string; content: unknown; tool_call_id?: string };

export class OpenAICompatibleProvider implements LLMProvider {
  readonly id: OpenAIProviderId;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly vision: boolean;

  constructor(id: OpenAIProviderId, apiKey: string, baseUrl: string, supportsVision = false) {
    this.id = id;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.vision = supportsVision;
  }

  async *chat(messages: LLMMessage[], options: LLMChatOptions): AsyncIterable<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: this.buildRequestBody(messages, options, true),
      signal: options.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${this.id} ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    yield* this.readSSEStream(reader);
  }

  /**
   * Non-streaming completion with optional function calling
   * (DeepSeek `deepseek-chat` supports OpenAI-style `tools`).
   */
  async chatOnce(
    messages: LLMMessage[],
    options: LLMChatOptions & { tools?: unknown[] },
  ): Promise<{
    content: string;
    toolCalls: { id: string; name: string; arguments: string }[];
  }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: this.buildRequestBody(messages, options, false),
      signal: options.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${this.id} ${response.status}: ${text}`);
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map(
      (c: { id?: string; function?: { name?: string; arguments?: string } }) => ({
        id: c.id ?? `call-${Date.now()}`,
        name: c.function?.name ?? '',
        arguments: c.function?.arguments ?? '{}',
      }),
    );
    return { content: msg.content ?? '', toolCalls };
  }

  private buildRequestBody(
    messages: LLMMessage[],
    options: LLMChatOptions & { tools?: unknown[] },
    stream: boolean,
  ): string {
    return JSON.stringify({
      model: options.model,
      stream,
      messages: messages.map((m) => this.toOpenAIMessage(m)),
      ...(options.tools && options.tools.length > 0 ? { tools: options.tools } : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens !== undefined ? { max_tokens: options.maxTokens } : {}),
    });
  }

  private async *readSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): AsyncIterable<string> {
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const content = this.parseSSELine(line);
          if (content !== null) yield content;
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  private parseSSELine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return null;
    const data = trimmed.slice(5).trim();
    if (data === '[DONE]') return null;
    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (typeof content === 'string' && content.length > 0) return content;
    } catch {
      // malformed SSE chunk; skip
    }
    return null;
  }

  private toOpenAIMessage(m: LLMMessage): OpenAIMessage {
    if (m.role === 'system') {
      return { role: 'system', content: m.content };
    }
    if (m.role === 'tool') {
      return { role: 'tool', content: m.content, tool_call_id: m.toolCallId };
    }

    const useImages = this.vision && m.images && m.images.length > 0;
    if (!useImages) {
      return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content };
    }

    const content: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: 'text', text: m.content },
    ];
    for (const img of m.images ?? []) {
      content.push({ type: 'image_url', image_url: { url: img } });
    }
    return { role: 'user', content };
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const models = (data.data ?? []).map((m: { id: string }) => m.id) as string[];
      return models;
    } catch {
      return [];
    }
  }

  supportsVision(): boolean {
    return this.vision;
  }

  dispose(): void {
    // no-op; no resources to release
  }
}
