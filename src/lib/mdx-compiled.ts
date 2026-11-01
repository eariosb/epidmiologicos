import { statSync } from 'node:fs';
import { join } from 'node:path';
import type { ComponentType } from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import { remarkModuleRefs } from './remark-module-refs';
import { remarkAutoTerms } from './remark-auto-terms';
import { getModuleSource } from './modules';
import { mdxComponents } from '@/components/mdx-components';

/**
 * Compilación de MDX con caché por archivo y mtime.
 *
 * `MDXRemote` recompila el módulo entero en cada petición: remark-math,
 * remark-gfm, remark-auto-terms y sobre todo rehype-katex cuestan varios
 * segundos por módulo, y en `next dev` eso se paga en cada navegación
 * aunque el archivo no haya cambiado. Aquí el resultado se memoriza y la
 * clave incluye la fecha de modificación, así que editar el `.mdx`
 * invalida la entrada. En producción cada página se compila una vez, de
 * modo que el comportamiento no cambia.
 *
 * El elemento compilado se reutiliza entre peticiones. En RSC es una
 * descripción inmutable, así que renderizarlo de nuevo es seguro.
 */

const MODULES_DIR = join(process.cwd(), 'src', 'content', 'modules');

interface Cached {
  mtimeMs: number;
  Content: ComponentType;
}

const cache = new Map<string, Cached>();

export async function compileModule(fileName: string): Promise<ComponentType> {
  const filePath = join(MODULES_DIR, fileName);
  const { mtimeMs } = statSync(filePath);
  const hit = cache.get(filePath);
  if (hit && hit.mtimeMs === mtimeMs) return hit.Content;

  const { content } = await compileMDX({
    source: getModuleSource(fileName),
    components: mdxComponents,
    options: {
      // Contenido local y confiable: permitimos expresiones JSX en los
      // MDX (props de RCell, Quiz, DataTable, etc.).
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkMath, remarkGfm, remarkModuleRefs, remarkAutoTerms],
        rehypePlugins: [rehypeKatex, rehypeSlug],
      },
    },
  });

  const Content: ComponentType = () => content;
  cache.set(filePath, { mtimeMs, Content });
  return Content;
}
