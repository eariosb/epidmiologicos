import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { getAllModules } from '@/lib/modules';
import type { ModuleMeta } from '@/lib/modules';
import { Radar, Stethoscope, Landmark, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rutas por perfil — Datos Epidemiológicos',
  description:
    'Tres rutas de lectura sobre el mismo curso: vigilancia epidemiológica, práctica clínica y política de salud pública.',
};

type Profile = 'vigilancia' | 'clinico' | 'politica';

const PROFILES: {
  id: Profile;
  nombre: string;
  contexto: string;
  Icon: typeof Radar;
}[] = [
  {
    id: 'vigilancia',
    nombre: 'Vigilancia · INS · SIVIGILA',
    contexto:
      'Medición de la enfermedad en población, sistemas de notificación, brotes y pruebas diagnósticas.',
    Icon: Radar,
  },
  {
    id: 'clinico',
    nombre: 'Clínico · farmacoepidemiología',
    contexto:
      'Medidas de asociación, NNT, estudios pareados y decisión clínica con incertidumbre.',
    Icon: Stethoscope,
  },
  {
    id: 'politica',
    nombre: 'Política · salud pública',
    contexto:
      'Impacto poblacional, comparaciones entre poblaciones, síntesis de evidencia y comunicación al decisor.',
    Icon: Landmark,
  },
];

function ModuleLink({ meta }: { meta: ModuleMeta }) {
  const numero = meta.order === 0 ? 'Repaso' : `M${meta.order}`;
  return (
    <Link
      href={`/cursos/${meta.slug}`}
      className="group flex items-baseline gap-2 rounded px-2 py-1.5 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
    >
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-400 group-hover:text-brand-600">
        {numero}
      </span>
      <span className="min-w-0 flex-1 leading-snug">
        {meta.title.replace(/^\d+\.\s*/, '')}
      </span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 self-center text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
        aria-hidden
      />
    </Link>
  );
}

export default function RutasPage() {
  const modules = getAllModules('I').map((m) => m.meta);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 border-b border-ink-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Rutas de lectura
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900">
            Tres perfiles, un mismo curso
          </h1>
          <p className="mt-3 text-ink-600">
            El orden lineal 0→19 sirve al curso completo, pero nadie es a la
            vez vigilante, clínico y analista de política. Cada ruta marca su{' '}
            <strong>núcleo</strong> —lo que hay que leer completo— y su{' '}
            <strong>profundización prioritaria</strong> —los plegables y
            anexos que conviene abrir primero—. Los módulos fuera de tu ruta
            siguen disponibles; la ruta ordena, no excluye.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {PROFILES.map(({ id, nombre, contexto, Icon }) => {
            const nucleo = modules.filter((m) => m.profiles.includes(id));
            const prof = modules.filter((m) => m.profilesDeep.includes(id));
            return (
              <section
                key={id}
                className="flex flex-col rounded border border-ink-200 bg-white shadow-sm"
              >
                <div className="border-b border-ink-100 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-brand-600" aria-hidden />
                    <h2 className="text-sm font-semibold text-ink-900">
                      {nombre}
                    </h2>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">
                    {contexto}
                  </p>
                </div>
                <div className="flex-1 p-3">
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Núcleo
                  </h3>
                  <nav className="flex flex-col">
                    {nucleo.map((m) => (
                      <ModuleLink key={m.slug} meta={m} />
                    ))}
                  </nav>
                  {prof.length > 0 && (
                    <>
                      <h3 className="mb-1 mt-4 border-t border-ink-100 px-2 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                        Profundización prioritaria
                      </h3>
                      <nav className="flex flex-col">
                        {prof.map((m) => (
                          <ModuleLink key={m.slug} meta={m} />
                        ))}
                      </nav>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-8 text-xs italic text-ink-500">
          Las rutas se generan desde el frontmatter de cada módulo
          (<code>profiles</code> y <code>profilesDeep</code>); el hilo de
          precisión (módulos 5, 6, 9, 13 y 17) las atraviesa a las tres.
        </p>
      </div>
    </AppLayout>
  );
}
