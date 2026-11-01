// POST /api/withdraw: ejerce el derecho de retiro (ARCO).
// El participante se autentica con su enroll_token; el servidor ejecuta
// fieldtest.withdraw(code) que borra events/sessions/feedback en cascada
// y desvincula la identidad. Respuesta idéntica haya o no datos (idempotente).
// Especificación: prueba-campo/docs/04-etica-consentimiento.md §2.5/§5.

import { NextRequest, NextResponse } from 'next/server';
import { fieldtestClient, participantByToken } from '@/lib/fieldtest-server';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-participant-token');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const participant = await participantByToken(token).catch(() => null);
  // 403 y 200 deliberadamente indistinguibles en cuerpo para no filtrar
  // si un token corresponde a un participante activo.
  if (!participant) return NextResponse.json({ ok: false }, { status: 403 });

  const { error } = await fieldtestClient().rpc('withdraw', { p_code: participant.code });
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
