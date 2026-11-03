'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { COURSE_II_BLOCKS } from '@/lib/course-blocks';
import type { ModuleEntry } from '@/lib/modules';
import { NavCollapseButton } from './LayoutToggles';

interface BlockDef {
  id: string;
  title: string;
  from: number;
  to: number;
}

interface NavigationProps {
  modules: ModuleEntry[];
  blocks: BlockDef[];
}

function NavContent({ modules, blocks, onNavigate }: NavigationProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const hasCourseII = modules.some((m) => m.meta.course === 'II');
  const [course, setCourse] = useState<'I' | 'II'>(() => {
    const slug = pathname.split('/').pop();
    const current = modules.find((m) => m.meta.slug === slug);
    if (current) return current.meta.course;
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('course-level');
      if (saved === 'I' || saved === 'II') return saved;
    }
    return 'I';
  });
  const elegirCurso = (c: 'I' | 'II') => {
    setCourse(c);
    window.localStorage.setItem('course-level', c);
  };

  const shown = modules.filter((m) => m.meta.course === course);
  const shownBlocks = course === 'II' ? [...COURSE_II_BLOCKS] : blocks;

  return (
    <nav aria-label="Índice del curso" className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-4 py-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <span className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={22} height={22} aria-hidden className="shrink-0 rounded-full" />
            <span className="text-sm font-semibold tracking-tight text-ink-900">Datos Epidemiológicos</span>
          </span>
          <span className="mt-1 block text-xs text-ink-600">Escuela de Estadística</span>
        </Link>
        <p className="mt-1 text-xs text-ink-500">UNAL · Medellín</p>
        <Link
          href="/rutas"
          onClick={onNavigate}
          className={clsx(
            'mt-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
            pathname === '/rutas'
              ? 'bg-brand-50 text-brand-700'
              : 'text-brand-600 hover:bg-brand-50',
          )}
        >
          Rutas por perfil →
        </Link>
        {hasCourseII && (
          <div className="mt-3 flex rounded border border-ink-200 p-0.5 text-xs" role="group" aria-label="Nivel del curso">
            {(['I', 'II'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => elegirCurso(c)}
                aria-pressed={course === c}
                className={clsx(
                  'flex-1 rounded px-2 py-1 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
                  course === c ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-ink-100',
                )}
              >
                Curso {c}{c === 'II' ? ' · avanzado' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-20 pt-3">
        {shownBlocks.map((block) => {
          const blockModules = shown.filter(
            (m) => m.meta.order >= block.from && m.meta.order <= block.to
          );
          if (blockModules.length === 0) return null;
          return (
            <div key={block.id} className="mb-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Bloque {block.id} · {block.title}
              </p>
              <ul className="space-y-0.5">
                {blockModules.map((mod) => {
                  const numerar = mod.meta.course === 'II'
                    ? `II-${mod.meta.order - 19}.`
                    : mod.meta.order === 0 ? 'Repaso' : `${mod.meta.order}.`;
                  const href = `/cursos/${mod.meta.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={mod.meta.slug}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'block rounded px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                          active
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                        )}
                      >
                        {numerar}{' '}
                        {mod.meta.title.replace(/^(?:\d+|II-\d+)\.\s*/, '')}
                        {mod.meta.level === 'transversal' && (
                          <span className="ml-1 text-[10px] font-normal uppercase tracking-wide text-ink-400">transversal</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Sidebar de navegación agrupado por bloques (I–IV), con drawer en móvil.
 * Mismo patrón de UX que el Sidebar del curso MLM.
 */
export function Navigation({ modules, blocks }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside
        id="course-nav"
        className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-ink-200 bg-white lg:block"
      >
        <NavCollapseButton />
        <NavContent modules={modules} blocks={blocks} />
      </aside>

      {/* Mobile: botón hamburguesa + drawer */}
      <div className="bb-nav-mobile lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir índice del curso"
          className="fixed left-4 top-4 z-40 rounded border border-ink-200 bg-white p-2 shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-ink-900/40 animate-fade-in"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl animate-slide-in">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar índice"
                className="absolute right-3 top-3 rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
              <NavContent modules={modules} blocks={blocks} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
