import { AppLayout } from '@/components/AppLayout';
import { LECTURAS, ENLACES } from '@/lib/lecturas';
import { BookOpen, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bibliografía — Datos Epidemiológicos',
  description:
    'Apéndice de bibliografía, enlaces y lecturas de interés del curso, organizado por tema.',
};

export default function BibliografiaPage() {
  const total = LECTURAS.reduce((n, s) => n + s.entradas.length, 0);
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-ink-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Apéndice del curso
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900">
            Bibliografía, enlaces y lecturas de interés
          </h1>
          <p className="mt-3 text-ink-600">
            {total} referencias organizadas por los temas del curso: el andamiaje
            teórico (Woodward, Rothman &amp; Greenland, Hernán &amp; Robins) y las
            lecturas que soportan la columna práctica —conducir el estudio,
            explorar antes de inferir, datos del mundo real e intuición
            cuantitativa—. Cada cita indica para qué la usa el curso. Los
            documentos técnicos, PDFs y scripts del curso están en los{' '}
            <a
              href="/anexos"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-500"
            >
              anexos
            </a>{' '}
            y las siglas en el{' '}
            <a
              href="/glosario"
              className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-500"
            >
              glosario
            </a>
            .
          </p>
          <p className="mt-3 rounded border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-800">
            Las referencias se verifican contra la fuente antes de cada
            publicación; volumen y páginas pueden requerir corrección menor.
            Las normas colombianas se citan por nombre y deben leerse en su
            texto vigente.
          </p>
        </header>

        {LECTURAS.map((seccion) => (
          <section key={seccion.titulo} className="mb-10">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-ink-400">
              {seccion.titulo}
            </h2>
            {seccion.nota && (
              <p className="mb-3 text-sm italic text-ink-500">{seccion.nota}</p>
            )}
            <ul className="divide-y divide-ink-200 rounded border border-ink-200 bg-white">
              {seccion.entradas.map((l) => (
                <li key={l.cita} className="flex items-start gap-3 p-4">
                  <BookOpen
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-ink-800">
                      {l.cita}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {l.nota && <span className="text-ink-500">{l.nota}</span>}
                      {l.doi && (
                        <a
                          href={`https://doi.org/${l.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-800 hover:decoration-brand-500"
                        >
                          DOI
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <h2 className="mb-4 mt-12 border-t border-ink-200 pt-8 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Enlaces y recursos
        </h2>
        {ENLACES.map((grupo) => (
          <section key={grupo.titulo} className="mb-8">
            <h3 className="mb-3 text-sm font-semibold text-ink-700">
              {grupo.titulo}
            </h3>
            <ul className="divide-y divide-ink-200 rounded border border-ink-200 bg-white">
              {grupo.items.map((e) => (
                <li key={e.url} className="flex items-start gap-3 p-4">
                  <ExternalLink
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-ink-900 underline decoration-ink-300 underline-offset-2 transition-colors hover:text-brand-700 hover:decoration-brand-500"
                    >
                      {e.nombre}
                    </a>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {e.nota}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppLayout>
  );
}
