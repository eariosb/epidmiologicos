# Curso de Análisis Estadístico de Datos Epidemiológicos

Curso interactivo de **análisis de datos epidemiológicos** con R ejecutándose
en el navegador (webR), para la Escuela de Estadística de la Universidad
Nacional de Colombia, sede Medellín. Hereda arquitectura, pizarra digital,
asistente IA con RAG y sistema de diseño del curso *Procesos Estocásticos*,
con contenido propio guiado por **Woodward (2014)** — *Epidemiology: Study
Design and Data Analysis* — y el material del profesor **Juan Carlos Salazar
Uribe** (curso ADEI).

La escritura es deliberadamente **pedagógica**: cada concepto se define antes
de usarse, los ejemplos vienen de los datasets reales del curso y las cifras
de la narrativa están atadas al código que las produce (sistema `<Claim>`),
no escritas a mano.

## Estructura (19 módulos en seis bloques)

Una idea central por módulo: cada uno tiene **un concepto, un ejemplo
ancla, un visual interactivo y un producto** que alimenta un portafolio
analítico.

**Bloque I — Diseño, medidas e inferencia en la tabla 2×2 (módulos 1–6)**

1. ¿Qué es la epidemiología cuantitativa? Historia, ética y el caso fundacional (Snow, Tuskegee, Belmont)
2. El mapa de los diseños y la pregunta causal (árbol interactivo, Bradford Hill)
3. Medición de la enfermedad: incidencia, prevalencia y tasas (P = I × D)
4. Medidas de asociación I: RR, OR y RD (laboratorio 2×2, Molinero)
5. Medidas de asociación II: NNT, riesgo atribuible, ICs y valores p; tamaño muestral por fórmula, calibración exacta y la longitud del IC como variable aleatoria con garantía P(L ≤ L₀)
6. Inferencia exacta y calibración en muestras pequeñas: Fisher vs. procedimientos incondicionales (Boschloo, z agrupada, Berger–Boos, mid-p), potencia exacta, correcciones con celdas en cero y comparativa de métodos de IC para una proporción (caso Perondi)

**Bloque II — Confusión e interacción (módulos 7–10)**

7. Confusión: definición, criterios y DAGs
8. Estratificación y Mantel–Haenszel
9. Estandarización y tasas ajustadas (Glasgow, SMR)
10. Interacción, modificación de efecto y paradoja de Simpson

**Bloque III — Cohortes y supervivencia (módulos 11–13)**

11. Diseño de cohortes y tablas de vida (Gantt de seguimiento)
12. Kaplan–Meier y log-rank (leucemia, VALUNG)
13. Persona-tiempo, SMR y aproximación a Cox (RECID)

**Bloque IV — Casos y controles (módulos 14–15)**

14. Diseño de casos y controles: sesgos y selección (Berkson, Sackett)
15. Matching, McNemar y clogit (BCG, DDIMER; la equivalencia McNemar ⇔ CMH)

**Bloque V — Modelación y síntesis (módulos 16–17)**

16. Regresión logística y Poisson multivariante (ROC/AUC)
17. Síntesis: causalidad acumulativa, meta-análisis, UQ y decisiones informadas

**Bloque VI — Herramientas y fronteras (transversal)**

18. Herramientas computacionales: R, SAS y Python para epidemiología (traductor de estimandos, paquetes esenciales, depuración y reproducibilidad)
19. Fronteras abiertas: avances verificados, repositorios de datos, referentes y casos de brote en Colombia y el mundo

## Principios rectores (Woodward)

1. La epidemiología es **comparativa**: toda medida exige un grupo de referencia.
2. **El diseño determina lo estimable**.
3. **La confusión es el enemigo central**.
4. **Estimar antes que contrastar** (IC antes que valor p).
5. **La causalidad es acumulativa** (Bradford Hill, no checklist).

## Funcionalidades

- **Módulos MDX** con KaTeX (`remark-math` + `rehype-katex`), citas
  `<Term>` con glosario, quizzes, flashcards y ejercicios de laboratorio.
- **Simuladores interactivos** (`EpiSims`, `ExactSims`): laboratorio 2×2,
  mapa de decisiones de cinco procedimientos exactos, potencia y tamaño
  reales por enumeración, correcciones con celdas en cero, cobertura de
  ICs, ROC, DAGs interactivos, etc.
- **Celdas R ejecutables** (`RCell`): WebR en el navegador; `survival`
  bajo demanda; los datasets de `public/data/` se copian al FS virtual.
- **Cifras verificadas** (`<Claim>`): 39 valores de la narrativa de los
  módulos 5 y 6 se generan desde `src/lib/exact2x2.ts` /
  `src/lib/precision.ts` vía `scripts/build-claims.ts` →
  `src/content/claims.json`. Si el cómputo cambia, el texto lo refleja.
- **Anexos** (`/anexos`): manifiesto validado con Zod (`src/lib/anexos.ts`)
  con el ensayo técnico del test exacto de Fisher (MD + PDF), los scripts
  R originales, resultados y seis figuras.
- **Asistente IA con RAG**: corpus propio (`src/lib/rag/corpus.ts`) de
  ~170 documentos (secciones de módulos, quizzes, bibliografía, anexos),
  recuperación BM25 local, perfil pedagógico del curso inyectado al
  prompt del paquete `@cursos/blackboard`.
- **Pizarra digital** (paquete `packages/blackboard`, Excalidraw):
  panel acoplable, captura de elementos del módulo, modo presentación.
- **Progreso del curso**: `useProgress` persiste lecciones completadas
  en `localStorage`.

## Arquitectura

```
src/
  app/                    App Router: /, /anexos, /cursos/[slug], api/
  components/             Simuladores, RCell, Callout, Quiz, mdx-components…
  content/modules/        19 módulos MDX + claims.json generado
  hooks/                  useExactTask, useProgress, useWebR, useBroadcast…
  lib/                    exact2x2, precision, exactTasks, exactRunner,
                          tokens, claims, anexos, rag/, modules, glossary…
  workers/exact.worker.ts Web Worker de cálculo exacto
packages/blackboard/      Pizarra digital + asistente LLM (workspace)
public/anexos/            Ensayo técnico, scripts R, figuras del anexo
public/data/              Datasets del curso (VALUNG, RECID, BCG, DDIMER…)
scripts/                  QA: run_all_r, check_mdx, check_render, build-claims
tests/visual/             Snapshots Playwright (escritorio + móvil)
docs/QA.md                Línea base y compuertas de calidad
```

### Cálculo exacto fuera del hilo UI

Las enumeraciones exhaustivas del espacio de tablas 2×2 se ejecutan en un
Web Worker (`src/workers/exact.worker.ts`) a través de un protocolo
`{id, name, args} → {id, ok|error}` (`src/lib/exactRunner.ts`) y el hook
`useExactTask`, que conserva el último resultado mientras recalcula y
descarta respuestas obsoletas. Las funciones de tarea viven en
`src/lib/exactTasks.ts` y son **las mismas** en worker y en el plan B
síncrono — los resultados son idénticos bit a bit. El plan B se fuerza
con la variable `NEXT_PUBLIC_EXACT_WORKER=0`.

### Tokens semánticos de diseño

Los colores por rol viven en `globals.css` como variables RGB
(`--brand-*`, `--warning-*`, `--danger-*`, `--success-*`, `--info-*`,
`--code`, `--bg`, `--fg`) consumidas por Tailwind como
`rgb(var(--x) / <alpha-value>)`. `src/lib/tokens.ts` contiene los
equivalentes para contextos sin clases (series SVG, `fill`/`stroke`,
objetos `style`). Las escalas literales (`accent`, `ink`, `positive`)
siguen definidas para el paquete `blackboard`. Tipografía: Inter (texto)
+ Lora (display editorial, `font-display`).

### Movimiento

Sistema contenido de micro-interacciones: transiciones de 150–300 ms
sobre `transform`/`opacity` con curva ease-out (`fade-in`, `slide-in`,
`fade-rise` en `tailwind.config.ts`), fade de entrada en resultados
asíncronos del worker exacto y feedback sutil en controles. Todo
desactivado bajo `prefers-reduced-motion: reduce` (`globals.css`);
ninguna información se transmite solo mediante animación.

## Stack

Next.js 15.5 (App Router) · React 19 · TypeScript · Tailwind CSS +
@tailwindcss/typography · MDX (`next-mdx-remote/rsc`) · KaTeX · WebR ·
Excalidraw (`@cursos/blackboard`) · Zod · Vitest + Testing Library ·
Playwright · pnpm workspaces.

## Desarrollo

```bash
pnpm install          # instala deps (lockfile congelado en CI)
pnpm dev              # http://localhost:3000
pnpm build            # build de producción (27 rutas estáticas)
pnpm start            # sirve el build
```

### Compuertas de calidad (QA)

| Comando | Qué verifica |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` sin errores |
| `pnpm test` | 215 tests Vitest (exact2x2, precision, tasks, claims, RAG, hooks, componentes) |
| `pnpm check:mdx` | Los 19 módulos compilan con next-mdx-remote |
| `pnpm check:r` | Las salidas de las celdas R coinciden con los snapshots de `tests/r-snapshots` |
| `pnpm test:visual` | 42 capturas Playwright (19 módulos + home + anexos × escritorio/móvil) |

Otras utilidades: `python scripts/run_all_r.py --update` regenera los
snapshots de R; `pnpm exec playwright test --update-snapshots` regenera
las capturas visuales (solo tras un cambio visual declarado);
`node scripts/check_render.mjs` prueba renderizado de componentes MDX.

Nota de entorno (Windows): no ejecutar `next dev` y `next start` sobre el
mismo `.next` ni dos `next start` a la vez — corrompen los manifiestos
(páginas más cortas sin TOC, errores 400 en chunks). Un solo servidor de
producción por build.

## Motor de inferencia exacta (`src/lib/exact2x2.ts`)

Librería TypeScript sin dependencias que enumera el espacio completo de
tablas 2×2 bajo dos binomiales independientes (sin Monte Carlo): valores p
de Fisher (min-like), mid-p, z agrupada, Boschloo y Berger–Boos; regiones
de rechazo, potencia exacta, tamaño real bajo H₀, correcciones aditivas
con sesgo/varianza/ECM, ICs de Woolf, Cornfield, Agresti–Caffo y Newcombe,
cobertura y fórmulas de tamaño muestral. La usan los componentes de
`src/components/ExactSims.tsx` (`ExactTestExplorer`, `ExactPowerExplorer`,
`CorrectionExplorer`, `SampleSizeExplorer`) en los módulos 5 y 6, y las
tareas del worker en `src/lib/exactTasks.ts`.

## Motor de precisión (`src/lib/precision.ts`)

Port TypeScript del aplicativo del seminario Correa (`modulo_precision`,
`intervalos.R` + `precision.R`), auditado y sin dependencias: seis
métodos de IC para una proporción (Wald, Wilson, Agresti–Coull,
Jeffreys, Clopper–Pearson, verosimilitud), cobertura exacta, la
distribución exacta de la longitud L por enumeración binomial, el n
mínimo con garantía P(L ≤ L₀) ≥ 1 − β (con manejo de los dientes de
sierra por no monotonía), assurance con prior Beta(a, b) y el caso
exponencial exacto vía χ². La fórmula original del documento —que
confundía L con la semiamplitud— se conserva solo como contraejemplo.
La usan `CIMethodsExplorer` (módulo 6) y `PrecisionSampleSizeExplorer`
(módulo 5).

## Ejecución de R en el navegador

Las celdas `RCell` corren en WebR (R compilado a WebAssembly). El curso usa
mayormente base R (tablas 2×2, χ², Mantel–Haenszel, McNemar, Kaplan–Meier a
mano) y `survival` (Surv, survfit, survdiff, coxph, clogit), que está en el
repo binario de WebR y se instala bajo demanda. Los datasets del curso viven
en `public/data/` y se copian al sistema de archivos virtual de WebR cuando
una celda los referencia por nombre.

## Textos y fuentes

- **Woodward, M.** *Epidemiology: Study Design and Data Analysis*, 3ª ed. (texto guía; dataset hilván SHHS).
- **Salazar Uribe, J.C.** Notas de clase, scripts R/SAS y datasets del curso ADEI (leucemia, VALUNG, RECID, DDIMER, BCG, caso-control 1:1).
- Lecturas: Tuskegee/Belmont, Doll & Hill, Bradford Hill, Molinero (OR vs. RR), Izbicki (uncertainty quantification), Tukey (futuro del análisis de datos).
- Módulo 6 (inferencia exacta): Fisher (1935), Barnard (1945), Boschloo (1970), Berger & Boos (1994), Mehrotra–Chan–Berger (2003), Hoenig & Heisey (2001), Halpern et al. (2002), O'Hagan et al. (2005), y el ensayo técnico del repositorio (`test_exacto_fisher_3`, disponible en `/anexos`) con el caso Perondi et al. (2004).
- Hilo de precisión (módulos 5, 6, 9, 13, 17): Brown, Cai & DasGupta (2001), Cepeda-Cuervo et al. (2008, *Revista Colombiana de Estadística*), Rothman & Greenland (2018) y el seminario de precisión y tamaños muestrales de Correa (`modulo_precision`), portado y auditado en `src/lib/precision.ts`.

## Licencia

Contenido del curso bajo [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
Esneider Rios · Universidad Nacional de Colombia · Sede Medellín · 2026.
