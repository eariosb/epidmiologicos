// Components
export { BlackboardPanel } from './components/BlackboardPanel';
export { BlackboardTrigger } from './components/BlackboardTrigger';
export { BlackboardSkeleton } from './components/BlackboardSkeleton';
export { BlackboardCanvas } from './components/BlackboardCanvas';
export type { BlackboardCanvasRef } from './components/BlackboardCanvas';
export { BlackboardToolbar } from './components/BlackboardToolbar';
export { BlackboardAssistant } from './components/BlackboardAssistant';
export { BlackboardExport } from './components/BlackboardExport';
export { BlackboardSettingsPanel } from './components/BlackboardSettingsPanel';
export { BlackboardContextBridge } from './components/BlackboardContextBridge';
export type { AssistantProfile } from './lib/prompts/system';
export { setAssistantProfile } from './lib/prompts/system';
export { BlackboardAnchor } from './components/BlackboardAnchor';
export { BlackboardEmbed } from './components/BlackboardEmbed';
export { Blackboard } from './components/Blackboard';

// Persistence (shared schema versioning — used by course-level stores)
export { SCHEMA_VERSIONS } from './lib/persistence/version';
export type { StoreName } from './lib/persistence/version';
export { migrateRecord, MigrationError } from './lib/persistence/migrate';
export type { MigrationChain, MigrationResult } from './lib/persistence/migrate';
export { readScene, writeScene, sceneMigrations } from './lib/persistence/scene';
export { logEvent, listEvents, clearEvents, onEventsChanged } from './lib/events';
export type { BoardEvent, BoardEventKind } from './lib/events';

// Provider and hooks
export { BlackboardProvider, useBlackboardContext } from './lib/context';
export { MemoryStorageProvider } from './lib/storage/memory';
export { useBlackboard } from './hooks/useBlackboard';
export { useBlackboardScene } from './hooks/useBlackboardScene';
export { usePresentation } from './hooks/usePresentation';
export { useBlackboardLLM } from './hooks/useBlackboardLLM';
export { useBlackboardExport } from './hooks/useBlackboardExport';

// Types
export type {
  BlackboardScene,
  MatrixState,
  BoardKind,
  BoardElementMeta,
  BoardInsertOpts,
  BlackboardSettings,
  ModuleContext,
  LLMMessage,
  LLMProvider,
  LLMProviderType,
  StorageProvider,
  GraphProvider,
  AssistantMode,
  SpotlightRect,
  BlackboardState,
  BlackboardAction,
} from './types/blackboard';
