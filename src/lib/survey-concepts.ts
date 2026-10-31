// Concepto central de cada módulo — alimenta la micro-encuesta post-módulo
// (doc 05, instrumento B, ítem 1: "este módulo me ayudó a entender X").
export const MODULE_CONCEPTS: Record<string, string> = {
  '00-repaso-datos-epidemiologicos': 'los tipos de datos epidemiológicos',
  '01-epidemiologia-cuantitativa': 'la epidemiología como disciplina cuantitativa',
  '01-historia-etica-diseno': 'cómo la historia y la ética dieron forma al diseño epidemiológico',
  '02-mapa-disenos-causalidad': 'la relación entre diseño de estudio y fuerza causal',
  '03-medicion-incidencia-prevalencia': 'incidencia y prevalencia',
  '04-rr-or-rd': 'riesgo relativo, odds ratio y diferencia de riesgos',
  '05-nnt-atribuible-pvalor': 'el NNT, la fracción atribuible y lo que el p-valor no dice',
  '06-inferencia-exacta-calibracion': 'la inferencia exacta y la calibración de métodos',
  '07-confusion-dags': 'la confusión y su representación con DAGs',
  '08-estratificacion-mantel-haenszel': 'la estratificación y el estimador de Mantel–Haenszel',
  '09-estandarizacion': 'la estandarización directa e indirecta de tasas',
  '10-interaccion-modificacion': 'la diferencia entre interacción y confusión',
  '11-cohortes-tablas-vida': 'los estudios de cohortes y las tablas de vida',
  '12-kaplan-meier-logrank': 'las curvas de Kaplan–Meier y la prueba log-rank',
  '13-persona-tiempo-smr-cox': 'el tiempo-persona, la SMR y el modelo de Cox',
  '14-casos-controles-sesgos': 'el diseño de casos y controles y sus sesgos',
  '15-matching-mcnemar-clogit': 'el pareamiento, McNemar y la regresión logística condicional',
  '16-regresion-logistica-poisson': 'la regresión logística y de Poisson en epidemiología',
  '17-sintesis-metaanalisis-uq': 'la síntesis de evidencia y el metaanálisis',
  '18-herramientas-computacionales': 'las herramientas computacionales del análisis epidemiológico',
  '19-fronteras-abiertas': 'los límites de la inferencia epidemiológica',
  '20-sala-maquinas-exacta': 'los métodos exactos para muestras pequeñas',
  '21-datos-faltantes': 'los mecanismos y el manejo de datos faltantes',
  '22-confusion-no-medida': 'la confusión no medida y el análisis de sensibilidad',
  '23-dags-avanzados': 'los DAGs avanzados y los sesgos de selección',
  '24-matching-iptw-avanzado': 'el IPTW y el matching avanzado',
  '25-vigilancia-nowcasting': 'la vigilancia epidemiológica y el nowcasting',
  '26-metaanalisis-avanzado': 'los métodos avanzados de metaanálisis',
  '27-estimandos-metodos-g': 'los estimandos y los métodos G',
  '28-incertidumbre-decision': 'la cuantificación de incertidumbre para la decisión',
  '29-practica-campo-vinculacion': 'la integración del análisis en la práctica de campo',
};

export function conceptFor(slug: string): string {
  return MODULE_CONCEPTS[slug] ?? 'el tema central del módulo';
}
