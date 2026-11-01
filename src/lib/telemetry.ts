// Telemetría de prueba de campo: cola local + flush por lotes a /api/track.
// Especificación: prueba-campo/docs/03-telemetria.md §2.
//
// API pública:
//   initTelemetry(token, {contentOptIn})  : tras el consentimiento
//   track(kind, payload?, moduleSlug?)    : fire-and-forget, nunca lanza
//   telemetryEnabled()                    : hay consentimiento activo
//   contentOptIn()                        : el participante aceptó guardar texto
//   flushTelemetry()                      : fuerza envío (p. ej. al salir de un módulo)
//   disableTelemetry()                    : retiro/opt-out local
//
// La cola persiste en localStorage (pequeña, ≤500 eventos), no IndexedDB;
// para no acoplar al session-store local. Flush cuando:
//   a) la cola llega a FLUSH_AT eventos
//   b) pasan FLUSH_MS desde el primer evento encolado
//   c) visibilitychange→hidden o pagehide (sendBeacon)
// Reintentos con backoff exponencial acotado (RETRY_MS).

const QUEUE_KEY = 'ft-queue';
const CTX_KEY = 'ft-ctx';
const FLUSH_AT = 15;
const FLUSH_MS = 10_000;
const HEARTBEAT_MS = 60_000;
const RETRY_MS = [30_000, 120_000, 600_000];
const MAX_QUEUE = 500;

export interface TelemetryCtx {
  clientId: string;
  startedAt: number;
  token: string;
  consent?: boolean;
  contentOptIn?: boolean;
  consentVersion?: string;
  participantCode?: string;
}

interface QueuedEvent {
  kind: string;
  moduleSlug?: string;
  ts: number;
  payload?: Record<string, unknown>;
}

let ctx: TelemetryCtx | null = null;
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryStep = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let listenersBound = false;

function readCtx(): TelemetryCtx | null {
  try {
    const c = JSON.parse(localStorage.getItem(CTX_KEY) ?? 'null');
    return c?.token && c?.consent ? (c as TelemetryCtx) : null;
  } catch {
    return null;
  }
}

function persistQueue() {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // cuota llena: perder la cola es preferible a romper la app
  }
}

function newClientId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function telemetryEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (ctx) return true;
  return readCtx() !== null;
}

export function contentOptIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(ctx?.contentOptIn ?? readCtx()?.contentOptIn);
}

/** Contexto actual (para ConsentGate / PrivacyToggle / tests). */
export function getTelemetryCtx(): TelemetryCtx | null {
  if (typeof window === 'undefined') return null;
  return ctx ?? readCtx();
}

/** Llamar UNA vez tras el consentimiento (o al montar si ya existe en ft-ctx). */
export function initTelemetry(
  token: string,
  opts: { contentOptIn?: boolean; consentVersion?: string; participantCode?: string } = {},
): void {
  if (typeof window === 'undefined') return;
  let prev: TelemetryCtx | null = null;
  try {
    prev = JSON.parse(localStorage.getItem(CTX_KEY) ?? 'null');
  } catch {
    prev = null;
  }
  ctx = {
    ...prev,
    clientId: prev?.clientId ?? newClientId(),
    startedAt: prev?.startedAt ?? Date.now(),
    token,
    consent: true,
    contentOptIn: opts.contentOptIn ?? prev?.contentOptIn ?? false,
    consentVersion: opts.consentVersion ?? prev?.consentVersion,
    participantCode: opts.participantCode ?? prev?.participantCode,
  };
  try {
    localStorage.setItem(CTX_KEY, JSON.stringify(ctx));
    queue = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    if (!Array.isArray(queue)) queue = [];
  } catch {
    queue = [];
  }
  bindListeners();
  startHeartbeat();
  track('session-start');
}

function onPageHide() {
  flushBeacon();
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') flushBeacon();
}

// Puente para código fuera del árbol React (p. ej. packages/blackboard):
// dispatchEvent(new CustomEvent('ft:track', { detail: { kind, payload, moduleSlug } }))
// El listener aplica la misma regla de opt-in que el servidor.
function onExternalTrack(e: Event) {
  const d = (e as CustomEvent).detail as {
    kind?: unknown;
    payload?: unknown;
    moduleSlug?: unknown;
  } | null;
  if (!d || typeof d.kind !== 'string') return;
  const payload: Record<string, unknown> | undefined =
    d.payload && typeof d.payload === 'object' && !Array.isArray(d.payload)
      ? { ...(d.payload as Record<string, unknown>) }
      : undefined;
  if (payload && !contentOptIn()) {
    delete payload.code;
    delete payload.text;
  }
  track(d.kind, payload, typeof d.moduleSlug === 'string' ? d.moduleSlug : undefined);
}

function bindListeners() {
  if (listenersBound) return;
  listenersBound = true;
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('ft:track', onExternalTrack);
}

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => track('session-ping'), HEARTBEAT_MS);
}

export function track(
  kind: string,
  payload?: Record<string, unknown>,
  moduleSlug?: string,
): void {
  if (!telemetryEnabled()) return;
  queue.push({ kind, moduleSlug, ts: Date.now(), payload });
  if (queue.length >= FLUSH_AT) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    void flush();
  } else {
    persistQueue();
    flushTimer ??= setTimeout(() => {
      flushTimer = null;
      void flush();
    }, FLUSH_MS);
  }
}

export function flushTelemetry(): void {
  void flush();
}

async function flush() {
  if (!ctx || queue.length === 0) return;
  const batch = queue;
  queue = [];
  persistQueue();
  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-participant-token': ctx.token,
      },
      keepalive: true,
      body: JSON.stringify({
        clientId: ctx.clientId,
        startedAt: ctx.startedAt,
        device: {
          ua: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        },
        events: batch,
      }),
    });
    if (!res.ok) throw new Error(`track ${res.status}`);
    retryStep = 0;
  } catch {
    requeue(batch);
    scheduleRetry();
  }
}

function flushBeacon() {
  if (!ctx || queue.length === 0) return;
  const batch = queue;
  queue = [];
  persistQueue();
  try {
    const blob = new Blob(
      [
        JSON.stringify({
          clientId: ctx.clientId,
          startedAt: ctx.startedAt,
          device: { ua: navigator.userAgent },
          events: batch,
        }),
      ],
      { type: 'application/json' },
    );
    // sendBeacon no admite headers custom: el token viaja en query (?t=)
    if (!navigator.sendBeacon(`/api/track?t=${encodeURIComponent(ctx.token)}`, blob)) {
      requeue(batch);
    }
  } catch {
    requeue(batch);
  }
}

function requeue(batch: QueuedEvent[]) {
  queue = [...batch, ...queue].slice(-MAX_QUEUE);
  persistQueue();
}

function scheduleRetry() {
  if (retryTimer) return;
  const delay = RETRY_MS[Math.min(retryStep, RETRY_MS.length - 1)];
  retryStep += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flush();
  }, delay);
}

/** Slug del módulo actual a partir de la URL (/cursos/<slug>). */
export function currentModuleSlug(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const seg = window.location.pathname.split('/').filter(Boolean);
  return seg[0] === 'cursos' && seg[1] ? decodeURIComponent(seg[1]) : undefined;
}

/** Apaga la telemetría en este navegador (el borrado remoto va por /api/withdraw). */
export function disableTelemetry(): void {
  queue = [];
  ctx = null;
  if (flushTimer) clearTimeout(flushTimer);
  if (retryTimer) clearTimeout(retryTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  flushTimer = retryTimer = heartbeatTimer = null;
  listenersBound = false;
  window.removeEventListener('pagehide', onPageHide);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('ft:track', onExternalTrack);
  try {
    localStorage.removeItem(CTX_KEY);
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // noop
  }
}
