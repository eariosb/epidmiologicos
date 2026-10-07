/**
 * Progressive reveal ("steps") for board elements.
 *
 * Model: every element has an effective step = `customData.boardStep ?? 0`.
 * `scene.currentStep` is the reveal frontier: elements with a higher step
 * are rendered hidden (opacity 0 + locked, original opacity preserved in
 * `customData.prevOpacity` so revealing restores it exactly).
 *
 * Persisted scenes always store elements as reported by the canvas; hidden
 * elements keep their `boardStep` + `prevOpacity`, so the file stays
 * self-consistent and re-applying visibility is idempotent.
 */

type AnyElement = Record<string, unknown> & {
  id: string;
  customData?: Record<string, unknown>;
  opacity?: number;
  locked?: boolean;
};

export function elementStep(el: AnyElement): number {
  const s = el.customData?.boardStep;
  return typeof s === 'number' ? s : 0;
}

export function maxBoardStep(elements: readonly unknown[]): number {
  let max = 0;
  for (const el of elements) max = Math.max(max, elementStep(el as AnyElement));
  return max;
}

/**
 * Stamps `customData.boardStep = currentStep` on elements that lack it.
 * Used at persist time so elements drawn later belong to the new frontier.
 */
export function stampBoardStep(
  elements: readonly unknown[],
  currentStep: number,
): unknown[] {
  return elements.map((raw) => {
    const el = raw as AnyElement;
    if (typeof el.customData?.boardStep === 'number') return el;
    return { ...el, customData: { ...el.customData, boardStep: currentStep } };
  });
}

function isHiddenByStep(el: AnyElement): boolean {
  return el.customData?.hiddenByStep === true;
}

/**
 * Projects the scene for a given step: elements with boardStep > currentStep
 * become invisible and locked; elements reaching the frontier are restored
 * to their original opacity. Elements hidden for other reasons are untouched.
 */
export function applyStepVisibility(
  elements: readonly unknown[],
  currentStep: number,
): unknown[] {
  return elements.map((raw) => {
    const el = raw as AnyElement;
    const step = elementStep(el);
    const hidden = isHiddenByStep(el);

    if (step > currentStep && !hidden) {
      const rest = { ...el.customData };
      delete rest.hiddenByStep;
      delete rest.prevOpacity;
      return {
        ...el,
        opacity: 0,
        locked: true,
        customData: {
          ...rest,
          hiddenByStep: true,
          prevOpacity: typeof el.opacity === 'number' ? el.opacity : 100,
        },
      };
    }

    if (hidden && step <= currentStep) {
      const rest = { ...el.customData };
      const prevOpacity = typeof rest.prevOpacity === 'number' ? rest.prevOpacity : 100;
      delete rest.hiddenByStep;
      delete rest.prevOpacity;
      return {
        ...el,
        opacity: prevOpacity,
        locked: false,
        customData: rest,
      };
    }

    return el;
  });
}

/** Strips step-hiding flags — canonical elements for storage/export. */
export function canonicalElements(elements: readonly unknown[]): unknown[] {
  return elements.map((raw) => {
    const el = raw as AnyElement;
    if (!isHiddenByStep(el)) return el;
    const rest = { ...el.customData };
    const prevOpacity = typeof rest.prevOpacity === 'number' ? rest.prevOpacity : 100;
    delete rest.hiddenByStep;
    delete rest.prevOpacity;
    return {
      ...el,
      opacity: prevOpacity,
      locked: false,
      customData: rest,
    };
  });
}
