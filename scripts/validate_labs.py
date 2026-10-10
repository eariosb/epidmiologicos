# Ejecuta solo los bloques code={...} de <LabExercise> de este curso.
# Uso: python scripts/validate_labs.py [modulo ...]   (cwd = raiz del repo)
import re, subprocess, sys, os, tempfile, pathlib

RSCRIPT = os.environ.get(
    'RSCRIPT',
    r'C:\Program Files\R\R-4.5.2\bin\Rscript.exe')
if not os.path.exists(RSCRIPT):
    RSCRIPT = 'Rscript'  # fallback al PATH

root = pathlib.Path('src/content/modules')
if len(sys.argv) > 1:
    files = [root / (a if a.endswith('.mdx') else a + '.mdx') for a in sys.argv[1:]]
else:
    files = sorted(root.glob('*.mdx'))

fails = 0
for f in files:
    src = f.read_text(encoding='utf-8')
    blocks = re.findall(
        r'<LabExercise[^>]*code=\{`\n?(.*?)`\}', src, re.DOTALL)
    for i, code in enumerate(blocks):
        # unescape JS template-literal escapes used inside MDX code props
        code = code.replace('\\$', '$').replace('\\\\', '\\')
        with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as tf:
            tf.write(code)
            path = tf.name
        r = subprocess.run([RSCRIPT, '--vanilla', path], capture_output=True, text=True,
                           encoding='utf-8', errors='replace', timeout=300,
                           cwd='public/data')
        if r.returncode != 0:
            fails += 1
            print(f'--- {f.name} lab {i}: FAIL')
            print((r.stderr or r.stdout)[-800:])
        else:
            print(f'--- {f.name} lab {i}: OK')
        os.unlink(path)
print('FAILURES:', fails)
sys.exit(1 if fails else 0)
