import { EXACT_TASKS, type ExactTaskName } from '@/lib/exactTasks';

/**
 * Web Worker: runs the heavy exact enumerations off the UI thread.
 * Protocol: { id, name, args } -> { id, ok: result } | { id, error }.
 * The task functions are shared with the synchronous fallback
 * (src/lib/exactRunner.ts), so results are bit-identical either way.
 */
self.onmessage = (e: MessageEvent<{ id: number; name: ExactTaskName; args: unknown }>) => {
  const { id, name, args } = e.data;
  try {
    const fn = EXACT_TASKS[name] as (a: unknown) => unknown;
    (self as unknown as Worker).postMessage({ id, ok: fn(args) });
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
