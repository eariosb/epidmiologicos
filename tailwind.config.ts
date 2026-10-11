import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Sistema de diseño heredado de los cursos interactivos UNAL (paleta `ink`
 * de grises, tipografía Inter, radios 0.5rem, animaciones sutiles), con el
 * acento en verde azulado #2aa9a3 como identidad del curso de Epidemiología
 * (accent-500 = color base). El verde #2e7d32 se reserva como éxito.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/content/**/*.{ts,tsx,mdx}',
    // El paquete workspace @cursos/blackboard trae sus propias clases
    // Tailwind — sin esta entrada sus clases no generarían CSS.
    './packages/blackboard/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eafaf9',
          100: '#d0f3f1',
          200: '#a3e6e3',
          300: '#6fd5d2',
          400: '#3fc2be',
          500: '#2aa9a3',
          600: '#209089',
          700: '#1d7670',
          800: '#185d58',
          900: '#123f3c',
        },
        ink: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
        positive: {
          50: '#e8f5e9',
          500: '#2e7d32',
          700: '#1b5e20',
        },
        /* ----------------------------------------------------------
         * Tokens semánticos (fase 5): los valores viven en
         * globals.css como canales RGB (--rol-tono). Los nombres
         * describen el PAPEL del color, no su apariencia, para que
         * futuras fases (sistema visual, modo oscuro) redefinan la
         * variable y no cada uso.
         * brand → identidad del curso · warning → cautelas
         * danger → rechazo/error · success → favorable/meta
         * info → resaltado neutral · code → fondo de código
         * Tonos interpolados (55…715): hex heredados de positive,
         * green y rose preservados bit a bit.
         * ---------------------------------------------------------- */
        brand: {
          50: 'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          300: 'rgb(var(--brand-300) / <alpha-value>)',
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          800: 'rgb(var(--brand-800) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        warning: {
          50: 'rgb(var(--warning-50) / <alpha-value>)',
          100: 'rgb(var(--warning-100) / <alpha-value>)',
          200: 'rgb(var(--warning-200) / <alpha-value>)',
          300: 'rgb(var(--warning-300) / <alpha-value>)',
          400: 'rgb(var(--warning-400) / <alpha-value>)',
          500: 'rgb(var(--warning-500) / <alpha-value>)',
          600: 'rgb(var(--warning-600) / <alpha-value>)',
          700: 'rgb(var(--warning-700) / <alpha-value>)',
          800: 'rgb(var(--warning-800) / <alpha-value>)',
          900: 'rgb(var(--warning-900) / <alpha-value>)',
        },
        danger: {
          50: 'rgb(var(--danger-50) / <alpha-value>)',
          100: 'rgb(var(--danger-100) / <alpha-value>)',
          200: 'rgb(var(--danger-200) / <alpha-value>)',
          300: 'rgb(var(--danger-300) / <alpha-value>)',
          400: 'rgb(var(--danger-400) / <alpha-value>)',
          500: 'rgb(var(--danger-500) / <alpha-value>)',
          600: 'rgb(var(--danger-600) / <alpha-value>)',
          650: 'rgb(var(--danger-650) / <alpha-value>)',
          700: 'rgb(var(--danger-700) / <alpha-value>)',
          800: 'rgb(var(--danger-800) / <alpha-value>)',
          900: 'rgb(var(--danger-900) / <alpha-value>)',
        },
        success: {
          50: 'rgb(var(--success-50) / <alpha-value>)',
          55: 'rgb(var(--success-55) / <alpha-value>)',
          100: 'rgb(var(--success-100) / <alpha-value>)',
          105: 'rgb(var(--success-105) / <alpha-value>)',
          200: 'rgb(var(--success-200) / <alpha-value>)',
          300: 'rgb(var(--success-300) / <alpha-value>)',
          400: 'rgb(var(--success-400) / <alpha-value>)',
          405: 'rgb(var(--success-405) / <alpha-value>)',
          500: 'rgb(var(--success-500) / <alpha-value>)',
          505: 'rgb(var(--success-505) / <alpha-value>)',
          515: 'rgb(var(--success-515) / <alpha-value>)',
          600: 'rgb(var(--success-600) / <alpha-value>)',
          700: 'rgb(var(--success-700) / <alpha-value>)',
          705: 'rgb(var(--success-705) / <alpha-value>)',
          715: 'rgb(var(--success-715) / <alpha-value>)',
          800: 'rgb(var(--success-800) / <alpha-value>)',
          900: 'rgb(var(--success-900) / <alpha-value>)',
        },
        info: {
          50: 'rgb(var(--info-50) / <alpha-value>)',
          100: 'rgb(var(--info-100) / <alpha-value>)',
          200: 'rgb(var(--info-200) / <alpha-value>)',
          300: 'rgb(var(--info-300) / <alpha-value>)',
          400: 'rgb(var(--info-400) / <alpha-value>)',
          500: 'rgb(var(--info-500) / <alpha-value>)',
          600: 'rgb(var(--info-600) / <alpha-value>)',
          700: 'rgb(var(--info-700) / <alpha-value>)',
          800: 'rgb(var(--info-800) / <alpha-value>)',
          900: 'rgb(var(--info-900) / <alpha-value>)',
        },
        code: 'rgb(var(--code) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      /* ----------------------------------------------------------
       * Movimiento (fase 7): una sola curva ease-out tipo "expo"
       * para todo lo interactivo; duraciones cortas (150–250ms) y
       * solo transform/opacity. prefers-reduced-motion se respeta
       * en globals.css.
       * ---------------------------------------------------------- */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in': {
          from: { transform: 'translateX(-8px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [typography],
};

export default config;
