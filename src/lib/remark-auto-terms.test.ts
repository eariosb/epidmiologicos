import { describe, expect, it } from 'vitest';
import { remarkAutoTerms } from './remark-auto-terms';

interface Node {
  type: string;
  value?: string;
  name?: string | null;
  attributes?: Array<{ type?: string; name?: string; value?: unknown }>;
  children?: Node[];
  [key: string]: unknown;
}

function tree(...children: Node[]): Node {
  return { type: 'root', children };
}

function para(...children: Node[]): Node {
  return { type: 'paragraph', children };
}

function text(value: string): Node {
  return { type: 'text', value };
}

/** Devuelve los nombres de clave k de todos los <Term> del árbol. */
function termKeys(node: Node, acc: string[] = []): string[] {
  if (node.name === 'Term') {
    const k = node.attributes?.find((a) => a.name === 'k')?.value;
    if (typeof k === 'string') acc.push(k);
    return acc;
  }
  node.children?.forEach((c) => termKeys(c, acc));
  return acc;
}

describe('remarkAutoTerms', () => {
  it('envuelve la primera aparición de una sigla y no repite', () => {
    const t = tree(para(text('El RR mide asociación; el RR no es el OR.')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['RR', 'OR']);
    // El segundo "RR" queda como texto plano.
    const flat = JSON.stringify(t);
    expect(flat.match(/"RR"/g)!.length).toBe(2); // 1 Term + 1 texto
  });

  it('no duplica claves ya envueltas a mano con <Term k>', () => {
    const manual: Node = {
      type: 'mdxJsxTextElement',
      name: 'Term',
      attributes: [{ type: 'mdxJsxAttribute', name: 'k', value: 'RR' }],
      children: [text('RR')],
    };
    const t = tree(para(manual, text(' y luego el RR otra vez')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['RR']);
  });

  it('no envuelve el pronombre "Se" al inicio de oración', () => {
    const t = tree(para(text('Se observa que el VPP cae con prevalencia baja.')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['VPP']);
  });

  it('ignora código, matemática, enlaces y encabezados', () => {
    const t = tree(
      { type: 'inlineCode', value: 'RR <- 2.5' },
      { type: 'heading', children: [text('El RR')], depth: 2 },
      { type: 'link', children: [text('el RR')], url: 'https://x.co' },
      para(text('solo aquí el RR cuenta')),
    );
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['RR']);
  });

  it('no envuelve dentro de un <Term> existente', () => {
    const manual: Node = {
      type: 'mdxJsxTextElement',
      name: 'Term',
      attributes: [{ type: 'mdxJsxAttribute', name: 'tip', value: 'otro' }],
      children: [text('RR')],
    };
    const t = tree(para(manual));
    remarkAutoTerms()(t);
    // Solo el Term manual; sin Term anidado.
    expect(termKeys(t)).toEqual([]);
  });

  it('envuelve siglas en celdas de tabla', () => {
    const t = tree({
      type: 'table',
      children: [
        {
          type: 'tableRow',
          children: [
            { type: 'tableCell', children: [text('SMR indirecto')] },
          ],
        },
      ],
    });
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['SMR']);
  });
  it('enlaza alias tipográficos a su clave canónica (H₀ → H0, ICs → IC)', () => {
    const t = tree(para(text('Bajo H₀ los ICs del SIR cubren; R₀ = β/γ.')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['H0', 'IC', 'SIR', 'R0']);
  });

  it('no autoenlaza símbolos griegos ambiguos y respeta subíndices', () => {
    const t = tree(para(text('Con β y γ fijos, z_α no es α; τ² mide heterogeneidad.')));
    remarkAutoTerms()(t);
    // β y γ quedan para marcado manual por sentido; z_α no se parte.
    expect(termKeys(t)).toEqual(['α', 'τ²']);
  });
  it('enlaza conceptos por su forma técnica, también con mayúscula inicial', () => {
    const t = tree(
      para(text('Tiempo inmortal y un colisionador: el tiempo inmortal no se repite.')),
    );
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['tiempo_inmortal', 'colisionador']);
  });

  it('no confunde a Neyman (el estadístico) con el sesgo de Neyman', () => {
    const t = tree(para(text('Fisher y Neyman discutieron; el sesgo de Neyman es otra cosa.')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['sesgo_neyman']);
  });

  it('no corta un símbolo con acento combinante (τ̂²)', () => {
    const t = tree(para(text('Con τ̂² = 0 el modelo aleatorio coincide; τ mide la dispersión.')));
    remarkAutoTerms()(t);
    expect(termKeys(t)).toEqual(['τ']);
    expect(JSON.stringify(t)).toContain('τ̂²');
  });
});
