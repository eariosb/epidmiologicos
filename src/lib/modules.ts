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
  order: z.number().int().min(0).max(39),
  datasets: z.array(z.string()).default([]),
  duration: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
  /** Curso I (pregrado) o Curso II (avanzado). */
  course: z.enum(['I', 'II']).default('I'),
  /** Capa de navegación: núcleo obligatorio, transversal (18-19, navegación
   * profesional) o avanzado (Curso II). */
  level: z.enum(['nucleo', 'transversal', 'avanzado']).default('nucleo'),
  /** Línea de atribución académica, se renderiza al pie del módulo. */
  attr: z.string().optional(),
  /** Perfiles profesionales a los que el módulo sirve como núcleo. */
  profiles: z.array(z.enum(['vigilancia', 'clinico', 'politica'])).default([]),
  /** Perfiles para los que el módulo es profundización prioritaria. */
  profilesDeep: z.array(z.enum(['vigilancia', 'clinico', 'politica'])).default([]),
  /** Hilo transversal de la secuencia (se muestra como badge). */
  thread: z.enum(['precision', 'diseno', 'campo']).optional(),
});

export type ModuleMeta = z.infer<typeof moduleMetaSchema>;

export interface ModuleEntry {
  meta: ModuleMeta;
  fileName: string;
}

// Las constantes de bloques viven en course-blocks.ts (puro, sin node:*,
// importable desde componentes cliente). Se re-exportan por compatibilidad.
export {
  COURSE_BLOCKS,
  COURSE_II_BLOCKS,
  blocksForCourse,
  blockForOrder,
} from './course-blocks';

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

/** Todos los módulos, ordenados por `order`. Con `course` filtra por nivel. */
export function getAllModules(course?: 'I' | 'II'): ModuleEntry[] {
  // En dev no se cachea: el frontmatter puede cambiar sin reiniciar el server.
  if (cachedEntries && process.env.NODE_ENV === 'production') return cachedEntries;
  const files = readdirSync(MODULES_DIR).filter((f) => f.endsWith('.mdx'));
  const entries = files.map(readModuleFile);
  entries.sort((a, b) => a.meta.order - b.meta.order);
  cachedEntries = entries;
  return course ? entries.filter((e) => e.meta.course === course) : entries;
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

/** Módulos anterior/siguiente relativo a un slug, por `order`, dentro del
 * mismo curso (I o II). */
export function getAdjacentModules(slug: string): AdjacentModules {
  const entry = findModule(slug);
  if (!entry) return {};
  const modules = getAllModules(entry.meta.course);
  const idx = modules.findIndex((e) => e.meta.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? modules[idx - 1] : undefined,
    next: idx < modules.length - 1 ? modules[idx + 1] : undefined,
  };
}
