'use client';

// /unirse — punto de entrada de la prueba de campo.
// El docente reparte códigos (PC-XXXX) o links /unirse?code=PC-XXXX.
// Flujo: validar código → consentimiento → pre-test (opcional) → al curso.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ConsentGate } from '@/components/ConsentGate';
import { FeedbackForm } from '@/components/FeedbackForm';
import { PRETEST_ITEMS } from '@/lib/survey-items';

const COURSE_NAME = 'Análisis Estadístico de Datos Epidemiológicos';
// 'Procesos Estocásticos con Introducción a las EDE' en el otro repo

type Step =
  | { kind: 'code' }
  | { kind: 'consent'; token: string; code: string; consentVersion: string }
  | { kind: 'pretest' }
  | { kind: 'ready' };

function UnirseInner() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>({ kind: 'code' });
  const [code, setCode] = useState(params.get('code') ?? params.get('token') ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError('Código no reconocido — revísalo con tu docente.');
        return;
      }
      setStep({ kind: 'consent', token: data.token, code: data.code, consentVersion: data.consentVersion });
    } catch {
      setError('No se pudo validar — revisa tu conexión.');
    } finally {
      setBusy(false);
    }
  };

  if (step.kind === 'consent') {
    return (
      <ConsentGate
        courseName={COURSE_NAME}
        token={step.token}
        participantCode={step.code}
        onDone={(consented) => setStep(consented ? { kind: 'pretest' } : { kind: 'ready' })}
      />
    );
  }

  if (step.kind === 'pretest') {
    return (
      <div className="mx-auto max-w-2xl px-4">
        <FeedbackForm
          instrument="pretest"
          items={PRETEST_ITEMS}
          title="Antes de empezar (4 minutos)"
          intro="Este pre-test nos ayuda a interpretar tus respuestas finales. Es anónimo."
          submitLabel="Enviar y continuar"
          onSubmitted={() => setStep({ kind: 'ready' })}
        />
        <button
          type="button"
          onClick={() => setStep({ kind: 'ready' })}
          className="mb-8 text-xs text-ink-400 underline decoration-dotted hover:text-ink-600"
        >
          Omitir por ahora — puedo responderla luego
        </button>
      </div>
    );
  }

  if (step.kind === 'ready') {
    return (
      <div className="mx-auto my-16 max-w-md text-center">
        <p className="text-4xl">🧪</p>
        <h1 className="mt-3 text-xl font-bold text-ink-900">Listo — ya puedes explorar el curso</h1>
        <p className="mt-2 text-sm text-ink-600">
          Al final de cada módulo encontrarás una encuesta de 60 segundos.
          Desde <Link href="/privacidad" className="underline">privacidad</Link> puedes
          revisar tus datos o retirarte cuando quieras.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Ir al curso →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto my-16 max-w-md rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink-900">Únete a la prueba de campo</h1>
      <p className="mt-2 text-sm text-ink-600">
        Escribe el código de participante que te dio el docente (p. ej.{' '}
        <code>PC-4821</code>). Si no tienes código, el curso funciona igual sin registro.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submitCode();
        }}
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="PC-XXXX"
          className="flex-1 rounded border border-ink-200 px-3 py-2 text-sm uppercase focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Validando…' : 'Entrar'}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-danger-600" role="alert">{error}</p>}
      <p className="mt-4 text-xs text-ink-400">
        <Link href="/" className="underline">Explorar el curso sin participar →</Link>
      </p>
    </div>
  );
}

export default function UnirsePage() {
  return (
    <Suspense>
      <UnirseInner />
    </Suspense>
  );
}
