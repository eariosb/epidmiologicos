'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mlm-course-progress';
const UPDATE_EVENT = 'mlm-progress-update';

function readCompleted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeCompleted(completed: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/**
 * Marks the given lesson as completed in localStorage on mount.
 * Pure side-effect hook: no rendering concerns (SRP).
 */
export function useMarkLessonComplete(slug: string) {
  useEffect(() => {
    const completed = readCompleted();
    if (!completed.has(slug)) {
      completed.add(slug);
      writeCompleted(completed);
    }
  }, [slug]);
}

export interface CourseProgress {
  completedCount: number;
  total: number;
  pct: number;
}

/**
 * Tracks overall course completion (persisted in localStorage),
 * reacting to updates triggered by `useMarkLessonComplete`.
 */
export function useCourseProgress(total: number): CourseProgress {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const update = () => setCompletedCount(readCompleted().size);
    update();
    window.addEventListener(UPDATE_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(UPDATE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  // `completedCount` reflects every slug ever marked complete in
  // localStorage. If the course content changes (slugs renamed/removed)
  // stale entries can outnumber the current module list, which previously
  // produced percentages above 100%. Clamp both the displayed count and
  // the percentage to `total`.
  const clampedCount = Math.min(completedCount, total);
  const pct = total === 0 ? 0 : Math.min(100, Math.round((clampedCount / total) * 100));

  return { completedCount: clampedCount, total, pct };
}
