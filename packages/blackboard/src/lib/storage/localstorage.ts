import { readScene, writeScene } from '../persistence/scene';
import type {
  BlackboardScene,
  BlackboardSettings,
  StorageProvider,
} from '../../types/blackboard';

const DEFAULT_SETTINGS: BlackboardSettings = {
  llmProvider: 'none',
  llmModel: '',
  graphProvider: 'webr',
  apiKeys: {},
  theme: 'auto',
  panelWidth: 480,
  panelShortcut: 'mod+shift+b',
};

function sceneKey(id: string): string {
  return `bb-scene-${id}`;
}

function listKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('bb-scene-')) keys.push(k);
  }
  return keys;
}

export class LocalStorageProvider implements StorageProvider {
  async listScenes(moduleSlug: string): Promise<BlackboardScene[]> {
    const scenes: BlackboardScene[] = [];
    for (const key of listKeys()) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const { scene, migrated } = readScene(JSON.parse(raw));
        if (migrated) localStorage.setItem(key, JSON.stringify(scene));
        if (scene.moduleSlug === moduleSlug) scenes.push(scene);
      } catch {
        // ignore malformed entries
      }
    }
    scenes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return scenes;
  }

  async getScene(id: string): Promise<BlackboardScene | null> {
    try {
      const raw = localStorage.getItem(sceneKey(id));
      if (!raw) return null;
      const { scene, migrated } = readScene(JSON.parse(raw));
      if (migrated) localStorage.setItem(sceneKey(id), JSON.stringify(scene));
      return scene;
    } catch {
      return null;
    }
  }

  async saveScene(scene: BlackboardScene): Promise<void> {
    localStorage.setItem(sceneKey(scene.id), JSON.stringify(writeScene(scene)));
  }

  async deleteScene(id: string): Promise<void> {
    localStorage.removeItem(sceneKey(id));
  }

  async getSettings(): Promise<BlackboardSettings> {
    try {
      const raw = localStorage.getItem('bb-settings');
      return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: BlackboardSettings): Promise<void> {
    localStorage.setItem('bb-settings', JSON.stringify(settings));
  }

  async getPanelState(): Promise<{ isOpen: boolean; isFullscreen: boolean }> {
    try {
      const raw = localStorage.getItem('bb-panel-state');
      return { isOpen: false, isFullscreen: false, ...(raw ? JSON.parse(raw) : {}) };
    } catch {
      return { isOpen: false, isFullscreen: false };
    }
  }

  async savePanelState(state: { isOpen: boolean; isFullscreen: boolean }): Promise<void> {
    localStorage.setItem('bb-panel-state', JSON.stringify(state));
  }
}
