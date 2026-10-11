'use client';

import { useState } from 'react';
import { History, X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export function SessionManager() {
  const { session, allSessions, loading, switchSession, removeSession } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100"
      >
        <History aria-hidden className="h-3.5 w-3.5" />
        Sesiones
      </button>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded border border-ink-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-800">Gestionar sesiones</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-ink-400 hover:text-ink-600"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-ink-500">Cargando…</p>
            ) : allSessions.length === 0 ? (
              <p className="text-xs text-ink-500">No hay sesiones guardadas.</p>
            ) : (
              <ul className="space-y-2">
                {allSessions.map((s) => (
                  <li
                    key={s.id}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-xs ${
                      s.id === session?.id
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-ink-200 bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-ink-700">{s.title}</p>
                      <p className="text-[10px] text-ink-400">
                        {new Date(s.updatedAt).toLocaleString()} · {s.captureIds.length} capturas
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {s.id !== session?.id && (
                        <button
                          type="button"
                          onClick={() => switchSession(s.id).then(() => setOpen(false))}
                          className="rounded bg-brand-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-brand-600"
                        >
                          Cargar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSession(s.id)}
                        className="rounded border border-danger-200 px-2 py-1 text-[10px] font-medium text-danger-500 hover:bg-danger-50"
                      >
                        Borrar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
