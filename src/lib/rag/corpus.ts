import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllModules, getModuleSource } from '@/lib/modules';
import { bibliographyToDocs } from '@/lib/rag/bibliography';
import { ANEXOS } from '@/lib/anexos';
import type { RagDoc } from '@cursos/blackboard/rag';

export function stripMdx(text: string): string {
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
 * Extracts every <Quiz> in the module as its own RagDoc (source 'quiz'):
 * question + options + explanation, with the correct option marked.
 * Quiz bodies are assessment content the assistant should be able to
 * retrieve verbatim when a student asks about a checkpoint question.
 */
function quizToDocs(moduleSlug: string, order: number, source: string): RagDoc[] {
  const docs: RagDoc[] = [];
  const re = /<Quiz\s+([\s\S]*?)\/>/g;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(source)) !== null) {
    idx += 1;
    const block = m[1];
    const question = /question="([^"]*)"/.exec(block)?.[1] ?? '';
    const explanation = /explanation="([^"]*)"/.exec(block)?.[1] ?? '';
    const correctIndex = Number(/correctIndex=\{(\d+)\}/.exec(block)?.[1] ?? NaN);
    const optBlock = /options=\{\[([\s\S]*?)\]\}/.exec(block)?.[1] ?? '';
    const options = [...optBlock.matchAll(/"([^"]*)"/g)].map((x) => x[1]);
    const correct = Number.isInteger(correctIndex) ? options[correctIndex] : undefined;
    const text = [
      `Pregunta de autoevaluación: ${question}`,
      options.length > 0 ? `Opciones: ${options.join(' | ')}` : '',
      correct ? `Respuesta correcta: ${correct}` : '',
      explanation ? `Explicación: ${explanation}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (text.length < 30) continue;
    docs.push({
      id: `quiz:${moduleSlug}:${idx}`,
      source: 'quiz',
      text,
      meta: { moduleSlug, order, question },
    });
  }
  return docs;
}

/**
 * Annex docs: one entry per manifest item, plus one doc per `##`/`###`
 * section of each Markdown annex so the essay and the audit are
 * retrievable by content, not only by title. Server-only: files live in
 * public/anexos.
 */
function anexosToDocs(): RagDoc[] {
  const docs: RagDoc[] = [];
  for (const a of ANEXOS) {
    docs.push({
      id: `anexo:${a.id}`,
      source: 'anexo',
      text: `${a.titulo}. ${a.descripcion}${a.autores ? ` ${a.autores}` : ''}`,
      meta: { anexoId: a.id, tipo: a.tipo, modulo: a.modulo, archivo: a.archivo },
    });
    if (!a.archivo.endsWith('.md')) continue;
    let raw: string;
    try {
      raw = readFileSync(join(process.cwd(), 'public', 'anexos', a.archivo), 'utf8');
    } catch {
      continue;
    }
    const parts = raw.split(/^#{2,3}\s+/m);
    parts.forEach((part, i) => {
      const newline = part.indexOf('\n');
      const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
      const body = stripMdx(newline === -1 ? '' : part.slice(newline));
      if (body.length < 30) return;
      docs.push({
        id: `anexo:${a.id}:${i}`,
        source: 'anexo',
        text: `${a.titulo} — ${heading || 'introducción'}. ${body}`,
        meta: { anexoId: a.id, tipo: a.tipo, modulo: a.modulo, archivo: a.archivo, heading },
      });
    });
  }
  return docs;
}

/**
 * Builds the full retrievable corpus: one doc per module section, one per
 * quiz, one per bibliography entry, plus the annexes. Server-only:
 * module sources live on the filesystem.
 */
export function buildCorpus(): RagDoc[] {
  const docs: RagDoc[] = [];
  for (const entry of getAllModules()) {
    const { slug, order } = entry.meta;
    const source = getModuleSource(entry.fileName);
    docs.push(...moduleToDocs(slug, order, source));
    docs.push(...quizToDocs(slug, order, source));
  }
  docs.push(...bibliographyToDocs());
  docs.push(...anexosToDocs());
  return docs;
}
