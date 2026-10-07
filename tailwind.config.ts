import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Sistema de diseño heredado de los cursos interactivos UNAL (paleta `ink`
 * de grises, tipografía Inter, radios 0.5rem, animaciones sutiles), con el
 * acento en violeta profundo (#5b21b6 / #4c1d95) como identidad del curso
 * de Procesos Estocásticos (accent-700 = color base). El verde #2e7d32 se
 * reserva como color de éxito (`positive`).
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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in': {
          from: { transform: 'translateX(-8px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [typography],
};

export default config;
