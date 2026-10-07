import { migrateRecord, MigrationError } from './migrate';
import { readScene, writeScene, sceneMigrations } from './scene';
import { SCHEMA_VERSIONS } from './version';
import type { BlackboardScene } from '../../types/blackboard';

const chain = {
  target: 3,
  steps: {
    2: (p: Record<string, unknown>) => ({ ...p, v2: true }),
    3: (p: Record<string, unknown>) => ({ ...p, v3: true }),
  },
};

describe('migrateRecord', () => {
  it('treats records without version as V1 and applies all steps', () => {
    const { record, migrated, from } = migrateRecord<Record<string, unknown>>(
      { id: 'x' },
      chain,
    );
    expect(from).toBe(1);
    expect(migrated).toBe(true);
    expect(record.version).toBe(3);
    expect(record.v2).toBe(true);
    expect(record.v3).toBe(true);
  });

  it('is idempotent on current-version records', () => {
    const { record, migrated } = migrateRecord<Record<string, unknown>>(
      { id: 'x', version: 3 },
      chain,
    );
    expect(migrated).toBe(false);
    expect(record.v2).toBeUndefined();
  });

  it('applies only the remaining steps from an intermediate version', () => {
    const { record } = migrateRecord<Record<string, unknown>>({ id: 'x', version: 2 }, chain);
    expect(record.version).toBe(3);
    expect(record.v3).toBe(true);
    expect(record.v2).toBeUndefined();
  });

  it('throws on missing step', () => {
    expect(() =>
      migrateRecord({ id: 'x' }, { target: 2, steps: {} }),
    ).toThrow(MigrationError);
  });

  it('throws on records newer than supported', () => {
    expect(() =>
      migrateRecord({ id: 'x', version: 9 }, chain),
    ).toThrow(/newer than supported/);
  });

  it('throws on non-object records', () => {
    expect(() => migrateRecord('junk', chain)).toThrow(/non-object/);
  });
});

describe('scene V1 -> V2', () => {
  it('migrates a legacy scene without version or matrixStates', () => {
    const legacy = {
      id: 's1',
      moduleSlug: 'mod1',
      elements: [{ id: 'e1' }],
      appState: { zoom: 1 },
      notes: 'nota',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const { scene, migrated } = readScene(legacy);
    expect(migrated).toBe(true);
    expect(scene.version).toBe(SCHEMA_VERSIONS.scene);
    expect(scene.matrixStates).toEqual({});
    expect(scene.elements).toHaveLength(1);
  });

  it('normalizes malformed optional fields', () => {
    const { scene } = readScene({
      version: 1,
      id: 's2',
      moduleSlug: 'm',
      elements: 'corrupt',
      appState: 42,
      notes: null,
      matrixStates: 'bad',
      updatedAt: 'x',
    });
    expect(scene.elements).toEqual([]);
    expect(scene.appState).toEqual({});
    expect(scene.notes).toBe('');
    expect(scene.matrixStates).toEqual({});
  });

  it('writeScene stamps version and rejects invalid records', () => {
    const scene: BlackboardScene = {
      version: 1,
      id: 's3',
      moduleSlug: 'm',
      elements: [],
      appState: {},
      notes: '',
      matrixStates: {},
      currentStep: 0,
      updatedAt: 't',
    };
    const stamped = writeScene(scene);
    expect(stamped.version).toBe(SCHEMA_VERSIONS.scene);

    expect(() =>
      writeScene({ ...stamped, elements: 'not-an-array' as never }),
    ).toThrow(/invalid scene/);
  });

  it('readScene -> writeScene round-trip is stable', () => {
    const legacy = { id: 's4', moduleSlug: 'm', elements: [] };
    const { scene } = readScene(legacy);
    const again = readScene(writeScene(scene));
    expect(again.migrated).toBe(false);
    expect(again.scene).toEqual(writeScene(scene));
  });
});
