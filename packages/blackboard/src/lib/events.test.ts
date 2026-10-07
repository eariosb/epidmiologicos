import { describe, expect, it } from 'vitest';
import { clearEvents, listEvents, logEvent } from './events';

describe('events ring buffer (memory fallback in jsdom)', () => {
  it('appends and lists events newest-persisted order', async () => {
    await clearEvents();
    await logEvent('info', 'first');
    await logEvent('tool-result', 'insert_math');
    const events = await listEvents();
    expect(events.map((e) => e.message)).toContain('first');
    expect(events.map((e) => e.message)).toContain('insert_math');
  });

  it('caps the ring at 500 events', async () => {
    await clearEvents();
    for (let i = 0; i < 505; i++) {
      await logEvent('info', `ev-${i}`);
    }
    const events = await listEvents();
    expect(events.length).toBeLessThanOrEqual(500);
    expect(events.at(-1)?.message).toBe('ev-504');
  });
});
