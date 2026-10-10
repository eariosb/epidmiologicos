import { LangTabs } from '@/components/LangTabs';

interface TaskDef {
  title: string;
  task: string;
  r: string;
  sas: string;
  py: string;
  trap: string;
}

/**
 * Banco de tarjetas de herramientas: la tarea estrella de cada módulo
 * traducida a R / SAS / Python. R ejecuta en el navegador (WebR);
 * SAS y Python son referencia para correr localmente.
 */
const TASKS: Record<string, TaskDef> = {
  tasas: {
    title: 'Comparar dos tasas',
    task: 'Razón de tasas (IRR) entre dos grupos con denominadores distintos.',
    r: `tasa_S <- 3151/40923 * 1000   # Southwark & Vauxhall
tasa_L <-  644/461045 * 1000   # Lambeth
tasa_S / tasa_L                # IRR ≈ 55`,
    sas: `data a; input co $ muerte n; datalines;
  SV 3151 40923  L 644 461045;
proc sql;
  select 1000*muerte/n as tasa from a;
quit;`,
    py: `import pandas as pd
d = pd.DataFrame({'mu': [3151, 644], 'n': [40923, 461045]})
tasa = 1000 * d.mu / d.n
print(tasa, tasa[0]/tasa[1])`,
    trap: 'En R/Python la tasa es por 1.000; en SAS conviene guardarla explícita o perderás la unidad al comparar.',
  },
  tabla2x2: {
    title: 'Tabla 2×2',
    task: 'Construir una tabla 2×2 y leer las cuatro celdas antes de cualquier medida.',
    r: `tab <- matrix(c(20, 180, 130, 870), 2, 2, byrow = TRUE)
dimnames(tab) <- list(E = c("SI","NO"), D = c("SI","NO"))
tab`,
    sas: `data t; input E $ D $ n; datalines;
  SI SI 20 SI NO 180 NO SI 130 NO NO 870;
proc freq data=t order=data;
  tables E*D / nopercent norow nocol; weight n;
run;`,
    py: `import pandas as pd
tab = pd.crosstab(E, D)  # o np.array([[20,180],[130,870]])`,
    trap: 'SAS ordena filas/columnas alfabéticamente sin ORDER=DATA; las celdas se pueden cruzar al leer el OR.',
  },
  medicion: {
    title: 'Incidencia vs prevalencia',
    task: 'Calcular riesgo, densidad (personas-tiempo) y verificar P = I·D.',
    r: `riesgo <- 50/500; densidad <- 50/4200
P <- 0.20; I <- 0.02; D <- P/I   # 10 años`,
    sas: `data m; riesgo = 50/500; densidad = 50/4200;
  P = 0.20; I = 0.02; D = P/I; run;
proc print; run;`,
    py: `riesgo = 50/500; densidad = 50/4200
D = 0.20/0.02   # años`,
    trap: 'Riesgo (proporción acumulada) y densidad (tasa por persona-tiempo) no tienen las mismas unidades; no se comparan directo.',
  },
  'rr-or-rd': {
    title: 'RR, OR y RD',
    task: 'Las tres medidas de la misma tabla 2×2.',
    r: `library(epiR)
tab <- matrix(c(20,180,130,870), 2, 2, byrow=TRUE)
epi.2by2(tab, method="cohort.count")`,
    sas: `proc freq data=t order=data;
  tables E*D / riskdiff relrisk measures;
  weight n; run;`,
    py: `import statsmodels.api as sm
t = sm.stats.Table2x2([[20,180],[130,870]])
t.riskratio, t.oddsratio, t.risk_difference`,
    trap: 'El "Col1 Risk" de PROC FREQ depende del orden de filas/columnas: verifica qué celda es a.',
  },
  nnt: {
    title: 'NNT y fracciones atribuibles',
    task: 'ARR, NNT y fracción atribuible poblacional desde una tabla 2×2.',
    r: `a<-5; b<-95; c<-10; d<-90
rd <- c/(c+d) - a/(a+b)  # ARR
nnt <- 1/rd; fae <- rd/(c/(c+d))`,
    sas: `data n; a=5; b=95; c=10; d=90;
  rd = c/(c+d) - a/(a+b); nnt = 1/rd;
  fae = rd/(c/(c+d)); run;
proc print; run;`,
    py: `rd = c/(c+d) - a/(a+b)
nnt = 1/rd; fae = rd/(c/(c+d))`,
    trap: 'RD positivo aquí = beneficio; si tu tabla invierte el orden de filas, el signo cambia y un NNH pasa a "NNT".',
  },
  simular: {
    title: 'Simular confusión',
    task: 'Generar datos donde una variable C confunde la asociación E→D.',
    r: `set.seed(42)
C <- rbinom(1e4, 1, 0.5)
E <- rbinom(1e4, 1, plogis(-1 + 1.2*C))
D <- rbinom(1e4, 1, plogis(-2 + 0*E + 1.4*C))`,
    sas: `data sim; call streaminit(42);
  do i=1 to 10000;
    C = rand('bernoulli',0.5);
    E = rand('bernoulli',1/(1+exp(-(-1+1.2*C))));
    D = rand('bernoulli',1/(1+exp(-(-2+0*E+1.4*C))));
    output; end; run;`,
    py: `rng = np.random.default_rng(42)
C = rng.binomial(1, 0.5, 10000)
E = rng.binomial(1, expit(-1+1.2*C))
D = rng.binomial(1, expit(-2+0*E+1.4*C))`,
    trap: 'En SAS usa rand(\'bernoulli\') + streaminit; sin semilla la simulación no es reproducible.',
  },
  cmh: {
    title: 'Mantel–Haenszel',
    task: 'OR común ajustado por un estrato (ej. tabaquismo).',
    r: `mantelhaen.test(arrays_2x2)   # OR_MH
# o epiR::epi.2by2(..., method="cross.sectional")`,
    sas: `proc freq data=t;
  tables Estrato*E*D / cmh;
  weight n; run;   /* CMH(1): OR común */`,
    py: `from statsmodels.stats.contingency_tables import StratifiedTable
t = StratifiedTable.from_data('E','D','Estrato', df)
t.oddsratio_pooled   # == OR_MH`,
    trap: 'En SAS el OR común aparece en "Adjusted Odds Ratio (CMH)", no en la tabla de relrisk.',
  },
  std: {
    title: 'Estandarización y SMR',
    task: 'SMR (indirecta) y tasa ajustada por edad (directa).',
    r: `smr <- sum(obs) / sum(esp)
# directa: epitools::ageadjust.direct(casos, n, stdpop = w)`,
    sas: `data s; smr = obs/esperados; run;
* directa: PROC STDRATE method=direct
  stat=rate(mult=1000); run;`,
    py: `smr = obs.sum() / esp.sum()`,
    trap: 'El SMR compara dentro de la población estándar elegida: cambiar el estándar cambia los números; siempre declararlo.',
  },
  bdt: {
    title: 'Homogeneidad del OR',
    task: 'Breslow–Day: ¿los OR de los estratos son compatibles?',
    r: `# DescTools::BreslowDayTest(x) o comparar OR por estrato`,
    sas: `proc freq data=t;
  tables Estrato*E*D / cmh bdt; weight n; run;
* Breslow-Day en la tabla CMH`,
    py: `# statsmodels: StratifiedTable.test_equal_odds()`,
    trap: 'Un Breslow–Day no significativo no prueba homogeneidad: los tests de heterogeneidad tienen poca potencia.',
  },
  lifetable: {
    title: 'Tabla de vida',
    task: 'Supervivencia actuarial por intervalos con censura.',
    r: `library(survival)
s <- survfit(Surv(t_in, t_out, evento) ~ 1, data=d)
summary(s, times = c(1,2,5,9))`,
    sas: `proc lifetest data=d method=lt intervals=(0 to 9 by 1);
  time anios*evento(0); run;`,
    py: `from lifelines import KaplanMeierFitter
kmf.fit_interval_censoring(lo, hi)`,
    trap: 'METHOD=LT trata la censura como a mitad del intervalo; KM (METHOD=KM) la ubica en su momento exacto.',
  },
  km: {
    title: 'Kaplan–Meier y log-rank',
    task: 'Curvas por grupo, medianas y test log-rank.',
    r: `library(survival)
s <- survfit(Surv(t, evento) ~ grupo, data=d)
survdiff(Surv(t, evento) ~ grupo, data=d)`,
    sas: `proc lifetest data=d plots=survival;
  time t*evento(0); strata grupo; run;`,
    py: `from lifelines.statistics import logrank_test
logrank_test(t1, t2, e1, e2)`,
    trap: 'survdiff es log-rank por defecto; para Wilcoxon (Gehan) pide rho=1; en SAS es un test aparte en la salida.',
  },
  ptcox: {
    title: 'Personas-tiempo y Cox',
    task: 'Tasas por PT, Poisson con offset y PHREG.',
    r: `glm(eventos ~ grupo + offset(log(pt)), family=poisson)
coxph(Surv(t, evento) ~ grupo, data=d)`,
    sas: `proc genmod data=d;
  model eventos = grupo / dist=poisson
    link=log offset=lpt; run;
proc phreg data=d; model t*evento(0)=grupo; run;`,
    py: `from lifelines import CoxPHFitter
CoxPHFitter().fit(df, 't', 'evento')`,
    trap: 'El offset va como variable en SAS (offset=lpt) pero como argumento en R, y debe ser log(PT), no PT.',
  },
  cc: {
    title: 'OR en caso-control',
    task: 'OR estimable aunque no haya denominadores.',
    r: `library(epiR)
epi.2by2(matrix(c(33,55,27,55),2,2,byrow=TRUE),
         method="case.control")`,
    sas: `proc freq data=t;
  tables E*C / or; weight n; run;`,
    py: `sm.stats.Table2x2([[33,55],[27,55]]).oddsratio`,
    trap: 'En caso-control el OR es el estimando: no reportes riesgos ni RR como si fueran observables.',
  },
  mcnemar: {
    title: 'McNemar y clogit',
    task: 'Pares discordantes + regresión logística condicional.',
    r: `mcnemar.test(tabla_pares)
clogit(d ~ e + strata(par), data=d)`,
    sas: `proc freq data=t; tables C*exp / agree;
  exact mcnem; run;
proc logistic; model evento=expos;
  strata par; run;`,
    py: `from lifelines import CoxPHFitter
c = CoxPHFitter(); c.fit(df, 't','y', strata='par')`,
    trap: 'clogit en R es literalmente un Cox estratificado: en SAS equivalen LOGISTIC+STRATA y PHREG ties=discrete.',
  },
  glm: {
    title: 'Logística y Poisson',
    task: 'glm para datos binarios y conteos.',
    r: `glm(D ~ E + C, family=binomial, data=d)
glm(n ~ x + offset(log(pt)), family=poisson)`,
    sas: `proc logistic data=d descending;
  model D = E C; run;
proc genmod; model n = x / dist=poisson; run;`,
    py: `sm.Logit(y, X).fit(); sm.GLM(y, X, family=sm.families.Poisson()).fit()`,
    trap: 'PROC LOGISTIC modela P(Y=0) por defecto: sin DESCENDING tu OR sale invertido.',
  },
  meta: {
    title: 'Meta-análisis',
    task: 'Estimador combinado, heterogeneidad e I².',
    r: `library(metafor)
rma(yi = te, sei = se, method="REML")`,
    sas: `proc mixed data=estudios method=reml;
  model te = / cl; weight w; random estudio;
  ods output CovParms=tau2; run;`,
    py: `from statsmodels.stats.meta_analysis import combine_effects
combine_effects(te, se, method_re="iterated")`,
    trap: 'Fijo vs aleatorios no es un detalle: el pooled de efectos fijos es sesgado ante heterogeneidad real.',
  },
};

/** Tarjeta de herramientas lista para insertar en un módulo. */
export function ToolCard({ task }: { task: keyof typeof TASKS }) {
  const t = TASKS[task];
  return (
    <LangTabs
      title={`Herramientas: ${t.title}`}
      task={t.task}
      rCode={t.r}
      sasCode={t.sas}
      pyCode={t.py}
      trap={t.trap}
    />
  );
}
