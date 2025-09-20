/**
 * Unified Data Layer Types
 * Single source of truth for all data operations
 */

// Base Entity Interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Resource Types
export type ResourceType =
  | "transactions"
  | "accounts"
  | "goals"
  | "contacts"
  | "trips"
  | "investments"
  | "shared-debts";

// CRUD Operation Types
export type CRUDOperation = "create" | "read" | "update" | "delete";

// Pending Operation for Offline Support
export interface PendingOperation {
  id: string;
  resource: ResourceType;
  operation: CRUDOperation;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

// API Response Wrapper
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  timestamp: string;
}

// Cache Entry
export interface CacheEntry<T> {
  data: T;
  timestamp: string;
  ttl: number;
  key: string;
}

// Sync Status
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingOperations: number;
  syncInProgress: boolean;
  errors: string[];
}

// Data Layer Configuration
export interface DataLayerConfig {
  apiBaseUrl: string;
  cacheEnabled: boolean;
  offlineEnabled: boolean;
  defaultTTL: number;
  maxRetries: number;
  retryDelay: number;
}

// Error Types
export interface DataLayerError {
  code: string;
  message: string;
  resource?: ResourceType;
  operation?: CRUDOperation;
  details?: any;
  timestamp: string;
  retryable: boolean;
}

// Query Parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  filter?: Record<string, any>;
  search?: string;
}

// Unified Entity Types
export interface Transaction extends BaseEntity {
  description: string;
  amount: number;
  type: "income" | "expense" | "shared";
  category: string;
  accountId: string;
  account?: string; // Compatibilidade com sistema antigo
  date: string;
  notes?: string;
  sharedWith?: string[];
  tripId?: string;
  tags?: string[];
}

export interface Account extends BaseEntity {
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  currency: string;
  bank?: string;
  creditLimit?: number;
  interestRate?: number;
  description?: string;
}

export interface Goal extends BaseEntity {
  name: string;
  description?: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  priority: "high" | "medium" | "low";
  isCompleted: boolean;
}

export interface Contact extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  relationship?: string;
  notes?: string;
}

export interface Trip extends BaseEntity {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  currency: string;
  status: "planejamento" | "andamento" | "finalizada" | "cancelada";
  participants: string[];
  description?: string;
  averageExchangeRate?: number;
}

export interface CurrencyExchange extends BaseEntity {
  tripId: string;
  date: string;
  amountBRL: number;
  amountForeign: number;
  exchangeRate: number;
  cet: number;
  location?: string;
  notes?: string;
}

export interface Investment extends BaseEntity {
  identifier: string; // Ticker, CNPJ, código
  name?: string; // Nome do ativo
  assetType:
    | "stock"
    | "fii"
    | "etf"
    | "crypto"
    | "fixed_income"
    | "fund"
    | "bdr"
    | "option"
    | "future"
    | "other";
  brokerId: string;
  totalQuantity: number;
  averagePrice: number; // Preço médio ponderado
  totalInvested: number; // Valor total investido
  currentPrice?: number; // Cotação atual
  currentValue?: number; // Valor atual da posição
  profitLoss?: number; // Lucro/Prejuízo atual
  profitLossPercentage?: number; // % de lucro/prejuízo
  // Campos relacionados a dividendos
  totalDividendsReceived?: number; // Total de dividendos recebidos
  dividendYield?: number; // Yield de dividendos (%)
  lastDividendDate?: string; // Data do último dividendo
  lastDividendValue?: number; // Valor do último dividendo
  status: "active" | "closed"; // Ativo ou zerado
  operations?: InvestmentOperation[];
}

export interface InvestmentOperation extends BaseEntity {
  investmentId: string;
  accountId: string; // Conta obrigatória para movimentação
  brokerId: string;
  operationType: "buy" | "sell" | "dividend" | "jscp" | "bonus" | "split";
  quantity: number;
  unitPrice: number;
  totalValue: number; // quantity * unitPrice
  fees: number; // Taxas e custos
  netValue: number; // Valor líquido (totalValue + fees para compra, totalValue - fees para venda)
  operationDate: string;
  profitLoss?: number; // Apenas para vendas
  notes?: string;
  // Campos específicos para dividendos
  dividendType?: "dividend" | "jscp" | "bonus" | "split";
  valuePerShare?: number;
  exDividendDate?: string;
  paymentDate?: string;
}

export interface SharedDebt extends BaseEntity {
  creditor: string;
  debtor: string;
  originalAmount: number;
  currentAmount: number;
  description: string;
  transactionId?: string;
  status: "active" | "paid" | "cancelled";
}

// Resource Map for Type Safety
export interface ResourceMap {
  transactions: Transaction;
  accounts: Account;
  goals: Goal;
  contacts: Contact;
  trips: Trip;
  investments: Investment;
  "shared-debts": SharedDebt;
}

// Generic Resource Type
export type Resource<T extends ResourceType> = ResourceMap[T];
