import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import {
  getAllModules,
  findModule,
  getModuleSource,
  getAdjacentModules,
  blockForOrder,
} from '@/lib/modules';
import { remarkModuleRefs } from '@/lib/remark-module-refs';
import { remarkAutoTerms } from '@/lib/remark-auto-terms';
import { mdxComponents } from '@/components/mdx-components';
import { TableOfContents } from '@/components/TableOfContents';
import { AppLayout } from '@/components/AppLayout';
import { SessionTracker } from '@/components/SessionTracker';
import { PresentationSync } from '@/components/PresentationSync';
import { RemoteCursor } from '@/components/RemoteCursor';
import { BlackboardContextBridge } from '@cursos/blackboard';
import type { ModuleContext } from '@cursos/blackboard';
import { EPI_ASSISTANT_PROFILE } from '@/config/assistant';

export function generateStaticParams() {
  return getAllModules().map((mod) => ({ slug: mod.meta.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findModule(slug);
  if (!entry) notFound();

  const source = getModuleSource(entry.fileName);
  const { prev, next } = getAdjacentModules(slug);
  const block = blockForOrder(entry.meta.order, entry.meta.course);
  const modules = getAllModules(entry.meta.course);

  const THREADS = {
    precision: 'Hilo: precisión y calibración',
    diseno: 'Hilo: diseño',
    campo: 'Hilo: trabajo de campo',
  } as const;

  const moduleContext: ModuleContext = {
    slug: entry.meta.slug,
    title: entry.meta.title,
    objective: [entry.meta.objective],
    datasets: entry.meta.datasets,
    order: entry.meta.order,
  };

  return (
    <AppLayout>
      <BlackboardContextBridge context={moduleContext} profile={EPI_ASSISTANT_PROFILE} />
      <SessionTracker slug={entry.meta.slug} title={entry.meta.title} />
      <PresentationSync />

      <div className="mx-auto flex max-w-6xl justify-center gap-8">
        <article className="min-w-0 max-w-3xl flex-1">
          <header className="mb-8 border-b border-ink-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Bloque {block.id} · {block.title} ·{' '}
              {entry.meta.course === 'II'
                ? `Curso II · Módulo II-${entry.meta.order - 19}`
                : entry.meta.order === 0
                  ? 'Repaso'
                  : `Módulo ${entry.meta.order} de ${modules.filter((m) => m.meta.order > 0).length}`}
            </p>
            {(entry.meta.thread || entry.meta.level === 'transversal') && (
              <p className="mt-1 flex gap-2 text-xs">
                {entry.meta.level === 'transversal' && (
                  <span className="rounded-full border border-ink-200 px-2 py-0.5 text-ink-500">navegación profesional</span>
                )}
                {entry.meta.thread && (
                  <span className="rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-brand-700">
                    {THREADS[entry.meta.thread]}
                  </span>
                )}
              </p>
            )}
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900">
              {entry.meta.title.replace(/^\d+\.\s*/, '')}
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">{entry.meta.objective}</p>
            {entry.meta.datasets.length > 0 && (
              <p className="mt-3 text-sm text-ink-500">
                <span className="font-medium uppercase tracking-wide">Datos:</span>{' '}
                {entry.meta.datasets.join(', ')}
              </p>
            )}
          </header>

          <div className="prose prose-ink max-w-none prose-headings:scroll-mt-20 prose-headings:text-ink-900 prose-h2:mt-10 prose-h2:border-t prose-h2:border-ink-100 prose-h2:pt-7 prose-blockquote:border-brand-300 prose-blockquote:font-display prose-blockquote:text-ink-700 prose-a:text-brand-600 prose-code:rounded prose-code:bg-code prose-code:text-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-pre:bg-code prose-pre:text-gray-100">
            <MDXRemote
              source={source}
              components={mdxComponents}
              options={{
                // Contenido local y confiable: permitimos expresiones JSX en
                // los MDX (props de CodeBlock, Quiz, DataTable, etc.).
                blockJS: false,
                mdxOptions: {
                  remarkPlugins: [remarkMath, remarkGfm, remarkModuleRefs, remarkAutoTerms],
                  rehypePlugins: [rehypeKatex, rehypeSlug],
                },
              }}
            />
          </div>

          {entry.meta.attr && (
            <p className="mt-8 border-t border-ink-100 pt-3 text-xs italic text-ink-500">
              {entry.meta.attr}
            </p>
          )}

          <nav aria-label="Navegación entre módulos" className="mt-12 flex justify-between gap-4 border-t border-ink-200 pt-6">
            {prev ? (
              <Link
                href={`/cursos/${prev.meta.slug}`}
                className="rounded border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-700 shadow-sm transition-all hover:border-brand-300 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                ← {prev.meta.order === 0 ? 'Repaso' : `${prev.meta.order}.`}{' '}
                {prev.meta.title.replace(/^\d+\.\s*/, '')}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/cursos/${next.meta.slug}`}
                className="rounded border border-ink-200 bg-white px-4 py-2.5 text-right text-sm text-ink-700 shadow-sm transition-all hover:border-brand-300 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {next.meta.order === 0 ? 'Repaso' : `${next.meta.order}.`}{' '}
                {next.meta.title.replace(/^\d+\.\s*/, '')} →
              </Link>
            )}
          </nav>
        </article>

        <div id="bb-toc" className="hidden shrink-0 xl:block">
          <TableOfContents />
        </div>
      </div>

      <RemoteCursor />
    </AppLayout>
  );
}
