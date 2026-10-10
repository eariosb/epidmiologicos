// Regenera src/content/claims.json desde la libreria (misma que usan los
// simuladores). Uso: pnpm claims   (tsx scripts/build-claims.ts)
import { writeFileSync } from 'node:fs';
import { computeClaims } from '../src/lib/claims';

const claims = computeClaims();
const sorted = Object.fromEntries(
  Object.entries(claims).sort(([a], [b]) => a.localeCompare(b))
);
writeFileSync(
  'src/content/claims.json',
  JSON.stringify(sorted, null, 2) + '\n',
  'utf-8'
);
console.log(`claims.json: ${Object.keys(sorted).length} cifras regeneradas`);
