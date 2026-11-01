/**
 * Plugin remark: envuelve automáticamente la PRIMERA aparición de cada
 * término del glosario en <Term k="...">…</Term>, sin editar los MDX.
 * Cobertura máxima con coste editorial cero: una entrada nueva en
 * src/lib/glossary.ts queda enlazada sola en todos los módulos.
 *
 * Reglas:
 * - Solo la primera aparición por módulo: el tooltip refresca la memoria,
 *   no debe convertir el texto en un campo de subrayados.
 * - No se duplica: si el autor ya escribió <Term k="X"> a mano, esa clave
 *   queda marcada y no se vuelve a envolver.
 * - Solo claves "sigla-like" (empiezan en mayúscula/dígito o están en
 *   EXTRA_KEYS): las claves en minúsculas son palabras comunes
 *   ('potencia', 'cobertura') y autoenlazarlas sería incorrecto. Los
 *   conceptos se enlazan por sus formas técnicas (GLOSSARY_FORMS:
 *   «tiempo inmortal», «colisionador»…), en minúscula o con mayúscula
 *   inicial.
 * - 'Se' queda excluida: el pronombre reflexivo encabezaría falsos
 *   positivos al inicio de oración ("Se observa que…").
 * - Alias (GLOSSARY_ALIASES): H₀, I², R₀, ICs… se enlazan a su clave
 *   canónica y conservan su forma en el texto.
 * - Símbolos griegos con varios sentidos (β, γ, θ…) NO se autoenlazan:
 *   se marcan a mano con la clave del sentido (<Term k="β-SIR">β</Term>).
 *   Solo los de sentido único en el curso (α, τ²) están en EXTRA_KEYS.
 * - Solo toca nodos `text` fuera de código, matemática, enlaces y
 *   encabezados: mismo contrato que remark-module-refs.
 */

import { GLOSSARY, GLOSSARY_ALIASES, GLOSSARY_FORMS } from './glossary';

interface MdastNode {
  type: string;
  value?: string;
  name?: string | null;
  attributes?: Array<{ type?: string; name?: string; value?: unknown }>;
  children?: MdastNode[];
  [key: string]: unknown;
}

// Contextos donde una sigla NO debe convertirse en Term.
const SKIP_TYPES = new Set([
  'code',
  'inlineCode',
  'html',
  'link',
  'linkReference',
  'definition',
  'heading',
  'inlineMath',
  'math',
  'mdxTextExpression',
  'mdxFlowExpression',
  'yaml',
]);

// Identificadores/siglas válidos aunque no empiecen en mayúscula.
const EXTRA_KEYS = new Set([
  'χ²',
  'α',
  'τ²',
  'τ',
  'Φ',
  'κ',
  'p₀',
  'p₁',
  'n₁',
  'mid-p',
  'log-rank',
  'berger-boos',
  'clogit',
  'epiR',
  'CMHtest',
]);

// Claves de mayúscula que son también palabras válidas del español.
const SKIP_KEYS = new Set(['Se']);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const capitalize = (f: string) => f.charAt(0).toUpperCase() + f.slice(1);

/** Forma escrita → clave: alias tipográficos y formas de los conceptos. */
const FORM_TO_KEY: Record<string, string> = { ...GLOSSARY_ALIASES };
for (const [form, key] of Object.entries(GLOSSARY_FORMS)) {
  FORM_TO_KEY[form] = key;
  FORM_TO_KEY[capitalize(form)] = key;
}

// Claves autoenlazables: siglas del glosario + alias y formas.
// Las claves con sufijo de sentido (β-SIR, θ-meta) quedan fuera: son
// solo para marcado manual.
const AUTO_KEYS = [
  ...Object.keys(GLOSSARY).filter(
    (k) =>
      !SKIP_KEYS.has(k) &&
      (/^[A-Z0-9]/.test(k) || EXTRA_KEYS.has(k)) &&
      !/^[\p{Script=Greek}][^-]*-/u.test(k),
  ),
  ...Object.keys(FORM_TO_KEY),
].sort((a, b) => b.length - a.length);

/** Forma escrita → clave canónica del glosario. */
function canonical(form: string): string {
  return FORM_TO_KEY[form] ?? form;
}

// Frontera de "palabra de sigla": ni letra/dígito, guion ni subíndice
// a los lados; evita partir compuestos como "OR-MH", "I-squared" o
// "z_α", y que "α" capture el "α²" de otra cosa.
const TERM_RE = new RegExp(
  `(?<![\\p{L}\\p{N}_-])(${AUTO_KEYS.map(escapeRe).join('|')})(?![\\p{L}\\p{M}\\p{N}_²₀-₉-])`,
  'gu',
);

function collectManualKeys(node: MdastNode, seen: Set<string>): void {
  if (!node) return;
  if (
    (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
    node.name === 'Term'
  ) {
    const k = node.attributes?.find((a) => a.name === 'k')?.value;
    if (typeof k === 'string' && k) seen.add(k);
    return; // no envolver dentro de un Term existente
  }
  node.children?.forEach((c) => collectManualKeys(c, seen));
}

function splitTextNode(node: MdastNode, seen: Set<string>): MdastNode[] | null {
  const text = node.value ?? '';
  const parts: MdastNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TERM_RE.lastIndex = 0;
  while ((match = TERM_RE.exec(text)) !== null) {
    const k = canonical(match[1]);
    if (seen.has(k)) continue;
    seen.add(k);
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    parts.push({
      type: 'mdxJsxTextElement',
      name: 'Term',
      attributes: [{ type: 'mdxJsxAttribute', name: 'k', value: k }],
      children: [{ type: 'text', value: match[0] }],
    });
    last = match.index + match[0].length;
  }
  if (parts.length === 0) return null;
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) });
  }
  return parts;
}

function walk(node: MdastNode, seen: Set<string>): void {
  if (!node || SKIP_TYPES.has(node.type)) return;
  if (
    (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
    node.name === 'Term'
  ) {
    return;
  }
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'text' && child.value && TERM_RE.test(child.value)) {
      TERM_RE.lastIndex = 0;
      const parts = splitTextNode(child, seen);
      if (parts) {
        children.splice(i, 1, ...parts);
        i += parts.length - 1;
        continue;
      }
    }
    walk(child, seen);
  }
}

export function remarkAutoTerms() {
  return (tree: MdastNode) => {
    const seen = new Set<string>();
    collectManualKeys(tree, seen);
    walk(tree, seen);
  };
}
