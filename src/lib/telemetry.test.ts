import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as t from './telemetry';

// Instancia única (como en producción). disableTelemetry() resetea todo el
// estado global del módulo: ctx, cola, timers y listeners.

const CTX = {
  token: 'tok-abc',
  consent: true,
  clientId: 'cid-1',
  startedAt: 1_700_000_000_000,
};

function mockFetch(ok = true) {
  const f = vi.fn().mockResolvedValue({ ok } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

function queueInStorage() {
  return JSON.parse(localStorage.getItem('ft-queue') ?? '[]');
}

beforeEach(() => {
  t.disableTelemetry();
  localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('telemetry', () => {
  it('sin consentimiento: track() es no-op, cero requests y nada en storage', async () => {
    const fetchMock = mockFetch();
    t.track('module-visit', { dwellMs: 1000 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('ft-queue')).toBeNull();
    expect(t.telemetryEnabled()).toBe(false);
  });

  it('initTelemetry persiste ctx y registra session-start en la cola', async () => {
    mockFetch();
    t.initTelemetry(CTX.token, { participantCode: 'PC-0001' });
    expect(t.telemetryEnabled()).toBe(true);
    const ctx = JSON.parse(localStorage.getItem('ft-ctx')!);
    expect(ctx.clientId).toBeTruthy();
    expect(ctx.token).toBe('tok-abc');
    const kinds = queueInStorage().map((e: { kind: string }) => e.kind);
    expect(kinds).toContain('session-start');
  });

  it('al llegar a 15 eventos dispara fetch POST con token y lote', async () => {
    const fetchMock = mockFetch();
    t.initTelemetry(CTX.token);
    for (let i = 0; i < 14; i++) t.track('term-view', { key: `k${i}` });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/track');
    expect((init.headers as Record<string, string>)['x-participant-token']).toBe('tok-abc');
    const body = JSON.parse(init.body as string);
    expect(body.events).toHaveLength(15); // session-start + 14
    expect(body.events[1].kind).toBe('term-view');
    expect(body.events[1].payload.key).toBe('k0');
    expect(body.clientId).toBeTruthy();
    expect(localStorage.getItem('ft-queue')).toBe('[]');
  });

  it('cola persiste en localStorage antes del flush (supervivencia a recarga)', async () => {
    mockFetch();
    t.initTelemetry(CTX.token);
    t.track('term-view', { key: 'sigla' });
    const q = queueInStorage();
    expect(q).toHaveLength(2); // session-start + term-view
    expect(q[1].kind).toBe('term-view');
  });

  it('flush por timer a los 10 s con menos de 15 eventos', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    t.initTelemetry(CTX.token);
    t.track('term-view', { key: 'x' });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetch fallido → lote vuelve a la cola (no se pierde)', async () => {
    const fetchMock = mockFetch(false);
    t.initTelemetry(CTX.token);
    for (let i = 0; i < 14; i++) t.track('term-view', { key: `k${i}` });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(queueInStorage()).toHaveLength(15));
  });

  it('pagehide usa sendBeacon con token en query', async () => {
    mockFetch();
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    t.initTelemetry(CTX.token);
    t.track('module-visit', { dwellMs: 500 });
    window.dispatchEvent(new Event('pagehide'));
    expect(beacon).toHaveBeenCalledTimes(1);
    const [url] = beacon.mock.calls[0];
    expect(String(url)).toContain('/api/track?t=tok-abc');
  });

  it('disableTelemetry limpia ctx, cola y detiene tracking', async () => {
    const fetchMock = mockFetch();
    t.initTelemetry(CTX.token);
    t.disableTelemetry();
    expect(localStorage.getItem('ft-ctx')).toBeNull();
    expect(localStorage.getItem('ft-queue')).toBeNull();
    expect(t.telemetryEnabled()).toBe(false);
    t.track('term-view', { key: 'x' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('contentOptIn refleja el ctx persistido', async () => {
    mockFetch();
    t.initTelemetry(CTX.token, { contentOptIn: true });
    expect(t.contentOptIn()).toBe(true);
    t.disableTelemetry();
    expect(t.contentOptIn()).toBe(false);
  });
});
