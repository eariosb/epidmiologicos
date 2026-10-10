import { NextResponse } from 'next/server';
import { getAllModules, getModuleSource } from '@/lib/modules';
import { bibliographyToDocs } from '@/lib/rag/bibliography';
import type { RagDoc } from '@cursos/blackboard/rag';

export const dynamic = 'force-dynamic';

function stripMdx(text: string): string {
  return (
    text
      // fenced code blocks (```r ... ```)
      .replace(/```[\s\S]*?```/g, ' ')
      // JSX props carrying executable code as template literals: code={`...`}
      // (must go before tag stripping: R code contains '>' and '->' that
      // would prematurely close the <[^>]+> pass and leak code into BM25)
      .replace(/\{`[\s\S]*?`\}/g, ' ')
      // inline math before tags so $<...$ isn't eaten as a "tag"
      .replace(/\$[^$]*\$/g, ' ')
      // remaining JSX expressions {...}: keep the inner quoted strings
      // (quiz options, explanations, flashcard backs, lab steps are content)
      .replace(/\{[^{}]*\}/g, (m) => {
        const strs = [...m.matchAll(/"([^"]*)"|'([^']*)'/g)].map((x) => x[1] ?? x[2]);
        return strs.length > 0 ? ` ${strs.join(' ')} ` : ' ';
      })
      // JSX/MDX tags (what's left of them)
      .replace(/<[^>]+>/g, ' ')
      .replace(/<\/[A-Za-z]+>/g, ' ')
      // images
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      // markdown links: keep the anchor text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Splits one module's MDX source into one RagDoc per `##` section.
 */
function moduleToDocs(moduleSlug: string, order: number, source: string): RagDoc[] {
  const parts = source.split(/^##\s+/m);
  const docs: RagDoc[] = [];
  parts.forEach((part, i) => {
    if (i === 0) return; // content before first ## (intro/front area)
    const newline = part.indexOf('\n');
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const body = stripMdx(newline === -1 ? '' : part.slice(newline));
    if (body.length < 30) return;
    docs.push({
      id: `mod:${moduleSlug}:${slugify(heading)}`,
      source: 'module',
      text: `${heading}. ${body}`,
      meta: { moduleSlug, sectionAnchor: `#${slugify(heading)}`, order, heading },
    });
  });
  return docs;
}

/**
 * GET /api/rag-corpus → serialized RagDoc[] for the client-side BM25 index.
 * Server-only: module sources live on the filesystem.
 */
export async function GET() {
  const docs: RagDoc[] = [];
  for (const entry of getAllModules()) {
    const { slug, order } = entry.meta;
    docs.push(...moduleToDocs(slug, order, getModuleSource(entry.fileName)));
  }
  docs.push(...bibliographyToDocs());
  return NextResponse.json({ docs });
}
