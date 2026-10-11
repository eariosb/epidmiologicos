/**
 * Apéndice de bibliografía, enlaces y lecturas de interés del curso.
 *
 * Las citas provienen del plan docente del curso y se agrupan por los temas
 * de la columna práctica (conducir el estudio, explorar antes de inferir,
 * datos del mundo real, intuición cuantitativa, ciudad simulada). No
 * reemplazan a la bibliografía canónica del asistente (`rag/bibliography`),
 * que es la única citable por [bib:*]; estas son lecturas de ampliación.
 *
 * `doi` se incluye solo donde la cita es estable y verificable; el resto se
 * publica como referencia textual. Volumen y páginas deben cotejarse antes
 * de una publicación impresa — igual que advierte el plan original.
 */

export interface Lectura {
  /** Referencia completa, en formato de cita. */
  cita: string;
  /** Para qué la usa el curso (una línea). */
  nota?: string;
  doi?: string;
}

export interface SeccionLecturas {
  titulo: string;
  nota?: string;
  entradas: Lectura[];
}

export const LECTURAS: SeccionLecturas[] = [
  {
    titulo: 'Textos base',
    nota: 'El andamiaje teórico del curso: diseño, medidas e inferencia.',
    entradas: [
      {
        cita: 'Woodward M. Epidemiology: Study Design and Data Analysis. 3.ª ed. Boca Raton: CRC Press; 2014.',
        nota: 'Texto guía del curso; el hilo de todos los módulos.',
      },
      {
        cita: 'Rothman KJ, Greenland S, Lash TL. Modern Epidemiology. 3.ª ed. Philadelphia: Lippincott Williams & Wilkins; 2008. (4.ª ed.: Lash TL, VanderWeele TJ, Haneuse S, Rothman KJ; Wolters Kluwer; 2021.)',
        nota: 'La referencia de profundidad: sesgos, causalidad y estimandos.',
      },
      {
        cita: 'Hernán MA, Robins JM. Causal Inference: What If. Boca Raton: Chapman & Hall/CRC; 2020.',
        nota: 'Causalidad formal; base de la emulación del ensayo objetivo.',
      },
      {
        cita: 'Hernán MA, Robins JM. Using big data to emulate a target trial when a randomized trial is not available. Am J Epidemiol. 2016;183(8):758–764.',
        doi: '10.1093/aje/kwv254',
        nota: 'El método central para datos secundarios.',
      },
      {
        cita: 'von Elm E, Altman DG, Egger M, Pocock SJ, Gøtzsche PC, Vandenbroucke JP. The STROBE statement. Lancet. 2007;370(9596):1453–1457. Explicación y elaboración: Vandenbroucke JP et al. Epidemiology. 2007;18(6):805–835.',
        doi: '10.1016/S0140-6736(07)61602-X',
        nota: 'La lista de verificación del reporte observacional.',
      },
      {
        cita: 'Benchimol EI, Smeeth L, Guttmann A, et al. The RECORD statement. PLoS Med. 2015;12(10):e1001885.',
        doi: '10.1371/journal.pmed.1001885',
        nota: 'STROBE para datos recolectados de rutina.',
      },
      {
        cita: 'Tukey JW. The future of data analysis. Ann Math Stat. 1962;33(1):1–67.',
        doi: '10.1214/aoms/1177704711',
        nota: 'La separación explorar/confirmar que gobierna el repaso.',
      },
      {
        cita: 'Tukey JW. Exploratory Data Analysis. Reading, MA: Addison-Wesley; 1977.',
        nota: 'El manual del oficio exploratorio.',
      },
      {
        cita: 'Cornfield J, Haenszel W, Hammond EC, Lilienfeld AM, Shimkin MB, Wynder EL. Smoking and lung cancer: recent evidence and a discussion of some questions. J Natl Cancer Inst. 1959;22(1):173–203.',
        doi: '10.1093/jnci/22.1.173',
        nota: 'Las condiciones de Cornfield contra el confusor no medido.',
      },
    ],
  },
  {
    titulo: 'Datos longitudinales y exposiciones que cambian en el tiempo',
    entradas: [
      {
        cita: 'Fitzmaurice GM, Laird NM, Ware JH. Applied Longitudinal Analysis. 2.ª ed. Hoboken: Wiley; 2011.',
        nota: 'El texto de referencia para datos repetidos.',
      },
      {
        cita: 'Diggle PJ, Heagerty P, Liang K-Y, Zeger SL. Analysis of Longitudinal Data. 2.ª ed. Oxford: Oxford University Press; 2002.',
      },
      {
        cita: 'Robins JM, Hernán MA, Brumback B. Marginal structural models and causal inference in epidemiology. Epidemiology. 2000;11(5):550–560.',
        doi: '10.1097/00001648-200009000-00011',
        nota: 'Cuando el confusor depende del tiempo: mención conceptual.',
      },
      {
        cita: 'Mansournia MA, Etminan M, Danaei G, Kaufman JS, Collins G. Handling time varying confounding in observational research. BMJ. 2017;359:j4587.',
        doi: '10.1136/bmj.j4587',
      },
      {
        cita: 'Pullenayegum EM, Lim LSH. Longitudinal data subject to irregular observation: a review of methods. Stat Methods Med Res. 2016;25(6):2992–3014.',
        nota: 'Visitas irregulares e informativas: describir el proceso de visita antes de modelar.',
      },
    ],
  },
  {
    titulo: 'Información faltante',
    entradas: [
      {
        cita: 'Rubin DB. Inference and missing data. Biometrika. 1976;63(3):581–592.',
        doi: '10.1093/biomet/63.3.581',
        nota: 'Los mecanismos MCAR/MAR/MNAR, en la fuente original.',
      },
      {
        cita: 'van Buuren S. Flexible Imputation of Missing Data. 2.ª ed. Boca Raton: CRC Press; 2018.',
        nota: 'El manual de imputación múltiple; disponible en línea.',
      },
      {
        cita: 'Sterne JAC, White IR, Carlin JB, et al. Multiple imputation for missing data in epidemiological and clinical research: potential and pitfalls. BMJ. 2009;338:b2393.',
        doi: '10.1136/bmj.b2393',
      },
      {
        cita: 'White IR, Royston P, Wood AM. Multiple imputation using chained equations: issues and guidance for practice. Stat Med. 2011;30(4):377–399.',
        doi: '10.1002/sim.4067',
      },
      {
        cita: 'Hughes RA, Heron J, Sterne JAC, Tilling K. Accounting for missing data in statistical analyses: multiple imputation is not always the answer. Int J Epidemiol. 2019;48(4):1294–1304.',
        doi: '10.1093/ije/dyz032',
        nota: 'Cuándo casos completos es la opción correcta.',
      },
      {
        cita: 'White IR, Carlin JB. Bias and efficiency of multiple imputation compared with complete-case analysis for missing covariate values. Stat Med. 2010;29(28):2920–2931.',
        doi: '10.1002/sim.3949',
      },
      {
        cita: 'Lee KJ, Tilling KM, Cornish RP, et al. Framework for the treatment and reporting of missing data in observational studies: TARMOS. J Clin Epidemiol. 2021;134:79–88.',
        doi: '10.1016/j.jclinepi.2020.12.005',
        nota: 'El marco de reporte de faltantes que el curso adopta.',
      },
    ],
  },
  {
    titulo: 'Cohortes con datos secundarios',
    entradas: [
      {
        cita: 'Suissa S. Immortal time bias in pharmaco-epidemiology. Am J Epidemiol. 2008;167(4):492–499.',
        doi: '10.1093/aje/kwm324',
        nota: 'El sesgo que nace de un tiempo cero mal definido.',
      },
      {
        cita: 'Lévesque LE, Hanley JA, Kezouh A, Suissa S. Problem of immortal time bias in cohort studies: example using statins for preventing progression of diabetes. BMJ. 2010;340:b5087.',
        doi: '10.1136/bmj.b5087',
      },
      {
        cita: 'Ray WA. Evaluating medication effects outside of clinical trials: new-user designs. Am J Epidemiol. 2003;158(9):915–920.',
        doi: '10.1093/aje/kwg181',
        nota: 'Usuarios nuevos vs. prevalentes en exposiciones farmacológicas.',
      },
    ],
  },
  {
    titulo: 'Casos y controles y pareamiento',
    entradas: [
      {
        cita: 'Schulz KF, Grimes DA. Case-control studies: research in reverse. Lancet. 2002;359(9304):431–434.',
        doi: '10.1016/S0140-6736(02)07824-4',
      },
      {
        cita: 'Wacholder S, McLaughlin JK, Silverman DT, Mandel JS. Selection of controls in case-control studies (I. Principles; II. Types of controls; III. Design options). Am J Epidemiol. 1992;135(9):1019–1050.',
        nota: 'La trilogía clásica sobre selección de controles.',
      },
      {
        cita: 'Prentice RL. A case-cohort design for epidemiologic cohort studies and disease prevention trials. Biometrika. 1986;73(1):1–11.',
        doi: '10.1093/biomet/73.1.1',
        nota: 'El diseño caso-cohorte para registros grandes.',
      },
      {
        cita: 'Pearce N. Analysis of matched case-control studies. BMJ. 2016;352:i969.',
        doi: '10.1136/bmj.i969',
      },
      {
        cita: 'Stuart EA. Matching methods for causal inference: a review and a look forward. Stat Sci. 2010;25(1):1–21.',
        doi: '10.1214/09-STS313',
      },
    ],
  },
  {
    titulo: 'Estudios transversales y encuestas',
    entradas: [
      {
        cita: 'Lumley T. Analysis of complex survey samples. J Stat Softw. 2004;9(1):1–19.',
        doi: '10.18637/jss.v009.i08',
        nota: 'Por qué los EE ingenuos fallan con pesos y conglomerados.',
      },
      {
        cita: 'Lumley T. Complex Surveys: A Guide to Analysis Using R. Hoboken: Wiley; 2010.',
      },
      {
        cita: 'Barros AJD, Hirakata VN. Alternatives for logistic regression in cross-sectional studies: an empirical comparison of models that directly estimate the prevalence ratio. BMC Med Res Methodol. 2003;3:21.',
        doi: '10.1186/1471-2288-3-21',
        nota: 'Razón de prevalencias vs. OR de prevalencia.',
      },
      {
        cita: 'Zou G. A modified Poisson regression approach to prospective studies with binary data. Am J Epidemiol. 2004;159(7):702–706.',
        doi: '10.1093/aje/kwh090',
      },
      {
        cita: 'Groves RM. Nonresponse rates and nonresponse bias in household surveys. Public Opin Q. 2006;70(5):646–675.',
        doi: '10.1093/poq/nfl033',
      },
    ],
  },
  {
    titulo: 'Calidad de datos y vigilancia',
    entradas: [
      {
        cita: 'Kahn MG, Callahan TJ, Barnard J, et al. A harmonized data quality assessment terminology and framework. eGEMs. 2016;4(1):1244.',
        doi: '10.13063/2327-9214.1244',
        nota: 'Conformidad, completitud, plausibilidad: la taxonomía de la Parte C1.',
      },
      {
        cita: 'Weiskopf NG, Weng C. Methods and dimensions of electronic health record data quality assessment. J Am Med Inform Assoc. 2013;20(1):144–151.',
      },
      {
        cita: 'Farrington CP, Andrews NJ, Beale AD, Catchpole MA. A statistical algorithm for the early detection of outbreaks. J R Stat Soc A. 1996;159(3):547–563.',
        doi: '10.2307/2983331',
        nota: 'El umbral formal del "dato extraño" de vigilancia.',
      },
      {
        cita: 'Austin PC. Balance diagnostics for comparing the distribution of baseline covariates between treatment groups. Stat Med. 2009;28(25):3083–3107.',
        doi: '10.1002/sim.3697',
        nota: 'Diferencias estandarizadas: la Tabla 1 sin valores p.',
      },
      {
        cita: 'Westreich D, Greenland S. The Table 2 fallacy. Am J Epidemiol. 2013;177(4):292–298.',
        doi: '10.1093/aje/kws412',
        nota: 'Los coeficientes de ajuste no son efectos interpretables.',
      },
      {
        cita: 'Spiegelhalter DJ. Funnel plots for comparing institutional performance. Stat Med. 2005;24(8):1185–1202.',
        doi: '10.1002/sim.1970',
      },
      {
        cita: 'Meyer S, Held L, Höhle M. Spatio-temporal analysis of epidemic phenomena using the R package surveillance. J Stat Softw. 2017;77(11):1–55.',
        doi: '10.18637/jss.v077.i11',
      },
    ],
  },
  {
    titulo: 'Inferencia, reproducibilidad y valores p',
    entradas: [
      {
        cita: 'Gelman A, Loken E. The statistical crisis in science. Am Sci. 2014;102(6):460–465.',
        doi: '10.1511/2014.111.460',
        nota: 'El jardín de los senderos que se bifurcan.',
      },
      {
        cita: 'Wasserstein RL, Lazar NA. The ASA statement on p-values. Am Stat. 2016;70(2):129–133.',
        doi: '10.1080/00031305.2016.1154108',
      },
    ],
  },
  {
    titulo: 'Muestras pequeñas',
    entradas: [
      {
        cita: 'Firth D. Bias reduction of maximum likelihood estimates. Biometrika. 1993;80(1):27–38.',
        doi: '10.1093/biomet/80.1.27',
        nota: 'La penalización de Firth para datos escasos.',
      },
      {
        cita: 'Peduzzi P, Concato J, Kemper E, Holford TR, Feinstein AR. A simulation study of the number of events per variable in logistic regression analysis. J Clin Epidemiol. 1996;49(12):1373–1379.',
        doi: '10.1016/S0895-4356(96)00236-3',
        nota: 'La regla de los 10 eventos por variable.',
      },
      {
        cita: 'van Smeden M, de Groot JAH, Moons KGM, et al. No rationale for 1 variable per 10 events criterion. BMC Med Res Methodol. 2016;16:163.',
        doi: '10.1186/s12874-016-0267-3',
      },
      {
        cita: 'Greenland S, Mansournia MA, Altman DG. Sparse data bias: a problem hiding in plain sight. BMJ. 2016;352:i1981.',
        doi: '10.1136/bmj.i1981',
      },
      {
        cita: 'Rosenbaum PR, Rubin DB. The central role of the propensity score in observational studies for causal effects. Biometrika. 1983;70(1):41–55.',
        doi: '10.1093/biomet/70.1.41',
        nota: 'El resumen de confusores; se presenta como mención.',
      },
      {
        cita: 'Austin PC. An introduction to propensity score methods. Multivariate Behav Res. 2011;46(3):399–424.',
        doi: '10.1080/00273171.2011.568786',
      },
      {
        cita: 'Greenland S. Bayesian perspectives for epidemiological research: I. Foundations. Int J Epidemiol. 2006;35(3):765–775.',
        doi: '10.1093/ije/dyi168',
      },
      {
        cita: 'Gelman A, Jakulin A, Pittau MG, Su Y-S. A weakly informative default prior distribution for logistic and other regression models. Ann Appl Stat. 2008;2(4):1360–1383.',
        doi: '10.1214/08-AOAS191',
      },
      {
        cita: 'Rothman KJ, Greenland S. Planning study size based on precision rather than power. Epidemiology. 2018;29(5):599–603.',
        doi: '10.1097/EDE.0000000000000834',
        nota: 'El hilo de precisión del módulo 5, en su fuente.',
      },
      {
        cita: 'Halpern SD, Karlawish JHT, Berlin JA. The continuing unethical conduct of underpowered clinical trials. JAMA. 2002;288(3):358–362. Sobre la potencia post hoc: Hoenig JM, Heisey DM. The abuse of power. Am Stat. 2001;55(1):19–24.',
        doi: '10.1001/jama.288.3.358',
        nota: 'Por qué un estudio subpotenciado es un problema ético.',
      },
    ],
  },
  {
    titulo: 'Sesgos y análisis de sensibilidad',
    entradas: [
      {
        cita: 'Lash TL, Fox MP, Fink AK. Applying Quantitative Bias Analysis to Epidemiologic Data. New York: Springer; 2009. (2.ª ed.: Fox MP, MacLehose RF, Lash TL; 2021.)',
        nota: 'El manual del análisis de sesgo cuantitativo.',
      },
      {
        cita: 'Greenland S. Basic methods for sensitivity analysis of biases. Int J Epidemiol. 1996;25(6):1107–1116.',
        doi: '10.1093/ije/25.6.1107',
      },
      {
        cita: 'Harris PA, Taylor R, Thielke R, Payne J, Gonzalez N, Conde JG. Research electronic data capture (REDCap). J Biomed Inform. 2009;42(2):377–381.',
        doi: '10.1016/j.jbi.2008.08.010',
      },
      {
        cita: 'VanderWeele TJ, Ding P. Sensitivity analysis in observational research: introducing the E-value. Ann Intern Med. 2017;167(4):268–274.',
        doi: '10.7326/M16-2607',
        nota: 'Qué tan fuerte tendría que ser un confusor para anular el efecto.',
      },
    ],
  },
  {
    titulo: 'Causalidad gráfica y simulación',
    entradas: [
      {
        cita: 'Greenland S, Pearl J, Robins JM. Causal diagrams for epidemiologic research. Epidemiology. 1999;10(1):37–48.',
        doi: '10.1093/ije/10.1.37',
      },
      {
        cita: 'Textor J, van der Zander B, Gilthorpe MS, Liśkiewicz M, Ellison GTH. Robust causal inference using directed acyclic graphs: the R package dagitty. Int J Epidemiol. 2016;45(6):1887–1894.',
        doi: '10.1093/ije/dyw341',
      },
      {
        cita: 'Morris TP, White IR, Crowther MJ. Using simulation studies to evaluate statistical methods. Stat Med. 2019;38(11):2074–2102.',
        doi: '10.1002/sim.8086',
        nota: 'Las buenas prácticas del laboratorio de verdad conocida.',
      },
    ],
  },
  {
    titulo: 'Ética y normativa (Colombia)',
    nota: 'Verificar siempre el texto vigente en el sitio oficial de MinSalud o de la Secretaría del Senado.',
    entradas: [
      {
        cita: 'Emanuel EJ, Wendler D, Grady C. What makes clinical research ethical? JAMA. 2000;283(20):2701–2711.',
        doi: '10.1001/jama.283.20.2701',
        nota: 'Los siete requisitos de la investigación ética.',
      },
      {
        cita: 'Council for International Organizations of Medical Sciences (CIOMS). International Ethical Guidelines for Health-related Research Involving Humans. Ginebra: CIOMS; 2016.',
      },
      {
        cita: 'Asociación Médica Mundial. Declaración de Helsinki: principios éticos para la investigación médica con participantes humanos (versión vigente).',
        nota: 'Enlace en la sección de recursos abajo.',
      },
      {
        cita: 'Ministerio de Salud de Colombia. Resolución 8430 de 1993: normas científicas, técnicas y administrativas para la investigación en salud.',
        nota: 'Clasificación del riesgo: sin riesgo, riesgo mínimo, mayor que mínimo.',
      },
      {
        cita: 'Congreso de la República de Colombia. Ley Estatutaria 1581 de 2012: disposiciones generales para la protección de datos personales.',
        nota: 'Los datos de salud son datos sensibles.',
      },
      {
        cita: 'Presidencia de la República de Colombia. Decreto 1377 de 2013: reglamentación parcial de la Ley 1581 de 2012.',
      },
    ],
  },
  {
    titulo: 'Datos del curso',
    entradas: [
      {
        cita: 'Kalbfleisch JD, Prentice RL. The Statistical Analysis of Failure Time Data. 2.ª ed. Hoboken: Wiley; 2002.',
        nota: 'Fuente del ensayo VA de cáncer de pulmón (VALUNG).',
      },
      {
        cita: 'Rossi PH, Berk RA, Lenihan KJ. Money, Work, and Crime: Experimental Evidence. New York: Academic Press; 1980.',
        nota: 'Fuente de RECID: 432 exconvictos seguidos 52 semanas.',
      },
      {
        cita: 'Salazar Uribe JC. Análisis Estadístico de Datos Epidemiológicos: notas de clase, scripts R y SAS. Curso ADEI, Escuela de Estadística, UNAL Medellín; 2025.',
        nota: 'Las 24 clases del profesor, origen de datos y ejemplos.',
      },
    ],
  },
];

export interface Enlace {
  nombre: string;
  url: string;
  nota: string;
}

/** Enlaces institucionales estables (normas, guías de reporte, software). */
export const ENLACES: { titulo: string; items: Enlace[] }[] = [
  {
    titulo: 'Guías de reporte',
    items: [
      {
        nombre: 'STROBE statement',
        url: 'https://www.strobe-statement.org',
        nota: 'Listas de verificación para cohorte, casos y controles y transversal.',
      },
      {
        nombre: 'EQUATOR Network',
        url: 'https://www.equator-network.org',
        nota: 'El repositorio de todas las guías de reporte en salud.',
      },
    ],
  },
  {
    titulo: 'Ética y normativa',
    items: [
      {
        nombre: 'Informe Belmont (HHS/OHRP)',
        url: 'https://www.hhs.gov/ohrp/regulations-and-policy/belmont-report/',
        nota: 'Respeto por las personas, beneficencia y justicia.',
      },
      {
        nombre: 'Declaración de Helsinki (WMA)',
        url: 'https://www.wma.net/policies-post/wma-declaration-of-helsinki/',
        nota: 'Versión vigente de los principios para investigación médica.',
      },
      {
        nombre: 'Ley 1581 de 2012 (Secretaría del Senado)',
        url: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html',
        nota: 'Texto oficial de la protección de datos personales.',
      },
      {
        nombre: 'Decreto 1377 de 2013 (Secretaría del Senado)',
        url: 'https://www.secretariasenado.gov.co/senado/basedoc/decreto_1377_2013.html',
        nota: 'Reglamentación de la Ley 1581.',
      },
      {
        nombre: 'Estudio Tuskegee (CDC)',
        url: 'https://www.cdc.gov/tuskegee/',
        nota: 'Cronología oficial del estudio que el módulo 1 analiza.',
      },
    ],
  },
  {
    titulo: 'Herramientas',
    items: [
      {
        nombre: 'DAGitty',
        url: 'https://dagitty.net',
        nota: 'Dibujar DAGs y verificar qué conjunto ajusta la confusión.',
      },
      {
        nombre: 'R Project',
        url: 'https://www.r-project.org',
        nota: 'El motor de las celdas del curso.',
      },
      {
        nombre: 'webR',
        url: 'https://docs.r-wasm.org/webr/latest/',
        nota: 'R compilado a WebAssembly: así corre R en tu navegador.',
      },
    ],
  },
];
