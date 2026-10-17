'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { tokens } from '@/lib/tokens';
import { SimGuide, SimLegend } from '@/components/SimBits';

const FIG = 'my-6 rounded border border-ink-200 bg-white p-4 shadow-sm';
const CAPTION = 'mb-2 text-sm font-semibold text-ink-800';
const NOTE = 'mt-2 border-t border-ink-100 pt-2 text-xs text-ink-600';
const SLIDER = 'w-full accent-brand-600';
const CHIP =
  'rounded border px-2.5 py-1 text-left text-xs transition-colors';
const CHIP_OFF = 'border-ink-200 text-ink-700 hover:bg-ink-50';
const CHIP_ON = 'border-brand-500 bg-brand-50 text-brand-700';
const rnd = (v: number) => Math.round(v * 100) / 100;

/* ================================================================== */
/* TestSelector: el diseño elige la fila del catálogo                  */
/* ================================================================== */

interface Resultado {
  test: string;
  porque: string;
  r: string;
  sas: string;
  modulo: string;
  ojo?: string;
}
interface Nodo {
  q: string;
  ops: { label: string; to: string }[];
}

const NODOS: Record<string, Nodo> = {
  inicio: {
    q: '¿Qué quieres decidir?',
    ops: [
      { label: 'Si dos o más grupos difieren', to: 'g_desenlace' },
      { label: 'Si una muestra se aparta de un valor de referencia', to: 'u_desenlace' },
      { label: 'Si hay asociación tras ajustar por un confusor', to: 'aj' },
      { label: 'Si difieren tiempos hasta un evento', to: 'surv' },
      { label: 'Cuánto concuerdan dos observadores o pruebas', to: 'acuerdo' },
      { label: 'Que dos tratamientos son equivalentes', to: 'R:tost' },
    ],
  },
  g_desenlace: {
    q: '¿Qué tipo de desenlace mides?',
    ops: [
      { label: 'Binario (enfermó sí / no)', to: 'g_bin_dis' },
      { label: 'Continuo, aproximadamente normal', to: 'g_cont_dis' },
      { label: 'Continuo muy asimétrico u ordinal', to: 'g_ord_dis' },
      { label: 'Conteo de eventos con persona-tiempo', to: 'g_tasa' },
    ],
  },
  g_bin_dis: {
    q: '¿Los grupos son independientes o pareados?',
    ops: [
      { label: 'Independientes (personas distintas)', to: 'g_bin_ind_k' },
      { label: 'Pareados (mismo sujeto, o caso con su control)', to: 'g_bin_par_k' },
    ],
  },
  g_bin_ind_k: {
    q: '¿Cuántos grupos?',
    ops: [
      { label: 'Dos (tabla 2×2)', to: 'g_bin_ind_2_n' },
      { label: 'Tres o más (tabla R×C)', to: 'g_bin_ind_k_n' },
    ],
  },
  g_bin_ind_2_n: {
    q: '¿Cómo son las frecuencias esperadas?',
    ops: [
      { label: 'Todas ≥ 5', to: 'R:chi2' },
      { label: 'Alguna < 5, o n chico', to: 'R:exacto2x2' },
    ],
  },
  g_bin_ind_k_n: {
    q: '¿Cómo son las frecuencias esperadas?',
    ops: [
      { label: 'Casi todas ≥ 5', to: 'R:chi2rc' },
      { label: 'Varias < 5', to: 'R:ffh' },
    ],
  },
  g_bin_par_k: {
    q: '¿Cuántas mediciones por unidad?',
    ops: [
      { label: 'Dos (antes-después, caso-control 1:1)', to: 'R:mcnemar' },
      { label: 'Tres o más', to: 'R:cochranq' },
    ],
  },
  g_cont_dis: {
    q: '¿Independientes o pareados?',
    ops: [
      { label: 'Independientes, dos grupos', to: 'R:welch' },
      { label: 'Independientes, tres o más grupos', to: 'R:anova' },
      { label: 'Pareados, dos mediciones', to: 'R:tpar' },
      { label: 'Pareados, tres o más mediciones', to: 'R:mixto' },
    ],
  },
  g_ord_dis: {
    q: '¿Independientes o pareados?',
    ops: [
      { label: 'Independientes, dos grupos', to: 'R:wmw' },
      { label: 'Independientes, tres o más grupos', to: 'R:kw' },
      { label: 'Pareados, dos mediciones', to: 'R:wsr' },
      { label: 'Pareados, tres o más mediciones', to: 'R:friedman' },
    ],
  },
  g_tasa: {
    q: '¿Cuántos grupos?',
    ops: [
      { label: 'Dos tasas', to: 'R:poisson2' },
      { label: 'Tres o más, o con covariables', to: 'R:poissonreg' },
    ],
  },
  u_desenlace: {
    q: '¿Qué tipo de dato?',
    ops: [
      { label: 'Una proporción (prevalencia, cobertura)', to: 'R:binom1' },
      { label: 'Un conteo con persona-tiempo o esperados (SMR)', to: 'R:poisson1' },
      { label: 'Una media', to: 'R:t1' },
    ],
  },
  aj: {
    q: '¿Cómo es el problema?',
    ops: [
      { label: 'Exposición y desenlace binarios, un confusor en estratos', to: 'R:cmh' },
      { label: 'Exposición ordinal (dosis-respuesta)', to: 'R:tendencia' },
      { label: 'Varios confusores a la vez', to: 'R:regresion' },
    ],
  },
  surv: {
    q: '¿Qué necesitas?',
    ops: [
      { label: 'Comparar curvas sin covariables', to: 'R:logrank' },
      { label: 'Dar más peso a los eventos tempranos', to: 'R:peto' },
      { label: 'Ajustar por covariables', to: 'R:cox' },
    ],
  },
  acuerdo: {
    q: '¿Qué tipo de medición?',
    ops: [
      { label: 'Categórica (positivo / negativo, clases)', to: 'R:kappa' },
      { label: 'Continua', to: 'R:icc' },
    ],
  },
};

const RESULTADOS: Record<string, Resultado> = {
  chi2: { test: 'χ² de Pearson (sin corrección), o z de dos proporciones', porque: 'Con esperados holgados la aproximación normal es buena; z² es el mismo χ².', r: 'chisq.test(tab, correct = FALSE)', sas: 'PROC FREQ; TABLES e*d / CHISQ RELRISK;', modulo: 'M4', ojo: 'Reporta primero RR, RD u OR con su IC: la prueba no dice cuánto.' },
  exacto2x2: { test: 'Fisher exacto, o Boschloo (incondicional, más potente)', porque: 'Con celdas chicas la aproximación falla; Fisher es conservador, Boschloo recupera potencia sin perder el tamaño.', r: 'fisher.test(tab); Exact::exact.test(tab, method = "boschloo")', sas: 'PROC FREQ; TABLES e*d; EXACT FISHER BARNARD;', modulo: 'M6', ojo: 'Declara cuál usas antes de mirar: pueden dar veredictos distintos (Perondi).' },
  chi2rc: { test: 'χ² de Pearson para tablas R×C', porque: 'Generaliza la 2×2 a varias categorías con esperados holgados.', r: 'chisq.test(tab)', sas: 'PROC FREQ; TABLES g*d / CHISQ;', modulo: 'M0 (catálogo)' },
  ffh: { test: 'Fisher–Freeman–Halton (Fisher para R×C)', porque: 'Extiende la prueba exacta condicional a tablas grandes con celdas chicas.', r: 'fisher.test(tab)   # o simulate.p.value = TRUE si es grande', sas: 'PROC FREQ; TABLES g*d; EXACT FISHER;', modulo: 'M6' },
  mcnemar: { test: 'McNemar (exacto si los pares discordantes son < 25)', porque: 'En datos pareados solo informan los pares discordantes.', r: 'mcnemar.test(tab); binom.test(b, b + c)', sas: 'PROC FREQ; TABLES x*y / AGREE; EXACT MCNEM;', modulo: 'M15', ojo: 'El OR pareado es b/c; con varios controles por caso, regresión logística condicional (clogit).' },
  cochranq: { test: 'Q de Cochran', porque: 'Generaliza McNemar a tres o más mediciones binarias por unidad.', r: 'DescTools::CochranQTest(y ~ tiempo | id)', sas: 'PROC FREQ; TABLES t1*t2*t3 / AGREE;', modulo: 'M0 (catálogo)' },
  welch: { test: 't de Welch', porque: 'Compara medias sin suponer varianzas iguales; es el valor por defecto de R.', r: 't.test(y ~ grupo)', sas: 'PROC TTEST; CLASS grupo; VAR y;   /* fila Satterthwaite */', modulo: 'M0 (catálogo)', ojo: 'No elijas entre Student y Welch con un test previo de varianzas: usa Welch.' },
  anova: { test: 'ANOVA de una vía (versión de Welch)', porque: 'Compara tres o más medias sin suponer varianzas iguales.', r: 'oneway.test(y ~ grupo)', sas: 'PROC GLM; CLASS grupo; MODEL y = grupo; MEANS grupo / WELCH;', modulo: 'M0 (catálogo)' },
  tpar: { test: 't pareada', porque: 'Trabaja sobre las diferencias dentro de cada unidad.', r: 't.test(antes, despues, paired = TRUE)', sas: 'PROC TTEST; PAIRED antes*despues;', modulo: 'M0 (catálogo)' },
  mixto: { test: 'Modelo mixto (medidas repetidas)', porque: 'Separa la variación entre sujetos de la variación en el tiempo y tolera faltantes.', r: 'lme4::lmer(y ~ tiempo + (1 | id))', sas: 'PROC MIXED; CLASS id tiempo; MODEL y = tiempo; REPEATED tiempo / SUBJECT=id;', modulo: 'M16' },
  wmw: { test: 'Wilcoxon–Mann–Whitney', porque: 'Compara distribuciones por rangos, sin suponer normalidad.', r: 'wilcox.test(y ~ grupo)', sas: 'PROC NPAR1WAY WILCOXON; CLASS grupo; VAR y;', modulo: 'M0 (catálogo)', ojo: 'No compara medianas en general: compara si un grupo tiende a valores mayores.' },
  kw: { test: 'Kruskal–Wallis', porque: 'Generaliza Wilcoxon–Mann–Whitney a tres o más grupos.', r: 'kruskal.test(y ~ grupo)', sas: 'PROC NPAR1WAY WILCOXON; CLASS grupo; VAR y;', modulo: 'M0 (catálogo)' },
  wsr: { test: 'Wilcoxon de rangos con signo', porque: 'Versión por rangos de la t pareada.', r: 'wilcox.test(antes, despues, paired = TRUE)', sas: 'PROC UNIVARIATE sobre la diferencia (prueba Signed Rank)', modulo: 'M0 (catálogo)' },
  friedman: { test: 'Friedman', porque: 'Rangos dentro de cada bloque para tres o más mediciones repetidas.', r: 'friedman.test(y ~ tiempo | id)', sas: 'PROC FREQ; TABLES id*tiempo*y / CMH2 SCORES=RANK NOPRINT;', modulo: 'M0 (catálogo)' },
  poisson2: { test: 'Prueba exacta de Poisson para dos tasas', porque: 'Condiciona en el total de eventos: binomial exacta sobre la partición.', r: 'poisson.test(c(x1, x2), c(pt1, pt2))', sas: 'PROC GENMOD; CLASS g; MODEL x = g / DIST=POISSON OFFSET=logpt;', modulo: 'M13' },
  poissonreg: { test: 'Regresión de Poisson con offset (razón de verosimilitudes)', porque: 'Compara varias tasas y ajusta covariables con persona-tiempo.', r: 'glm(x ~ g + cov + offset(log(pt)), family = poisson)', sas: 'PROC GENMOD; MODEL x = g cov / DIST=POISSON OFFSET=logpt TYPE3;', modulo: 'M16', ojo: 'Revisa sobredispersión; si la hay, quasi-Poisson o binomial negativa.' },
  binom1: { test: 'Binomial exacta, con IC de Wilson o Clopper–Pearson', porque: 'El conteo sigue una binomial; el IC importa más que la prueba.', r: 'binom.test(x, n, p = p0)', sas: 'PROC FREQ; TABLES y / BINOMIAL(P=p0); EXACT BINOMIAL;', modulo: 'M6', ojo: 'Evita el IC de Wald con p cerca de 0 o 1.' },
  poisson1: { test: 'Poisson exacta (y SMR = observados / esperados)', porque: 'El conteo observado se compara con el esperado bajo la tasa de referencia.', r: 'poisson.test(obs, T = esperados)', sas: 'Cálculo directo con la función CDF("POISSON", ...) en un paso DATA', modulo: 'M9' },
  t1: { test: 't de una muestra', porque: 'Compara una media con un valor de referencia.', r: 't.test(y, mu = mu0)', sas: 'PROC TTEST H0=mu0; VAR y;', modulo: 'M0 (catálogo)' },
  cmh: { test: 'Cochran–Mantel–Haenszel, con Breslow–Day para la homogeneidad', porque: 'Resume el OR dentro de estratos; Breslow–Day dice si un resumen común tiene sentido.', r: 'mantelhaen.test(arr)', sas: 'PROC FREQ; TABLES k*e*d / CMH BDT;', modulo: 'M8 y M10', ojo: 'Mira primero si los OR por estrato son compatibles: si no, es interacción y se reporta por estrato.' },
  tendencia: { test: 'Cochran–Armitage (tendencia, 1 gl)', porque: 'Usa el orden de la exposición: más potencia que un χ² general para dosis-respuesta.', r: 'prop.trend.test(casos, totales)', sas: 'PROC FREQ; TABLES dosis*d / TREND;', modulo: 'M0 (catálogo)' },
  regresion: { test: 'Regresión logística (o de Poisson) con razón de verosimilitudes', porque: 'Ajusta varios confusores sin partir la muestra en estratos vacíos.', r: 'glm(d ~ e + c1 + c2, family = binomial)', sas: 'PROC LOGISTIC; MODEL d(EVENT="1") = e c1 c2;', modulo: 'M16', ojo: 'El DAG decide qué entra al modelo, no los valores p.' },
  logrank: { test: 'Log-rank', porque: 'Compara eventos observados y esperados a lo largo del tiempo, con censura.', r: 'survival::survdiff(Surv(t, evento) ~ grupo)', sas: 'PROC LIFETEST; TIME t*evento(0); STRATA grupo;', modulo: 'M12' },
  peto: { test: 'Gehan–Breslow o Peto–Peto (log-rank ponderado)', porque: 'Da más peso a los eventos tempranos, cuando las curvas se cruzan tarde.', r: 'survdiff(Surv(t, evento) ~ grupo, rho = 1)', sas: 'PROC LIFETEST; ... STRATA grupo / TEST=(WILCOXON PETO);', modulo: 'M12' },
  cox: { test: 'Regresión de Cox (prueba de Wald, score o razón de verosimilitudes)', porque: 'Estima el HR ajustado por covariables, con censura.', r: 'survival::coxph(Surv(t, evento) ~ grupo + edad)', sas: 'PROC PHREG; MODEL t*evento(0) = grupo edad / TIES=EFRON;', modulo: 'M13', ojo: 'Revisa proporcionalidad (cox.zph). SAS usa Breslow para empates por defecto; R, Efron.' },
  kappa: { test: 'Kappa de Cohen (ponderado si es ordinal)', porque: 'Acuerdo observado corregido por el acuerdo esperado por azar.', r: 'psych::cohen.kappa(tab)', sas: 'PROC FREQ; TABLES a*b / AGREE;', modulo: 'M0 (catálogo)', ojo: 'Kappa depende de la prevalencia: repórtalo con las proporciones de acuerdo.' },
  icc: { test: 'Coeficiente de correlación intraclase y gráfico de Bland–Altman', porque: 'Para mediciones continuas, la correlación de Pearson no mide acuerdo.', r: 'irr::icc(cbind(m1, m2), model = "twoway", type = "agreement")', sas: 'PROC MIXED (componentes de varianza) o macro %INTRACC', modulo: 'M0 (catálogo)' },
  tost: { test: 'TOST: dos pruebas unilaterales dentro de ±Δ', porque: 'Como no rechazar no prueba igualdad, se declara nula una diferencia relevante y se busca descartarla.', r: 'TOSTER::t_TOST(y ~ grupo, eqb = delta)   # o el IC al 90% dentro de ±Δ', sas: 'PROC TTEST TOST(-delta, delta); CLASS grupo; VAR y;', modulo: 'M0 (catálogo)', ojo: 'Δ se fija antes con criterio clínico, no después de ver los datos.' },
};

export function TestSelector({ title }: { title?: ReactNode }) {
  const [ruta, setRuta] = useState<string[]>(['inicio']);
  const actual = ruta[ruta.length - 1];
  const res = actual.startsWith('R:') ? RESULTADOS[actual.slice(2)] : null;
  const nodo = res ? null : NODOS[actual];
  const elegir = (to: string) => setRuta((r) => [...r, to]);
  const volverA = (i: number) => setRuta((r) => r.slice(0, i + 1));

  const etiqueta = (desde: string, hacia: string) =>
    NODOS[desde]?.ops.find((o) => o.to === hacia)?.label ?? '';

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'Selector de prueba: el diseño elige la fila'}</div>
      {ruta.length > 1 && (
        <ol className="mb-2 flex flex-wrap gap-1 text-[11px] text-ink-500">
          {ruta.slice(1).map((paso, i) => (
            <li key={paso}>
              <button type="button" className="underline decoration-dotted hover:text-brand-700"
                onClick={() => volverA(i)}>
                {etiqueta(ruta[i], paso)}
              </button>
              {i < ruta.length - 2 ? ' ›' : ''}
            </li>
          ))}
        </ol>
      )}
      {nodo && (
        <div>
          <p className="mb-2 text-sm text-ink-800">{nodo.q}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {nodo.ops.map((o) => (
              <button key={o.to} type="button" className={`${CHIP} ${CHIP_OFF}`} onClick={() => elegir(o.to)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {res && (
        <div className="space-y-1.5 rounded bg-ink-50 p-3 text-xs text-ink-700" aria-live="polite">
          <p className="text-sm font-semibold text-ink-900">{res.test}</p>
          <p>{res.porque}</p>
          <p><span className="font-semibold">R:</span> <code className="text-[11px]">{res.r}</code></p>
          <p><span className="font-semibold">SAS:</span> <code className="text-[11px]">{res.sas}</code></p>
          <p><span className="font-semibold">En el curso:</span> {res.modulo}</p>
          {res.ojo && <p className="text-ink-600"><span className="font-semibold">Ojo:</span> {res.ojo}</p>}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        {ruta.length > 1 && (
          <button type="button" className={`${CHIP} ${CHIP_OFF}`} onClick={() => setRuta((r) => r.slice(0, -1))}>
            ← atrás
          </button>
        )}
        {ruta.length > 1 && (
          <button type="button" className={`${CHIP} ${CHIP_OFF}`} onClick={() => setRuta(['inicio'])}>
            empezar de nuevo
          </button>
        )}
      </div>
      <p className={NOTE}>
        El selector propone la prueba que corresponde al diseño, no reemplaza el juicio: los
        supuestos (independencia, escala, tamaño, pareamiento) siguen siendo responsabilidad
        de quien analiza, y el efecto con su IC va antes que el valor p.
      </p>
    </div>
  );
}

/* ================================================================== */
/* PValueLab: qué es (y qué no es) un valor p                          */
/* ================================================================== */

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Φ(z) (Abramowitz y Stegun 7.1.26). */
function normCdf(z: number): number {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
    * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export function PValueLab({ title }: { title?: ReactNode }) {
  const [d, setD] = useState(0.5);
  const [n, setN] = useState(30);
  const [pi0, setPi0] = useState(0.5);
  const [seed, setSeed] = useState(3);
  const alpha = 0.05;
  const B = 4000;
  const NB = 20;

  // Cada estudio compara dos medias (σ = 1 conocida) con n por grupo: z = Δ̂/√(2/n).
  // Un «efecto» de tamaño 0 es una nula verdadera: con d = 0 todo es nulo.
  const pi0eff = d === 0 ? 1 : pi0;
  const sim = useMemo(() => {
    const pi0m = d === 0 ? 1 : pi0;
    const rng = mulberry32(seed * 7919 + 17);
    const gauss = () => {
      const u = Math.max(rng(), 1e-12);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
    };
    const binsNull = new Array(NB).fill(0);
    const binsAlt = new Array(NB).fill(0);
    let sigNull = 0, sigAlt = 0, bordeNull = 0, borde = 0;
    for (let b = 0; b < B; b++) {
      const esNulo = rng() < pi0m;
      const z = gauss() + (esNulo ? 0 : d * Math.sqrt(n / 2));
      const p = 2 * (1 - normCdf(Math.abs(z)));
      const k = Math.min(NB - 1, Math.floor(p * NB));
      (esNulo ? binsNull : binsAlt)[k]++;
      if (p < alpha) { if (esNulo) sigNull++; else sigAlt++; }
      if (p >= 0.04 && p < 0.05) { borde++; if (esNulo) bordeNull++; }
    }
    // Un estudio individual, de la misma mezcla: su z se dibuja arriba (área en
    // la cola = su p) y su p como rombo en el histograma de abajo.
    const esNulo1 = rng() < pi0m;
    const z1 = gauss() + (esNulo1 ? 0 : d * Math.sqrt(n / 2));
    const p1 = 2 * (1 - normCdf(Math.abs(z1)));
    return { binsNull, binsAlt, sigNull, sigAlt, borde, bordeNull, esNulo1, z1, p1 };
  }, [d, n, pi0, seed]);

  const zc = 1.959964;
  const delta = d * Math.sqrt(n / 2);
  const potencia = 1 - normCdf(zc - delta) + normCdf(-zc - delta);
  const fdrTeor = (pi0eff * alpha) / (pi0eff * alpha + (1 - pi0eff) * potencia);
  const fdrSim = sim.sigNull / Math.max(1, sim.sigNull + sim.sigAlt);

  const W = 440, H = 258;
  // Panel A: distribución del estadístico z bajo H0 y bajo el efecto real.
  const PA_L = 34, PA_R = 430, PA_TOP = 14, PA_BOT = 90;
  // Panel B: histograma de valores p.
  const L = 34, R = 430, TOP = 128, BOT = 226;
  const maxBin = Math.max(1, ...sim.binsNull.map((v, i) => v + sim.binsAlt[i]));
  const bw = (R - L) / NB;
  const yv = (v: number) => (v / maxBin) * (BOT - TOP);
  const nullCol = tokens.chart.tick;
  const altCol = tokens.chart.primary;

  const phi = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI);
  const ZMIN = -4.5, ZMAX = Math.max(4.5, delta + 3.5);
  const zx = (z: number) => PA_L + ((z - ZMIN) / (ZMAX - ZMIN)) * (PA_R - PA_L);
  const zy = (v: number) => PA_BOT - (v / 0.45) * (PA_BOT - PA_TOP);
  const curve = (mu: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 90; i++) {
      const z = ZMIN + ((ZMAX - ZMIN) * i) / 90;
      pts.push(`${zx(z).toFixed(1)},${zy(phi(z - mu)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const tail = (mu: number, from: number, to: number) => {
    const pts = [`${zx(from).toFixed(1)},${PA_BOT}`];
    for (let i = 0; i <= 40; i++) {
      const z = from + ((to - from) * i) / 40;
      pts.push(`${zx(z).toFixed(1)},${zy(phi(z - mu)).toFixed(1)}`);
    }
    pts.push(`${zx(to).toFixed(1)},${PA_BOT}`);
    return pts.join(' ');
  };

  return (
    <div className={FIG}>
      <div className={CAPTION}>{title ?? 'Laboratorio de valor p'}</div>
      <div className="grid gap-x-4 gap-y-1 text-[11px] text-ink-600 sm:grid-cols-3">
        <label className="block">efecto real cuando existe: d = {d.toFixed(2)} DE
          <input type="range" min={0} max={1.2} step={0.05} value={d} onChange={(e) => setD(+e.target.value)} className={SLIDER} />
        </label>
        <label className="block">personas por grupo: n = {n}
          <input type="range" min={5} max={200} step={5} value={n} onChange={(e) => setN(+e.target.value)} className={SLIDER} />
        </label>
        <label className="block">hipótesis nulas verdaderas: {(100 * pi0).toFixed(0)}%
          <input type="range" min={0} max={0.95} step={0.05} value={pi0} onChange={(e) => setPi0(+e.target.value)} className={SLIDER} />
        </label>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img"
        aria-label="Arriba: distribución del estadístico z bajo H0 y bajo un efecto real; el estudio marcado muestra su p como el área en la cola. Abajo: histograma de valores p de 4000 estudios.">
        {/* ——— Panel A: dónde nace el valor p ——— */}
        <text x={PA_L} y={PA_TOP - 4} fontSize={9} fontWeight={600} fill={tokens.chart.title}>
          ¿De dónde sale un p? El z de cada estudio y el área en la cola
        </text>
        {/* potencia: |z| ≥ zc bajo la curva del efecto real */}
        <polygon points={tail(delta, zc, ZMAX)} fill={altCol} opacity={0.15} />
        <polygon points={tail(delta, ZMIN, -zc)} fill={altCol} opacity={0.15} />
        {/* p del estudio marcado: área bajo H0 más allá de |z1| */}
        <polygon points={tail(0, Math.abs(sim.z1), ZMAX)} fill={tokens.status.danger} opacity={0.28} />
        <polygon points={tail(0, ZMIN, -Math.abs(sim.z1))} fill={tokens.status.danger} opacity={0.28} />
        {/* α: |z| ≥ zc bajo H0 — la regla de decisión, siempre el 5% del gris */}
        <polygon points={tail(0, zc, ZMAX)} fill={tokens.status.danger} opacity={0.1} />
        <polygon points={tail(0, ZMIN, -zc)} fill={tokens.status.danger} opacity={0.1} />
        <polyline points={curve(0)} fill="none" stroke={nullCol} strokeWidth={1.4} />
        <polyline points={curve(delta)} fill="none" stroke={altCol} strokeWidth={1.4} />
        {[zc, -zc].map((z) => (
          <line key={z} x1={zx(z)} x2={zx(z)} y1={PA_TOP + 4} y2={PA_BOT}
            stroke={tokens.status.danger} strokeDasharray="3 3" />
        ))}
        <text x={zx(zc) + 3} y={PA_TOP + 10} fontSize={8} fill={tokens.status.danger}>α: 5% del área gris</text>
        {delta > 0.4 && (
          <text x={zx(Math.min(delta + 1.05, ZMAX - 1.2))} y={zy(phi(1.05)) - 4} fontSize={8}
            fill={altCol}>potencia {(100 * potencia).toFixed(0)}%</text>
        )}
        <line x1={PA_L} x2={PA_R} y1={PA_BOT} y2={PA_BOT} stroke={tokens.chart.axis} strokeWidth={1} />
        <text x={zx(0)} y={PA_BOT + 10} textAnchor="middle" fontSize={8} fill={tokens.chart.text}>0</text>
        {delta > 0.4 && (
          <text x={zx(delta)} y={PA_BOT + 10} textAnchor="middle" fontSize={8} fill={altCol}>δ</text>
        )}
        <text x={PA_L} y={PA_BOT + 10} fontSize={8} fill={tokens.chart.text}>z del estudio</text>
        {/* el estudio individual en el eje z */}
        <g transform={`translate(${zx(sim.z1)}, ${PA_BOT})`}>
          <path d="M0 -5 L5 0 L0 5 L-5 0 Z" fill={sim.esNulo1 ? nullCol : altCol}
            stroke="#fff" strokeWidth={1.2} />
        </g>
        {/* mismo estudio, misma medida: p = área roja ↔ posición en el eje de abajo */}
        <line x1={zx(sim.z1)} y1={PA_BOT + 5} x2={L + sim.p1 * (R - L)} y2={TOP - 4}
          stroke={tokens.status.danger} strokeDasharray="2 3" opacity={0.55} />
        <text x={Math.min(zx(sim.z1) + 8, PA_R - 150)} y={PA_BOT + 22} fontSize={8}
          fill={tokens.status.danger}>su p = el área roja = {sim.p1.toFixed(3)}</text>

        {/* ——— Panel B: a dónde van a parar los p ——— */}
        <text x={L} y={TOP - 6} fontSize={9} fontWeight={600} fill={tokens.chart.title}>
          ¿Adónde van a parar? Los p de 4000 estudios
        </text>
        <rect x={L} y={TOP} width={bw} height={BOT - TOP} fill={tokens.status.danger} opacity={0.07} />
        <line x1={L} x2={R} y1={BOT} y2={BOT} stroke={tokens.chart.axis} strokeWidth={1} />
        {sim.binsNull.map((v, i) => {
          const a = sim.binsAlt[i];
          const x = L + i * bw + 1;
          return (
            <g key={i}>
              <rect x={rnd(x)} y={rnd(BOT - yv(v))} width={rnd(bw - 2)} height={rnd(Math.max(yv(v), v > 0 ? 1.2 : 0))}
                fill={nullCol} stroke={tokens.chart.axis} strokeWidth={0.3} />
              <rect x={rnd(x)} y={rnd(BOT - yv(v) - yv(a))} width={rnd(bw - 2)} height={rnd(Math.max(yv(a), a > 0 ? 1.2 : 0))}
                fill={altCol} stroke={tokens.chart.axis} strokeWidth={0.3} />
            </g>
          );
        })}
        {/* umbral α encima de las barras, con halo para que no se pierda */}
        <line x1={L + bw} x2={L + bw} y1={TOP} y2={BOT} stroke={tokens.status.danger} strokeDasharray="3 3" />
        <text x={L + bw + 3} y={TOP + 8} fontSize={8.5} fill={tokens.status.danger}
          stroke="#fff" strokeWidth={3} paintOrder="stroke">α = 0.05 (el umbral, no un p)</text>
        {/* el mismo rombo en el eje de p */}
        <g transform={`translate(${L + sim.p1 * (R - L)}, ${BOT})`}>
          <path d="M0 -5 L5 0 L0 5 L-5 0 Z" fill={sim.esNulo1 ? nullCol : altCol}
            stroke="#fff" strokeWidth={1.2} />
        </g>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={rnd(L + t * (R - L))} y={BOT + 12} textAnchor="middle" fontSize={8.5} fill={tokens.chart.text}>{t}</text>
        ))}
        <text x={(L + R) / 2} y={H - 4} textAnchor="middle" fontSize={9} fill={tokens.chart.title}>valor p (barras de ancho 0.05)</text>
      </svg>
      <SimLegend className="mt-1" items={[
        { color: nullCol, label: 'estudios donde H₀ es verdadera', mark: 'bar' },
        { color: altCol, label: d === 0 ? 'estudios «con efecto» (d = 0 → son nulos)' : `estudios con efecto real (d = ${d.toFixed(2)})`, mark: 'bar' },
      ]} />

      {/* Lupa sobre la zona significativa: la primera barra del histograma
          crece tanto que la fracción gris (falsos positivos) desaparece;
          aquí se ve su composición real. */}
      {(() => {
        const sig = sim.sigNull + sim.sigAlt;
        if (sig === 0) return <p className="mt-2 text-[11px] text-ink-500">Con estos parámetros ningún estudio cayó bajo α.</p>;
        const fp = sim.sigNull / sig;
        return (
          <div className="mt-2" role="img"
            aria-label={`De los estudios significativos, ${(100 * fp).toFixed(1)}% eran falsos positivos`}>
            <p className="text-[11px] text-ink-600">
              Lupa sobre la zona roja: de los {sig.toLocaleString('es')} declarados «significativos», ¿quiénes eran?
            </p>
            <div className="flex h-5 w-full overflow-hidden rounded border border-ink-200">
              {fp > 0 && <div style={{ width: `${100 * fp}%`, background: nullCol }} />}
              {fp < 1 && <div style={{ width: `${100 * (1 - fp)}%`, background: altCol }} />}
            </div>
            <div className="flex justify-between text-[10px] text-ink-600">
              <span>{(100 * fp).toFixed(1)}% venían de H₀ verdadera (falsos positivos)</span>
              <span>{(100 * (1 - fp)).toFixed(1)}% efectos reales</span>
            </div>
          </div>
        );
      })()}

      <div className="mt-2 grid gap-1 rounded bg-ink-50 p-2 font-mono text-[11px]">
        <div>Potencia del test con este d y n: {(100 * potencia).toFixed(1)}%</div>
        <div>De los resultados con p &lt; 0.05, son falsos positivos: {(100 * fdrSim).toFixed(1)}% simulado · {(100 * fdrTeor).toFixed(1)}% teórico</div>
        <div>De los resultados con 0.04 ≤ p &lt; 0.05, vienen de H₀ verdadera: {sim.borde ? `${((100 * sim.bordeNull) / sim.borde).toFixed(0)}% (${sim.borde} estudios)` : '—'}</div>
        <div>Un estudio cualquiera (rombo, en ambos ejes): z = {sim.z1.toFixed(2)} → p = {sim.p1.toFixed(3)} · venía {sim.esNulo1 ? 'de una H₀ verdadera' : 'de un efecto real'}{sim.p1 < alpha ? ' → se declaró significativo' : ''}</div>
      </div>
      <div className="mt-1">
        <button type="button" className={`${CHIP} ${CHIP_OFF}`} onClick={() => setSeed((s) => s + 1)}>otros 4000 estudios</button>
      </div>

      <SimGuide>
        Arriba se ve de dónde sale un p: el rombo es el z de un estudio y su p es el área roja
        bajo la curva gris más allá de él. La línea punteada lleva ese mismo p al eje de abajo:
        área en la cola de arriba = posición en el histograma. Las líneas rojas fijas son α, la
        regla de decisión — no son un valor p. Pon d = 0: las dos curvas coinciden y el
        histograma es plano; bajo H₀ el p es uniforme y cae bajo α el 5% de las veces. Sube d o
        n: la curva azul se separa, la zona azul (potencia) crece y los p se amontonan a la
        izquierda. Ahora mueve la proporción de nulas verdaderas: con 90% de nulas y potencia
        baja, buena parte de los «significativos» son falsos. El valor p no es la probabilidad
        de que H₀ sea cierta.
      </SimGuide>
      <p className={NOTE}>
        4000 estudios simulados, cada uno una prueba z de dos medias con σ = 1 conocida y n por
        grupo; la proporción de falsos positivos teórica es π₀α / (π₀α + (1 − π₀)·potencia). La
        fila de 0.04 ≤ p &lt; 0.05 ilustra por qué un p justo bajo el umbral es evidencia débil
        (Sellke, Bayarri y Berger, 2001).
      </p>
    </div>
  );
}
