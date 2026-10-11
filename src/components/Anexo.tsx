import Link from 'next/link';
import { FileText } from 'lucide-react';
import { getAnexo } from '@/lib/anexos';
import type { ReactNode } from 'react';

interface AnexoProps {
  id: string;
  children?: ReactNode;
}

/**
 * Enlace inline a un anexo del curso. Si el id no existe en el manifiesto,
 * renderiza el texto sin enlace (falla visible en desarrollo).
 */
export function Anexo({ id, children }: AnexoProps) {
  const anexo = getAnexo(id);
  if (!anexo) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Anexo] id desconocido: ${id}`);
    }
    return <>{children ?? id}</>;
  }
  return (
    <Link
      href={`/anexos#${anexo.id}`}
      className="inline-flex items-baseline gap-1 font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition-colors hover:text-brand-800 hover:decoration-brand-500"
    >
      <FileText className="h-3.5 w-3.5 translate-y-0.5 shrink-0" aria-hidden />
      {children ?? anexo.titulo}
    </Link>
  );
}
