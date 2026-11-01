import { rmSync } from 'node:fs';

// Borra la caché de compilación. Necesario cuando un `next build` o un
// segundo `next dev` dejan `.next` con manifiestos mezclados: el servidor
// sirve HTML que apunta a chunks que ya no existen.
rmSync('.next', { recursive: true, force: true });
console.log('.next eliminado');
