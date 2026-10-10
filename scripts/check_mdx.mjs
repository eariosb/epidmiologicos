// Compila un .mdx con el pipeline real de la pagina (next-mdx-remote + plugins).
// Uso: node scripts/check_mdx.mjs [archivo]
import fs from 'node:fs';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';

const files = process.argv[2]
  ? [process.argv[2]]
  : fs.readdirSync('src/content/modules').filter((f) => f.endsWith('.mdx')).sort()
      .map((f) => `src/content/modules/${f}`);

const opts = {
  blockJS: false,
  mdxOptions: { remarkPlugins: [remarkMath, remarkGfm], rehypePlugins: [] },
};

let failures = 0;
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf-8');
  const source = raw.replace(/^---[\s\S]*?---\n/, '');

  try {
    await compileMDX({ source, components: {}, options: opts });
    console.log('OK:', file);
  } catch (e) {
    failures++;
    console.log('FAIL:', file);
    console.log(String(e.message).split('\n').slice(0, 8).join('\n'));

    // Bisect: cortes en lineas en blanco que no esten dentro de code={`...`}.
    const lines = source.split('\n');
    const inTpl = new Array(lines.length).fill(false);
    let open = false;
    lines.forEach((l, i) => {
      if (/=\{`/.test(l)) { inTpl[i] = true; open = true; return; }
      if (open) inTpl[i] = true;
      if (open && /`}/.test(l)) open = false;
    });
    const safe = [];
    lines.forEach((l, i) => {
      if (/^\s*$/.test(l) && !inTpl[i] && !inTpl[i - 1]) safe.push(i + 1);
    });
    safe.push(lines.length);
    let prev = 0;
    for (const end of safe) {
      try {
        await compileMDX({ source: lines.slice(0, end).join('\n'), components: {}, options: opts });
        prev = end;
      } catch (e2) {
        if (String(e2.message).includes('acorn')) {
          console.log('\n--- primer fallo: bloque entre lineas', prev + 1, 'y', end, '---');
          for (let l = prev; l < Math.min(end + 1, lines.length); l++) {
            console.log((l + 1) + '  ' + lines[l]);
          }
          break;
        }
      }
    }
  }
}
if (failures) {
  console.log(`\n${failures} archivo(s) con problemas`);
  process.exit(1);
}
console.log(`\nTodos compilan (${files.length} archivos)`);
