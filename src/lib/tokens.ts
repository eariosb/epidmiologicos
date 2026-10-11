/**
 * Tokens semánticos para contextos donde las clases Tailwind no llegan:
 * series de SVG, atributos fill/stroke, objetos style en JSX.
 * Cada valor es el hex EXACTO que usaba el componente antes de la
 * migración — la fase 5 no cambia ni un píxel.
 */
export const tokens = {
  /** Series y elementos de los gráficos SVG de los simuladores. */
  chart: {
    /** Serie principal / primer procedimiento (Fisher, curva azul). */
    primary: '#4C72B0',
    /** Segundo procedimiento (Boschloo, curva naranja). */
    secondary: '#DD8452',
    /** Tercer procedimiento (z agrupada, curva verde). */
    tertiary: '#55A868',
    /** Discordancia / alerta en el mapa de decisiones. */
    alert: '#C44E52',
    /** Curva de sesgo² en el explorador de correcciones. */
    bias: '#b2182b',
    /** Curva de varianza en el explorador de correcciones. */
    variance: '#2166ac',
    /** Serie auxiliar (Jeffreys / cuarta serie). */
    aux: '#8172B3',
    /** Texto y ejes. */
    axis: '#111827',
    title: '#4b5563',
    text: '#6b7280',
    tick: '#9ca3af',
    /** Rejillas y bordes. */
    grid: '#e5e7eb',
    gridSoft: '#f3f4f6',
    border: '#d1d5db',
    borderSoft: '#cbd5e1',
    deep: '#374151',
  },
  /** Estados semánticos en contextos inline (no clase). */
  status: {
    danger: '#dc2626',
    dangerText: '#b91c1c',
    dangerMid: '#f87171',
    dangerSoft: '#fecaca',
    info: '#0284c7',
    infoSoft: '#38bdf8',
    ok: '#16a34a',
    okSoft: '#86efac',
    warning: '#b45309',
  },
  /** Otros colores de UI usados inline. */
  ui: {
    codeBg: '#1e1e2e',
    surface: '#ffffff',
    cursor: '#2c7a7b',
    boardWood: '#937860',
    ink: '#111111',
  },
} as const;
