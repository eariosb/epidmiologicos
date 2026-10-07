import { get, set, del, keys, createStore } from 'idb-keyval';
import { SCHEMA_VERSIONS } from '@cursos/blackboard/persistence';
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
  captureIds: string[];
  questions: Question[];
  activeSceneId?: string;
}

const ACTIVE_SESSION_KEY = 'mlm-active-session-id';

let ensureSessionPromise: Promise<Session> | null = null;

let idCounter = 0;

function makeId(prefix: string): string {
  const suffix =
    typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${++idCounter}`;
  return `${prefix}-${suffix}`;
}

export async function getActiveSessionId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export async function setActiveSessionId(id: string): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export async function getSession(id: string): Promise<Session | null> {
  const raw = await get(id, SESSION_STORE);
  if (raw == null) return null;
  const { session, migrated } = migrateSession(raw);
  if (migrated) await set(id, session, SESSION_STORE);
  return session;
}

export async function saveSession(session: Session): Promise<void> {
  await set(
    session.id,
    stampSession({ ...session, updatedAt: Date.now() }),
    SESSION_STORE,
  );
}

export async function createSession(title: string, courseId?: string, moduleSlug?: string): Promise<Session> {
  const now = Date.now();
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
    captureIds: [],
    questions: [],
  };
  await saveSession(session);
  await setActiveSessionId(session.id);
  return session;
}

export async function ensureSession(title = 'Sesión actual', courseId?: string, moduleSlug?: string): Promise<Session> {
  if (ensureSessionPromise !== null) return ensureSessionPromise;
  ensureSessionPromise = (async () => {
    const activeId = await getActiveSessionId();
    if (activeId) {
      const existing = await getSession(activeId);
      if (existing) return existing;
    }
    return createSession(title, courseId, moduleSlug);
  })();
  ensureSessionPromise.finally(() => {
    ensureSessionPromise = null;
  });
  return ensureSessionPromise;
}

export async function getActiveSession(): Promise<Session | null> {
  const id = await getActiveSessionId();
  if (!id) return null;
  return getSession(id);
}

/** Records which board page the class was on so resuming restores it. */
export async function setSessionActiveScene(sceneId: string | null): Promise<void> {
  const session = await getActiveSession();
  if (!session || session.activeSceneId === (sceneId ?? undefined)) return;
  session.activeSceneId = sceneId ?? undefined;
  await saveSession(session);
}

export async function addVisitedSection(slug: string, title: string): Promise<void> {
  const session = await ensureSession();
  session.visitedSections = session.visitedSections.filter((s) => s.slug !== slug);
  session.visitedSections.push({ slug, title, timestamp: Date.now() });
  await saveSession(session);
}

export async function saveCapture(capture: Omit<Capture, 'id' | 'version'>): Promise<Capture> {
  const session = await ensureSession();
  const id = makeId('capture');
  const full: Capture = stampCapture({ ...capture, id, version: 0 });
  await set(id, full, CAPTURE_STORE);
  session.captureIds = [...session.captureIds, id];
  await saveSession(session);
  return full;
}

export async function getCapture(id: string): Promise<Capture | null> {
  const raw = await get(id, CAPTURE_STORE);
  if (raw == null) return null;
  const { capture, migrated } = migrateCapture(raw);
  if (migrated) await set(id, capture, CAPTURE_STORE);
  return capture;
}

export async function deleteCapture(id: string): Promise<void> {
  const session = await getActiveSession();
  if (session) {
    session.captureIds = session.captureIds.filter((cid) => cid !== id);
    await saveSession(session);
  }
  await del(id, CAPTURE_STORE);
}

export async function updateCapture(id: string, patch: Partial<Capture>): Promise<Capture | null> {
  const existing = await getCapture(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  await set(id, stampCapture(updated), CAPTURE_STORE);
  return updated;
}

export async function listCaptures(): Promise<Capture[]> {
  const session = await getActiveSession();
  const ids = session?.captureIds ?? [];
  const captures: Capture[] = [];
  for (const id of ids) {
    const cap = await getCapture(id);
    if (cap) captures.push(cap);
  }
  captures.sort((a, b) => b.timestamp - a.timestamp);
  return captures;
}

export async function addQuestion(text: string): Promise<Question | null> {
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
}

export async function updateQuestion(id: string, patch: Partial<Question>): Promise<Question | null> {
  const session = await getActiveSession();
  if (!session) return null;
  const idx = session.questions.findIndex((q) => q.id === id);
  if (idx === -1) return null;
  const updated = { ...session.questions[idx], ...patch };
  session.questions[idx] = updated;
  await saveSession(session);
  return updated;
}

export async function deleteQuestion(id: string): Promise<void> {
  const session = await getActiveSession();
  if (!session) return;
  session.questions = session.questions.filter((q) => q.id !== id);
  await saveSession(session);
}

export async function endActiveSession(): Promise<Session | null> {
  const session = await getActiveSession();
  if (!session) return null;
  session.status = 'ended';
  session.endedAt = Date.now();
  await saveSession(session);
  return session;
}

export async function startNewSession(title = 'Nueva sesión', courseId?: string, moduleSlug?: string): Promise<Session> {
  ensureSessionPromise = null;
  return createSession(title, courseId, moduleSlug);
}

export async function listAllSessions(): Promise<Session[]> {
  const allKeys = await keys(SESSION_STORE);
  const sessions: Session[] = [];
  for (const key of allKeys) {
    const raw = await get(key as string, SESSION_STORE);
    if (raw == null) continue;
    const { session, migrated } = migrateSession(raw);
    if (migrated) await set(key as string, session, SESSION_STORE);
    sessions.push(session);
  }
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
  return sessions;
}

export async function deleteSession(id: string): Promise<void> {
  await del(id, SESSION_STORE);
  const activeId = await getActiveSessionId();
  if (activeId === id) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}
