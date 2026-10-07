import { get, set, createStore, keys, del } from 'idb-keyval';
import { readScene, writeScene } from '../persistence/scene';
import type {
  BlackboardScene,
  BlackboardSettings,
  StorageProvider,
} from '../../types/blackboard';

const SCENE_STORE = createStore('bb-scenes', 'scenes');
const META_STORE = createStore('bb-meta', 'meta');

const SETTINGS_KEY = 'settings';
const PANEL_STATE_KEY = 'panel-state';

const DEFAULT_SETTINGS: BlackboardSettings = {
  llmProvider: 'none',
  llmModel: '',
  graphProvider: 'webr',
  apiKeys: {},
  theme: 'auto',
  panelWidth: 480,
  panelShortcut: 'mod+shift+b',
};

export class IndexedDBStorageProvider implements StorageProvider {
  async listScenes(moduleSlug: string): Promise<BlackboardScene[]> {
    const allKeys = await keys(SCENE_STORE);
    const scenes: BlackboardScene[] = [];
    for (const key of allKeys) {
      const raw = await get(key as string, SCENE_STORE);
      const scene = await this.upgradeOnRead(key as string, raw);
      if (scene && scene.moduleSlug === moduleSlug) {
        scenes.push(scene);
      }
    }
    scenes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return scenes;
  }

  async getScene(id: string): Promise<BlackboardScene | null> {
    const raw = await get(id, SCENE_STORE);
    return this.upgradeOnRead(id, raw);
  }

  /** Lazy upgrade: migrate + validate on read, write back if the record changed. */
  private async upgradeOnRead(id: string, raw: unknown): Promise<BlackboardScene | null> {
    if (raw == null) return null;
    const { scene, migrated } = readScene(raw);
    if (migrated) {
      await set(id, scene, SCENE_STORE);
    }
    return scene;
  }

  async saveScene(scene: BlackboardScene): Promise<void> {
    await set(scene.id, writeScene(scene), SCENE_STORE);
  }

  async deleteScene(id: string): Promise<void> {
    await del(id, SCENE_STORE);
  }

  async getSettings(): Promise<BlackboardSettings> {
    const saved = await get<BlackboardSettings>(SETTINGS_KEY, META_STORE);
    return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  }

  async saveSettings(settings: BlackboardSettings): Promise<void> {
    await set(SETTINGS_KEY, settings, META_STORE);
  }

  async getPanelState(): Promise<{ isOpen: boolean; isFullscreen: boolean }> {
    const saved = await get<{ isOpen: boolean; isFullscreen: boolean }>(
      PANEL_STATE_KEY,
      META_STORE,
    );
    return { isOpen: false, isFullscreen: false, ...(saved ?? {}) };
  }

  async savePanelState(state: { isOpen: boolean; isFullscreen: boolean }): Promise<void> {
    await set(PANEL_STATE_KEY, state, META_STORE);
  }
}
