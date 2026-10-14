/**
 * session-store CRUD over an in-memory idb-keyval mock.
 * Covers the wiring previously untested: session lifecycle, captures,
 * questions, visited sections and the activeSceneId resume pointer.
 */
/**
 * In-memory idb-keyval mock with stores keyed by name, so tests can
 * inject corrupt records and assert cross-store cascades (chat, events).
 */
vi.mock('idb-keyval', () => {
  const stores = new Map<string, Map<string, unknown>>();
  const backing = (name?: string) => {
    const key = name ?? 'default';
    if (!stores.has(key)) stores.set(key, new Map());
    return stores.get(key)!;
  };
  return {
    createStore: (name: string) => ({ __name: name }),
    get: (key: string, store?: { __name: string }) =>
      Promise.resolve(backing(store?.__name).get(key)),
    getMany: (ks: string[], store?: { __name: string }) =>
      Promise.resolve(ks.map((k) => backing(store?.__name).get(k))),
    set: (key: string, value: unknown, store?: { __name: string }) =>
      Promise.resolve(backing(store?.__name).set(key, value)),
    del: (key: string, store?: { __name: string }) =>
      Promise.resolve(backing(store?.__name).delete(key)),
    keys: (store?: { __name: string }) =>
      Promise.resolve([...backing(store?.__name).keys()]),
    /** test hook: write a raw record bypassing migration/validation */
    __put: (storeName: string, key: string, value: unknown) =>
      backing(storeName).set(key, value),
    __clear: () => stores.clear(),
  };
});

/** Write a raw record into a named store, bypassing all validation. */
async function injectRaw(storeName: string, key: string, value: unknown) {
  const idb = (await import('idb-keyval')) as unknown as {
    __put: (s: string, k: string, v: unknown) => void;
  };
  idb.__put(storeName, key, value);
}

type Store = typeof import('./session-store');
let store: Store;

describe('session-store', () => {
  beforeEach(async () => {
    // Fresh module instance → fresh in-memory stores; also reset the
    // ensureSession singleton between tests.
    vi.resetModules();
    const idb = (await import('idb-keyval')) as unknown as { __clear: () => void };
    idb.__clear();
    store = (await import('./session-store')) as Store;
    localStorage.clear();
  });

  it('creates a session and makes it active', async () => {
    const s = await store.createSession('Clase 1');
    expect(s.status).toBe('active');
    const active = await store.getActiveSession();
    expect(active?.id).toBe(s.id);
    expect(active?.visitedSections).toEqual([]);
  });

  it('records the visit journey faithfully: revisits kept, consecutive dupes skipped', async () => {
    await store.createSession('Clase');
    await store.addVisitedSection('a', 'A');
    await store.addVisitedSection('b', 'B');
    await store.addVisitedSection('a', 'A');
    // a double-fire (e.g. StrictMode remount) does not pollute the journey
    await store.addVisitedSection('a', 'A');
    const s = await store.getActiveSession();
    expect(s?.visitedSections.map((v) => v.slug)).toEqual(['a', 'b', 'a']);
  });

  it('records board-page visits in order for session replay', async () => {
    await store.createSession('Clase');
    await store.setSessionActiveScene('blackboard/m/1');
    await store.setSessionActiveScene('blackboard/m/2');
    await store.setSessionActiveScene('blackboard/m/2'); // consecutive: no dupe
    await store.setSessionActiveScene('blackboard/m/1'); // revisit: kept
    const s = await store.getActiveSession();
    expect(s?.sceneVisits.map((v) => v.sceneId)).toEqual([
      'blackboard/m/1',
      'blackboard/m/2',
      'blackboard/m/1',
    ]);
  });

  it('stamps logged events with the active session id', async () => {
    const s = await store.createSession('Clase');
    const { logEvent, listEvents } = await import('@cursos/blackboard');
    await logEvent('info', 'test event');
    const events = await listEvents();
    expect(events.at(-1)?.sessionId).toBe(s.id);
  });

  it('persists and restores the active board page (resume pointer)', async () => {
    await store.createSession('Clase');
    await store.setSessionActiveScene('blackboard/lmm/123');
    let s = await store.getActiveSession();
    expect(s?.activeSceneId).toBe('blackboard/lmm/123');
    await store.setSessionActiveScene('blackboard/lmm/456');
    s = await store.getActiveSession();
    expect(s?.activeSceneId).toBe('blackboard/lmm/456');
  });

  it('links captures to the active session and lists them newest-first', async () => {
    await store.createSession('Clase');
    await store.saveCapture({ name: 'c1', dataUrl: 'data:image/png;base64,a', thumbnail: 't', type: 'formula', tags: [], timestamp: 1 });
    await store.saveCapture({ name: 'c2', dataUrl: 'data:image/png;base64,b', thumbnail: 't', type: 'graph', tags: ['x'], timestamp: 2 });
    const caps = await store.listCaptures();
    expect(caps.map((c) => c.name)).toEqual(['c2', 'c1']);
    const s = await store.getActiveSession();
    expect(s?.captureIds).toHaveLength(2);
  });

  it('updates and deletes captures', async () => {
    await store.createSession('Clase');
    const cap = await store.saveCapture({ name: 'c', dataUrl: 'd', thumbnail: 't', type: 'other', tags: [], timestamp: 1 });
    await store.updateCapture(cap.id, { name: 'renombrada' });
    expect((await store.getCapture(cap.id))?.name).toBe('renombrada');
    await store.deleteCapture(cap.id);
    expect(await store.getCapture(cap.id)).toBeNull();
    expect((await store.getActiveSession())?.captureIds).toHaveLength(0);
  });

  it('manages student questions', async () => {
    await store.createSession('Clase');
    const q = await store.addQuestion('¿Por qué correlación AR(1)?');
    expect(q?.resolved).toBe(false);
    await store.updateQuestion(q!.id, { resolved: true });
    expect((await store.getActiveSession())?.questions[0].resolved).toBe(true);
    await store.deleteQuestion(q!.id);
    expect((await store.getActiveSession())?.questions).toHaveLength(0);
  });

  it('ends a session and starts a fresh one without leaking state', async () => {
    const s1 = await store.createSession('Clase 1');
    await store.endActiveSession();
    expect((await store.getActiveSession())?.status).toBe('ended');
    const s2 = await store.startNewSession('Clase 2');
    expect(s2.id).not.toBe(s1.id);
    expect((await store.getActiveSession())?.status).toBe('active');
    const all = await store.listAllSessions();
    expect(all).toHaveLength(2);
  });

  it('switches the active session and deletes sessions', async () => {
    const a = await store.createSession('A');
    const b = await store.startNewSession('B');
    await store.setActiveSessionId(a.id);
    expect((await store.getActiveSession())?.id).toBe(a.id);
    await store.deleteSession(a.id);
    // deleting the active session clears the pointer
    expect(await store.getActiveSession()).toBeNull();
    expect((await store.listAllSessions()).map((s) => s.id)).toEqual([b.id]);
  });

  it('serializes concurrent mutations so no write is lost', async () => {
    await store.createSession('Clase');
    await Promise.all([
      store.saveCapture({ name: 'c1', dataUrl: 'd', thumbnail: 't', type: 'other', tags: [], timestamp: 1 }),
      store.saveCapture({ name: 'c2', dataUrl: 'd', thumbnail: 't', type: 'graph', tags: [], timestamp: 2 }),
      store.addQuestion('¿Y el supuesto de independencia?'),
      store.addVisitedSection('m1', 'Módulo 1'),
    ]);
    const s = await store.getActiveSession();
    expect(s?.captureIds).toHaveLength(2);
    expect(s?.questions).toHaveLength(1);
    expect(s?.visitedSections).toHaveLength(1);
  });

  it('never appends to an ended session: writes start a fresh one', async () => {
    const s1 = await store.createSession('Clase 1');
    await store.endActiveSession();
    const cap = await store.saveCapture({ name: 'c', dataUrl: 'd', thumbnail: 't', type: 'other', tags: [], timestamp: 1 });
    const active = await store.getActiveSession();
    expect(active?.id).not.toBe(s1.id);
    expect(active?.status).toBe('active');
    expect(active?.captureIds).toEqual([cap.id]);
    // the closed record stays untouched
    const old = (await store.listAllSessions()).find((x) => x.id === s1.id);
    expect(old?.status).toBe('ended');
    expect(old?.captureIds).toHaveLength(0);
  });

  it('does not mutate an ended session via the scene resume pointer', async () => {
    const s1 = await store.createSession('Clase');
    await store.endActiveSession();
    await store.setSessionActiveScene('blackboard/m/1');
    const old = (await store.listAllSessions()).find((x) => x.id === s1.id);
    expect(old?.activeSceneId).toBeUndefined();
  });

  it('cascade-deletes captures and chat records with the session', async () => {
    const s = await store.createSession('Clase');
    const cap = await store.saveCapture({ name: 'c', dataUrl: 'd', thumbnail: 't', type: 'other', tags: [], timestamp: 1 });
    const { saveChatRecord, getChatRecord } = await import('./chat-store');
    await saveChatRecord({ sessionId: s.id, messages: [], provider: 'none', model: 'none', updatedAt: 1 });
    expect(await getChatRecord(s.id)).not.toBeNull();

    await store.deleteSession(s.id);
    expect(await store.getCapture(cap.id)).toBeNull();
    expect(await getChatRecord(s.id)).toBeNull();
    expect(await store.getActiveSession()).toBeNull();
  });

  it('tolerates a corrupt session record without blanking the history', async () => {
    const good = await store.createSession('Buena');
    await injectRaw('mlm-sessions', 'corrupt-1', { not: 'a session' });
    const all = await store.listAllSessions();
    expect(all.map((s) => s.id)).toEqual([good.id]);
    expect(await store.getSession('corrupt-1')).toBeNull();
  });

  it('notifies subscribers on data writes and on active-session switches', async () => {
    let dataChanges = 0;
    let switchedTo = '';
    const offData = store.onSessionChanged(() => { dataChanges += 1; });
    const offActive = store.onActiveSessionChanged((id) => { switchedTo = id; });

    const s = await store.createSession('A');
    expect(switchedTo).toBe(s.id);
    const afterCreate = dataChanges;
    await store.addVisitedSection('x', 'X');
    expect(dataChanges).toBeGreaterThan(afterCreate);

    const b = await store.startNewSession('B');
    await store.setActiveSessionId(s.id);
    expect(switchedTo).toBe(s.id);
    await store.setActiveSessionId(b.id);
    expect(switchedTo).toBe(b.id);
    offData();
    offActive();
  });

  it('creating a new session closes the previous one (one class at a time)', async () => {
    const a = await store.createSession('Clase A');
    const b = await store.startNewSession('Clase B');
    const all = await store.listAllSessions();
    expect(all.find((s) => s.id === a.id)?.status).toBe('ended');
    expect(all.find((s) => s.id === a.id)?.endedAt).toBeTruthy();
    expect(all.find((s) => s.id === b.id)?.status).toBe('active');
  });
});
