import { describe, expect, it } from 'vitest';
import {
  applyStepVisibility,
  canonicalElements,
  elementStep,
  maxBoardStep,
  stampBoardStep,
} from './steps';

const el = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'rectangle',
  opacity: 100,
  ...extra,
});

describe('elementStep / maxBoardStep', () => {
  it('defaults to 0 without customData', () => {
    expect(elementStep(el('a'))).toBe(0);
    expect(elementStep(el('b', { customData: {} }))).toBe(0);
  });

  it('reads boardStep from customData', () => {
    expect(elementStep(el('a', { customData: { boardStep: 2 } }))).toBe(2);
  });

  it('maxBoardStep is the highest step present', () => {
    expect(
      maxBoardStep([el('a'), el('b', { customData: { boardStep: 3 } }), el('c')]),
    ).toBe(3);
  });
});

describe('stampBoardStep', () => {
  it('stamps elements lacking boardStep with the given step', () => {
    const out = stampBoardStep([el('a'), el('b', { customData: { boardStep: 5 } })], 2) as {
      id: string;
      customData?: { boardStep?: number };
    }[];
    expect(out[0].customData?.boardStep).toBe(2);
    expect(out[1].customData?.boardStep).toBe(5); // untouched
  });
});

describe('applyStepVisibility', () => {
  it('hides elements above the frontier and keeps them locked', () => {
    const out = applyStepVisibility(
      [el('a'), el('b', { customData: { boardStep: 1 } })],
      0,
    ) as { id: string; opacity?: number; locked?: boolean; customData?: Record<string, unknown> }[];
    expect(out[0].opacity).toBe(100);
    expect(out[1].opacity).toBe(0);
    expect(out[1].locked).toBe(true);
    expect(out[1].customData?.hiddenByStep).toBe(true);
    expect(out[1].customData?.prevOpacity).toBe(100);
  });

  it('reveals elements when the frontier reaches them (restores prevOpacity)', () => {
    const hidden = applyStepVisibility(
      [el('b', { customData: { boardStep: 1 }, opacity: 60 })],
      0,
    );
    const revealed = applyStepVisibility(hidden, 1) as { opacity?: number; customData?: Record<string, unknown> }[];
    expect(revealed[0].opacity).toBe(60);
    expect(revealed[0].customData?.hiddenByStep).toBeUndefined();
  });

  it('is idempotent', () => {
    const once = applyStepVisibility([el('a', { customData: { boardStep: 2 } })], 0);
    const twice = applyStepVisibility(once, 0);
    expect(twice).toEqual(once);
  });
});

describe('canonicalElements', () => {
  it('restores opacity/locked and strips hiding flags', () => {
    const projected = applyStepVisibility(
      [el('a', { customData: { boardStep: 5 }, opacity: 80 })],
      0,
    );
    const canonical = canonicalElements(projected) as {
      opacity?: number;
      locked?: boolean;
      customData?: Record<string, unknown>;
    }[];
    expect(canonical[0].opacity).toBe(80);
    expect(canonical[0].locked).toBe(false);
    expect(canonical[0].customData?.boardStep).toBe(5);
    expect(canonical[0].customData?.hiddenByStep).toBeUndefined();
  });
});
