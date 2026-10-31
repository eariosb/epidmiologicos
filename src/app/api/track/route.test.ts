import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mockea la capa de datos: el test valida la lógica del handler
// (auth, validación, sanitización, mapeo de filas) sin Supabase real.
const mocks = vi.hoisted(() => ({
  participantByToken: vi.fn(),
  rateHit: vi.fn(),
  fieldtestClient: vi.fn(),
}));

vi.mock('@/lib/fieldtest-server', () => ({
  CONSENT_VERSION: 'v1-2026-10',
  participantByToken: mocks.participantByToken,
  rateHit: mocks.rateHit,
  fieldtestClient: mocks.fieldtestClient,
  clientIp: () => '127.0.0.1',
}));

import { POST } from './route';

const PARTICIPANT = {
  id: 'p-1',
  code: 'PC-0001',
  course: 'epidemiologia',
  withdrawn_at: null,
  content_opt_in: false,
};

function fakeSupa() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data: { id: 'sess-1' }, error: null });
  const select = vi.fn(() => ({ single }));
  const upsert = vi.fn(() => ({ select }));
  const from = vi.fn((table: string) =>
    table === 'sessions' ? { upsert } : { insert },
  );
  return { from, upsert, single, insert };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  clientId: 'cid-1',
  startedAt: Date.now(),
  device: { ua: 'test', viewport: '1440x900' },
  events: [
    { kind: 'session-start', ts: Date.now() },
    { kind: 'term-view', moduleSlug: '01-mod', ts: Date.now(), payload: { key: 'k' } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.participantByToken.mockResolvedValue(PARTICIPANT);
  mocks.rateHit.mockResolvedValue(1);
  mocks.fieldtestClient.mockReturnValue(fakeSupa());
});

describe('POST /api/track', () => {
  it('401 sin token', async () => {
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('403 con token de participante inexistente o retirado', async () => {
    mocks.participantByToken.mockResolvedValue(null);
    const res = await POST(
      req(VALID_BODY, { 'x-participant-token': 'bad' }),
    );
    expect(res.status).toBe(403);
  });

  it('429 cuando se excede el rate limit', async () => {
    mocks.rateHit.mockResolvedValue(999);
    const res = await POST(
      req(VALID_BODY, { 'x-participant-token': 'tok' }),
    );
    expect(res.status).toBe(429);
  });

  it('400 con body inválido (sin clientId, events vacío o >200)', async () => {
    const h = { 'x-participant-token': 'tok' };
    expect((await POST(req({ ...VALID_BODY, clientId: 5 }, h))).status).toBe(400);
    expect((await POST(req({ ...VALID_BODY, events: [] }, h))).status).toBe(400);
    const big = { ...VALID_BODY, events: Array(201).fill({ kind: 'term-view', ts: 1 }) };
    expect((await POST(req(big, h))).status).toBe(400);
  });

  it('200: upsert de sesión e insert de filas mapeadas', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const res = await POST(
      req(VALID_BODY, { 'x-participant-token': 'tok' }),
    );
    expect(res.status).toBe(200);
    expect(supa.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'cid-1', participant_id: 'p-1', course: 'epidemiologia' }),
      { onConflict: 'participant_id,client_id' },
    );
    const rows = supa.insert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      session_id: 'sess-1',
      course: 'epidemiologia',
      kind: 'term-view',
      module_slug: '01-mod',
      payload: { key: 'k' },
    });
    expect(typeof rows[0].client_ts).toBe('string');
  });

  it('descarta eventos con kind fuera de la taxonomía', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const body = {
      ...VALID_BODY,
      events: [
        { kind: 'term-view', ts: Date.now() },
        { kind: 'evil;drop', ts: Date.now() },
        { kind: 'no-ts' },
      ],
    };
    const res = await POST(req(body, { 'x-participant-token': 'tok' }));
    expect(res.status).toBe(200);
    const rows = supa.insert.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('term-view');
  });

  it('sin content_opt_in borra payload.code/.text aunque el cliente los envíe', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const body = {
      ...VALID_BODY,
      events: [
        { kind: 'rcell-run', ts: Date.now(), payload: { cellId: 'c1', ok: true, code: 'x <- 1' } },
      ],
    };
    await POST(req(body, { 'x-participant-token': 'tok' }));
    const rows = supa.insert.mock.calls[0][0];
    expect(rows[0].payload).not.toHaveProperty('code');
    expect(rows[0].payload.cellId).toBe('c1');
  });

  it('con content_opt_in conserva payload.code', async () => {
    mocks.participantByToken.mockResolvedValue({ ...PARTICIPANT, content_opt_in: true });
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const body = {
      ...VALID_BODY,
      events: [
        { kind: 'rcell-run', ts: Date.now(), payload: { cellId: 'c1', code: 'x <- 1' } },
      ],
    };
    await POST(req(body, { 'x-participant-token': 'tok' }));
    const rows = supa.insert.mock.calls[0][0];
    expect(rows[0].payload.code).toBe('x <- 1');
  });

  it('acepta token por query ?t= (camino del sendBeacon)', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const r = new NextRequest('http://localhost/api/track?t=tok', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID_BODY),
    });
    const res = await POST(r);
    expect(res.status).toBe(200);
  });
});
