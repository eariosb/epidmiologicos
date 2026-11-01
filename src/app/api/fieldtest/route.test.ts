import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  participantByToken: vi.fn(),
  fieldtestClient: vi.fn(),
}));

vi.mock('@/lib/fieldtest-server', () => ({
  CONSENT_VERSION: 'v1-2026-10',
  participantByToken: mocks.participantByToken,
  rateHit: vi.fn().mockResolvedValue(1),
  fieldtestClient: mocks.fieldtestClient,
  clientIp: () => '127.0.0.1',
}));

import { GET as overview } from './overview/route';
import { GET as exportCsv } from './export/route';

const TOKEN = 'admin-secreto-de-prueba';
const AUTH = { 'x-admin-token': TOKEN };

// from(t).select(cols)[.eq()][.order()][.limit()]: devuelve lo configurado
function fakeSupa(rows: Record<string, Record<string, unknown>[]>) {
  const make = (table: string) => {
    const res = { data: rows[table] ?? [], error: null };
    const chain: Record<string, unknown> = {};
    for (const m of ['eq', 'order', 'limit']) chain[m] = vi.fn(() => chain);
    chain.then = (resolve: (v: typeof res) => unknown) => Promise.resolve(res).then(resolve);
    const select = vi.fn(() => chain);
    return { select };
  };
  return { from: vi.fn((t: string) => make(t)) };
}

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { method: 'GET', headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('FIELDTEST_ADMIN_TOKEN', TOKEN);
});

describe('GET /api/fieldtest/overview', () => {
  it('403 sin token o con token errado', async () => {
    expect((await overview(req('http://localhost/api/fieldtest/overview'))).status).toBe(403);
    expect((await overview(req('http://localhost/api/fieldtest/overview', { 'x-admin-token': 'malo' }))).status).toBe(403);
  });

  it('200: agrega participantes, SUS y chat por módulo', async () => {
    mocks.fieldtestClient.mockReturnValue(
      fakeSupa({
        participants: [
          { id: 'p1', code: 'PC-1', course: 'epidemiologia', cohort: 'c1', withdrawn_at: null },
          { id: 'p2', code: 'PC-2', course: 'epidemiologia', cohort: 'c1', withdrawn_at: 'x' },
        ],
        feedback_responses: [
          { course: 'epidemiologia', responses: Object.fromEntries([1,2,3,4,5,6,7,8,9,10].map((i) => [`sus${i}`, i % 2 ? 5 : 1])) },
        ],
        events: [{ course: 'epidemiologia', module_slug: 'm1' }, { course: 'epidemiologia', module_slug: 'm1' }],
        v_daily_health: [{ day: new Date().toISOString(), events: 5, active_participants: 2, sessions: 2, course: 'epidemiologia' }],
      }),
    );
    const res = await overview(req('http://localhost/api/fieldtest/overview', AUTH));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.participants).toMatchObject({ total: 1, withdrawn: 1 });
    expect(body.participants.byCourse.epidemiologia).toBe(1);
    expect(body.participants.emittingToday).toBe(2);
    expect(body.sus.epidemiologia).toMatchObject({ n: 1, mean: 100 });
    expect(body.chatByModule[0]).toMatchObject({ module_slug: 'm1', preguntas: 2 });
  });
});

describe('GET /api/fieldtest/export', () => {
  it('403 sin token · 400 con kind inválido', async () => {
    expect((await exportCsv(req('http://localhost/api/fieldtest/export?kind=events'))).status).toBe(403);
    expect((await exportCsv(req('http://localhost/api/fieldtest/export?kind=nope', AUTH))).status).toBe(400);
  });

  it('200 CSV: escaping de comas/comillas/jsonb y cabecera de columnas', async () => {
    mocks.fieldtestClient.mockReturnValue(
      fakeSupa({
        events: [
          { id: 1, session_id: 's', course: 'epidemiologia', kind: 'rcell-run', module_slug: 'm, "x"', payload: { a: 1 }, client_ts: 't', server_ts: 't' },
        ],
      }),
    );
    const res = await exportCsv(req('http://localhost/api/fieldtest/export?kind=events', AUTH));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('fieldtest-events.csv');
    const csv = await res.text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('id,session_id,course,kind');
    // celda con coma+comillas → envuelta y comillas duplicadas
    expect(lines[1]).toContain('"m, ""x"""');
    // jsonb serializado en una celda
    expect(lines[1]).toContain('"{""a"":1}"');
  });

  it('participants nunca incluye enroll_token ni auth_user_id', async () => {
    const supa = fakeSupa({ participants: [] });
    mocks.fieldtestClient.mockReturnValue(supa);
    await exportCsv(req('http://localhost/api/fieldtest/export?kind=participants', AUTH));
    const select = supa.from.mock.results[0].value.select;
    const cols = select.mock.calls[0][0] as string;
    expect(cols).not.toContain('enroll_token');
    expect(cols).not.toContain('auth_user_id');
  });
});
