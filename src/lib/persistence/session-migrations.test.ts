import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSIONS } from '@cursos/blackboard/persistence';
import {
  migrateCapture,
  migrateSession,
  stampCapture,
  stampSession,
} from './session-migrations';
import type { Capture, Session } from '../session-store';

describe('session V1 -> V2', () => {
  it('migrates a legacy session without status/questions/version', () => {
    const legacy = {
      id: 'session-1',
      title: 'Clase 1',
      startedAt: 1000,
      updatedAt: 1000,
      captureIds: ['cap-1'],
    };
    const { session, migrated } = migrateSession(legacy);
    expect(migrated).toBe(true);
    expect(session.version).toBe(SCHEMA_VERSIONS.session);
    expect(session.status).toBe('active');
    expect(session.questions).toEqual([]);
    expect(session.visitedSections).toEqual([]);
    expect(session.captureIds).toEqual(['cap-1']);
  });

  it('is idempotent on current-version sessions', () => {
    const current = stampSession({
      version: 0,
      id: 's',
      title: 't',
      startedAt: 1,
      status: 'active',
      updatedAt: 1,
      visitedSections: [],
      captureIds: [],
      questions: [],
    } as Session);
    const { session, migrated } = migrateSession(current);
    expect(migrated).toBe(false);
    expect(session).toEqual(current);
  });

  it('rejects sessions missing required fields', () => {
    expect(() =>
      migrateSession({ version: 2, id: 's', title: 't', startedAt: 'bad' }),
    ).toThrow(/invalid session/);
  });
});

describe('capture V1 -> V2', () => {
  it('migrates a legacy capture without tags/version', () => {
    const legacy = {
      id: 'cap-1',
      name: 'Fórmula',
      dataUrl: 'data:image/png;base64,x',
      thumbnail: 'data:image/png;base64,x',
      type: 'formula',
      timestamp: 123,
    };
    const { capture, migrated } = migrateCapture(legacy);
    expect(migrated).toBe(true);
    expect(capture.version).toBe(SCHEMA_VERSIONS.capture);
    expect(capture.tags).toEqual([]);
  });

  it('preserves existing tags', () => {
    const { capture } = migrateCapture({
      version: 1,
      id: 'c',
      name: 'n',
      dataUrl: 'd',
      thumbnail: 't',
      type: 'graph',
      tags: ['mlm'],
      timestamp: 1,
    });
    expect(capture.tags).toEqual(['mlm']);
  });

  it('stampCapture enforces current version', () => {
    const stamped = stampCapture({
      version: 0,
      id: 'c',
      name: 'n',
      dataUrl: 'd',
      thumbnail: 't',
      type: 'code',
      tags: [],
      timestamp: 1,
    } as Capture);
    expect(stamped.version).toBe(SCHEMA_VERSIONS.capture);
  });
});
