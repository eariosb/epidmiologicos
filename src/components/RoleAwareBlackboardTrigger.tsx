'use client';

import { GraduationCap } from 'lucide-react';
import { BlackboardTrigger } from '@cursos/blackboard';
import { useBroadcast } from '@/hooks/useBroadcast';

/**
 * Disparador de la pizarra según el rol de la pestaña. El modo se guarda en
 * `localStorage`, así que un cambio accidental a estudiante dejaba al docente
 * sin botón y sin forma visible de volver: ahora el modo estudiante muestra
 * una píldora que restaura el modo docente y con él el disparador.
 */
export function RoleAwareBlackboardTrigger() {
  const { mode, setTeacherMode } = useBroadcast();

  if (mode === 'student') {
    return (
      <button
        type="button"
        onClick={setTeacherMode}
        title="Esta pestaña está en modo estudiante. Vuelve a docente para abrir la pizarra."
        className="bb-role-pill fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-ink-300 bg-ink-100 px-4 py-2 text-sm font-medium text-ink-700 shadow-lg transition-all hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      >
        <GraduationCap aria-hidden className="h-4 w-4" />
        <span>Modo estudiante · volver a docente</span>
      </button>
    );
  }

  return <BlackboardTrigger />;
}
