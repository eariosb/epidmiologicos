import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { tableIndex } from './exact2x2';
import {
  coveragePairTask,
  ecmCurveTask,
  exactPowerPairTask,
  powerCurvesTask,
  sizeCurvesTask,
  tableSpaceTask,
  EXACT_TASKS,
} from './exactTasks';

/* Anchor values verified against the essay/R references (Perondi scenario:
 * x1=7/n1=34 vs x2=1/n2=34, alpha=0.05, p1=0.2, p2=0.03). */

describe('exact task functions', () => {
  it('tableSpaceTask reproduces the Perondi p-values', () => {
    const ts = tableSpaceTask({ n1: 34, n2: 34, grid: 'ui', bergerBoos: true });
    const k = tableIndex(7, 1, 34);
    expect(ts.pFisher[k]).toBeCloseTo(0.0544, 3);
    expect(ts.pBoschloo[k]).toBeCloseTo(0.0385, 3);
    expect(ts.pBergerBoos?.[k]).toBeGreaterThan(0);
  });

  it('tableSpaceTask honors the bergerBoos flag', () => {
    const ts = tableSpaceTask({ n1: 20, n2: 20, grid: 'ui', bergerBoos: false });
    expect(ts.pBergerBoos ?? null).toBeNull();
  });

  it('powerCurvesTask reproduces the declared Fisher/Boschloo powers', () => {
    const r = powerCurvesTask({ ns: [34], alpha: 0.05, p1: 0.2, p2: 0.03 });
    expect(r.fisher[0]).toBeCloseTo(0.4333, 3);
    expect(r.boschloo[0]).toBeCloseTo(0.5489, 3);
    expect(r.disc[0]).toBeGreaterThan(0);
    expect(r.disc[0]).toBeLessThan(1);
  });

  it('sizeCurvesTask reproduces the declared real sizes', () => {
    const r = sizeCurvesTask({ n: 34, alpha: 0.05 });
    expect(Math.max(...r.fisher)).toBeCloseTo(0.0305, 3);
    expect(Math.max(...r.boschloo)).toBeCloseTo(0.0466, 3);
    expect(r.grid.length).toBe(201);
  });

  it('exactPowerPairTask matches the same-n powerCurves values', () => {
    const r = exactPowerPairTask({ nFormula: 34, nAdj: 40, alpha: 0.05, p1: 0.2, p2: 0.03 });
    expect(r.fisherF).toBeCloseTo(0.4333, 3);
    expect(r.boschF).toBeCloseTo(0.5489, 3);
    expect(r.fisherA).toBeGreaterThan(r.fisherF);
  });

  it('coveragePairTask returns plausible coverages', () => {
    const r = coveragePairTask({ n1: 34, n2: 34, c: 0.5, p1: 7 / 34, p2: 1 / 34 });
    expect(r.woolf).toBeCloseTo(0.949, 2);
    expect(r.exact).toBeGreaterThan(0.95);
  });

  it('ecmCurveTask returns a well-formed curve with an interior minimum', () => {
    const th = Math.log(((7 / 34) / (1 - 7 / 34)) / ((1 / 34) / (1 - 1 / 34)));
    const r = ecmCurveTask({ n1: 34, n2: 34, thetaTrue: th, p1: 7 / 34, p2: 1 / 34 });
    expect(r.cs.length).toBe(r.mse.length);
    expect(r.cs.length).toBeGreaterThan(30);
    const iMin = r.mse.indexOf(Math.min(...r.mse));
    expect(iMin).toBeGreaterThan(0);
    expect(iMin).toBeLessThan(r.mse.length - 1);
  });
});

describe('runExact', () => {
  it('falls back to the synchronous path when Worker is unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const { runExact } = await import('./exactRunner');
    const got = await runExact('powerCurves', { ns: [30], alpha: 0.05, p1: 0.2, p2: 0.03 });
    const want = powerCurvesTask({ ns: [30], alpha: 0.05, p1: 0.2, p2: 0.03 });
    expect(got).toEqual(want);
    vi.unstubAllGlobals();
  });

  it('uses the Worker when one is available, with identical results', async () => {
    vi.resetModules();
    // Minimal Worker stand-in: runs the same task map asynchronously.
    class FakeWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      postMessage(msg: { id: number; name: keyof typeof EXACT_TASKS; args: never }) {
        const ok = (EXACT_TASKS[msg.name] as (a: never) => unknown)(msg.args);
        setTimeout(() => this.onmessage?.({ data: { id: msg.id, ok } } as MessageEvent), 0);
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    const { runExact } = await import('./exactRunner');
    const got = await runExact('powerCurves', { ns: [30], alpha: 0.05, p1: 0.2, p2: 0.03 });
    const want = powerCurvesTask({ ns: [30], alpha: 0.05, p1: 0.2, p2: 0.03 });
    expect(got).toEqual(want);
    vi.unstubAllGlobals();
  });

  it('rejects (does not hang) when the worker reports an error', async () => {
    vi.resetModules();
    class BadWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      postMessage(msg: { id: number }) {
        setTimeout(
          () => this.onmessage?.({ data: { id: msg.id, error: 'boom' } } as MessageEvent),
          0,
        );
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', BadWorker);
    const { runExact } = await import('./exactRunner');
    await expect(
      runExact('powerCurves', { ns: [20], alpha: 0.05, p1: 0.2, p2: 0.03 }),
    ).rejects.toThrow('boom');
    vi.unstubAllGlobals();
  });
});

describe('useExactTask', () => {
  it('resolves the task result and keeps it while args change', async () => {
    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const { useExactTask } = await import('@/hooks/useExactTask');

    const { result, rerender } = renderHook(
      ({ n }) => useExactTask('tableSpace', { n1: n, n2: n, grid: 'ui' }, [n]),
      { initialProps: { n: 10 } },
    );
    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(result.current.result!.n1).toBe(10);

    rerender({ n: 12 });
    await waitFor(() => expect(result.current.result!.n1).toBe(12));
    vi.unstubAllGlobals();
  });

  it('passes null args without resolving (out-of-range guard)', async () => {
    vi.resetModules();
    vi.stubGlobal('Worker', undefined);
    const { useExactTask } = await import('@/hooks/useExactTask');
    const { result } = renderHook(() => useExactTask('tableSpace', null, []));
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(result.current.result).toBeNull();
    vi.unstubAllGlobals();
  });
});
