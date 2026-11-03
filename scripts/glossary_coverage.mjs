// Cobertura del glosario: lista las siglas y símbolos que aparecen en la
// prosa de los módulos (mismos nodos que enlaza remark-auto-terms) y que
// no tienen entrada ni alias en src/lib/glossary.ts.
// Uso: pnpm check:glossary   (tsx scripts/glossary_coverage.mjs [--all])
// Sale con código 1 si queda alguna sigla sin entrada.
import fs from 'node:fs';
import path from 'node:path';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { GLOSSARY, GLOSSARY_ALIASES, GLOSSARY_FORMS } from '../src/lib/glossary.ts';

const dir = 'src/content/modules';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort();
const SKIP = new Set(['code', 'inlineCode', 'html', 'link', 'linkReference', 'definition',
  'heading', 'inlineMath', 'math', 'mdxTextExpression', 'mdxFlowExpression', 'yaml']);
const known = new Set([
  ...Object.keys(GLOSSARY),
  ...Object.keys(GLOSSARY_ALIASES),
  ...Object.keys(GLOSSARY_FORMS),
]);
// No son siglas a definir: referencias a módulos (M3, que enlaza otro
// plugin), numerales romanos, palabras en mayúsculas por énfasis, partes
// de un formato de fecha y palabras clave de SAS escritas en prosa.
const IGNORE_RE = /^(M\d{1,2}|II|ES|US|DD|MM|E9|R1|ONE|COLA|LOGISTIC|GENMOD|MODEL|MIXED|CHISQ|MEASURES|RELRISK|TREND|IMPORT|FREQ|EXACT|STRATA|REPEATED)$/;
// Símbolos de varios sentidos: se marcan a mano con la clave del sentido
// (<Term k="β-SIR">β</Term>); aquí solo se reportan con --all.
const MANUAL_RE = /^[βγδθμπΔεΣ]/u;

const SIGLA = /(?<![\p{L}\p{N}_\-./])([A-ZÁÉÍÓÚÑ](?:[A-ZÁÉÍÓÚÑ0-9]|[a-z](?=[A-Z])){1,}[a-z]?)(?![\p{L}\p{N}_])/gu;
const SIMBOLO = /(?<![\p{L}\p{N}])([\p{Script=Greek}](?:[²³₀-₉ᵢⱼₖ]|\^?2)?|[A-Za-z][₀-₉ᵢⱼₖ]+|[A-Z]²)(?![\p{L}\p{N}])/gu;
// Autor citado: «Molinero (2001)», «Rothman, Greenland y Lash (2008)»,
// «Perondi et al. (2004)». Es la señal limpia de un nombre propio que
// merece entrada: si el curso lo cita, el lector puede querer saber quién es.
const AUTOR = /([A-ZÁÉÍÓÚÑ][a-záéíóúñü]+(?:[ –-][A-ZÁÉÍÓÚÑ][a-záéíóúñü]+)?)(?:\s+et\s+al\.?)?\s*\((?:1[89]|20)\d{2}[a-z]?\)/gu;

const hits = new Map(); // token -> { n, mods:Set, kind }
function add(tok, mod, kind = 'sigla') {
  const h = hits.get(tok) ?? { n: 0, mods: new Set(), kind };
  h.n++; h.mods.add(mod); hits.set(tok, h);
}

function collector(mod) {
  return () => (tree) => {
    const walk = (node) => {
      if (!node) return;
      if (SKIP.has(node.type)) return;
      if ((node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') && node.name === 'Term') return;
      if (node.type === 'text' && node.value) {
        for (const m of node.value.matchAll(SIGLA)) add(m[1], mod);
        for (const m of node.value.matchAll(SIMBOLO)) add(m[1], mod);
        for (const m of node.value.matchAll(AUTOR)) add(m[1], mod, 'autor');
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

const stub = () => null;
const components = new Proxy({}, { get: () => stub, has: () => true });
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf-8').replace(/\r\n/g, '\n');
  const source = raw.replace(/^---[\s\S]*?---\n/, '');
  await compileMDX({
    source,
    components,
    options: { blockJS: false, mdxOptions: { remarkPlugins: [remarkMath, remarkGfm, collector(f.slice(0, 2))] } },
  });
}

const all = process.argv.includes('--all');
const autores = process.argv.includes('--autores');
// Dos niveles: las siglas y símbolos son una compuerta (toda sigla en la
// prosa debe tener entrada); los autores citados son un reporte de
// curaduría, porque muchas referencias tienen coautores que no necesitan
// tooltip y ya viven en la bibliografía.
const rows = [...hits.entries()]
  .filter(([t, h]) => {
    if (all) return true;
    if (autores) return h.kind === 'autor' && !known.has(t);
    return h.kind !== 'autor' && !known.has(t) && !IGNORE_RE.test(t) && !MANUAL_RE.test(t);
  })
  .sort((a, b) => b[1].n - a[1].n);
for (const [t, h] of rows) console.log(`${t.padEnd(16)} ${String(h.n).padStart(4)}  ${h.kind === 'autor' ? 'autor citado' : 'sigla'}  módulos ${[...h.mods].join(' ')}`);
if (autores) {
  console.log(`\n${rows.length} autores citados sin entrada (reporte, no compuerta)`);
} else {
  console.log(`\n${rows.length} términos ${all ? 'en total' : 'sin entrada en el glosario'}`);
  if (!all && rows.length) process.exitCode = 1;
}
