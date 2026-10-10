import type { ReactNode } from 'react';

/**
 * Acordeón colapsado con la traducción SAS del ejemplo R que precede.
 * <details> nativo: colapsado por defecto, sin JS.
 * SAS no se ejecuta en el navegador — el badge lo deja explícito:
 * es código de referencia para correr en SAS local / SAS OnDemand.
 */
export function SasBlock({ code, note }: { code: string; note?: ReactNode }) {
  return (
    <details className="my-3 rounded border border-slate-300 bg-slate-50">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
        Ver equivalente en SAS
        <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-normal italic text-slate-600">
          referencia; ejecutar en SAS local / OnDemand
        </span>
      </summary>
      <pre className="mx-3 mb-3 overflow-x-auto rounded bg-ink-900 p-3 font-mono text-xs leading-relaxed text-ink-100">
        <code>{code}</code>
      </pre>
      {note && (
        <p className="mx-3 mb-3 text-xs text-slate-600">{note}</p>
      )}
    </details>
  );
}
