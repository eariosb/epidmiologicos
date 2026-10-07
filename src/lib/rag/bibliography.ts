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
 * Canonical references for the stochastic-processes course. These are the
 * ONLY bibliography sources the assistant may cite as [bib:*] — anything
 * else is sanitized to [referencia no verificada].
 *
 * Texto guía: Giraldo Gómez (notas de clase del profesor, con R). Apoyos:
 * Ross y Lawler. Las entradas de software documentan los paquetes de R
 * usados en los laboratorios.
 */
export const BIBLIOGRAPHY: BibEntry[] = [
  {
    id: 'giraldo-2026',
    title:
      'Procesos estocásticos, con una introducción a las ecuaciones diferenciales estocásticas, con R',
    authors: 'Giraldo Gómez, N.D.',
    year: 2026,
    venue: 'Notas de clase, Escuela de Estadística, Universidad Nacional de Colombia, Medellín',
    summary:
      'Texto guía del curso. Cap. 2: procesos estacionarios, procesos de segundo orden, autocovarianza, ruido blanco y representación de Wold, con el proceso de ramificación Galton-Watson como ejemplo introductorio (simulación, esperanza y varianza, evento de extinción). Cap. 3: procesos gaussianos, cálculo en media cuadrática, EDO aleatorias (RODE), esquemas de Euler y Heun, fórmulas de Rice y Durbin, descomposición de Karhunen-Loève. Cap. 4: proceso de Wiener, integral de Itô, diferenciales estocásticos, EDE lineales (ruido aditivo y multiplicativo), modelo Vasicek y valoración de bonos, Stratonovich, C-ARMA, uso de YUIMA y Sim.DiffProc. Cap. 5: proceso de Poisson homogéneo y no homogéneo, integral con respecto al Poisson, proceso Poisson compuesto, EDE con PPC compensado, difusiones con saltos y lema de Itô con saltos. Cap. 6: procesos de difusión, ecuación de Fokker-Planck, distribuciones estacionarias, tiempos de primer arribo a una barrera (fptdApprox). Cap. 7: procesos con incrementos independientes, procesos de Lévy, distribuciones infinitamente divisibles y estables, Lévy-NIG, modelo de embalses en tiempo continuo, fórmulas de Rice, Durbin y arco-seno.',
  },
  {
    id: 'ross-1996',
    title: 'Stochastic Processes',
    authors: 'Ross, S.M.',
    year: 1996,
    venue: 'John Wiley & Sons, 2ª edición',
    isbn: '978-0-471-12062-9',
    summary:
      'Texto clásico de apoyo. Cadenas de Markov en tiempo discreto y continuo (Chapman-Kolmogorov, clasificación de estados, tiempos de primera visita, distribuciones estacionarias y límites), proceso de Poisson y sus generalizaciones (no homogéneo, compuesto, condicionamiento), teoría de renovación, martingalas y el teorema de paro opcional, movimiento browniano y sus propiedades, introducción a la valoración con opciones. Base para los módulos de cadenas de Markov, Poisson y Browniano.',
  },
  {
    id: 'lawler-2006',
    title: 'Introduction to Stochastic Processes',
    authors: 'Lawler, G.F.',
    year: 2006,
    venue: 'Chapman & Hall/CRC, 2ª edición',
    isbn: '978-1-58488-651-8',
    summary:
      'Apoyo introductorio y riguroso. Repaso de probabilidad con medida y esperanza condicional, cadenas de Markov discretas y continuas con martingalas asociadas, movimiento browniano como límite de caminatas aleatorias y su construcción, procesos estacionarios, una introducción medible pero accesible al cálculo estocástico de Itô y a las ecuaciones diferenciales estocásticas. Fuente para las demostraciones ligeras del curso.',
  },
  {
    id: 'R-Sim.DiffProc',
    title: 'Sim.DiffProc: Simulation of Diffusion Processes (R package)',
    authors: 'Guidoum, V.; Boukhetala, K.',
    year: 2024,
    venue: 'CRAN',
    summary:
      'Paquete R para simular trayectorias de ecuaciones diferenciales estocásticas por esquemas de discretización (Euler-Maruyama, Milstein, predictor-corrector), dibujar trayectorias y calcular momentos teóricos de EDE conocidas (OU, GBM, Vasicek). Usado en los laboratorios de ruido Wiener y multiplicativo.',
  },
  {
    id: 'R-yuima',
    title: 'The YUIMA Project: A Computational Framework for SDE and Lévy Processes (R package)',
    authors: 'Brouste, A. et al.',
    year: 2024,
    venue: 'CRAN',
    summary:
      'Framework R para especificar, simular e inferir ecuaciones diferenciales estocásticas con ruido Wiener y de Lévy: definición de modelos (setModel), simulación (simulate) y qp de difusiones. Referencia de los laboratorios avanzados de EDE del texto guía.',
  },
  {
    id: 'R-sde',
    title: 'sde: Simulation and Inference for Stochastic Differential Equations (R package)',
    authors: 'Iacus, S.M.',
    year: 2023,
    venue: 'CRAN',
    summary:
      'Paquete clásico de Iacus para simulación e inferencia estadística de EDE: densidades transicionales de OU y CIR, esquemas de Euler-Maruyama y simulación exacta cuando está disponible, aproximaciones de Kessler y local linearization para la inferencia, y pruebas para detectar saltos. Apoyo directo a los módulos de EDE y Fokker-Planck.',
  },
  {
    id: 'R-fptdApprox',
    title: 'fptdApprox: Approximation of First-Passage-Time Densities (R package)',
    authors: 'Román-Román, P.; Serrano-Pérez, J.J.; Torres-Ruiz, F.',
    year: 2023,
    venue: 'CRAN',
    summary:
      'Paquete R que aproxima numéricamente la densidad del tiempo de primer paso de una difusión a una barrera. Usado en el módulo de tiempos de primer arribo del texto guía (cap. 6).',
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
