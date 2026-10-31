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
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { from, update, eq };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/consent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.participantByToken.mockResolvedValue(PARTICIPANT);
  mocks.fieldtestClient.mockReturnValue(fakeSupa());
});

describe('POST /api/consent', () => {
  it('401 sin token · 403 con token inválido', async () => {
    expect((await POST(req({ contentOptIn: true }))).status).toBe(401);
    mocks.participantByToken.mockResolvedValue(null);
    expect((await POST(req({ contentOptIn: true }, { 'x-participant-token': 'bad' }))).status).toBe(403);
  });

  it('actualiza consent_version, content_opt_in y consented_at del participante', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    const res = await POST(
      req({ consentVersion: 'v1-2026-10', contentOptIn: true },
        { 'x-participant-token': 'tok' }),
    );
    expect(res.status).toBe(200);
    expect(supa.update).toHaveBeenCalledWith(
      expect.objectContaining({
        consent_version: 'v1-2026-10',
        content_opt_in: true,
      }),
    );
    expect(supa.eq).toHaveBeenCalledWith('id', 'p-1');
  });

  it('consentVersion inválida cae al default; contentOptIn no-booleano es false', async () => {
    const supa = fakeSupa();
    mocks.fieldtestClient.mockReturnValue(supa);
    await POST(
      req({ consentVersion: 123, contentOptIn: 'sí' }, { 'x-participant-token': 'tok' }),
    );
    expect(supa.update).toHaveBeenCalledWith(
      expect.objectContaining({ consent_version: 'v1-2026-10', content_opt_in: false }),
    );
  });
});
