'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TableOfContents } from 'lucide-react';

export interface ModuleNavItem {
  slug: string;
  title: string;
  order: number;
}

export interface ModuleBlock {
  id: string;
  title: string;
  from: number;
  to: number;
}

interface ModulesMenuProps {
  modules: ModuleNavItem[];
  blocks: readonly ModuleBlock[];
}

/**
 * Collapsible course-chapter menu for the board toolbar: when the panel is
 * docked the sidebar is hidden, so this dropdown keeps module navigation one
 * click away without closing the board.
 */
export function ModulesMenu({ modules, blocks }: ModulesMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const currentSlug = pathname?.split('/').filter(Boolean).pop() ?? '';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
        title="Ir a otro módulo del curso"
      >
        <TableOfContents aria-hidden className="h-3.5 w-3.5" />
        Módulos
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Módulos del curso"
          className="absolute right-0 top-full z-[120] mt-1 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg dark:border-ink-700 dark:bg-ink-800"
        >
          {blocks.map((block) => {
            const items = modules.filter(
              (m) => m.order >= block.from && m.order <= block.to,
            );
            if (items.length === 0) return null;
            return (
              <div key={block.id}>
                <p className="px-3 pb-0.5 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                  {block.id} · {block.title}
                </p>
                <ul>
                  {items.map((m) => {
                    const active = m.slug === currentSlug;
                    return (
                      <li key={m.slug}>
                        <Link
                          href={`/cursos/${m.slug}`}
                          role="menuitem"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setOpen(false)}
                          className={`block truncate px-3 py-1.5 text-xs transition-colors ${
                            active
                              ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : 'text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-700'
                          }`}
                        >
                          {m.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <div className="border-t border-ink-200 px-1 pb-1 pt-1 dark:border-ink-700">
            <Link
              href="/anexos"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block truncate px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-700"
            >
              Anexos del curso
            </Link>
            <Link
              href="/bibliografia"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block truncate px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-700"
            >
              Bibliografía y lecturas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
