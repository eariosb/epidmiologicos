'use client';

import { useEffect, type ReactNode } from 'react';
import { useBlackboardContext } from '@cursos/blackboard';

/**
 * Content column that docks next to the blackboard. When the panel is open
 * (not fullscreen) the column yields 45vw on the left and the prose block
 * widens to a comfortable ~75ch, centered in the remaining space.
 * React-driven (no html class + global CSS) so it cannot silently miss.
 */
export function MainColumn({ children }: Readonly<{ children: ReactNode }>) {
  const { state } = useBlackboardContext();
  const docked = state.isOpen && !state.isFullscreen;

  // Keep <html class="board-docked"> in sync for the CSS-only rules
  // (prose widening, FAB hiding) that live in globals.css.
  useEffect(() => {
    document.documentElement.classList.toggle('board-docked', docked);
    return () => document.documentElement.classList.remove('board-docked');
  }, [docked]);

  return (
    <div
      id="bb-main"
      className={`flex min-w-0 flex-col transition-all duration-300 ${
        docked ? 'md:ml-auto md:w-[40vw] md:flex-none' : 'flex-1'
      }`}
    >
      <main className={`flex-1 py-8 ${docked ? 'px-4' : 'px-4 sm:px-8 lg:px-12'}`}>
        <div className={`mx-auto ${docked ? 'max-w-none' : 'max-w-6xl'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
