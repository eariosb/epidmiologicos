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
  const delIs = vi.fn().mockResolvedValue({ error: null });
  const delEq = vi.fn(() => ({ is: delIs, eq: delEq }));
  const del = { eq: delEq };
  const deleteFn = vi.fn(() => del);
  const from = vi.fn(() => ({ insert, delete: deleteFn }));
  return { from, insert, deleteFn, delEq, delIs };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const VALID = {
  instrument: 'post-module',
  moduleSlug: '04-rr-or-rd',
  responses: { entendi: 4, interactivos: 5, lenguaje: 4, confuso: 'nada' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.participantByToken.mockResolvedValue(PARTICIPANT);
  mocks.fieldtestClient.mockReturnValue(fakeSupa());
});

describe('POST /api/feedback', () => {
  it('401 sin token · 403 con token inválido', async () => {
    expect((await POST(req(VALID))).status).toBe(401);
    mocks.participantByToken.mockResolvedValue(null);
    expect((await POST(req(VALID, { 'x-participant-token': 'bad' }))).status).toBe(403);
  });

  it('400 con instrumento inválido, sin responses o post-module sin slug', async () => {
    const h = { 'x-participant-token': 'tok' };
    expect((await POST(req({ ...VALID, instrument: 'nope' }, h))).status).toBe(400);
    expect((await POST(req({ ...VALID, responses: null }, h))).status).toBe(400);
    expect((await POST(req({ instrument: 'post-module', responses: {} }, h))).status).toBe(400);
  });

  it('400 si responses es un array o excede 32 KB', async () => {
    const h = { 'x-participant-token': 'tok' };
    expect((await POST(req({ ...VALID, responses: [1, 2] }, h))).status).toBe(400);
    const big = { x: 'a'.repeat(40_000) };
    expect((await POST(req({ ...VALID, responses: big }, h))).status).toBe(400);
  });

  it('200: delete + insert: última respuesta gana por (participant, instrument, slug)', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const res = await POST(req(VALID, { 'x-participant-token': 'tok' }));
    expect(res.status).toBe(200);
    expect(supa.deleteFn).toHaveBeenCalled();
    expect(supa.delEq).toHaveBeenCalledWith('module_slug', VALID.moduleSlug);
    expect(supa.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        participant_id: 'p-1',
        course: 'epidemiologia',
        instrument: 'post-module',
        module_slug: VALID.moduleSlug,
      }),
    );
  });

  it('module_slug ausente → delete filtra por IS NULL', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    await POST(
      req({ instrument: 'pretest', responses: { programa: 'Estadística' } },
        { 'x-participant-token': 'tok' }),
    );
    expect(supa.delIs).toHaveBeenCalledWith('module_slug', null);
  });
});
