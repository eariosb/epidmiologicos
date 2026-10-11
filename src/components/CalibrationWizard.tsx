'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Guided 4-point homography calibration for That_Board.
 *
 * Flow: POST /api/vision/calibrate/start → the overlay shows 4 crosses at
 * the projected corners → the teacher taps each cross with the IR pen → the
 * Python vision service records the blob position on every pen-down → we
 * poll /api/vision/calibrate/status until `done`. Total time < 10 s.
 *
 * Without the vision service the wizard degrades gracefully to an error
 * state — calibration only exists when running on That_Board hardware.
 */

// Cross positions, as fractions of the projected area (order matches the
// service's expected point order: TL, TR, BR, BL).
const CROSSES: { x: number; y: number }[] = [
  { x: 0.08, y: 0.08 },
  { x: 0.92, y: 0.08 },
  { x: 0.92, y: 0.92 },
  { x: 0.08, y: 0.92 },
];

type Phase = 'starting' | 'capturing' | 'done' | 'error';

function crossClass(index: number, captured: number): string {
  if (index < captured) return 'border-success-405 bg-success-405/30';
  if (index === captured) return 'border-brand-400 bg-brand-400/20';
  return 'border-white/50';
}

export function CalibrationWizard({ onClose }: Readonly<{ onClose: () => void }>) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [captured, setCaptured] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    void (async () => {
      try {
        const res = await fetch('/api/vision/calibrate/start', { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!cancelledRef.current) setPhase('capturing');
      } catch {
        if (!cancelledRef.current) {
          setError('No se pudo contactar el servicio de visión. ¿Está corriendo el tracker?');
          setPhase('error');
        }
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Poll calibration progress while capturing.
  useEffect(() => {
    if (phase !== 'capturing') return;
    const id = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch('/api/vision/calibrate/status');
          if (!res.ok) return;
          const data = (await res.json()) as { done?: boolean; points?: unknown[] };
          if (cancelledRef.current) return;
          setCaptured(data.points?.length ?? 0);
          if (data.done) setPhase('done');
        } catch {
          // transient poll failure — keep polling
        }
      })();
    }, 400);
    return () => clearInterval(id);
  }, [phase]);

  // Esc cancels.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <dialog
      open
      className="fixed inset-0 z-[80] h-full w-full max-w-none bg-ink-900/70 p-0 backdrop-blur-sm"
      aria-label="Calibración del puntero"
    >
      <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-lg bg-white px-4 py-2 shadow-xl dark:bg-ink-800">
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
          {phase === 'starting' && 'Iniciando calibración…'}
          {phase === 'capturing' && `Toca cada cruz con el lápiz (${captured}/4)`}
          {phase === 'done' && 'Calibración completada'}
          {phase === 'error' && 'Calibración no disponible'}
        </p>
        {phase === 'error' && (
          <p className="mt-1 text-xs text-danger-600">{error}</p>
        )}
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-700"
          >
            {phase === 'done' ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>

      {(phase === 'capturing' || phase === 'starting') &&
        CROSSES.map((c, i) => (
          <div
            key={`${c.x}-${c.y}`}
            className="pointer-events-none absolute"
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
            aria-hidden
          >
            <div
              className={`h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors ${crossClass(i, captured)}`}
            >
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current opacity-70" />
              <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current opacity-70" />
            </div>
          </div>
        ))}
    </dialog>
  );
}
