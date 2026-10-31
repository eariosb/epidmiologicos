import { FinalSurvey } from '@/components/FinalSurvey';

export const metadata = {
  title: 'Encuesta final — Prueba de campo',
};

export default function EncuestaFinalPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink-900">Cierre de la prueba de campo</h1>
      <p className="mt-2 text-sm text-ink-600">
        Gracias por participar. Esta encuesta es la última pieza: tus respuestas
        se cruzan (de forma anónima) con el registro de uso para decidir qué
        mejorar del curso.
      </p>
      <FinalSurvey />
      <p className="mt-2 text-xs text-ink-400">
        Si no estás participando en la prueba de campo, esta página no registra nada.
      </p>
    </main>
  );
}
