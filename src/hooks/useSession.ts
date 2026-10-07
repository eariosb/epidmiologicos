'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getActiveSession,
  listCaptures,
  saveCapture,
  deleteCapture,
  updateCapture,
  addVisitedSection,
  listAllSessions,
  setActiveSessionId,
  deleteSession as deleteStoredSession,
  addQuestion as addQuestionToStore,
  updateQuestion,
  deleteQuestion,
  endActiveSession,
  startNewSession,
  type Capture,
  type CaptureType,
  type Session,
} from '@/lib/session-store';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [s, c, a] = await Promise.all([getActiveSession(), listCaptures(), listAllSessions()]);
    setSession(s);
    setCaptures(c);
    setAllSessions(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCapture = useCallback(
    async (dataUrl: string, opts: Partial<Capture> = {}) => {
      const type: CaptureType = opts.type ?? 'other';
      const capture = await saveCapture({
        name: opts.name ?? `Captura ${captures.length + 1}`,
        dataUrl,
        thumbnail: dataUrl,
        type,
        tags: opts.tags ?? [],
        sourceSection: opts.sourceSection,
        sourceModuleSlug: opts.sourceModuleSlug,
        timestamp: Date.now(),
      });
      await refresh();
      return capture;
    },
    [captures.length, refresh],
  );

  const removeCapture = useCallback(
    async (id: string) => {
      await deleteCapture(id);
      await refresh();
    },
    [refresh],
  );

  const editCapture = useCallback(
    async (id: string, patch: Partial<Capture>) => {
      await updateCapture(id, patch);
      await refresh();
    },
    [refresh],
  );

  const visit = useCallback(
    async (slug: string, title: string) => {
      await addVisitedSection(slug, title);
      await refresh();
    },
    [refresh],
  );

  const switchSession = useCallback(
    async (id: string) => {
      await setActiveSessionId(id);
      await refresh();
    },
    [refresh],
  );

  const removeSession = useCallback(
    async (id: string) => {
      await deleteStoredSession(id);
      await refresh();
    },
    [refresh],
  );

  const addQuestion = useCallback(
    async (text: string) => {
      await addQuestionToStore(text);
      await refresh();
    },
    [refresh],
  );

  const resolveQuestion = useCallback(
    async (id: string, resolved: boolean) => {
      await updateQuestion(id, { resolved });
      await refresh();
    },
    [refresh],
  );

  const removeQuestion = useCallback(
    async (id: string) => {
      await deleteQuestion(id);
      await refresh();
    },
    [refresh],
  );

  const endSession = useCallback(async () => {
    await endActiveSession();
    await refresh();
  }, [refresh]);

  const newSession = useCallback(
    async (title: string) => {
      await startNewSession(title);
      await refresh();
    },
    [refresh],
  );

  return {
    session,
    captures,
    allSessions,
    loading,
    refresh,
    addCapture,
    removeCapture,
    editCapture,
    visit,
    switchSession,
    removeSession,
    addQuestion,
    resolveQuestion,
    removeQuestion,
    endSession,
    newSession,
  };
}
