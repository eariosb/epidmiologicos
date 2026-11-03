'use client';

import { useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
import { toggleMenu, toggleReadingMode } from '@/lib/layout-prefs';
import { useLayoutPrefs, useTocPresent } from '@/hooks/useLayoutPrefs';

const TAB =
  'bb-menu-tab fixed top-1/2 z-30 hidden -translate-y-1/2 items-center justify-center border border-ink-200 bg-white/95 py-3 text-ink-400 shadow-sm transition-colors hover:text-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

/**
 * Plegado del índice del curso. El botón vive dentro del propio menú, en su
 * borde, para que se descubra sin buscarlo; al plegarlo queda una pestaña
 * fija en el borde de la ventana, siempre alcanzable.
 */
export function NavCollapseButton() {
  const { nav } = useLayoutPrefs();
  return (
    <button
      type="button"
      onClick={() => toggleMenu('nav')}
      aria-expanded={nav}
      aria-controls="course-nav"
      title="Ocultar el índice del curso (Alt+N)"
      className="bb-menu-toggle absolute -right-3 top-6 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 shadow-sm transition-colors hover:border-brand-300 hover:text-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:flex"
    >
      <ChevronLeft aria-hidden className="h-4 w-4" />
      <span className="sr-only">Ocultar el índice del curso</span>
    </button>
  );
}

/** Plegado de la tabla de contenido del módulo (mismo patrón, lado derecho). */
export function TocCollapseButton() {
  const { toc } = useLayoutPrefs();
  return (
    <button
      type="button"
      onClick={() => toggleMenu('toc')}
      aria-expanded={toc}
      aria-controls="bb-toc"
      title="Ocultar la tabla de contenido (Alt+T)"
      className="bb-menu-toggle absolute -right-3 top-1 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-400 shadow-sm transition-colors hover:border-brand-300 hover:text-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 xl:flex"
    >
      <ChevronRight aria-hidden className="h-4 w-4" />
      <span className="sr-only">Ocultar la tabla de contenido</span>
    </button>
  );
}

/**
 * Controles globales del layout: pestañas de restauración de cada menú y la
 * píldora de modo lectura. Se montan una vez en `AppLayout`, fuera de los
 * menús, porque un menú oculto no puede contener su propio botón de vuelta.
 */
export function LayoutControls() {
  const { nav, toc, reading } = useLayoutPrefs();
  const hasToc = useTocPresent();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === 'l') {
        event.preventDefault();
        toggleReadingMode();
      } else if (key === 'n') {
        event.preventDefault();
        toggleMenu('nav');
      } else if (key === 't') {
        event.preventDefault();
        toggleMenu('toc');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {!reading && !nav && (
        <button
          type="button"
          onClick={() => toggleMenu('nav')}
          aria-expanded={false}
          aria-controls="course-nav"
          title="Mostrar el índice del curso (Alt+N)"
          className={`${TAB} left-0 rounded-r-md border-l-0 px-1.5 lg:flex`}
        >
          <ChevronRight aria-hidden className="h-4 w-4" />
          <span className="sr-only">Mostrar el índice del curso</span>
        </button>
      )}

      {!reading && !toc && hasToc && (
        <button
          type="button"
          onClick={() => toggleMenu('toc')}
          aria-expanded={false}
          aria-controls="bb-toc"
          title="Mostrar la tabla de contenido (Alt+T)"
          className={`${TAB} right-0 rounded-l-md border-r-0 px-1.5 xl:flex`}
        >
          <ChevronLeft aria-hidden className="h-4 w-4" />
          <span className="sr-only">Mostrar la tabla de contenido</span>
        </button>
      )}

      <button
        type="button"
        onClick={toggleReadingMode}
        aria-pressed={reading}
        aria-label={reading ? 'Salir del modo lectura' : 'Activar el modo lectura'}
        title={reading ? 'Salir del modo lectura (Alt+L)' : 'Modo lectura: solo el texto (Alt+L)'}
        className={`bb-reading-pill group fixed bottom-32 right-6 z-40 inline-flex h-9 items-center gap-2 rounded-full border shadow-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
          reading
            ? 'border-brand-300 bg-brand-50 pr-3.5 text-brand-700 hover:bg-brand-100'
            : 'border-ink-200 bg-white/95 pr-2.5 text-ink-500 hover:border-brand-300 hover:text-ink-900 hover:pr-3.5'
        }`}
      >
        {reading ? (
          <Minimize2 aria-hidden className="ml-2.5 h-4 w-4 shrink-0" />
        ) : (
          <BookOpen aria-hidden className="ml-2.5 h-4 w-4 shrink-0" />
        )}
        <span
          className={`whitespace-nowrap text-xs font-medium transition-all duration-200 ${
            reading
              ? 'max-w-[9rem] opacity-100'
              : 'max-w-0 overflow-hidden opacity-0 group-hover:max-w-[9rem] group-hover:opacity-100 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100'
          }`}
        >
          {reading ? 'Salir de lectura' : 'Modo lectura'}
        </span>
      </button>
    </>
  );
}
