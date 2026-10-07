'use client';

import { useEffect, useRef } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';
import { getActiveSession } from '@/lib/session-store';
import { getChatRecord, saveChatRecord } from '@/lib/chat-store';

/**
 * Persists the assistant conversation (with ragFragments + verified citations)
 * into the `bb-chat` store, debounced, keyed by the active session id —
 * and rehydrates it on mount so resuming a session brings the chat back.
 */
export function useChatPersistence(): void {
  const { state, dispatch } = useBlackboardContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef<string | null>(null);

  // Restore once per mount: only when the in-memory chat is empty so we never
  // clobber a conversation already in progress.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getActiveSession();
        if (!session || cancelled || restoredRef.current === session.id) return;
        restoredRef.current = session.id;
        const record = await getChatRecord(session.id);
        if (!cancelled && record && record.messages.length > 0 && state.llmMessages.length === 0) {
          dispatch({ type: 'SET_LLM_MESSAGES', messages: record.messages });
        }
      } catch (err) {
        console.error('[bb-chat] restore failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (state.llmMessages.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const session = await getActiveSession();
        if (!session) return;
        await saveChatRecord({
          sessionId: session.id,
          messages: state.llmMessages,
          provider: state.settings.llmProvider,
          model: state.settings.llmModel,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error('[bb-chat] persist failed', err);
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.llmMessages, state.settings.llmProvider, state.settings.llmModel]);
}
