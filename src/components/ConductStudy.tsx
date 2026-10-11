import type { ReactNode } from 'react';

/**
 * «Conducir el estudio»: la secuencia de siete pasos, idéntica para
 * cohorte, casos y controles, transversal y datos secundarios, que va de
 * la pregunta al archivo analizable. El componente solo da la forma
 * común (número, nombre del paso y la pregunta que responde); el
 * contenido —el producto de cada paso en ese diseño— vive en el MDX.
 */

const CANONICAL_STEPS = [
  {
    name: 'Pregunta',
    pregunta: '¿Qué efecto o frecuencia quiero estimar, en quién, comparado con qué, en qué horizonte?',
  },
  {
    name: 'Población fuente y marco',
    pregunta: '¿De qué población salen los sujetos y qué listado o registro la representa?',
  },
  {
    name: 'Selección',
    pregunta: '¿Cómo entran los sujetos: por exposición, por desenlace, al azar, por pareamiento?',
  },
  {
    name: 'Medición',
    pregunta: '¿Qué se mide, cuándo, con qué instrumento y por quién?',
  },
  {
    name: 'Estructura del archivo',
    pregunta: '¿Cuál es la unidad de análisis: persona, pareja, conjunto pareado, persona-tiempo, visita?',
  },
  {
    name: 'Exploración y validación',
    pregunta: '¿Los datos son confiables y qué muestran antes de cualquier prueba?',
  },
  {
    name: 'Medida e inferencia',
    pregunta: '¿Qué permite estimar el diseño y con qué método?',
  },
] as const;

export function ConductStudy({
  design,
  children,
}: {
  design: string;
  children?: ReactNode;
}) {
  return (
    <section className="my-8 rounded-lg border border-brand-200 bg-brand-50/40 px-5 py-4 dark:border-brand-800 dark:bg-brand-950/20">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
        Conducir el estudio — {design}
      </p>
      <p className="mt-1 mb-4 text-sm text-ink-600 dark:text-ink-400">
        La misma secuencia en cada diseño: lo que cambia es el muestreo,
        no el razonamiento.
      </p>
      <ol className="space-y-5">{children}</ol>
    </section>
  );
}

export function ConductStep({
  n,
  children,
}: {
  n: number;
  children?: ReactNode;
}) {
  const step = CANONICAL_STEPS[n - 1];
  if (!step) return null;
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900 dark:text-ink-100">
          {step.name}
        </p>
        <p className="text-sm italic text-ink-500 dark:text-ink-400">
          {step.pregunta}
        </p>
        <div className="mt-1.5 text-sm leading-relaxed text-ink-700 dark:text-ink-300 [&>ul]:list-disc [&>ul]:pl-5">
          {children}
        </div>
      </div>
    </li>
  );
}
