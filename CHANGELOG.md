# Changelog

Todas las cifras del curso están verificadas contra los datos en
`public/data` y/o el código de `src/lib/`. Las entradas marcan los cambios
relevantes para quien ya haya usado la versión anterior.

## [1.0.0] — 2026-10

Primera versión completa del curso tras el plan de diez fases
(correcciones → infraestructura → diseño → módulo 0).

### Agregado

- **Módulo 0 — Repaso: leer los datos antes de analizarlos**
  (`00-repaso-datos-epidemiologicos`). 13 secciones ancladas en las bases
  reales del curso (VALUNG, RECID, BCG, parejas clase 22, DDIMER,
  leucemia), sin re-numerar los módulos 1–19. Incluye el simulador nuevo
  `EpiCurveExplorer` (SIR + ruido Poisson + retraso de notificación), 3
  quizzes, flashcards del mapa de distribuciones y el laboratorio "Ficha
  exploratoria". M1 lo declara como prerrequisito recomendado.
- **Sección `/anexos`**: ensayo técnico del test exacto de Fisher
  (`test_exacto_fisher_3.pdf`), scripts `simulacion3.R` y
  `sesgo_varianza.R`, manifiesto validado con Zod e integración al corpus
  RAG. Resuelve la referencia rota del módulo 6.
- **Sistema `<Claim>`**: las cifras citadas en la prosa de M5 y M6 se
  generan desde el código (39 cifras), con tests de no-regresión.
- **10 términos nuevos** en el glosario (unidad de análisis, faltante
  estructural, MCAR/MAR/MNAR, preferencia de dígito, MAD, ECDF,
  sobredispersión, curva epidémica, retraso de notificación).

### Corregido

- **Perondi (M6)**: las etiquetas de los grupos estaban invertidas —
  ahora 7/34 dosis estándar y 1/34 dosis alta, como en la auditoría y la
  reseña PMC6986458. El texto adopta el encuadre "escenario de referencia
  anclado en las proporciones observadas" y advierte que no es la
  potencia del ensayo real (diseño prospectivo).
- Aportes del ensayo técnico a M6: máximos locales del espacio de
  tablas, equivalencia minlike/central, callout de orientación y el
  puente de Altham (Fisher unilateral 0.0272 × 2 = 0.0544).
- `PvalueVsEffect`: ejemplos prescritos verificados (OR = 3/n = 40 →
  60.3 %; OR = 1.25/n = 1500 → 72.3 %).
- Asistente RAG: perfil de curso inyectable, corpus limpio de código,
  7 citas bibliográficas faltantes agregadas (Altham 1969, Oswego 1940,
  Reading 1984, Autier 1996, Moritz 1997, Hine 1989), quizzes como
  documentos recuperables.
- Erratas de home: "Ccinco" → "Cinco"; frase rota "de estudi
  actualmente" corregida.

### Cambiado (sin cambio de contenido)

- **Cálculos exactos en Web Worker** (`tableSpace`, `powerCurves`,
  `sizeCurves`, `ecmCurve`, `coveragePair`, `exactPowerPair`) con fallback
  síncrono (`NEXT_PUBLIC_EXACT_WORKER=0`); resultados idénticos vía
  `src/lib/exactTasks.ts` compartido.
- **Tokens semánticos de diseño** (`--brand/--warning/--danger/
  --success/--info/--code/--bg/--fg`) con equivalencias pixel-exactas;
  `src/lib/tokens.ts` para contextos SVG/inline.
- **Sistema visual editorial**: Lora como fuente display (títulos y
  citas), filete sobre h2 en la prosa, encabezado de módulo con lede.
- **Movimiento contenido**: curva `ease-out-expo` unificada (200–250 ms),
  fade de entrada en resultados del worker, respeto total a
  `prefers-reduced-motion`.

### Infraestructura y QA

- Línea base reproducible: snapshots R por celda (`pnpm check:r`),
  compilación MDX (`pnpm check:mdx`), suite visual Playwright
  (`pnpm test:visual`, 44 capturas), 215 tests unitarios, `pnpm qa`
  como compuerta única.
- `/api/vision` devuelve 503 en producción si `VISION_SERVICE_URL` no
  está definida — el curso funciona sin el servicio.
- El asistente opera con **clave de API por usuario** (configurada en la
  pizarra, nunca en el servidor): cada estudiante usa su propia clave o
  la aplicación funciona sin asistente.

### Cifras de referencia que NO cambiaron (anclas del curso)

- Fisher bilateral p ≈ 0.0544 · Boschloo p ≈ 0.0385
- Potencias a n = 34: Fisher 43.3 % · Boschloo 54.9 %
- Tamaños reales: Fisher 3.05 % · Boschloo 4.66 %
- VALUNG: 137 pacientes, 9 censurados; log-rank terapia p = 0.93,
  tipo celular p = 1.3 × 10⁻⁵

### Pendiente de validación humana (antes de publicar)

- Revisión del profesor Salazar Uribe del módulo 0 (único módulo que no
  deriva de una de sus clases) y de la corrección del IC de
  Kleinbaum–Kupper con su tabla de cobertura.

## [Sin versión] — Datos del mundo real (fase 10d)

### Agregado

- **`WorldSims.tsx`**: tres simuladores del análisis en condiciones
  reales:
  - `MissingDataLab` — induce MCAR/MAR/MNAR sobre el Kps completo de
    VALUNG (verdad conocida, semilla fija) y compara casos completos,
    imputación por la media e imputación por regresión sobre la edad.
  - `EValueCalculator` — E-value del estimador y del límite del IC
    (VanderWeele & Ding 2017), interpretado en la escala del efecto.
  - `BiasAnalysis2x2` — corrección del OR por sensibilidad y
    especificidad asumidas de la clasificación de la exposición.
- **M1 — ética aplicada a datos**: Resolución 8430 (clasificación de
  riesgo), Ley 1581 y Decreto 1377 (datos sensibles), datos secundarios
  sin consentimiento, ética del estudio subpotenciado + quiz.
- **M7 — Cornfield y E-value**: las condiciones de Cornfield (1959) del
  debate tabaco–cáncer y su formalización como E-value.
- **M13 — covariable dependiente del tiempo**: RCell que reestructura
  `emp1`–`emp52` de RECID a formato largo y compara tasas de arresto
  por 1 000 personas-semana según el empleo vigente.
- **M14 — análisis de sesgo cuantitativo**: corrección por Se/Sp,
  diferencial vs no diferencial + `BiasAnalysis2x2`.
- **M16 — faltantes y pocos eventos**: mecanismos de Rubin con
  `MissingDataLab`, imputación múltiple, regla de 10 EPV (Peduzzi),
  regresión de Firth y separación como diagnóstico.
- **M17 — robustez y reporte**: `EValueCalculator` + sección
  STROBE/RECORD.
- **Glosario**: evalue, cornfield, mala_clasificacion,
  imputacion_multiple, eventos_por_variable, STROBE.

## [Sin versión] — Explorar antes de inferir (fase 10c)

### Agregado

- **`Table1Builder`** (`src/components/QualitySims.tsx`): construye la
  Tabla 1 del CSV real en el navegador (RECID o VALUNG) con diferencias
  estandarizadas — no valores p — y umbral |d| > 0.1 marcado. El
  agrupador se elige en vivo: `fin` (aleatorizado → balance) vs.
  `arrest` (desenlace → confusores encendidos).
- **`DataQualityPanel`**: auditoría en vivo del archivo con el esquema
  Kahn 2016 — conformidad, completitud, plausibilidad — con hallazgos
  computados (Prior ∈ {0,10}, 97.1% Kps múltiplos de 10, 12 atípicos
  reales, emp vacío solo tras el arresto, week = 53, prio
  sobredispersión 2.8×) que el estudiante marca: verificado /
  sospechoso / documentado.
- **M0**: sección "Las tres dimensiones de la calidad del dato" que
  formaliza el esquema C1 y embebe el panel de auditoría.
- **M7**: sección "La Tabla 1 como diagnóstico" — diferencias
  estandarizadas frente a valores p, selección, información
  diferencial — + callout de la falacia de la Tabla 2 (Westreich y
  Greenland 2013) + `Table1Builder` con la demo fin-vs-arrest.
- Snapshots regenerados (declarados): M0 y M7 en escritorio y móvil.

## [Sin versión] — Conducir el estudio (fase 10b)

### Agregado

- **Componente `ConductStudy`/`ConductStep`** (`src/components/ConductStudy.tsx`):
  la secuencia de siete pasos —pregunta, población fuente y marco,
  selección, medición, estructura del archivo, exploración y validación,
  medida e inferencia— como marco común de todos los diseños. El
  componente da la forma; el contenido de cada paso vive en el MDX.
- **M2**: sección "Conducir el estudio: siete pasos" + "El cuarto
  camino: datos que nadie diseñó" — datos secundarios y la tabla de
  emulación del ensayo objetivo (Hernán & Robins 2016), con tiempo
  inmortal y usuarios prevalentes como sesgos de tiempo cero.
- **M3**: sección "El corte transversal en la práctica" — encuestas con
  estratos/conglomerados/pesos, razón de prevalencias vs. OR de
  prevalencia (RCell: RP = 2 fijo, OR de 2.02 a 3.5 según prevalencia),
  PROC SURVEYFREQ, sesgo prevalencia-incidencia y no respuesta.
- **M11**: "Conducir el estudio: la cohorte" — tiempo cero/tiempo
  inmortal, usuarios nuevos, pérdidas por grupo + ejercicio RECID:
  `week = 53` como convención del archivo, 2 655 celdas `emp` vacías
  solo en arrestados (faltantes estructurales) y la ambigüedad del
  denominador (20 127 vs 19 809 personas-semana, 318 semanas fantasma).
- **M14**: "Conducir el estudio: casos y controles" — población fuente,
  tipos de controles, muestreo por densidad de incidencia y
  caso-cohorte + ejercicio BCG: la proporción 1/6 de casos es diseño,
  no prevalencia; P(vacuna|control) = 0.605 sí estima algo poblacional.
- **M15**: "Conducir el estudio: el diseño pareado" — análisis
  condicional obligatorio, sobrepareamiento + ejercicio DDIMER: 20 sets
  de tamaño variable (1–3 casos por set), no estrictamente 1:c.
- **8 términos nuevos** en el glosario: tiempo inmortal, ensayo
  objetivo, caso-cohorte, muestreo por densidad, sobrepareamiento,
  razón de prevalencias, usuarios nuevos, censura informativa.
- Snapshots regenerados (declarados): M2, M3, M11, M14, M15 en
  escritorio y móvil. 4 snapshots R nuevos.

## [Sin versión] — Apéndice de bibliografía

### Agregado

- **`/bibliografia`**: apéndice de bibliografía, enlaces y lecturas de
  interés (`src/lib/lecturas.ts`). ~60 referencias del plan docente en 14
  secciones temáticas —textos base, datos longitudinales, información
  faltante, cohortes con datos secundarios, casos y controles, encuestas
  transversales, calidad de datos y vigilancia, valores p, muestras
  pequeñas, sesgos, causalidad gráfica, ética y normativa colombiana,
  fuentes de los datasets— cada una con su uso en el curso. DOI enlazado
  solo donde la cita es verificable; la página advierte que volumen y
  páginas deben cotejarse antes de publicarse en impreso.
- Sección «Enlaces y recursos» con destinos institucionales estables:
  STROBE, EQUATOR, Informe Belmont (HHS), Declaración de Helsinki (WMA),
  Ley 1581 y Decreto 1377 (Secretaría del Senado), Tuskegee (CDC),
  DAGitty, R y webR.
- Enlace «Bibliografía y lecturas» en el menú de módulos, junto a
  «Anexos del curso». Snapshots nuevos (declarados): `bibliografia.png`
  en escritorio y móvil.

### No agregado al corpus RAG

Estas referencias son lecturas de ampliación; la bibliografía canónica
del asistente (`src/lib/rag/bibliography.ts`) sigue siendo la única
citable con `[bib:*]` hasta que el profesor coteje las citas.
