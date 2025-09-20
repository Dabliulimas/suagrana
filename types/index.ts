// Tipos principais do sistema SuaGrana
// Baseado no schema Prisma atualizado

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "income" | "expense" | "transfer";
  date: string;
  categoryId: string;
  accountId: string;
  notes?: string;
  sharedWith?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense" | "transfer";
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  spent: number;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Tipos para formulários
export interface TransactionFormData {
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  accountId: string;
  notes?: string;
}

export interface CategoryFormData {
  name: string;
  color?: string;
  icon?: string;
}

export interface AccountFormData {
  name: string;
  type: string;
  balance: number;
}

export interface GoalFormData {
  title: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
}

// Tipos para relatórios
export interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categories: CategoryReport[];
}

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

// Tipos para dashboard
export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentTransactions: Transaction[];
  upcomingGoals: Goal[];
  budgetStatus: BudgetStatus[];
}

export interface BudgetStatus {
  budgetId: string;
  categoryName: string;
  spent: number;
  limit: number;
  percentage: number;
}

// Tipos para filtros e paginação
export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Tipos para configurações
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  language: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Tipos para hooks
export interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTransaction: (data: TransactionFormData) => Promise<void>;
  updateTransaction: (id: string, data: Partial<TransactionFormData>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export interface UseAuthResult {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Tipos para contextos
export interface FinancialContextValue {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  goals: Goal[];
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Tipos utilitários
export type CreateTransactionData = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTransactionData = Partial<CreateTransactionData>;
export type CreateCategoryData = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateAccountData = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateGoalData = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

// Enums
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CASH = 'cash'
}

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

// Input types for store operations
export type CreateAccountInput = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateGoalInput = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateInvestmentInput = Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateAccountInput = Partial<Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateGoalInput = Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
export type UpdateInvestmentInput = Partial<Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Stats types
export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  recentTransactions: Transaction[];
  topCategories: CategoryStats[];
  monthlyStats: MonthlyStats[];
}
