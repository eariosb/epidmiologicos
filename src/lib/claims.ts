/**
 * claims.ts: Cifras del texto atadas al código que las calcula.
 *
 * computeClaims() produce cada número que la prosa de los módulos 5 y 6
 * afirma, usando las mismas librerías que los simuladores. El build
 * (scripts/build-claims.ts) lo vuelca a src/content/claims.json y el
 * componente <Claim k="..." /> lo imprime en el MDX. claims.test.ts
 * recalcula todo: si alguien cambia la librería, el test obliga a
 * regenerar las cifras: nunca más un número escrito a mano que se
 * desincroniza del simulador.
 */
import {
  getTableSpace,
  tableIndex,
  rejectionMask,
  powerAt,
  sizeCurve,
  woolfCI,
  coverageLogOr,
  agrestiCaffoRD,
  newcombeRD,
  logOrCorrected,
  pZeroCell,
  nForPower,
  nForPowerRaw,
} from '@/lib/exact2x2';
import {
  lengthDistribution,
  nClassic,
  nGuaranteeExact,
} from '@/lib/precision';

const ALPHA = 0.05;

export function computeClaims(): Record<string, number> {
  const c: Record<string, number> = {};

  /* ---- Tabla Perondi: 7/34 estándar vs. 1/34 dosis alta ------------- */
  const ts = getTableSpace(34, 34);
  const kObs = tableIndex(7, 1, 34);
  c['m6.perondi.fisher'] = ts.pFisher[kObs];
  c['m6.perondi.midp'] = ts.pMid[kObs];
  c['m6.perondi.z'] = ts.pZ[kObs];
  c['m6.perondi.boschloo'] = ts.pBoschloo[kObs];
  c['m6.perondi.or'] = (7 * 33) / (27 * 1);
  c['m6.perondi.rd'] = 7 / 34 - 1 / 34;
  const ac = agrestiCaffoRD(7, 34, 1, 34);
  c['m6.perondi.acLo'] = ac.lo;
  c['m6.perondi.acHi'] = ac.hi;
  const nc = newcombeRD(7, 34, 1, 34);
  c['m6.perondi.newcombeLo'] = nc.lo;
  c['m6.perondi.newcombeHi'] = nc.hi;
  c['m6.perondi.orC05'] = Math.exp(logOrCorrected(7, 34, 1, 34, 0.5));
  c['m6.perondi.orC10'] = Math.exp(logOrCorrected(7, 34, 1, 34, 1.0));

  /* ---- Tamaño y potencia (escenario de referencia 0.20 vs. 0.03) ---- */
  const mF = rejectionMask(ts.pFisher, ALPHA);
  const mB = rejectionMask(ts.pBoschloo, ALPHA);
  const mZ = rejectionMask(ts.pZ, ALPHA);
  c['m6.size.fisher'] = Math.max(...sizeCurve(ts, mF));
  c['m6.size.boschloo'] = Math.max(...sizeCurve(ts, mB));
  c['m6.power.fisher'] = powerAt(ts, mF, 0.2, 0.03);
  c['m6.power.boschloo'] = powerAt(ts, mB, 0.2, 0.03);
  c['m6.power.z'] = powerAt(ts, mZ, 0.2, 0.03);
  c['m6.perondi.pZeroCell'] = pZeroCell(ts, 7 / 34, 1 / 34);

  /* ---- Cobertura exacta del IC de Woolf para log-OR ----------------- */
  const w05 = (x1: number, x2: number) => woolfCI(x1, 34, x2, 34, 0.5);
  const w10 = (x1: number, x2: number) => woolfCI(x1, 34, x2, 34, 1.0);
  // Punto observado (p1 = 7/34, p2 = 1/34) y escenario (0.20, 0.03).
  c['m6.woolf.cov.obs.c05'] = coverageLogOr(ts, w05, 7 / 34, 1 / 34);
  c['m6.woolf.cov.obs.c10'] = coverageLogOr(ts, w10, 7 / 34, 1 / 34);
  c['m6.woolf.cov.design.c05'] = coverageLogOr(ts, w05, 0.2, 0.03);

  /* ---- M5: tabla atribuible (fumadora vs. bajo peso) ---------------- */
  {
    const r1 = 30 / 100, r0 = 20 / 200;
    const rr = r1 / r0;
    const pe = 100 / 300;
    c['m5.table.r1'] = r1;
    c['m5.table.r0'] = r0;
    c['m5.table.rr'] = rr;
    c['m5.table.or'] = (30 * 180) / (70 * 20);
    c['m5.table.pra'] = (rr - 1) / rr;
    c['m5.table.prap'] = (pe * (rr - 1)) / (1 + pe * (rr - 1));
    c['m5.table.nnh'] = 1 / (r1 - r0);
  }

  /* ---- M5: tamaño muestral Fleiss (0.20 vs. 0.03, potencia 0.80) ---- */
  c['m5.fleiss.n'] = nForPower(0.2, 0.03, ALPHA, 0.8);
  c['m5.fleiss.nLosses'] = Math.ceil(nForPowerRaw(0.2, 0.03, ALPHA, 0.8) / 0.8);
  // Potencia exacta con el n real del ensayo (misma librería que m6).
  c['m5.perondi.power.fisher'] = c['m6.power.fisher'];

  /* ---- M5: precisión, L aleatoria (p = 0.10, n = 50, L0 = 0.12) ---- */
  {
    const p = 0.1, n = 50, L0 = 0.12;
    const d = lengthDistribution(n, p, 'wilson', 0.95);
    c['m5.precision.EL'] = d.E_L;
    let pgt = 0;
    for (let i = 0; i <= n; i++) if (d.L[i] > d.E_L) pgt += d.prob[i];
    c['m5.precision.pLgtMean'] = pgt;
    c['m5.precision.nClassic'] = nClassic(p, L0, 0.95);
    c['m5.precision.nGuarantee'] = nGuaranteeExact(L0, p, 0.1, 'wilson', 0.95);
    // Escala del costo: IC de longitud 0.10 vs. 0.025 con p = 0.10.
    c['m5.precision.nClassicL010'] = nClassic(p, 0.1, 0.95);
    c['m5.precision.nClassicL0025'] = nClassic(p, 0.025, 0.95);
  }

  /* ---- M5: lidocaína (Hine 1989 / Normand 1999, efecto fijo en RD) -- */
  {
    const a = [2, 4, 6, 7, 7, 11], n1 = [39, 44, 107, 103, 110, 154];
    const b = [1, 4, 4, 5, 3, 4], n2 = [43, 44, 110, 100, 106, 146];
    let num = 0, den = 0;
    for (let i = 0; i < a.length; i++) {
      const rd = a[i] / n1[i] - b[i] / n2[i];
      const v = (a[i] / n1[i]) * (1 - a[i] / n1[i]) / n1[i] +
        (b[i] / n2[i]) * (1 - b[i] / n2[i]) / n2[i];
      const w = 1 / v;
      num += w * rd;
      den += w;
    }
    // Magnitud del exceso de mortalidad (rd tratamiento−control > 0 = daño).
    // El DecisionPanel usa la convención ARR = control−tratamiento = −rd;
    // aquí se guarda la magnitud porque la prosa la enuncia ("mata a ~2.9").
    c['m5.lidocaina.rd'] = num / den;
    c['m5.lidocaina.nnh'] = den / num;
  }

  return c;
}
