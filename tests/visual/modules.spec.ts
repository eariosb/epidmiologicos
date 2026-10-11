import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Slugs desde los frontmatter, en orden de archivo (determinista).
const modulesDir = join(__dirname, '..', '..', 'src', 'content', 'modules');
const slugs = readdirSync(modulesDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const m = readFileSync(join(modulesDir, f), 'utf-8').match(/^slug:\s*"?([a-z0-9-]+)"?/m);
    return m ? m[1] : f.replace(/\.mdx$/, '');
  })
  .sort();

async function waitStable(page: import('@playwright/test').Page) {
  // Las paginas cargan webR/Excalidraw en segundo plano: no esperamos 'load',
  // solo el contenido renderizado + fuentes + KaTeX + altura estable
  // (los simuladores exactos tardan unos segundos en terminar de pintar).
  await page.waitForSelector('main, article, .prose', { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.locator('.katex').first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
  let prev = -1;
  for (let i = 0; i < 40; i++) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    if (h === prev && i >= 3) break;
    prev = h;
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(300);
}

test('home', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitStable(page);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true });
});

test('anexos', async ({ page }) => {
  await page.goto('/anexos', { waitUntil: 'domcontentloaded' });
  await waitStable(page);
  await expect(page).toHaveScreenshot('anexos.png', { fullPage: true });
});

test('bibliografia', async ({ page }) => {
  await page.goto('/bibliografia', { waitUntil: 'domcontentloaded' });
  await waitStable(page);
  await expect(page).toHaveScreenshot('bibliografia.png', { fullPage: true });
});

for (const slug of slugs) {
  test(`modulo ${slug}`, async ({ page }) => {
    await page.goto(`/cursos/${slug}`, { waitUntil: 'domcontentloaded' });
    await waitStable(page);
    await expect(page).toHaveScreenshot(`${slug}.png`, { fullPage: true });
  });
}
