'use client';

import { useState } from 'react';

const MAX_LINES = 30;

/**
 * Renders R console output, truncated to MAX_LINES by default with a
 * "+ Ver salida completa" link to expand the rest.
 */
export function ConsoleOutput({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n');
  const isLong = lines.length > MAX_LINES;
  const visible = expanded || !isLong ? lines : lines.slice(0, MAX_LINES);

  if (!text.trim()) return null;

  return (
    <div className="rounded-b bg-ink-900 text-ink-100">
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
        {visible.join('\n')}
        {!expanded && isLong && '\n…'}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-ink-700 px-4 py-1.5 text-left text-xs font-medium text-accent-300 hover:text-accent-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
          aria-expanded={expanded}
        >
          {expanded ? '− Mostrar menos' : `+ Ver salida completa (${lines.length} líneas)`}
        </button>
      )}
    </div>
  );
}
