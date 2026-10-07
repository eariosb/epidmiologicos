/**
 * Schema versioning for every record persisted in IndexedDB.
 * Records written before versioning existed are treated as V1.
 */
export const SCHEMA_VERSIONS = {
  scene: 3,
  session: 2,
  capture: 2,
  settings: 1,
  chat: 1,
  events: 1,
} as const;

export type StoreName = keyof typeof SCHEMA_VERSIONS;

/** Records without a `version` field are considered this version. */
export const UNVERSIONED = 1;
