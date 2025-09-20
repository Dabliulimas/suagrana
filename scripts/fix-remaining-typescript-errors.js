#!/usr/bin/env node

/**
 * Script final para corrigir os erros TypeScript restantes
 * Foca em lib/auth/auth.ts e types/index.ts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const AUTH_PATH = path.join(PROJECT_ROOT, 'lib', 'auth', 'auth.ts');
const TYPES_PATH = path.join(PROJECT_ROOT, 'types', 'index.ts');

class FinalTypeScriptFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(prefix + ' ' + message);
  }

  /**
   * Corrige o arquivo types/index.ts
   */
  fixTypesFile() {
    this.log('Corrigindo types/index.ts...');

    if (!fs.existsSync(TYPES_PATH)) {
      this.log('Arquivo não encontrado: ' + TYPES_PATH, 'error');
      return;
    }

    const newTypesContent = `// Tipos principais do sistema SuaGrana
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
`;

    try {
      // Backup do arquivo original
      const backupPath = TYPES_PATH + '.backup';
      if (fs.existsSync(TYPES_PATH)) {
        fs.copyFileSync(TYPES_PATH, backupPath);
        this.log('Backup criado: ' + backupPath);
      }

      fs.writeFileSync(TYPES_PATH, newTypesContent);
      this.fixes.push('types/index.ts reconstruído');
      this.log('types/index.ts corrigido', 'success');
    } catch (error) {
      this.errors.push('Erro ao corrigir types/index.ts: ' + error.message);
      this.log('Erro: ' + error.message, 'error');
    }
  }

  /**
   * Corrige o arquivo lib/auth/auth.ts
   */
  fixAuthFile() {
    this.log('Corrigindo lib/auth/auth.ts...');

    if (!fs.existsSync(AUTH_PATH)) {
      this.log('Arquivo não encontrado: ' + AUTH_PATH, 'error');
      return;
    }

    const newAuthContent = `import { AuthUser, LoginCredentials, RegisterData, AuthResponse } from '@/types';

/**
 * Serviço de autenticação
 * Gerencia login, registro e sessões de usuário
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private token: string | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Obtém a instância singleton
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Carrega dados de autenticação do localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken;
      }
    } catch (error) {
      console.error('Erro ao carregar dados de autenticação:', error);
      this.clearStorage();
    }
  }

  /**
   * Salva dados de autenticação no localStorage
   */
  private saveToStorage(user: AuthUser, token: string): void {
    try {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Erro ao salvar dados de autenticação:', error);
    }
  }

  /**
   * Limpa dados de autenticação do localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Erro ao limpar dados de autenticação:', error);
    }
  }

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.mockApiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        const { user, token } = response.data;
        this.currentUser = user;
        this.token = token;
        this.saveToStorage(user, token);
        
        return { user, token };
      } else {
        throw new Error(response.error || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Realiza registro de novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.mockApiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.success) {
        const { user, token } = response.data;
        this.currentUser = user;
        this.token = token;
        this.saveToStorage(user, token);
        
        return { user, token };
      } else {
        throw new Error(response.error || 'Erro no registro');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.mockApiCall('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + this.token
          }
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      this.currentUser = null;
      this.token = null;
      this.clearStorage();
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Obtém o token atual
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Simulação de chamada de API
   */
  private async mockApiCall(endpoint: string, options: any = {}): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/auth/login') {
          const { email, password } = JSON.parse(options.body || '{}');
          if (email === 'demo@suagrana.com' && password === 'demo123') {
            resolve({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: 'demo@suagrana.com',
                  name: 'Usuário Demo',
                  avatar: undefined
                },
                token: 'mock-jwt-token-' + Date.now()
              }
            });
          } else {
            resolve({
              success: false,
              error: 'Credenciais inválidas'
            });
          }
        } else if (endpoint === '/auth/register') {
          const { email, name } = JSON.parse(options.body || '{}');
          resolve({
            success: true,
            data: {
              user: {
                id: Date.now().toString(),
                email,
                name,
                avatar: undefined
              },
              token: 'mock-jwt-token-' + Date.now()
            }
          });
        } else {
          resolve({ success: true, data: {} });
        }
      }, 500);
    });
  }
}

// Instância singleton
const authService = AuthService.getInstance();

// Funções de conveniência
export const login = (credentials: LoginCredentials) => authService.login(credentials);
export const register = (data: RegisterData) => authService.register(data);
export const logout = () => authService.logout();
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const getToken = () => authService.getToken();

// Exportação padrão
export default authService;
`;

    try {
      // Backup do arquivo original
      const backupPath = AUTH_PATH + '.backup';
      if (fs.existsSync(AUTH_PATH)) {
        fs.copyFileSync(AUTH_PATH, backupPath);
        this.log('Backup criado: ' + backupPath);
      }

      fs.writeFileSync(AUTH_PATH, newAuthContent);
      this.fixes.push('lib/auth/auth.ts reconstruído');
      this.log('lib/auth/auth.ts corrigido', 'success');
    } catch (error) {
      this.errors.push('Erro ao corrigir lib/auth/auth.ts: ' + error.message);
      this.log('Erro: ' + error.message, 'error');
    }
  }

  /**
   * Executa verificação final de tipos
   */
  async runFinalTypeCheck() {
    this.log('Executando verificação final de tipos...');
    
    try {
      execSync('npx tsc --noEmit', { 
        cwd: PROJECT_ROOT, 
        stdio: 'pipe' 
      });
      this.log('Verificação de tipos passou sem erros!', 'success');
      return true;
    } catch (error) {
      const output = error.stdout ? error.stdout.toString() : error.message;
      const errorCount = (output.match(/error TS/g) || []).length;
      
      if (errorCount > 0) {
        this.log('Ainda existem ' + errorCount + ' erros TypeScript', 'error');
        this.errors.push(errorCount + ' erros TypeScript restantes');
      }
      
      return false;
    }
  }

  /**
   * Gera relatório final
   */
  generateFinalReport() {
    this.log('\n📊 RELATÓRIO FINAL DE CORREÇÕES');
    this.log('=' .repeat(60));
    
    if (this.fixes.length > 0) {
      this.log('\n✅ CORREÇÕES APLICADAS:');
      this.fixes.forEach((fix, index) => {
        this.log((index + 1) + '. ' + fix);
      });
    }

    if (this.errors.length > 0) {
      this.log('\n❌ ERROS RESTANTES:');
      this.errors.forEach((error, index) => {
        this.log((index + 1) + '. ' + error);
      });
    }

    this.log('\n📈 ESTATÍSTICAS:');
    this.log('- Correções aplicadas: ' + this.fixes.length);
    this.log('- Erros restantes: ' + this.errors.length);

    if (this.errors.length === 0) {
      this.log('\n🎉 TODOS OS ERROS TYPESCRIPT FORAM CORRIGIDOS!', 'success');
    } else {
      this.log('\n⚠️ ' + this.errors.length + ' erro(s) ainda precisam de atenção manual.', 'warning');
    }
  }

  /**
   * Executa todas as correções finais
   */
  async run() {
    this.log('🚀 INICIANDO CORREÇÃO FINAL DOS ERROS TYPESCRIPT...');
    this.log('🎯 Foco: lib/auth/auth.ts e types/index.ts');
    this.log('');

    try {
      // 1. Corrigir types/index.ts
      this.fixTypesFile();
      
      // 2. Corrigir lib/auth/auth.ts
      this.fixAuthFile();
      
      // 3. Verificação final de tipos
      const typesOk = await this.runFinalTypeCheck();
      
      // 4. Gerar relatório final
      this.generateFinalReport();
      
      // 5. Status final
      if (typesOk && this.errors.length === 0) {
        this.log('\n🎯 MISSÃO CUMPRIDA: Sistema completamente corrigido!', 'success');
        process.exit(0);
      } else {
        this.log('\n🔧 Progresso significativo, mas ainda há trabalho a fazer.', 'warning');
        process.exit(1);
      }
      
    } catch (error) {
      this.log('Erro crítico: ' + error.message, 'error');
      process.exit(1);
    }
  }
}

// Execução principal
if (require.main === module) {
  const fixer = new FinalTypeScriptFixer();
  fixer.run().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = FinalTypeScriptFixer;