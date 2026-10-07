import type { NextConfig } from 'next';

/**
 * Fase 2: pizarra digital integrada (réplica del curso MLM).
 *
 * - `transpilePackages`: el workspace `@cursos/blackboard` se publica como
 *   TypeScript sin build previo; Next lo transpila junto a la app.
 * - Headers COOP/COEP: WebR descarga WASM/workers cross-origin; el aislamiento
 *   mejora el rendimiento de los hilos del runtime.
 * - `outputFileTracingExcludes`: evita que el tracing empaquete `webr`
 *   (~59 MB) dentro de las funciones serverless en Vercel (límite de tamaño).
 * - Webpack: `webr.cjs` usa require() con ruta dinámica para sus workers;
 *   Webpack lo marca como "Critical dependency". Inofensivo porque WebR
 *   carga sus assets desde un baseUrl remoto (ver src/lib/webr.ts).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cursos/blackboard'],
  outputFileTracingExcludes: {
    '*': ['node_modules/webr/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
