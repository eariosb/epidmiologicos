// POST /api/consent: registra la decisión de consentimiento en participants:
// { consentVersion, contentOptIn }. El consentimiento queda así auditado en
// servidor (doc 04 §6: consent_version guardado permite re-pedir si cambia el
// texto), no solo en el navegador. Auth: x-participant-token.

import { NextRequest, NextResponse } from 'next/server';
import { CONSENT_VERSION, fieldtestClient, participantByToken } from '@/lib/fieldtest-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-participant-token');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const participant = await participantByToken(token).catch(() => null);
  if (!participant) return NextResponse.json({ ok: false }, { status: 403 });

  let body: { consentVersion?: unknown; contentOptIn?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const consentVersion =
    typeof body.consentVersion === 'string' && body.consentVersion.length <= 40
      ? body.consentVersion
      : CONSENT_VERSION;

  const { error } = await fieldtestClient()
    .from('participants')
    .update({
      consent_version: consentVersion,
      content_opt_in: body.contentOptIn === true,
      consented_at: new Date().toISOString(),
    })
    .eq('id', participant.id);

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
