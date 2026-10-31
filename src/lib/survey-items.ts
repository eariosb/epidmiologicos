// Definiciones de los instrumentos de la prueba de campo.
// Fuente: prueba-campo/docs/05-instrumentos-encuesta.md
// Escala Likert 1–5: 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo.

export type SurveyItem =
  | { id: string; type: 'likert'; label: string }
  | { id: string; type: 'choice'; label: string; options: string[] }
  | { id: string; type: 'open'; label: string; rows?: number }
  | { id: string; type: 'nps'; label: string };

export type SurveyResponses = Record<string, string | number>;

/** Instrumento A — pre-test (pantalla de enrolamiento, tras consentir). */
export const PRETEST_ITEMS: SurveyItem[] = [
  {
    id: 'programa',
    type: 'choice',
    label: 'Programa académico',
    options: ['Estadística', 'Matemáticas', 'Ingeniería', 'Otro'],
  },
  { id: 'semestre', type: 'open', label: 'Semestre actual', rows: 1 },
  {
    id: 'cursos_previos',
    type: 'choice',
    label: 'Has tomado ya',
    options: ['Probabilidad', 'Inferencia', 'Programación en R', 'Ninguno'],
  },
  { id: 'exp_notacion', type: 'likert', label: 'Me siento cómodo(a) leyendo notación matemática de probabilidad.' },
  { id: 'exp_r', type: 'likert', label: 'He usado R (o RStudio/Posit) para hacer cálculos o gráficos.' },
  { id: 'exp_interactivo', type: 'likert', label: 'He usado plataformas web interactivas para aprender (con simulaciones o código ejecutable).' },
  { id: 'expectativa', type: 'open', label: '¿Qué esperas poder hacer con esta plataforma al terminar la prueba?' },
  { id: 'preocupacion', type: 'open', label: '¿Qué te preocupa o qué crees que puede fallar?' },
];

/** Instrumento B — micro-encuesta por módulo (<60 s). */
export function postModuleItems(concept: string): SurveyItem[] {
  return [
    { id: 'entendi', type: 'likert', label: `Este módulo me ayudó a entender ${concept}.` },
    { id: 'interactivos', type: 'likert', label: 'Los ejemplos interactivos (simuladores, código ejecutable) aclararon el concepto — no fueron solo decoración.' },
    { id: 'lenguaje', type: 'likert', label: 'El lenguaje del módulo era apropiado para mi nivel.' },
    { id: 'confuso', type: 'open', label: '¿Qué fue lo más confuso o qué cambiarías de este módulo?', rows: 2 },
  ];
}

/** Instrumento C — SUS en español + bloque específico + abiertas + NPS. */
export function susFinalItems(courseSpecific: SurveyItem[]): SurveyItem[] {
  return [
    { id: 'sus1', type: 'likert', label: 'Creo que me gustaría usar esta plataforma con frecuencia.' },
    { id: 'sus2', type: 'likert', label: 'Encontré la plataforma innecesariamente compleja.' },
    { id: 'sus3', type: 'likert', label: 'Pensé que la plataforma era fácil de usar.' },
    { id: 'sus4', type: 'likert', label: 'Creo que necesitaría ayuda de una persona técnica para usarla.' },
    { id: 'sus5', type: 'likert', label: 'Encontré que las funciones estaban bien integradas.' },
    { id: 'sus6', type: 'likert', label: 'Pensé que había demasiada inconsistencia en la plataforma.' },
    { id: 'sus7', type: 'likert', label: 'Imagino que la mayoría de la gente aprendería a usarla rápidamente.' },
    { id: 'sus8', type: 'likert', label: 'Encontré la plataforma muy incómoda de usar.' },
    { id: 'sus9', type: 'likert', label: 'Me sentí confiado(a) usando la plataforma.' },
    { id: 'sus10', type: 'likert', label: 'Necesité aprender muchas cosas antes de poder usarla.' },
    { id: 'sim_ver', type: 'likert', label: 'Los simuladores interactivos me ayudaron a *ver* los conceptos, no solo a leerlos.' },
    { id: 'tooltips', type: 'likert', label: 'Los tooltips de siglas resolvían mis dudas sin sacarme del texto.' },
    { id: 'webr', type: 'likert', label: 'Ejecutar código R dentro de la página fue útil para mi aprendizaje.' },
    { id: 'pizarra', type: 'likert', label: 'La pizarra digital me sirvió para guardar/organizar lo que iba descubriendo.' },
    { id: 'asistente', type: 'likert', label: 'Las preguntas al asistente (chat) respondieron lo que el texto no aclaraba.' },
    ...courseSpecific,
    { id: 'mejor', type: 'open', label: '¿Qué es lo mejor de la plataforma y no debería cambiar?' },
    { id: 'peor', type: 'open', label: '¿Qué es lo peor o lo que más te frustró?' },
    { id: 'dispositivo', type: 'open', label: '¿Usaste la app en celular, tablet o computador? ¿Cómo fue la experiencia?', rows: 1 },
    { id: 'recomendar_pq', type: 'open', label: '¿Recomendarías la plataforma a un compañero? ¿Por qué?', rows: 2 },
    { id: 'nps', type: 'nps', label: '0–10: ¿qué tan probable es que la recomiendes?' },
  ];
}

/** Puntaje SUS estándar a partir de las respuestas (0–100). */
export function susScore(r: SurveyResponses): number | null {
  const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => Number(r[`sus${i}`]));
  if (vals.some((v) => !Number.isFinite(v) || v < 1 || v > 5)) return null;
  const odd = vals.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
  const even = vals.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
  return 2.5 * (odd - 5 + (25 - even));
}
