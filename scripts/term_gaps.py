"""Por modulo: siglas mencionadas en prosa pero NUNCA envueltas en <Term>.
Uso: python scripts/term_gaps.py"""
import re, pathlib, sys
sys.stdout.reconfigure(encoding='utf-8')

SIGLAS = ['RR','OR','RD','PRA','PRAP','NNT','SMR','IRR','IC','ECA','RCT',
          'MH','CMH','BD','KM','DAG','ROC','AUC','VPP','VPN','ITT','ETS',
          'VIH','SIDA','SHHS','UQ','CP','ML','PIT','CQR','R0','EE','I2',
          'BCG','SINAN']
SIGLAS.sort(key=len, reverse=True)
PAT = re.compile(r'\b(' + '|'.join(SIGLAS) + r')\b')

for f in sorted(pathlib.Path('src/content/modules').glob('*.mdx')):
    src = f.read_text(encoding='utf-8')
    wrapped = set(re.findall(r'Term k="([^"]+)"', src))
    in_code = False
    in_math = False
    mentioned = set()
    first_line = {}
    lines = src.split('\n')
    # Saltar frontmatter YAML.
    if lines and lines[0].strip() == '---':
        end = next((i for i in range(1, len(lines)) if lines[i].strip() == '---'), 0)
        lines = lines[end + 1:]
    for ln, line in enumerate(lines, 1):
        if '={`' in line:
            if line.count('`') % 2:
                in_code = not in_code
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
        s = re.sub(r'(?:\w+\s*[:=]|[\[,{])\s*"[^"]*"', '', s)   # props y arrays JS
        s = re.sub(r'^\s*"[^"]*",?\s*(?://.*)?$', '', s)        # literal solo en su linea
        s = re.sub(r"'[^']*'", '', s)
        for m in PAT.finditer(s):
            mentioned.add(m.group(1))
            first_line.setdefault(m.group(1), ln)
    missing = mentioned - wrapped
    if missing:
        pairs = sorted(missing, key=lambda k: first_line[k])
        print(f'{f.name}: ' + ', '.join(f'{k}(L{first_line[k]})' for k in pairs))
