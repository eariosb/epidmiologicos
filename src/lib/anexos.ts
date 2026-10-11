import { z } from 'zod';

/**
 * Manifiesto de anexos del curso. Cada entrada apunta a un archivo servido
 * desde /anexos (public/anexos). Regla dura del plan de implementación:
 * NINGÚN material de terceros se publica sin `permiso` — por eso el campo
 * es obligatorio para TODAS las entradas y `tercero` exige `licencia`.
 */

export const ANEXO_TIPOS = ['pdf', 'script', 'documento', 'figura', 'datos'] as const;
export const ANEXO_PERMISOS = ['autor-curso', 'material-docente', 'tercero'] as const;

const anexoSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().min(1),
    descripcion: z.string().min(1),
    tipo: z.enum(ANEXO_TIPOS),
    /** Ruta pública bajo /anexos/ (ej. "ensayo-test-exacto-fisher.pdf"). */
    archivo: z.string().min(1),
    modulo: z.string().optional(),
    autores: z.string().optional(),
    anio: z.number().int().optional(),
    permiso: z.enum(ANEXO_PERMISOS),
    /** Obligatoria cuando permiso === 'tercero'. */
    licencia: z.string().optional(),
  })
  .refine((a) => a.permiso !== 'tercero' || !!a.licencia, {
    message: 'los anexos de terceros requieren el campo licencia',
  });

export type Anexo = z.infer<typeof anexoSchema>;

const RAW_ANEXOS: unknown[] = [
  {
    id: 'ensayo-test-exacto',
    titulo: 'El test exacto de Fisher en investigación biomédica',
    descripcion:
      'Ensayo técnico del curso: a partir del ensayo de Perondi et al. (2004) examina, desde la estadística, la historia, la filosofía, la sociología y la ética, qué se decide al elegir un test para una tabla 2×2. Tesis: la elección fija qué diferencia llega a ser un hecho y debe tomarse a la vista.',
    tipo: 'pdf',
    archivo: 'ensayo-test-exacto-fisher.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'ensayo-test-exacto-md',
    titulo: 'El test exacto de Fisher — versión en texto',
    descripcion:
      'El mismo ensayo en formato Markdown, indexable por el corpus del asistente y accesible sin lector de PDF.',
    tipo: 'documento',
    archivo: 'ensayo-test-exacto-fisher.md',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'auditoria-perondi',
    titulo: 'Auditoría independiente de las cifras de Perondi (2004)',
    descripcion:
      'Recálculo desde cero en Python/SciPy —sin exact2x2 ni Exact— del Fisher bilateral, Boschloo, CSM, tamaños y potencias del caso Perondi: la verificación externa de los números del módulo 6.',
    tipo: 'documento',
    archivo: 'auditoria-perondi.md',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'simulacion3',
    titulo: 'simulacion3.R — simulación de la batería de tests 2×2',
    descripcion:
      'Script R del ensayo técnico: reproduce la comparación de procedimientos (Fisher, mid-p, Boschloo, CSM, z) sobre el espacio de tablas, incluyendo la grilla de supremo sobre el parámetro de estorbo.',
    tipo: 'script',
    archivo: 'simulacion3.R',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'sesgo-varianza',
    titulo: 'sesgo_varianza.R — trade-off sesgo/varianza de las correcciones',
    descripcion:
      'Script R del ensayo técnico: cuantifica cómo las correcciones por cero (½, 1) mueven el OR puntual y sus ICs, y la relación sesgo-varianza de cada corrector.',
    tipo: 'script',
    archivo: 'sesgo-varianza.R',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'resultados-sesgo-varianza',
    titulo: 'Resultados de la simulación sesgo-varianza',
    descripcion:
      'Salida tabulada de sesgo_varianza.R: cobertura y corrección del OR bajo distintos correctores de cero.',
    tipo: 'datos',
    archivo: 'resultados-sesgo-varianza.txt',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-superficie-potencia',
    titulo: 'Superficie de potencia por procedimiento',
    descripcion:
      'Figura del ensayo: potencia de cada procedimiento sobre la grilla de tasas alternativas (p1, p2).',
    tipo: 'figura',
    archivo: 'figuras/fig_superficie_potencia.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-error-tipo1',
    titulo: 'Error tipo I real por procedimiento',
    descripcion:
      'Figura del ensayo: tamaño real de cada test bajo H0 — el diente de sierra del condicional frente a los incondicionales.',
    tipo: 'figura',
    archivo: 'figuras/fig_error_tipo1.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-discordancia-heatmap',
    titulo: 'Mapa de discordancia entre procedimientos',
    descripcion:
      'Figura del ensayo: regiones de la tabla donde Fisher y los incondicionales discrepan en el veredicto.',
    tipo: 'figura',
    archivo: 'figuras/fig_discordancia_heatmap.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-discordancia-vs-n',
    titulo: 'Discordancia en función del tamaño muestral',
    descripcion:
      'Figura del ensayo: cómo decae la probabilidad de veredictos opuestos cuando crece n.',
    tipo: 'figura',
    archivo: 'figuras/fig_discordancia_vs_n.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-sv-cobertura',
    titulo: 'Cobertura del IC del OR por corrector de cero',
    descripcion:
      'Figura del ensayo: cobertura simulada de los intervalos de Woolf con correcciones 0, ½ y 1.',
    tipo: 'figura',
    archivo: 'figuras/fig_sv_cobertura.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'fig-sv-correccion',
    titulo: 'Efecto de la corrección por cero sobre el OR',
    descripcion:
      'Figura del ensayo: desplazamiento del OR puntual y de sus ICs según el corrector elegido.',
    tipo: 'figura',
    archivo: 'figuras/fig_sv_correccion.pdf',
    modulo: '06-inferencia-exacta-calibracion',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
  {
    id: 'ciudad-simulada',
    titulo: 'ciudad_simulada.R — la ciudad de Simépolis con verdad conocida',
    descripcion:
      'Generador de la población sintética del módulo 2: 20 000 habitantes con confusor sembrado (RR causal = 3 dentro de cada estrato, RR crudo inflado) y un colisionador (hospitalización) para el ejercicio de controles hospitalarios. Es el mismo mecanismo que corre CityLab en el navegador.',
    tipo: 'script',
    archivo: 'ciudad_simulada.R',
    modulo: '02-mapa-disenos-causalidad',
    autores: 'Ríos, E.',
    anio: 2026,
    permiso: 'autor-curso',
  },
];

export const ANEXOS: Anexo[] = RAW_ANEXOS.map((a) => anexoSchema.parse(a));

export function getAnexo(id: string): Anexo | undefined {
  return ANEXOS.find((a) => a.id === id);
}
