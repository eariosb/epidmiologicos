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

export class MemoryStorageProvider implements StorageProvider {
  private scenes = new Map<string, BlackboardScene>();
  private settings: BlackboardSettings = DEFAULT_SETTINGS;
  private panelState = { isOpen: false, isFullscreen: false };

  async listScenes(moduleSlug: string): Promise<BlackboardScene[]> {
    return Array.from(this.scenes.values())
      .filter((s) => s.moduleSlug === moduleSlug)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getScene(id: string): Promise<BlackboardScene | null> {
    return this.scenes.get(id) ?? null;
  }

  async saveScene(scene: BlackboardScene): Promise<void> {
    this.scenes.set(scene.id, scene);
  }

  async deleteScene(id: string): Promise<void> {
    this.scenes.delete(id);
  }

  async getSettings(): Promise<BlackboardSettings> {
    return { ...DEFAULT_SETTINGS, ...this.settings };
  }

  async saveSettings(settings: BlackboardSettings): Promise<void> {
    this.settings = settings;
  }

  async getPanelState(): Promise<{ isOpen: boolean; isFullscreen: boolean }> {
    return { ...this.panelState };
  }

  async savePanelState(state: { isOpen: boolean; isFullscreen: boolean }): Promise<void> {
    this.panelState = state;
  }
}
