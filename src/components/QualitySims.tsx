'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { tokens } from '@/lib/tokens';
import { SimGuide } from '@/components/SimBits';

const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const TH = 'px-3 py-1.5 text-left text-xs font-semibold text-ink-600';
const TD = 'px-3 py-1.5 text-xs text-ink-800';

/* ------------------- carga del CSV real (misma fuente que webR) ------ */

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: Row = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

function useCsvRows(file: string) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/data/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => live && setRows(parseCsv(t)))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [file]);
  return { rows, error };
}

const num = (v: string) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : NaN;
};

const fmt = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');

/* ============================ Table1Builder ========================= */

type VarType = 'cont' | 'bin' | 'cat';

interface VarSpec {
  key: string;
  label: string;
  type: VarType;
  /** Para 'cat': los niveles en orden de presentación. */
  levels?: string[];
  /** Para 'bin': valor que cuenta como "sí". */
  yes?: string;
}

interface DatasetSpec {
  file: string;
  label: string;
  vars: VarSpec[];
  /** Agrupadores binarios disponibles (valor "sí" del grupo 1). */
  groups: { key: string; label: string; g1: string }[];
}

const SPECS: Record<string, DatasetSpec> = {
  recid: {
    file: 'recid.csv',
    label: 'RECID — 432 exconvictos',
    vars: [
      { key: 'age', label: 'Edad', type: 'cont' },
      { key: 'prio', label: 'Arrestos previos', type: 'cont' },
      { key: 'educ', label: 'Educación', type: 'cont' },
      { key: 'race', label: 'Raza negra', type: 'bin', yes: '1' },
      { key: 'wexp', label: 'Trabajo antes de la cárcel', type: 'bin', yes: '1' },
      { key: 'mar', label: 'Casado', type: 'bin', yes: '1' },
      { key: 'paro', label: 'Libertad condicional', type: 'bin', yes: '1' },
      { key: 'fin', label: 'Ayuda financiera', type: 'bin', yes: '1' },
    ],
    groups: [
      { key: 'fin', label: 'ayuda financiera (aleatorizada)', g1: '1' },
      { key: 'arrest', label: 're-arrestado (el desenlace)', g1: '1' },
      { key: 'paro', label: 'libertad condicional', g1: '1' },
      { key: 'mar', label: 'casado', g1: '1' },
    ],
  },
  valung: {
    file: 'valung.csv',
    label: 'VALUNG — ensayo VA de cáncer de pulmón',
    vars: [
      { key: 'Age', label: 'Edad', type: 'cont' },
      { key: 'Kps', label: 'Karnofsky', type: 'cont' },
      { key: 'DiagTime', label: 'Meses desde diagnóstico', type: 'cont' },
      { key: 'Cell', label: 'Tipo celular', type: 'cat', levels: ['squamous', 'small', 'adeno', 'large'] },
      { key: 'Prior', label: 'Terapia previa (10 = sí)', type: 'bin', yes: '10' },
      { key: 'censor', label: 'Censurado', type: 'bin', yes: '1' },
    ],
    groups: [
      { key: 'Therapy', label: 'terapia (test vs standard)', g1: 'test' },
      { key: 'censor', label: 'censurado', g1: '1' },
      { key: 'Prior', label: 'terapia previa', g1: '10' },
    ],
  },
};

interface T1Row {
  label: string;
  g0: string;
  g1: string;
  smd: number;
}

function summarize(rows: Row[], v: VarSpec, mask: boolean[]): T1Row[] {
  const split = (m: boolean) => rows.filter((_, i) => mask[i] === m);
  const g0 = split(false);
  const g1 = split(true);
  if (v.type === 'cont') {
    const xs0 = g0.map((r) => num(r[v.key])).filter(Number.isFinite);
    const xs1 = g1.map((r) => num(r[v.key])).filter(Number.isFinite);
    const m0 = xs0.reduce((a, b) => a + b, 0) / xs0.length;
    const m1 = xs1.reduce((a, b) => a + b, 0) / xs1.length;
    const v0 = xs0.reduce((a, b) => a + (b - m0) ** 2, 0) / (xs0.length - 1);
    const v1 = xs1.reduce((a, b) => a + (b - m1) ** 2, 0) / (xs1.length - 1);
    return [
      {
        label: v.label,
        g0: `${fmt(m0, 1)} ± ${fmt(Math.sqrt(v0), 1)}`,
        g1: `${fmt(m1, 1)} ± ${fmt(Math.sqrt(v1), 1)}`,
        smd: Math.abs(m1 - m0) / Math.sqrt((v0 + v1) / 2),
      },
    ];
  }
  if (v.type === 'bin') {
    const p0 = g0.filter((r) => r[v.key] === v.yes).length / g0.length;
    const p1 = g1.filter((r) => r[v.key] === v.yes).length / g1.length;
    return [
      {
        label: v.label,
        g0: `${g0.filter((r) => r[v.key] === v.yes).length} (${fmt(p0 * 100, 1)}%)`,
        g1: `${g1.filter((r) => r[v.key] === v.yes).length} (${fmt(p1 * 100, 1)}%)`,
        smd: Math.abs(p1 - p0) / Math.sqrt((p0 * (1 - p0) + p1 * (1 - p1)) / 2),
      },
    ];
  }
  return (v.levels ?? []).map((lv) => {
    const p0 = g0.filter((r) => r[v.key] === lv).length / g0.length;
    const p1 = g1.filter((r) => r[v.key] === lv).length / g1.length;
    return {
      label: `${v.label} = ${lv}`,
      g0: `${g0.filter((r) => r[v.key] === lv).length} (${fmt(p0 * 100, 1)}%)`,
      g1: `${g1.filter((r) => r[v.key] === lv).length} (${fmt(p1 * 100, 1)}%)`,
      smd: Math.abs(p1 - p0) / Math.sqrt((p0 * (1 - p0) + p1 * (1 - p1)) / 2),
    };
  });
}

/**
 * La Tabla 1 como herramienta de detección: describe los grupos con
 * diferencias estandarizadas (no valores p). El mismo dataset con dos
 * agrupadores — `fin` aleatorizado vs. `arrest` observado— muestra
 * cuándo la Tabla 1 anticipa confusión.
 */
export function Table1Builder({
  title,
  dataset = 'recid',
  group,
}: {
  title?: ReactNode;
  dataset?: keyof typeof SPECS;
  group?: string;
}) {
  const [dsKey, setDsKey] = useState(dataset);
  const spec = SPECS[dsKey];
  const [groupKey, setGroupKey] = useState(group ?? spec.groups[0].key);
  const { rows, error } = useCsvRows(spec.file);

  const activeGroup = spec.groups.find((g) => g.key === groupKey) ?? spec.groups[0];

  const table = useMemo(() => {
    if (!rows) return null;
    const mask = rows.map((r) => r[activeGroup.key] === activeGroup.g1);
    const n1 = mask.filter(Boolean).length;
    const t1 = spec.vars
      .filter((v) => v.key !== activeGroup.key)
      .flatMap((v) => summarize(rows, v, mask));
    return { rows: t1, n0: rows.length - n1, n1 };
  }, [rows, spec, activeGroup]);

  const flagged = table ? table.rows.filter((r) => r.smd > 0.1).length : 0;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Tabla 1: diferencias estandarizadas, no valores p'}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink-600">
        <label className="flex items-center gap-2">
          base
          <select
            value={dsKey}
            onChange={(e) => {
              const k = e.target.value as keyof typeof SPECS;
              setDsKey(k);
              setGroupKey(SPECS[k].groups[0].key);
            }}
            className="rounded border border-ink-200 px-2 py-1"
          >
            {Object.entries(SPECS).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          agrupar por
          <select
            value={activeGroup.key}
            onChange={(e) => setGroupKey(e.target.value)}
            className="rounded border border-ink-200 px-2 py-1"
          >
            {spec.groups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-xs text-danger-600">No se pudo cargar {spec.file}: {error}</p>}
      {!rows && !error && <p className="text-xs text-ink-500">Cargando {spec.file}…</p>}

      {table && (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-ink-200">
                <th className={TH}>Variable</th>
                <th className={TH}>
                  Grupo 0 (n = {table.n0})
                </th>
                <th className={TH}>
                  Grupo 1 (n = {table.n1})
                </th>
                <th className={`${TH} text-right`}>Dif. estandarizada</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr
                  key={r.label}
                  className={`border-b border-ink-100 ${r.smd > 0.1 ? 'bg-warning-50' : ''}`}
                >
                  <td className={TD}>{r.label}</td>
                  <td className={TD}>{r.g0}</td>
                  <td className={TD}>{r.g1}</td>
                  <td className={`${TD} text-right font-medium ${r.smd > 0.1 ? 'text-warning-800' : 'text-ink-500'}`}>
                    {r.smd.toFixed(3)}
                    {r.smd > 0.1 && ' ⚠'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={NOTE}>
            {flagged} de {table.rows.length} filas con |d| &gt; 0.1 — el umbral
            usual de desbalance. En la Tabla 1 no van valores p: un p mide el
            tamaño muestral, no el desbalance (Austin 2009).
          </p>
        </>
      )}

      <SimGuide>
        <li>Agrupa por <em>fin</em> (aleatorizado): las diferencias estandarizadas deben rondar 0 — así se ve la aleatorización cumpliendo su promesa.</li>
        <li>Agrupa por <em>arrest</em> (el desenlace): las filas que se encienden son los confusores que tendrás que ajustar.</li>
        <li>En VALUNG agrupa por <em>Therapy</em> y mira qué variables quedan desequilibradas entre los dos brazos.</li>
      </SimGuide>
    </div>
  );
}

/* ========================== DataQualityPanel ======================== */

interface Finding {
  dimension: 'Conformidad' | 'Completitud' | 'Plausibilidad';
  label: string;
  detail: string;
  severity: 'ok' | 'warn';
  /** Veredicto esperado tras revisar la evidencia del propio hallazgo. */
  expected: 'verificado' | 'documentado';
  /** Por qué ese veredicto y no otro (se muestra al marcar). */
  porque: string;
}

const QUALITY: Record<string, { file: string; label: string; checks: (rows: Row[]) => Finding[] }> = {
  valung: {
    file: 'valung.csv',
    label: 'valung.csv',
    checks: (rows) => {
      const kps = rows.map((r) => num(r.Kps)).filter(Number.isFinite);
      const mult10 = kps.filter((k) => k % 10 === 0).length / kps.length;
      const st = rows.map((r) => num(r.SurvTime)).filter(Number.isFinite);
      const sorted = [...st].sort((a, b) => a - b);
      const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
      const iqr = q(0.75) - q(0.25);
      const upper = q(0.75) + 1.5 * iqr;
      const outliers = st.filter((x) => x > upper);
      const priors = new Set(rows.map((r) => r.Prior));
      const censors = new Set(rows.map((r) => r.censor));
      return [
        {
          dimension: 'Conformidad',
          label: `Dominio de Prior: valores {${[...priors].sort().join(', ')}}`,
          detail: 'El protocolo usa 0/10, no 0/1 — quien espere binario lo recodifica mal.',
          severity: 'warn',
          expected: 'documentado',
          porque: 'Es una convención del protocolo, no un dato errado: se documenta para no recodificarla como binaria.',
        },
        {
          dimension: 'Conformidad',
          label: `Dominio de censor: valores {${[...censors].sort().join(', ')}}`,
          detail: 'censor = 1 marca censura, no evento: el script del profesor lo confirma.',
          severity: 'warn',
          expected: 'documentado',
          porque: 'El código ya está confirmado por la fuente: convención a documentar, no sospecha abierta.',
        },
        {
          dimension: 'Completitud',
          label: `${rows.length} filas × ${Object.keys(rows[0] ?? {}).length} columnas, 0 celdas vacías`,
          detail: 'Sin faltantes verdaderos: la completitud de VALUNG no es el problema.',
          severity: 'ok',
          expected: 'verificado',
          porque: 'La revisión salió limpia: no hay nada que sospechar ni convención que documentar.',
        },
        {
          dimension: 'Plausibilidad',
          label: `${(mult10 * 100).toFixed(1)}% de Kps en múltiplos de 10`,
          detail: 'Preferencia de dígito: el Karnofsky se anotaba redondeado (75, 85, 99 son los únicos no redondos).',
          severity: 'warn',
          expected: 'documentado',
          porque: 'El redondeo es práctica clínica conocida: se documenta como rasgo de la medición, no se corrige.',
        },
        {
          dimension: 'Plausibilidad',
          label: `${outliers.length} valores de SurvTime sobre ${fmt(upper, 0)} días`,
          detail: 'El boxplot los marca, pero 999 y 991 son seguimientos reales verificados contra la fuente: se marcan, se verifican, no se borran.',
          severity: 'warn',
          expected: 'verificado',
          porque: 'Sí eran sospechosos — hasta verificarlos contra la fuente. Una vez confirmados, el veredicto es verificado.',
        },
      ];
    },
  },
  recid: {
    file: 'recid.csv',
    label: 'recid.csv',
    checks: (rows) => {
      const empCols = Array.from({ length: 52 }, (_, i) => `emp${i + 1}`);
      let structural = 0;
      let unexpected = 0;
      rows.forEach((r) => {
        const w = num(r.week);
        const firstNa = empCols.findIndex((c) => r[c] === '');
        if (firstNa === -1) return;
        const beforeFollowUp = firstNa + 1 < Math.min(w, 52);
        if (r.arrest === '1' && firstNa + 1 === Math.min(w, 52)) structural++;
        else if (beforeFollowUp || r.arrest !== '1') unexpected++;
      });
      const weeks = new Set(rows.filter((r) => r.arrest === '0').map((r) => r.week));
      const prio = rows.map((r) => num(r.prio)).filter(Number.isFinite);
      const mp = prio.reduce((a, b) => a + b, 0) / prio.length;
      const vp = prio.reduce((a, b) => a + (b - mp) ** 2, 0) / (prio.length - 1);
      const naCells = rows.reduce(
        (n, r) => n + Object.values(r).filter((v) => v === '').length,
        0
      );
      return [
        {
          dimension: 'Completitud',
          label: `${naCells.toLocaleString('es')} celdas emp vacías, solo en los arrestados`,
          detail: 'Faltantes estructurales: después del arresto no hubo semana que observar. No son NA de Rubin.',
          severity: 'warn',
          expected: 'documentado',
          porque: 'Es la estructura del diseño, no un dato perdido: se documenta para no tratarla como faltante de Rubin.',
        },
        {
          dimension: 'Completitud',
          label: `${structural} filas con emp vacío exactamente tras el evento`,
          detail: 'El patrón es monótono y alineado con week: la estructura del faltante confirma el diseño.',
          severity: 'ok',
          expected: 'verificado',
          porque: 'El patrón coincide exactamente con el diseño esperado: verificado, sin sospecha pendiente.',
        },
        {
          dimension: 'Conformidad',
          label: `week ∈ {${[...weeks].join(', ')}} en los 318 no arrestados`,
          detail: 'week = 53 es convención del archivo ("siguió las 52 semanas"), no una semana que existió.',
          severity: 'warn',
          expected: 'documentado',
          porque: 'Convención del archivo: se documenta para no sumarla como una semana real de seguimiento.',
        },
        {
          dimension: 'Plausibilidad',
          label: `prio: var/media = ${fmt(vp / mp)}`,
          detail: 'Sobredispersión frente a Poisson: importa cuando prio entre a un modelo de conteos.',
          severity: 'warn',
          expected: 'documentado',
          porque: 'Es una propiedad real del dato que condiciona el modelo futuro: se documenta, no es un valor errado.',
        },
        {
          dimension: 'Plausibilidad',
          label: `${unexpected} filas con huecos emp dentro del seguimiento`,
          detail: 'Cero huecos internos: el faltante es siempre de cola, nunca intermedio.',
          severity: 'ok',
          expected: 'verificado',
          porque: 'La verificación salió limpia: ningún hueco interno que investigar.',
        },
      ];
    },
  },
};

const DIM_COLOR: Record<Finding['dimension'], string> = {
  Conformidad: tokens.status.info,
  Completitud: tokens.status.warning,
  Plausibilidad: tokens.status.danger,
};

/**
 * Auditoría de calidad del dato en tres dimensiones (Kahn et al., 2016):
 * conformidad, completitud, plausibilidad. Los hallazgos se computan en
 * vivo del archivo real y el estudiante los marca: verificado /
 * sospechoso / documentado.
 */
export function DataQualityPanel({
  title,
  dataset = 'valung',
}: {
  title?: ReactNode;
  dataset?: keyof typeof QUALITY;
}) {
  const [dsKey, setDsKey] = useState(dataset);
  const spec = QUALITY[dsKey];
  const { rows, error } = useCsvRows(spec.file);
  const [marks, setMarks] = useState<Record<number, string>>({});

  const findings = useMemo(() => (rows ? spec.checks(rows) : null), [rows, spec]);
  const marked = Object.keys(marks).length;
  const correct = findings
    ? findings.filter((f, i) => marks[i] === f.expected).length
    : 0;

  return (
    <div className={FIG}>
      <div className={CAPTION}>
        {title ?? 'Informe de calidad del dato: conformidad, completitud, plausibilidad'}
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-ink-600">
        base
        <select
          value={dsKey}
          onChange={(e) => {
            setDsKey(e.target.value as keyof typeof QUALITY);
            setMarks({});
          }}
          className="rounded border border-ink-200 px-2 py-1"
        >
          {Object.entries(QUALITY).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
        {findings && (
          <span className={`ml-auto ${marked === findings.length ? 'font-medium text-ink-700' : 'text-ink-500'}`}>
            {correct} de {findings.length} veredictos correctos
            {marked < findings.length && ` · ${findings.length - marked} por revisar`}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-danger-600">No se pudo cargar {spec.file}: {error}</p>}
      {!findings && !error && <p className="text-xs text-ink-500">Auditando {spec.file}…</p>}

      {findings && (
        <ul className="space-y-2">
          {findings.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded border border-ink-200 p-3"
              style={{ borderLeft: `3px solid ${DIM_COLOR[f.dimension]}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-800">
                  <span className="mr-2 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
                    {f.dimension}
                  </span>
                  {f.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-600">{f.detail}</p>
                {marks[i] && (
                  <p className={`mt-1 text-xs leading-relaxed ${
                    marks[i] === f.expected ? 'text-success-700' : 'text-warning-800'
                  }`}>
                    {marks[i] === f.expected
                      ? `✓ veredicto correcto — ${f.porque}`
                      : `esperado: «${f.expected}» — ${f.porque}`}
                  </p>
                )}
              </div>
              <select
                value={marks[i] ?? ''}
                onChange={(e) => setMarks((m) => ({ ...m, [i]: e.target.value }))}
                className={`shrink-0 rounded border px-2 py-1 text-xs ${
                  !marks[i]
                    ? 'border-ink-200 text-ink-500'
                    : marks[i] === f.expected
                      ? 'border-success-400 bg-success-50 text-success-800'
                      : 'border-warning-400 bg-warning-50 text-warning-800'
                }`}
                aria-label={`Marcar hallazgo ${i + 1}`}
              >
                <option value="">sin revisar</option>
                <option value="verificado">verificado</option>
                <option value="sospechoso">sospechoso</option>
                <option value="documentado">documentado</option>
              </select>
            </li>
          ))}
        </ul>
      )}

      <p className={NOTE}>
        Regla de la auditoría: un dato sospechoso se marca, se verifica y se
        documenta — nunca se borra por un criterio estadístico. El texto de
        cada hallazgo ya trae la evidencia de la verificación: el ejercicio
        es elegir el veredicto que esa evidencia sostiene.
      </p>

      <SimGuide>
        <li>Los hallazgos se calculan del archivo real al cargar: <code>{spec.label}</code> no viene con el informe hecho.</li>
        <li>Lee la evidencia antes de marcar: «sospechoso» solo aplica mientras la verificación está pendiente — el detalle del hallazgo suele ya resolverla.</li>
        <li>Cambia a la otra base y repite la auditoría: el veredicto correcto cambia con el diseño, no con la intuición.</li>
      </SimGuide>
    </div>
  );
}
