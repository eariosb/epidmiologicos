// GET /api/fieldtest/overview — agregados del tablero docente.
// Auth: x-admin-token (FIELDTEST_ADMIN_TOKEN). Lee las vistas de análisis
// del esquema fieldtest (service role) + agregados ligeros en memoria.
// Especificación: prueba-campo/SPRINTS.md Sprint 5 tarea 1.

import { NextRequest, NextResponse } from 'next/server';
import { adminDenied, isAdmin } from '@/lib/fieldtest-admin';
import { fieldtestClient } from '@/lib/fieldtest-server';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return adminDenied();
  const supa = fieldtestClient();

  const [
    { data: participants },
    { data: funnel },
    { data: sims },
    { data: terms },
    { data: rcell },
    { data: health },
    { data: susRows },
    { data: chatRows },
    { data: recent },
  ] = await Promise.all([
    supa.from('participants').select('id, code, course, cohort, withdrawn_at, created_at'),
    supa.from('v_module_funnel').select('*'),
    supa.from('v_sim_engagement').select('*'),
    supa.from('v_term_views').select('*').limit(20),
    supa.from('v_rcell').select('*'),
    supa.from('v_daily_health').select('*').limit(30),
    supa.from('feedback_responses')
      .select('course, responses')
      .eq('instrument', 'sus-final')
      .limit(500),
    supa.from('events')
      .select('course, module_slug')
      .eq('kind', 'chat-question')
      .limit(5000),
    supa.from('events')
      .select('kind, module_slug, course, server_ts')
      .order('server_ts', { ascending: false })
      .limit(25),
  ]);

  const active = (participants ?? []).filter((p) => !p.withdrawn_at);
  const byCourse = (rows: { course: string }[] | null | undefined) => ({
    procesos: (rows ?? []).filter((r) => r.course === 'procesos').length,
    epidemiologia: (rows ?? []).filter((r) => r.course === 'epidemiologia').length,
  });

  // SUS por curso: 2.5·(Σimpares−5 + 25−Σpares)
  const susByCourse: Record<string, { n: number; scores: number[] }> = {};
  for (const row of susRows ?? []) {
    const r = row.responses as Record<string, unknown>;
    const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => Number(r[`sus${i}`]));
    if (vals.some((v) => !Number.isFinite(v) || v < 1 || v > 5)) continue;
    const odd = vals.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    const even = vals.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
    (susByCourse[row.course] ??= { n: 0, scores: [] }).scores.push(2.5 * (odd - 5 + 25 - even));
    susByCourse[row.course].n += 1;
  }

  // Preguntas al asistente por módulo (mapa de dudas del texto)
  const chatByModule: Record<string, number> = {};
  for (const row of chatRows ?? []) {
    const k = `${row.course}|${row.module_slug ?? '(sin módulo)'}`;
    chatByModule[k] = (chatByModule[k] ?? 0) + 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayHealth = (health ?? []).filter(
    (h) => String(h.day).slice(0, 10) === today,
  );

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    participants: {
      total: active.length,
      withdrawn: (participants ?? []).length - active.length,
      byCourse: byCourse(active),
      emittingToday: todayHealth.reduce((a, h) => a + h.active_participants, 0),
      eventsToday: todayHealth.reduce((a, h) => a + h.events, 0),
      cohorts: [...new Set(active.map((p) => p.cohort))],
    },
    funnel: funnel ?? [],
    sims: (sims ?? [])
      .map((s) => ({ ...s, interactions: s.plays + s.param_changes + s.resets }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 20),
    terms: terms ?? [],
    rcell: (rcell ?? [])
      .map((c) => ({ ...c, error_rate: c.runs ? 1 - c.ok / c.runs : 0 }))
      .sort((a, b) => b.error_rate - a.error_rate),
    sus: Object.fromEntries(
      Object.entries(susByCourse).map(([course, v]) => [
        course,
        {
          n: v.n,
          mean: v.scores.length ? v.scores.reduce((a, b) => a + b, 0) / v.scores.length : null,
        },
      ]),
    ),
    chatByModule: Object.entries(chatByModule)
      .map(([k, n]) => {
        const [course, module_slug] = k.split('|');
        return { course, module_slug, preguntas: n };
      })
      .sort((a, b) => b.preguntas - a.preguntas)
      .slice(0, 20),
    health: health ?? [],
    recent: recent ?? [],
  });
}
