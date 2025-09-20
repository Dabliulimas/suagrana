/**
 * Data Layer Entry Point
 * Exports all data layer components
 */

// Main classes
export {
  DataLayer,
  getDataLayer,
  resetDataLayer,
  defaultDataLayerConfig,
} from "./data-layer";
export { APIClient } from "./api-client";
export { CacheManager } from "./cache-manager";
export { SyncManager } from "./sync-manager";

// Types
export type {
  BaseEntity,
  ResourceType,
  CRUDOperation,
  PendingOperation,
  APIResponse,
  CacheEntry,
  SyncStatus,
  DataLayerConfig,
  DataLayerError,
  QueryParams,
  Transaction,
  Account,
  Goal,
  Contact,
  Trip,
  Investment,
  SharedDebt,
  ResourceMap,
  Resource,
} from "./types";

// Cache stats
export type { CacheStats } from "./cache-manager";
