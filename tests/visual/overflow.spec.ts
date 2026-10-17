import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Ninguna página debe desbordar horizontalmente el viewport. Un desborde
// en móvil cambia el ancho de las capturas y obliga a desplazar de lado.
// Causa típica: un elemento oculto con `invisible` (sigue ocupando caja)
// o un hijo de flex/grid sin `min-w-0`.
const modulesDir = join(__dirname, '..', '..', 'src', 'content', 'modules');
const slugs = readdirSync(modulesDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const m = readFileSync(join(modulesDir, f), 'utf-8').match(/^slug:\s*"?([a-z0-9-]+)"?/m);
    return m ? m[1] : f.replace(/\.mdx$/, '');
  })
  .sort();

const pages = ['/', '/anexos', '/bibliografia', ...slugs.map((s) => `/cursos/${s}`)];

for (const path of pages) {
  test(`sin desborde horizontal: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main, article, .prose', { timeout: 30_000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const culpables: string[] = [];
      for (const el of document.querySelectorAll('body *')) {
        const rc = el.getBoundingClientRect();
        if (rc.width === 0 || rc.right <= W + 1) continue;
        let recortado = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== 'visible') { recortado = true; break; }
        }
        if (!recortado) culpables.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} (right=${Math.round(rc.right)})`);
      }
      return { sw: document.documentElement.scrollWidth, W, culpables: culpables.slice(0, 5) };
    });
    expect(r.sw, `desborde: ${r.culpables.join(' | ')}`).toBeLessThanOrEqual(r.W);
  });
}
