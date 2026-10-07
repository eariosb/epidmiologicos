'use client';

import { X } from 'lucide-react';
import { useBlackboardContext } from '../lib/context';
import type { LLMProviderType } from '../types/blackboard';

interface BlackboardSettingsPanelProps {
  onClose?: () => void;
}

const PROVIDERS: { id: LLMProviderType; label: string; vision: boolean; models: string }[] = [
  { id: 'none', label: 'Simulado (sin API)', vision: false, models: '' },
  { id: 'anthropic', label: 'Anthropic (Claude)', vision: true, models: 'claude-3-5-sonnet' },
  { id: 'openai', label: 'OpenAI (GPT-4o)', vision: true, models: 'gpt-4o, gpt-4o-mini' },
  { id: 'deepseek', label: 'DeepSeek (OpenAI-compatible)', vision: false, models: 'deepseek-chat, deepseek-reasoner' },
  { id: 'ollama', label: 'Ollama (local)', vision: false, models: 'llama3.1' },
];

export function BlackboardSettingsPanel({ onClose }: Readonly<BlackboardSettingsPanelProps>) {
  const { state, dispatch } = useBlackboardContext();
  const settings = state.settings;

  const handleProviderChange = (provider: LLMProviderType) => {
    dispatch({ type: 'UPDATE_SETTINGS', patch: { llmProvider: provider } });
  };

  const handleApiKeyChange = (value: string) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      patch: { apiKeys: { ...settings.apiKeys, [settings.llmProvider]: value } },
    });
  };

  const handleModelChange = (value: string) => {
    dispatch({ type: 'UPDATE_SETTINGS', patch: { llmModel: value } });
  };

  const handleThemeChange = (value: string) => {
    dispatch({ type: 'UPDATE_SETTINGS', patch: { theme: value as 'light' | 'dark' | 'auto' } });
  };

  return (
    <div className="w-72 rounded border border-ink-200 bg-white p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-ink-800">Configuración</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-400 hover:text-ink-600"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink-600">Proveedor IA</label>
          <select
            value={settings.llmProvider}
            onChange={(e) => handleProviderChange(e.target.value as LLMProviderType)}
            className="mt-1 w-full rounded border border-ink-200 px-2 py-1.5 text-sm text-ink-800 focus:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={settings.pointerMode ?? false}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_SETTINGS', patch: { pointerMode: e.target.checked } })
              }
              className="accent-accent-500"
            />
            Modo puntero (tablero táctil / lápiz IR)
          </label>
          <p className="mt-1 text-[10px] text-ink-400">
            Agranda los botones del panel para uso con puntero a distancia.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-600">Tema</label>
          <select
            value={settings.theme}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="mt-1 w-full rounded border border-ink-200 px-2 py-1.5 text-sm text-ink-800 focus:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="auto">Auto (sistema)</option>
          </select>
        </div>

        {settings.llmProvider !== 'none' && (
          <>
            {(() => {
              const p = PROVIDERS.find((x) => x.id === settings.llmProvider);
              return (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink-600">Modelo</label>
                    <input
                      type="text"
                      value={settings.llmModel}
                      onChange={(e) => handleModelChange(e.target.value)}
                      placeholder={p?.models || 'Ej. gpt-4o-mini'}
                      className="mt-1 w-full rounded border border-ink-200 px-2 py-1.5 text-sm text-ink-800 focus:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                    />
                  </div>
                  {!p?.vision && (
                    <p className="text-[10px] text-amber-600">
                      Este proveedor no admite imágenes. El asistente usará el texto del prompt;
                      para reconocer fórmulas manuscritas elige OpenAI/Anthropic.
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-ink-600">
                      API key ({settings.llmProvider})
                    </label>
                    <input
                      type="password"
                      value={settings.apiKeys[settings.llmProvider] ?? ''}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="sk-…"
                      className="mt-1 w-full rounded border border-ink-200 px-2 py-1.5 text-sm text-ink-800 focus:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                    />
                    <p className="mt-1 text-[10px] text-ink-400">
                      La key se guarda solo en tu navegador (IndexedDB). Nunca se envía a nuestro
                      servidor.
                    </p>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
