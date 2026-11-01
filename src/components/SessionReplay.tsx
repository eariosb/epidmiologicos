'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Camera,
  Flag,
  HelpCircle,
  PenLine,
  Play,
  X,
} from 'lucide-react';
import {
  logEvent,
  useBlackboardContext,
  useBlackboardScene,
  type BlackboardCanvasRef,
} from '@cursos/blackboard';
import {
  listSessionCaptures,
  type Capture,
  type Session,
} from '@/lib/session-store';
import {
  buildSessionTimeline,
  sceneLabel,
  type TimelineItem,
} from '@/lib/session-timeline';

interface SessionReplayProps {
  session: Session;
  /** Whether this session is the active one; board restore only then. */
  isActive: boolean;
  canvasRef?: React.RefObject<BlackboardCanvasRef | null>;
  onClose: () => void;
}

const KIND_ICON: Record<TimelineItem['kind'], typeof Play> = {
  start: Play,
  end: Flag,
  section: BookOpen,
  board: PenLine,
  capture: Camera,
  question: HelpCircle,
};

const KIND_COLOR: Record<TimelineItem['kind'], string> = {
  start: 'text-success-705',
  end: 'text-ink-500',
  section: 'text-brand-600',
  board: 'text-accent-600',
  capture: 'text-ink-600',
  question: 'text-warning-600',
};

function fmt(ts: number): string {
  return new Date(ts).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Session replay: the class as a chronological, walkable timeline.
 * Sections link back to their module, board entries restore the exact
 * page on the canvas, captures show their thumbnail.
 */
export function SessionReplay({ session, isActive, canvasRef, onClose }: Readonly<SessionReplayProps>) {
  const { dispatch, storage } = useBlackboardContext();
  const { loadScene } = useBlackboardScene();
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    void listSessionCaptures(session).then((c) => {
      if (alive) {
        setCaptures(c);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [session]);

  const showOnBoard = async (sceneId: string) => {
    canvasRef?.current?.flush?.();
    const scene = await storage.getScene(sceneId);
    if (!scene) {
      void logEvent('session', `replay: scene no longer exists: ${sceneId}`);
      window.alert('Esa página de la pizarra ya no existe.');
      return;
    }
    await loadScene(sceneId);
    dispatch({ type: 'SELECT_SCENE', id: sceneId });
    // The modal covers the whole viewport: close it so the restored page
    // is actually visible: the point of "Ver en pizarra".
    onClose();
  };

  const items = buildSessionTimeline(session, captures);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded border border-ink-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-ink-800">Recorrer sesión</h3>
            <p className="text-[10px] text-ink-400">
              {session.title} · {items.length} momentos
              {!isActive && ' · carga la sesión para recorrerla en la pizarra'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-400 hover:text-ink-600"
            aria-label="Cerrar recorrido"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <ol className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
          {!loaded ? (
            <li className="text-xs text-ink-500">Cargando…</li>
          ) : items.length <= (session.endedAt ? 2 : 1) ? (
            <li className="text-xs text-ink-500">
              La sesión no registró actividad todavía.
            </li>
          ) : (
            items.map((item, i) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-14 shrink-0 text-right font-mono text-[10px] text-ink-400">
                    {fmt(item.timestamp)}
                  </span>
                  <Icon aria-hidden className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${KIND_COLOR[item.kind]}`} />
                  <div className="min-w-0 flex-1 text-xs text-ink-700">
                    {item.kind === 'start' && <span>Inicio de la sesión</span>}
                    {item.kind === 'end' && <span>Fin de la sesión</span>}
                    {item.kind === 'section' && (
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{item.title}</span>
                        <Link
                          href={`/cursos/${item.slug}`}
                          className="shrink-0 rounded border border-brand-200 px-1.5 py-0.5 text-[10px] font-medium text-brand-600 hover:bg-brand-50"
                        >
                          Ir al módulo
                        </Link>
                      </span>
                    )}
                    {item.kind === 'board' && (
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{sceneLabel(item.sceneId)}</span>
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => void showOnBoard(item.sceneId)}
                            className="shrink-0 rounded border border-accent-200 px-1.5 py-0.5 text-[10px] font-medium text-accent-600 hover:bg-accent-50"
                          >
                            Ver en pizarra
                          </button>
                        )}
                      </span>
                    )}
                    {item.kind === 'capture' && (
                      <span className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.capture.thumbnail || item.capture.dataUrl}
                          alt={item.capture.name}
                          className="h-10 w-14 rounded border border-ink-100 object-cover"
                        />
                        <span className="truncate">
                          {item.capture.name}
                          <span className="block text-[10px] text-ink-400">{item.capture.type}</span>
                        </span>
                      </span>
                    )}
                    {item.kind === 'question' && (
                      <span className="flex items-start gap-1.5">
                        <span className={item.question.resolved ? 'text-success-600' : ''}>
                          {item.question.resolved ? '✓' : '•'}
                        </span>
                        <span className={item.question.resolved ? 'line-through opacity-60' : ''}>
                          {item.question.text}
                        </span>
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ol>
      </div>
    </div>
  );
}
