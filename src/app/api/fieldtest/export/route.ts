// GET /api/fieldtest/export?kind=events|feedback|sessions|participants
// → CSV descargable. Auth: x-admin-token.
// Privacidad: NUNCA exporta enroll_token ni auth_user_id; los jsonb van
// serializados en una sola celda. Especificación: SPRINTS.md S5 tarea 2.

import { NextRequest, NextResponse } from 'next/server';
import { adminDenied, isAdmin } from '@/lib/fieldtest-admin';
import { fieldtestClient } from '@/lib/fieldtest-server';

const MAX_ROWS = 50_000;

const KINDS: Record<string, { table: string; select: string; order?: string }> = {
  participants: {
    table: 'participants',
    select: 'id, code, course, cohort, consent_version, consented_at, content_opt_in, withdrawn_at, created_at',
    order: 'created_at',
  },
  sessions: {
    table: 'sessions',
    select: 'id, client_id, participant_id, course, user_agent, viewport, started_at, ended_at, last_seen_at',
    order: 'started_at',
  },
  events: {
    table: 'events',
    select: 'id, session_id, course, kind, module_slug, payload, client_ts, server_ts',
    order: 'id',
  },
  feedback: {
    table: 'feedback_responses',
    select: 'id, participant_id, course, instrument, module_slug, responses, submitted_at',
    order: 'id',
  },
};

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const lines = [cols.map(csvCell).join(',')];
  for (const row of rows) lines.push(cols.map((c) => csvCell(row[c])).join(','));
  return lines.join('\r\n');
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return adminDenied();

  const kind = req.nextUrl.searchParams.get('kind') ?? '';
  const spec = KINDS[kind];
  if (!spec) return NextResponse.json({ ok: false }, { status: 400 });

  let query = fieldtestClient()
    .from(spec.table)
    .select(spec.select)
    .limit(MAX_ROWS);
  if (spec.order) query = query.order(spec.order, { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false }, { status: 500 });

  const csv = toCsv((data ?? []) as unknown as Record<string, unknown>[]);
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="fieldtest-${kind}.csv"`,
    },
  });
}
