import Link from 'next/link';
import { getAllModules, COURSE_BLOCKS } from '@/lib/modules';

export default function HomePage() {
  const modules = getAllModules();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">
          Universidad Nacional de Colombia · Sede Medellín
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-ink-900">
          Análisis Estadístico de Datos Epidemiológicos
        </h1>
        <p className="mt-3 text-lg text-ink-600">
          Ccinco bloques: desde la tabla 2×2 al meta-análisis,
          más un módulo transversal de herramientas (R, SAS y Python) y un breve 
          repaso por algunos proyectos y conceptos interesantes de estudi 
          actualmente en epidemiología.
        </p>
        <blockquote className="mt-5 border-l-4 border-accent-400 pl-4 text-ink-700 italic">
          &ldquo;Somos propensos a sobrestimar lo que entendemos del mundo y a 
          subestimar el papel del azar en los acontecimientos.&rdquo;  Daniel Kahneman, <em>Epidemiology</em> (2014)
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
                      className="group block rounded border border-ink-200 bg-white px-5 py-3.5 shadow-sm transition-all hover:border-accent-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
                    >
                      <span className="font-medium text-ink-900 group-hover:text-accent-700">
                        {mod.meta.order}. {mod.meta.title.replace(/^\d+\.\s*/, '')}
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
