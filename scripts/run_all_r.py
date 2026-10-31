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

CELL = re.compile(
    # attrs admite JSX (title={<>... <Term/> ...</>}): avanza sin cruzar el
    # cierre de la etiqueta ni el inicio de otra celda.
    r'<(?P<tag>RCell|LabExercise)\b(?P<attrs>(?:(?!<RCell|<LabExercise|code=\{`).)*?)'
    r'code=\{`\n?(?P<code>.*?)`\}',
    re.S)
IDATTR = re.compile(r'\bid="([^"]+)"')


JS_ESCAPES = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}


def unescape(code: str) -> str:
    # Desescapa el template literal con la misma semantica que JS en el
    # navegador: \n -> salto de linea, \t -> tabulador, \\ -> \, \` -> `,
    # \$ -> $; cualquier otro \x -> x. Antes \n se convertia en "n" y los
    # snapshots no coincidian con lo que ve el estudiante.
    out = []
    i = 0
    while i < len(code):
        if code[i] == '\\' and i + 1 < len(code):
            nxt = code[i + 1]
            out.append(JS_ESCAPES.get(nxt, nxt))
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
        # Comillas ASCII en todo sistema: los snapshots no dependen del locale.
        f.write('options(useFancyQuotes = FALSE)\n')
        f.write(code)
        path = f.name
    try:
        # Los datasets se leen por nombre relativo: cwd = public/data.
        # encoding='utf-8': en Windows, text=True decodificaba con cp1252 y
        # las tildes llegaban como 'mÃ³dulo'.
        return subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True,
                              text=True, encoding='utf-8', errors='replace',
                              timeout=300, cwd='public/data')
    finally:
        os.unlink(path)


def check_packages() -> int:
    """Falla temprano, con un mensaje accionable, si falta un paquete de R.

    Sin esto, una instalacion de R sin `survival` produce una decena de
    "FAIL" de celdas que parecen errores del contenido cuando el problema
    es el entorno."""
    # Paquetes que alguna celda carga de verdad. ColOpenData solo aparece
    # en comentarios (no está en WebR), así que no se exige.
    needed = ['survival', 'epiR']
    expr = ';'.join(f'cat(if (requireNamespace("{p}", quietly = TRUE)) "" else "{p} ")'
                    for p in needed)
    try:
        r = subprocess.run([RSCRIPT, '--vanilla', '-e', expr], capture_output=True,
                           text=True, encoding='utf-8', errors='replace', timeout=180)
    except (OSError, subprocess.TimeoutExpired) as exc:
        print(f'No se pudo ejecutar Rscript ({RSCRIPT}): {exc}')
        print('Instala R o define RSCRIPT=/ruta/a/Rscript.')
        return 2
    if r.returncode != 0:
        print(f'Rscript no respondio ({RSCRIPT}): {(r.stderr or "").strip()[:300]}')
        print('Revisa la instalacion de R o define RSCRIPT=/ruta/a/Rscript.')
        return 2
    missing = r.stdout.split()
    if missing:
        print('Faltan paquetes de R: ' + ', '.join(missing))
        print('Instalalos con:  Rscript -e '
              f'"install.packages(c({", ".join(repr(p) for p in missing)}))"')
        return 2
    return 0


def main() -> int:
    early = check_packages()
    if early:
        return early
    args = [a for a in sys.argv[1:]]
    MODE = 'run'
    if '--check' in args:
        MODE = 'check'
        args.remove('--check')
    elif '--update' in args:
        MODE = 'update'
        args.remove('--update')

    MODS = args or [p.stem for p in sorted(pathlib.Path('src/content/modules').glob('*.mdx'))]

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

    return 1 if (failures or diffs or missing) else 0


if __name__ == '__main__':
    sys.exit(main())
