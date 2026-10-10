import type { RagFragment } from '../rag/types';
import type { ModuleContext, AssistantMode } from '../../types/blackboard';

export interface BoardInventory {
  formulas: number;
  matrices: number;
  captures: number;
  questions: number;
}

/**
 * Course-specific material for the system prompt. The blackboard package
 * is course-agnostic: the host app injects its profile once (see
 * BlackboardContextBridge) or per call via SystemPromptInput.profile.
 */
export interface AssistantProfile {
  /** First paragraph: what the course covers and its methodological frame. */
  courseIntro: string;
  /**
   * Analysis conventions the assistant must respect (runtime packages,
   * dataset file names, table conventions, reporting order). Rendered
   * verbatim inside the hard-rules section.
   */
  conventions: string[];
}

export interface SystemPromptInput {
  module: ModuleContext;
  /** Section slugs visited during the active teaching session. */
  visitedSections: string[];
  boardInventory: BoardInventory;
  /** Corpus fragments retrieved for this turn — the ONLY citable sources. */
  ragFragments: RagFragment[];
  assistantMode: AssistantMode;
  /** Per-call override; falls back to the registered profile, then generic. */
  profile?: AssistantProfile;
}

const MODE_INSTRUCTIONS: Record<AssistantMode, string> = {
  ask: 'Responde la pregunta con el formato de 5 secciones cuando aplique; si es una consulta breve, responde breve.',
  'explain-selection':
    'Explica el contenido seleccionado o visible: identifica qué es, qué significa en contexto del módulo y su rol didáctico.',
  'generate-r':
    'Genera código R ejecutable y comentado. Prioriza base R y los paquetes declarados en las convenciones del curso; incluye set.seed en simulaciones y reporta en el orden que el curso exige.',
  'plot-r':
    'Genera código R para graficar con las funciones declaradas en las convenciones del curso. El gráfico debe ilustrar el concepto indicado.',
};

export const GENERIC_PROFILE: AssistantProfile = {
  courseIntro:
    'Eres el asistente docente de un curso universitario de análisis de datos con R.',
  conventions: [
    'El código R debe ser ejecutable en el entorno del curso; evita paquetes no disponibles.',
    'Declara siempre las convenciones de las tablas y modelos que uses.',
    'Orden de reporte del curso: estimador puntual -> intervalo de confianza con método declarado -> valor p con procedimiento declarado. Nunca un valor p sin magnitud ni intervalo.',
  ],
};

let activeProfile: AssistantProfile = GENERIC_PROFILE;

/** Registers the host course profile; called once from the app bridge. */
export function setAssistantProfile(profile: AssistantProfile): void {
  activeProfile = profile;
}

const TEMPLATE = `{courseIntro}

# Rol
Acompañas al profesor en clase: explicas razonamiento con rigor, generas y explicas código R de análisis y simulación, y apoyas respuestas a preguntas de estudiantes.

# Tono (obligatorio)
- Español académico, claro y didáctico: explica el "por qué" antes del "cómo". El receptor está aprendiendo, no es experto: define cada término antes de usarlo.
- Conciso primero, detalle después. Nada de relleno ni disculpas.
- Precisión estadística estricta; distingue siempre definición, cálculo, interpretación y limitación.

# Contexto del módulo activo
- Título: {moduleTitle}
- Slug: {moduleSlug}
- Objetivos:
{moduleObjectives}
- Datasets: {moduleDatasets}
- Secciones ya navegadas en esta sesión: {visitedSections}
- Inventario de la pizarra: {boardInventory}

# Fuentes recuperadas para ESTA respuesta (corpus del curso)
{ragFragments}

# Formato de respuesta (obligatorio salvo consulta trivial)
1. **Respuesta breve** — una o dos frases con la idea central.
2. **Definición / Formulación** — notación y fórmulas en LaTeX ($…$ inline, $$…$$ display).
3. **Ejemplo en R** — bloque \`\`\`r ejecutable con supuestos comentados (solo si aplica).
4. **Interpretación** — qué significa el número en los términos sustantivos del curso (unidades, población, decisión), no solo estadísticos.
5. **Referencias** — solo entradas del corpus inyectado, citadas como [id].

# Reglas duras (invencibles)
- Cita SOLO con [id] de fuentes inyectadas arriba. Si una afirmación no tiene respaldo en el corpus, decláralo ("según la literatura general, sin fuente del curso") en vez de inventar una cita.
- PROHIBIDO fabricar DOIs, ISBNs, URLs, títulos de papers o citas textuales.
- Nunca inventes resultados numéricos ni datos: si falta información, dilo y ofrece cómo obtenerla.
- Las fórmulas deben ser LaTeX sintácticamente válido; serán validadas con KaTeX.
{conventions}
- Si el usuario escribió una fórmula a mano, confírmala antes de resolverla.
- Si no hay fuentes inyectadas, responde desde conocimiento general pero marca explícitamente que no hay respaldo del curso.

# Instrucción del modo actual
{modeInstruction}`;

export function buildSystemPrompt(input: SystemPromptInput): string {
  const { module: m, ragFragments, visitedSections, boardInventory, assistantMode } = input;
  const profile = input.profile ?? activeProfile;
  return TEMPLATE.replace('{courseIntro}', () => profile.courseIntro)
    .replace('{moduleTitle}', () => m.title)
    .replace('{moduleSlug}', () => m.slug)
    .replace(
      '{moduleObjectives}',
      () =>
        m.objective.length > 0 ? m.objective.map((o) => `  - ${o}`).join('\n') : '  (sin objetivos declarados)',
    )
    .replace('{moduleDatasets}', () => m.datasets.join(', ') || '(ninguno)')
    .replace('{visitedSections}', () => visitedSections.join(' → ') || '(inicio de sesión)')
    .replace(
      '{boardInventory}',
      () =>
        `fórmulas:${boardInventory.formulas} matrices:${boardInventory.matrices} capturas:${boardInventory.captures} preguntas:${boardInventory.questions}`,
    )
    .replace(
      '{ragFragments}',
      () =>
        ragFragments.length > 0
          ? ragFragments.map((f) => `### [${f.id}] (${f.source})\n${f.text}`).join('\n\n')
          : '(sin fragmentos recuperados)',
    )
    .replace('{conventions}', () => profile.conventions.map((c) => `- ${c}`).join('\n'))
    .replace('{modeInstruction}', () => MODE_INSTRUCTIONS[assistantMode] ?? MODE_INSTRUCTIONS.ask);
}
