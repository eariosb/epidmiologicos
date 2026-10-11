'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import type { Capture, CaptureType } from '@/lib/session-store';
import { sendToBlackboard } from '@/lib/send-to-blackboard';

const TYPE_LABELS: Record<CaptureType, string> = {
  formula: 'Fórmula',
  graph: 'Gráfico',
  table: 'Tabla',
  code: 'Código',
  result: 'Resultado',
  other: 'Otro',
};

export function CaptureGallery() {
  const { captures, loading, removeCapture, editCapture } = useSession();
  const [filter, setFilter] = useState<CaptureType | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filtered =
    filter === 'all' ? captures : captures.filter((c) => c.type === filter);

  const startRename = (cap: Capture) => {
    setEditingId(cap.id);
    setEditName(cap.name);
  };

  const saveRename = (id: string) => {
    void editCapture(id, { name: editName }).then(() => setEditingId(null));
  };

  if (loading) {
    return <div className="p-4 text-xs text-ink-500">Cargando biblioteca…</div>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
        <p className="text-sm font-semibold text-ink-800">Biblioteca de capturas</p>
      </div>

      <div className="flex gap-1 border-b border-ink-200 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            filter === 'all' ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:bg-ink-100'
          }`}
        >
          Todas
        </button>
        {(Object.keys(TYPE_LABELS) as CaptureType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              filter === type ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:bg-ink-100'
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length === 0 && (
          <p className="text-xs text-ink-400">No hay capturas en esta sesión.</p>
        )}
        {filtered.map((cap) => (
          <div
            key={cap.id}
            className="group rounded border border-ink-200 bg-white p-2 transition-colors hover:border-brand-300"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', cap.dataUrl);
              e.dataTransfer.setData('capture/id', cap.id);
            }}
          >
            <div className="mb-2 flex gap-2">
              <img
                src={cap.thumbnail}
                alt={cap.name}
                className="h-16 w-16 rounded border border-ink-100 object-contain"
              />
              <div className="flex-1">
                {editingId === cap.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveRename(cap.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(cap.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full rounded border border-ink-200 px-1.5 py-0.5 text-xs"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startRename(cap)}
                    className="text-left text-xs font-medium text-ink-700 hover:text-brand-600"
                  >
                    {cap.name}
                  </button>
                )}
                <p className="text-[10px] text-ink-400">
                  {TYPE_LABELS[cap.type]} · {new Date(cap.timestamp).toLocaleString()}
                </p>
                {cap.sourceSection && (
                  <p className="text-[10px] text-ink-400">{cap.sourceSection}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-ink-400">Arrastra a la pizarra</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    sendToBlackboard({
                      dataUrl: cap.dataUrl,
                      opts: {
                        meta: {
                          boardKind: 'capture',
                          boardId: cap.id,
                          payload: { captureId: cap.id },
                        },
                      },
                    })
                  }
                  className="text-[10px] text-brand-600 hover:text-brand-700"
                  title="Insertar en la pizarra"
                >
                  A la pizarra
                </button>
                <button
                  type="button"
                  onClick={() => removeCapture(cap.id)}
                  className="text-[10px] text-danger-500 hover:text-danger-700"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
