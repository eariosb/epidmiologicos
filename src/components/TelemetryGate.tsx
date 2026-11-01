'use client';

// Provee telemetría al árbol de la app: al montar, lee ft-ctx de
// localStorage y, si hay consentimiento + token, inicializa el pipeline.
// Los componentes consumen track() vía useTelemetry(). Sin consentimiento
// el provider es inerte: track() no-op, cero requests.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  contentOptIn as readContentOptIn,
  getTelemetryCtx,
  initTelemetry,
  telemetryEnabled,
  track as rawTrack,
} from '@/lib/telemetry';

interface TelemetryApi {
  /** Registra un evento; no-op si no hay consentimiento. */
  track: (kind: string, payload?: Record<string, unknown>, moduleSlug?: string) => void;
  /** true si la telemetría está activa y con consentimiento. */
  enabled: boolean;
  /** true si el participante aceptó guardar su propio texto (código, preguntas). */
  contentOptIn: boolean;
}

const TelemetryCtx = createContext<TelemetryApi>({
  track: () => {},
  enabled: false,
  contentOptIn: false,
});

export function useTelemetry(): TelemetryApi {
  return useContext(TelemetryCtx);
}

export default function TelemetryGate({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [optIn, setOptIn] = useState(false);

  useEffect(() => {
    const ctx = getTelemetryCtx();
    if (ctx?.token && ctx.consent) {
      initTelemetry(ctx.token, {
        contentOptIn: ctx.contentOptIn,
        consentVersion: ctx.consentVersion,
        participantCode: ctx.participantCode,
      });
    }
    setEnabled(telemetryEnabled());
    setOptIn(readContentOptIn());
  }, []);

  const track = useCallback(
    (kind: string, payload?: Record<string, unknown>, moduleSlug?: string) =>
      rawTrack(kind, payload, moduleSlug),
    [],
  );

  const api = useMemo<TelemetryApi>(
    () => ({ track, enabled, contentOptIn: optIn }),
    [track, enabled, optIn],
  );

  return (
    <TelemetryCtx.Provider value={api}>
      {children}
      {enabled && <FieldTestBanner />}
    </TelemetryCtx.Provider>
  );
}

// Aviso permanente pero discreto mientras la telemetría está activa
// (doc 04 §4.3: el participante debe recordar que está siendo registrado
// y tener a un clic su panel de privacidad).
function FieldTestBanner() {
  return (
    <div
      className="fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-full border border-brand-200 bg-white/95 px-3 py-1.5 text-xs text-ink-600 shadow-md"
      role="status"
    >
      <span aria-hidden>🧪</span>
      <span>
        Prueba de campo activa ·{' '}
        <a href="/privacidad" className="font-medium text-brand-700 underline decoration-dotted">
          privacidad
        </a>
      </span>
    </div>
  );
}
