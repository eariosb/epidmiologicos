'use client';

import { useState, useRef, useEffect } from 'react';
import { keys, get, createStore } from 'idb-keyval';
import { exportAllNotes, importNotes } from '@/hooks/useNotes';

const CAPTURE_STORE = createStore('mlm-captures', 'captures');

export function ExportPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const allKeys = await keys(CAPTURE_STORE);
        if (!cancelled) setCaptureCount(allKeys.length);
      } catch {
        if (!cancelled) setCaptureCount(0);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleExportAll = async () => {
    setExporting(true);
    try {
      // Gather all data
      const allCaptureKeys = await keys(CAPTURE_STORE);
      const loaded = await Promise.all(
        allCaptureKeys.map((key) => get(key as string, CAPTURE_STORE)),
      );
      const captures = loaded.filter((cap): cap is NonNullable<typeof cap> => cap != null);

      const notesJson = await exportAllNotes();

      const payload = {
        version: 1,
        exportedAt: Date.now(),
        notes: JSON.parse(notesJson).notes,
        captures,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curso-completo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.notes) {
        await importNotes(JSON.stringify({ version: 1, notes: data.notes }));
      }

      if (data.captures) {
        const { set } = await import('idb-keyval');
        await Promise.all(
          (data.captures as { id?: string }[])
            .filter((cap) => cap.id)
            .map((cap) => set(cap.id as string, cap, CAPTURE_STORE)),
        );
      }

      alert('Datos importados correctamente.');
    } catch {
      alert('Error: archivo inválido.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="px-4 py-2 border-t border-ink-200">
      <p className="mb-1 text-xs text-ink-500">
        {captureCount > 0 ? `${captureCount} capturas guardadas` : 'Sin capturas'}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExportAll}
          disabled={exporting}
          className="text-xs text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {exporting ? 'Exportando…' : 'Exportar todo'}
        </button>
        <span className="text-ink-300">|</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="text-xs text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {importing ? 'Importando…' : 'Importar'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}
