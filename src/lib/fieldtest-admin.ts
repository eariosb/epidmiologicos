// Verificación de instructor para el tablero docente (Sprint 5).
// El docente se autentica con un token opaco definido en
// FIELDTEST_ADMIN_TOKEN (env de servidor, nunca commiteado). Va en el
// header `x-admin-token`. Comparación timing-safe vía hash.

import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

export function isAdmin(req: Request): boolean {
  const expected = process.env.FIELDTEST_ADMIN_TOKEN;
  if (!expected) return false;
  const got = req.headers.get('x-admin-token') ?? '';
  if (!got) return false;
  const a = createHash('sha256').update(got).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Respuesta estándar cuando el token falta o no coincide. */
export function adminDenied(): NextResponse {
  return NextResponse.json({ ok: false }, { status: 403 });
}
