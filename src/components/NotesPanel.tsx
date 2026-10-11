'use client';

import { useState, useRef } from 'react';
import { StickyNote, X } from 'lucide-react';
import clsx from 'clsx';
import { useNotes, exportAllNotes, importNotes, type Note } from '@/hooks/useNotes';

interface NotesPanelProps {
  moduleSlug: string;
  moduleTitle: string;
}

export function NotesPanel({ moduleSlug, moduleTitle }: NotesPanelProps) {
  const { notes, createNote, updateNote, deleteNote, refresh } = useNotes(moduleSlug);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewNote = () => {
    setEditingId('new');
    setDraftTitle('');
    setDraftContent('');
    setExpanded(true);
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setExpanded(true);
  };

  const handleSave = async () => {
    if (!draftContent.trim()) return;
    if (editingId === 'new') {
      await createNote({
        moduleSlug,
        title: draftTitle || `Nota: ${moduleTitle}`,
        content: draftContent,
        tags: [],
      });
    } else if (editingId) {
      await updateNote(editingId, { title: draftTitle, content: draftContent });
    }
    setEditingId(null);
    setDraftTitle('');
    setDraftContent('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraftTitle('');
    setDraftContent('');
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    if (editingId === id) handleCancel();
  };

  const handleExport = async () => {
    const json = await exportAllNotes();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notas-curso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      if (/\.(md|markdown|txt)$/i.test(file.name)) {
        await createNote({
          moduleSlug,
          title: file.name.replace(/\.[^.]+$/, ''),
          content: text,
          tags: ['importado'],
        });
        await refresh();
        setShowImport(false);
      } else {
        const count = await importNotes(text);
        await refresh();
        setShowImport(false);
        alert(`Se importaron ${count} notas correctamente.`);
      }
    } catch {
      alert('Error: archivo de notas inválido.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mt-4 rounded border border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <span aria-hidden className={clsx('transition-transform', expanded && 'rotate-90')}>▸</span>
          <StickyNote aria-hidden className="h-4 w-4" />
          Mis notas
          {notes.length > 0 && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {notes.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="text-xs text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="text-xs text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Importar
          </button>
        </div>
      </div>

      {showImport && (
        <div className="mt-2 animate-fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.md,.markdown,.txt"
            onChange={handleImport}
            className="text-xs text-ink-600 file:mr-2 file:rounded file:border-0 file:bg-brand-50 file:px-2 file:py-1 file:text-xs file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
      )}

      {expanded && (
        <div className="mt-3 animate-fade-in">
          {/* List of existing notes */}
          {notes.length > 0 && editingId === null && (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded border border-ink-200 bg-ink-50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(note)}
                      className="flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <p className="text-sm font-medium text-ink-800">
                        {note.title || 'Sin título'}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">
                        {note.content}
                      </p>
                      <p className="mt-1 text-[10px] text-ink-400">
                        {new Date(note.updatedAt).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      aria-label="Eliminar nota"
                      className="rounded p-1 text-ink-400 hover:bg-danger-50 hover:text-danger-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <X aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Editor */}
          {editingId !== null && (
            <div className="mt-2 space-y-2 animate-fade-in">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Título de la nota (opcional)"
                className="w-full rounded border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              />
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Escribe tu nota aquí…"
                rows={5}
                className="w-full rounded border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!draftContent.trim()}
                  className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* New note button */}
          {editingId === null && (
            <button
              type="button"
              onClick={handleNewNote}
              className="mt-2 w-full rounded border border-dashed border-ink-300 py-2 text-sm text-ink-500 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              + Nueva nota
            </button>
          )}
        </div>
      )}
    </div>
  );
}
