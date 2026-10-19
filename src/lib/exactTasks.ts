import {
  coverageFromBounds,
  coverageLogOr,
  cornfieldBounds,
  dbinom,
  estimatorStats,
  getTableSpace,
  logOrCorrected,
  powerAt,
  rejectionMask,
  sizeCurve,
  tableIndex,
  woolfCI,
  type TableSpace,
} from '@/lib/exact2x2';

/**
 * Pure task functions for heavy exact computations. Both the Web Worker
 * (src/workers/exact.worker.ts) and the main-thread fallback call THESE
 * functions, so offloading changes WHERE the work runs, never WHAT it
 * returns.
 */

/** Malla interactiva de 801 puntos del parámetro de estorbo (exploradores y worker). */
export function uiGrid(): Float64Array {
  const g = new Float64Array(801);
  for (let i = 0; i < 801; i++) g[i] = 0.000625 + 0.00125 * i;
  return g;
}

export interface TableSpaceArgs {
  n1: number;
  n2: number;
  bergerBoos?: boolean;
  /** 'ui' = malla interactiva de 801 puntos; 'default' = la de exact2x2. */
  grid?: 'ui' | 'default';
}

export function tableSpaceTask(a: TableSpaceArgs): TableSpace {
  return getTableSpace(a.n1, a.n2, {
    grid: a.grid === 'default' ? undefined : uiGrid(),
    bergerBoos: a.bergerBoos ?? false,
  });
}

export interface PowerCurvesArgs {
  ns: number[];
  alpha: number;
  p1: number;
  p2: number;
}

export interface PowerCurvesResult {
  n: number[];
  fisher: number[];
  boschloo: number[];
  z: number[];
  disc: number[];
}

/** Power-vs-n and discordance-vs-n for a list of balanced sizes. */
export function powerCurvesTask(a: PowerCurvesArgs): PowerCurvesResult {
  const fisher: number[] = [],
    boschloo: number[] = [],
    z: number[] = [],
    disc: number[] = [];
  for (const n of a.ns) {
    const ts = tableSpaceTask({ n1: n, n2: n, bergerBoos: false });
    const mF = rejectionMask(ts.pFisher, a.alpha);
    const mB = rejectionMask(ts.pBoschloo, a.alpha);
    const mZ = rejectionMask(ts.pZ, a.alpha);
    fisher.push(powerAt(ts, mF, a.p1, a.p2));
    boschloo.push(powerAt(ts, mB, a.p1, a.p2));
    z.push(powerAt(ts, mZ, a.p1, a.p2));
    let d = 0;
    for (let x1 = 0; x1 <= n; x1++)
      for (let x2 = 0; x2 <= n; x2++) {
        const k = tableIndex(x1, x2, n);
        if (mF[k] !== mB[k]) d += dbinom(x1, n, a.p1) * dbinom(x2, n, a.p2);
      }
    disc.push(d);
  }
  return { n: a.ns, fisher, boschloo, z, disc };
}

export interface EcmCurveArgs {
  n1: number;
  n2: number;
  thetaTrue: number;
  p1: number;
  p2: number;
}

export interface EcmCurveResult {
  cs: number[];
  bias2: number[];
  va: number[];
  mse: number[];
}

/** Bias² / variance / MSE of the log-OR estimator as the c-correction varies. */
export function ecmCurveTask(a: EcmCurveArgs): EcmCurveResult {
  const ts = tableSpaceTask({ n1: a.n1, n2: a.n2, bergerBoos: false });
  const cs: number[] = [], bias2: number[] = [], va: number[] = [], mse: number[] = [];
  for (let cv = 0.05; cv <= 2.0001; cv += 0.05) {
    const s = estimatorStats(
      ts,
      (x1, x2) => logOrCorrected(x1, a.n1, x2, a.n2, cv),
      a.thetaTrue,
      a.p1,
      a.p2,
    );
    cs.push(cv);
    bias2.push(s.bias * s.bias);
    va.push(s.variance);
    mse.push(s.mse);
  }
  return { cs, bias2, va, mse };
}

export interface CoveragePairArgs {
  n1: number;
  n2: number;
  c: number;
  p1: number;
  p2: number;
}

export interface CoveragePairResult {
  woolf: number;
  exact: number;
}

/** Woolf-vs-Cornfield coverage of the log-OR CI at (p1, p2). */
export function coveragePairTask(a: CoveragePairArgs): CoveragePairResult {
  const ts = tableSpaceTask({ n1: a.n1, n2: a.n2, bergerBoos: false });
  const cb = cornfieldBounds(a.n1, a.n2);
  return {
    woolf: coverageLogOr(ts, (x1, x2) => woolfCI(x1, a.n1, x2, a.n2, a.c), a.p1, a.p2),
    exact: coverageFromBounds(ts, cb, a.p1, a.p2),
  };
}

export interface SizeCurvesArgs {
  n: number;
  alpha: number;
}

export interface SizeCurvesResult {
  grid: Float64Array;
  fisher: Float64Array;
  midp: Float64Array;
  boschloo: Float64Array;
  z: Float64Array;
}

/** Real size (rejection probability under H0) of each procedure vs the common p. */
export function sizeCurvesTask(a: SizeCurvesArgs): SizeCurvesResult {
  const ts = tableSpaceTask({ n1: a.n, n2: a.n, bergerBoos: false });
  const g = new Float64Array(201);
  for (let i = 0; i < 201; i++) g[i] = 0.0025 + 0.005 * i;
  return {
    grid: g,
    fisher: sizeCurve(ts, rejectionMask(ts.pFisher, a.alpha), g),
    midp: sizeCurve(ts, rejectionMask(ts.pMid, a.alpha), g),
    boschloo: sizeCurve(ts, rejectionMask(ts.pBoschloo, a.alpha), g),
    z: sizeCurve(ts, rejectionMask(ts.pZ, a.alpha), g),
  };
}

export interface ExactPowerPairArgs {
  nFormula: number;
  nAdj: number;
  alpha: number;
  p1: number;
  p2: number;
}

export interface ExactPowerPairResult {
  fisherF: number;
  zF: number;
  boschF: number;
  fisherA: number;
  zA: number;
  boschA: number;
}

/** Exact power of Fisher / pooled-z / Boschloo at two candidate sizes. */
export function exactPowerPairTask(a: ExactPowerPairArgs): ExactPowerPairResult {
  const tsF = tableSpaceTask({ n1: a.nFormula, n2: a.nFormula, bergerBoos: false });
  const tsA = tableSpaceTask({ n1: a.nAdj, n2: a.nAdj, bergerBoos: false });
  return {
    fisherF: powerAt(tsF, rejectionMask(tsF.pFisher, a.alpha), a.p1, a.p2),
    zF: powerAt(tsF, rejectionMask(tsF.pZ, a.alpha), a.p1, a.p2),
    boschF: powerAt(tsF, rejectionMask(tsF.pBoschloo, a.alpha), a.p1, a.p2),
    fisherA: powerAt(tsA, rejectionMask(tsA.pFisher, a.alpha), a.p1, a.p2),
    zA: powerAt(tsA, rejectionMask(tsA.pZ, a.alpha), a.p1, a.p2),
    boschA: powerAt(tsA, rejectionMask(tsA.pBoschloo, a.alpha), a.p1, a.p2),
  };
}

export const EXACT_TASKS = {
  tableSpace: tableSpaceTask,
  powerCurves: powerCurvesTask,
  ecmCurve: ecmCurveTask,
  coveragePair: coveragePairTask,
  sizeCurves: sizeCurvesTask,
  exactPowerPair: exactPowerPairTask,
} as const;

export type ExactTaskName = keyof typeof EXACT_TASKS;
export type ExactTaskArgs = {
  tableSpace: TableSpaceArgs;
  powerCurves: PowerCurvesArgs;
  ecmCurve: EcmCurveArgs;
  coveragePair: CoveragePairArgs;
  sizeCurves: SizeCurvesArgs;
  exactPowerPair: ExactPowerPairArgs;
};
export type ExactTaskResult = {
  tableSpace: TableSpace;
  powerCurves: PowerCurvesResult;
  ecmCurve: EcmCurveResult;
  coveragePair: CoveragePairResult;
  sizeCurves: SizeCurvesResult;
  exactPowerPair: ExactPowerPairResult;
};
