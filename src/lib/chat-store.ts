import { get as idbGet, set as idbSet, del as idbDel, createStore } from 'idb-keyval';
import { migrateRecord, SCHEMA_VERSIONS, type MigrationChain } from '@cursos/blackboard/persistence';
import type { LLMMessage } from '@cursos/blackboard';

const store = createStore('bb-chat', 'chat-records');

export interface ChatRecord {
  version: number;
  sessionId: string;
  messages: LLMMessage[];
  provider: string;
  model: string;
  updatedAt: number;
}

const chatMigrations: MigrationChain = {
  target: SCHEMA_VERSIONS.chat,
  steps: {},
};

export function migrateChat(raw: unknown): ChatRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  try {
    return migrateRecord<ChatRecord>(raw, chatMigrations).record;
  } catch {
    return null;
  }
}

export async function getChatRecord(sessionId: string): Promise<ChatRecord | null> {
  const raw = await idbGet<unknown>(sessionId, store);
  return migrateChat(raw);
}

export async function saveChatRecord(rec: Omit<ChatRecord, 'version'>): Promise<void> {
  const stamped: ChatRecord = { ...rec, version: SCHEMA_VERSIONS.chat };
  await idbSet(rec.sessionId, stamped, store);
}

export async function deleteChatRecord(sessionId: string): Promise<void> {
  await idbDel(sessionId, store);
}
