import { createStore, get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { migrateRecord, SCHEMA_VERSIONS, type MigrationChain } from './persistence';

/**
 * Ring-buffer event log (`bb-events` store, single record, last 500).
 * Purpose: observability for the local-first board — save misses, insert
 * failures, tool results, provider errors. Instrumented points log via
 * `logEvent`; the diagnostics panel reads via `listEvents`.
 */

export type BoardEventKind =
  | 'save-missed'
  | 'insert-failed'
  | 'replace-failed'
  | 'scene-flush'
  | 'corpus-loaded'
  | 'corpus-error'
  | 'chat-error'
  | 'tool-result'
  | 'pdf-export'
  | 'md-export'
  | 'session'
  | 'info';

export interface BoardEvent {
  ts: number;
  kind: BoardEventKind;
  message: string;
  data?: Record<string, unknown>;
  /** Active class session when the event fired; lets diagnostics answer
   *  "what happened in THIS class". Null outside a session context. */
  sessionId?: string;
}

/**
 * The active class session, set by the session store whenever the pointer
 * moves. Events logged afterwards carry it until it changes.
 */
let currentSessionId: string | null = null;

export function setEventSession(id: string | null): void {
  currentSessionId = id;
}

export interface EventLog {
  version: number;
  events: BoardEvent[];
}

const MAX_EVENTS = 500;
const KEY = 'ring';

const store = typeof indexedDB === 'undefined' ? null : createStore('bb-events', 'events');

const migrations: MigrationChain = { target: SCHEMA_VERSIONS.events, steps: {} };

// In-memory tail so logging never throws during tests/SSR or when IDB is absent.
let memory: BoardEvent[] = [];
const listeners = new Set<() => void>();

export function onEventsChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) fn();
}

export async function logEvent(
  kind: BoardEventKind,
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const ev: BoardEvent = {
    ts: Date.now(),
    kind,
    message,
    ...(data ? { data } : {}),
    ...(currentSessionId ? { sessionId: currentSessionId } : {}),
  };
  // Espejo hacia la telemetría de campo (si la app la tiene activa la
  // recoge; si no, es un CustomEvent sin listeners — coste nulo).
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('ft:track', {
          detail: { kind: 'board-scene', payload: { action: kind } },
        }),
      );
    } catch {
      // noop — la telemetría nunca debe romper el log local
    }
  }
  if (!store) {
    memory.push(ev);
    if (memory.length > MAX_EVENTS) memory = memory.slice(-MAX_EVENTS);
    notify();
    return;
  }
  try {
    const raw = await idbGet<unknown>(KEY, store);
    const log = raw
      ? migrateRecord<EventLog>(raw, migrations).record
      : { version: SCHEMA_VERSIONS.events, events: [] };
    log.events.push(ev);
    if (log.events.length > MAX_EVENTS) log.events = log.events.slice(-MAX_EVENTS);
    await idbSet(KEY, log, store);
    notify();
  } catch {
    memory.push(ev); // never lose the event silently
    notify();
  }
}

export async function listEvents(): Promise<BoardEvent[]> {
  if (!store) return memory;
  try {
    const raw = await idbGet<unknown>(KEY, store);
    if (!raw) return memory;
    const log = migrateRecord<EventLog>(raw, migrations).record;
    return log.events;
  } catch {
    return memory;
  }
}

export async function clearEvents(): Promise<void> {
  memory = [];
  if (store) await idbDel(KEY, store);
  notify();
}
