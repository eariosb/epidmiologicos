import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCAL_DATASETS } from '@/lib/webr';

const MODULES = join(process.cwd(), 'src/content/modules');

describe('datasets de las celdas R', () => {
  it('toda base que lee una celda está en LOCAL_DATASETS y en public/data', () => {
    const leidas = new Set<string>();
    for (const f of readdirSync(MODULES).filter((x) => x.endsWith('.mdx'))) {
      const src = readFileSync(join(MODULES, f), 'utf-8');
      for (const m of src.matchAll(/read\.(?:csv|table)\(\s*["']([\w.-]+\.(?:csv|txt))["']/g)) {
        leidas.add(m[1]);
      }
    }
    expect(leidas.size).toBeGreaterThan(0);
    for (const archivo of leidas) {
      expect(LOCAL_DATASETS, `falta ${archivo} en LOCAL_DATASETS`).toContain(archivo);
      expect(existsSync(join(process.cwd(), 'public/data', archivo)), `falta public/data/${archivo}`).toBe(true);
    }
  });
});
