/**
 * Sync Manager
 * Handle online/offline synchronization
 */

import {
  PendingOperation,
  SyncStatus,
  ResourceType,
  CRUDOperation,
} from "./types";
import { APIClient } from "./api-client";
import { logSyncManager } from "../utils/logger";

export class SyncManager {
  private pendingOperations: PendingOperation[] = [];
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: 0,
    syncInProgress: false,
    errors: [],
  };
  private apiClient: APIClient;
  private syncCallbacks: (() => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
    this.setupOnlineDetection();
    this.restorePendingOperations();
    this.startPeriodicSync();
  }

  private setupOnlineDetection() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.syncStatus.isOnline = true;
        this.processQueue();
      });

      window.addEventListener("offline", () => {
        this.syncStatus.isOnline = false;
      });
    }
  }

  private restorePendingOperations() {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("pending-operations");
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
        this.updateSyncStatus();
      }
    } catch (error) {
      logSyncManager.error("Falha ao restaurar operações pendentes", error);
      localStorage.removeItem("pending-operations");
    }
  }

  private persistPendingOperations() {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "pending-operations",
        JSON.stringify(this.pendingOperations),
      );
    } catch (error) {
      logSyncManager.error("Falha ao persistir operações pendentes", error);
    }
  }

  private startPeriodicSync() {
    // Try to sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && this.pendingOperations.length > 0) {
        this.processQueue();
      }
    }, 30000);
  }

  private updateSyncStatus() {
    this.syncStatus.pendingOperations = this.pendingOperations.length;
  }

  private generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue management
  queueOperation(
    resource: ResourceType,
    operation: CRUDOperation,
    data: any,
    maxRetries: number = 3,
  ): string {
    const operationId = this.generateOperationId();

    const pendingOp: PendingOperation = {
      id: operationId,
      resource,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries,
    };

    this.pendingOperations.push(pendingOp);
    this.updateSyncStatus();
    this.persistPendingOperations();

    // Try to process immediately if online
    if (this.syncStatus.isOnline) {
      this.processQueue();
    }

    return operationId;
  }

  async processQueue(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.syncStatus.errors = [];

    const operationsToProcess = [...this.pendingOperations];
    const successfulOperations: string[] = [];

    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        operation.retryCount++;

        if (operation.retryCount >= operation.maxRetries) {
          // Max retries reached, remove from queue and log error
          this.syncStatus.errors.push(
            `Failed to sync ${operation.operation} on ${operation.resource}: ${error.message}`,
          );
          successfulOperations.push(operation.id); // Remove from queue
        }

        // Log only on final failure or significant errors
        const errorMessage = error?.message || error?.code || 'Erro de sincronização';
        
        if (operation.retryCount >= operation.maxRetries) {
          logSyncManager.warn(`Operação ${operation.operation} em ${operation.resource} falhou após ${operation.maxRetries} tentativas`, { error: errorMessage, operationId: operation.id });
        } else if (operation.retryCount === 1) {
          // Log only on first retry to avoid spam
          logSyncManager.info(`Tentando novamente ${operation.operation} em ${operation.resource}`, { 
            retry: `${operation.retryCount + 1}/${operation.maxRetries}`,
            operationId: operation.id 
          });
        }
      }
    }

    // Remove successful operations from queue
    this.pendingOperations = this.pendingOperations.filter(
      (op) => !successfulOperations.includes(op.id),
    );

    this.syncStatus.syncInProgress = false;
    this.syncStatus.lastSync = new Date().toISOString();
    this.updateSyncStatus();
    this.persistPendingOperations();

    // Notify callbacks
    this.syncCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logSyncManager.error("Callback de sincronização falhou", error);
      }
    });
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    const { resource, operation: op, data } = operation;

    switch (op) {
      case "create":
        await this.apiClient.post(`/${resource}`, data);
        break;
      case "update":
        await this.apiClient.put(`/${resource}/${data.id}`, data);
        break;
      case "delete":
        await this.apiClient.delete(`/${resource}/${data.id}`);
        break;
      case "read":
        // Read operations don't need to be synced
        break;
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  clearQueue(): void {
    this.pendingOperations = [];
    this.updateSyncStatus();
    this.persistPendingOperations();
  }

  // Conflict resolution
  resolveConflict(local: any, remote: any): any {
    // Simple last-write-wins strategy
    // In a real application, you might want more sophisticated conflict resolution
    const localTimestamp = new Date(local.updatedAt).getTime();
    const remoteTimestamp = new Date(remote.updatedAt).getTime();

    if (localTimestamp > remoteTimestamp) {
      return local;
    } else {
      return remote;
    }
  }

  // Status and callbacks
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  onSyncComplete(callback: () => void): void {
    this.syncCallbacks.push(callback);
  }

  // Manual sync trigger
  async forceSyncAll(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    await this.processQueue();
  }

  // Get pending operations for debugging
  getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  // Remove specific operation
  removeOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(
      (op) => op.id !== operationId,
    );
    this.updateSyncStatus();
    this.persistPendingOperations();
  }

  // Retry specific operation
  async retryOperation(operationId: string): Promise<void> {
    const operation = this.pendingOperations.find(
      (op) => op.id === operationId,
    );
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (!this.syncStatus.isOnline) {
      throw new Error("Cannot retry operation while offline");
    }

    try {
      await this.executeOperation(operation);
      this.removeOperation(operationId);
    } catch (error) {
      operation.retryCount++;
      if (operation.retryCount >= operation.maxRetries) {
        this.removeOperation(operationId);
        throw new Error(
          `Operation failed after ${operation.maxRetries} retries`,
        );
      }
      throw error;
    }
  }

  // Check if online
  isOnline(): boolean {
    return this.syncStatus.isOnline;
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.processQueue);
      window.removeEventListener("offline", () => {
        this.syncStatus.isOnline = false;
      });
    }
  }
}
