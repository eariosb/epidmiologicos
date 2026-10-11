'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import clsx from 'clsx';

export interface CaptureOverlayProps {
  onCapture: (dataUrl: string, rect: { x: number; y: number; width: number; height: number }) => void;
  onCancel: () => void;
}

function normalizeRect(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const width = Math.abs(b.x - a.x);
  const height = Math.abs(b.y - a.y);
  return { x, y, width, height };
}

async function cropToSelection(
  fullDataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  scale = 2,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sx = Math.round((window.scrollX + rect.x) * scale);
      const sy = Math.round((window.scrollY + rect.y) * scale);
      const sw = Math.round(rect.width * scale);
      const sh = Math.round(rect.height * scale);
      if (sw <= 0 || sh <= 0) {
        reject(new Error('Selección demasiado pequeña'));
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto 2D'));
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = fullDataUrl;
  });
}

export function CaptureOverlay({ onCapture, onCancel }: CaptureOverlayProps) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.cursor = 'crosshair';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setEnd({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = useCallback(async () => {
    if (!start || !end) return;
    setDragging(false);
    const rect = normalizeRect(start, end);
    if (rect.width < 8 || rect.height < 8) {
      onCancel();
      return;
    }
    try {
      const fullDataUrl = await toPng(document.body, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        filter: (node) => !(node as HTMLElement).dataset?.noCapture,
      });
      const cropped = await cropToSelection(fullDataUrl, rect, 2);
      onCapture(cropped, rect);
    } catch (err) {
      // Not silent: a failed capture (tainted canvas, canvas 2D limits)
      // must tell the teacher what happened instead of just vanishing.
      console.error('[capture] region capture failed', err);
      window.alert(
        'No se pudo capturar la región. Prueba a reducir el tamaño de la selección o recargar la página.',
      );
      onCancel();
    }
  }, [start, end, onCapture, onCancel]);

  const rect = start && end ? normalizeRect(start, end) : null;

  return (
    <div
      ref={overlayRef}
      data-no-capture
      className="fixed inset-0 z-[100] bg-black/20"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="pointer-events-none absolute left-4 top-4 rounded bg-black/70 px-3 py-1.5 text-xs text-white shadow">
        Arrastra para seleccionar la región. Esc para cancelar.
      </div>
      {rect && (
        <div
          className={clsx(
            'pointer-events-none absolute border-2 border-brand-500 bg-brand-500/20',
            dragging && 'bg-brand-500/10'
          )}
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
    </div>
  );
}
