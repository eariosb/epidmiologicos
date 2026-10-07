/**
 * Tipos mínimos para el paquete `webr` (sucesor de `@r-wasm/webr`, que
 * quedó fijado en la versión 0.2.0 en este registro).
 *
 * El paquete declara un campo `exports` sin condición `types` para su
 * entrada principal, lo que impide que TypeScript (con
 * `moduleResolution: "bundler"`) resuelva las declaraciones reales en
 * `dist/webR/webr-main.d.ts`. Esta declaración ambiente cubre únicamente
 * la superficie de API usada por `lib/webr.ts`, evitando el error de
 * compilación sin modificar el paquete de terceros.
 */
declare module 'webr' {
  export interface CaptureROutput {
    type: 'stdout' | 'stderr' | 'message' | 'warning' | 'error' | string;
    data: unknown;
  }

  export interface CaptureRResult {
    output: CaptureROutput[];
    images: ImageBitmap[];
  }

  export interface CaptureROptions {
    withAutoprint?: boolean;
    captureStreams?: boolean;
    captureConditions?: boolean;
  }

  export interface EvalROptions {
    withAutoprint?: boolean;
  }

  export interface WebRShelter {
    captureR(code: string, options?: CaptureROptions): Promise<CaptureRResult>;
    purge(): Promise<void> | void;
  }

  export interface WebROptions {
    interactive?: boolean;
    /** URL base remota desde donde se descargan los binarios de WebR (WASM, workers, paquetes). */
    baseUrl?: string;
    [key: string]: unknown;
  }

  export interface WebRFS {
    mkdir(path: string): Promise<void>;
    writeFile(path: string, data: Uint8Array): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
  }

  export class WebR {
    constructor(options?: WebROptions);
    init(): Promise<void>;
    installPackages(packages: string[], options?: { quiet?: boolean }): Promise<void>;
    evalRVoid(code: string, options?: EvalROptions): Promise<void>;
    Shelter: new () => WebRShelter;
    FS: WebRFS;
  }
}
