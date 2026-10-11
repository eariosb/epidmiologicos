'use client';

import { useState, useRef, type JSX } from 'react';
import { Play, Camera, Send, ChartColumn, FileText, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { r as rMode } from '@codemirror/legacy-modes/mode/r';
import { toPng } from 'html-to-image';
import { tokens } from '@/lib/tokens';
import { useRCell } from '@/hooks/useWebR';
import { ConsoleOutput } from './ConsoleOutput';
import { saveCapture } from '@/lib/session-store';
import { sendToBlackboard } from '@/lib/send-to-blackboard';
import { codeToDataUrl } from '@/lib/code-image';
import type { RCellProps } from '@/types/course';

const rLanguage = StreamLanguage.define(rMode);

/**
 * An editable, executable R code cell. Runs against the shared WebR
 * instance (lazily booted on first run) and renders console output,
 * plots and R-level errors below the editor.
 */
export function RCell({ id, title, code: initialCode, defaultOpen = false }: Readonly<RCellProps>) {
  const [code, setCode] = useState(initialCode);
  const [open, setOpen] = useState(defaultOpen);
  const { state, result, webRStatus, webRError, run } = useRCell();
  const cellRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [sendingPlots, setSendingPlots] = useState(false);

  const isRunning = state === 'running';
  const isBooting = webRStatus === 'loading' && isRunning;

  const handleCapture = async () => {
    if (!cellRef.current) return;
    setCapturing(true);
    setCaptureError(null);
    try {
      const dataUrl = await toPng(cellRef.current, {
        backgroundColor: tokens.ui.surface,
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
      });
      await saveCapture({
        name: title ? `Código R: ${title}` : `Código R (${id})`,
        dataUrl,
        thumbnail: dataUrl,
        type: 'code',
        tags: [],
        code,
        outputText: result?.text ?? '',
        plotUrls: result?.plots ?? [],
        timestamp: Date.now(),
      });
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Error al capturar');
    } finally {
      setCapturing(false);
    }
  };

  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      const dataUrl = await codeToDataUrl(code, 'R');
      sendToBlackboard({
        dataUrl,
        opts: {
          meta: {
            boardKind: 'code',
            boardId: id,
            payload: { lang: 'r', source: code },
          },
        },
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleSendOutput = async () => {
    if (!result?.text) return;
    const dataUrl = await codeToDataUrl(result.text, 'Resultado');
    sendToBlackboard({
      dataUrl,
      opts: {
        meta: {
          boardKind: 'output',
          boardId: id,
          payload: { source: result.text },
        },
      },
    });
  };

  const handleSendPlots = async () => {
    if (!result?.plots.length) return;
    setSendingPlots(true);
    try {
      for (const plot of result.plots) {
        sendToBlackboard({
          dataUrl: plot,
          opts: {
            meta: {
              boardKind: 'plot',
              boardId: id,
              payload: { rcellId: id, lang: 'r', source: code },
            },
          },
        });
      }
    } finally {
      setSendingPlots(false);
    }
  };

  let extraButton: JSX.Element | null = null;
  if (result?.plots.length) {
    extraButton = (
      <button
        type="button"
        onClick={handleSendPlots}
        disabled={sendingPlots}
        className="inline-flex items-center gap-1.5 rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <ChartColumn aria-hidden className="h-3.5 w-3.5" />
        {sendingPlots ? 'Enviando…' : 'Enviar gráficos'}
      </button>
    );
  } else if (result?.text) {
    extraButton = (
      <button
        type="button"
        onClick={handleSendOutput}
        className="inline-flex items-center gap-1.5 rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <FileText aria-hidden className="h-3.5 w-3.5" />
        Enviar resultado
      </button>
    );
  }

  return (
    <div ref={cellRef} className="my-6 overflow-hidden rounded border border-ink-200 bg-ink-50 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-2 border-b border-ink-200 bg-white px-4 py-2">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-ink-700">
          <Terminal aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="truncate">{title ?? 'Código R'}</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {open ? (
            <>
              <ChevronUp aria-hidden className="h-3 w-3" />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown aria-hidden className="h-3 w-3" />
              Explorar código
            </>
          )}
        </button>
      </div>

      {open && (
        <>
      <CodeMirror
        value={code}
        height="auto"
        extensions={[rLanguage]}
        onChange={(value) => setCode(value)}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
        className="text-sm"
        aria-label={title ? `Editor de código R: ${title}` : 'Editor de código R'}
      />

      <div className="flex items-center gap-2 border-t border-ink-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={() => run(code)}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {isRunning ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
              {isBooting ? 'Cargando R…' : 'Ejecutando…'}
            </>
          ) : (
            <>
              <Play aria-hidden className="h-3.5 w-3.5" />
              Ejecutar
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setCode(initialCode)}
          disabled={code === initialCode}
          className="rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Restaurar código original
        </button>
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          className="inline-flex items-center gap-1.5 rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <Camera aria-hidden className="h-3.5 w-3.5" />
          {capturing ? 'Capturando…' : 'Capturar'}
        </button>
        <button
          type="button"
          onClick={handleSendCode}
          disabled={sendingCode}
          className="inline-flex items-center gap-1.5 rounded border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <Send aria-hidden className="h-3.5 w-3.5" />
          {sendingCode ? 'Enviando…' : 'Enviar código'}
        </button>
        {extraButton}
        {captureError && (
          <span className="text-xs text-danger-600" role="alert">
            Error: {captureError}
          </span>
        )}
        {isBooting && (
          <output className="text-xs text-ink-500">
            Iniciando entorno R (WebAssembly), solo la primera vez puede tardar unos segundos…
          </output>
        )}
      </div>
        </>
      )}

      {webRStatus === 'error' && (
        <div className="px-4 py-2 text-sm text-danger-700 bg-danger-50 border-t border-ink-200" role="alert">
          <strong>No se pudo iniciar el entorno R (WebAssembly).</strong>
          <div className="mt-1 text-xs">
            {webRError ?? 'Error desconocido al cargar WebR.'}
          </div>
          {typeof window !== 'undefined' && !window.crossOriginIsolated && (
            <div className="mt-1 text-xs">
              Este sitio no está &quot;cross-origin isolated&quot; (
              <code>window.crossOriginIsolated === false</code>). WebR
              necesita <code>SharedArrayBuffer</code>, lo cual requiere que
              el sitio se sirva por <strong>HTTPS</strong> (o{' '}
              <code>localhost</code>) y que las cabeceras{' '}
              <code>Cross-Origin-Opener-Policy: same-origin</code> y{' '}
              <code>Cross-Origin-Embedder-Policy: credentialless</code>{' '}
              lleguen sin ser eliminadas por un proxy/reverse-proxy.
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="animate-fade-in border-t border-ink-200">
          {result.error && (
            <div className="px-4 py-2 text-sm text-danger-700 bg-danger-50" role="alert">
              <strong>Error en R:</strong> {result.error}
            </div>
          )}
          {result.text && <ConsoleOutput text={result.text} />}
          {result.plots.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`Gráfico generado por R (resultado ${i + 1})`}
              className="mx-auto block max-w-full bg-white p-2"
            />
          ))}
        </div>
      )}
    </div>
  );
}
