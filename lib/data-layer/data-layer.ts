/**
 * Unified Data Layer
 * Single source of truth for all data operations
 */

import { APIClient } from "./api-client";
import { CacheManager } from "./cache-manager";
import { SyncManager } from "./sync-manager";
import {
  ResourceType,
  ResourceMap,
  Resource,
  QueryParams,
  DataLayerConfig,
  DataLayerError,
  SyncStatus,
  PendingOperation,
} from "./types";
import { logDataLayer } from "../utils/logger";

export class DataLayer {
  private apiClient: APIClient;
  private fallbackClient: APIClient;
  private cacheManager: CacheManager;
  private syncManager: SyncManager;
  private config: DataLayerConfig;

  constructor(config: DataLayerConfig) {
    this.config = config;
    this.apiClient = new APIClient(config.apiBaseUrl);
    
    // Cliente para API routes do Next.js como fallback
    this.fallbackClient = new APIClient("/api");
    
    this.cacheManager = new CacheManager();
    this.syncManager = new SyncManager(this.apiClient);

    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.apiClient.onError((error: any) => {
      // Só logar erros significativos e não de rede
      if (error && error.message && error.message !== "Unknown error" && error?.type !== "network_error") {
        logDataLayer.warn("API Client Error", { message: error.message, type: error.type });
      }
    });
  }

  private getCacheKey(
    resource: ResourceType,
    id?: string,
    params?: QueryParams,
  ): string {
    let key = resource;
    if (id) {
      key += `:${id}`;
    }
    if (params) {
      const paramString = new URLSearchParams(params as any).toString();
      if (paramString) {
        key += `:${paramString}`;
      }
    }
    return key;
  }

  // Generic CRUD Operations
  async create<T extends ResourceType>(
    resource: T,
    data: Omit<Resource<T>, "id" | "createdAt" | "updatedAt">,
  ): Promise<Resource<T>> {
    try {
      // Try to create via API if online
      if (this.syncManager.isOnline()) {
        // Tentar criar no servidor principal primeiro
        try {
          const response = await this.apiClient.post<Resource<T>>(
            `/${resource}`,
            data,
          );

          if (response.success) {
            // Cache the created resource
            this.cacheManager.set(
              this.getCacheKey(resource, response.data.id),
              response.data,
            );

            // Invalidate list cache
            this.cacheManager.invalidatePattern(`^${resource}:(?!.*:)`);

            return response.data;
          } else {
            throw new Error(response.message || "Failed to create resource");
          }
        } catch (backendError) {
          logDataLayer.debug(`Backend indisponível para ${resource}, tentando API local`);
          
          // Fallback para API routes do Next.js
          try {
            const fallbackResponse = await this.fallbackClient.post<any>(`/${resource}`, data);
            
            // API routes do Next.js retornam formato diferente
            const createdResource = fallbackResponse[resource.slice(0, -1)] || fallbackResponse.data;
            
            if (createdResource) {
              // Cache the created resource
              this.cacheManager.set(
                this.getCacheKey(resource, createdResource.id),
                createdResource,
              );

              // Invalidate list cache
              this.cacheManager.invalidatePattern(`^${resource}:(?!.*:)`);
              
              return createdResource as Resource<T>;
            } else {
              throw new Error("Resposta inválida da API local");
            }
          } catch (fallbackError) {
            logDataLayer.warn(`API local também falhou para ${resource}, usando localStorage`);
            
            // Último fallback: localStorage direto usando LocalDataService
            try {
              const tempId = `local-${Date.now()}`;
              const localResource = {
                ...data,
                id: tempId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as Resource<T>;
              
              // Usar LocalDataService em vez de storage para evitar import circular
              const { localDataService } = await import('../services/local-data-service');
              
              switch(resource) {
                case 'accounts':
                  const accounts = localDataService.getAccounts();
                  accounts.push(localResource as any);
                  localDataService.saveAccounts(accounts);
                  return localResource;
                case 'transactions':
                  const transactions = localDataService.getTransactions();
                  transactions.unshift(localResource as any);
                  localDataService.saveTransactions(transactions);
                  return localResource;
                case 'goals':
                  const goals = localDataService.getGoals();
                  goals.push(localResource as any);
                  localDataService.saveGoals(goals);
                  return localResource;
                case 'contacts':
                  const contacts = localDataService.getContacts();
                  contacts.push(localResource as any);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('sua-grana-contacts', JSON.stringify(contacts));
                  }
                  return localResource;
                default:
                  // Cache the created resource
                  this.cacheManager.set(
                    this.getCacheKey(resource, tempId),
                    localResource,
                  );
                  return localResource;
              }
            } catch (localStorageError) {
              logDataLayer.error(`Todos os fallbacks falharam para ${resource}`);
              throw backendError; // Lançar erro original do backend
            }
          }
        }
      } else {
        // Queue for offline sync
        const tempId = `temp-${Date.now()}`;
        const tempResource = {
          ...data,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Resource<T>;

        // Store in cache for immediate use
        this.cacheManager.set(this.getCacheKey(resource, tempId), tempResource);

        // Queue for sync when online
        this.syncManager.queueOperation(resource, "create", data);

        return tempResource;
      }
    } catch (error) {
      // Verificar se é erro de rede/conectividade
      const isNetworkError = error?.type === 'network_error' || 
                             error?.message?.includes('Network connection failed') ||
                             error?.message?.includes('fetch') ||
                             error?.message?.includes('Failed to fetch') ||
                             error?.code === 'NETWORK_ERROR';
      
      // Se for erro de rede, tentar fallback offline imediato
      if (isNetworkError) {
        try {
          logDataLayer.info(`Erro de rede detectado para ${resource}, usando modo offline`);
          
          const tempId = `offline-${Date.now()}`;
          const offlineResource = {
            ...data,
            id: tempId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _offline: true, // Marcar como criado offline
          } as Resource<T>;
          
          // Salvar diretamente no localStorage usando LocalDataService
          const { localDataService } = await import('../services/local-data-service');
          
          switch(resource) {
            case 'accounts':
              const accounts = localDataService.getAccounts();
              accounts.push(offlineResource as any);
              localDataService.saveAccounts(accounts);
              // Queue for sync when online
              this.syncManager.queueOperation(resource, "create", data);
              return offlineResource;
            case 'transactions':
              const transactions = localDataService.getTransactions();
              transactions.unshift(offlineResource as any);
              localDataService.saveTransactions(transactions);
              this.syncManager.queueOperation(resource, "create", data);
              return offlineResource;
            case 'goals':
              const goals = localDataService.getGoals();
              goals.push(offlineResource as any);
              localDataService.saveGoals(goals);
              this.syncManager.queueOperation(resource, "create", data);
              return offlineResource;
            case 'contacts':
              const contacts = localDataService.getContacts();
              contacts.push(offlineResource as any);
              if (typeof window !== 'undefined') {
                localStorage.setItem('sua-grana-contacts', JSON.stringify(contacts));
              }
              this.syncManager.queueOperation(resource, "create", data);
              return offlineResource;
            case 'trips':
              // Para viagens, usar DataService diretamente
              const { dataService } = await import('../services/data-service');
              const savedTrip = await dataService.saveTrip(offlineResource);
              this.syncManager.queueOperation(resource, "create", data);
              return savedTrip as Resource<T>;
            default:
              // Cache the created resource
              this.cacheManager.set(
                this.getCacheKey(resource, tempId),
                offlineResource,
              );
              this.syncManager.queueOperation(resource, "create", data);
              return offlineResource;
          }
        } catch (offlineError) {
          logDataLayer.error(`Fallback offline também falhou para ${resource}`, offlineError);
          // Ainda assim tenta fazer queue para retry posterior
          this.syncManager.queueOperation(resource, "create", data);
          // Retornar um objeto temporário para não quebrar a aplicação
          return {
            ...data,
            id: `fallback-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _offline: true,
          } as Resource<T>;
        }
      } else {
        // Para outros erros, ainda tentar queue para retry
        if (this.syncManager.isOnline()) {
          this.syncManager.queueOperation(resource, "create", data);
        }
        
        logDataLayer.error(`Erro ao criar ${resource}`, {
          message: error?.message || 'Erro desconhecido',
          isOnline: this.syncManager.isOnline(),
          isNetworkError
        });
      }
      
      // Sempre lançar um erro amigável
      const errorMessage = isNetworkError ? 
        'Conectividade indisponível. Dados salvos localmente.' : 
        (error?.message || error?.code || 'Erro desconhecido');
      const enhancedError = new Error(`${errorMessage}`);
      enhancedError.cause = error;
      throw enhancedError;
    }
  }

  async read<T extends ResourceType>(
    resource: T,
    id?: string,
    params?: QueryParams,
  ): Promise<Resource<T> | Resource<T>[]> {
    const cacheKey = this.getCacheKey(resource, id, params);

    // Try cache first
    if (this.config.cacheEnabled) {
      const cached = this.cacheManager.get<Resource<T> | Resource<T>[]>(
        cacheKey,
      );
      if (cached) {
        return cached;
      }
    }

    try {
      // Try API if online
      if (this.syncManager.isOnline()) {
        const endpoint = id ? `/${resource}/${id}` : `/${resource}`;
        const response = await this.apiClient.get<Resource<T> | Resource<T>[]>(
          endpoint,
          params,
        );

        if (response.success) {
          // Extract the correct data based on resource type
          let extractedData = response.data;
          
          // Handle nested data structures from backend
          if (resource === "transactions" && response.data?.transactions) {
            extractedData = response.data.transactions;
          } else if (resource === "accounts" && response.data?.accounts) {
            extractedData = response.data.accounts;
          } else if (resource === "goals" && response.data?.goals) {
            extractedData = response.data.goals;
          } else if (resource === "contacts" && response.data?.contacts) {
            extractedData = response.data.contacts;
          } else if (resource === "trips" && response.data?.trips) {
            extractedData = response.data.trips;
          } else if (resource === "investments" && response.data?.investments) {
            extractedData = response.data.investments;
          } else if (resource === "shared-debts" && response.data?.sharedDebts) {
            extractedData = response.data.sharedDebts;
          }

          // Cache the result
          if (this.config.cacheEnabled) {
            this.cacheManager.set(
              cacheKey,
              extractedData,
              this.config.defaultTTL,
            );
          }

          return extractedData;
        } else {
          throw new Error(response.message || "Failed to read resource");
        }
      } else {
        // Offline: try to get from cache with longer TTL
        const cached = this.cacheManager.get<Resource<T> | Resource<T>[]>(
          cacheKey,
        );
        if (cached) {
          return cached;
        }

        throw new Error("Resource not available offline");
      }
    } catch (error) {
      // Fallback to cache if API fails
      const cached = this.cacheManager.get<Resource<T> | Resource<T>[]>(
        cacheKey,
      );
      if (cached) {
        return cached;
      }

      // Final fallback: try localStorage directly
      try {
        if (typeof window !== 'undefined') {
          // Try both key formats for compatibility
          const standardKey = resource;
          const hookKey = `sua-grana-${resource}`;
          
          let localData = localStorage.getItem(standardKey) || localStorage.getItem(hookKey);
          
          if (localData) {
            const parsed = JSON.parse(localData);
            logDataLayer.info(`Loaded ${resource} from localStorage fallback`);
            
            // Cache the loaded data for future use
            if (this.config.cacheEnabled && Array.isArray(parsed)) {
              this.cacheManager.set(cacheKey, parsed, this.config.defaultTTL);
            }
            
            // Return specific item if id was requested
            if (id && Array.isArray(parsed)) {
              const item = parsed.find((item: any) => item.id === id);
              return item || null;
            }
            
            return parsed;
          }
        }
      } catch (localStorageError) {
        logDataLayer.debug(`localStorage fallback failed for ${resource}:`, localStorageError);
      }

      throw error;
    }
  }

  async update<T extends ResourceType>(
    resource: T,
    id: string,
    data: Partial<Resource<T>>,
  ): Promise<Resource<T>> {
    try {
      // Try to update via API if online
      if (this.syncManager.isOnline()) {
        // Try primary backend first
        try {
          const response = await this.apiClient.put<Resource<T>>(
            `/${resource}/${id}`,
            data,
          );

          if (response.success) {
            // Update cache
            this.cacheManager.set(this.getCacheKey(resource, id), response.data);

            // Invalidate list cache
            this.cacheManager.invalidatePattern(`^${resource}:(?!.*:)`);

            return response.data;
          } else {
            throw new Error(response.message || "Failed to update resource");
          }
        } catch (backendError) {
          logDataLayer.debug(`Backend indisponível para update de ${resource}, tentando API local`);
          
          // Fallback para API routes do Next.js
          try {
            const fallbackResponse = await this.fallbackClient.put<any>(`/${resource}/${id}`, data);
            
            // API routes do Next.js retornam formato diferente
            const updatedResource = fallbackResponse.transaction || fallbackResponse.data || fallbackResponse;
            
            if (updatedResource && updatedResource.id) {
              // Update cache
              this.cacheManager.set(this.getCacheKey(resource, id), updatedResource);

              // Invalidate list cache
              this.cacheManager.invalidatePattern(`^${resource}:(?!.*:)`);
              
              return updatedResource as Resource<T>;
            } else {
              throw new Error("Resposta inválida da API local");
            }
          } catch (fallbackError) {
            logDataLayer.error(`API local também falhou para update de ${resource}:`, {
              backendError: backendError?.message,
              fallbackError: fallbackError?.message
            });
            
            // Queue for retry when connection is restored
            this.syncManager.queueOperation(resource, "update", { id, ...data });
            
            // Throw the original backend error with more context
            throw new Error(`Falha ao atualizar ${resource}: ${backendError?.message || 'Erro desconhecido'}`);
          }
        }
      } else {
        // Offline: update cache and queue for sync
        const cached = this.cacheManager.get<Resource<T>>(
          this.getCacheKey(resource, id),
        );
        if (cached) {
          const updated = {
            ...cached,
            ...data,
            updatedAt: new Date().toISOString(),
          } as Resource<T>;

          this.cacheManager.set(this.getCacheKey(resource, id), updated);
          this.syncManager.queueOperation(resource, "update", { id, ...data });

          return updated;
        } else {
          throw new Error("Resource not found in cache for offline update");
        }
      }
    } catch (error) {
      logDataLayer.error(`Erro crítico no update de ${resource}:`, {
        id,
        data,
        error: error?.message || error
      });
      
      throw error;
    }
  }

  async delete<T extends ResourceType>(resource: T, id: string): Promise<void> {
    try {
      // Try to delete via API if online
      if (this.syncManager.isOnline()) {
        const response = await this.apiClient.delete(`/${resource}/${id}`);

        if (response.success) {
          // Remove from cache
          this.cacheManager.invalidate(this.getCacheKey(resource, id));

          // Invalidate list cache
          this.cacheManager.invalidatePattern(`^${resource}:(?!.*:)`);
        } else {
          throw new Error(response.message || "Failed to delete resource");
        }
      } else {
        // Offline: remove from cache and queue for sync
        this.cacheManager.invalidate(this.getCacheKey(resource, id));
        this.syncManager.queueOperation(resource, "delete", { id });
      }
    } catch (error) {
      // If API fails but we're online, still queue for retry
      if (this.syncManager.isOnline()) {
        this.syncManager.queueOperation(resource, "delete", { id });
      }
      throw error;
    }
  }

  // Cache management
  invalidateCache(resource: ResourceType, id?: string): void {
    if (id) {
      this.cacheManager.invalidate(this.getCacheKey(resource, id));
    } else {
      this.cacheManager.invalidatePattern(`^${resource}:`);
    }
  }

  // Sync operations
  async syncPendingOperations(): Promise<void> {
    await this.syncManager.processQueue();
  }

  async forceSyncAll(): Promise<void> {
    await this.syncManager.forceSyncAll();
  }

  // Status and monitoring
  isOnline(): boolean {
    return this.syncManager.isOnline();
  }

  getSyncStatus(): SyncStatus {
    return this.syncManager.getSyncStatus();
  }

  getPendingOperations(): PendingOperation[] {
    return this.syncManager.getPendingOperations();
  }

  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // Configuration
  updateConfig(newConfig: Partial<DataLayerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.apiBaseUrl) {
      this.apiClient.setBaseURL(newConfig.apiBaseUrl);
    }
  }

  setAuthToken(token: string): void {
    this.apiClient.setAuthToken(token);
  }

  clearAuthToken(): void {
    this.apiClient.clearAuthToken();
  }

  // Event handlers
  onSyncComplete(callback: () => void): void {
    this.syncManager.onSyncComplete(callback);
  }

  // Cleanup
  destroy(): void {
    this.syncManager.destroy();
    this.cacheManager.destroy();
  }
}

// Default configuration
export const defaultDataLayerConfig: DataLayerConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  cacheEnabled: true,
  offlineEnabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
};

// Singleton instance
let dataLayerInstance: DataLayer | null = null;

export function getDataLayer(config?: Partial<DataLayerConfig>): DataLayer {
  if (!dataLayerInstance) {
    const finalConfig = { ...defaultDataLayerConfig, ...config };
    dataLayerInstance = new DataLayer(finalConfig);
  }
  return dataLayerInstance;
}

export function resetDataLayer(): void {
  if (dataLayerInstance) {
    dataLayerInstance.destroy();
    dataLayerInstance = null;
  }
}
