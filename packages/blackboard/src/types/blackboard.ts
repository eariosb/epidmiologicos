export type MatrixState = {
  elementId: string;
  rows: number;
  cols: number;
  values: number[][];
  label?: string;
};

/**
 * Structured kinds for technical elements inserted into the board as raster.
 * The PNG is the visual representation; `customData` is the source of truth
 * for re-editing (double-click → editor → regenerate the PNG).
 */
export type BoardKind = 'math' | 'matrix' | 'code' | 'output' | 'capture' | 'plot';

/** Contract stamped on `element.customData` for every technical insert. */
export type BoardElementMeta = {
  boardKind: BoardKind;
  /** FK → logical board element / resource id (captureId, rcellId, …). */
  boardId: string;
  payload?: Record<string, unknown>;
  /** Device-pixel ratio the PNG was rendered at. */
  rasterDpr: number;
};

export type BoardInsertOpts = {
  width?: number;
  height?: number;
  matrixState?: MatrixState;
  /** `boardId` and `rasterDpr` are filled automatically when omitted. */
  meta?: Omit<BoardElementMeta, 'boardId' | 'rasterDpr'> & {
    boardId?: string;
    rasterDpr?: number;
  };
};

export type BlackboardScene = {
  /** Schema version; see lib/persistence/version.ts. Older records are migrated lazily on read. */
  version: number;
  id: string;
  moduleSlug: string;
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  /**
   * Binary image files (dataURLs) referenced by `element.fileId`.
   * Without them, inserted formulas/matrices/captures render blank after reload.
   */
  files?: Record<string, unknown>;
  notes: string;
  matrixStates: Record<string, MatrixState>;
  /** Progressive-reveal frontier: elements with customData.boardStep > currentStep are hidden. */
  currentStep: number;
  updatedAt: string;
};

export type ModuleContext = {
  slug: string;
  title: string;
  objective: string[];
  datasets: string[];
  order: number;
};

export type LLMProviderType = 'anthropic' | 'openai' | 'deepseek' | 'ollama' | 'none';
export type GraphProviderType = 'webr' | 'none';

export type BlackboardSettings = {
  llmProvider: LLMProviderType;
  llmModel: string;
  graphProvider: GraphProviderType;
  apiKeys: Record<string, string>;
  theme: 'light' | 'dark' | 'auto';
  panelWidth: number;
  panelShortcut: string;
  /** Pointer mode (touch board / IR pen): enlarges interactive targets. */
  pointerMode?: boolean;
};

export type LLMMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[];
  /** Verified corpus citation ids used in this message (assistant only). */
  citations?: string[];
  /** Corpus doc ids injected for this turn (audit trail). */
  ragFragments?: string[];
  /** OpenAI-style tool_call id when role === 'tool'. */
  toolCallId?: string;
  createdAt: string;
};

export type LLMChatOptions = {
  model: string;
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
};

export interface LLMProvider {
  id: LLMProviderType;
  chat(messages: LLMMessage[], options: LLMChatOptions): AsyncIterable<string>;
  /**
   * Non-streaming completion with optional tool calling.
   * Providers that don't implement it fall back to collecting `chat`.
   */
  chatOnce?(
    messages: LLMMessage[],
    options: LLMChatOptions & { tools?: unknown[] },
  ): Promise<{ content: string; toolCalls: { id: string; name: string; arguments: string }[] }>;
  listModels(): Promise<string[]>;
  supportsVision(): boolean;
  dispose(): void;
}

export interface StorageProvider {
  listScenes(moduleSlug: string): Promise<BlackboardScene[]>;
  getScene(id: string): Promise<BlackboardScene | null>;
  saveScene(scene: BlackboardScene): Promise<void>;
  deleteScene(id: string): Promise<void>;
  getSettings(): Promise<BlackboardSettings>;
  saveSettings(settings: BlackboardSettings): Promise<void>;
  getPanelState(): Promise<{ isOpen: boolean; isFullscreen: boolean }>;
  savePanelState(state: { isOpen: boolean; isFullscreen: boolean }): Promise<void>;
}

export interface GraphProvider {
  id: GraphProviderType;
  render(expression: string, containerId: string): Promise<void>;
  dispose(): void;
}

export type AssistantMode = 'ask' | 'explain-selection' | 'generate-r' | 'plot-r';

export type SpotlightRect = { x: number; y: number; w: number; h: number };

export type BlackboardState = {
  isOpen: boolean;
  isFullscreen: boolean;
  activeSceneId: string | null;
  scenes: Record<string, BlackboardScene>;
  /** Presentation mode: UI chrome hidden, arrow keys reveal steps. */
  presentationMode: boolean;
  /** Spotlight overlay rect in canvas coordinates; null = off. */
  spotlight: SpotlightRect | null;
  /** Teacher armed the spotlight drag (crosshair overlay awaiting a rect). */
  spotlightArmed: boolean;
  llmStatus: 'idle' | 'streaming' | 'error';
  llmMessages: LLMMessage[];
  settings: BlackboardSettings;
  moduleContext: ModuleContext | null;
  activeRCellId: string | null;
  /** Section slugs visited in the active session (fed by the course app). */
  visitedSections: string[];
};

export type BlackboardAction =
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SET_PANEL'; isOpen: boolean }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SELECT_SCENE'; id: string }
  | { type: 'UPSERT_SCENE'; scene: BlackboardScene; activate?: boolean }
  | { type: 'DELETE_SCENE'; id: string }
  | { type: 'SET_LLM_STATUS'; status: BlackboardState['llmStatus'] }
  | { type: 'APPEND_LLM_MESSAGE'; message: LLMMessage }
  | { type: 'STREAM_LLM_CHUNK'; id: string; chunk: string }
  | { type: 'CLEAR_LLM_MESSAGES' }
  | { type: 'SET_LLM_MESSAGES'; messages: LLMMessage[] }
  | { type: 'SET_MODULE_CONTEXT'; context: ModuleContext }
  | { type: 'SET_ACTIVE_RCELL'; id: string | null }
  | { type: 'SET_VISITED_SECTIONS'; sections: string[] }
  | { type: 'UPDATE_LLM_MESSAGE'; id: string; patch: Partial<LLMMessage> }
  | { type: 'SET_PRESENTATION'; on: boolean }
  | { type: 'SET_SCENE_STEP'; sceneId: string; step: number }
  | { type: 'SET_SPOTLIGHT'; rect: SpotlightRect | null }
  | { type: 'SET_SPOTLIGHT_ARMED'; armed: boolean }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<BlackboardSettings> };
