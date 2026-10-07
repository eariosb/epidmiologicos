import re, subprocess, sys, os, tempfile
os.environ['PATH'] = r'C:\Program Files\R\R-4.5.2\bin\x64;' + os.environ['PATH']
root = r'C:\www\UNAL\Modelos Mixtos\Curso Procesos E\curso-procesos-estocasticos\src\content\modules'
files = sorted(f for f in os.listdir(root) if f.endswith('.mdx'))
fails = 0
for f in files:
    src = open(os.path.join(root, f), encoding='utf-8').read()
    blocks = re.findall(r'code=\{`\n(.*?)`\}', src, re.DOTALL)
    for i, code in enumerate(blocks):
        # unescape JS template-literal escapes used inside MDX code props
        code = code.replace('\\$', '$').replace('\\\\', '\\')
        with tempfile.NamedTemporaryFile('w', suffix='.R', delete=False, encoding='utf-8') as tf:
            tf.write(code)
            path = tf.name
        r = subprocess.run(['Rscript', '--vanilla', path], capture_output=True, text=True,
                           encoding='utf-8', errors='replace', timeout=300)
        status = 'OK ' if r.returncode == 0 else 'FAIL'
        if r.returncode != 0:
            fails += 1
            print(f'--- {f} block {i}: {status}')
            print((r.stderr or r.stdout)[-800:])
        else:
            print(f'--- {f} block {i}: OK')
        os.unlink(path)
print('FAILURES:', fails)
sys.exit(1 if fails else 0)
