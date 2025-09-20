"use client";

import { backendClient } from "./api-client";
import { logComponents } from "./logger";
import { toast } from "sonner";

class UnifiedFinancialSystem {
  private static instance: UnifiedFinancialSystem;
  private backendAvailable: boolean | null = null;
  private lastBackendCheck: number = 0;
  private readonly BACKEND_CHECK_INTERVAL = 30000; // 30 segundos

  static getInstance(): UnifiedFinancialSystem {
    if (!UnifiedFinancialSystem.instance) {
      UnifiedFinancialSystem.instance = new UnifiedFinancialSystem();
    }
    return UnifiedFinancialSystem.instance;
  }

  private async checkBackendAvailability(): Promise<boolean> {
    const now = Date.now();

    // Se já verificamos recentemente, usar cache
    if (
      this.backendAvailable !== null &&
      now - this.lastBackendCheck < this.BACKEND_CHECK_INTERVAL
    ) {
      return this.backendAvailable;
    }

    try {
      // Tentar conectar ao backend na porta 3003
const response = await fetch("http://localhost:3001/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      });

      if (response.ok) {
        this.backendAvailable = true;
        this.lastBackendCheck = now;
        console.log("✅ Backend disponível na porta 3003");
        return true;
      } else {
        throw new Error(`Backend respondeu com status ${response.status}`);
      }
    } catch (error) {
      console.log(
        "⚠️ Backend não disponível, usando storage local:",
        error.message,
      );
      this.backendAvailable = false;
      this.lastBackendCheck = now;
      return false;
    }
  }

  private async executeWithFallback<T>(
    backendOperation: () => Promise<T>,
    localFallback: () => Promise<T> | T,
    successMessage?: string,
    localMessage?: string,
  ): Promise<T> {
    const isBackendAvailable = await this.checkBackendAvailability();

    if (!isBackendAvailable) {
      console.log("Backend não disponível, usando storage local");
      const result = await localFallback();
      if (localMessage) {
        toast.success(localMessage);
      }
      return result;
    }

    try {
      const result = await backendOperation();
      if (successMessage) {
        toast.success(successMessage);
      }
      return result;
    } catch (error) {
      logComponents.error("Erro no backend, usando fallback local:", error);
      this.backendAvailable = false; // Marcar como indisponível
      const result = await localFallback();
      if (localMessage) {
        toast.success(localMessage);
      }
      return result;
    }
  }

  // ACCOUNTS
  async getAccounts() {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.get("/accounts");
        return response.data?.accounts || [];
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.getAccounts() || [];
      },
    );
  }

  async createAccount(accountData: any) {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.post("/accounts", accountData);
        return response.data.account;
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.saveAccount(accountData);
      },
      "Conta criada com sucesso",
      "Conta criada com sucesso (local)",
    );
  }

  async updateAccount(id: string, updates: any) {
    try {
      const response = await backendClient.put(`/accounts/${id}`, updates);
      toast.success("Conta atualizada com sucesso");
      return response.data.account;
    } catch (error) {
      logComponents.error("Erro ao atualizar conta no backend:", error);
      throw error;
    }
  }

  async deleteAccount(id: string) {
    try {
      await backendClient.delete(`/accounts/${id}`);
      toast.success("Conta excluída com sucesso");
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar conta no backend:", error);
      throw error;
    }
  }

  // TRANSACTIONS
  async getTransactions() {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.get("/transactions");
        return response.data?.transactions || [];
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.getTransactions() || [];
      },
    );
  }

  async createTransaction(transactionData: any) {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.post(
        "/transactions",
        transactionData,
      );
        return response.data.transaction;
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.saveTransaction(transactionData);
      },
      "Transação criada com sucesso",
      "Transação criada com sucesso (local)",
    );
  }

  async updateTransaction(id: string, updates: any) {
    try {
      const response = await backendClient.put(`/transactions/${id}`, updates);
      toast.success("Transação atualizada com sucesso");
      return response.data.transaction;
    } catch (error) {
      logComponents.error("Erro ao atualizar transação no backend:", error);
      throw error;
    }
  }

  async deleteTransaction(id: string) {
    try {
      await backendClient.delete(`/transactions/${id}`);
      toast.success("Transação excluída com sucesso");
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar transação no backend:", error);
      throw error;
    }
  }

  // GOALS
  async getGoals() {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.get("/goals");
        return response.data?.goals || [];
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.getGoals() || [];
      },
    );
  }

  async createGoal(goalData: any) {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.post("/goals", goalData);
        return response.data.goal;
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.saveGoal(goalData);
      },
      "Meta criada com sucesso",
      "Meta criada com sucesso (local)",
    );
  }

  async updateGoal(id: string, updates: any) {
    try {
      const response = await backendClient.put(`/goals/${id}`, updates);
      toast.success("Meta atualizada com sucesso");
      return response.data.goal;
    } catch (error) {
      logComponents.error("Erro ao atualizar meta no backend:", error);
      throw error;
    }
  }

  async deleteGoal(id: string) {
    try {
      await backendClient.delete(`/goals/${id}`);
      toast.success("Meta excluída com sucesso");
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar meta no backend:", error);
      throw error;
    }
  }

  // INVESTMENTS
  async getInvestments() {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.get("/investments");
        return response.data?.investments || [];
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.getInvestments() || [];
      },
    );
  }

  async createInvestment(investmentData: any) {
    return this.executeWithFallback(
      async () => {
        const response = await backendClient.post(
          "/investments",
          investmentData,
        );
        return response.data.investment;
      },
      async () => {
        const { storage } = await import("./storage");
        return storage.saveInvestment(investmentData);
      },
      "Investimento criado com sucesso",
      "Investimento criado com sucesso (local)",
    );
  }

  async updateInvestment(id: string, updates: any) {
    try {
      const response = await backendClient.put(`/investments/${id}`, updates);
      toast.success("Investimento atualizado com sucesso");
      return response.data.investment;
    } catch (error) {
      logComponents.error("Erro ao atualizar investimento no backend:", error);
      throw error;
    }
  }

  async deleteInvestment(id: string) {
    try {
      await backendClient.delete(`/investments/${id}`);
      toast.success("Investimento excluído com sucesso");
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar investimento no backend:", error);
      throw error;
    }
  }
}

export { UnifiedFinancialSystem };
export const unifiedSystem = UnifiedFinancialSystem.getInstance();
