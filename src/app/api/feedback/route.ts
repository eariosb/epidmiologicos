// POST /api/feedback — guarda una respuesta de encuesta en feedback_responses.
// Auth: x-participant-token. Dedup por (participant, instrument, module_slug)
// vía upsert — re-enviar reemplaza la respuesta anterior (no duplica).
// Especificación: prueba-campo/docs/05-instrumentos-encuesta.md.

import { NextRequest, NextResponse } from 'next/server';
import { fieldtestClient, participantByToken } from '@/lib/fieldtest-server';

const COURSE = 'epidemiologia'; // 'procesos' en el otro repo
const VALID_INSTRUMENTS = new Set([
  'pretest', 'post-module', 'sus-final', 'exit', 'interview-notes',
]);
const MAX_RESPONSES_BYTES = 32_768;

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-participant-token');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const participant = await participantByToken(token).catch(() => null);
  if (!participant) return NextResponse.json({ ok: false }, { status: 403 });

  let body: { instrument?: unknown; moduleSlug?: unknown; responses?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const instrument = typeof body.instrument === 'string' ? body.instrument : '';
  const moduleSlug =
    typeof body.moduleSlug === 'string' && body.moduleSlug.length <= 120
      ? body.moduleSlug
      : null;
  const responses =
    body.responses && typeof body.responses === 'object' && !Array.isArray(body.responses)
      ? body.responses
      : null;

  if (
    !VALID_INSTRUMENTS.has(instrument) ||
    !responses ||
    JSON.stringify(responses).length > MAX_RESPONSES_BYTES ||
    (instrument === 'post-module' && !moduleSlug)
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Dedup "última respuesta gana": el índice único usa coalesce(module_slug,'')
  // y PostgREST no puede targetear índices de expresión — delete + insert.
  const supa = fieldtestClient();
  let del = supa
    .from('feedback_responses')
    .delete()
    .eq('participant_id', participant.id)
    .eq('instrument', instrument);
  del = moduleSlug === null ? del.is('module_slug', null) : del.eq('module_slug', moduleSlug);
  await del;

  const { error } = await supa.from('feedback_responses').insert({
    participant_id: participant.id,
    course: COURSE,
    instrument,
    module_slug: moduleSlug,
    responses,
  });

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
