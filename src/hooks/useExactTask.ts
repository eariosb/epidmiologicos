'use client';

import { useEffect, useRef, useState } from 'react';
import { runExact } from '@/lib/exactRunner';
import type { ExactTaskArgs, ExactTaskName, ExactTaskResult } from '@/lib/exactTasks';

export interface ExactTaskState<R> {
  /** Last completed result (kept while a recalculation is pending). */
  result: R | null;
  /** A task is in flight. */
  pending: boolean;
  error: Error | null;
}

/**
 * Runs an exact task (worker-backed with synchronous fallback) whenever
 * the args change. Stale results are kept visible while recomputing so
 * sliders don't blank the figure; out-of-order responses are discarded
 * via the seq guard.
 */
export function useExactTask<N extends ExactTaskName>(
  name: N,
  args: ExactTaskArgs[N] | null,
  deps: readonly unknown[],
): ExactTaskState<ExactTaskResult[N]> {
  const [state, setState] = useState<ExactTaskState<ExactTaskResult[N]>>({
    result: null,
    pending: true,
    error: null,
  });
  const seqRef = useRef(0);
  // Serialize args for the deps check; the caller also passes explicit deps.
  const argsKey = JSON.stringify(args);

  useEffect(() => {
    if (args === null) {
      setState((s) => ({ ...s, pending: false }));
      return;
    }
    const mySeq = ++seqRef.current;
    setState((s) => ({ ...s, pending: true, error: null }));
    let cancelled = false;
    runExact(name, args)
      .then((result) => {
        if (cancelled || seqRef.current !== mySeq) return;
        setState({ result, pending: false, error: null });
      })
      .catch((error) => {
        if (cancelled || seqRef.current !== mySeq) return;
        setState((s) => ({
          result: s.result,
          pending: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, argsKey, ...deps]);

  return state;
}
