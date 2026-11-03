/**
 * Presencia de la tabla de contenido en la página actual.
 *
 * El TOC solo existe en las páginas de módulo y desaparece cuando hay menos
 * de dos encabezados. La pestaña que lo restaura vive fuera de él, así que
 * necesita saber si hay algo que restaurar. Se resuelve con un registro
 * explícito (no leyendo el DOM): en App Router la página se monta en un
 * límite de Suspense y puede hacerlo después que los controles de layout.
 */

let tocPresent = false;
const listeners = new Set<() => void>();

export function getTocPresent(): boolean {
  return tocPresent;
}

export function subscribeTocPresent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTocPresent(next: boolean): void {
  if (next === tocPresent) return;
  tocPresent = next;
  listeners.forEach((listener) => listener());
}
