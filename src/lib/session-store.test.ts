/**
 * session-store CRUD over an in-memory idb-keyval mock.
 * Covers the wiring previously untested: session lifecycle, captures,
 * questions, visited sections and the activeSceneId resume pointer.
 */
vi.mock('idb-keyval', () => ({
  createStore: () => ({ backing: new Map<string, unknown>() }),
  get: (key: string, store?: { backing: Map<string, unknown> }) =>
    Promise.resolve(store?.backing.get(key)),
  set: (key: string, value: unknown, store?: { backing: Map<string, unknown> }) =>
    Promise.resolve(store?.backing.set(key, value)),
  del: (key: string, store?: { backing: Map<string, unknown> }) =>
    Promise.resolve(store?.backing.delete(key)),
  keys: (store?: { backing: Map<string, unknown> }) =>
    Promise.resolve([...(store?.backing.keys() ?? [])]),
}));

type Store = typeof import('./session-store');
let store: Store;

describe('session-store', () => {
  beforeEach(async () => {
    // Fresh module instance → fresh in-memory stores; also reset the
    // ensureSession singleton between tests.
    vi.resetModules();
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

  it('records visited sections without duplicates (revisit moves to the end)', async () => {
    await store.createSession('Clase');
    await store.addVisitedSection('a', 'A');
    await store.addVisitedSection('b', 'B');
    await store.addVisitedSection('a', 'A');
    const s = await store.getActiveSession();
    expect(s?.visitedSections.map((v) => v.slug)).toEqual(['b', 'a']);
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
});
