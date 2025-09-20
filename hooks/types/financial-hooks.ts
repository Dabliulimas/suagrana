/**
 * Interfaces consolidadas para hooks financeiros
 * Estabelece padrões consistentes para todos os hooks de dados financeiros
 */

import type { Account } from "../../../lib/data-layer/types";

/**
 * Interface base para todos os hooks financeiros
 */
export interface UseFinancialHookReturn<T> {
  // Dados principais
  data: T[];
  isLoading: boolean;
  error: string | null;

  // Operações CRUD básicas
  create: (data: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<boolean>;

  // Operações utilitárias
  refresh: () => Promise<void>;
}

/**
 * Filtros para busca de contas
 */
export interface AccountFilters {
  type?: string;
  status?: "active" | "inactive";
  bankName?: string;
  minBalance?: number;
  maxBalance?: number;
}

/**
 * Estatísticas das contas
 */
export interface AccountStats {
  totalBalance: number;
  totalAccounts: number;
  activeAccounts: number;
  accountsByType: Record<string, number>;
  balanceByType: Record<string, number>;
}

/**
 * Opções de configuração para hooks
 */
export interface HookOptions {
  enableSync?: boolean;
  fallbackToLocal?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableCache?: boolean;
}

/**
 * Interface consolidada para useAccounts
 * Combina todas as funcionalidades das implementações existentes
 */
export interface UseAccountsReturn {
  // Dados principais (compatível com implementações existentes)
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  // Operações CRUD básicas
  create: (
    data: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Account>;
  update: (id: string, data: Partial<Account>) => Promise<Account>;
  delete: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;

  // Operações específicas de contas
  updateBalance: (id: string, newBalance: number) => Promise<Account>;
  transferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number,
    description?: string,
  ) => Promise<boolean>;
  toggleAccountStatus: (id: string) => Promise<Account>;

  // Operações de consulta
  searchAccounts: (filters: AccountFilters) => Promise<Account[]>;
  getStats: () => Promise<AccountStats>;

  // Status de conectividade
  isOnline: boolean;

  // Operações de sincronização
  syncWithBackend: () => Promise<void>;
}

/**
 * Tipos de erro para hooks
 */
export enum HookErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  SYNC_ERROR = "SYNC_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Interface para erros de hooks
 */
export interface HookError {
  type: HookErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Estado interno dos hooks
 */
export interface HookState<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isOnline: boolean;
}
