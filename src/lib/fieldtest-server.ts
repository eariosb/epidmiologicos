// Server-side helpers para la prueba de campo (route handlers únicamente).
// Especificación: prueba-campo/docs/02-esquema-supabase.md y 03-telemetria.md.
//
// IMPORTANTE: este archivo usa SUPABASE_SERVICE_ROLE_KEY: jamás importar
// desde un client component.

import { createClient } from '@supabase/supabase-js';

export const CONSENT_VERSION = 'v1-2026-10';

// Cliente service role apuntando al esquema fieldtest.
// Requiere que el esquema esté expuesto en la config de PostgREST.
export function fieldtestClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('fieldtest: faltan credenciales Supabase');
  return createClient(url, key, {
    db: { schema: 'fieldtest' },
    auth: { persistSession: false },
  });
}

export interface Participant {
  id: string;
  code: string;
  course: string;
  withdrawn_at: string | null;
  content_opt_in: boolean;
}

/** Resuelve un participante por su enroll_token. null si no existe o se retiró. */
export async function participantByToken(
  token: string,
): Promise<Participant | null> {
  const { data } = await fieldtestClient()
    .from('participants')
    .select('id, code, course, withdrawn_at, content_opt_in')
    .eq('enroll_token', token)
    .maybeSingle();
  if (!data || data.withdrawn_at) return null;
  return data as Participant;
}

/** Rate limit por ventana horaria; devuelve el total de hits. */
export async function rateHit(key: string): Promise<number> {
  const { data, error } = await fieldtestClient().rpc('rate_hit', { p_key: key });
  if (error || typeof data !== 'number') return 0; // fail-open: no bloquear por un fallo del contador
  return data;
}

/** Mejor esfuerzo de IP para rate limiting (Vercel la propaga en x-forwarded-for). */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
