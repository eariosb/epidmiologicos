/**
 * Glosario del curso: siglas, símbolos y conceptos, en la forma expandida
 * en español y, cuando el uso internacional lo exige, el original en
 * inglés. Textos cortos de una línea; el tooltip quiere refrescar la
 * memoria, no dar una lección.
 *
 * Fuente única de verdad: `GLOSSARY_SECTIONS` alimenta tanto el tooltip de
 * `<Term k="...">` (vía el mapa plano `GLOSSARY`) como la página /glosario
 * del final del curso: una entrada nueva queda disponible en ambos.
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
      odds: 'Odds (razón de apuestas): la parte contra el resto, p/(1−p) = f/(N−f); va de 0 a ∞ y coincide con el riesgo cuando el evento es raro.',
      OR: 'Razón de odds (odds ratio): la razón de odds de exposición en casos vs. controles; aproxima al RR cuando la enfermedad es rara.',
      RD: 'Riesgo diferencial o diferencia de riesgos (risk difference): R_exp − R_nexp; el exceso absoluto atribuible a la exposición.',
      ARR: 'Reducción absoluta de riesgo (absolute risk reduction): riesgo_control − riesgo_tratamiento; positiva es beneficio, negativa es daño. Convención del curso.',
      PRA: 'Porcentaje de riesgo atribuible entre expuestos (attributable risk percent): (RR−1)/RR; la fracción del riesgo del expuesto debida a la exposición.',
      PRAP: 'Porcentaje de riesgo atribuible poblacional (population attributable risk percent): el peso de la exposición en el riesgo total de la población; mezcla fuerza de asociación y prevalencia de exposición.',
      NNT: 'Número necesario a tratar (number needed to treat): 1/RD; cuántos pacientes hay que tratar para evitar un evento; la traducción clínica del riesgo diferencial.',
      NNH: 'Número necesario para dañar (number needed to harm): 1/|RD| cuando la exposición aumenta el riesgo; el NNT del daño.',
      HR: 'Razón de riesgos instantáneos (hazard ratio): el multiplicador del hazard que estima el modelo de Cox; e^β con una covariable binaria.',
      SMR: 'Razón de mortalidad estandarizada (standardized mortality ratio): muertes observadas / esperadas bajo tasas de referencia; la estandarización indirecta de una cohorte.',
      SRM: 'Razón de morbilidad estandarizada (standardized morbidity ratio): el SMR con casos en lugar de muertes.',
      IRR: 'Razón de tasas de incidencia (incidence rate ratio): razón de tasas por persona-tiempo; la medida del módulo 13 cuando el seguimiento es variable.',
      RERI: 'Exceso relativo de riesgo por interacción (relative excess risk due to interaction): RR₁₁ − RR₁₀ − RR₀₁ + 1; mide la interacción en la escala aditiva, la relevante para salud pública.',
      AP: 'Proporción atribuible a la interacción (attributable proportion): RERI/RR₁₁; la fracción del riesgo de los doblemente expuestos que se debe a la combinación de exposiciones.',
      LR: 'Razón de verosimilitud (likelihood ratio): cuánto multiplica un resultado la probabilidad de la hipótesis. LR+ = Se/(1−Sp) y LR− = (1−Se)/Sp en pruebas diagnósticas.',
      SMD: 'Diferencia estandarizada (standardized mean difference): diferencia de medias o proporciones entre grupos dividida por la DE combinada; |SMD| < 0.1 es la regla usual de balance en una Tabla 1 (Austin, 2009).',
      ATE: 'Efecto promedio del tratamiento (average treatment effect): el contraste si toda la población fuera tratada frente a si nadie lo fuera.',
      ATT: 'Efecto promedio en los tratados (average treatment effect on the treated): el mismo contraste restringido a quienes recibieron la exposición; es lo que estima el matching típico.',
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
      'Δ-ROC':
        'Δ en el modelo binormal: distancia entre las medias del score de enfermos y sanos, en desviaciones estándar; fija el AUC = Φ(Δ/√2).',
      κ: 'Kappa de Cohen: acuerdo observado entre dos clasificadores corregido por el acuerdo esperado por azar; depende de la prevalencia.',
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
        'Razón de prevalencias (prevalence ratio): prevalencia del desenlace en expuestos dividida por la de no expuestos, P(D | E) / P(D | no E), en un corte transversal; con desenlace frecuente es más honesta que el OR de prevalencia, que siempre queda más lejos de 1.',
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
        'Sesgo de Berkson (1946): tomar casos y controles entre hospitalizados (o asistentes a un servicio) cuando el ingreso depende tanto del desenlace como de la exposición; condicionar sobre el colisionador fabrica o invierte asociaciones.',
      sesgo_neyman:
        'Sesgo de Neyman o de prevalencia-incidencia: los casos prevalentes sobre-representan enfermedad de curso largo; el sobreviviente no es típico.',
      sesgo_recuerdo:
        'Sesgo de recuerdo (recall bias): los casos recuerdan la exposición con más detalle que los controles; diferencial por diseño retrospectivo.',
      mala_clasificacion:
        'Mala clasificación (misclassification): exposición o desenlace medidos con error. No diferencial (igual en los grupos) suele atenuar hacia 1; diferencial (peor recuerdo en casos) puede inflar o invertir el OR.',
      cornfield:
        'Condiciones de Cornfield (1959): para que un confusor no medido explique toda una asociación, debe estar asociado con la exposición y con el desenlace al menos tan fuerte como el RR observado. Nació del debate tabaco–cáncer de Doll y Hill.',
      evalue:
        'E-value (VanderWeele & Ding, 2017): qué tan fuerte tendría que ser un confusor no medido (asociado con exposición y desenlace) para anular por completo el RR observado. E = RR + √(RR(RR−1)).',
      PS: 'Propensity score (Rosenbaum & Rubin 1983): la probabilidad de recibir la exposición dados los confusores observados, P(E=1|C); resume el vector de confusores en un número.',
      IPTW: 'Ponderación por el inverso de la probabilidad de tratamiento (inverse probability of treatment weighting): pesar cada sujeto por 1/PS crea una pseudopoblación sin confusión medida; estima el efecto marginal.',
      confusion:
        'Confusión: sesgo que distorsiona la asociación cuando una tercera variable se asocia con la exposición y con el desenlace; se elimina estratificando, estandarizando o modelando.',
      colapsabilidad:
        'Colapsabilidad: propiedad de una medida cuyo valor crudo es un promedio ponderado de los de estrato en ausencia de confusión. El RR y la RD la tienen; el OR y el HR no.',
      IV: 'Variable instrumental (instrumental variable): asociada a la exposición, sin causas comunes con el desenlace y sin camino al desenlace salvo por la exposición; identifica el efecto aun con confusión no medida.',
      LATE: 'Efecto local promedio (local average treatment effect): lo que estima una variable instrumental, el efecto en quienes cambian su exposición cuando cambia el instrumento (compliers).',
      MSM: 'Modelo marginal estructural (marginal structural model): modela el desenlace potencial bajo cada régimen de exposición y se ajusta con pesos IPTW; resuelve el confusor que a la vez es efecto de la exposición previa.',
      IPCW: 'Ponderación por el inverso de la probabilidad de censura (inverse probability of censoring weighting): repondera a quienes siguen en observación para representar también a los censurados.',
      DR: 'Estimador doblemente robusto (doubly robust), p. ej. AIPW: combina el modelo del desenlace y el del propensity score; es consistente si al menos uno de los dos está bien especificado.',
      SWIG: 'Grafo de intervención de un solo mundo (single-world intervention graph, Richardson y Robins 2013): el DAG con el nodo de exposición partido en valor observado e intervenido; une grafos y resultados potenciales.',
      ICH: 'International Council for Harmonisation: su guía E9(R1) (2019) define el estimando de un ensayo en cinco atributos (población, tratamiento, desenlace, eventos intercurrentes y resumen).',
      sesgo_seleccion:
        'Sesgo de selección: distorsión que aparece cuando entrar o permanecer en el estudio depende de la exposición y del desenlace; estructuralmente, condicionar sobre un colisionador.',
    },
  },
  {
    titulo: 'Interacción y modificación de efecto',
    entradas: {
      interaccion:
        'Interacción o modificación de efecto: el efecto de una exposición depende del nivel de otra; es un fenómeno causal que se describe, no un sesgo que se elimina.',
      paralelismo:
        'Paralelismo: ausencia de interacción en la escala elegida (efectos iguales entre estratos); cada exposición completa sus causas suficientes por vías independientes.',
      sinergismo:
        'Sinergismo: el efecto conjunto supera lo esperado en la escala elegida; en la aditiva significa componentes compartidos de una misma causa suficiente.',
      antagonismo:
        'Antagonismo: el efecto conjunto queda por debajo de lo esperado; una exposición mitiga o bloquea a la otra. Si invierte el signo es antagonismo cualitativo (cruce).',
      unilateralismo:
        'Unilateralismo: una exposición no tiene efecto por sí sola pero es necesaria para el efecto de la otra (componente necesario de una causa suficiente); no depende de la escala.',
      Simpson:
        'Paradoja de Simpson: la asociación marginal se invierte o desaparece al estratificar. No es un error de cálculo sino la prueba de que el marginal y el condicional responden preguntas distintas.',
    },
  },
  {
    titulo: 'Métodos de estratificación y contraste',
    entradas: {
      MH: 'Mantel–Haenszel (1959): el estimador y test estratificado que resume tablas 2×2×K con pesos bₖcₖ/nₖ (no por inverso de la varianza); controla un confusor categórico y funciona con estratos pequeños.',
      estandarizacion:
        'Estandarización: ajuste que pondera las medidas de cada estrato con una población estándar común; con OR difiere del MH por la no colapsabilidad.',
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
      TOST: 'Two one-sided tests (Schuirmann 1987): la prueba de equivalencia: declara como nula una diferencia relevante |θ| ≥ Δ y la rechaza con dos tests unilaterales; es el instrumento cuando lo que se quiere demostrar es similitud (no inferioridad, bioequivalencia).',
      Byar: 'Aproximación de Byar al IC exacto de una tasa o SMR: cuantiles de la chi-cuadrado sobre el conteo observado; casi idéntica al Poisson exacto para conteos no muy pequeños.',
      BDT: 'Breslow–Day con la corrección de Tarone: la versión del test de homogeneidad de OR que reporta PROC FREQ con la opción BDT.',
    },
  },
  {
    titulo: 'Inferencia y error',
    entradas: {
      IC: 'Intervalo de confianza (CI, confidence interval): el rango compatible con los datos; precede al valor p en la jerarquía de interpretación.',
      EE: 'Error estándar (standard error, SE): la desviación estándar del estimador; mide precisión, no dispersión.',
      DE: 'Desviación estándar (SD): la dispersión de los datos alrededor de su media; no confundir con el EE, que mide la precisión de un estimador.',
      p: 'Valor p (p-value): probabilidad de un resultado al menos tan extremo que el observado, bajo H₀; depende tanto del tamaño del efecto como de n: un efecto trivial puede ser «significativo» con n enorme y uno grande puede no serlo con n chico; Woodward: estimar antes que contrastar.',
      H0: 'Hipótesis nula: la ausencia de asociación o efecto que el test pone a prueba.',
      error_tipo_i:
        'Error tipo I: rechazar una H₀ verdadera (falso positivo). Su tasa nominal es α; la tasa real puede diferir de la declarada; es la significancia real del test.',
      error_tipo_ii:
        'Error tipo II: no rechazar una H₀ falsa (falso negativo). Su tasa es β; la potencia = 1 − β mide la probabilidad de detectar el efecto si existe.',
      potencia:
        'Potencia (1 − β): probabilidad de que el test rechace H₀ cuando la alternativa es cierta; depende del tamaño del efecto, de n y de α. La potencia empírica la cuenta una simulación.',
      EMV: 'Estimador de máxima verosimilitud (maximum likelihood estimator): el valor del parámetro que hace los datos observados más probables; base de glm, coxph y la mayoría de tests asintóticos.',
      ECM: 'Error cuadrático medio (mean squared error): varianza + sesgo²; el criterio que compara estimadores cuando la corrección de ceros introduce sesgo a cambio de finitud.',
      Wald: 'Método de Wald: estimador ± z·EE, y el test asociado; el estándar por defecto de todo software y el que falla primero con muestras chicas.',
      'α':
        'Nivel de significación: la probabilidad de error tipo I que se tolera, fijada antes de ver los datos; en un IC, 1 − α es la confianza nominal.',
      Poisson:
        'Distribución de Poisson: conteos de eventos independientes en un tiempo o espacio dado; media = varianza = λ. Base de tasas, SMR y regresión de conteos.',
      TCL:
        'Teorema central del límite: la media (o suma) estandarizada tiende a la normal al crecer n; la velocidad depende de la asimetría, y con proporciones extremas la aproximación falla.',
      LRT:
        'Test de razón de verosimilitudes (likelihood ratio test): compara la log-verosimilitud de dos modelos anidados; 2·Δlog L ~ χ² con gl = parámetros de diferencia.',
      GLM:
        'Modelo lineal generalizado (generalized linear model): respuesta de la familia exponencial con función de enlace; la logística y la Poisson son sus casos del curso.',
      GEE:
        'Ecuaciones de estimación generalizadas (generalized estimating equations): GLM para datos correlacionados (medidas repetidas, conglomerados) con varianza robusta.',
      MCMC:
        'Monte Carlo por cadenas de Markov: algoritmos que muestrean la posterior bayesiana cuando no tiene forma cerrada.',
      'Δ-equivalencia':
        'Δ: margen de equivalencia o no inferioridad; la diferencia máxima que se declara clínicamente irrelevante, fijada antes del estudio.',
      'β-precisión':
        'β en la garantía de precisión (Correa): probabilidad tolerada de que la longitud observada del IC supere el máximo L₀; el diseño exige P(L ≤ L₀) ≥ 1 − β.',
      'L₀':
        'L₀: longitud máxima tolerada del IC en el diseño por precisión; la garantía exige que la longitud observada no la supere con probabilidad 1 − β.',
      'β-coef':
        'β: coeficiente de regresión; en la logística e^β es el OR ajustado, en Cox e^β es el HR.',
      'δ-precisión':
        'δ en el tamaño muestral por precisión: semiamplitud deseada del IC de una proporción; n = z²·p(1−p)/δ².',
      'ε-precisión':
        'ε: precisión relativa, la semiamplitud del IC expresada como fracción del valor estimado (p. ej. ±20 % de la prevalencia).',
      Φ: 'Φ: función de distribución acumulada de la normal estándar; Φ(1.96) = 0.975.',
      OLS: 'Mínimos cuadrados ordinarios (ordinary least squares): el ajuste lineal por defecto; con confusión no medida su coeficiente queda sesgado.',
      EM: 'Algoritmo EM (expectation–maximization): maximiza la verosimilitud con datos incompletos o latentes alternando un paso de esperanza y uno de maximización.',
      Yates:
        'Corrección de continuidad de Yates (1934): resta 0.5 a cada desviación del χ² para acercarlo a la distribución discreta. Conservadora y hoy discutida; el curso la usa como referencia histórica frente al χ² de Pearson.',
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
      'θ-tabla':
        'θ: el parámetro de interés de la tabla 2×2 (la asociación, p. ej. el OR); los márgenes no aportan información sobre él según la lectura de Fisher.',
      'γ-BB':
        'γ en Berger–Boos: el nivel del IC del parámetro de estorbo; el supremo se toma solo dentro de ese IC y se suma γ al valor p (típicamente 0.001).',
      'π-multinomial':
        'π: vector de probabilidades de una multinomial (p. ej. la fracción de cada serotipo); se infiere completo, no componente por componente.',
      'p₁':
        'p₁, p₂: probabilidades de evento de los grupos 1 y 2 en el modelo de dos binomiales; la nula de la tabla 2×2 es p₁ = p₂.',
      'p₀':
        'p₀: proporción anticipada con la que se dimensiona un estudio por precisión; el punto de apoyo del cálculo de n.',
      'n₁':
        'n₁, n₂: tamaños de los grupos 1 y 2 de la tabla 2×2, fijados por el diseño en el modelo de dos binomiales.',
      'X₁':
        'X₁, X₂: número de eventos en cada grupo como variable aleatoria, X₁ ~ Bin(n₁, p₁); x₁, x₂ son los valores observados.',
      QH: 'Quesenberry–Hurst (1964): IC simultáneos para las k proporciones de una multinomial, con la forma cuadrática de Wilson y el cuantil de una χ² con k − 1 gl.',
      Woolf:
        'Método de Woolf (1955): IC del OR en escala log con error estándar √(1/a + 1/b + 1/c + 1/d). Asintótico; es también la base del IC de Katz para el RR.',
      'Agresti–Caffo':
        'Intervalo de Agresti–Caffo (2000) para la diferencia de proporciones: suma un éxito y un fracaso imaginarios por grupo, y se comporta mejor que Wald cuando hay celdas en cero.',
      Newcombe:
        'Método híbrido de Newcombe (1998) para el IC de la diferencia de proporciones: combina los IC de cada proporción en vez de apoyarse en el error estándar agrupado; robusto con celdas pequeñas.',
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
      'τ²':
        'τ²: varianza entre estudios de los efectos verdaderos en el modelo de efectos aleatorios; τ² = 0 reduce el modelo al de efecto fijo.',
      τ: 'τ: desviación estándar entre estudios de los efectos verdaderos (raíz de τ²), en la escala del efecto; τ̂ es su estimación.',
      IP: 'Intervalo de predicción: dónde caería el efecto de un estudio nuevo; añade τ² a la varianza del promedio y se calcula con t de k − 2 gl.',
      IPD: 'Meta-análisis de datos individuales (individual participant data): combina las bases de cada estudio en lugar de sus resúmenes; evita el sesgo ecológico de la meta-regresión.',
      EVPI: 'Valor esperado de la información perfecta (expected value of perfect information): pérdida esperada de decidir con la incertidumbre actual; techo de lo que vale investigar más.',
      EVSI: 'Valor esperado de la información muestral (expected value of sample information): lo que vale un estudio concreto de tamaño n; siempre menor o igual que el EVPI.',
      'θ-meta':
        'θ: el efecto verdadero que estima un estudio; en efecto fijo es común a todos, en efectos aleatorios cada estudio tiene su θ_k.',
      'μ-meta':
        'μ: la media de los efectos verdaderos θ_k en el modelo de efectos aleatorios; el parámetro que estima el efecto combinado.',
      REML:
        'Máxima verosimilitud restringida (restricted maximum likelihood): estimador de componentes de varianza, como τ², que corrige el sesgo de la MV ordinaria.',
      IA:
        'Inteligencia artificial.',
      LLM:
        'Modelo grande de lenguaje (large language model): redes entrenadas sobre texto masivo; en vigilancia, para extraer eventos de reportes no estructurados.',
      GNN:
        'Red neuronal de grafos (graph neural network): aprende sobre nodos y aristas, p. ej. redes de comorbilidad o de contactos.',
      GVAE:
        'Autocodificador variacional de grafos (graph variational autoencoder): genera representaciones latentes de grafos; usado para multimorbilidad.',
      SEANN:
        'Redes neuronales que incorporan el conocimiento epidemiológico acumulado como prior (PLOS ONE 2025).',
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
      MI: 'Imputación múltiple (multiple imputation): sigla inglesa de la imputación múltiple de Rubin.',
      'δ-MNAR':
        'δ en el análisis de sensibilidad MNAR (δ-adjustment): desplazamiento que se suma a los valores imputados bajo MAR para ver cuánto debe alejarse el faltante para cambiar la conclusión.',
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
      EPV: 'Eventos por variable: sigla del criterio de Peduzzi: ver «eventos por variable».',
      SIR:
        'Modelo compartimental SIR: susceptibles → infectados (tasa de contagio β) → recuperados (tasa de recuperación γ); genera la curva epidémica de referencia, con R₀ = β/γ.',
      'β-SIR':
        'β en el modelo SIR: tasa de contagio; contactos efectivos por infectado y unidad de tiempo que producen nuevas infecciones.',
      'γ-SIR':
        'γ en el modelo SIR: tasa de recuperación; 1/γ es la duración media de la infecciosidad.',
      nowcasting:
        'Nowcasting: estimar los casos ya ocurridos pero aún no notificados, corrigiendo la cola de la curva por la distribución del retraso de notificación.',
      UPGD: 'Unidad primaria generadora de datos: la institución (IPS, laboratorio) que notifica los casos a SIVIGILA; su oportunidad decide buena parte del retraso.',
      IRA: 'Infección respiratoria aguda: evento de vigilancia síndromica en Colombia.',
      DENV: 'Virus del dengue; DENV-1 a DENV-4 son sus cuatro serotipos.',
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
      BCG: 'Bacilo de Calmette-Guérin: la vacuna contra la tuberculosis. En el curso, bcg_matching.csv tiene 111 conjuntos 1:5 (un caso de tuberculosis y cinco controles) con la vacunación como exposición, y los 13 ensayos de Colditz (1994) son el ejemplo de meta-análisis.',
      R0: 'Número reproductivo básico: casos secundarios medios por caso en población susceptible; R₀ > 1 implica crecimiento epidémico.',
      RECORD:
        'RECORD (2015): extensión de STROBE para estudios con datos recolectados de rutina (registros, historias clínicas, bases administrativas).',
      ENDS:
        'Encuesta Nacional de Demografía y Salud (Colombia): encuesta transversal periódica; estima prevalencias, no incidencias.',
      EPS:
        'Entidad Promotora de Salud: aseguradora del sistema de salud colombiano; custodia buena parte de los datos clínicos y administrativos.',
      MSPS:
        'Ministerio de Salud y Protección Social de Colombia.',
      BES:
        'Boletín Epidemiológico Semanal del INS: publica las cifras de SIVIGILA por evento y semana epidemiológica.',
      CNPV:
        'Censo Nacional de Población y Vivienda (DANE, 2018): la fuente de denominadores poblacionales de Colombia.',
      IDEAM:
        'Instituto de Hidrología, Meteorología y Estudios Ambientales de Colombia: datos de clima y ambiente.',
      UNAL:
        'Universidad Nacional de Colombia.',
      CDC:
        'Centers for Disease Control and Prevention (EE. UU.): la agencia federal de salud pública; forma epidemiólogos de campo (EIS) y publica el MMWR.',
      MMWR:
        'Morbidity and Mortality Weekly Report: el boletín semanal de los CDC; allí se reportaron en 1981 los primeros casos de SIDA.',
      EID:
        'Emerging Infectious Diseases: la revista de los CDC sobre enfermedades infecciosas emergentes.',
      OMS:
        'Organización Mundial de la Salud (WHO).',
      WHO:
        'World Health Organization: la OMS en sigla internacional.',
      OPS:
        'Organización Panamericana de la Salud (PAHO): la oficina regional de la OMS para las Américas.',
      DON:
        'Disease Outbreak News: los comunicados oficiales de brotes de la OMS.',
      NIH:
        'National Institutes of Health (EE. UU.): la agencia federal de investigación biomédica.',
      NCI:
        'National Cancer Institute: el instituto de cáncer de los NIH.',
      BRFSS:
        'Behavioral Risk Factor Surveillance System: la encuesta telefónica anual de factores de riesgo de los CDC.',
      ASA:
        'American Statistical Association; su declaración de 2016 (Wasserstein y Lazar) fija seis principios sobre el uso e interpretación del valor p.',
      CRO:
        'Contract research organization: empresa que ejecuta ensayos clínicos por encargo de la industria farmacéutica.',
      CHD:
        'Enfermedad coronaria (coronary heart disease).',
      ACV:
        'Accidente cerebrovascular (stroke).',
      HTA:
        'Hipertensión arterial.',
      IMC:
        'Índice de masa corporal: peso (kg) / talla² (m²).',
      TB:
        'Tuberculosis.',
      ICEMAN:
        'Instrument for assessing the Credibility of Effect Modification ANalyses (Schandelmaier et al. 2020): criterios para juzgar la credibilidad de un efecto de subgrupo.',
      EBCTCG:
        'Early Breast Cancer Trialists\' Collaborative Group: el consorcio de Oxford que meta-analiza los ensayos de cáncer de mama temprano con datos individuales.',
      RE: 'Receptor de estrógeno: RE+ marca los tumores de mama que responden a la terapia hormonal (tamoxifeno).',
      ISIS: 'International Study of Infarct Survival: la serie de megaensayos de infarto (ISIS-2: aspirina y estreptoquinasa) que hizo célebre el análisis de subgrupos por signo zodiacal.',
      COVID: 'COVID-19: la enfermedad por el coronavirus SARS-CoV-2.',
      BMJ: 'British Medical Journal: revista médica general.',
      CMAJ: 'Canadian Medical Association Journal: revista médica general.',
      JAMIA: 'Journal of the American Medical Informatics Association: revista de informática médica.',
      PLoS: 'Public Library of Science: editorial de revistas de acceso abierto (PLOS ONE, PLOS Medicine).',
      RCE: 'Revista Colombiana de Estadística (UNAL).',
      HED: 'Human Epidemic Database: base global de eventos epidémicos publicados.',
      MIGHTE: 'Machine Intelligence Group for the betterment of Health and the Environment (Northeastern University): laboratorio de epidemiología digital.',
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
      SAS:
        'SAS (Statistical Analysis System): el software estándar de la industria farmacéutica y regulatoria; el curso replica en él los análisis de R.',
      ODS:
        'Output Delivery System de SAS: controla y exporta las tablas y gráficos de los PROC (p. ej. ODS GRAPHICS).',
      CRAN:
        'Comprehensive R Archive Network: el repositorio oficial de paquetes de R.',
      CSV:
        'Valores separados por comas (comma-separated values): el formato de texto plano de los datasets del curso.',
      IDE:
        'Entorno de desarrollo integrado (integrated development environment), p. ej. RStudio o SAS Studio.',
      API:
        'Interfaz de programación de aplicaciones (application programming interface): el punto de acceso programático a un servicio de datos.',
      ID: 'Identificador único de registro: la columna que permite detectar duplicados y vincular fuentes.',
      NA: 'Not available: el valor faltante de R; cuidado con los códigos que lo imitan (999, -1, vacío).',
      PROC: 'Procedimiento de SAS (PROC FREQ, PROC LOGISTIC, PROC PHREG…): cada análisis de SAS es un PROC con sus opciones.',
      SQL: 'Structured Query Language: el lenguaje de consulta de bases de datos relacionales.',
      PyPI: 'Python Package Index: el repositorio oficial de paquetes de Python.',
      DOI: 'Digital Object Identifier: identificador permanente de un artículo o conjunto de datos.',
      REST: 'Estilo de API web en que cada recurso tiene una URL y se consulta con peticiones HTTP.',
      PDF: 'Portable Document Format: formato de documento de página fija.',
      README: 'Archivo de presentación de un repositorio: qué hace, cómo instalarlo y cómo citarlo.',
      FIMD: 'Flexible Imputation of Missing Data (van Buuren): el libro de referencia de la imputación múltiple, con el paquete mice.',
      VA:
        'Veterans Administration (EE. UU.): de su ensayo de cáncer de pulmón proviene el dataset VALUNG.',
    },
  },
  {
    titulo: 'Historia y figuras',
    entradas: {
      Snow: 'John Snow (1813–1858): el médico que mapeó el cólera de Broad Street (1854) y retiró la bomba; la primera inferencia causal por diseño observacional.',
      Tuskegee:
        'Estudio de Tuskegee (1932–1972): 399 aparceros afroamericanos con sífilis no tratados aun tras la penicilina; el caso que produjo el Informe Belmont y el consentimiento informado moderno.',
      'Bradford Hill':
        'Austin Bradford Hill (1965): nueve aspectos para juzgar si una asociación es causal, que Woodward reorganiza en siete principios (fuerza, temporalidad, plausibilidad, replicación, reversibilidad, dosis-respuesta y ausencia de alternativa); criterios de acumulación, no un checklist.',
      'Doll-Hill':
        'Richard Doll y Austin Bradford Hill: el estudio de cohortes de médicos británicos (1951–1964) que estableció tabaquismo → cáncer de pulmón; el arquetipo de cohorte prospectiva.',
      'Mantel–Haenszel':
        'Estimador estratificado de Mantel y Haenszel (1959): resume tablas 2×2×K con pesos bₖcₖ/nₖ; el estándar para controlar un confusor categórico, estable aun con estratos pequeños.',
      'izbicki-uq':
        'Rafael Izbicki, "Machine Learning Beyond Point Predictions": cuantificación de incertidumbre y predicción conforme; cobertura garantizada sin supuestos distribucionales.',
      Tukey:
        'John W. Tukey, "The Future of Data Analysis" (1962): el análisis de datos como ciencia propia; la pregunta precede a la técnica.',
      Perondi:
        'Ensayo de Perondi et al. sobre epinefrina en paro cardiaco (34 frente a 34, con 7 y 1 eventos): el caso con el que el módulo 6 compara Fisher (0.0544) y Boschloo (0.0385) a α = 5 %.',
      Freireich:
        'Ensayo 6-MP de Freireich et al. (1963): 42 niños con leucemia aguda, la base `leucemia.txt` y el ejemplo de Kaplan–Meier y log-rank del módulo 12.',
      Molinero:
        'Molinero (2001): una misma asociación analizada bajo tres diseños (cohorte, caso-control y transversal), el ejemplo que ordena el módulo 4 y muestra cuándo el OR está disponible y el RR no.',
      Karnofsky:
        'Escala de Karnofsky (1948): estado funcional de 0 a 100 en pasos de 10; es la variable `Kps` del ensayo VA del módulo 0, y su granularidad obliga a tratarla como ordinal.',
      Belmont:
        'Informe Belmont (1979): respeto por las personas, beneficencia y justicia. El marco ético que el curso cita junto con Tuskegee para hablar de consentimiento informado.',
      Rothman:
        'Kenneth Rothman: la tradición de las causas suficientes y de la escala aditiva como la escala de la interacción biológica. Con Greenland y Lash firma *Modern Epidemiology*, referencia metodológica del curso.',
      Greenland:
        'Sander Greenland: sesgo, colapsabilidad y ajuste causal. Sus trabajos con Rothman sostienen la distinción entre confusión, interacción y no colapsabilidad de los módulos 7 y 10.',
      'Monte Carlo':
        'Método de Monte Carlo: aproximar una distribución o una integral por simulación aleatoria. El curso lo usa con semilla fija para que el resultado sea reproducible y auditable.',
    },
  },
];

/**
 * Variantes tipográficas o de número que apuntan a una entrada canónica:
 * el texto conserva su forma (H₀, I², ICs) y el tooltip usa la definición
 * de la clave. Las usa remark-auto-terms para el enlazado automático.
 */
export const GLOSSARY_ALIASES: Record<string, string> = {
  'H₀': 'H0',
  'I²': 'I2',
  'R₀': 'R0',
  IC95: 'IC',
  ICs: 'IC',
  DAGs: 'DAG',
  GLMs: 'GLM',
  LLMs: 'LLM',
  DONs: 'DON',
  CSM: 'csm',
  SE: 'EE',
  IDs: 'ID',
  SMDs: 'SMD',
  SWIGs: 'SWIG',
  'p₂': 'p₁',
  'n₂': 'n₁',
  'X₂': 'X₁',
  'x₁': 'X₁',
  'x₂': 'X₁',
};

/**
 * Formas en la prosa de los conceptos (claves en minúsculas) que se
 * enlazan solas. Solo expresiones técnicas sin otro sentido en el curso:
 * palabras comunes como «potencia» o «cobertura» quedan fuera y se marcan
 * a mano con <Term>. remark-auto-terms acepta además la forma con
 * mayúscula inicial.
 */
export const GLOSSARY_FORMS: Record<string, string> = {
  'unidad de análisis': 'unidad_analisis',
  'faltante estructural': 'faltante_estructural',
  'faltantes estructurales': 'faltante_estructural',
  'imputación múltiple': 'imputacion_multiple',
  'preferencia de dígito': 'preferencia_digito',
  sobredispersión: 'sobredispersion',
  'curva epidémica': 'curva_epidemica',
  'retraso de notificación': 'retraso_notificacion',
  'retraso de reporte': 'retraso_notificacion',
  'eventos por variable': 'eventos_por_variable',
  nowcasting: 'nowcasting',
  nowcast: 'nowcasting',
  'emulación del ensayo objetivo': 'ensayo_objetivo',
  'ensayo objetivo': 'ensayo_objetivo',
  'usuarios nuevos': 'usuarios_nuevos',
  'caso-cohorte': 'caso_cohorte',
  'muestreo por densidad': 'muestreo_densidad',
  sobrepareamiento: 'sobrepareamiento',
  'razón de prevalencias': 'razon_prevalencias',
  'tiempo inmortal': 'tiempo_inmortal',
  'censura informativa': 'censura_informativa',
  colisionador: 'colisionador',
  colisionadores: 'colisionador',
  'sesgo de Neyman': 'sesgo_neyman',
  'sesgo de recuerdo': 'sesgo_recuerdo',
  'sesgo de selección': 'sesgo_seleccion',
  'mala clasificación': 'mala_clasificacion',
  'condiciones de Cornfield': 'cornfield',
  'E-value': 'evalue',
  'no colapsabilidad': 'colapsabilidad',
  colapsabilidad: 'colapsabilidad',
  'modificación de efecto': 'interaccion',
  paralelismo: 'paralelismo',
  sinergismo: 'sinergismo',
  antagonismo: 'antagonismo',
  unilateralismo: 'unilateralismo',
  estandarización: 'estandarizacion',
  'error tipo I': 'error_tipo_i',
  'error tipo II': 'error_tipo_ii',
  'prueba exacta de Fisher': 'fisher',
  'test exacto de Fisher': 'fisher',
  'prueba de Fisher': 'fisher',
  Boschloo: 'boschloo',
  'Berger–Boos': 'berger-boos',
  'Berger y Boos': 'berger-boos',
  assurance: 'assurance',
  'corrección de Haldane': 'correccion-aditiva',
  'corrección aditiva': 'correccion-aditiva',
  'cero muestral': 'cero-muestral',
  'ceros muestrales': 'cero-muestral',
  'cero estructural': 'cero-estructural',
  'ceros estructurales': 'cero-estructural',
  'potencia observada': 'potencia-observada',
  'cobertura real': 'cobertura',
  'intervalo de Wilson': 'ic-wilson',
  'IC de Wilson': 'ic-wilson',
  'intervalo de Jeffreys': 'ic-jeffreys',
  'IC de Jeffreys': 'ic-jeffreys',
  'Clopper–Pearson': 'ic-clopper',
  'intervalo de verosimilitud': 'ic-verosimilitud',
  'intervalo de Wald': 'ic-wald',
  'IC de Wald': 'ic-wald',
  'garantía de precisión': 'garantia-precision',
  'meta-análisis': 'metaanalisis',
  metaanálisis: 'metaanalisis',
  pareamiento: 'pareamiento',
};

/** Mapa plano clave → definición, derivado de las secciones. */
export const GLOSSARY: Record<string, string> = Object.fromEntries(
  GLOSSARY_SECTIONS.flatMap((s) => Object.entries(s.entradas)),
);

/** Conteo de entradas, para titulares. */
export const GLOSSARY_SIZE = Object.keys(GLOSSARY).length;

/**
 * Ancla estable de una entrada en /glosario: la clave con espacios como
 * guiones ('Bradford Hill' → 'Bradford-Hill'). La usa <Term> para el href
 * y la página del glosario para el id: una sola convención.
 */
export function glossaryAnchor(k: string): string {
  return k.trim().replace(/\s+/g, '-');
}
