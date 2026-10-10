# Curso de Análisis Estadístico de Datos Epidemiológicos

Curso interactivo de **análisis de datos epidemiológicos** con R ejecutándose
en el navegador (webR), para la Escuela de Estadística de la Universidad
Nacional de Colombia, sede Medellín. Hereda arquitectura, pizarra digital,
asistente IA con RAG y sistema de diseño del curso *Procesos Estocásticos*,
con contenido propio guiado por **Woodward (2014)** — *Epidemiology: Study
Design and Data Analysis* — y el material del profesor **Juan Carlos Salazar
Uribe** (curso ADEI).

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

## Textos y fuentes

- **Woodward, M.** *Epidemiology: Study Design and Data Analysis*, 3ª ed. (texto guía; dataset hilván SHHS).
- **Salazar Uribe, J.C.** Notas de clase, scripts R/SAS y datasets del curso ADEI (leucemia, VALUNG, RECID, DDIMER, BCG, caso-control 1:1).
- Lecturas: Tuskegee/Belmont, Doll & Hill, Bradford Hill, Molinero (OR vs. RR), Izbicki (uncertainty quantification), Tukey (futuro del análisis de datos).
- Módulo 6 (inferencia exacta): Fisher (1935), Barnard (1945), Boschloo (1970), Berger & Boos (1994), Mehrotra–Chan–Berger (2003), Hoenig & Heisey (2001), Halpern et al. (2002), O'Hagan et al. (2005), y el ensayo técnico del repositorio (`test_exacto_fisher_3`) con el caso Perondi et al. (2004).
- Hilo de precisión (módulos 5, 6, 9, 13, 17): Brown, Cai & DasGupta (2001), Cepeda-Cuervo et al. (2008, *Revista Colombiana de Estadística*), Rothman & Greenland (2018) y el seminario de precisión y tamaños muestrales de Correa (`modulo_precision`), portado y auditado en `src/lib/precision.ts`.

## Desarrollo

1. `pnpm install`
2. `pnpm dev` → http://localhost:3000

Verificación: `pnpm typecheck` (o `npx tsc --noEmit`), `pnpm test`,
`node scripts/check_mdx.mjs <archivo.mdx>` (compilación MDX),
`node scripts/check_render.mjs` y `pnpm build`.

Los tests incluyen `src/lib/exact2x2.test.ts`: 17 pruebas del motor de
inferencia exacta contra los valores de referencia del ensayo técnico
(Fisher 0.0542, Boschloo 0.0385, potencias 0.433/0.549, ICs y cobertura)
y `src/lib/precision.test.ts`: 23 pruebas del motor de precisión contra
referencias de R (límites de cada método de IC, cobertura, distribución
de L, garantía exacta, assurance beta-binomial, caso exponencial).

## Motor de inferencia exacta (`src/lib/exact2x2.ts`)

Librería TypeScript sin dependencias que enumera el espacio completo de
tablas 2×2 bajo dos binomiales independientes (sin Monte Carlo): valores p
de Fisher (min-like), mid-p, z agrupada, Boschloo y Berger–Boos; regiones
de rechazo, potencia exacta, tamaño real bajo H₀, correcciones aditivas
con sesgo/varianza/ECM, ICs de Woolf, Cornfield, Agresti–Caffo y Newcombe,
cobertura y fórmulas de tamaño muestral. La usan los componentes de
`src/components/ExactSims.tsx` (`ExactTestExplorer`, `ExactPowerExplorer`,
`CorrectionExplorer`, `SampleSizeExplorer`) en los módulos 5 y 6.

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
