import Link from 'next/link';
import { getAllModules, COURSE_BLOCKS } from '@/lib/modules';

export default function HomePage() {
  const modules = getAllModules();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          Universidad Nacional de Colombia · Sede Medellín
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900">
          Análisis Estadístico de Datos Epidemiológicos
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-600">
          Cinco bloques: desde la tabla 2×2 al meta-análisis, más un módulo
          transversal de herramientas (R, SAS y Python) y un repaso de proyectos
          y conceptos de estudio vigentes en epidemiología.
        </p>
        <blockquote className="mt-6 border-l-2 border-brand-400 pl-5 font-display text-lg italic leading-relaxed text-ink-700">
          &ldquo;Somos propensos a sobrestimar lo que entendemos del mundo y a
          subestimar el papel del azar en los acontecimientos.&rdquo;
          <footer className="mt-1 font-sans text-sm not-italic text-ink-500">
            Daniel Kahneman, <em>Epidemiology</em> (2014)
          </footer>
        </blockquote>
      </header>

      <section aria-label="Índice de módulos" className="space-y-8">
        {COURSE_BLOCKS.map((block) => {
          const blockModules = modules.filter(
            (m) => m.meta.order >= block.from && m.meta.order <= block.to
          );
          if (blockModules.length === 0) return null;
          return (
            <div key={block.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">
                Bloque {block.id} · {block.title}
              </h2>
              <ol className="space-y-2">
                {blockModules.map((mod) => (
                  <li key={mod.meta.slug}>
                    <Link
                      href={`/cursos/${mod.meta.slug}`}
                      className="group block rounded border border-ink-200 bg-white px-5 py-3.5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                    >
                      <span className="font-medium text-ink-900 group-hover:text-brand-700">
                        {mod.meta.order === 0 ? 'Repaso' : `${mod.meta.order}.`}{' '}
                        {mod.meta.title.replace(/^\d+\.\s*/, '')}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-500">{mod.meta.objective}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </section>
    </main>
  );
}
