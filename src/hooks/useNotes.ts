'use client';

import { useState, useEffect, useCallback } from 'react';
import { get, set, del, keys, createStore } from 'idb-keyval';

const NOTES_STORE = createStore('mlm-notes', 'notes');

export interface Note {
  id: string;
  moduleSlug: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useNotes(moduleSlug?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const allKeys = await keys(NOTES_STORE);
      const allNotes: Note[] = [];
      for (const key of allKeys) {
        const note = await get<Note>(key, NOTES_STORE);
        if (note) allNotes.push(note);
      }
      allNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      const filtered = moduleSlug
        ? allNotes.filter((n) => n.moduleSlug === moduleSlug)
        : allNotes;
      setNotes(filtered);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [moduleSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (input: NoteInput): Promise<Note> => {
      const now = Date.now();
      const note: Note = {
        ...input,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      await set(note.id, note, NOTES_STORE);
      await refresh();
      return note;
    },
    [refresh],
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> => {
      const existing = await get<Note>(id, NOTES_STORE);
      if (!existing) return;
      const updated: Note = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };
      await set(id, updated, NOTES_STORE);
      await refresh();
    },
    [refresh],
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      await del(id, NOTES_STORE);
      await refresh();
    },
    [refresh],
  );

  return { notes, loading, createNote, updateNote, deleteNote, refresh };
}

export function useAllNotes() {
  return useNotes(undefined);
}

export function useModuleNoteCount(moduleSlug: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const allKeys = await keys(NOTES_STORE);
        let n = 0;
        for (const key of allKeys) {
          const note = await get<Note>(key, NOTES_STORE);
          if (note && note.moduleSlug === moduleSlug) n++;
        }
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moduleSlug]);

  return count;
}

export async function exportAllNotes(): Promise<string> {
  const allKeys = await keys(NOTES_STORE);
  const allNotes: Note[] = [];
  for (const key of allKeys) {
    const note = await get<Note>(key, NOTES_STORE);
    if (note) allNotes.push(note);
  }
  return JSON.stringify({ version: 1, exportedAt: Date.now(), notes: allNotes }, null, 2);
}

export async function importNotes(json: string): Promise<number> {
  const data = JSON.parse(json);
  if (!data.notes || !Array.isArray(data.notes)) {
    throw new Error('Formato de archivo de notas inválido');
  }
  let imported = 0;
  for (const note of data.notes) {
    if (note.id && note.moduleSlug && note.content) {
      await set(note.id, note, NOTES_STORE);
      imported++;
    }
  }
  return imported;
}
