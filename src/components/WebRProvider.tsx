'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { getWebR } from '@/lib/webr';

export type WebRStatus = 'idle' | 'loading' | 'ready' | 'error';

interface WebRContextValue {
  status: WebRStatus;
  error: string | null;
  /** Lazily start initialisation (called automatically on first RCell mount). */
  ensureStarted: () => void;
}

const WebRContext = createContext<WebRContextValue>({
  status: 'idle',
  error: null,
  ensureStarted: () => {},
});

/**
 * Provides a single shared WebR boot lifecycle for the whole app.
 * Initialisation only starts once the first RCell requests it
 * (via `ensureStarted`), so pages without code cells never pay
 * the WebR download cost.
 */
export function WebRProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebRStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const ensureStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus('loading');
    getWebR()
      .then(() => setStatus('ready'))
      .catch((err: unknown) => {
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <WebRContext.Provider value={{ status, error, ensureStarted }}>
      {children}
    </WebRContext.Provider>
  );
}

export function useWebRStatus() {
  return useContext(WebRContext);
}
