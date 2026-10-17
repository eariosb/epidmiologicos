"""Precalcula la salida de cada celda R (consola + graficos) para mostrarla
antes de que el estudiante ejecute nada.

Uso:
  python scripts/precompute_r.py [modulo ...]

Escribe:
  public/precomputed/<id>/plot-N.png   graficos de la celda
  src/content/precomputed.json         { id: { hash, console, plots[] } }

El hash (FNV-1a de 32 bits sobre el codigo en UTF-8) es el mismo que calcula
RCell en el navegador: si alguien cambia el codigo de una celda y no vuelve a
correr este script, la celda deja de mostrar la salida vieja. Los datasets se
leen desde public/data, igual que en check:r."""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from run_all_r import CELL, IDATTR, RSCRIPT, unescape  # noqa: E402

OUTDIR = pathlib.Path('public/precomputed')
MANIFEST = pathlib.Path('src/content/precomputed.json')
WIDTH, HEIGHT, RES = 1000, 620, 120


def para_mostrar(text: str) -> str:
    # Conserva la sangria (encabezados de tablas de R); solo quita espacios
    # finales y lineas vacias en los extremos.
    lines = [l.rstrip() for l in text.replace('\r\n', '\n').split('\n')]
    return '\n'.join(lines).strip('\n')


def fnv1a(text: str) -> str:
    h = 0x811C9DC5
    for b in text.encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


def run(code: str, plotdir: pathlib.Path) -> subprocess.CompletedProcess:
    plotdir.mkdir(parents=True, exist_ok=True)
    pattern = (plotdir.resolve() / 'plot-%d.png').as_posix()
    wrapped = (
        'options(useFancyQuotes = FALSE)\n'
        f'png("{pattern}", width = {WIDTH}, height = {HEIGHT}, res = {RES})\n'
        + code
        + '\ninvisible(dev.off())\n'
    )
    with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as f:
        f.write(wrapped)
        path = f.name
    try:
        return subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True, text=True,
                              encoding='utf-8', errors='replace', timeout=600, cwd='public/data')
    finally:
        os.unlink(path)


def main() -> int:
    mods = sys.argv[1:] or [p.stem for p in sorted(pathlib.Path('src/content/modules').glob('*.mdx'))]
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8')) if MANIFEST.exists() else {}
    fails = 0
    for mod in mods:
        src = pathlib.Path(f'src/content/modules/{mod}.mdx').read_text(encoding='utf-8')
        for m in CELL.finditer(src):
            idm = IDATTR.search(m.group('attrs'))
            if not idm:
                continue
            cid = idm.group(1)
            code = unescape(m.group('code'))
            slug = cid.replace('/', '-')
            plotdir = OUTDIR / slug
            if plotdir.exists():
                shutil.rmtree(plotdir)
            res = run(code, plotdir)
            plots = sorted(plotdir.glob('plot-*.png'), key=lambda p: int(p.stem.split('-')[1]))
            plots = [p for p in plots if p.stat().st_size > 1500]   # paginas vacias
            if res.returncode != 0:
                fails += 1
                print(f'FALLA {cid}: {res.stderr.strip().splitlines()[-1:] }')
                continue
            if not plots and plotdir.exists():
                shutil.rmtree(plotdir)
            manifest[cid] = {
                'hash': fnv1a(code),
                'console': para_mostrar(res.stdout),
                'plots': [f'/precomputed/{slug}/{p.name}' for p in plots],
            }
            print(f'ok {cid}: {len(plots)} grafico(s)')
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=1) + '\n',
                        encoding='utf-8')
    print(f'\n{len(manifest)} celdas en {MANIFEST} | fallas: {fails}')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
