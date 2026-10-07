'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  BlackboardAction,
  BlackboardSettings,
  BlackboardState,
  StorageProvider,
} from '../types/blackboard';
import { createStorageProvider } from './storage';

const DEFAULT_SETTINGS: BlackboardSettings = {
  llmProvider: 'none',
  llmModel: '',
  graphProvider: 'webr',
  apiKeys: {},
  theme: 'auto',
  panelWidth: 480,
  panelShortcut: 'mod+shift+b',
};

const initialState = (
  settings: BlackboardSettings = DEFAULT_SETTINGS,
): BlackboardState => ({
  isOpen: false,
  isFullscreen: false,
  activeSceneId: null,
  scenes: {},
  presentationMode: false,
  spotlight: null,
  spotlightArmed: false,
  llmStatus: 'idle',
  llmMessages: [],
  settings,
  moduleContext: null,
  activeRCellId: null,
  visitedSections: [],
});

function reducer(state: BlackboardState, action: BlackboardAction): BlackboardState {
  switch (action.type) {
    case 'TOGGLE_PANEL':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_PANEL':
      return { ...state, isOpen: action.isOpen };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen };
    case 'SELECT_SCENE':
      return { ...state, activeSceneId: action.id };
    case 'UPSERT_SCENE': {
      const scene = action.scene;
      return {
        ...state,
        scenes: { ...state.scenes, [scene.id]: scene },
        // activate:false lets callers hydrate background scenes (e.g. the
        // module page list) without stealing the user's current page.
        activeSceneId: action.activate === false ? state.activeSceneId : scene.id,
      };
    }
    case 'DELETE_SCENE': {
      const scenes = { ...state.scenes };
      delete scenes[action.id];
      return {
        ...state,
        scenes,
        activeSceneId: state.activeSceneId === action.id ? null : state.activeSceneId,
      };
    }
    case 'SET_LLM_STATUS':
      return { ...state, llmStatus: action.status };
    case 'APPEND_LLM_MESSAGE': {
      const messages = [...state.llmMessages, action.message];
      return { ...state, llmMessages: messages };
    }
    case 'STREAM_LLM_CHUNK': {
      const messages = state.llmMessages.map((m) =>
        m.id === action.id ? { ...m, content: m.content + action.chunk } : m,
      );
      return { ...state, llmMessages: messages };
    }
    case 'CLEAR_LLM_MESSAGES':
      return { ...state, llmMessages: [] };
    case 'SET_LLM_MESSAGES':
      return { ...state, llmMessages: action.messages };
    case 'SET_MODULE_CONTEXT':
      return { ...state, moduleContext: action.context };
    case 'SET_ACTIVE_RCELL':
      return { ...state, activeRCellId: action.id };
    case 'SET_VISITED_SECTIONS':
      return { ...state, visitedSections: action.sections };
    case 'UPDATE_LLM_MESSAGE':
      return {
        ...state,
        llmMessages: state.llmMessages.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m,
        ),
      };
    case 'SET_PRESENTATION':
      return { ...state, presentationMode: action.on };
    case 'SET_SCENE_STEP': {
      const scene = state.scenes[action.sceneId];
      if (!scene) return state;
      return {
        ...state,
        scenes: {
          ...state.scenes,
          [action.sceneId]: { ...scene, currentStep: action.step },
        },
      };
    }
    case 'SET_SPOTLIGHT':
      return { ...state, spotlight: action.rect };
    case 'SET_SPOTLIGHT_ARMED':
      return { ...state, spotlightArmed: action.armed };
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.patch };
      return { ...state, settings };
    }
    default:
      return state;
  }
}

interface BlackboardContextValue {
  state: BlackboardState;
  dispatch: React.Dispatch<BlackboardAction>;
  storage: StorageProvider;
}

const BlackboardContext = createContext<BlackboardContextValue | null>(null);

interface BlackboardProviderProps {
  children: ReactNode;
  storage?: StorageProvider;
  initialSettings?: Partial<BlackboardSettings>;
}

export function BlackboardProvider({
  children,
  storage: externalStorage,
  initialSettings,
}: Readonly<BlackboardProviderProps>) {
  const [state, dispatch] = useReducer(
    reducer,
    { ...DEFAULT_SETTINGS, ...initialSettings },
    initialState,
  );

  const storage = useMemo(
    () => externalStorage ?? createStorageProvider(),
    [externalStorage],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [settings, panelState] = await Promise.all([
          storage.getSettings(),
          storage.getPanelState(),
        ]);
        if (cancelled) return;
        dispatch({ type: 'UPDATE_SETTINGS', patch: settings });
        if (panelState.isOpen) dispatch({ type: 'SET_PANEL', isOpen: true });
        if (panelState.isFullscreen) dispatch({ type: 'TOGGLE_FULLSCREEN' });
      } catch {
        // ignore — start with defaults
      }
    })();
    return () => { cancelled = true; };
  }, [storage]);

  useEffect(() => {
    storage.saveSettings(state.settings).catch(() => {});
  }, [state.settings, storage]);

  useEffect(() => {
    storage
      .savePanelState({ isOpen: state.isOpen, isFullscreen: state.isFullscreen })
      .catch(() => {});
  }, [state.isOpen, state.isFullscreen, storage]);

  const value = useMemo(
    () => ({ state, dispatch, storage }),
    [state, dispatch, storage],
  );

  return (
    <BlackboardContext.Provider value={value}>
      {children}
    </BlackboardContext.Provider>
  );
}

export function useBlackboardContext() {
  const ctx = useContext(BlackboardContext);
  if (!ctx) {
    throw new Error('useBlackboardContext must be used within a BlackboardProvider');
  }
  return ctx;
}

export type { BlackboardContextValue, BlackboardProviderProps };
