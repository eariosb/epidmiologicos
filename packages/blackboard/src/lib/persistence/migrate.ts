import { UNVERSIONED } from './version';

/** A migration step: takes a V(n-1) record, returns a V(n) record. */
export type MigrationFn = (prev: Record<string, unknown>) => Record<string, unknown>;

export interface MigrationChain {
  /** Highest supported version for this store. */
  target: number;
  /** steps[n] migrates a record from V(n-1) to V(n). */
  steps: Record<number, MigrationFn>;
}

export interface MigrationResult<T> {
  record: T;
  from: number;
  migrated: boolean;
}

export class MigrationError extends Error {
  constructor(
    public readonly reason: 'not-an-object' | 'newer-than-supported' | 'missing-step',
    message: string,
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

function recordVersion(raw: Record<string, unknown>): number {
  return typeof raw.version === 'number' ? raw.version : UNVERSIONED;
}

/**
 * Migrates a persisted record to `chain.target` version.
 * - `version` absent → treated as UNVERSIONED (1).
 * - `version > target` → throws (no downgrade support).
 * - missing step → throws MigrationError('missing-step').
 */
export function migrateRecord<T>(raw: unknown, chain: MigrationChain): MigrationResult<T> {
  if (typeof raw !== 'object' || raw === null) {
    throw new MigrationError('not-an-object', 'cannot migrate a non-object record');
  }

  let record = { ...(raw as Record<string, unknown>) };
  let version = recordVersion(record);
  const from = version;

  if (version > chain.target) {
    throw new MigrationError(
      'newer-than-supported',
      `record version ${version} is newer than supported ${chain.target}`,
    );
  }

  while (version < chain.target) {
    const step = chain.steps[version + 1];
    if (!step) {
      throw new MigrationError(
        'missing-step',
        `missing migration step ${version} -> ${version + 1}`,
      );
    }
    record = step(record);
    version += 1;
    record.version = version;
  }

  return { record: record as T, from, migrated: from !== chain.target };
}
