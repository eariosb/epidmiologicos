'use client';

import { useEffect, useState } from 'react';
import {
  listEvents,
  clearEvents,
  onEventsChanged,
  type BoardEvent,
} from '@cursos/blackboard';

const KIND_COLOR: Record<string, string> = {
  'save-missed': 'text-danger-600',
  'insert-failed': 'text-danger-600',
  'replace-failed': 'text-danger-600',
  'corpus-error': 'text-danger-600',
  'chat-error': 'text-danger-600',
  'tool-result': 'text-blue-600',
  'corpus-loaded': 'text-success-505',
  'pdf-export': 'text-ink-600',
  session: 'text-ink-600',
  'scene-flush': 'text-ink-400',
  info: 'text-ink-500',
};

/**
 * Diagnostics view over the bb-events ring buffer (last 500 events).
 * Lets the teacher confirm that saves, inserts, tools and the RAG corpus
 * are behaving — or spot save-missed spikes that would justify a WAL.
 */
export function DiagnosticsPanel() {
  const [events, setEvents] = useState<BoardEvent[]>([]);

  useEffect(() => {
    void listEvents().then(setEvents);
    return onEventsChanged(() => {
      void listEvents().then(setEvents);
    });
  }, []);

  const recent = [...events].reverse().slice(0, 100);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-3 py-1.5">
        <span className="text-xs font-semibold text-ink-700">
          Diagnóstico: {events.length} eventos (anillo, máx. 500)
        </span>
        <button
          type="button"
          onClick={() => void clearEvents()}
          className="text-[11px] text-ink-500 hover:text-danger-600"
        >
          Limpiar
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[10px] leading-4">
        {recent.length === 0 && (
          <p className="p-2 text-ink-400">Sin eventos registrados todavía.</p>
        )}
        {recent.map((ev, i) => (
          <div key={`${ev.ts}-${i}`} className="flex gap-2 border-b border-ink-50 py-0.5">
            <span className="shrink-0 text-ink-400">
              {new Date(ev.ts).toLocaleTimeString()}
            </span>
            <span className={`shrink-0 font-semibold ${KIND_COLOR[ev.kind] ?? 'text-ink-500'}`}>
              {ev.kind}
            </span>
            <span className="truncate text-ink-600" title={ev.data ? JSON.stringify(ev.data) : ev.message}>
              {ev.message}
              {ev.data ? ` · ${JSON.stringify(ev.data)}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
