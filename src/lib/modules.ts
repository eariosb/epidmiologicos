import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

/**
 * Punto de entrada único para resolver el contenido del curso desde
 * `src/content/modules/*.mdx` (mismo patrón DIP que el curso MLM:
 * las páginas dependen de este módulo, no del filesystem).
 *
 * El frontmatter se valida con Zod: un módulo con metadatos incompletos
 * rompe el build, no la experiencia del estudiante.
 */

const MODULES_DIR = join(process.cwd(), 'src', 'content', 'modules');

export const moduleMetaSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  objective: z.string().min(1),
  order: z.number().int().min(1).max(16),
  datasets: z.array(z.string()).default([]),
  duration: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
});

export type ModuleMeta = z.infer<typeof moduleMetaSchema>;

export interface ModuleEntry {
  meta: ModuleMeta;
  fileName: string;
}

/** Bloques temáticos del curso (agrupan los módulos en el sidebar). */
export const COURSE_BLOCKS = [
  { id: 'I', title: 'Fundamentos, Markov y simulación', from: 1, to: 4 },
  { id: 'II', title: 'Segundo orden, Poisson y martingalas', from: 5, to: 8 },
  { id: 'III', title: 'Ruido Wiener, Itô y EDE', from: 9, to: 12 },
  { id: 'IV', title: 'Riesgo, crédito y síntesis', from: 13, to: 16 },
] as const;

export function blockForOrder(order: number) {
  return COURSE_BLOCKS.find((b) => order >= b.from && order <= b.to) ?? COURSE_BLOCKS[0];
}

let cachedEntries: ModuleEntry[] | null = null;

function readModuleFile(fileName: string): ModuleEntry {
  const raw = readFileSync(join(MODULES_DIR, fileName), 'utf-8');
  const { data } = matter(raw);
  const parsed = moduleMetaSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Frontmatter inválido en ${fileName}: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`
    );
  }
  return { meta: parsed.data, fileName };
}

/** Todos los módulos, ordenados por `order`. */
export function getAllModules(): ModuleEntry[] {
  if (cachedEntries) return cachedEntries;
  const files = readdirSync(MODULES_DIR).filter((f) => f.endsWith('.mdx'));
  const entries = files.map(readModuleFile);
  entries.sort((a, b) => a.meta.order - b.meta.order);
  cachedEntries = entries;
  return entries;
}

/** Busca un módulo por su `slug`. */
export function findModule(slug: string): ModuleEntry | undefined {
  return getAllModules().find((entry) => entry.meta.slug === slug);
}

/** Fuente MDX cruda (sin frontmatter) de un módulo. */
export function getModuleSource(fileName: string): string {
  const raw = readFileSync(join(MODULES_DIR, fileName), 'utf-8');
  const { content } = matter(raw);
  return content;
}

export interface AdjacentModules {
  prev?: ModuleEntry;
  next?: ModuleEntry;
}

/** Módulos anterior/siguiente relativo a un slug, por `order`. */
export function getAdjacentModules(slug: string): AdjacentModules {
  const modules = getAllModules();
  const idx = modules.findIndex((entry) => entry.meta.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? modules[idx - 1] : undefined,
    next: idx < modules.length - 1 ? modules[idx + 1] : undefined,
  };
}
