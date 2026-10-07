import type { BlackboardScene, MatrixState } from '../../types/blackboard';
import { SCHEMA_VERSIONS } from './version';

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function assert(cond: boolean, field: string): void {
  if (!cond) throw new Error(`invalid scene: bad ${field}`);
}

function isMatrixState(v: unknown): v is MatrixState {
  return (
    isRecord(v) &&
    typeof v.elementId === 'string' &&
    typeof v.rows === 'number' &&
    typeof v.cols === 'number' &&
    Array.isArray(v.values)
  );
}

/** Invariants every persisted BlackboardScene must satisfy. */
export function assertScene(v: unknown): asserts v is BlackboardScene {
  assert(isRecord(v), 'record');
  const s = v as Record<string, unknown>;
  assert(typeof s.id === 'string' && s.id.length > 0, 'id');
  assert(typeof s.moduleSlug === 'string', 'moduleSlug');
  assert(Array.isArray(s.elements), 'elements');
  assert(isRecord(s.appState), 'appState');
  assert(typeof s.notes === 'string', 'notes');
  assert(
    isRecord(s.matrixStates) && Object.values(s.matrixStates).every(isMatrixState),
    'matrixStates',
  );
  assert(typeof s.currentStep === 'number' && s.currentStep >= 0, 'currentStep');
  assert(typeof s.updatedAt === 'string', 'updatedAt');
  assert(s.version === SCHEMA_VERSIONS.scene, 'version');
}
