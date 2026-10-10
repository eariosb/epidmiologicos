"""Extrae los bloques code={`...`} de RCell y LabExercise (NO SasBlock)
y los corre en R local. Uso: python scripts/run_r_only.py [modulo ...]"""
import re, sys, pathlib, subprocess, tempfile

RSCRIPT = r'C:\Program Files\R\R-4.5.2\bin\Rscript.exe'
MODS = sys.argv[1:] or [p.stem for p in pathlib.Path('src/content/modules').glob('*.mdx')]

def unescape(code: str) -> str:
    out, i = [], 0
    while i < len(code):
        if code[i] == '\\' and i + 1 < len(code):
            out.append(code[i + 1]); i += 2
        else:
            out.append(code[i]); i += 1
    return ''.join(out)

fails = []
for m in MODS:
    src = pathlib.Path('src/content/modules/' + m + '.mdx').read_text(encoding='utf-8')
    blocks = re.findall(r'<(?:RCell|LabExercise)[^>]*?code=\{`\n?(.*?)`\}', src, re.S)
    for i, b in enumerate(blocks):
        code = unescape(b)
        with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as f:
            f.write(code); path = f.name
        try:
            r = subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired:
            fails.append((m, i, 'TIMEOUT')); print('FAIL %s #%d TIMEOUT' % (m, i)); continue
        if r.returncode != 0:
            err = [l for l in r.stderr.splitlines() if 'Error' in l]
            msg = err[0] if err else r.stderr.strip()[:200]
            fails.append((m, i, msg))
            print('FAIL %s block %d: %s' % (m, i, msg))
        else:
            print('OK   %s block %d' % (m, i))
print()
print('REAL R FAILURES:', len(fails))
