import { defineConfig } from '@playwright/test';

// Capturas en modo claro, animaciones reducidas, contra `next start` en :3001.
// Uso: pnpm build && pnpm test:visual   (o deja un `next dev` en :3001 y se reutiliza)
export default defineConfig({
  testDir: 'tests/visual',
  timeout: 60_000,
  retries: 0,
  workers: 4,
  use: {
    baseURL: 'http://localhost:3001',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'es-CO',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'pnpm start -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  snapshotPathTemplate: 'tests/visual/__snapshots__/{projectName}/{arg}{ext}',
  expect: {
    timeout: 20_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.001,
    },
  },
});
