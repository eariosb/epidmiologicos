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
          Procesos Estocásticos, con una introducción a las EDE
        </h1>
        <p className="mt-3 text-lg text-ink-600">
          Del azar que evoluciona en el tiempo a las ecuaciones diferenciales estocásticas:
          cadenas de Markov, procesos estacionarios y gaussianos, movimiento browniano, la
          integral de Itô, el proceso de Poisson y las difusiones, con simulación en R en
          cada paso.
        </p>
        <blockquote className="mt-5 border-l-4 border-accent-400 pl-4 text-ink-700 italic">
          &ldquo;Un proceso estocástico no es una distribución: es una familia de ellas
          indexada por el tiempo.&rdquo;
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
