import type { LLMProvider, LLMMessage, LLMChatOptions } from '../../types/blackboard';

export class NoneProvider implements LLMProvider {
  id = 'none' as const;

  async *chat(): AsyncIterable<string> {
    yield 'El asistente IA está desactivado. Actívalo en configuración (Proveedor → Anthropic/OpenAI/Ollama) e introduce tu API key.';
  }

  async listModels(): Promise<string[]> {
    return [];
  }

  supportsVision(): boolean {
    return false;
  }

  dispose(): void {}
}
