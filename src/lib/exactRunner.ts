'use client';

import { EXACT_TASKS, type ExactTaskArgs, type ExactTaskName, type ExactTaskResult } from './exactTasks';

/**
 * Dispatcher for heavy exact computations. Uses a Web Worker when the
 * feature flag allows it and the runtime supports one; otherwise falls
 * back to the same task functions on the main thread — identical
 * numerical results, different thread.
 *
 * Flag: NEXT_PUBLIC_EXACT_WORKER=0 disables the worker (deploy fallback).
 */

const WORKER_ENABLED = process.env.NEXT_PUBLIC_EXACT_WORKER !== '0';

let worker: Worker | null = null;
let workerFailed = false;
let seq = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (!WORKER_ENABLED || workerFailed || typeof window === 'undefined' || typeof Worker === 'undefined')
    return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('../workers/exact.worker.ts', import.meta.url));
      worker.onmessage = (e: MessageEvent<{ id: number; ok?: unknown; error?: string }>) => {
        const { id, ok, error } = e.data;
        const slot = pending.get(id);
        if (!slot) return;
        pending.delete(id);
        if (error !== undefined) slot.reject(new Error(error));
        else slot.resolve(ok);
      };
      worker.onerror = () => {
        workerFailed = true;
        for (const { reject } of pending.values()) reject(new Error('worker failure'));
        pending.clear();
        worker?.terminate();
        worker = null;
      };
    } catch {
      workerFailed = true;
      worker = null;
    }
  }
  return worker;
}

/** Runs an exact task in the worker, or synchronously as fallback. */
export function runExact<N extends ExactTaskName>(
  name: N,
  args: ExactTaskArgs[N],
): Promise<ExactTaskResult[N]> {
  const runSync = () =>
    (EXACT_TASKS[name] as unknown as (a: ExactTaskArgs[N]) => ExactTaskResult[N])(args);
  const w = getWorker();
  if (!w) {
    // Synchronous fallback: same functions, same results.
    return Promise.resolve(runSync());
  }
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    try {
      w.postMessage({ id, name, args });
    } catch (err) {
      pending.delete(id);
      // postMessage can throw on uncloneable args; fall back to sync.
      try {
        resolve(runSync());
      } catch (syncErr) {
        reject(syncErr instanceof Error ? syncErr : new Error(String(syncErr)));
      }
      void err;
    }
  });
}
