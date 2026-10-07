import { MemoryStorageProvider } from './memory';
import { SCHEMA_VERSIONS } from '../persistence/version';
import type { BlackboardScene } from '../../types/blackboard';

describe('MemoryStorageProvider', () => {
  const provider = new MemoryStorageProvider();
  const scene: BlackboardScene = {
    version: SCHEMA_VERSIONS.scene,
    id: 's1',
    moduleSlug: 'mod1',
    elements: [],
    appState: {},
    notes: '',
    matrixStates: {},
    currentStep: 0,
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('saves and retrieves a scene', async () => {
    await provider.saveScene(scene);
    expect(await provider.getScene('s1')).toEqual(scene);
  });

  it('lists scenes by module', async () => {
    await provider.saveScene(scene);
    const list = await provider.listScenes('mod1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('s1');
  });

  it('deletes a scene', async () => {
    await provider.saveScene(scene);
    await provider.deleteScene('s1');
    expect(await provider.getScene('s1')).toBeNull();
  });

  it('stores and returns settings', async () => {
    await provider.saveSettings({
      llmProvider: 'openai',
      llmModel: 'gpt-4o',
      graphProvider: 'webr',
      apiKeys: {},
      theme: 'auto',
      panelWidth: 480,
      panelShortcut: 'mod+shift+b',
    });
    const settings = await provider.getSettings();
    expect(settings.llmProvider).toBe('openai');
    expect(settings.llmModel).toBe('gpt-4o');
  });

  it('stores panel state', async () => {
    await provider.savePanelState({ isOpen: true, isFullscreen: false });
    const state = await provider.getPanelState();
    expect(state.isOpen).toBe(true);
    expect(state.isFullscreen).toBe(false);
  });
});
