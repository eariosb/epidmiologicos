// GET /api/mis-datos — derecho de ACCESO (ARCO): devuelve al participante
// sus propios datos registrados. Auth: x-participant-token.
// Especificación: prueba-campo/docs/04-etica-consentimiento.md §5.

import { NextRequest, NextResponse } from 'next/server';
import { fieldtestClient, participantByToken } from '@/lib/fieldtest-server';

const MAX_EVENTS_RETURNED = 500;

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-participant-token');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const participant = await participantByToken(token).catch(() => null);
  if (!participant) return NextResponse.json({ ok: false }, { status: 403 });

  const supa = fieldtestClient();
  const [{ data: sessions }, { data: feedback }] = await Promise.all([
    supa
      .from('sessions')
      .select('course, user_agent, viewport, started_at, last_seen_at')
      .eq('participant_id', participant.id)
      .order('started_at', { ascending: false })
      .limit(50),
    supa
      .from('feedback_responses')
      .select('instrument, module_slug, responses, submitted_at')
      .eq('participant_id', participant.id)
      .order('submitted_at', { ascending: false })
      .limit(100),
  ]);

  const sessionIds = (sessions ?? []).length
    ? (
        await supa
          .from('sessions')
          .select('id')
          .eq('participant_id', participant.id)
      ).data?.map((s) => s.id) ?? []
    : [];

  const { data: events } = sessionIds.length
    ? await supa
        .from('events')
        .select('kind, module_slug, payload, client_ts')
        .in('session_id', sessionIds)
        .order('id', { ascending: false })
        .limit(MAX_EVENTS_RETURNED)
    : { data: [] };

  return NextResponse.json({
    ok: true,
    participant: {
      code: participant.code,
      course: participant.course,
      contentOptIn: participant.content_opt_in,
    },
    sessions: sessions ?? [],
    events: events ?? [],
    eventsTruncated: (events?.length ?? 0) >= MAX_EVENTS_RETURNED,
    feedback: feedback ?? [],
  });
}
