import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_LAYOUT_PREFS,
  LAYOUT_BOOT_SCRIPT,
  applyLayoutClasses,
  getLayoutPrefs,
  setLayoutPrefs,
  toggleMenu,
  toggleReadingMode,
} from './layout-prefs';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.className = '';
  setLayoutPrefs({ ...DEFAULT_LAYOUT_PREFS });
});

describe('layout-prefs (menús plegables y modo lectura)', () => {
  it('arranca con ambos menús visibles y sin modo lectura', () => {
    expect(getLayoutPrefs()).toEqual({ nav: true, toc: true, reading: false });
  });

  it('plegar un menú deja la clase en <html> y persiste la elección', () => {
    toggleMenu('nav');
    expect(getLayoutPrefs().nav).toBe(false);
    expect(document.documentElement.classList.contains('nav-hidden')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem('layout-prefs') ?? '{}')).toMatchObject({
      nav: false,
    });
  });

  it('el modo lectura no destruye la configuración de los menús', () => {
    toggleMenu('toc');
    toggleReadingMode();
    expect(getLayoutPrefs()).toEqual({ nav: true, toc: false, reading: true });
    expect(document.documentElement.classList.contains('reading-mode')).toBe(true);
    toggleReadingMode();
    expect(getLayoutPrefs()).toEqual({ nav: true, toc: false, reading: false });
  });

  it('el script de arranque aplica las clases antes del primer pintado', () => {
    window.localStorage.setItem(
      'layout-prefs',
      JSON.stringify({ nav: false, toc: false, reading: true }),
    );
    document.documentElement.className = '';
    new Function(LAYOUT_BOOT_SCRIPT)();
    const root = document.documentElement.classList;
    expect(root.contains('nav-hidden')).toBe(true);
    expect(root.contains('toc-hidden')).toBe(true);
    expect(root.contains('reading-mode')).toBe(true);
  });

  it('un valor corrupto en localStorage cae en los valores por defecto', () => {
    window.localStorage.setItem('layout-prefs', '{no es json');
    expect(() => applyLayoutClasses()).not.toThrow();
  });
});
