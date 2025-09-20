import { apiClient } from "../lib/api-client";


export interface AccountFilters {

  status?: "active" | "inactive";
  bankName?: string;
}

export interface AccountStats {
  totalBalance: number;
  totalAccounts: number;
  activeAccounts: number;
  accountsByType: Record<string, number>;
  balanceByType: Record<string, number>;
}

export class AccountsService {
  private static readonly BASE_PATH = "/accounts";

  /**
   * Listar todas as contas
   */
  static async getAll(): Promise<Account[]> {
    const response = await apiClient.get<Account[]>(this.BASE_PATH);
    return response.data;
  }

  /**
   * Buscar conta por ID
   */
  static async getById(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`${this.BASE_PATH}/${id}`);
    return response.data;
  }

  /**
   * Criar nova conta
   */
  static async create(
    account: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ): Promise<Account> {
    const response = await apiClient.post<Account>(this.BASE_PATH, account);
    return response.data;
  }

  /**
   * Atualizar conta existente
   */
  static async update(id: string, updates: Partial<Account>): Promise<Account> {
    const response = await apiClient.put<Account>(
      `${this.BASE_PATH}/${id}`,
      updates,
    );
    return response.data;
  }

  /**
   * Deletar conta
   */
  static async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
  }

  /**
   * Buscar contas com filtros
   */
  static async search(filters: AccountFilters): Promise<{
    data: Account[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();

// // //     if (filters. // Campo removido: ${field} não existe no schema atual
    if (filters.status) params.append("status", filters.status);
    if (filters.bankName) params.append("bankName", filters.bankName);

    const response = await apiClient.get<{
      data: Account[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.BASE_PATH}/search?${params.toString()}`);

    return response.data;
  }

  /**
   * Obter estatísticas das contas
   */
  static async getStats(): Promise<AccountStats> {
    const response = await apiClient.get<AccountStats>(
      `${this.BASE_PATH}/stats`,
    );
    return response.data;
  }

  /**
   * Atualizar saldo da conta
   */
  static async updateBalance(id: string, newBalance: number): Promise<Account> {
    const response = await apiClient.patch<Account>(
      `${this.BASE_PATH}/${id}/balance`,
      {
        balance: newBalance,
      },
    );
    return response.data;
  }

  /**
   * Transferir entre contas
   */
  static async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description?: string,
  ): Promise<{
    fromAccount: Account;
    toAccount: Account;
    transactionId: string;
  }> {
    const response = await apiClient.post<{
      fromAccount: Account;
      toAccount: Account;
      transactionId: string;
    }>(`${this.BASE_PATH}/transfer`, {
      fromAccountId,
      toAccountId,
      amount,
      description,
    });
    return response.data;
  }

  /**
   * Ativar/desativar conta
   */
  static async toggleStatus(id: string): Promise<Account> {
    const response = await apiClient.patch<Account>(
      `${this.BASE_PATH}/${id}/toggle-status`,
    );
    return response.data;
  }

  /**
   * Obter histórico de saldos
   */
  static async getBalanceHistory(
    id: string,
    period?: "week" | "month" | "year",
  ): Promise<
    {
      date: string;
      balance: number;
    }[]
  > {
    const params = period ? `?period=${period}` : "";
    const response = await apiClient.get<
      {
        date: string;
        balance: number;
      }[]
    >(`${this.BASE_PATH}/${id}/balance-history${params}`);
    return response.data;
  }

  /**
   * Sincronizar saldo com banco (simulação)
   */
  static async syncBalance(id: string): Promise<Account> {
    const response = await apiClient.post<Account>(
      `${this.BASE_PATH}/${id}/sync-balance`,
    );
    return response.data;
  }

  /**
   * Exportar dados das contas
   */
  static async export(format: "csv" | "xlsx" | "pdf" = "csv"): Promise<Blob> {
    const response = await apiClient.get(
      `${this.BASE_PATH}/export?format=${format}`,
      {
        skipAuth: false,
        responseType: "blob",
      },
    );
    return response.data;
  }

  /**
   * Importar contas em lote
   */
  static async importBatch(
    accounts: Omit<Account, "id" | "createdAt" | "updatedAt">[],
  ): Promise<{
    imported: Account[];
    errors: { index: number; error: string }[];
  }> {
    const response = await apiClient.post<{
      imported: Account[];
      errors: { index: number; error: string }[];
    }>(`${this.BASE_PATH}/import`, { accounts });
    return response.data;
  }
}

export default AccountsService;
