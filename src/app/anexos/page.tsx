import { AppLayout } from '@/components/AppLayout';
import { ANEXOS, type Anexo } from '@/lib/anexos';
import { FileText, FileCode, FileImage, FileSpreadsheet, File } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anexos — Datos Epidemiológicos',
  description: 'Material complementario del curso: ensayo técnico, scripts, resultados y figuras.',
};

const TIPO_ICON: Record<Anexo['tipo'], typeof FileText> = {
  pdf: FileText,
  script: FileCode,
  documento: FileText,
  figura: FileImage,
  datos: FileSpreadsheet,
};

const PERMISO_LABEL: Record<Anexo['permiso'], string> = {
  'autor-curso': 'Material del curso',
  'material-docente': 'Material docente (Prof. Salazar)',
  tercero: 'Terceros',
};

const TIPO_LABEL: Record<Anexo['tipo'], string> = {
  pdf: 'PDF',
  script: 'Script',
  documento: 'Documento',
  figura: 'Figura',
  datos: 'Datos',
};

export default function AnexosPage() {
  const porModulo = new Map<string, Anexo[]>();
  for (const a of ANEXOS) {
    const key = a.modulo ?? 'general';
    porModulo.set(key, [...(porModulo.get(key) ?? []), a]);
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-ink-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Material complementario
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink-900">Anexos</h1>
          <p className="mt-3 text-ink-600">
            Documentos de soporte citados por los módulos: el ensayo técnico sobre el
            test exacto de Fisher, la auditoría independiente de las cifras de Perondi,
            los scripts de simulación y sus resultados. Todo el material publicado
            declara su permiso de uso; el material de terceros requiere licencia
            explícita para aparecer aquí.
          </p>
        </header>

        {[...porModulo.entries()].map(([modulo, anexos]) => (
          <section key={modulo} className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
              {modulo === 'general'
                ? 'General'
                : `Módulo ${modulo.replace(/^(\d+)-.*$/, '$1')} · ${modulo.replace(/^\d+-/, '').replace(/-/g, ' ')}`}
            </h2>
            <ul className="divide-y divide-ink-200 rounded border border-ink-200 bg-white">
              {anexos.map((a) => {
                const Icon = TIPO_ICON[a.tipo] ?? File;
                return (
                  <li key={a.id} id={a.id} className="scroll-mt-20 p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/anexos/${a.archivo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ink-900 underline decoration-ink-300 underline-offset-2 transition-colors hover:text-brand-700 hover:decoration-brand-500"
                        >
                          {a.titulo}
                        </a>
                        <p className="mt-1 text-sm leading-relaxed text-ink-600">{a.descripcion}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                          <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium">
                            {TIPO_LABEL[a.tipo]}
                          </span>
                          <span>{PERMISO_LABEL[a.permiso]}</span>
                          {a.autores && <span>{a.autores}</span>}
                          {a.anio && <span>{a.anio}</span>}
                          {a.licencia && <span>Licencia: {a.licencia}</span>}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
