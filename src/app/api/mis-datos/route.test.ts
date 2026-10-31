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

import { GET } from './route';

const PARTICIPANT = {
  id: 'p-1',
  code: 'PC-0001',
  course: 'epidemiologia',
  withdrawn_at: null,
  content_opt_in: true,
};

// Cadena supabase: from(t).select().eq().order().limit() → {data}
// y from('sessions').select('id').eq() → {data}
function fakeSupa() {
  const sessions = [{ course: 'epidemiologia', user_agent: 'ua', viewport: '1x1', started_at: 't', last_seen_at: 't' }];
  const feedback = [{ instrument: 'pretest', module_slug: null, responses: {}, submitted_at: 't' }];
  const events = [{ kind: 'term-view', module_slug: 'm', payload: {}, client_ts: 't' }];

  const limitEvents = vi.fn().mockResolvedValue({ data: events });
  const orderEvents = vi.fn(() => ({ limit: limitEvents }));
  const inIds = vi.fn(() => ({ order: orderEvents }));
  const eqSessionsLimit = vi.fn().mockResolvedValue({ data: sessions });
  const orderSessions = vi.fn(() => ({ limit: eqSessionsLimit }));
  const eqSessions = vi.fn(() => ({ order: orderSessions }));
  const eqFeedbackLimit = vi.fn().mockResolvedValue({ data: feedback });
  const orderFeedback = vi.fn(() => ({ limit: eqFeedbackLimit }));
  const eqFeedback = vi.fn(() => ({ order: orderFeedback }));
  const eqIds = vi.fn().mockResolvedValue({ data: [{ id: 'sess-1' }] });

  let calls = 0;
  const select = vi.fn((cols: string) => {
    if (cols === 'id') return { eq: eqIds };
    calls += 1;
    return { eq: calls === 1 ? eqSessions : calls === 2 ? eqFeedback : vi.fn() };
  });
  const selectForEvents = vi.fn(() => ({ in: inIds }));

  const from = vi.fn((table: string) => ({
    select: table === 'events' ? selectForEvents : select,
  }));
  return { from, eqSessions, eqFeedback, eqIds, inIds, limitEvents };
}

function req(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/mis-datos', { method: 'GET', headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.participantByToken.mockResolvedValue(PARTICIPANT);
  mocks.fieldtestClient.mockReturnValue(fakeSupa());
});

describe('GET /api/mis-datos', () => {
  it('401 sin token · 403 con token inválido', async () => {
    expect((await GET(req())).status).toBe(401);
    mocks.participantByToken.mockResolvedValue(null);
    expect((await GET(req({ 'x-participant-token': 'bad' }))).status).toBe(403);
  });

  it('200: devuelve participant + sessions + feedback + events del propio usuario', async () => {
    const res = await GET(req({ 'x-participant-token': 'tok' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.participant).toMatchObject({ code: 'PC-0001', course: 'epidemiologia', contentOptIn: true });
    expect(body.sessions).toHaveLength(1);
    expect(body.feedback).toHaveLength(1);
    expect(body.events).toHaveLength(1);
    expect(body.eventsTruncated).toBe(false);
  });

  it('los eventos se consultan por session_id IN (sesiones propias)', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    await GET(req({ 'x-participant-token': 'tok' }));
    expect(supa.inIds).toHaveBeenCalledWith('session_id', ['sess-1']);
  });
});
