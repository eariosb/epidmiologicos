'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';
import { getActiveSession, onActiveSessionChanged } from '@/lib/session-store';
import { getChatRecord, saveChatRecord } from '@/lib/chat-store';

/**
 * Persists the assistant conversation (with ragFragments + verified citations)
 * into the `bb-chat` store, debounced, keyed by the active session id;
 * and rehydrates it on mount and on every session switch, so the chat
 * always follows the class session.
 */
export function useChatPersistence(): void {
  const { state, dispatch } = useBlackboardContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef<string | null>(null);
  // Restore only when the in-memory chat is empty so we never clobber a
  // conversation already in progress.
  const emptyRef = useRef(state.llmMessages.length === 0);
  emptyRef.current = state.llmMessages.length === 0;

  const restore = useCallback(async () => {
    try {
      const session = await getActiveSession();
      if (!session || restoredRef.current === session.id) return;
      restoredRef.current = session.id;
      const record = await getChatRecord(session.id);
      if (record && record.messages.length > 0 && emptyRef.current) {
        dispatch({ type: 'SET_LLM_MESSAGES', messages: record.messages });
      }
    } catch (err) {
      console.error('[bb-chat] restore failed', err);
    }
  }, [dispatch]);

  // On session switch the conversation follows the class: the previous
  // session's messages are cleared (never saved under the new id), any
  // pending debounced write is cancelled, and the new session's chat is
  // rehydrated.
  useEffect(() => {
    void restore();
    return onActiveSessionChanged(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      restoredRef.current = null;
      emptyRef.current = true; // the dispatch below empties the chat
      dispatch({ type: 'SET_LLM_MESSAGES', messages: [] });
      void restore();
    });
  }, [dispatch, restore]);

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
