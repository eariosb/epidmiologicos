"""Extrae todos los bloques code={`...`} de los .mdx y los corre en R local.
Uso: python scripts/run_all_r.py [modulo ...]"""
import re
import sys
import pathlib
import subprocess
import tempfile
import os

import shutil

# Rscript: variable de entorno -> PATH -> ubicacion comun en Windows.
RSCRIPT = (
    os.environ.get('RSCRIPT')
    or shutil.which('Rscript')
    or r'C:\Program Files\R\R-4.5.2\bin\Rscript.exe'
)
MODS = sys.argv[1:] or [p.stem for p in pathlib.Path('src/content/modules').glob('*.mdx')]


def unescape(code: str) -> str:
    # Desescapa el template literal JS: \\ -> \, \$ -> $, \` -> `
    out = []
    i = 0
    while i < len(code):
        if code[i] == '\\' and i + 1 < len(code):
            out.append(code[i + 1])
            i += 2
        else:
            out.append(code[i])
            i += 1
    return ''.join(out)


failures = 0
for m in MODS:
    src = pathlib.Path('src/content/modules/' + m + '.mdx').read_text(encoding='utf-8')
    # Solo RCell/LabExercise: los SasBlock son SAS y no corren en R.
    blocks = re.findall(r'<(?:RCell|LabExercise)\b[^>]*?code=\{`\n?(.*?)`\}', src, re.S)
    for i, b in enumerate(blocks):
        code = unescape(b)
        with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as f:
            f.write(code)
            path = f.name
        # Los datasets se leen por nombre relativo: cwd = public/data.
        r = subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True,
                           text=True, timeout=300, cwd='public/data')
        if r.returncode == 0:
            print('--- %s block %d: OK' % (m, i))
            for line in r.stdout.strip().splitlines()[-2:]:
                print('    ' + line)
        else:
            failures += 1
            print('--- %s block %d: FAIL' % (m, i))
            print(r.stderr[:800])
        os.unlink(path)
print('FAILURES:', failures)
sys.exit(1 if failures else 0)
