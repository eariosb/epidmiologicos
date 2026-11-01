// POST /api/enroll: { code } → { token, consentVersion, code }.
// El código (PC-4F2K…) lo reparte el docente; validarlo devuelve el
// enroll_token opaco que luego autentica /api/track.
// Especificación: prueba-campo/docs/04-etica-consentimiento.md §5.

import { NextRequest, NextResponse } from 'next/server';
import { CONSENT_VERSION, clientIp, fieldtestClient, rateHit } from '@/lib/fieldtest-server';

const ENROLL_RATE_PER_IP = 30; // por hora

export async function POST(req: NextRequest) {
  const hits = await rateHit(`enroll:${clientIp(req)}`).catch(() => 0);
  if (hits > ENROLL_RATE_PER_IP) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!/^[A-Z]{2}-[A-Z0-9-]{3,12}$/.test(code)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data } = await fieldtestClient()
    .from('participants')
    .select('enroll_token, withdrawn_at')
    .eq('code', code)
    .maybeSingle();

  // Misma respuesta para código inexistente o retirado: no filtrar validez.
  if (!data || data.withdrawn_at) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    token: data.enroll_token,
    consentVersion: CONSENT_VERSION,
    code,
  });
}
