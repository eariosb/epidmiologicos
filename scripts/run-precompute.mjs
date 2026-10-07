import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const candidates = [
  'C:\\Program Files\\R\\R-4.5.2\\bin\\Rscript.exe',
  'C:\\Program Files\\R\\R-4.5.3\\bin\\Rscript.exe',
  'C:\\Program Files\\R\\R-4.5.1\\bin\\Rscript.exe',
  'C:\\Program Files\\R\\R-4.4.1\\bin\\Rscript.exe',
  'C:\\Program Files\\R\\R-4.4.0\\bin\\Rscript.exe',
  'C:\\R\\bin\\Rscript.exe',
];

const rscript = candidates.find((p) => existsSync(p)) || 'Rscript';

const args = ['src/data-gen/precompute_outputs.R'];

console.log(`Using Rscript: ${rscript}`);
try {
  execFileSync(rscript, args, { stdio: 'inherit', cwd: process.cwd() });
} catch (e) {
  console.error('Failed to run precompute_outputs.R');
  console.error('Make sure R is installed and packages gamlss, gamlss.data, survival are available.');
  process.exit(1);
}
