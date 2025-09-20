"use client";

import apiClient from '../api-client';
import { AxiosResponse } from 'axios';

// Tipos para as entidades financeiras
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  accountId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  balance: number;
  currency: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  userId: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'fund' | 'crypto' | 'bond' | 'reit';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  month: number;
  year: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para filtros e paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface TransactionFilters extends PaginationParams {
  type?: 'income' | 'expense';
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface InvestmentFilters extends PaginationParams {
  type?: string;
  search?: string;
}

export interface GoalFilters extends PaginationParams {
  isCompleted?: boolean;
  category?: string;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class FinancialService {
  // ==================== TRANSAÇÕES ====================
  
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<PaginatedResponse<Transaction>> = await apiClient.get(
      `/transactions?${params.toString()}`
    );
    return response.data;
  }

  async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    const response: AxiosResponse<ApiResponse<Transaction>> = await apiClient.get(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Transaction>> {
    const response: AxiosResponse<ApiResponse<Transaction>> = await apiClient.post('/transactions', transaction);
    return response.data;
  }

  async updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Transaction>> {
    const response: AxiosResponse<ApiResponse<Transaction>> = await apiClient.put(`/transactions/${id}`, transaction);
    return response.data;
  }

  async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  }

  // ==================== CONTAS ====================
  
  async getAccounts(): Promise<ApiResponse<Account[]>> {
    const response: AxiosResponse<ApiResponse<Account[]>> = await apiClient.get('/accounts');
    return response.data;
  }

  async getAccountById(id: string): Promise<ApiResponse<Account>> {
    const response: AxiosResponse<ApiResponse<Account>> = await apiClient.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(account: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Account>> {
    const response: AxiosResponse<ApiResponse<Account>> = await apiClient.post('/accounts', account);
    return response.data;
  }

  async updateAccount(id: string, account: Partial<Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Account>> {
    const response: AxiosResponse<ApiResponse<Account>> = await apiClient.put(`/accounts/${id}`, account);
    return response.data;
  }

  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(`/accounts/${id}`);
    return response.data;
  }

  // ==================== METAS ====================
  
  async getGoals(filters?: GoalFilters): Promise<PaginatedResponse<Goal>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<PaginatedResponse<Goal>> = await apiClient.get(
      `/goals?${params.toString()}`
    );
    return response.data;
  }

  async getGoalById(id: string): Promise<ApiResponse<Goal>> {
    const response: AxiosResponse<ApiResponse<Goal>> = await apiClient.get(`/goals/${id}`);
    return response.data;
  }

  async createGoal(goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Goal>> {
    const response: AxiosResponse<ApiResponse<Goal>> = await apiClient.post('/goals', goal);
    return response.data;
  }

  async updateGoal(id: string, goal: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Goal>> {
    const response: AxiosResponse<ApiResponse<Goal>> = await apiClient.put(`/goals/${id}`, goal);
    return response.data;
  }

  async deleteGoal(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(`/goals/${id}`);
    return response.data;
  }

  // ==================== INVESTIMENTOS ====================
  
  async getInvestments(filters?: InvestmentFilters): Promise<PaginatedResponse<Investment>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<PaginatedResponse<Investment>> = await apiClient.get(
      `/investments?${params.toString()}`
    );
    return response.data;
  }

  async getInvestmentById(id: string): Promise<ApiResponse<Investment>> {
    const response: AxiosResponse<ApiResponse<Investment>> = await apiClient.get(`/investments/${id}`);
    return response.data;
  }

  async createInvestment(investment: Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentPrice' | 'totalValue' | 'profitLoss' | 'profitLossPercentage'>): Promise<ApiResponse<Investment>> {
    const response: AxiosResponse<ApiResponse<Investment>> = await apiClient.post('/investments', investment);
    return response.data;
  }

  async updateInvestment(id: string, investment: Partial<Omit<Investment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Investment>> {
    const response: AxiosResponse<ApiResponse<Investment>> = await apiClient.put(`/investments/${id}`, investment);
    return response.data;
  }

  async deleteInvestment(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(`/investments/${id}`);
    return response.data;
  }

  // ==================== ORÇAMENTOS ====================
  
  async getBudgets(month?: number, year?: number): Promise<ApiResponse<Budget[]>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response: AxiosResponse<ApiResponse<Budget[]>> = await apiClient.get(
      `/budgets?${params.toString()}`
    );
    return response.data;
  }

  async createBudget(budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'spentAmount'>): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await apiClient.post('/budgets', budget);
    return response.data;
  }

  async updateBudget(id: string, budget: Partial<Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Budget>> {
    const response: AxiosResponse<ApiResponse<Budget>> = await apiClient.put(`/budgets/${id}`, budget);
    return response.data;
  }

  async deleteBudget(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await apiClient.delete(`/budgets/${id}`);
    return response.data;
  }

  // ==================== RELATÓRIOS E ANALYTICS ====================
  
  async getDashboardData(month?: number, year?: number): Promise<ApiResponse<{
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyBalance: number;
    totalInvestments: number;
    netWorth: number;
    savingsRate: number;
    recentTransactions: Transaction[];
    topCategories: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expenses: number; balance: number }[];
  }>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await apiClient.get(`/dashboard?${params.toString()}`);
    return response.data;
  }

  async getCashFlow(startDate: string, endDate: string): Promise<ApiResponse<{
    period: string;
    income: number;
    expenses: number;
    balance: number;
  }[]>> {
    const response = await apiClient.get(`/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }

  async getCategoryAnalysis(month?: number, year?: number): Promise<ApiResponse<{
    category: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }[]>> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const response = await apiClient.get(`/reports/categories?${params.toString()}`);
    return response.data;
  }

  // ==================== UTILITÁRIOS ====================
  
  async syncData(): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post('/sync');
    return response.data;
  }

  async exportData(format: 'csv' | 'xlsx' | 'pdf', type: 'transactions' | 'investments' | 'all'): Promise<Blob> {
    const response = await apiClient.get(`/export?format=${format}&type=${type}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

// Instância singleton
const financialService = new FinancialService();

export default financialService;
export { FinancialService };