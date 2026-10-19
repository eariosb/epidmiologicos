import { MockProvider } from './mock';
import { OpenAICompatibleProvider } from './openai';
import type { LLMProvider, BlackboardSettings } from '../../types/blackboard';

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

