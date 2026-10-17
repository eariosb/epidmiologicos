"""Lint de celdas R y snapshots.

Uso: python scripts/lint_cells.py

Verifica, sin ejecutar R:
  1. Cada RCell/LabExercise tiene id (las celdas sin id generan snapshots
     con nombre posicional que cambia si se reordena el modulo).
  2. Los id son unicos en todo el curso.
  3. El prefijo del id coincide con el modulo: 'NN/...' o 'lab-NN-...'.
  4. Cada celda tiene su snapshot en tests/r-snapshots.
  5. No hay snapshots huerfanos (sin celda que los produzca).
  6. La salida precalculada (src/content/precomputed.json) corresponde al
     codigo actual de cada celda; si no, RCell la oculta y se avisa.
Sale con codigo 1 si hay errores; las advertencias no fallan."""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from run_all_r import CELL as CELL_FULL, unescape  # noqa: E402

MODDIR = pathlib.Path('src/content/modules')
SNAPDIR = pathlib.Path('tests/r-snapshots')
CELL = re.compile(r'<(?P<tag>RCell|LabExercise)\b(?P<attrs>[^>]*?)code=\{`', re.S)
IDATTR = re.compile(r'\bid="([^"]+)"')

errors, warnings = [], []
seen = {}
expected_snaps = set()

for mdx in sorted(MODDIR.glob('*.mdx')):
    mod = mdx.stem
    num = mod[:2]
    src = mdx.read_text(encoding='utf-8')
    for i, m in enumerate(CELL.finditer(src)):
        idm = IDATTR.search(m.group('attrs'))
        line = src.count('\n', 0, m.start()) + 1
        if not idm:
            warnings.append(f'{mdx.name}:{line}: {m.group("tag")} sin id (snapshot posicional {mod}-block{i})')
            expected_snaps.add(f'{mod}-block{i}.txt')
            continue
        cid = idm.group(1)
        if cid in seen:
            errors.append(f'{mdx.name}:{line}: id duplicado "{cid}" (ya en {seen[cid]})')
        seen[cid] = f'{mdx.name}:{line}'
        ok_prefix = cid.startswith(f'{num}/') or cid.startswith(f'lab-{num}-')
        if not ok_prefix:
            errors.append(f'{mdx.name}:{line}: id "{cid}" no corresponde al modulo {num}')
        snap = cid.replace('/', '-') + '.txt'
        expected_snaps.add(snap)
        if not (SNAPDIR / snap).exists():
            errors.append(f'{mdx.name}:{line}: sin snapshot {SNAPDIR / snap} (correr check:r:update)')

# Dentro de code={`...`} un \n simple es un salto de linea de JavaScript:
# R lo acepta dentro del string, pero el editor muestra el string partido.
ESC_N = re.compile(r'(?<!\\)(?:\\\\)*\\n')
CODE_BLOCK = re.compile(r'code=\{`(.*?)`\}', re.S)
for mdx in sorted(MODDIR.glob('*.mdx')):
    src = mdx.read_text(encoding='utf-8')
    for b in CODE_BLOCK.finditer(src):
        for e in ESC_N.finditer(b.group(1)):
            line = src.count('\n', 0, b.start(1) + e.start()) + 1
            errors.append(f'{mdx.name}:{line}: "\\n" simple en el codigo; escribir "\\\\n" para que R lo vea como escape')

for f in sorted(SNAPDIR.glob('*.txt')):
    if f.name not in expected_snaps:
        errors.append(f'snapshot huerfano: {f} (ninguna celda lo produce)')

def fnv1a(text):
    h = 0x811C9DC5
    for b in text.encode('utf-8'):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


PRE = pathlib.Path('src/content/precomputed.json')
if PRE.exists():
    pre = json.loads(PRE.read_text(encoding='utf-8'))
    for mdx in sorted(MODDIR.glob('*.mdx')):
        for m in CELL_FULL.finditer(mdx.read_text(encoding='utf-8')):
            idm = IDATTR.search(m.group('attrs'))
            if not idm:
                continue
            cid = idm.group(1)
            if cid not in pre:
                warnings.append(f'{mdx.name}: "{cid}" sin salida precalculada (pnpm precompute)')
            elif pre[cid]['hash'] != fnv1a(unescape(m.group('code'))):
                warnings.append(f'{mdx.name}: salida precalculada de "{cid}" desactualizada (pnpm precompute)')
    for cid in set(pre) - set(seen):
        warnings.append(f'precomputed.json: "{cid}" ya no existe en ningun modulo')

for w in warnings:
    print('AVISO:', w)
for e in errors:
    print('ERROR:', e)
print(f'\n{len(seen)} celdas con id | {len(errors)} errores | {len(warnings)} avisos')
sys.exit(1 if errors else 0)
