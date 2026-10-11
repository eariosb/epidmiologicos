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
