'use client';

import { useState, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import clsx from 'clsx';
import { tokens as uiTokens } from '@/lib/tokens';

const MAX_CONSOLE_LINES = 30;

export interface PrecomputedResult {
  /** Salida de consola de R capturada por scripts/precompute.R */
  console?: string;
  /** Ruta a un PNG en /public/precomputed (gráfico generado por R) */
  image?: string;
  /** Texto alternativo del gráfico (accesibilidad) */
  imageAlt?: string;
}

export interface CodeBlockProps {
  /** ID global único, convención `NN/descripcion-corta` (ej. "01/histdist-severidad") */
  id: string;
  code: string;
  language?: string;
  title?: string;
  precomputed?: PrecomputedResult;
}

/**
 * Bloque de código R estático (Fase 1): resaltado de sintaxis, botón
 * "Copiar" y panel colapsable "Resultado esperado" con la salida de consola
 * (máx. 30 líneas, expandible con "+") y el gráfico precomputado.
 *
 * El código está colapsado por defecto para mejorar la legibilidad de
 * módulos extensos. El usuario hace clic en el header para expandir.
 *
 * La API está diseñada para la Fase 2 (WebR): `RCell` reutilizará las mismas
 * props (`id`, `code`, `precomputed` como fallback) añadiendo el botón
 * "Ejecutar", sin cambios en los MDX.
 */
export function CodeBlock({ id, code, language = 'r', title, precomputed }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageRetryKey, setImageRetryKey] = useState(0);

  useEffect(() => {
    if (!precomputed?.image || imageError) return;
    const img = new Image();
    img.src = precomputed.image;
    img.onload = () => setImageError(false);
    img.onerror = () => {
      if (imageRetryKey === 0) {
        const timer = setTimeout(() => setImageRetryKey(1), 500);
        return () => clearTimeout(timer);
      }
    };
  }, [precomputed?.image, imageRetryKey]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* portapapeles no disponible: sin acción */
    }
  }

  const consoleLines = precomputed?.console?.split('\n') ?? [];
  const consoleIsLong = consoleLines.length > MAX_CONSOLE_LINES;
  const visibleConsole =
    consoleExpanded || !consoleIsLong
      ? consoleLines
      : consoleLines.slice(0, MAX_CONSOLE_LINES);

  return (
    <div
      className="my-6 overflow-hidden rounded border border-ink-200 bg-ink-50 shadow-sm transition-shadow hover:shadow-md"
      data-codeblock-id={id}
    >
      <div className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          aria-expanded={showCode}
          aria-controls={`code-${id}`}
          className="flex items-center gap-2 text-sm font-medium text-ink-700 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <span
            aria-hidden
            className={clsx('transition-transform', showCode && 'rotate-90')}
          >
            ▸
          </span>
          {title ?? 'Código R'}
          <span className="text-xs font-normal text-ink-400">
            ({code.trim().split('\n').length} líneas)
          </span>
        </button>
        <span className="hidden items-center rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-500 sm:inline-flex">
          {precomputed ? 'Salida precomputada' : 'Código de referencia'}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          aria-label="Copiar código al portapapeles"
        >
          {copied ? (
            <span className="text-success-715">✓ Copiado</span>
          ) : (
            <>
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar
            </>
          )}
        </button>
      </div>

      {showCode && (
        <Highlight code={code.trim()} language={language} theme={themes.vsDark}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              id={`code-${id}`}
              className={clsx(className, 'overflow-x-auto px-4 py-3 text-sm leading-relaxed')}
              style={{ ...style, backgroundColor: uiTokens.ui.codeBg, margin: 0 }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="mr-4 inline-block w-6 select-none text-right text-xs text-gray-500">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}

      {precomputed && (
        <div className="border-t border-ink-200">
          <button
            type="button"
            onClick={() => setShowResult((v) => !v)}
            aria-expanded={showResult}
            className="flex w-full items-center gap-2 bg-white px-4 py-2 text-left text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span
              aria-hidden
              className={clsx('transition-transform', showResult && 'rotate-90')}
            >
              ▸
            </span>
            Resultado esperado
          </button>

          {showResult && (
            <div className="animate-fade-in">
              {precomputed.console && (
                <div className="bg-ink-900 text-ink-100">
                  <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed">
                    {visibleConsole.join('\n')}
                    {!consoleExpanded && consoleIsLong && '\n…'}
                  </pre>
                  {consoleIsLong && (
                    <button
                      type="button"
                      onClick={() => setConsoleExpanded((v) => !v)}
                      aria-expanded={consoleExpanded}
                      className="w-full border-t border-ink-700 px-4 py-1.5 text-left text-xs font-medium text-brand-300 hover:text-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400"
                    >
                      {consoleExpanded ? '− Ver menos' : '+ Ver salida completa'}
                    </button>
                  )}
                </div>
              )}
              {precomputed.image && !imageError && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={imageRetryKey}
                  src={imageRetryKey > 0 ? `${precomputed.image}?v=${imageRetryKey}` : precomputed.image}
                  alt={precomputed.imageAlt ?? 'Gráfico generado por el código R anterior'}
                  className="w-full border-t border-ink-200 bg-white"
                  loading="lazy"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              )}
              {precomputed.image && imageError && (
                <div className="border-t border-ink-200 bg-ink-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-ink-600">
                    Gráfico no disponible temporalmente
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Ejecuta el código R anterior en tu entorno local para generar este gráfico.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
