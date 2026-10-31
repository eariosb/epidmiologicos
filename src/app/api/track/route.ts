// POST /api/track — ingestión de eventos de telemetría.
// Especificación: prueba-campo/docs/03-telemetria.md §1.
//
// Auth: x-participant-token (header) o ?t= (query, para sendBeacon).
// Escribe como service_role; el anon key nunca toca fieldtest.

import { NextRequest, NextResponse } from 'next/server';
import { fieldtestClient, participantByToken, rateHit } from '@/lib/fieldtest-server';

const COURSE = 'epidemiologia'; // 'procesos' en el otro repo
const MAX_BATCH = 200;
const RATE_LIMIT_PER_HOUR = 120;
const MAX_KIND_LEN = 40;
const MAX_SLUG_LEN = 120;
const MAX_PAYLOAD_BYTES = 4096;

// Taxonomía del doc 03 §3 — cualquier kind fuera de la lista se descarta.
const VALID_KINDS = new Set([
  'session-start', 'session-ping', 'module-visit', 'sim-interact',
  'rcell-run', 'quiz-answer', 'term-view', 'capture', 'board-scene',
  'chat-question', 'note-save', 'sas-expand', 'toolcard-open',
  'decision-memo', 'survey-submit',
]);

interface ClientEvent {
  kind?: unknown;
  moduleSlug?: unknown;
  ts?: unknown;
  payload?: unknown;
}

function sanitizeEvent(e: ClientEvent, contentOptIn: boolean) {
  if (typeof e.kind !== 'string' || e.kind.length > MAX_KIND_LEN || !VALID_KINDS.has(e.kind)) {
    return null;
  }
  if (typeof e.ts !== 'number' || !Number.isFinite(e.ts)) return null;
  if (e.moduleSlug !== undefined && (typeof e.moduleSlug !== 'string' || e.moduleSlug.length > MAX_SLUG_LEN)) {
    return null;
  }
  const payload: Record<string, unknown> =
    e.payload && typeof e.payload === 'object' && !Array.isArray(e.payload)
      ? { ...(e.payload as Record<string, unknown>) }
      : {};
  if (JSON.stringify(payload).length > MAX_PAYLOAD_BYTES) return null;
  // Sin opt-in de contenido, el servidor descarta texto propio aunque el
  // cliente lo envíe (defensa en profundidad).
  if (!contentOptIn) {
    delete payload.code;
    delete payload.text;
  }
  return {
    kind: e.kind,
    module_slug: (e.moduleSlug as string | undefined) ?? null,
    payload,
    client_ts: new Date(e.ts).toISOString(),
  };
}

export async function POST(req: NextRequest) {
  // token por header (fetch) o query (sendBeacon no admite headers)
  const token =
    req.headers.get('x-participant-token') ?? req.nextUrl.searchParams.get('t');
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  let participant;
  try {
    participant = await participantByToken(token);
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (!participant) return NextResponse.json({ ok: false }, { status: 403 });

  const hits = await rateHit(`p:${participant.id}`).catch(() => 0);
  if (hits > RATE_LIMIT_PER_HOUR) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: {
    clientId?: unknown;
    startedAt?: unknown;
    device?: { ua?: unknown; viewport?: unknown };
    events?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (
    typeof body.clientId !== 'string' ||
    body.clientId.length === 0 ||
    body.clientId.length > 64 ||
    typeof body.startedAt !== 'number' ||
    !Number.isFinite(body.startedAt) ||
    !Array.isArray(body.events) ||
    body.events.length === 0 ||
    body.events.length > MAX_BATCH
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supa = fieldtestClient();
  const { data: session, error: sErr } = await supa
    .from('sessions')
    .upsert(
      {
        client_id: body.clientId,
        participant_id: participant.id,
        course: COURSE,
        user_agent:
          typeof body.device?.ua === 'string'
            ? body.device.ua.slice(0, 500)
            : req.headers.get('user-agent')?.slice(0, 500),
        viewport:
          typeof body.device?.viewport === 'string'
            ? body.device.viewport.slice(0, 20)
            : null,
        started_at: new Date(body.startedAt).toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'participant_id,client_id' },
    )
    .select('id')
    .single();
  if (sErr || !session) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const rows = body.events
    .map((e) => sanitizeEvent(e, participant.content_opt_in))
    .filter((r) => r !== null)
    .map((r) => ({ ...r, session_id: session.id, course: COURSE }));

  if (rows.length === 0) return NextResponse.json({ ok: true, dropped: 'all' });

  const { error } = await supa.from('events').insert(rows);
  return NextResponse.json(
    { ok: !error },
    { status: error ? 500 : 200 },
  );
}
