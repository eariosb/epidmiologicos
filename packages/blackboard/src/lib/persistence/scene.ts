import type { BlackboardScene } from '../../types/blackboard';
import type { MigrationChain } from './migrate';
import { migrateRecord } from './migrate';
import { SCHEMA_VERSIONS } from './version';
import { assertScene, isRecord } from './validators';

/**
 * V1 -> V2: scenes saved before versioning existed.
 * Normalizes fields that may be absent in older records.
 */
const v1ToV2 = (prev: Record<string, unknown>): Record<string, unknown> => ({
  ...prev,
  elements: Array.isArray(prev.elements) ? prev.elements : [],
  appState: isRecord(prev.appState) ? prev.appState : {},
  notes: typeof prev.notes === 'string' ? prev.notes : '',
  matrixStates: isRecord(prev.matrixStates) ? prev.matrixStates : {},
  updatedAt: typeof prev.updatedAt === 'string' ? prev.updatedAt : new Date().toISOString(),
});

/**
 * V2 -> V3: adds progressive-reveal state.
 */
const v2ToV3 = (prev: Record<string, unknown>): Record<string, unknown> => ({
  ...prev,
  currentStep: typeof prev.currentStep === 'number' ? prev.currentStep : 0,
});

export const sceneMigrations: MigrationChain = {
  target: SCHEMA_VERSIONS.scene,
  steps: { 2: v1ToV2, 3: v2ToV3 },
};

/**
 * Read path: migrate lazily and validate. If the record needed migration,
 * callers should write it back (lazy upgrade).
 */
export function readScene(raw: unknown): { scene: BlackboardScene; migrated: boolean } {
  const { record, migrated } = migrateRecord<BlackboardScene>(raw, sceneMigrations);
  assertScene(record);
  return { scene: record, migrated };
}

/** Write path: stamp the current version and validate. Never write unvalidated data. */
export function writeScene(scene: BlackboardScene): BlackboardScene {
  const stamped = { ...scene, version: SCHEMA_VERSIONS.scene };
  assertScene(stamped);
  return stamped;
}
