import Link from 'next/link';
import { getAllModules } from '@/lib/modules';
import { COURSE_BLOCKS, COURSE_II_BLOCKS } from '@/lib/course-blocks';

export default function HomePage() {
  const modules = getAllModules();
  const repaso = modules.find((m) => m.meta.order === 0);
  const primeroI = modules.find((m) => m.meta.order === 1);
  const primeroII = modules
    .filter((m) => m.meta.course === 'II')
    .sort((a, b) => a.meta.order - b.meta.order)[0];

  const accesos = [
    repaso && {
      kicker: 'Antes de empezar',
      titulo: 'Repaso: leer los datos antes de analizarlos',
      descripcion:
        'La lectura previa recomendada: unidad de análisis, diccionario de datos, faltantes estructurales, atípicos y la anatomía completa del test estadístico: todo anclado en las bases reales del curso.',
      href: `/cursos/${repaso.meta.slug}`,
    },
    primeroI && {
      kicker: 'Curso I · Pregrado',
      titulo: 'Análisis Estadístico de Datos Epidemiológicos I',
      descripcion:
        'El recorrido completo: de la tabla 2×2 y las medidas de asociación a la confusión, cohortes y supervivencia, casos y controles, regresión y síntesis, más dos módulos transversales de herramientas y fronteras.',
      href: `/cursos/${primeroI.meta.slug}`,
    },
    primeroII && {
      kicker: 'Curso II · Avanzado',
      titulo: 'Análisis Estadístico de Datos Epidemiológicos II',
      descripcion:
        'La maquinaria profunda y la práctica de campo: métodos exactos, datos faltantes, confusión no medida, DAGs avanzados, emulación del ensayo objetivo, nowcasting, métodos G y el ejercicio integrador de limpieza y vinculación.',
      href: `/cursos/${primeroII.meta.slug}`,
    },
  ].filter(Boolean) as { kicker: string; titulo: string; descripcion: string; href: string }[];

  const renderBloques = (
    bloques: readonly { id: string; title: string; from: number; to: number }[],
    cursoII: boolean
  ) =>
    bloques.map((block) => {
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
                    {cursoII
                      ? `II-${mod.meta.order - 19}.`
                      : mod.meta.order === 0
                        ? 'Repaso'
                        : `${mod.meta.order}.`}{' '}
                    {mod.meta.title.replace(/^(?:\d+|II-\d+)\.\s*/, '')}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-500">{mod.meta.objective}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      );
    });

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
          Contenido basado en las notas de clase del profesor Juan Carlos Salazar Uribe
          del Departamento de Estadística de la Facultad de Ciencias - Universidad 
          Nacional de Colombia, Sede Medellín y el texto de Mark Woorward "EPIDEMIOLOGY
STUDY DESIGN AND DATA ANALYSIS".
        </p>
        <blockquote className="mt-6 border-l-2 border-brand-400 pl-5 font-display text-lg italic leading-relaxed text-ink-700">
          &ldquo;Somos propensos a sobrestimar lo que entendemos del mundo y a
          subestimar el papel del azar en los acontecimientos.&rdquo;
          <footer className="mt-1 font-sans text-sm not-italic text-ink-500">
            Daniel Kahneman.
          </footer>
        </blockquote>
      </header>

      <section aria-label="Puntos de entrada" className="mb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col rounded border border-ink-200 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                {a.kicker}
              </span>
              <span className="mt-1.5 font-medium leading-snug text-ink-900 group-hover:text-brand-700">
                {a.titulo}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-ink-500">
                {a.descripcion}
              </span>
              <span className="mt-auto pt-3 text-sm font-medium text-brand-600">
                Entrar →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Índice de módulos del Curso I" className="space-y-8">
        {renderBloques(COURSE_BLOCKS, false)}
      </section>

      <section aria-label="Índice de módulos del Curso II" className="mt-12 space-y-8">
        {renderBloques(COURSE_II_BLOCKS, true)}
      </section>
    </main>
  );
}
