import claims from '@/content/claims.json';

/**
 * Imprime una cifra generada por `pnpm claims` (misma librería que los
 * simuladores). Si la clave no existe, el build de desarrollo la marca en
 * rojo en lugar de mostrar un número inventado.
 * Uso en MDX: <Claim k="m6.perondi.midp" d={3} />  →  0.030
 */
export function Claim({ k, d = 4, pct = false }: { k: string; d?: number; pct?: boolean }) {
  const v = (claims as Record<string, number>)[k];
  if (v === undefined) {
    return <span style={{ color: '#b91c1c', fontWeight: 600 }}>[claim desconocido: {k}]</span>;
  }
  return <>{pct ? (v * 100).toFixed(d) : v.toFixed(d)}</>;
}
