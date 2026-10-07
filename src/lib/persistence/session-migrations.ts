import {
  migrateRecord,
  SCHEMA_VERSIONS,
  type MigrationChain,
} from '@cursos/blackboard/persistence';
import type { Capture, Session } from '../session-store';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/* ---------------------------------- session ---------------------------------- */

/**
 * V1 -> V2: sessions saved before `status`/`questions`/versioning existed.
 */
const sessionV1toV2 = (prev: Record<string, unknown>): Record<string, unknown> => ({
  ...prev,
  status: prev.status === 'ended' ? 'ended' : 'active',
  questions: Array.isArray(prev.questions) ? prev.questions : [],
  visitedSections: Array.isArray(prev.visitedSections) ? prev.visitedSections : [],
  captureIds: Array.isArray(prev.captureIds) ? prev.captureIds : [],
});

export const sessionMigrations: MigrationChain = {
  target: SCHEMA_VERSIONS.session,
  steps: { 2: sessionV1toV2 },
};

/* ---------------------------------- capture ---------------------------------- */

/**
 * V1 -> V2: captures saved before `tags`/versioning existed.
 */
const captureV1toV2 = (prev: Record<string, unknown>): Record<string, unknown> => ({
  ...prev,
  tags: Array.isArray(prev.tags) ? prev.tags : [],
});

export const captureMigrations: MigrationChain = {
  target: SCHEMA_VERSIONS.capture,
  steps: { 2: captureV1toV2 },
};

/* --------------------------------- validators -------------------------------- */

export function assertSession(v: unknown): asserts v is Session {
  const bad = (field: string) => new Error(`invalid session: bad ${field}`);
  if (!isRecord(v)) throw bad('record');
  if (typeof v.id !== 'string' || v.id.length === 0) throw bad('id');
  if (typeof v.title !== 'string') throw bad('title');
  if (typeof v.startedAt !== 'number') throw bad('startedAt');
  if (v.status !== 'active' && v.status !== 'ended') throw bad('status');
  if (!Array.isArray(v.visitedSections)) throw bad('visitedSections');
  if (!Array.isArray(v.captureIds)) throw bad('captureIds');
  if (!Array.isArray(v.questions)) throw bad('questions');
  if (v.version !== SCHEMA_VERSIONS.session) throw bad('version');
}

export function assertCapture(v: unknown): asserts v is Capture {
  const bad = (field: string) => new Error(`invalid capture: bad ${field}`);
  if (!isRecord(v)) throw bad('record');
  if (typeof v.id !== 'string' || v.id.length === 0) throw bad('id');
  if (typeof v.name !== 'string') throw bad('name');
  if (typeof v.dataUrl !== 'string') throw bad('dataUrl');
  if (typeof v.timestamp !== 'number') throw bad('timestamp');
  if (!Array.isArray(v.tags)) throw bad('tags');
  if (v.version !== SCHEMA_VERSIONS.capture) throw bad('version');
}

/* ------------------------------- read/write API ------------------------------ */

export function migrateSession(raw: unknown): { session: Session; migrated: boolean } {
  const { record, migrated } = migrateRecord<Session>(raw, sessionMigrations);
  assertSession(record);
  return { session: record, migrated };
}

export function stampSession(session: Session): Session {
  const stamped = { ...session, version: SCHEMA_VERSIONS.session };
  assertSession(stamped);
  return stamped;
}

export function migrateCapture(raw: unknown): { capture: Capture; migrated: boolean } {
  const { record, migrated } = migrateRecord<Capture>(raw, captureMigrations);
  assertCapture(record);
  return { capture: record, migrated };
}

export function stampCapture(capture: Capture): Capture {
  const stamped = { ...capture, version: SCHEMA_VERSIONS.capture };
  assertCapture(stamped);
  return stamped;
}
