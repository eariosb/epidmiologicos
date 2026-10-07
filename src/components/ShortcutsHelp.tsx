'use client';

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  /** One chip per key in the combo. */
  keys: string[];
  /** '+' for simultaneous combos, '·' for alternatives. */
  joiner?: '+' | '·';
  action: string;
}

const SHORTCUT_GROUPS: { label: string; shortcuts: Shortcut[] }[] = [
  {
    label: 'Pizarra',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'B'], action: 'Abrir/cerrar la pizarra' },
      { keys: ['Ctrl', 'Shift', 'S'], action: 'Capturar región de pantalla' },
      { keys: ['Ctrl', 'Z'], action: 'Deshacer' },
      { keys: ['Ctrl', 'Shift', 'Z'], action: 'Rehacer' },
      { keys: ['7'], action: 'Seleccionar lápiz en Excalidraw' },
    ],
  },
  {
    label: 'Presentación',
    shortcuts: [
      { keys: ['P'], action: 'Entrar/salir del modo presentación' },
      { keys: ['S'], action: 'Armar spotlight (arrastrar para enfocar una zona)' },
      { keys: ['→', 'Espacio', 'PageDown'], joiner: '·', action: 'Revelar el siguiente paso' },
      { keys: ['←', 'PageUp'], joiner: '·', action: 'Retroceder un paso' },
      { keys: ['Esc'], action: 'Desarmar spotlight, quitarlo o salir de presentación' },
    ],
  },
];

function KeyChips({ keys, joiner = '+' }: { keys: string[]; joiner?: '+' | '·' }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <span key={k} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className="text-[10px] text-ink-400 dark:text-ink-500">{joiner}</span>
          )}
          <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] leading-none text-ink-700 dark:border-ink-600 dark:bg-ink-700 dark:text-ink-200">
            {k}
          </kbd>
        </span>
      ))}
    </span>
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1.5 text-sm text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-700"
        title="Ver atajos de teclado"
        aria-label="Ver atajos de teclado"
      >
        <Keyboard aria-hidden className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Atajos de teclado"
            className="w-full max-w-md rounded-lg border border-ink-200 bg-white shadow-xl dark:border-ink-700 dark:bg-ink-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-ink-700">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800 dark:text-ink-100">
                <Keyboard aria-hidden className="h-4 w-4 text-ink-500 dark:text-ink-400" />
                Atajos de teclado
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-200"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-4 py-3">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                    {group.label}
                  </p>
                  <ul className="space-y-1.5">
                    {group.shortcuts.map((s) => (
                      <li
                        key={s.action}
                        className="flex items-center justify-between gap-4 text-xs"
                      >
                        <span className="text-ink-600 dark:text-ink-300">{s.action}</span>
                        <KeyChips keys={s.keys} joiner={s.joiner} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="border-t border-ink-100 px-4 py-2 text-[11px] text-ink-400 dark:border-ink-700 dark:text-ink-500">
              En macOS, usa Cmd en lugar de Ctrl.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
