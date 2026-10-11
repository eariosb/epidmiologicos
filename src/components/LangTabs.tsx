'use client';

import { type ReactNode, useState } from 'react';
import { SimGuide } from '@/components/SimBits';

const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const PRE =
  'mt-2 overflow-x-auto rounded bg-ink-900 p-3 font-mono text-xs leading-relaxed text-ink-100';

type Lang = 'r' | 'sas' | 'py';

const LANG_META: Record<Lang, { label: string; badge: string }> = {
  r: { label: 'R', badge: 'referencia; las celdas R del módulo ejecutan vía WebR' },
  sas: { label: 'SAS', badge: 'traducción de referencia; ejecutar en SAS local / ODA' },
  py: { label: 'Python', badge: 'traducción de referencia; ejecutar localmente' },
};

interface LangTabsProps {
  title?: ReactNode;
  /** El estimando/tarea epidemiológica que traducen los tres bloques. */
  task?: ReactNode;
  rCode?: string;
  sasCode?: string;
  pyCode?: string;
  /** Advertencia de equivalencia: diferencias de defaults, referencias, IC. */
  trap?: ReactNode;
  guide?: ReactNode;
  note?: ReactNode;
}

/**
 * Traductor R/SAS/Python curado: muestra la MISMA tarea epidemiológica
 * en los tres lenguajes. No promete equivalencia exacta: `trap` documenta
 * las diferencias de convención (orientación de la tabla, categoría de
 * referencia, método del IC) que hacen que "traducir" sea un ejercicio
 * estadístico y no solo sintáctico.
 */
export function LangTabs({
  title,
  task,
  rCode,
  sasCode,
  pyCode,
  trap,
  guide,
  note,
}: LangTabsProps) {
  const [lang, setLang] = useState<Lang>('r');
  const code: Record<Lang, string | undefined> = {
    r: rCode,
    sas: sasCode,
    py: pyCode,
  };
  const available = (Object.keys(code) as Lang[]).filter((k) => code[k]);
  return (
    <figure className={FIG}>
      <div className={CAPTION}>{title ?? 'La misma tarea, tres lenguajes'}</div>
      {task && <p className="mb-2 text-xs text-ink-600">{task}</p>}
      <div className="flex flex-wrap gap-2">
        {available.map((k) => (
          <button
            key={k}
            onClick={() => setLang(k)}
            className={
              lang === k
                ? 'rounded bg-brand-600 px-3 py-1 text-xs font-medium text-white'
                : 'rounded border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:bg-ink-100'
            }
          >
            {LANG_META[k].label}
          </button>
        ))}
        <span className="ml-auto self-center text-[11px] italic text-ink-500">
          {LANG_META[lang].badge}
        </span>
      </div>
      <pre className={PRE}>
        <code>{code[lang]}</code>
      </pre>
      {trap && (
        <p className="mt-2 rounded bg-warning-50 p-2 text-xs text-warning-900">
          <strong>Trampa común:</strong> {trap}
        </p>
      )}
      {guide && <SimGuide>{guide}</SimGuide>}
      {note && <p className={NOTE}>{note}</p>}
    </figure>
  );
}
