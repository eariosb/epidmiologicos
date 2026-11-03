import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { WebRProvider } from '@/components/WebRProvider';
import { BlackboardProvider } from '@cursos/blackboard';
import TelemetryGate from '@/components/TelemetryGate';
import { LAYOUT_BOOT_SCRIPT } from '@/lib/layout-prefs';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-display', style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Análisis Estadístico de Datos Epidemiológicos | Curso Interactivo',
  description:
    'Curso interactivo de análisis de datos epidemiológicos con R en el navegador: medidas de asociación, confusión e interacción, cohortes y supervivencia, casos y controles, y cuantificación de incertidumbre. Basado en Woodward, Epidemiology: Study Design and Data Analysis. Universidad Nacional de Colombia, sede Medellín.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        {/* Aplica los menús plegados antes del primer pintado. */}
        <script dangerouslySetInnerHTML={{ __html: LAYOUT_BOOT_SCRIPT }} />
        <WebRProvider>
          <BlackboardProvider>
            <TelemetryGate>{children}</TelemetryGate>
          </BlackboardProvider>
        </WebRProvider>
        <Footer />
      </body>
    </html>
  );
}
