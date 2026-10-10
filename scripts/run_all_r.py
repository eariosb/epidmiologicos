"""Extrae los bloques code={`...`} de RCell/LabExercise y los corre en R local.
Uso:
  python scripts/run_all_r.py [--check|--update] [modulo ...]

  (sin modo)  corre e imprime el estado de cada bloque.
  --update    guarda cada salida en tests/r-snapshots/<id>.txt (justificar en el PR).
  --check     compara cada salida contra su snapshot y lista diferencias.

Los SasBlock son SAS y se ignoran. El Rscript se busca en $RSCRIPT, luego
en PATH y por ultimo en la ruta habitual de Windows."""
import difflib
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

RSCRIPT = (
    os.environ.get('RSCRIPT')
    or shutil.which('Rscript')
    or r'C:\Program Files\R\R-4.5.2\bin\Rscript.exe'
)
SNAPDIR = pathlib.Path('tests/r-snapshots')

args = [a for a in sys.argv[1:]]
MODE = 'run'
if '--check' in args:
    MODE = 'check'
    args.remove('--check')
elif '--update' in args:
    MODE = 'update'
    args.remove('--update')

MODS = args or [p.stem for p in sorted(pathlib.Path('src/content/modules').glob('*.mdx'))]

CELL = re.compile(
    r'<(?P<tag>RCell|LabExercise)\b(?P<attrs>[^>]*?)code=\{`\n?(?P<code>.*?)`\}',
    re.S)
IDATTR = re.compile(r'\bid="([^"]+)"')


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


def snap_name(mod: str, i: int, cell_id: str | None) -> str:
    base = cell_id if cell_id else f'{mod}-block{i}'
    return base.replace('/', '-') + '.txt'


def norm(text: str) -> str:
    return '\n'.join(l.rstrip() for l in text.replace('\r\n', '\n').splitlines()).strip()


def run_cell(code: str) -> subprocess.CompletedProcess:
    with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as f:
        f.write(code)
        path = f.name
    try:
        # Los datasets se leen por nombre relativo: cwd = public/data.
        return subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True,
                              text=True, timeout=300, cwd='public/data')
    finally:
        os.unlink(path)


failures = 0
diffs = 0
written = 0
missing = 0

if MODE == 'update':
    SNAPDIR.mkdir(parents=True, exist_ok=True)

for m in MODS:
    src = pathlib.Path('src/content/modules/' + m + '.mdx').read_text(encoding='utf-8')
    for i, mt in enumerate(CELL.finditer(src)):
        cell_id = IDATTR.search(mt.group('attrs'))
        name = snap_name(m, i, cell_id.group(1) if cell_id else None)
        r = run_cell(unescape(mt.group('code')))
        if r.returncode != 0:
            failures += 1
            print(f'--- {m} block {i} ({name}): FAIL')
            print(r.stderr[:800])
            continue
        out = norm(r.stdout)
        snap = SNAPDIR / name
        if MODE == 'update':
            snap.write_text(out + '\n', encoding='utf-8')
            written += 1
            print(f'--- {m} block {i} ({name}): snapshot')
        elif MODE == 'check':
            if not snap.exists():
                missing += 1
                print(f'--- {m} block {i} ({name}): SIN SNAPSHOT (--update)')
                continue
            expected = norm(snap.read_text(encoding='utf-8'))
            if out == expected:
                print(f'--- {m} block {i} ({name}): OK')
            else:
                diffs += 1
                print(f'--- {m} block {i} ({name}): DIFF')
                print('\n'.join(difflib.unified_diff(
                    expected.splitlines(), out.splitlines(),
                    'snapshot', 'actual', lineterm=''))[:1500])
        else:
            print(f'--- {m} block {i} ({name}): OK')
            for line in out.splitlines()[-2:]:
                print('    ' + line)

print()
if MODE == 'check':
    print(f'DIFFS: {diffs}   SIN SNAPSHOT: {missing}   FAILURES: {failures}')
elif MODE == 'update':
    print(f'SNAPSHOTS ESCRITOS: {written}   FAILURES: {failures}')
else:
    print(f'FAILURES: {failures}')

sys.exit(1 if (failures or diffs or missing) else 0)
