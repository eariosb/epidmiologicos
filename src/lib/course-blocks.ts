/**
 * Constantes de estructura de los cursos, puras y sin dependencias de
 * Node: seguras para importar desde componentes cliente (Navigation)
 * y servidor (páginas, modules.ts) por igual.
 */

/** Bloques temáticos del Curso I (agrupan los módulos en el sidebar). */
export const COURSE_BLOCKS = [
  { id: '0', title: 'Antes de empezar: repaso', from: 0, to: 0 },
  { id: 'I', title: 'Diseño, medidas e inferencia en la tabla 2×2', from: 1, to: 6 },
  { id: 'II', title: 'Confusión e interacción', from: 7, to: 10 },
  { id: 'III', title: 'Cohortes y supervivencia', from: 11, to: 13 },
  { id: 'IV', title: 'Casos y controles', from: 14, to: 15 },
  { id: 'V', title: 'Modelación y síntesis', from: 16, to: 17 },
  { id: 'VI', title: 'Herramientas y fronteras (transversal)', from: 18, to: 19 },
] as const;

/** Bloques temáticos del Curso II (avanzado; orders 20–39). */
export const COURSE_II_BLOCKS = [
  { id: 'II-A', title: 'Fundamentos avanzados', from: 20, to: 24 },
  { id: 'II-B', title: 'Vigilancia, síntesis y decisión', from: 25, to: 28 },
  { id: 'II-C', title: 'Práctica de campo', from: 29, to: 39 },
] as const;

export function blocksForCourse(course: 'I' | 'II') {
  return course === 'II' ? COURSE_II_BLOCKS : COURSE_BLOCKS;
}

export function blockForOrder(order: number, course: 'I' | 'II' = 'I') {
  const blocks = blocksForCourse(course);
  return blocks.find((b) => order >= b.from && order <= b.to) ?? blocks[0];
}
