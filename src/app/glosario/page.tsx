import { AppLayout } from '@/components/AppLayout';
import { GLOSSARY_SECTIONS, GLOSSARY_SIZE, glossaryAnchor } from '@/lib/glossary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Glosario — Datos Epidemiológicos',
  description:
    'Glosario de siglas, símbolos y conceptos del curso, generado del mismo diccionario que alimenta los tooltips de los módulos.',
};

export default function GlosarioPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-ink-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Compendio del curso
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900">
            Glosario de siglas, símbolos y conceptos
          </h1>
          <p className="mt-3 text-ink-600">
            {GLOSSARY_SIZE} entradas. Es el mismo diccionario que alimenta los
            tooltips del texto: cada término subrayado en los módulos aparece
            aquí con su definición. Para las referencias completas, ver la{' '}
            <a
              href="/bibliografia"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-500"
            >
              bibliografía y lecturas
            </a>
            .
          </p>
        </header>

        {GLOSSARY_SECTIONS.map((seccion) => (
          <section key={seccion.titulo} className="mb-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
              {seccion.titulo}
            </h2>
            <dl className="divide-y divide-ink-200 rounded border border-ink-200 bg-white">
              {Object.entries(seccion.entradas).map(([k, def]) => (
                <div
                  key={k}
                  id={glossaryAnchor(k)}
                  className="flex scroll-mt-20 items-start gap-3 p-3.5 target:bg-brand-50"
                >
                  <dt className="w-28 shrink-0 font-mono text-sm font-semibold text-brand-700">
                    {k}
                  </dt>
                  <dd className="min-w-0 flex-1 text-sm leading-relaxed text-ink-700">
                    {def}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
