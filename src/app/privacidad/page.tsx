import { PrivacyToggle } from '@/components/PrivacyToggle';

export const metadata = {
  title: 'Privacidad · Prueba de campo',
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink-900">Privacidad y consentimiento</h1>
      <p className="mt-2 text-sm text-ink-600">
        Aquí controlas el registro de la prueba de campo: puedes ver todo lo
        que está guardado sobre tu código, ajustar qué se registra y retirarte
        por completo (el retiro borra tu actividad del servidor).
      </p>
      <div className="mt-6">
        <PrivacyToggle />
      </div>
    </main>
  );
}
