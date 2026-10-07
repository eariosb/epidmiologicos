import { MockProvider } from './mock';
import { OpenAICompatibleProvider } from './openai';
import type { LLMProvider, LLMProviderType, BlackboardSettings } from '../../types/blackboard';

export type { LLMProvider, LLMProviderType, LLMMessage, LLMChatOptions } from '../../types/blackboard';

export function createLLMProvider(settings: BlackboardSettings): LLMProvider {
  switch (settings.llmProvider) {
    case 'openai':
      return new OpenAICompatibleProvider(
        'openai',
        settings.apiKeys.openai ?? '',
        'https://api.openai.com/v1',
        true,
      );
    case 'deepseek':
      return new OpenAICompatibleProvider(
        'deepseek',
        settings.apiKeys.deepseek ?? '',
        'https://api.deepseek.com/v1',
        false,
      );
    case 'none':
    default:
      return new MockProvider();
  }
}

export async function listModelsForProvider(provider: LLMProviderType): Promise<string[]> {
  switch (provider) {
    case 'none':
      return new MockProvider().listModels();
    case 'openai':
    case 'deepseek':
      return createLLMProvider({ llmProvider: provider, apiKeys: { [provider]: '' }, llmModel: '', graphProvider: 'webr', theme: 'auto', panelWidth: 480, panelShortcut: 'mod+shift+b' } as BlackboardSettings).listModels();
    default:
      return [];
  }
}
