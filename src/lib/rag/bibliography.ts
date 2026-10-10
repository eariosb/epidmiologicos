import type { RagDoc } from '@cursos/blackboard/rag';

export interface BibEntry {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  /** Short topical summary used as the retrievable text. */
  summary: string;
  isbn?: string;
  doi?: string;
}

/**
 * Canonical references for the epidemiological data-analysis course. These
 * are the ONLY bibliography sources the assistant may cite as [bib:*] —
 * anything else is sanitized to [referencia no verificada].
 *
 * Texto guía: Woodward (2014). Material de clase: notas del profesor Juan
 * Carlos Salazar Uribe (ADEI, UNAL Medellín). Las notas de lectura del
 * estudiante cubren los textos complementarios.
 */
export const BIBLIOGRAPHY: BibEntry[] = [
  {
    id: 'woodward-2014',
    title: 'Epidemiology: Study Design and Data Analysis',
    authors: 'Woodward, M.',
    year: 2014,
    venue: 'Chapman & Hall/CRC, 3ª edición',
    isbn: '978-1-4398-3970-6',
    summary:
      'Texto guía del curso, centrado en el cohorte SHHS como dataset de hilván. Cap. 1: enfoque estadístico, estudios animales y ecológicos, ensayos clínicos, prueba de hipótesis vs. estimación. Cap. 2: medidas de asociación (RR, OR, SMR, riesgo atribuible, NNT) y ICs. Cap. 3: confusión, estratificación, Mantel-Haenszel, Breslow-Day, efecto modificador. Caps. 4-5: diseños de cohorte, supervivencia, Kaplan-Meier, log-rank, modelos de Cox y de Poisson. Cap. 8: casos y controles, matching, sesgos (Berkson, Neyman, recuerdo). Woodward insiste: la epidemiología es comparativa; el diseño determina qué se puede estimar; la confusión es el enemigo central; estimar antes que contrastar; la causalidad es acumulación de evidencia (Bradford Hill).',
  },
  {
    id: 'salazar-2025',
    title: 'Análisis Estadístico de Datos Epidemiológicos: notas de clase, scripts R y SAS',
    authors: 'Salazar Uribe, J.C.',
    year: 2025,
    venue: 'Curso ADEI, Escuela de Estadística, Universidad Nacional de Colombia, Medellín',
    summary:
      'Material docente del curso: 24 clases con scripts R/SAS y datos reales. Ejemplos canónicos: deporte y depresión (tabla 2×2 con χ² y corrección de Yates), leucemia (Kaplan-Meier con ICs y risk table), VALUNG y RECID (log-rank, Cox), equivalencia McNemar ⇔ CMH en pareamiento 1:1, DDIMER (matching variable 1:c), BCG (matching 1:1 con clogit), médicos y ortopedicidad (Mantel-Haenszel con confusión), SMR en bronquitis, tabaquismo materno y peso al nacer (PRA, PRAP). Cada clase abre con una cita de Cervantes.',
  },
  {
    id: 'snow-1855',
    title: 'On the Mode of Communication of Cholera',
    authors: 'Snow, J.',
    year: 1855,
    venue: 'John Churchill, Londres (2ª ed.)',
    summary:
      'El fundamento empírico de la epidemiología: el mapa de Broad Street y el experimento natural de las compañías de agua (Lambeth vs. Southwark & Vauxhall). Primera demostración de que la estructura de los datos, no solo su volumen, permite inferencia causal.',
  },
  {
    id: 'tuskegee-narrative',
    title: 'Final Report of the Tuskegee Syphilis Study Ad Hoc Advisory Panel',
    authors: 'U.S. Public Health Service',
    year: 1973,
    venue: 'U.S. Department of Health, Education, and Welfare',
    summary:
      'Documento fuente del módulo de ética: 399 hombres afroamericanos con sífilis latente observados sin tratamiento entre 1932 y 1972, pese a la penicilina disponible desde 1945. Produjo la Comisión Nacional de 1974 y el Informe Belmont (1979): respeto por las personas, beneficencia y justicia como pilares de la ética en investigación.',
  },
  {
    id: 'doll-hill-1964',
    title: 'Mortality in Relation to Smoking: Ten Years Observations of British Doctors',
    authors: 'Doll, R.; Hill, A.B.',
    year: 1964,
    venue: 'British Medical Journal',
    summary:
      'La cohorte prospectiva arquetípica: seguimiento de ~34,000 médicos británicos; gradiente dosis-respuesta tabaquismo → cáncer de pulmón, reversibilidad al dejar de fumar, comparación con el estudio de casos y controles de 1950. Demuestra que el diseño (prospectivo vs. retrospectivo) cambia qué medidas son estimables.',
  },
  {
    id: 'bradford-hill-1965',
    title: 'The Environment and Disease: Association or Causation?',
    authors: 'Hill, A.B.',
    year: 1965,
    venue: 'Proceedings of the Royal Society of Medicine, 58(5)',
    summary:
      'Los siete principios de causalidad: fuerza de asociación, secuencia temporal, plausibilidad biológica, replicación, reversibilidad, gradiente dosis-respuesta y ausencia de explicación alternativa. Woodward los reformula: son criterios de acumulación de evidencia, ninguno necesario ni suficiente por sí solo.',
  },
  {
    id: 'molinero-or-rr',
    title: 'Cuando el odds ratio engaña: la rareza como condición de aproximación',
    authors: 'Molinero González (y comentaristas del debate OR vs. RR)',
    year: 2010,
    venue: 'Notas de lectura del curso',
    summary:
      'El dilema: el OR sobreestima el RR cuando la enfermedad es prevalente, pero el RR solo existe en diseños con incidencia. La aproximación OR ≈ RR exige enfermedad rara (<10%) y controles representativos. Central para el módulo de medidas: la tabla 2×2 se lee distinto según el diseño que la produjo.',
  },
  {
    id: 'mantel-haenszel-1959',
    title: 'Statistical Aspects of the Analysis of Data from Retrospective Studies of Disease',
    authors: 'Mantel, N.; Haenszel, W.',
    year: 1959,
    venue: 'Journal of the National Cancer Institute, 22(4)',
    summary:
      'El estimador estratificado canónico: resume tablas 2×2×K con pesos inversos a la varianza, controlando un confusor categórico. Incluye el test de asociación que en pareamiento 1:1 coincide con McNemar, la equivalencia demostrada en clase con datos de BCG.',
  },
  {
    id: 'breslow-day-1980',
    title: 'Statistical Methods in Cancer Research, Vol. I: The Analysis of Case-Control Studies',
    authors: 'Breslow, N.E.; Day, N.E.',
    year: 1980,
    venue: 'IARC Scientific Publications, Lyon',
    summary:
      'La referencia del test de homogeneidad de OR entre estratos (Breslow-Day): si los OR difieren hay interacción real y no procede resumir con MH. Distingue confusión (corregible por estratificación) de efecto modificador (debe describirse por separado).',
  },
  {
    id: 'izbicki-uq',
    title: 'Machine Learning Beyond Point Predictions: Uncertainty Quantification',
    authors: 'Izbicki, R.',
    year: 2024,
    venue: 'Notas/manuscrito, con lectura relacionada de Coscrato & Izbicki (agnostic tests)',
    summary:
      'Base del módulo de incertidumbre: predicción conforme (cobertura garantizada sin supuestos distribucionales), distinción aleatoria vs. epistémica, y por qué un modelo con buen AUC puede ser clínicamente inútil si su calibración es pobre. Los tests agnósticos de Coscrato-Izbicki-Stern conectan con la filosofía de Woodward: contrastar sin imponer el modelo.',
  },
  {
    id: 'mosteller-tukey-fda',
    title: 'The Future of Data Analysis',
    authors: 'Tukey, J.W.',
    year: 1962,
    venue: 'Annals of Mathematical Statistics, 33(1)',
    summary:
      'El manifiesto de Tukey: el análisis de datos como ciencia propia, no una rama matemática. Resonancia directa con los principios de Woodward: la pregunta (comparación) precede a la técnica; la confirmación y la exploración son modos distintos del análisis.',
  },
  {
    id: 'boschloo-1970',
    title: 'Raised Conditional Level of Significance for the 2×2 Table when Testing the Equality of Two Probabilities',
    authors: 'Boschloo, R.D.',
    year: 1970,
    venue: 'Statistica Neerlandica, 24(1)',
    summary:
      'El test incondicional que ordena las tablas 2×2 por el valor p de Fisher y maximiza sobre el parámetro de estorbo; uniformemente más potente que Fisher bajo el modelo de dos binomiales. En el caso Perondi (7/34 vs. 1/34) da p = 0.0385 frente a 0.0542 de Fisher.',
  },
  {
    id: 'barnard-1945',
    title: 'A New Test for 2×2 Tables',
    authors: 'Barnard, G.A.',
    year: 1945,
    venue: 'Nature, 156',
    summary:
      'El origen de los tests incondicionales: Barnard propuso rechazar el condicionamiento de Fisher y maximizar el valor p sobre el parámetro común; el test CSM (convexity, symmetry, minimization) es su versión computable. Fisher replicó que los márgenes son ancillaries y condicionar es lo riguroso; la disputa sigue abierta.',
  },
  {
    id: 'berger-boos-1994',
    title: 'P Values Maximized over a Confidence Set for the Nuisance Parameter',
    authors: 'Berger, R.L.; Boos, D.D.',
    year: 1994,
    venue: 'Journal of the American Statistical Association, 89(427)',
    summary:
      'Ajuste del test incondicional: en lugar de maximizar el valor p sobre todo el rango del parámetro de estorbo, se maximiza sobre un intervalo de confianza del parámetro y se suma γ al resultado. Exacto con penalización controlada; puede ser más liberal que Boschloo sin violar α.',
  },
  {
    id: 'mehrotra-2003',
    title: 'A Cautionary Note on the Use of Exact 2×2 Tests in Clinical Trials',
    authors: 'Mehrotra, D.V.; Chan, I.S.F.; Berger, R.L.',
    year: 2003,
    venue: 'Biometrics, 59(2)',
    summary:
      'Revisión crítica de la batería de tests exactos: Fisher, mid-p, Boschloo, Barnard, Berger-Boos. Documenta que mid-p puede exceder el tamaño nominal (no es estrictamente válido), que Fisher desperdicia α, y que la elección del procedimiento debe declararse a priori, no escogerse por conveniencia del resultado.',
  },
  {
    id: 'hoenig-heisey-2001',
    title: 'The Abuse of Power: The Pervasive Fallacy of Power Calculations for Data Analysis',
    authors: 'Hoenig, J.M.; Heisey, D.M.',
    year: 2001,
    venue: 'The American Statistician, 55(1)',
    summary:
      'La falacia de la potencia observada: usar el efecto estimado como verdadero para recalcular potencia post hoc reproduce una transformación del valor p ya reportado y no aporta información nueva. La potencia es una propiedad del diseño y del escenario, no del resultado.',
  },
  {
    id: 'halpern-2002',
    title: 'Empirical Evidence that Ethics Review Board Approval is not Enough',
    authors: 'Halpern, S.D.; Karlawish, J.H.T.; Berlin, J.A.',
    year: 2002,
    venue: 'Annals of Internal Medicine / JAMA (ética de ensayos clínicos)',
    summary:
      'Argumento ético central del módulo de calibración: un ensayo subpotenciado somete participantes a riesgo sin probabilidad razonable de responder la pregunta; la aprobación del comité no sustituye la potencia. Complementado por Zarin et al. (2019) sobre desperdicio en investigación clínica.',
  },
  {
    id: 'ohagan-2005',
    title: 'Assurance: A Bayesian Approach to Sample Size Determination',
    authors: "O'Hagan, A.; Stevens, J.W.; Campbell, M.J.",
    year: 2005,
    venue: 'Statistics in Medicine, 24(3)',
    summary:
      'Assurance o potencia predictiva: en lugar de calcular potencia en un punto (p1, p2), se promedia sobre la distribución a priori del efecto. Un estudio con 80% de potencia en el escenario optimista puede tener assurance del 60%; es la cifra honesta para decidir si el estudio se justifica.',
  },
  {
    id: 'brown-cai-dasgupta-2001',
    title: 'Interval Estimation for a Binomial Proportion',
    authors: 'Brown, L.D.; Cai, T.T.; DasGupta, A.',
    year: 2001,
    venue: 'Statistical Science, 16(2)',
    summary:
      'El artículo de referencia sobre ICs para una proporción: demuestra que la cobertura de Wald es errática de forma "mucho más persistente de lo que se aprecia", que las prescripciones de los libros de texto son engañosas, y recomienda Wilson, Jeffreys y Agresti–Coull para muestras pequeñas. Fundamento del hilo de precisión del curso.',
  },
  {
    id: 'cepeda-2008',
    title: 'Intervalos de confianza y credibilidad para una proporción',
    authors: 'Cepeda-Cuervo, E.; Núñez-Antón, V.; Córdoba, L.',
    year: 2008,
    venue: 'Revista Colombiana de Estadística, 31(2)',
    summary:
      'Comparativa frecuentista vs. bayesiana de ICs para una proporción, evaluando cobertura esperada, longitud y varianza de la longitud; los métodos con prioris no informativas compiten favorablemente. Referencia local que legitima el enfoque bayesiano en el curso.',
  },
  {
    id: 'rothman-greenland-2018',
    title: 'Planning Study Size Based on Precision Rather Than Power',
    authors: 'Rothman, K.J.; Greenland, S.',
    year: 2018,
    venue: 'Epidemiology, 29(5)',
    summary:
      'Manifiesto por dimensionar estudios según la precisión del estimando (ancho del IC) y no solo por potencia; con fórmulas para las medidas epidemiológicas básicas. El paquete presize de R implementa estos cálculos. Base de la sección "la longitud L como variable aleatoria".',
  },
  {
    id: 'seminario-correa',
    title: 'Seminario de precisión y tamaños muestrales (aplicativo y notas)',
    authors: 'Correa, J.C. (seminario); port a TypeScript con auditoría del código',
    year: 2024,
    venue: 'Material del curso, módulo 5',
    summary:
      'La propuesta que sustenta el hilo de precisión: la longitud del IC es una variable aleatoria con distribución enumerable, no un δ fijo impuesto; dimensionar n exige controlar α (cobertura) y β (garantía P(L ≤ L₀)) simultáneamente. La fórmula original del documento —que sumaba z_β a z_α confundiendo L con la semiamplitud— se conserva en el código solo como contraejemplo pedagógico, corregida por enumeración exacta.',
  },
  {
    id: 'R-epiR',
    title: 'epiR: Tools for the Analysis of Epidemiological Data (R package)',
    authors: 'Stevenson, M. et al.',
    year: 2024,
    venue: 'CRAN',
    summary:
      'Paquete de R con epi.2by2: calcula RR, OR, tasas de incidencia, riesgo atribuible y fracciones atribuibles con ICs a partir de una tabla 2×2; el caballo de batalla del módulo de medidas.',
  },
  {
    id: 'R-survival',
    title: 'survival: Survival Analysis (R package)',
    authors: 'Therneau, T.',
    year: 2024,
    venue: 'CRAN',
    summary:
      'El paquete base de supervivencia en R: Surv, survfit (Kaplan-Meier con ICs), survdiff (log-rank), coxph (riesgos proporcionales) y clogit (logística condicional para datos pareados). Núcleo de los módulos de cohortes, supervivencia y datos pareados (11–15).',
  },
];

/** Converts the bibliography into retrievable BM25 documents. */
export function bibliographyToDocs(): RagDoc[] {
  return BIBLIOGRAPHY.map((b) => ({
    id: `bib:${b.id}`,
    source: 'bibliography',
    text: `${b.title}. ${b.authors} (${b.year}). ${b.venue}. ${b.summary}`,
    meta: {
      title: b.title,
      authors: b.authors,
      year: b.year,
      venue: b.venue,
      ...(b.doi ? { doi: b.doi } : {}),
      ...(b.isbn ? { isbn: b.isbn } : {}),
    },
  }));
}
