'use client';

// /admin/fieldtest: tablero docente de la prueba de campo (Sprint 5).
// Acceso con FIELDTEST_ADMIN_TOKEN (guardado en localStorage del docente).
// Muestra: salud del pipeline, embudo de módulos, engagement de sims,
// siglas consultadas, tasa de error de celdas R, preguntas al asistente,
// SUS por curso y últimos eventos. Exportación CSV por tabla.

import { useCallback, useEffect, useState } from 'react';

const TOKEN_KEY = 'ft-admin-token';
const EXPORT_KINDS = ['events', 'sessions', 'feedback', 'participants'] as const;

interface Overview {
  generatedAt: string;
  participants: {
    total: number;
    withdrawn: number;
    byCourse: Record<string, number>;
    emittingToday: number;
    eventsToday: number;
    cohorts: string[];
  };
  funnel: { course: string; module_slug: string; sessions: number; participants: number; avg_dwell_ms: number | null }[];
  sims: { course: string; module_slug: string; sim: string; plays: number; param_changes: number; resets: number; interactions: number }[];
  terms: { course: string; term: string; views: number; sessions: number }[];
  rcell: { course: string; cell_id: string; runs: number; ok: number; avg_ms: number | null; error_rate: number }[];
  sus: Record<string, { n: number; mean: number | null }>;
  chatByModule: { course: string; module_slug: string; preguntas: number }[];
  health: { course: string; day: string; events: number; active_participants: number; sessions: number }[];
  recent: { kind: string; module_slug: string | null; course: string; server_ts: string }[];
}

function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return n.toFixed(digits);
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-ink-200 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">{children}</th>;
}
function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`border-b border-ink-100 px-2 py-1.5 text-xs text-ink-700 ${mono ? 'font-mono' : ''}`}>{children}</td>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-ink-800">{title}</h2>
      {children}
    </section>
  );
}

export default function FieldTestAdminPage() {
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/fieldtest/overview', {
        headers: { 'x-admin-token': t },
      });
      if (res.status === 403) {
        setError('Token incorrecto.');
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setAuthed(true);
      localStorage.setItem(TOKEN_KEY, t);
    } catch (e) {
      setError(`No se pudo cargar: ${e instanceof Error ? e.message : 'error'}`);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      void load(stored);
    }
  }, [load]);

  const download = async (kind: string) => {
    const res = await fetch(`/api/fieldtest/export?kind=${kind}`, {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldtest-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main className="mx-auto my-16 max-w-md rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">Tablero de prueba de campo</h1>
        <p className="mt-2 text-sm text-ink-600">
          Acceso exclusivo del docente. Escribe el token de administrador
          (<code>FIELDTEST_ADMIN_TOKEN</code> del servidor).
        </p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load(token);
          }}
        >
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1 rounded border border-ink-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !token}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? '…' : 'Entrar'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-danger-600" role="alert">{error}</p>}
      </main>
    );
  }

  const p = data?.participants;

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink-900">
          Tablero de prueba de campo{' '}
          <span className="text-xs font-normal text-ink-400">
            · generado {data ? new Date(data.generatedAt).toLocaleString('es-CO') : '…'}
          </span>
        </h1>
        <div className="flex items-center gap-2">
          {EXPORT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => void download(k)}
              className="rounded border border-ink-200 px-2.5 py-1 text-xs text-ink-600 hover:bg-ink-50"
            >
              CSV {k}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load(token)}
            className="rounded border border-ink-200 px-2.5 py-1 text-xs text-ink-600 hover:bg-ink-50"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Participantes activos', p?.total],
          ['Emitiendo hoy', p?.emittingToday],
          ['Eventos hoy', p?.eventsToday],
          ['Retirados', p?.withdrawn],
        ].map(([label, v]) => (
          <div key={label as string} className="rounded-lg border border-ink-200 bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-700">{v ?? '…'}</p>
            <p className="text-[11px] text-ink-500">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-500">
        Por curso: procesos {p?.byCourse?.procesos ?? 0} · epidemiologia{' '}
        {p?.byCourse?.epidemiologia ?? 0} · cohortes: {p?.cohorts?.join(', ') || '—'}
        {Object.entries(data?.sus ?? {}).map(([c, s]) => (
          <span key={c}> · SUS {c}: {s.mean === null ? '—' : `${fmt(s.mean, 1)} (n=${s.n})`}</span>
        ))}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Embudo de módulos (module-visit)">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Módulo</Th><Th>Curso</Th><Th>Part.</Th><Th>Sesiones</Th><Th>Dwell med.</Th></tr></thead>
              <tbody>
                {(data?.funnel ?? []).map((f, i) => (
                  <tr key={i}>
                    <Td mono>{f.module_slug}</Td><Td>{f.course}</Td>
                    <Td>{f.participants}</Td><Td>{f.sessions}</Td>
                    <Td>{f.avg_dwell_ms ? `${fmt(f.avg_dwell_ms / 60000, 1)} min` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Salud del pipeline (por día)">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Día</Th><Th>Curso</Th><Th>Eventos</Th><Th>Part. act.</Th><Th>Sesiones</Th></tr></thead>
              <tbody>
                {(data?.health ?? []).map((h, i) => (
                  <tr key={i}>
                    <Td mono>{String(h.day).slice(0, 10)}</Td><Td>{h.course}</Td>
                    <Td>{h.events}</Td><Td>{h.active_participants}</Td><Td>{h.sessions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Interacción por simulador (top 20)">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Sim</Th><Th>Módulo</Th><Th>Plays</Th><Th>Params</Th><Th>Resets</Th></tr></thead>
              <tbody>
                {(data?.sims ?? []).map((s, i) => (
                  <tr key={i}>
                    <Td mono>{s.sim}</Td><Td mono>{s.module_slug}</Td>
                    <Td>{s.plays}</Td><Td>{s.param_changes}</Td><Td>{s.resets}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Celdas R por tasa de error">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Celda</Th><Th>Corridas</Th><Th>OK</Th><Th>Error %</Th><Th>ms med.</Th></tr></thead>
              <tbody>
                {(data?.rcell ?? []).map((c, i) => (
                  <tr key={i}>
                    <Td mono>{c.cell_id}</Td><Td>{c.runs}</Td><Td>{c.ok}</Td>
                    <Td>{fmt(c.error_rate * 100, 0)}%</Td><Td>{c.avg_ms ? fmt(c.avg_ms) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Siglas más consultadas">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Sigla</Th><Th>Curso</Th><Th>Vistas</Th><Th>Sesiones</Th></tr></thead>
              <tbody>
                {(data?.terms ?? []).map((t, i) => (
                  <tr key={i}>
                    <Td mono>{t.term}</Td><Td>{t.course}</Td>
                    <Td>{t.views}</Td><Td>{t.sessions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Preguntas al asistente por módulo">
          <div className="max-h-72 overflow-auto">
            <table className="w-full">
              <thead><tr><Th>Módulo</Th><Th>Curso</Th><Th>Preguntas</Th></tr></thead>
              <tbody>
                {(data?.chatByModule ?? []).map((c, i) => (
                  <tr key={i}>
                    <Td mono>{c.module_slug}</Td><Td>{c.course}</Td><Td>{c.preguntas}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Últimos eventos (debug, sin payload)">
        <div className="max-h-64 overflow-auto">
          <table className="w-full">
            <thead><tr><Th>Hora</Th><Th>Curso</Th><Th>Kind</Th><Th>Módulo</Th></tr></thead>
            <tbody>
              {(data?.recent ?? []).map((e, i) => (
                <tr key={i}>
                  <Td mono>{new Date(e.server_ts).toLocaleString('es-CO')}</Td>
                  <Td>{e.course}</Td><Td mono>{e.kind}</Td><Td mono>{e.module_slug ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
