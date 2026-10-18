'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useBlackboardContext } from '../lib/context';
import { createLLMProvider, type LLMProvider } from '../lib/llm';
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

/** Prior turns echoed back to the provider — capped so the request stays
 * small; images and rag metadata are stripped (token-heavy, useless to
 * the model on replay). */
const HISTORY_LIMIT = 8;

function boardInventory(elements: readonly unknown[] | undefined) {
  const inv: Record<string, number> = {};
  for (const el of elements ?? []) {
    const kind = (el as { customData?: { boardKind?: string } }).customData?.boardKind;
    if (kind) inv[kind] = (inv[kind] ?? 0) + 1;
  }
  return inv;
}

interface RequestResult {
  content: string;
  citations: string[];
}

/** Runs one assistant request: tool-capable non-streaming turn when the
 * provider and board ops support it, plain streaming otherwise. */
async function runRequest(opts: {
  provider: LLMProvider;
  model: string;
  messages: LLMMessage[];
  fragmentIds: string[];
  ragFragments: Parameters<typeof createAssistantTools>[0];
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
}): Promise<RequestResult> {
  const { provider, model, messages, fragmentIds, ragFragments, signal, onChunk } = opts;
  const board = getBoardOps();
  const tools = provider.chatOnce && board ? createAssistantTools(ragFragments) : undefined;
  const validate = {
    allowedCitationIds: new Set(fragmentIds),
    validateLatex: getLatexValidator(),
  };

  if (tools) {
    return runAssistantTurn(messages, {
      provider,
      model,
      tools,
      validate,
      signal,
      onToolResult: (name, result) =>
        void logEvent('tool-result', name, {
          result: JSON.stringify(result).slice(0, 400),
        }),
    });
  }

  // Streaming path (mock provider / providers without tool support).
  let fullContent = '';
  const stream = provider.chat(messages, { model, signal });
  for await (const chunk of stream) {
    fullContent += chunk;
    onChunk(chunk);
  }
  return validateAndSanitize(fullContent, validate);
}

export function useBlackboardLLM() {
  const { state, dispatch } = useBlackboardContext();
  const abortRef = useRef<AbortController | null>(null);
  const idSeq = useRef(0);

  const { llmProvider, llmModel, apiKeys } = state.settings;
  const provider = useMemo(
    () => createLLMProvider({ llmProvider, llmModel, apiKeys } as typeof state.settings),
    [llmProvider, llmModel, apiKeys],
  );

  const ask = useCallback(
    async (mode: AssistantMode, text: string, imageDataUrl?: string | null) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      dispatch({ type: 'SET_LLM_STATUS', status: 'streaming' });

      const module = state.moduleContext ?? FALLBACK_MODULE;
      // Retrieval query: the user's text, or the module title when the
      // request is pure canvas (mode buttons with no typed input).
      const query = text || module.title;
      const fragments = getRetriever()?.(query, 5) ?? [];
      const activeScene = state.activeSceneId ? state.scenes[state.activeSceneId] : null;

      // Vision gating: only attach the canvas capture when the provider
      // can actually see it — otherwise the prompt would claim an image
      // the model never receives.
      const attachedImage =
        imageDataUrl && provider.supportsVision() ? imageDataUrl : null;

      const system = buildSystemPrompt({
        module,
        visitedSections: state.visitedSections,
        boardInventory: boardInventory(activeScene?.elements),
        ragFragments: fragments,
        assistantMode: mode,
      });
      const user = buildUserPrompt(mode, text, attachedImage);

      const now = Date.now();
      const seq = ++idSeq.current;
      const fragmentIds = fragments.map((f) => f.id);
      // Conversation history: prior user/assistant turns (sans system and
      // tool internals) so the assistant is actually conversational.
      const history: LLMMessage[] = state.llmMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .filter((m) => m.content.trim().length > 0)
        .slice(-HISTORY_LIMIT)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));
      const systemMessage: LLMMessage = {
        id: `system-${now}-${seq}`,
        role: 'system',
        content: system,
        createdAt: new Date().toISOString(),
      };
      const userMessage: LLMMessage = {
        id: `user-${now}-${seq}`,
        role: 'user',
        content: user,
        images: attachedImage ? [attachedImage] : undefined,
        ragFragments: fragmentIds,
        createdAt: new Date().toISOString(),
      };
      // The chat record stores the new system + user turn; the request
      // payload additionally carries the recent history.
      const requestMessages = [systemMessage, ...history, userMessage];
      dispatch({ type: 'APPEND_LLM_MESSAGE', message: systemMessage });
      dispatch({ type: 'APPEND_LLM_MESSAGE', message: userMessage });

      const assistantId = `assistant-${now}-${seq}`;
      dispatch({
        type: 'APPEND_LLM_MESSAGE',
        message: {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        },
      });

      let errored = false;
      try {
        const result = await runRequest({
          provider,
          model: llmModel,
          messages: requestMessages,
          fragmentIds,
          ragFragments: fragments,
          signal: controller.signal,
          onChunk: (chunk) => dispatch({ type: 'STREAM_LLM_CHUNK', id: assistantId, chunk }),
        });
        dispatch({
          type: 'UPDATE_LLM_MESSAGE',
          id: assistantId,
          patch: { content: result.content, citations: result.citations },
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          errored = true;
          void logEvent('chat-error', String(err), {
            provider: llmProvider,
            model: llmModel,
          });
          // Surface the failure in the bubble — a silent empty reply reads
          // like the assistant is broken rather than the provider.
          dispatch({
            type: 'UPDATE_LLM_MESSAGE',
            id: assistantId,
            patch: {
              content: `⚠ No pude completar la respuesta (${err instanceof Error ? err.message : String(err)}). Revisa la configuración del proveedor en Ajustes.`,
            },
          });
        }
      } finally {
        abortRef.current = null;
        dispatch({ type: 'SET_LLM_STATUS', status: errored ? 'error' : 'idle' });
      }
    },
    [dispatch, provider, llmModel, llmProvider, state],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'SET_LLM_STATUS', status: 'idle' });
  }, [dispatch]);

  const clear = useCallback(() => {
    // Abort first: otherwise an in-flight stream keeps appending chunks to
    // the just-cleared list and the conversation "comes back".
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: 'CLEAR_LLM_MESSAGES' });
    dispatch({ type: 'SET_LLM_STATUS', status: 'idle' });
  }, [dispatch]);

  return {
    messages: state.llmMessages,
    status: state.llmStatus,
    ask,
    stop,
    clear,
  };
}
