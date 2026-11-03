/**
 * Preferencias de layout: qué menús laterales están visibles y si el modo
 * lectura está activo.
 *
 * Vive fuera de React (store mínimo con `useSyncExternalStore`) porque los
 * botones que lo consumen están en árboles distintos: el índice del curso,
 * el TOC del módulo y la píldora de modo lectura. Las clases se aplican a
 * `<html>` para que el CSS decida qué se oculta, sin remontar el contenido
 * ni perder el scroll al plegar un menú.
 *
 * `reading` es un estado de superposición, no destructivo: no cambia `nav`
 * ni `toc`, así que al salir se recupera exactamente la vista anterior.
 */

export interface LayoutPrefs {
  /** Índice del curso visible (escritorio). */
  nav: boolean;
  /** Tabla de contenido del módulo visible. */
  toc: boolean;
  /** Modo lectura: sin menús, sin FABs, medida de línea cómoda. */
  reading: boolean;
}

export const DEFAULT_LAYOUT_PREFS: LayoutPrefs = { nav: true, toc: true, reading: false };

const STORAGE_KEY = 'layout-prefs';

function readStored(): LayoutPrefs {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT_PREFS;
    const parsed = JSON.parse(raw) as Partial<LayoutPrefs>;
    return {
      nav: parsed.nav !== false,
      toc: parsed.toc !== false,
      reading: parsed.reading === true,
    };
  } catch {
    return DEFAULT_LAYOUT_PREFS;
  }
}

let prefs: LayoutPrefs = readStored();
const listeners = new Set<() => void>();

export function getLayoutPrefs(): LayoutPrefs {
  return prefs;
}

export function subscribeLayoutPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Refleja el estado en `<html>`; el CSS hace el resto. */
export function applyLayoutClasses(next: LayoutPrefs = prefs): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.classList;
  root.toggle('nav-hidden', !next.nav);
  root.toggle('toc-hidden', !next.toc);
  root.toggle('reading-mode', next.reading);
}

export function setLayoutPrefs(patch: Partial<LayoutPrefs>): void {
  const next = { ...prefs, ...patch };
  if (next.nav === prefs.nav && next.toc === prefs.toc && next.reading === prefs.reading) {
    return;
  }
  prefs = next;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento la preferencia dura la sesión; no es crítico.
    }
  }
  applyLayoutClasses(next);
  listeners.forEach((listener) => listener());
}

/** Alterna un menú conservando el resto de preferencias. */
export function toggleMenu(menu: 'nav' | 'toc'): void {
  setLayoutPrefs({ [menu]: !prefs[menu] } as Partial<LayoutPrefs>);
}

export function toggleReadingMode(): void {
  setLayoutPrefs({ reading: !prefs.reading });
}

/**
 * Script de arranque: aplica las clases antes del primer pintado para que
 * una recarga con los menús plegados no muestre un parpadeo. Es la misma
 * lógica que `applyLayoutClasses`, en versión serializable.
 */
export const LAYOUT_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}');var c=document.documentElement.classList;if(p.nav===false)c.add('nav-hidden');if(p.toc===false)c.add('toc-hidden');if(p.reading===true)c.add('reading-mode');}catch(e){}})();`;
