'use client';

import { useEffect, useState, useRef } from 'react';
import { useBroadcast } from '@/hooks/useBroadcast';
import { tokens } from '@/lib/tokens';

export function RemoteCursor() {
  const { subscribe, broadcast, mode } = useBroadcast();
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [pulse, setPulse] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });

  // Emit cursor position when in teacher mode (reuses the shared channel —
  // one BroadcastChannel per pointermove caused avoidable churn).
  useEffect(() => {
    if (mode !== 'teacher') return;

    const handleMove = (e: PointerEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const { clientX, clientY } = e;
      rafRef.current = requestAnimationFrame(() => {
        if (clientX === lastRef.current.x && clientY === lastRef.current.y) return;
        lastRef.current = { x: clientX, y: clientY };
        broadcast({ type: 'cursor', x: clientX, y: clientY });
      });
    };

    const handleClick = (e: PointerEvent) => {
      broadcast({ type: 'click', x: e.clientX, y: e.clientY });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('click', handleClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mode, broadcast]);

  // Receive cursor events when in student mode
  useEffect(() => {
    if (mode !== 'student') return;
    const unsubscribe = subscribe((msg) => {
      if (msg.type === 'cursor') {
        setCursor({ x: msg.x, y: msg.y });
      } else if (msg.type === 'click') {
        setPulse({ x: msg.x, y: msg.y });
        setTimeout(() => setPulse(null), 800);
      }
    });
    return unsubscribe;
  }, [mode, subscribe]);

  if (mode !== 'student' || !cursor) return null;

  return (
    <>
      {/* Cursor */}
      <div
        className="pointer-events-none fixed z-50 transition-transform duration-75 ease-out"
        style={{ left: cursor.x, top: cursor.y }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M4 2L4 16L8 12L11 18L13 17L10 11L16 11Z"
            fill={tokens.ui.cursor}
            fillOpacity="0.7"
            stroke={tokens.ui.cursor}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Click pulse */}
      {pulse && (
        <div
          className="pointer-events-none fixed z-50 animate-fade-in rounded-full"
          style={{
            left: pulse.x - 20,
            top: pulse.y - 20,
            width: 40,
            height: 40,
            border: `2px solid ${tokens.ui.cursor}`,
            borderRadius: '50%',
            opacity: 0.5,
          }}
        />
      )}
    </>
  );
}
