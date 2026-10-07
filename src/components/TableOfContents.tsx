'use client';

import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  /** Headings extracted from the MDX content. If not provided, auto-detects from the DOM. */
  headings?: TocHeading[];
}

/**
 * Mini-menú lateral derecho (sticky) para navegación intra-módulo.
 * Extrae automáticamente los headings (h2, h3) del contenido renderizado
 * y resalta la sección visible mediante IntersectionObserver.
 *
 * Diseñado para módulos extensos donde el usuario necesita orientación
 * constante sobre su posición dentro del contenido.
 */
export function TableOfContents({ headings: propHeadings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<TocHeading[]>(propHeadings ?? []);

  // Auto-detect headings from the article content if not provided via props
  useEffect(() => {
    if (propHeadings && propHeadings.length > 0) return;

    const article = document.querySelector('article');
    if (!article) return;

    const elements = Array.from(
      article.querySelectorAll('h2, h3')
    ) as HTMLElement[];

    const detected: TocHeading[] = elements
      .filter((el) => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent?.replace(/^#\s*/, '') ?? '',
        level: el.tagName === 'H2' ? 2 : 3,
      }));

    setHeadings(detected);
  }, [propHeadings]);

  // Track active heading with IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that is most visible and intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const visibleHeadings = useMemo(
    () => headings.filter((h) => h.text.length > 0),
    [headings]
  );

  if (visibleHeadings.length < 2) return null;

  return (
    <nav
      aria-label="Contenido del módulo"
      className="sticky top-8 hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto xl:block"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
        En este módulo
      </p>
      <ul className="space-y-1 border-l border-ink-200">
        {visibleHeadings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(h.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(h.id);
                }
              }}
              className={clsx(
                'block border-l-2 py-1 text-sm transition-colors',
                h.level === 2 ? 'pl-3' : 'pl-6 text-xs',
                activeId === h.id
                  ? 'border-accent-600 font-medium text-accent-700'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
