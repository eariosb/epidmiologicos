'use client';

import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Search, Play, ChartColumn, Calculator, Download, RotateCcw, Maximize2, X, Settings } from 'lucide-react';
import { useBlackboardContext } from '../lib/context';
import { useBlackboardLLM } from '../hooks/useBlackboardLLM';
import type { AssistantMode } from '../types/blackboard';
import { BlackboardCalculator } from './BlackboardCalculator';
import { BlackboardExport } from './BlackboardExport';
import { BlackboardSettingsPanel } from './BlackboardSettingsPanel';

interface BlackboardToolbarProps {
  canvasRef?: { current: { getImage?: () => Promise<Blob | null>; clear?: () => void } | null };
  /** Render as a vertical icon rail instead of a horizontal toolbar row. */
  vertical?: boolean;
}

export function BlackboardToolbar({ canvasRef, vertical }: Readonly<BlackboardToolbarProps>) {
  const { state, dispatch } = useBlackboardContext();
  const { ask } = useBlackboardLLM();
  // Popovers render in a portal anchored to the trigger: the vertical rail
  // has overflow-y-auto (clips horizontal popovers) and the canvas creates
  // its own stacking context, so absolute-inside-toolbar popovers get
  // clipped or painted under the canvas.
  const [popover, setPopover] = useState<{
    kind: 'calc' | 'export' | 'settings';
    rect: DOMRect;
  } | null>(null);

  const togglePopover =
    (kind: 'calc' | 'export' | 'settings') =>
    (e: MouseEvent<HTMLElement>) => {
      // Capture the rect synchronously: e.currentTarget is null by the time
      // React runs a deferred state updater.
      const rect = e.currentTarget.getBoundingClientRect();
      setPopover((p) => (p?.kind === kind ? null : { kind, rect }));
    };

  const handleAsk = async (mode: AssistantMode) => {
    const imageBlob = await canvasRef?.current?.getImage?.();
    const imageDataUrl = imageBlob ? await blobToDataUrl(imageBlob) : null;
    await ask(mode, '', imageDataUrl);
  };

  const handleClear = () => {
    if (confirm('¿Borrar el contenido actual del lienzo?')) {
      canvasRef?.current?.clear?.();
    }
  };

  return (
    <div
      className={
        vertical
          ? 'relative flex flex-col items-center gap-1 py-1.5'
          : 'relative flex items-center gap-1 border-b border-ink-200 bg-ink-50 px-2 py-1.5'
      }
    >
      <ToolbarButton onClick={() => handleAsk('ask')} title="Preguntar a la IA">
        <Sparkles aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleAsk('explain-selection')} title="Explicar selección">
        <Search aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleAsk('generate-r')} title="Generar código R">
        <Play aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => handleAsk('plot-r')} title="Graficar en R">
        <ChartColumn aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <div className={vertical ? 'my-0.5 h-px w-6 bg-ink-300' : 'mx-1 h-4 w-px bg-ink-300'} />
      <ToolbarButton onClick={togglePopover('calc')} title="Calculadora">
        <Calculator aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={togglePopover('export')} title="Exportar">
        <Download aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={handleClear} title="Limpiar lienzo">
        <RotateCcw aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      {!vertical && <div className="flex-1" />}
      <ToolbarButton
        onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
        title={state.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        <Maximize2 aria-hidden className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => dispatch({ type: 'SET_PANEL', isOpen: false })}
        title="Cerrar pizarra"
      >
        <X aria-hidden className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={togglePopover('settings')}
        title="Configuración"
      >
        <Settings aria-hidden className="h-4 w-4" />
      </ToolbarButton>

      {popover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[70]"
            style={
              vertical
                ? {
                    top: popover.rect.top,
                    right: window.innerWidth - popover.rect.left + 6,
                  }
                : {
                    top: popover.rect.bottom + 4,
                    right: window.innerWidth - popover.rect.right,
                  }
            }
          >
            {popover.kind === 'calc' && (
              <BlackboardCalculator onClose={() => setPopover(null)} />
            )}
            {popover.kind === 'export' && (
              <BlackboardExport
                onClose={() => setPopover(null)}
                canvasRef={canvasRef}
              />
            )}
            {popover.kind === 'settings' && (
              <BlackboardSettingsPanel onClose={() => setPopover(null)} />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
}: Readonly<{
  children: React.ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  title?: string;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-sm text-ink-700 transition-colors hover:bg-ink-200 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500 dark:text-ink-200 dark:hover:bg-ink-700 dark:hover:text-ink-50"
    >
      {children}
    </button>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
