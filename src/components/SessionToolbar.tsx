'use client';

import { useState } from 'react';
import { Play, Square, FileText, Download } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { exportSessionToPDF, type BoardPage } from '@/lib/pdf-export';
import { exportSessionMarkdown } from '@/lib/markdown-export';
import { logEvent, useBlackboardContext } from '@cursos/blackboard';
import { SessionManager } from './SessionManager';
import { CalibrationWizard } from './CalibrationWizard';
import { ModulesMenu, type ModuleBlock, type ModuleNavItem } from './ModulesMenu';
import type { BlackboardCanvasRef } from '@cursos/blackboard';

interface SessionToolbarProps {
  canvasRef?: React.RefObject<BlackboardCanvasRef | null>;
  modules: ModuleNavItem[];
  blocks: readonly ModuleBlock[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function SessionToolbar({ canvasRef, modules, blocks }: Readonly<SessionToolbarProps>) {
  const { session, endSession, newSession } = useSession();
  const { state, storage } = useBlackboardContext();
  const [exporting, setExporting] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const isEnded = session?.status === 'ended';

  /**
   * Rasterizes the pages the class actually used: the session's
   * sceneVisits (deduplicated, chronological) take priority — a session
   * spanning several modules must carry all of them, not just the pages
   * of the module open right now. Sessions recorded before sceneVisits
   * existed fall back to every page of the current module.
   * The live scene goes through the canvas (freshest pixels); stored
   * scenes render headless via exportToBlob + their persisted `files`.
   */
  const collectBoardPages = async (): Promise<BoardPage[]> => {
    canvasRef?.current?.flush?.();
    const visitedIds = [...new Set((session?.sceneVisits ?? []).map((v) => v.sceneId))];
    const slug = state.moduleContext?.slug;
    let scenes;
    if (visitedIds.length > 0) {
      // Visited pages may live in another module's scene store — load
      // them on demand instead of relying on the in-memory map.
      const loaded = await Promise.all(
        visitedIds.map((id) => state.scenes[id] ?? storage.getScene(id)),
      );
      scenes = loaded.filter((s): s is NonNullable<typeof s> => s != null);
    } else {
      scenes = Object.values(state.scenes)
        .filter((s) => (slug ? s.moduleSlug === slug : true))
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    const { exportToBlob } = (await import('@excalidraw/excalidraw')) as unknown as {
      exportToBlob: (opts: {
        elements: readonly unknown[];
        appState: Record<string, unknown>;
        files: Record<string, unknown>;
        mimeType: string;
      }) => Promise<Blob>;
    };
    const rendered = await Promise.all(
      scenes.map(async (scene, i) => {
        try {
          const blob =
            scene.id === state.activeSceneId
              ? await canvasRef?.current?.getImage?.()
              : await exportToBlob({
                  elements: scene.elements,
                  appState: scene.appState,
                  files: scene.files ?? {},
                  mimeType: 'image/png',
                });
          if (!blob) return null;
          return { label: `Página ${i + 1}: ${scene.id}`, dataUrl: await blobToDataUrl(blob) };
        } catch {
          // Skip scenes that fail to rasterize (empty/corrupt) instead of
          // aborting the whole report.
          return null;
        }
      }),
    );
    return rendered.filter((p): p is BoardPage => p !== null);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const boardPages = await collectBoardPages();
      await exportSessionToPDF({ boardPages });
      void logEvent('pdf-export', `session exported to PDF (${boardPages.length} board pages)`);
    } catch (err) {
      console.error('[session] PDF export failed', err);
      void logEvent('pdf-export', `export failed: ${err instanceof Error ? err.message : String(err)}`);
      window.alert('No se pudo generar el PDF. Revisa el panel de diagnóstico.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportMd = async () => {
    try {
      await exportSessionMarkdown();
      void logEvent('md-export', 'session exported to Markdown');
    } catch (err) {
      console.error('[session] Markdown export failed', err);
      void logEvent('md-export', `export failed: ${err instanceof Error ? err.message : String(err)}`);
      window.alert('No se pudo generar el Markdown. Revisa el panel de diagnóstico.');
    }
  };

  const handleEnd = async () => {
    if (confirm('¿Marcar el fin de la sesión? Podrás seguir exportándola después.')) {
      await endSession();
    }
  };

  const handleNew = async () => {
    const warn =
      session?.status === 'active'
        ? 'La sesión en curso quedará cerrada. '
        : '';
    const title = window.prompt(
      `${warn}Título de la nueva sesión`,
      `Sesión ${new Date().toLocaleDateString('es-CO')}`,
    );
    if (title) await newSession(title, state.moduleContext?.slug);
  };

  return (
    <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-3 py-1.5">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-ink-700">
          {session?.title ?? 'Sesión actual'}
          {isEnded && <span className="ml-2 rounded bg-ink-200 px-1.5 py-0.5 text-[10px] text-ink-600">Finalizada</span>}
          {!isEnded && session && (
            <span className="ml-2 rounded bg-success-105 px-1.5 py-0.5 text-[10px] text-success-705">En curso</span>
          )}
        </span>
        <span className="text-[10px] text-ink-400">
          {session?.startedAt && `Inicio: ${new Date(session.startedAt).toLocaleTimeString()}`}
          {session?.endedAt && ` · Fin: ${new Date(session.endedAt).toLocaleTimeString()}`}
          {session && !isEnded && ` · Últ. guardado: ${new Date(session.updatedAt).toLocaleTimeString()}`}
        </span>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleNew}
          className="inline-flex items-center gap-1 rounded border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
          title="Iniciar una nueva sesión de clase"
        >
          <Play aria-hidden className="h-3 w-3" />
          Nueva
        </button>
        {session?.status === 'active' && (
          <button
            type="button"
            onClick={handleEnd}
            className="inline-flex items-center gap-1 rounded border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
            title="Marcar el fin de la sesión"
          >
            <Square aria-hidden className="h-3 w-3" />
            Finalizar
          </button>
        )}
        <SessionManager canvasRef={canvasRef} />
        <button
          type="button"
          onClick={() => setCalibrating(true)}
          className="rounded border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
          title="Calibración del puntero IR (That_Board): 4 puntos, ~10 s"
        >
          Calibrar
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={exporting}
          className="inline-flex items-center gap-1 rounded bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          title="Exportar sesión a PDF"
        >
          {exporting ? (
            'Generando…'
          ) : (
            <>
              <FileText aria-hidden className="h-3 w-3" />
              PDF
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleExportMd}
          className="inline-flex items-center gap-1 rounded border border-ink-200 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
          title="Exportar sesión a Markdown"
        >
          <Download aria-hidden className="h-3 w-3" />
          MD
        </button>
        <ModulesMenu modules={modules} blocks={blocks} />
      </div>
      {calibrating && <CalibrationWizard onClose={() => setCalibrating(false)} />}
    </div>
  );
}
