"""Envuelve la primera aparicion en prosa de cada sigla del glosario
que un modulo menciona pero nunca envuelve en <Term k="...">.

Reglas: salta frontmatter, code={`...`}, math $..$/$$..$$, lineas de
props JSX (title="...", items={[...]}, etc.) y encabezados/tabla donde
el JSX seria ruidoso. Solo se envuelve en parrafos/listas markdown.

Uso: python scripts/wrap_terms.py [--apply]
"""
import re, pathlib, sys
sys.stdout.reconfigure(encoding='utf-8')

APPLY = '--apply' in sys.argv

SIGLAS = ['PRAP', 'SHHS', 'VIH', 'SIDA', 'SINAN', 'CQR', 'PIT', 'VPN',
          'VPP', 'AUC', 'ROC', 'DAG', 'ECA', 'RCT', 'ITT', 'ETS', 'IRR',
          'SMR', 'NNT', 'PRA', 'RR', 'OR', 'RD', 'IC', 'MH', 'CMH', 'BD',
          'KM', 'UQ', 'CP', 'ML', 'R0', 'EE', 'I2', 'BCG']
PAT = re.compile(r'\b(' + '|'.join(sorted(set(SIGLAS), key=len, reverse=True)) + r')\b')

changed = []
for f in sorted(pathlib.Path('src/content/modules').glob('*.mdx')):
    lines = f.read_text(encoding='utf-8').split('\n')
    src = '\n'.join(lines)
    wrapped = set(re.findall(r'Term k="([^"]+)"', src))

    # siglas mencionadas en prosa
    mentioned = set()
    in_code = in_math = False
    frontmatter_done = False
    dash_count = 0
    for line in lines:
        if line.strip() == '---' and not frontmatter_done:
            dash_count += 1
            if dash_count == 2:
                frontmatter_done = True
            continue
        if not frontmatter_done:
            continue
        if '={`' in line and line.count('`') % 2:
            in_code = not in_code
            continue
        if in_code:
            if '`}' in line:
                in_code = False
            continue
        if '$$' in line:
            in_math = not in_math
            continue
        if in_math:
            continue
        s = re.sub(r'\$[^$]*\$', '', line)
        s = re.sub(r'<Term k="[^"]+">.*?</Term>', '', s)
        s = re.sub(r'\w+="[^"]*"', '', s)
        for m in PAT.finditer(s):
            mentioned.add(m.group(1))

    missing = mentioned - wrapped
    if not missing:
        continue

    # envolver primera aparicion en prosa segura
    done = set()
    in_code = in_math = in_jsx = False
    dash_count = 0
    frontmatter_done = False
    for i, line in enumerate(lines):
        if line.strip() == '---' and not frontmatter_done:
            dash_count += 1
            if dash_count == 2:
                frontmatter_done = True
            continue
        if not frontmatter_done:
            continue
        t = line.strip()
        # estados
        if in_code:
            if '`}' in line:
                in_code = False
            continue
        if '={`' in line and line.count('`') % 2:
            in_code = True
            continue
        if line.count('$$') % 2:
            in_math = not in_math
            continue
        if in_math:
            continue
        # evaluar el estado sobre la linea SIN Term ni atributos:
        s = re.sub(r'<Term k="[^"]+">.*?</Term>', '', line)
        s = re.sub(r'<Term k="[^"]+"/>', '', s)
        s_clean = re.sub(r'\w+="[^"]*"', '', s)
        # props JSX multilinea: <Comp ... /> o lines dentro de etiq.
        if t.startswith('<') or t.startswith('|') or t.startswith('#'):
            continue
        if re.search(r'\w+\s*=\s*[{"]', s_clean) or in_jsx:
            # dentro de props multilinea hasta cierre '/>' o '} ] }' etc.
            if t.endswith('/>') or re.match(r'^[\])},]*\s*/?>?$', t):
                in_jsx = False
                continue
            in_jsx = True
            continue
        # saltar si la linea es JSX attribute pura
        if re.match(r'^\w+=', t):
            continue
        # envolver
        def repl(m):
            sig = m.group(1)
            if sig in missing and sig not in done:
                done.add(sig)
                return f'<Term k="{sig}">{sig}</Term>'
            return sig
        new = PAT.sub(repl, line)
        if new != line:
            lines[i] = new
    if done:
        changed.append((f.name, sorted(done)))
        if APPLY:
            f.write_text('\n'.join(lines), encoding='utf-8')

for name, d in changed:
    print(f'{name}: + {", ".join(d)}')
print('(modo dry-run; agregar --apply para escribir)' if not APPLY else 'ESCRITO')
