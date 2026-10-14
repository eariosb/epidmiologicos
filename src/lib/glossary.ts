/**
 * Glosario del curso: siglas, símbolos y conceptos, en la forma expandida
 * en español y, cuando el uso internacional lo exige, el original en
 * inglés. Textos cortos de una línea; el tooltip quiere refrescar la
 * memoria, no dar una lección.
 *
 * Fuente única de verdad: `GLOSSARY_SECTIONS` alimenta tanto el tooltip de
 * `<Term k="...">` (vía el mapa plano `GLOSSARY`) como la página /glosario
 * del final del curso — una entrada nueva queda disponible en ambos.
 */

export interface GlossarySection {
  titulo: string;
  /** Entradas ordenadas: clave usada en `<Term k>` → definición breve. */
  entradas: Record<string, string>;
}

export const GLOSSARY_SECTIONS: GlossarySection[] = [
  {
    titulo: 'Medidas de asociación e impacto',
    entradas: {
      RR: 'Riesgo relativo (relative risk, risk ratio): la razón entre el riesgo en expuestos y en no expuestos; solo calculable en diseños que observan incidencia.',
      OR: 'Razón de odds (odds ratio): la razón de odds de exposición en casos vs. controles; aproxima al RR cuando la enfermedad es rara.',
      RD: 'Riesgo diferencial o diferencia de riesgos (risk difference): R_exp − R_nexp; el exceso absoluto atribuible a la exposición.',
      ARR: 'Reducción absoluta de riesgo (absolute risk reduction): riesgo_control − riesgo_tratamiento; positiva es beneficio, negativa es daño. Convención del curso.',
      PRA: 'Porcentaje de riesgo atribuible entre expuestos (attributable risk percent): (RR−1)/RR; la fracción del riesgo del expuesto debida a la exposición.',
      PRAP: 'Porcentaje de riesgo atribuible poblacional (population attributable risk percent): el peso de la exposición en el riesgo total de la población; mezcla fuerza de asociación y prevalencia de exposición.',
      NNT: 'Número necesario a tratar (number needed to treat): 1/RD; cuántos pacientes hay que tratar para evitar un evento; la traducción clínica del riesgo diferencial.',
      NNH: 'Número necesario para dañar (number needed to harm): 1/|RD| cuando la exposición aumenta el riesgo; el NNT del daño.',
      HR: 'Razón de riesgos instantáneos (hazard ratio): el multiplicador del hazard que estima el modelo de Cox; e^β con una covariable binaria.',
      SMR: 'Razón de mortalidad estandarizada (standardized mortality ratio): muertes observadas / esperadas bajo tasas de referencia; la estandarización indirecta de una cohorte.',
      SRM: 'Synonym anglosajón de SMR: standardized mortality/morbidity ratio.',
      IRR: 'Razón de tasas de incidencia (incidence rate ratio): razón de tasas por persona-tiempo; la medida del módulo 13 cuando el seguimiento es variable.',
      RERI: 'Exceso relativo de riesgo por interacción (relative excess risk due to interaction): RR₁₁ − RR₁₀ − RR₀₁ + 1; mide la interacción en la escala aditiva, la relevante para salud pública.',
      AP: 'Proporción atribuible a la interacción (attributable proportion): RERI/RR₁₁; la fracción del riesgo de los doblemente expuestos que se debe a la combinación de exposiciones.',
      LR: 'Razón de verosimilitud (likelihood ratio): cuánto multiplica un resultado la probabilidad de la hipótesis. LR+ = Se/(1−Sp) y LR− = (1−Se)/Sp en pruebas diagnósticas.',
    },
  },
  {
    titulo: 'Pruebas diagnósticas y discriminación',
    entradas: {
      Se: 'Sensibilidad (sensitivity): P(test+ | enfermo); la capacidad del test de detectar a quien tiene la enfermedad.',
      Sp: 'Especificidad (specificity): P(test− | sano); la capacidad del test de no alarmar a quien está sano.',
      VPP: 'Valor predictivo positivo (positive predictive value): P(enfermedad | test positivo); depende de la prevalencia; cae cuando el test se aplica a poblaciones raras.',
      VPN: 'Valor predictivo negativo (negative predictive value): P(sano | test negativo); sube cuando la prevalencia es baja.',
      ROC: 'Curva ROC (receiver operating characteristic): sensibilidad vs. 1−especificidad sobre todos los umbrales; el AUC resume la discriminación.',
      AUC: 'Área bajo la curva ROC: probabilidad de que un caso aleatorio supere en score a un control; 0.5 es azar, 1 es perfecto.',
    },
  },
  {
    titulo: 'Diseños de estudio',
    entradas: {
      EC: 'Ensayo clínico (clinical trial): estudio experimental con asignación controlada; la cima del árbol de diseños.',
      ECA: 'Ensayo clínico aleatorizado (randomized controlled trial, RCT): el estándar de oro; la aleatorización equilibra confusores conocidos y desconocidos.',
      RCT: 'Randomized controlled trial; el ECA en sigla internacional.',
      CCC: 'Estudio de casos y controles (case-control study): compara exposición pasada entre casos y controles; retrospectivo; estima OR, nunca el riesgo directamente.',
      CCT: 'Estudio de corte transversal (cross-sectional): una fotografía; prevalencia, no incidencia ni causalidad temporal.',
      ITT: 'Intention to treat: en un ECA se analiza según la asignación, no según lo recibido; protege la aleatorización.',
      pareamiento:
        'Matching: emparejar cada caso con controles del mismo nivel del confusor; controla la confusión en el diseño, no en el análisis.',
      ensayo_objetivo:
        'Emulación del ensayo objetivo (target trial emulation, Hernán & Robins 2016): especificar primero el ensayo ideal (elegibilidad, estrategias, asignación, tiempo cero, seguimiento, desenlace, contraste) y emular cada componente con los datos observacionales disponibles.',
      usuarios_nuevos:
        'Diseño de usuarios nuevos (new-user design, Ray 2003): incluir solo quienes inician la exposición durante el estudio; los usuarios prevalentes son sobrevivientes de la exposición temprana y sesgan la comparación.',
      caso_cohorte:
        'Diseño caso-cohorte (Prentice 1986): todos los casos de una cohorte más una submuestra aleatoria de toda la cohorte como controles; la subcohorte sirve para varios desenlaces y estima la razón de tasas.',
      muestreo_densidad:
        'Muestreo por densidad de incidencia: seleccionar controles en el momento en que aparece cada caso, entre quienes siguen en riesgo; el OR estima la razón de tasas, no solo aproxima el RR.',
      sobrepareamiento:
        'Sobrepareamiento (overmatching): parear por una variable que no es confusora (correlato de la exposición o mediador); fabrica concordancias sin información y pierde eficiencia, o bloquea parte del efecto.',
      razon_prevalencias:
        'Razón de prevalencias (prevalence ratio): P(E) / P(no E) en un corte transversal; con desenlace frecuente es más honesta que el OR de prevalencia, que siempre exagera.',
      tiempo_inmortal:
        'Tiempo inmortal: periodo de seguimiento en que el sujeto no podía tener el desenlace por definición del diseño (p. ej., el tiempo que tardó en recibir el tratamiento); atribuirlo al grupo expuesto lo beneficia artificialmente. Nace de un tiempo cero mal definido (Suissa).',
      censura:
        'Censura a derecha: se sabe que el evento no ocurrió hasta el último contacto. Aporta al denominador de riesgo hasta ese momento.',
      censura_informativa:
        'Censura informativa: pérdidas de seguimiento relacionadas con el riesgo del desenlace (los más enfermos se pierden más); viola el supuesto de censura no informativa del log-rank y de Cox.',
    },
  },
  {
    titulo: 'Confusión, sesgos y ajuste causal',
    entradas: {
      DAG: 'Grafo acíclico dirigido (directed acyclic graph): el mapa causal de flechas entre variables; decide qué ajustar (confusores), qué no (mediadores, colisionadores).',
      colisionador:
        'Colisionador: variable causada por dos otras (E → H ← D). Estratificar o muestrear condicionado a ella abre un camino no causal entre sus causas y sesga la asociación.',
      Berkson:
        'Sesgo de Berkson (1946): la selección de controles hospitalarios distorsiona la asociación; las enfermedades compiten por la hospitalización.',
      sesgo_berkson:
        'Sesgo de Berkson (1946): tomar casos y controles entre hospitalizados (o asistentes a un servicio) cuando el ingreso depende tanto del desenlace como de la exposición; condicionar sobre el colisionador fabrica o invierte asociaciones.',
      Neyman:
        'Sesgo de Neyman o de prevalencia-incidencia: los casos prevalentes sobre-representan enfermedad de curso largo; el sobreviviente no es típico.',
      Recall:
        'Sesgo de recuerdo (recall bias): los casos recuerdan la exposición con más detalle que los controles; diferencial por diseño retrospectivo.',
      mala_clasificacion:
        'Mala clasificación (misclassification): exposición o desenlace medidos con error. No diferencial (igual en los grupos) suele atenuar hacia 1; diferencial (peor recuerdo en casos) puede inflar o invertir el OR.',
      cornfield:
        'Condiciones de Cornfield (1959): para que un confusor no medido explique toda una asociación, debe estar asociado con la exposición y con el desenlace al menos tan fuerte como el RR observado. Nació del debate tabaco–cáncer de Doll y Hill.',
      evalue:
        'E-value (VanderWeele & Ding, 2017): qué tan fuerte tendría que ser un confusor no medido —asociado con exposición y desenlace— para anular por completo el RR observado. E = RR + √(RR(RR−1)).',
      PS: 'Propensity score (Rosenbaum & Rubin 1983): la probabilidad de recibir la exposición dados los confusores observados, P(E=1|C); resume el vector de confusores en un número.',
      IPTW: 'Ponderación por el inverso de la probabilidad de tratamiento (inverse probability of treatment weighting): pesar cada sujeto por 1/PS crea una pseudopoblación sin confusión medida; estima el efecto marginal.',
    },
  },
  {
    titulo: 'Métodos de estratificación y contraste',
    entradas: {
      MH: 'Mantel–Haenszel (1959): el estimador y test estratificado que resume tablas 2×2×K pesando por el inverso de la varianza; controla un confusor categórico.',
      CMH: 'Cochran–Mantel–Haenszel: la familia de tests que incluye al MH clásico; en pareamiento 1:1 equivale exactamente a McNemar.',
      BD: 'Breslow–Day (1980): el test de homogeneidad de odds ratios entre estratos; si los OR difieren hay interacción y no debe resumirse.',
      McNemar:
        'Test de McNemar (1947): la prueba χ² para datos pareados; solo cuentan los pares discordantes (b, c).',
      'χ²': 'Chi-cuadrado de Pearson: la prueba de independencia en tablas de contingencia; (O−E)²/E sumado sobre las celdas.',
      'log-rank':
        'Log-rank: la prueba de comparación de curvas de supervivencia; acumula (observado − esperado) por grupo en cada tiempo de evento.',
      KM: 'Kaplan–Meier (1958): el estimador escalonado de la función de supervivencia con censura a derecha; cada escalón cae en un tiempo de evento.',
      Cox: 'Modelo de Cox (1972) o de riesgos proporcionales: h(t|x) = h₀(t)·e^{βx}; regresión de supervivencia sin suponer la forma del riesgo basal.',
      clogit:
        'Regresión logística condicional: la generalización del análisis pareado a covariables continuas; el OR se estima dentro de cada estrato de matching.',
      TOST: 'Two one-sided tests (Schuirmann 1987): la prueba de equivalencia — declara como nula una diferencia relevante |θ| ≥ Δ y la rechaza con dos tests unilaterales; es el instrumento cuando lo que se quiere demostrar es similitud (no inferioridad, bioequivalencia).',
      Byar: 'Aproximación de Byar al IC exacto de una tasa o SMR: cuantiles de la chi-cuadrado sobre el conteo observado; casi idéntica al Poisson exacto para conteos no muy pequeños.',
    },
  },
  {
    titulo: 'Inferencia y error',
    entradas: {
      IC: 'Intervalo de confianza (CI, confidence interval): el rango compatible con los datos; precede al valor p en la jerarquía de interpretación.',
      EE: 'Error estándar (standard error, SE): la desviación estándar del estimador; mide precisión, no dispersión.',
      p: 'Valor p (p-value): probabilidad de un resultado al menos tan extremo que el observado, bajo H₀; depende tanto del tamaño del efecto como de n — un efecto trivial puede ser «significativo» con n enorme y uno grande puede no serlo con n chico; Woodward: estimar antes que contrastar.',
      H0: 'Hipótesis nula: la ausencia de asociación o efecto que el test pone a prueba.',
      error_tipo_i:
        'Error tipo I: rechazar una H₀ verdadera (falso positivo). Su tasa nominal es α; la tasa real puede diferir de la declarada — es la significancia real del test.',
      error_tipo_ii:
        'Error tipo II: no rechazar una H₀ falsa (falso negativo). Su tasa es β; la potencia = 1 − β mide la probabilidad de detectar el efecto si existe.',
      potencia:
        'Potencia (1 − β): probabilidad de que el test rechace H₀ cuando la alternativa es cierta; depende del tamaño del efecto, de n y de α. La potencia empírica la cuenta una simulación.',
      EMV: 'Estimador de máxima verosimilitud (maximum likelihood estimator): el valor del parámetro que hace los datos observados más probables; base de glm, coxph y la mayoría de tests asintóticos.',
      ECM: 'Error cuadrático medio (mean squared error): varianza + sesgo²; el criterio que compara estimadores cuando la corrección de ceros introduce sesgo a cambio de finitud.',
      Wald: 'Método de Wald: estimador ± z·EE, y el test asociado; el estándar por defecto de todo software y el que falla primero con muestras chicas.',
    },
  },
  {
    titulo: 'Inferencia exacta y calibración (módulo 6)',
    entradas: {
      fisher:
        'Prueba exacta de Fisher (1935): valor p condicionado en ambos márgenes de la tabla 2×2; exacto bajo el modelo hipergeométrico, conservador si el diseño solo fija los tamaños de grupo.',
      boschloo:
        'Test incondicional de Boschloo (1970): ordena las tablas por el valor p de Fisher y maximiza el p sobre el parámetro de estorbo; uniformemente más potente que Fisher bajo el modelo de dos binomiales.',
      'mid-p':
        'Mid-p: el valor p de Fisher menos la mitad de la masa de probabilidad empatada con la tabla observada (todas las tablas con su misma probabilidad hipergeométrica); menos conservador, pero su tamaño puede exceder α nominal.',
      'berger-boos':
        'Ajuste de Berger y Boos (1994): maximiza el valor p incondicional solo sobre un intervalo de confianza del parámetro de estorbo y suma γ; exacto con penalización controlada.',
      csm: 'Test CSM (constrained–Barnard): minimiza el tamaño máximo del test sobre el parámetro de estorbo; el más potente de la familia incondicional, costoso de computar.',
      assurance:
        'Assurance o potencia predictiva (O’Hagan et al., 2005): promedio de la potencia condicional sobre la distribución a priori del efecto; la probabilidad honesta de éxito del estudio.',
      calibracion:
        'Calibración: verificar que un procedimiento hace lo que promete (tamaño real vs. α nominal, cobertura real vs. nominal); se mide por enumeración o simulación, no se supone.',
      cobertura:
        'Cobertura de un IC: probabilidad real de que el procedimiento capture el parámetro verdadero; puede ser inferior al nominal (anti-conservador) o superior (conservador con ICs largos).',
      'correccion-aditiva':
        'Corrección aditiva (Haldane, c = 1/2): suma c a cada celda para evitar OR infinito con ceros; compra finitud a costa de sesgo; el ECM mínimo suele estar cerca de c = 0.5.',
      'cero-muestral':
        'Cero muestral: celda en cero de un evento que existe pero no se observó en n sujetos; problema de información (EMV del OR diverge), no de diseño.',
      'cero-estructural':
        'Cero estructural: celda imposible por diseño (p. ej., contraindicación absoluta); no pertenece al espacio muestral y ninguna corrección estadística lo repara.',
      'potencia-observada':
        'Potencia observada (post hoc): usar el efecto estimado como verdadero y recalcular potencia; es una transformación del valor p ya reportado y no aporta información (Hoenig y Heisey, 2001).',
      'ic-wilson':
        'Intervalo de Wilson (score, 1927): invierte el test de score; siempre dentro de [0,1] y con cobertura cercana al nominal para casi todo p; la recomendación de Brown et al. (2001) para muestras pequeñas.',
      'ic-jeffreys':
        'Intervalo de Jeffreys: credibilidad de colas iguales de la posterior Beta(x + 1/2, n − x + 1/2) con prior no informativa; casi tan bueno como Wilson y con interpretación bayesiana transparente.',
      'ic-clopper':
        'Intervalo de Clopper–Pearson (1934): el "exacto" de los libros; garantiza cobertura ≥ nominal invirtiendo la binomial, al precio de ser conservador de más.',
      'ic-verosimilitud':
        'Intervalo de verosimilitud: todos los p con 2(ℓ(p̂) − ℓ(p)) ≤ χ²₁; respeta la asimetría natural de la verosimilitud y compite con Wilson en cobertura (Sprott; Kalbfleisch).',
      'ic-wald':
        'Intervalo de Wald para una proporción: p̂ ± z·√(p̂q̂/n). Cobertura errática y persistente (Brown et al., 2001), límites inadmisibles fuera de [0,1] y colapso a punto cuando p̂ = 0 o 1.',
      'garantia-precision':
        'Garantía de precisión 1 − β: probabilidad de que la longitud observada del IC no exceda el máximo tolerado L₀; dimensionar n exige controlar α (cobertura) y β (longitud) simultáneamente.',
    },
  },
  {
    titulo: 'Síntesis, incertidumbre y aprendizaje automático',
    entradas: {
      metaanalisis:
        'Meta-análisis: la síntesis cuantitativa que pondera estudios por precisión (pesos 1/v fijo, 1/(v+τ²) aleatorio); la causalidad acumulativa hecha estadística.',
      I2: 'I² (I-cuadrado): porcentaje de la variación entre estudios de un meta-análisis debida a heterogeneidad real, no al azar; (Q−gl)/Q.',
      DL: 'DerSimonian–Laird (1986): el estimador clásico de τ² (heterogeneidad entre estudios) por método de momentos; simple y transparente, pero subestima τ² con pocos estudios.',
      UQ: 'Cuantificación de incertidumbre (uncertainty quantification): distinguir incertidumbre aleatoria (irreducible) de epistémica (reductible con datos/modelo).',
      CP: 'Predicción conforme (conformal prediction): intervalos de predicción con cobertura garantizada sin suponer la distribución; la alternativa distribution-free al IC.',
      CQR: 'Conformalized quantile regression: predicción conforme sobre cuantiles; bandas con cobertura garantizada que se adaptan a la heterocedasticidad.',
      PIT: 'Probability integral transform: histograma de los valores predictivos acumulados; uniforme indica modelo bien calibrado; herramienta de diagnóstico en UQ.',
      ML: 'Machine learning: aprendizaje automático; en el módulo 17 como herramienta de vigilancia, no como oráculo.',
    },
  },
  {
    titulo: 'Exploración y calidad del dato',
    entradas: {
      unidad_analisis:
        'Unidad de análisis: el nivel al que se cuenta cada observación (persona, pareja, conjunto pareado, persona-semana); lo define el diseño y cambia todas las cifras que siguen.',
      faltante_estructural:
        'Faltante estructural: celda vacía porque la información no existía o no se podía recoger (no por azar ni omisión); tratarla como NA ordinario distorsiona completitud y medias.',
      MCAR: 'Missing completely at random: los faltantes no dependen de nada; los casos completos solo pierden precisión, no sesgan.',
      MAR: 'Missing at random: los faltantes dependen de variables observadas; recuperable con modelos o imputación que usen esas variables.',
      MNAR: 'Missing not at random: los faltantes dependen del propio valor perdido (el enfermo grave no responde); el sesgo no se corrige sin supuestos externos.',
      imputacion_multiple:
        'Imputación múltiple (Rubin): m bases imputadas, el mismo análisis en cada una, combinación con las reglas de Rubin; propaga la incertidumbre de imputar. Bajo MAR, con el desenlace en el modelo de imputación.',
      preferencia_digito:
        'Preferencia de dígito (digit preference): acumulación de mediciones en valores redondos (…0, …5) que revela redondeo o medición grosera en la fuente.',
      MAD: 'Desviación absoluta mediana (median absolute deviation): mediana de |x − mediana|; medida de dispersión robusta que los atípicos no inflan.',
      ECDF: 'Función de distribución empírica (empirical cumulative distribution function): la proporción acumulada de datos ≤ x; muestra toda la distribución sin elegir bins.',
      sobredispersion:
        'Sobredispersión: varianza mayor que la que el modelo supone (p. ej. var > media bajo Poisson); los errores estándar del modelo quedan cortos si no se ajusta.',
      curva_epidemica:
        'Curva epidémica: histograma de casos por fecha de inicio; su forma sugiere el tipo de fuente (puntual, continua, propagativa) y el ancho de barra cambia lo que se ve.',
      retraso_notificacion:
        'Retraso de notificación (reporting delay): tiempo entre el caso real y su registro; hace que las últimas barras de la curva epidémica siempre estén incompletas.',
      eventos_por_variable:
        'Eventos por variable (EPV, Peduzzi 1996): cuántos eventos hay por parámetro del modelo; con pocos eventos por variable la estimación se sesga y la regresión de Firth o menos covariables preespecificadas ayudan.',
      EPV: 'Eventos por variable: sigla del criterio de Peduzzi — ver «eventos por variable».',
    },
  },
  {
    titulo: 'Contexto institucional y fuentes de datos',
    entradas: {
      SIVIGILA:
        'Sistema Nacional de Vigilancia en Salud Pública de Colombia: la red de notificación de eventos de interés en salud pública operada por el INS; alimenta el Boletín Epidemiológico Semanal.',
      INS: 'Instituto Nacional de Salud de Colombia: produce el Boletín Epidemiológico Semanal (BES) y opera la vigilancia nacional.',
      RIPS: 'Registros Individuales de Prestación de Servicios de Salud: la fuente administrativa colombiana de atenciones; registra lo facturado, no necesariamente lo ocurrido.',
      DANE: 'Departamento Administrativo Nacional de Estadística: censo, encuestas nacionales y estadísticas vitales de Colombia; fuente de los denominadores poblacionales.',
      SINAN:
        'Sistema de Información de Agravios de Notificación (Brasil): la vigilancia epidemiológica nacional; dengue y otros agravios de notificación obligatoria.',
      STROBE:
        'STROBE (2007): la lista de verificación del reporte de estudios observacionales (cohorte, casos y controles, transversal); RECORD es su extensión para datos recolectados de rutina.',
      FAIR: 'Principios FAIR (Wilkinson et al. 2016): datos encontrables, accesibles, interoperables y reutilizables; el estándar de gestión de datos del módulo 18.',
      ETS: 'Enfermedad de transmisión sexual.',
      SIDA: 'Síndrome de inmunodeficiencia adquirida (AIDS).',
      VIH: 'Virus de inmunodeficiencia humana (HIV).',
      BCG: 'Bacilo de Calmette-Guérin: la vacuna contra la tuberculosis; el caso de matching 1:1 del curso compara niños vacunados vs. no vacunados.',
      R0: 'Número reproductivo básico: casos secundarios medios por caso en población susceptible; R₀ > 1 implica crecimiento epidémico.',
    },
  },
  {
    titulo: 'Datasets y herramientas del curso',
    entradas: {
      SHHS: 'Sleep Heart Health Study: la cohorte multicéntrica que Woodward usa como dataset guía; sueño, tabaquismo y eventos cardiovasculares.',
      RECID: 'Datos de recidivismo (Allison): semanas hasta re-arresto de 432 exconvictos; censura a derecha, covariables de empleo semanal.',
      VALUNG:
        'Dataset de cáncer de pulmón del Veterans Administration: dos terapias, tipo celular, Karnofsky; el ejemplo de log-rank del curso.',
      DDIMER:
        'Dataset de dímero D y embolia: sets caso-control 1:c con matching variable; el ejemplo de McNemar generalizado incompleto.',
      CMHtest:
        'Función de vcdExtra: la familia de tests Cochran–Mantel–Haenszel por estratos; incluye el test de confusión.',
      epiR: 'Paquete de R para epidemiología: epi.2by2 calcula RR, OR, tasas y riesgos atribuibles con ICs desde una tabla 2×2.',
    },
  },
  {
    titulo: 'Historia y figuras',
    entradas: {
      Snow: 'John Snow (1813–1858): el médico que mapeó el cólera de Broad Street (1854) y retiró la bomba; la primera inferencia causal por diseño observacional.',
      Tuskegee:
        'Estudio de Tuskegee (1932–1972): 399 aparceros afroamericanos con sífilis no tratados aun tras la penicilina; el caso que produjo el Informe Belmont y el consentimiento informado moderno.',
      'Bradford Hill':
        'Austin Bradford Hill (1965): los siete principios de causalidad (fuerza, temporalidad, plausibilidad, replicación, reversibilidad, dosis-respuesta y ausencia de alternativa); criterios de acumulación, no un checklist.',
      'Doll-Hill':
        'Richard Doll y Austin Bradford Hill: el estudio de cohortes de médicos británicos (1951–1964) que estableció tabaquismo → cáncer de pulmón; el arquetipo de cohorte prospectiva.',
      'Mantel–Haenszel':
        'Estimador estratificado de Mantel y Haenszel (1959): resume tablas 2×2×K con pesos inversos a la varianza; el estándar para controlar un confusor categórico.',
      'izbicki-uq':
        'Rafael Izbicki, "Machine Learning Beyond Point Predictions": cuantificación de incertidumbre y predicción conforme; cobertura garantizada sin supuestos distribucionales.',
      Tukey:
        'John W. Tukey, "The Future of Data Analysis" (1962): el análisis de datos como ciencia propia; la pregunta precede a la técnica.',
    },
  },
];

/** Mapa plano clave → definición, derivado de las secciones. */
export const GLOSSARY: Record<string, string> = Object.fromEntries(
  GLOSSARY_SECTIONS.flatMap((s) => Object.entries(s.entradas)),
);

/** Conteo de entradas, para titulares. */
export const GLOSSARY_SIZE = Object.keys(GLOSSARY).length;

/**
 * Ancla estable de una entrada en /glosario: la clave con espacios como
 * guiones ('Bradford Hill' → 'Bradford-Hill'). La usa <Term> para el href
 * y la página del glosario para el id — una sola convención.
 */
export function glossaryAnchor(k: string): string {
  return k.trim().replace(/\s+/g, '-');
}
