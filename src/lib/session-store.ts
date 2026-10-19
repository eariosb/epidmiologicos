import { get, getMany, set, del, keys, createStore } from 'idb-keyval';
import { SCHEMA_VERSIONS } from '@cursos/blackboard/persistence';
import { logEvent, setEventSession } from '@cursos/blackboard';
import { deleteChatRecord } from './chat-store';
import { makeThumbnail } from './thumbnail';
import {
  migrateCapture,
  migrateSession,
  stampCapture,
  stampSession,
} from './persistence/session-migrations';

const SESSION_STORE = createStore('mlm-sessions', 'sessions');
const CAPTURE_STORE = createStore('mlm-captures', 'captures');

export type CaptureType = 'formula' | 'graph' | 'table' | 'code' | 'result' | 'other';

export interface Capture {
  /** Schema version; see packages/blackboard/src/lib/persistence/version.ts */
  version: number;
  id: string;
  name: string;
  dataUrl: string;
  thumbnail: string;
  type: CaptureType;
  tags: string[];
  sourceSection?: string;
  sourceModuleSlug?: string;
  code?: string;
  outputText?: string;
  plotUrls?: string[];
  timestamp: number;
}

export interface Question {
  id: string;
  text: string;
  timestamp: number;
  resolved: boolean;
}

export interface Session {
  /** Schema version; see packages/blackboard/src/lib/persistence/version.ts */
  version: number;
  id: string;
  title: string;
  courseId?: string;
  moduleSlug?: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
  updatedAt: number;
  visitedSections: { slug: string; title: string; timestamp: number }[];
  /** Board pages shown during the class, in order — feeds session replay. */
  sceneVisits: { sceneId: string; timestamp: number }[];
  captureIds: string[];
  questions: Question[];
  activeSceneId?: string;
}

export const ACTIVE_SESSION_KEY = 'mlm-active-session-id';
/**
 * Cross-tab sync marker: every session write bumps this localStorage key
 * so other tabs (a presenter view next to the module, a second screen)
 * refresh their session state through the `storage` event — which only
 * fires across tabs, never in the writing one.
 */
export const SESSION_CHANGED_KEY = 'mlm-session-changed';

let ensureSessionPromise: Promise<Session> | null = null;

/**
 * Serializes session mutations. Read-modify-write on the session record
 * is not atomic across IDB transactions: without this chain, two
 * concurrent writes (a capture save racing a question or a section
 * visit) overwrite each other's array updates and silently lose data.
 */
let mutationChain: Promise<unknown> = Promise.resolve();

function withMutation<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutationChain.then(fn, fn);
  mutationChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * Session change notifications. `onSessionChanged` fires after any
 * session data write (for UI stores like useSession, so every component
 * showing session state stays in sync). `onActiveSessionChanged` fires
 * only when the active-session pointer moves (for the board's resume
 * logic, which must not re-run on every write).
 */
const changeListeners = new Set<() => void>();
const activeListeners = new Set<(sessionId: string) => void>();

export function onSessionChanged(fn: () => void): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

export function onActiveSessionChanged(fn: (sessionId: string) => void): () => void {
  activeListeners.add(fn);
  return () => activeListeners.delete(fn);
}

function notifySessionChanged(): void {
  for (const fn of changeListeners) fn();
  // Cross-tab ping; degrades silently when localStorage is full/blocked.
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_CHANGED_KEY, String(Date.now()));
    }
  } catch {
    /* localStorage unavailable: cross-tab sync simply stops */
  }
}

function notifyActiveSessionChanged(id: string): void {
  for (const fn of activeListeners) fn(id);
  notifySessionChanged();
}

let idCounter = 0;

function makeId(prefix: string): string {
  const suffix =
    typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${++idCounter}`;
  return `${prefix}-${suffix}`;
}

async function getActiveSessionId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export async function setActiveSessionId(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
  setEventSession(id);
  notifyActiveSessionChanged(id);
}

export async function getSession(id: string): Promise<Session | null> {
  const raw = await get(id, SESSION_STORE);
  if (raw == null) return null;
  try {
    const { session, migrated } = migrateSession(raw);
    if (migrated) await set(id, session, SESSION_STORE);
    return session;
  } catch {
    // A corrupt record must not brick the session system: ignore it and
    // report, so the panel keeps working and a new session can be made.
    void logEvent('session', `corrupt session record ignored: ${id}`);
    return null;
  }
}

async function saveSession(session: Session): Promise<void> {
  await set(
    session.id,
    stampSession({ ...session, updatedAt: Date.now() }),
    SESSION_STORE,
  );
  notifySessionChanged();
}

/**
 * Raw creation: closes the currently active session (a new class means
 * the previous one ended — at most one session is 'active' at a time),
 * writes the new record and moves the pointer. NOT mutex-wrapped: it is
 * called from inside serialized mutations, so wrapping it here would
 * deadlock the chain.
 */
async function createSessionRecord(title: string, courseId?: string, moduleSlug?: string): Promise<Session> {
  const now = Date.now();
  const prev = await getActiveSession();
  if (prev && prev.status === 'active') {
    prev.status = 'ended';
    prev.endedAt = now;
    await saveSession(prev);
  }
  const session: Session = {
    version: SCHEMA_VERSIONS.session,
    id: makeId('session'),
    title,
    courseId,
    moduleSlug,
    startedAt: now,
    status: 'active',
    updatedAt: now,
    visitedSections: [],
    sceneVisits: [],
    captureIds: [],
    questions: [],
  };
  await saveSession(session);
  await setActiveSessionId(session.id);
  return session;
}

export async function createSession(title: string, courseId?: string, moduleSlug?: string): Promise<Session> {
  return withMutation(() => createSessionRecord(title, courseId, moduleSlug));
}

export async function ensureSession(title = 'Sesión actual', courseId?: string, moduleSlug?: string): Promise<Session> {
  if (ensureSessionPromise !== null) return ensureSessionPromise;
  ensureSessionPromise = (async () => {
    try {
      const activeId = await getActiveSessionId();
      if (activeId) {
        const existing = await getSession(activeId);
        // An ended session is a closed record: appends (captures,
        // questions, visits) never mutate it — they start a new one.
        if (existing && existing.status === 'active') return existing;
      }
      return createSessionRecord(title, courseId, moduleSlug);
    } finally {
      ensureSessionPromise = null;
    }
  })();
  return ensureSessionPromise;
}

export async function getActiveSession(): Promise<Session | null> {
  const id = await getActiveSessionId();
  if (!id) {
    setEventSession(null);
    return null;
  }
  const session = await getSession(id);
  // Keep the event log's session context truthful even on app load,
  // when no setActiveSessionId call happens.
  setEventSession(session?.id ?? null);
  return session;
}

/** Records which board page the class was on so resuming restores it. */
export async function setSessionActiveScene(sceneId: string | null): Promise<void> {
  return withMutation(async () => {
    const session = await getActiveSession();
    if (!session || session.status !== 'active') return;
    if (session.activeSceneId === (sceneId ?? undefined)) return;
    session.activeSceneId = sceneId ?? undefined;
    if (sceneId) {
      const last = session.sceneVisits[session.sceneVisits.length - 1];
      if (last?.sceneId !== sceneId) {
        session.sceneVisits = [...session.sceneVisits, { sceneId, timestamp: Date.now() }];
      }
    }
    await saveSession(session);
  });
}

export async function addVisitedSection(slug: string, title: string): Promise<void> {
  return withMutation(async () => {
    const session = await ensureSession();
    // The first visited module stamps the session's moduleSlug — exports
    // use it for the cover line when the session was auto-created.
    const stamping = !session.moduleSlug;
    if (stamping) session.moduleSlug = slug;
    // Append-only journey: revisits are real events in the class timeline.
    // Only consecutive duplicates are skipped (double-mount artifacts).
    const last = session.visitedSections[session.visitedSections.length - 1];
    if (last?.slug !== slug) {
      session.visitedSections = [...session.visitedSections, { slug, title, timestamp: Date.now() }];
      await saveSession(session);
    } else if (stamping) {
      await saveSession(session);
    }
  });
}

/** Turns a raw IDB failure into an actionable message (quota is the
 *  realistic failure mode once captures accumulate full PNG dataURLs). */
function friendlyStorageError(err: unknown): Error {
  if (
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.code === 22)
  ) {
    void logEvent('session', 'storage quota exceeded while saving');
    return new Error(
      'Sin espacio en el almacenamiento local. Exporta y borra sesiones antiguas.',
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

export async function saveCapture(
  capture: Omit<Capture, 'id' | 'version' | 'thumbnail'> & { thumbnail?: string },
): Promise<Capture> {
  // Generated outside the mutation chain: canvas work touches no state.
  const thumbnail = capture.thumbnail ?? (await makeThumbnail(capture.dataUrl));
  return withMutation(async () => {
    const session = await ensureSession();
    const id = makeId('capture');
    const full: Capture = stampCapture({ ...capture, thumbnail, id, version: 0 });
    try {
      await set(id, full, CAPTURE_STORE);
      session.captureIds = [...session.captureIds, id];
      await saveSession(session);
    } catch (err) {
      throw friendlyStorageError(err);
    }
    return full;
  });
}

export async function getCapture(id: string): Promise<Capture | null> {
  const raw = await get(id, CAPTURE_STORE);
  if (raw == null) return null;
  try {
    const { capture, migrated } = migrateCapture(raw);
    if (migrated) await set(id, capture, CAPTURE_STORE);
    return capture;
  } catch {
    void logEvent('session', `corrupt capture record ignored: ${id}`);
    return null;
  }
}

export async function deleteCapture(id: string): Promise<void> {
  return withMutation(async () => {
    const session = await getActiveSession();
    if (session) {
      session.captureIds = session.captureIds.filter((cid) => cid !== id);
      await saveSession(session);
    }
    await del(id, CAPTURE_STORE);
  });
}

export async function updateCapture(id: string, patch: Partial<Capture>): Promise<Capture | null> {
  return withMutation(async () => {
    const existing = await getCapture(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    await set(id, stampCapture(updated), CAPTURE_STORE);
    notifySessionChanged();
    return updated;
  });
}

/** Batch-reads captures by id in one IDB call; corrupt records are
 *  skipped (and logged) instead of failing the whole listing. */
async function fetchCaptures(ids: string[]): Promise<Capture[]> {
  if (ids.length === 0) return [];
  const raw = await getMany(ids, CAPTURE_STORE);
  const out: Capture[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (r == null) continue;
    try {
      const { capture, migrated } = migrateCapture(r);
      if (migrated) await set(ids[i], capture, CAPTURE_STORE);
      out.push(capture);
    } catch {
      void logEvent('session', `corrupt capture record ignored: ${ids[i]}`);
    }
  }
  return out;
}

export async function listCaptures(): Promise<Capture[]> {
  const session = await getActiveSession();
  const captures = await fetchCaptures(session?.captureIds ?? []);
  captures.sort((a, b) => b.timestamp - a.timestamp);
  return captures;
}

/** Captures of ANY session (not just the active one) — used by replay. */
export async function listSessionCaptures(sessionOrId: Session | string): Promise<Capture[]> {
  const session = typeof sessionOrId === 'string' ? await getSession(sessionOrId) : sessionOrId;
  return fetchCaptures(session?.captureIds ?? []);
}

export async function addQuestion(text: string): Promise<Question | null> {
  return withMutation(async () => {
    const session = await ensureSession();
    const question: Question = {
      id: makeId('q'),
      text,
      timestamp: Date.now(),
      resolved: false,
    };
    session.questions = [...session.questions, question];
    await saveSession(session);
    return question;
  });
}

export async function updateQuestion(id: string, patch: Partial<Question>): Promise<Question | null> {
  return withMutation(async () => {
    const session = await getActiveSession();
    if (!session) return null;
    const idx = session.questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    const updated = { ...session.questions[idx], ...patch };
    session.questions[idx] = updated;
    await saveSession(session);
    return updated;
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  return withMutation(async () => {
    const session = await getActiveSession();
    if (!session) return;
    session.questions = session.questions.filter((q) => q.id !== id);
    await saveSession(session);
  });
}

export async function endActiveSession(): Promise<Session | null> {
  return withMutation(async () => {
    const session = await getActiveSession();
    if (!session) return null;
    session.status = 'ended';
    session.endedAt = Date.now();
    await saveSession(session);
    return session;
  });
}

export async function startNewSession(title = 'Nueva sesión', courseId?: string, moduleSlug?: string): Promise<Session> {
  return withMutation(async () => {
    ensureSessionPromise = null;
    return createSessionRecord(title, courseId, moduleSlug);
  });
}

export async function listAllSessions(): Promise<Session[]> {
  const allKeys = await keys(SESSION_STORE);
  const sessions: Session[] = [];
  for (const key of allKeys) {
    try {
      const raw = await get(key as string, SESSION_STORE);
      if (raw == null) continue;
      const { session, migrated } = migrateSession(raw);
      if (migrated) await set(key as string, session, SESSION_STORE);
      sessions.push(session);
    } catch {
      // One corrupt record must not blank the session history.
      void logEvent('session', `corrupt session record skipped: ${String(key)}`);
    }
  }
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  return sessions;
}

export async function deleteSession(id: string): Promise<void> {
  return withMutation(async () => {
    // Cascade: a session must not leave orphaned captures or chat
    // records behind — they are only reachable through the session.
    const session = await getSession(id);
    if (session) {
      await Promise.all(session.captureIds.map((cid) => del(cid, CAPTURE_STORE)));
    }
    await deleteChatRecord(id).catch(() => undefined);
    await del(id, SESSION_STORE);
    const activeId = await getActiveSessionId();
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      setEventSession(null);
    }
    notifySessionChanged();
  });
}
