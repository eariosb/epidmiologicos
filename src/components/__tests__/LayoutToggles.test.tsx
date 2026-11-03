import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LayoutControls, NavCollapseButton, TocCollapseButton } from '../LayoutToggles';
import { DEFAULT_LAYOUT_PREFS, setLayoutPrefs } from '@/lib/layout-prefs';
import { setTocPresent } from '@/lib/layout-slots';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  setLayoutPrefs({ ...DEFAULT_LAYOUT_PREFS });
  // La página de módulo declara su TOC al montarse.
  setTocPresent(true);
});

describe('LayoutToggles (plegado de menús y modo lectura)', () => {
  it('el botón del índice pliega el menú y aparece la pestaña de vuelta', () => {
    render(
      <>
        <NavCollapseButton />
        <LayoutControls />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ocultar el índice del curso/i }));
    expect(document.documentElement.classList.contains('nav-hidden')).toBe(true);
    const back = screen.getByRole('button', { name: /Mostrar el índice del curso/i });
    fireEvent.click(back);
    expect(document.documentElement.classList.contains('nav-hidden')).toBe(false);
  });

  it('el botón del TOC se comporta igual en el lado derecho', () => {
    render(
      <>
        <TocCollapseButton />
        <LayoutControls />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ocultar la tabla de contenido/i }));
    expect(document.documentElement.classList.contains('toc-hidden')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Mostrar la tabla de contenido/i }));
    expect(document.documentElement.classList.contains('toc-hidden')).toBe(false);
  });

  it('la píldora alterna el modo lectura y anuncia su estado', () => {
    render(<LayoutControls />);
    const pill = screen.getByRole('button', { name: /Modo lectura/i });
    expect(pill).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(pill);
    expect(document.documentElement.classList.contains('reading-mode')).toBe(true);
    expect(screen.getByRole('button', { name: /Salir del modo lectura/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('en modo lectura no se ofrecen las pestañas de menú', () => {
    setLayoutPrefs({ nav: false, toc: false, reading: true });
    render(<LayoutControls />);
    expect(screen.queryByRole('button', { name: /Mostrar el índice/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mostrar la tabla/i })).not.toBeInTheDocument();
  });
});
