import { describe, expect, it } from 'vitest';
import { buildSessionTimeline, sceneLabel } from './session-timeline';
import type { Capture, Session } from './session-store';

const baseSession: Session = {
  version: 3,
  id: 's1',
  title: 'Clase',
  startedAt: 100,
  endedAt: 900,
  status: 'ended',
  updatedAt: 900,
  visitedSections: [
    { slug: 'm2', title: 'M2', timestamp: 400 },
    { slug: 'm1', title: 'M1', timestamp: 200 },
  ],
  sceneVisits: [{ sceneId: 'blackboard/m1/1', timestamp: 300 }],
  captureIds: ['c1'],
  questions: [
    { id: 'q1', text: '¿Por qué?', timestamp: 500, resolved: true },
  ],
};

const cap: Capture = {
  version: 2,
  id: 'c1',
  name: 'Tabla',
  dataUrl: 'd',
  thumbnail: 't',
  type: 'table',
  tags: [],
  timestamp: 600,
};

describe('buildSessionTimeline', () => {
  it('merges all activity into chronological order with start/end markers', () => {
    const items = buildSessionTimeline(baseSession, [cap]);
    expect(items.map((i) => i.kind)).toEqual([
      'start',    // 100
      'section',  // 200 — m1
      'board',    // 300
      'section',  // 400 — m2
      'question', // 500
      'capture',  // 600
      'end',      // 900
    ]);
    expect(items[1]).toMatchObject({ kind: 'section', slug: 'm1' });
    expect(items[3]).toMatchObject({ kind: 'section', slug: 'm2' });
    expect(items[5]).toMatchObject({ kind: 'capture', capture: cap });
    expect(items[4]).toMatchObject({ kind: 'question' });
  });

  it('handles an open session without end marker', () => {
    const open = { ...baseSession, endedAt: undefined, status: 'active' as const };
    const items = buildSessionTimeline(open, []);
    expect(items[0].kind).toBe('start');
    expect(items.some((i) => i.kind === 'end')).toBe(false);
  });

  it('tolerates sessions without sceneVisits (pre-migration shape)', () => {
    const legacy = { ...baseSession, sceneVisits: undefined } as unknown as Session;
    const items = buildSessionTimeline(legacy, []);
    expect(items.some((i) => i.kind === 'board')).toBe(false);
  });
});

describe('sceneLabel', () => {
  it('derives a readable label from the scene id', () => {
    expect(sceneLabel('blackboard/06-inferencia/123')).toBe('Página del tablero · 06-inferencia');
    expect(sceneLabel('orphan')).toBe('Página del tablero');
  });
});
