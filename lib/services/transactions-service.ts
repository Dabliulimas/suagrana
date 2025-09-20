import { apiClient } from "../api-client";
import { logComponents } from "../logger";
import type { Transaction } from "../types";

/**
 * Serviço para gerenciar transações via API
 */
export class TransactionsService {
  /**
   * Listar todas as transações
   */
  static async getAll(): Promise<Transaction[]> {
    try {
      const response = await apiClient.get<{ 
        success: boolean;
        data: {
          transactions: Transaction[];
          pagination: any;
          summary: any;
        }
      }>("/transactions");
      return response.data?.transactions || [];
    } catch (error) {
      logComponents.error("Erro ao buscar transações:", error);
      throw error;
    }
  }

  /**
   * Buscar transação por ID
   */
  static async getById(id: string): Promise<Transaction> {
    try {
      const response = await apiClient.get<{ data: Transaction }>(
        `/transactions/${id}`,
      );
      return response.data;
    } catch (error) {
      logComponents.error("Erro ao buscar transação:", error);
      throw error;
    }
  }

  /**
   * Criar nova transação
   */
  static async create(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction> {
    try {
      const response = await apiClient.post<{ data: Transaction }>(
        "/transactions",
        transaction,
      );
      return response.data;
    } catch (error) {
      logComponents.error("Erro ao criar transação:", error);
      throw error;
    }
  }

  /**
   * Atualizar transação existente
   */
  static async update(
    id: string,
    updates: Partial<Transaction>,
  ): Promise<Transaction> {
    try {
      const response = await apiClient.put<{ data: Transaction }>(
        `/transactions/${id}`,
        updates,
      );
      return response.data;
    } catch (error) {
      logComponents.error("Erro ao atualizar transação:", error);
      throw error;
    }
  }

  /**
   * Deletar transação
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/transactions/${id}`);
    } catch (error) {
      logComponents.error("Erro ao deletar transação:", error);
      throw error;
    }
  }

  /**
   * Buscar transações com filtros
   */
  static async search(filters: {
    type?: "income" | "expense" | "shared";
    category?: string;
    account?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Transaction[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await apiClient.get<{
        data: Transaction[];
        total: number;
      }>(`/transactions/search?${queryParams.toString()}`);

      return response;
    } catch (error) {
      logComponents.error("Erro ao buscar transações:", error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de transações
   */
  static async getStats(period?: "month" | "year" | "all"): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  }> {
    try {
      const queryParams = period ? `?period=${period}` : "";
      const response = await apiClient.get<{
        data: {
          totalIncome: number;
          totalExpenses: number;
          balance: number;
          transactionCount: number;
          categoryBreakdown: Array<{
            category: string;
            amount: number;
            count: number;
          }>;
        };
      }>(`/transactions/stats${queryParams}`);

      return response.data;
    } catch (error) {
      logComponents.error("Erro ao buscar estatísticas:", error);
      throw error;
    }
  }

  /**
   * Importar transações em lote
   */
  static async importBatch(
    transactions: Array<Omit<Transaction, "id" | "createdAt" | "updatedAt">>,
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const response = await apiClient.post<{
        data: {
          imported: number;
          failed: number;
          errors: string[];
        };
      }>("/transactions/import", { transactions });

      return response.data;
    } catch (error) {
      logComponents.error("Erro ao importar transações:", error);
      throw error;
    }
  }

  /**
   * Exportar transações
   */
  static async export(
    format: "csv" | "xlsx" | "json",
    filters?: {
      startDate?: string;
      endDate?: string;
      category?: string;
      type?: "income" | "expense" | "shared";
    },
  ): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams({ format });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }

      const response = await apiClient.get(
        `/transactions/export?${queryParams.toString()}`,
        {
          responseType: 'blob'
        }
      );

      return response as unknown as Blob;
    } catch (error) {
      logComponents.error("Erro ao exportar transações:", error);
      throw error;
    }
  }
}

export default TransactionsService;
