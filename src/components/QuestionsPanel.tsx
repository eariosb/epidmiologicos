'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export function QuestionsPanel() {
  const { session, addQuestion, resolveQuestion, removeQuestion } = useSession();
  const [draft, setDraft] = useState('');

  const questions = session?.questions ?? [];

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text) return;
    await addQuestion(text);
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
        <p className="text-sm font-semibold text-ink-800">Preguntas de estudiantes</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {questions.length === 0 && (
          <p className="text-xs text-ink-400">
            Registra las preguntas que surjan durante la clase para responderlas o revisarlas al final.
          </p>
        )}
        {questions.map((q) => (
          <div
            key={q.id}
            className={`flex items-start gap-2 rounded border p-2 ${
              q.resolved
                ? 'border-ink-100 bg-ink-50 text-ink-400'
                : 'border-ink-200 bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={q.resolved}
              onChange={(e) => resolveQuestion(q.id, e.target.checked)}
              className="mt-1 accent-brand-500"
              title="Marcar como respondida"
            />
            <div className="flex-1">
              <p className={`text-xs ${q.resolved ? 'line-through' : 'text-ink-700'}`}>{q.text}</p>
              <p className="text-[10px] text-ink-400">
                {new Date(q.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeQuestion(q.id)}
              className="text-[10px] text-danger-500 hover:text-danger-700"
              title="Eliminar pregunta"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-200 bg-ink-50 p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Nueva pregunta…"
            className="flex-1 rounded border border-ink-200 px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}
