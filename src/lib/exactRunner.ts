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
interface Slot {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  /** Misma tarea en el hilo principal, por si el worker muere a mitad. */
  runSync: () => unknown;
}
const pending = new Map<number, Slot>();

function settleSync(slot: Slot) {
  try {
    slot.resolve(slot.runSync());
  } catch (err) {
    slot.reject(err instanceof Error ? err : new Error(String(err)));
  }
}

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
        // El worker murió (carga fallida, memoria): se desactiva y las
        // tareas en vuelo se terminan en el hilo principal en lugar de
        // dejar a los exploradores en "Calculando…" para siempre.
        workerFailed = true;
        const slots = [...pending.values()];
        pending.clear();
        worker?.terminate();
        worker = null;
        slots.forEach(settleSync);
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
    const slot: Slot = { resolve: resolve as (v: unknown) => void, reject, runSync };
    pending.set(id, slot);
    try {
      w.postMessage({ id, name, args });
    } catch {
      // postMessage falla con argumentos no clonables: hilo principal.
      pending.delete(id);
      settleSync(slot);
    }
  });
}
