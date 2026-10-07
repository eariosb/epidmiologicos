import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/Footer';
import { WebRProvider } from '@/components/WebRProvider';
import { BlackboardProvider } from '@cursos/blackboard';
import { ThemeSync } from '@/components/ThemeSync';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Procesos Estocásticos con Introducción a las EDE | Curso Interactivo',
  description:
    'Curso interactivo de procesos estocásticos con introducción a las ecuaciones diferenciales estocásticas, con R: cadenas de Markov, procesos estacionarios y gaussianos, movimiento browniano, integral de Itô, proceso de Poisson, difusiones y procesos de Lévy. Universidad Nacional de Colombia, sede Medellín.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <WebRProvider>
          <BlackboardProvider>
            <ThemeSync />
            {children}
          </BlackboardProvider>
        </WebRProvider>
        <Footer />
      </body>
    </html>
  );
}
