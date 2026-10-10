'use client';

import { useCallback, useRef } from 'react';
import { useBlackboardContext } from '../lib/context';
import { createLLMProvider } from '../lib/llm';
import { buildSystemPrompt } from '../lib/prompts/system';
import { buildUserPrompt } from '../lib/prompts';
import { getRetriever } from '../lib/rag/runtime';
import { getLatexValidator } from '../lib/assistant/latex-runtime';
import { getBoardOps } from '../lib/assistant/board-ops';
import { createAssistantTools } from '../lib/assistant/tools';
import { runAssistantTurn } from '../lib/assistant/loop';
import { validateAndSanitize } from '../lib/assistant/validate';
import { logEvent } from '../lib/events';
import type { AssistantMode, LLMMessage } from '../types/blackboard';

const FALLBACK_MODULE = {
  slug: 'general',
  title: 'Curso ADEI: análisis de datos epidemiológicos',
  objective: [] as string[],
  datasets: [] as string[],
  order: 0,
};

function boardInventory(elements: readonly unknown[] | undefined) {
  const inv = { formulas: 0, matrices: 0, captures: 0, questions: 0 };
  for (const el of elements ?? []) {
    const kind = (el as { customData?: { boardKind?: string } }).customData?.boardKind;
    if (kind === 'math') inv.formulas += 1;
    else if (kind === 'matrix') inv.matrices += 1;
    else if (kind === 'capture') inv.captures += 1;
  }
  return inv;
}

export function useBlackboardLLM() {
  const { state, dispatch } = useBlackboardContext();
  const abortRef = useRef<AbortController | null>(null);

  const provider = createLLMProvider(state.settings);

  const ask = useCallback(
    async (mode: AssistantMode, text: string, imageDataUrl?: string | null) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: 'SET_LLM_STATUS', status: 'streaming' });

      const module = state.moduleContext ?? FALLBACK_MODULE;
      const fragments = getRetriever()?.(text || `${mode}`, 5) ?? [];
      const activeScene = state.activeSceneId ? state.scenes[state.activeSceneId] : null;

      const system = buildSystemPrompt({
        module,
        visitedSections: state.visitedSections,
        boardInventory: boardInventory(activeScene?.elements),
        ragFragments: fragments,
        assistantMode: mode,
      });
      const user = buildUserPrompt(mode, text, imageDataUrl);

      const now = Date.now();
      const fragmentIds = fragments.map((f) => f.id);
      const messages: LLMMessage[] = [
        { id: `system-${now}`, role: 'system', content: system, createdAt: new Date().toISOString() },
        {
          id: `user-${now}`,
          role: 'user',
          content: user,
          images: imageDataUrl ? [imageDataUrl] : undefined,
          ragFragments: fragmentIds,
          createdAt: new Date().toISOString(),
        },
      ];
      messages.forEach((m) => dispatch({ type: 'APPEND_LLM_MESSAGE', message: m }));

      const assistantId = `assistant-${now}`;
      dispatch({
        type: 'APPEND_LLM_MESSAGE',
        message: {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        },
      });

      const board = getBoardOps();
      const tools = provider.chatOnce && board ? createAssistantTools(fragments) : undefined;
      const validate = {
        allowedCitationIds: new Set(fragmentIds),
        validateLatex: getLatexValidator(),
      };

      try {
        if (tools) {
          // Tool-capable path: non-streaming turn with up to 5 tool calls.
          const result = await runAssistantTurn(messages, {
            provider,
            model: state.settings.llmModel,
            tools,
            validate,
            signal: controller.signal,
            onToolResult: (name, result) =>
              void logEvent('tool-result', name, {
                result: JSON.stringify(result).slice(0, 400),
              }),
          });
          dispatch({
            type: 'UPDATE_LLM_MESSAGE',
            id: assistantId,
            patch: { content: result.content, citations: result.citations },
          });
        } else {
          // Streaming path (mock provider / providers without tool support).
          let fullContent = '';
          const stream = provider.chat(messages, {
            model: state.settings.llmModel,
            signal: controller.signal,
          });
          for await (const chunk of stream) {
            fullContent += chunk;
            dispatch({ type: 'STREAM_LLM_CHUNK', id: assistantId, chunk });
          }
          const validated = validateAndSanitize(fullContent, validate);
          dispatch({
            type: 'UPDATE_LLM_MESSAGE',
            id: assistantId,
            patch: { content: validated.content, citations: validated.citations },
          });
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          void logEvent('chat-error', String(err), {
            provider: state.settings.llmProvider,
            model: state.settings.llmModel,
          });
          dispatch({ type: 'SET_LLM_STATUS', status: 'error' });
          return;
        }
      } finally {
        abortRef.current = null;
        dispatch({ type: 'SET_LLM_STATUS', status: 'idle' });
      }
    },
    [dispatch, provider, state],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'SET_LLM_STATUS', status: 'idle' });
  }, [dispatch]);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR_LLM_MESSAGES' });
  }, [dispatch]);

  return {
    messages: state.llmMessages,
    status: state.llmStatus,
    ask,
    stop,
    clear,
  };
}
