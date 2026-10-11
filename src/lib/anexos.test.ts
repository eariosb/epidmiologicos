import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ANEXOS, getAnexo } from './anexos';
import { buildCorpus } from './rag/corpus';

const PUBLIC_ANEXOS = join(process.cwd(), 'public', 'anexos');

describe('manifiesto de anexos', () => {
  it('tiene ids únicos y permiso declarado en todas las entradas', () => {
    const ids = ANEXOS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ANEXOS) {
      expect(a.permiso.length, `${a.id} sin permiso`).toBeGreaterThan(0);
      if (a.permiso === 'tercero') expect(a.licencia, `${a.id} sin licencia`).toBeTruthy();
    }
  });

  it('cada anexo apunta a un archivo que existe en public/anexos', () => {
    const missing = ANEXOS.filter((a) => !existsSync(join(PUBLIC_ANEXOS, a.archivo))).map(
      (a) => `${a.id} -> ${a.archivo}`,
    );
    expect(missing).toEqual([]);
  });

  it('resuelve los ids que cita el módulo 6', () => {
    // La referencia rota original del M6: "(ensayo técnico del curso, en anexos)".
    expect(getAnexo('ensayo-test-exacto')?.archivo).toBe('ensayo-test-exacto-fisher.pdf');
    expect(getAnexo('auditoria-perondi')?.archivo).toBe('auditoria-perondi.md');
  });

  it('el corpus indexa los anexos y las secciones del ensayo en Markdown', () => {
    const docs = buildCorpus();
    const anexos = docs.filter((d) => d.source === 'anexo');
    // Una entrada por ítem del manifiesto + secciones de los .md
    expect(anexos.length).toBeGreaterThan(ANEXOS.length);
    expect(anexos.some((d) => d.id === 'anexo:ensayo-test-exacto')).toBe(true);
    expect(anexos.some((d) => d.text.includes('Perondi'))).toBe(true);
    // Las secciones del ensayo son recuperables por contenido
    expect(anexos.some((d) => /Boschloo|dosis/.test(d.text) && d.id.includes('ensayo-test-exacto-md'))).toBe(
      true,
    );
  });
});
