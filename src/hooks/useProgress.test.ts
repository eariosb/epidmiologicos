import { renderHook, act, waitFor } from '@testing-library/react';
import { useCourseProgress, useMarkLessonComplete } from './useProgress';

const STORAGE_KEY = 'mlm-course-progress';

describe('useProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts at 0% when nothing is completed', () => {
    const { result } = renderHook(() => useCourseProgress(4));
    expect(result.current).toEqual({ completedCount: 0, total: 4, pct: 0 });
  });

  it('marks a lesson as complete and reflects it in the overall progress', async () => {
    const { result: progress } = renderHook(() => useCourseProgress(4));

    act(() => {
      renderHook(() => useMarkLessonComplete('introduccion'));
    });

    await waitFor(() => {
      expect(progress.current).toEqual({ completedCount: 1, total: 4, pct: 25 });
    });

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['introduccion']);
  });

  it('does not duplicate an already-completed lesson', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(['introduccion']));

    act(() => {
      renderHook(() => useMarkLessonComplete('introduccion'));
    });

    const { result } = renderHook(() => useCourseProgress(4));
    await waitFor(() => {
      expect(result.current.completedCount).toBe(1);
    });
  });

  it('returns 0% when there are no lessons', () => {
    const { result } = renderHook(() => useCourseProgress(0));
    expect(result.current.pct).toBe(0);
  });
});
