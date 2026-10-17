"""Genera public/data/valung_corrupto.csv a partir de valung.csv.

Contaminaciones deliberadas (documentadas en el modulo 29):
  1. Columna ID con ~8 IDs duplicados en conflicto + 4 filas exactas repetidas.
  2. Therapy/Cell con capitalizacion y typos inconsistentes.
  3. SurvTime en formatos mixtos: entero, 'NNNd' (dias), 'N.Nm' (meses),
     negativos y centinela 9999.
  4. AdmitDate en DD/MM/YYYY vs MM/DD/YYYY ambiguo + algun ISO.
  5. Kps fuera de rango / 'NA'; Age con 999, 152, -3 y vacios.
  6. censor invertido en ~8% de las filas.
  7. Valores faltantes como '', 'NA', 'N/A', '.'.

Uso: python scripts/gen_valung_corrupto.py
"""

import csv
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(20261013)

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "data" / "valung.csv"
DST = ROOT / "public" / "data" / "valung_corrupto.csv"

MISSING_TOKENS = ["", "NA", "N/A", "."]

therapy_spell = {
    "standard": ["standard", "Standard", "STANDARD", "standard"],
    "test": ["test", "Test", "TEST", "test"],
}
cell_spell = {
    "squamous": ["squamous", "Squamous", "SQUAMOUS", "squamous"],
    "small": ["small", "small cell", "Small", "small"],
    "adeno": ["adeno", "Adeno", "ADENO", "adeno"],
    "large": ["large", "Large", "LARGE", "large"],
}


def corrupt_survtime(v: int) -> str:
    r = random.random()
    if r < 0.08:
        return f"{v}d"
    if r < 0.14:
        return f"{v / 30.4375:.1f}m"  # meses
    if r < 0.17:
        return str(-v)
    if r < 0.19:
        return "9999"
    return str(v)


def corrupt_age(v: int) -> str:
    r = random.random()
    if r < 0.03:
        return "999"
    if r < 0.05:
        return str(random.choice([152, -3, 0]))
    if r < 0.08:
        return random.choice(MISSING_TOKENS)
    return str(v)


def corrupt_kps(v: int) -> str:
    r = random.random()
    if r < 0.04:
        return str(random.choice([105, 120, -10]))
    if r < 0.08:
        return random.choice(MISSING_TOKENS)
    return str(v)


def make_admit_date(i: int) -> str:
    d = date(2019, 1, 1) + timedelta(days=random.randint(0, 700))
    r = random.random()
    if r < 0.40:
        return d.strftime("%d/%m/%Y")  # DD/MM/YYYY
    if r < 0.75:
        return d.strftime("%m/%d/%Y")  # MM/DD/YYYY (ambiguo)
    return d.isoformat()               # ISO limpio


rows = []
with SRC.open(newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, start=1):
        surv = int(row["SurvTime"])
        cens = int(row["censor"])
        if random.random() < 0.08:
            cens = 1 - cens  # inversion deliberada
        rows.append(
            {
                "ID": f"VLC-{i:03d}",
                "Therapy": random.choice(therapy_spell[row["Therapy"]]),
                "Cell": random.choice(cell_spell[row["Cell"]]),
                "SurvTime": corrupt_survtime(surv),
                "Kps": corrupt_kps(int(row["Kps"])),
                "DiagTime": row["DiagTime"],
                "Age": corrupt_age(int(row["Age"])),
                "Prior": row["Prior"],
                "Treatment": row["Treatment"],
                "censor": str(cens),
                "AdmitDate": make_admit_date(i),
            }
        )

# IDs duplicados en conflicto: mismas ID, valores distintos.
dup_idx = random.sample(range(len(rows)), 8)
for i in dup_idx:
    twin = dict(rows[i])
    twin["SurvTime"] = str(int(float(str(rows[i]["SurvTime"]).rstrip("dm")) or 1) + random.randint(5, 90)) if str(rows[i]["SurvTime"]).replace(".", "").rstrip("dm").lstrip("-").isdigit() else rows[i]["SurvTime"]
    twin["Kps"] = str(max(10, min(100, int(rows[i]["Kps"]) if str(rows[i]["Kps"]).lstrip("-").isdigit() else 50)) + random.choice([-10, 10]))
    rows.append(twin)

# Filas exactamente repetidas.
for i in random.sample(range(len(rows)), 4):
    rows.append(dict(rows[i]))

random.shuffle(rows)

with DST.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)

print(f"{DST.name}: {len(rows)} filas escritas")
