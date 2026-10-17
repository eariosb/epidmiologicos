/**
 * WebR loader and execution helper.
 *
 * Provides a single shared WebR instance (singleton) for the whole app,
 * pre-loads the R packages used across the course, and exposes a
 * `runRCode` helper that captures console output, plots (as PNG data
 * URLs) and simple data frames printed to the console.
 *
 * The epidemiology course is mostly base R (2×2 tables, χ², Mantel-
 * Haenszel, McNemar, Kaplan-Meier by hand). `survival` is a recommended
 * package available in the wasm repo and installs lazily the first time
 * a cell calls `library(survival)`. `epiR`/`vcdExtra` may not be in the
 * wasm repo — the course computes their statistics in base R instead,
 * which is also more transparent pedagogically.
 */
import type { WebR as WebRType } from 'webr';

// Packages preloaded so the first executable cell in each lesson runs fast.
// Only light, widely-used packages go here; domain packages install on
// demand via `ensurePackagesAvailable()` when a cell calls library(...).
export const PRELOAD_PACKAGES = [
  'MASS', // mvrnorm and friends
  'survival', // Surv, survfit (Kaplan-Meier), survdiff (log-rank), coxph, clogit
];

export interface RRunResult {
  /** Combined stdout/stderr text, in order */
  text: string;
  /** Whether the run produced any R-level error */
  error?: string;
  /** PNG data URLs for any plots produced */
  plots: string[];
}

let webRPromise: Promise<WebRType> | null = null;

/** Packages that have been successfully installed at least once. */
const installedPackages = new Set<string>();

/** Datasets already copied into webR's VFS. */
const fetchedDatasets = new Set<string>();

/**
 * Returns a shared, lazily-initialised WebR instance. Safe to call
 * multiple times — initialisation only happens once.
 */
export function getWebR(): Promise<WebRType> {
  webRPromise ??= initWebR();
  return webRPromise;
}

async function initWebR(): Promise<WebRType> {
  const { WebR } = await import('webr');
  const webR = new WebR({
    interactive: false,
    // Carga los binarios de WebR (WASM, workers, paquetes R) directamente
    // desde el CDN oficial en lugar de rutas locales empaquetadas por
    // Next.js/Webpack. Esto evita fallos de carga en producción (Vercel)
    // donde los assets de node_modules/webr no se sirven tal cual.
    baseUrl: 'https://webr.r-wasm.org/v0.6.0/',
  });
  await webR.init();

  // Preload commonly used packages so individual cells feel instant.
  // Each package is installed independently so that a single missing or
  // failed package doesn't prevent the rest from loading: a per-cell
  // `library()` call will report a clear "no hay paquete llamado ..."
  // error only for the package(s) that actually failed, and
  // `ensurePackagesAvailable` below will retry on demand.
  for (const pkg of PRELOAD_PACKAGES) {
    try {
      await webR.installPackages([pkg], { quiet: true });
      installedPackages.add(pkg);
    } catch {
      // Non-fatal: retried lazily by ensurePackagesAvailable() when a
      // cell actually calls library()/require() for this package.
    }
  }

  return webR;
}

/**
 * Datasets del curso, servidos por Next.js desde `public/data/`.
 * El código R de las celdas los referencia por nombre de archivo
 * (p. ej. `read.csv("caminata.csv")`); aquí se reescriben a rutas del
 * VFS de webR tras copiarlos con un fetch same-origin.
 *
 * Este curso genera casi todos sus datos por simulación en R, así que
 * la lista empieza vacía: basta con dejar el CSV en `public/data/` y
 * agregar su nombre aquí.
 */
const LOCAL_DATASETS: string[] = [
  'bcg_matching.csv',      // M0, M14, M15: matching 1:5, vacuna BCG
  'caso_control_11.csv',   // M15: laboratorio de parejas
  'ddimer.csv',            // M15: clogit con matching variable
  'leucemia.txt',          // M12: ensayo 6-MP (Freireich)
  'recid.csv',             // M13: primer coxph
  'shhs_vivienda.csv',     // M8: vivienda y CHD estratificado
  'valung.csv',            // M12: laboratorio VA lung
];

const DATA_DIR = '/data';

/**
 * Copies (once) any dataset referenced by `code` from `public/data/` into
 * webR's virtual filesystem so the rewritten R code can read it locally.
 */
async function ensureDatasetsAvailable(webR: WebRType, code: string): Promise<void> {
  const needed = LOCAL_DATASETS.filter(
    (filename) => code.includes(filename) && !fetchedDatasets.has(filename)
  );
  if (needed.length === 0) return;

  try {
    await webR.FS.mkdir(DATA_DIR);
  } catch {
    // Directory probably already exists.
  }

  for (const filename of needed) {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(
        `No se pudo cargar el conjunto de datos "${filename}" (HTTP ${response.status}).`
      );
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    await webR.FS.writeFile(`${DATA_DIR}/${filename}`, bytes);
    fetchedDatasets.add(filename);
  }
}

/** Replaces quoted references to known dataset filenames with VFS paths. */
function rewriteDatasetUrls(code: string): string {
  let rewritten = code;
  for (const filename of LOCAL_DATASETS) {
    const escaped = filename.replace('.', String.raw`\.`);
    const quoted = new RegExp(String.raw`(["'])${escaped}\1`, 'g');
    rewritten = rewritten.replace(quoted, `$1${DATA_DIR}/${filename}$1`);
  }
  return rewritten;
}

/**
 * Scans R code for `library(pkg)` / `require(pkg)` calls and installs any
 * package that wasn't successfully preloaded at boot time. This makes
 * package availability resilient to transient failures during
 * `initWebR()` (e.g. a single slow/failed download at startup no longer
 * permanently breaks that package for the whole session).
 */
async function ensurePackagesAvailable(webR: WebRType, code: string): Promise<void> {
  const matches = code.matchAll(/(?:library|require)\(\s*["']?([A-Za-z0-9._]+)["']?\s*\)/g);
  const needed = new Set<string>();
  for (const m of matches) {
    needed.add(m[1]);
  }

  for (const pkg of needed) {
    if (installedPackages.has(pkg)) continue;
    try {
      await webR.installPackages([pkg], { quiet: true });
      installedPackages.add(pkg);
    } catch {
      // Leave it: library()/require() inside captureR() will surface a
      // descriptive R-level error for this specific package.
    }
  }
}

/**
 * Maps a `captureR()` output stream to console text lines plus the
 * R-level error message, if the run produced one.
 */
function collectOutput(output: { type: string; data: unknown }[]): {
  lines: string[];
  error?: string;
} {
  const lines: string[] = [];
  let error: string | undefined;
  for (const out of output) {
    if (out.type === 'stdout' || out.type === 'stderr') {
      lines.push(out.data as string);
    } else if (out.type === 'message' || out.type === 'warning') {
      const data = out.data as { message?: string };
      if (data?.message) lines.push(data.message.trimEnd());
    } else if (out.type === 'error') {
      const data = out.data as { message?: string };
      error = data?.message ?? String(out.data);
      if (error) lines.push(`Error: ${error}`);
    }
  }
  return { lines, error };
}

/** Rasterizes a captured WebR canvas image to a PNG data URL. */
function imageToDataUrl(img: ImageBitmap): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Runs a chunk of R code, capturing printed output and any plots
 * generated via the `Cairo`/`png` graphics device that WebR exposes
 * through its canvas capture API.
 */
export async function runRCode(code: string): Promise<RRunResult> {
  const webR = await getWebR();
  const plots: string[] = [];
  let outputLines: string[] = [];
  let errorMsg: string | undefined;

  // Open a capturing canvas device so any base/ggplot2 plot is recorded.
  const shelter = await new webR.Shelter();

  try {
    // Make sure any package referenced via library()/require() and any
    // dataset referenced by URL are available before running the code.
    await ensurePackagesAvailable(webR, code);
    await ensureDatasetsAvailable(webR, code);
    const codeToRun = rewriteDatasetUrls(code);

    // Set up a graphics device that writes to an offscreen canvas.
    await webR.evalRVoid(
      `webr::canvas(width = 720, height = 480)`,
      { withAutoprint: false }
    );

    const result = await shelter.captureR(codeToRun, {
      withAutoprint: true,
      captureStreams: true,
      captureConditions: true,
    });

    const collected = collectOutput(result.output);
    outputLines = collected.lines;
    errorMsg = collected.error;

    // Collect any captured plot images.
    for (const img of result.images) {
      const dataUrl = imageToDataUrl(img);
      if (dataUrl) plots.push(dataUrl);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  } finally {
    try {
      await webR.evalRVoid(`try(dev.off(), silent = TRUE)`, { withAutoprint: false });
    } catch {
      /* ignore */
    }
    shelter.purge();
  }

  return { text: outputLines.join('\n'), error: errorMsg, plots };
}
