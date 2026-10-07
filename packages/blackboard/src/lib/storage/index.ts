import { IndexedDBStorageProvider } from './indexeddb';
import { LocalStorageProvider } from './localstorage';
import { MemoryStorageProvider } from './memory';
import type { StorageProvider } from '../../types/blackboard';

export type { StorageProvider };
export { IndexedDBStorageProvider, LocalStorageProvider, MemoryStorageProvider };

export function createStorageProvider(): StorageProvider {
  if (typeof window === 'undefined') {
    return new MemoryStorageProvider();
  }
  try {
    return new IndexedDBStorageProvider();
  } catch {
    return new LocalStorageProvider();
  }
}
