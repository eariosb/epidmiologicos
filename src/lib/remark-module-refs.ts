/**
 * Plugin remark: convierte las referencias "M0"…"M19" escritas en la
 * prosa en <MRef n={3}>M3</MRef> — un enlace al módulo con tooltip
 * (misma UX que <Term> del glosario). Así ningún MDX se edita a mano
 * y las referencias futuras quedan enlazadas solas.
 *
 * Solo toca nodos `text`: el código de las RCell/SasBlock vive en
 * expresiones JSX (no es mdast `text`) y la matemática ya es
 * `inlineMath` cuando corre este plugin — ambos quedan intactos.
 */

interface MdastNode {
  type: string;
  value?: string;
  name?: string | null;
  children?: MdastNode[];
  [key: string]: unknown;
}

// Contextos donde un "M3" NO es una referencia al módulo.
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

const MODULE_REF = /\bM(\d{1,2})\b/g;
const MAX_ORDER = 19;

function splitTextNode(node: MdastNode): MdastNode[] | null {
  const text = node.value ?? '';
  const parts: MdastNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  MODULE_REF.lastIndex = 0;
  while ((match = MODULE_REF.exec(text)) !== null) {
    const order = Number(match[1]);
    if (order > MAX_ORDER) continue;
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) });
    }
    parts.push({
      type: 'mdxJsxTextElement',
      name: 'MRef',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'n', value: String(order) },
      ],
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

function walk(node: MdastNode): void {
  if (!node || SKIP_TYPES.has(node.type)) return;
  const children = node.children;
  if (!children) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'text' && child.value && /\bM\d{1,2}\b/.test(child.value)) {
      const parts = splitTextNode(child);
      if (parts) {
        children.splice(i, 1, ...parts);
        i += parts.length - 1;
        continue;
      }
    }
    walk(child);
  }
}

export function remarkModuleRefs() {
  return (tree: MdastNode) => {
    walk(tree);
  };
}
