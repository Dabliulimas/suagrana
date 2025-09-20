"use client";

import { storage, type Transaction, type Account } from "./storage";
import { logComponents } from "../logger";
import { auditLogger } from "./audit";
import { authService } from "./auth";

// Interface principal do Razão Contábil Centralizado
export interface LedgerEntry {
  id: string;
  batchId: string; // Agrupa lançamentos da mesma operação
  transactionId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number; // Saldo após este lançamento
  description: string;
  reference?: string;
  date: string;
  createdAt: string;
  createdBy: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  validatedAt?: string;
  validatedBy?: string;
}

// Tipos de conta seguindo padrões bancários
export enum AccountType {
  ASSET = "ASSET", // Ativo (Débito aumenta, Crédito diminui)
  LIABILITY = "LIABILITY", // Passivo (Crédito aumenta, Débito diminui)
  EQUITY = "EQUITY", // Patrimônio Líquido (Crédito aumenta, Débito diminui)
  REVENUE = "REVENUE", // Receita (Crédito aumenta, Débito diminui)
  EXPENSE = "EXPENSE", // Despesa (Débito aumenta, Crédito diminui)
}

// Plano de Contas Centralizado
export interface ChartAccount {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  level: number;
  isActive: boolean;
  acceptsEntries: boolean;
  normalBalance: "DEBIT" | "CREDIT";
  description?: string;
}

// Resultado de validação
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalDebits: number;
  totalCredits: number;
  difference: number;
}

// Saldo de conta
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  normalBalance: "DEBIT" | "CREDIT";
  lastMovement?: string;
}

// Balancete
export interface TrialBalance {
  period: { start: string; end: string };
  accounts: AccountBalance[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    difference: number;
  };
  isBalanced: boolean;
  generatedAt: string;
}

class CentralizedLedger {
  private chartOfAccounts: ChartAccount[] = [];
  private readonly STORAGE_KEY = "sua-grana-ledger-entries";
  private readonly CHART_KEY = "sua-grana-chart-of-accounts";

  constructor() {
    this.initializeChartOfAccounts();
  }

  // Inicializar Plano de Contas padrão
  private initializeChartOfAccounts(): void {
    const existingChart = this.loadChartOfAccounts();
    if (existingChart && existingChart.length > 0) {
      this.chartOfAccounts = existingChart;
      return;
    }

    // Plano de Contas padrão seguindo estrutura bancária
    this.chartOfAccounts = [
      // ATIVOS
      {
        code: "1",
        name: "ATIVOS",
        type: AccountType.ASSET,
        level: 1,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "1.1",
        name: "ATIVO CIRCULANTE",
        type: AccountType.ASSET,
        parentCode: "1",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "1.1.01",
        name: "CAIXA E EQUIVALENTES",
        type: AccountType.ASSET,
        parentCode: "1.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.1.02",
        name: "CONTAS CORRENTES",
        type: AccountType.ASSET,
        parentCode: "1.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.1.03",
        name: "POUPANÇA",
        type: AccountType.ASSET,
        parentCode: "1.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.1.04",
        name: "INVESTIMENTOS CURTO PRAZO",
        type: AccountType.ASSET,
        parentCode: "1.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.2",
        name: "ATIVO NÃO CIRCULANTE",
        type: AccountType.ASSET,
        parentCode: "1",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "1.2.01",
        name: "INVESTIMENTOS LONGO PRAZO",
        type: AccountType.ASSET,
        parentCode: "1.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.2.02",
        name: "IMÓVEIS",
        type: AccountType.ASSET,
        parentCode: "1.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "1.2.03",
        name: "VEÍCULOS",
        type: AccountType.ASSET,
        parentCode: "1.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },

      // PASSIVOS
      {
        code: "2",
        name: "PASSIVOS",
        type: AccountType.LIABILITY,
        level: 1,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "2.1",
        name: "PASSIVO CIRCULANTE",
        type: AccountType.LIABILITY,
        parentCode: "2",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "2.1.01",
        name: "CARTÃO DE CRÉDITO",
        type: AccountType.LIABILITY,
        parentCode: "2.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "2.1.02",
        name: "EMPRÉSTIMOS CURTO PRAZO",
        type: AccountType.LIABILITY,
        parentCode: "2.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "2.1.03",
        name: "FINANCIAMENTOS CURTO PRAZO",
        type: AccountType.LIABILITY,
        parentCode: "2.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "2.2",
        name: "PASSIVO NÃO CIRCULANTE",
        type: AccountType.LIABILITY,
        parentCode: "2",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "2.2.01",
        name: "EMPRÉSTIMOS LONGO PRAZO",
        type: AccountType.LIABILITY,
        parentCode: "2.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "2.2.02",
        name: "FINANCIAMENTOS LONGO PRAZO",
        type: AccountType.LIABILITY,
        parentCode: "2.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },

      // PATRIMÔNIO LÍQUIDO
      {
        code: "3",
        name: "PATRIMÔNIO LÍQUIDO",
        type: AccountType.EQUITY,
        level: 1,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "3.1",
        name: "CAPITAL PRÓPRIO",
        type: AccountType.EQUITY,
        parentCode: "3",
        level: 2,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "3.2",
        name: "RESERVAS",
        type: AccountType.EQUITY,
        parentCode: "3",
        level: 2,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "3.3",
        name: "LUCROS ACUMULADOS",
        type: AccountType.EQUITY,
        parentCode: "3",
        level: 2,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },

      // RECEITAS
      {
        code: "4",
        name: "RECEITAS",
        type: AccountType.REVENUE,
        level: 1,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "4.1",
        name: "RECEITAS OPERACIONAIS",
        type: AccountType.REVENUE,
        parentCode: "4",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "4.1.01",
        name: "SALÁRIOS",
        type: AccountType.REVENUE,
        parentCode: "4.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "4.1.02",
        name: "FREELANCES",
        type: AccountType.REVENUE,
        parentCode: "4.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "4.1.03",
        name: "VENDAS",
        type: AccountType.REVENUE,
        parentCode: "4.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "4.2",
        name: "RECEITAS FINANCEIRAS",
        type: AccountType.REVENUE,
        parentCode: "4",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "CREDIT",
      },
      {
        code: "4.2.01",
        name: "RENDIMENTOS INVESTIMENTOS",
        type: AccountType.REVENUE,
        parentCode: "4.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },
      {
        code: "4.2.02",
        name: "DIVIDENDOS",
        type: AccountType.REVENUE,
        parentCode: "4.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "CREDIT",
      },

      // DESPESAS
      {
        code: "5",
        name: "DESPESAS",
        type: AccountType.EXPENSE,
        level: 1,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1",
        name: "DESPESAS OPERACIONAIS",
        type: AccountType.EXPENSE,
        parentCode: "5",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.01",
        name: "ALIMENTAÇÃO",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.02",
        name: "TRANSPORTE",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.03",
        name: "MORADIA",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.04",
        name: "SAÚDE",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.05",
        name: "EDUCAÇÃO",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.1.06",
        name: "LAZER",
        type: AccountType.EXPENSE,
        parentCode: "5.1",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.2",
        name: "DESPESAS FINANCEIRAS",
        type: AccountType.EXPENSE,
        parentCode: "5",
        level: 2,
        isActive: true,
        acceptsEntries: false,
        normalBalance: "DEBIT",
      },
      {
        code: "5.2.01",
        name: "JUROS EMPRÉSTIMOS",
        type: AccountType.EXPENSE,
        parentCode: "5.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
      {
        code: "5.2.02",
        name: "TARIFAS BANCÁRIAS",
        type: AccountType.EXPENSE,
        parentCode: "5.2",
        level: 3,
        isActive: true,
        acceptsEntries: true,
        normalBalance: "DEBIT",
      },
    ];

    this.saveChartOfAccounts();
  }

  // Criar lançamento contábil com partidas dobradas
  async createDoubleEntry(
    transaction: Transaction,
    customMappings?: { debitAccount: string; creditAccount: string },
  ): Promise<{
    success: boolean;
    entries?: LedgerEntry[];
    validation?: ValidationResult;
    error?: string;
  }> {
    try {
      const batchId = this.generateId();
      const userId = authService.getCurrentUser()?.id || "system";

      let debitAccountCode: string;
      let creditAccountCode: string;

      if (customMappings) {
        debitAccountCode = customMappings.debitAccount;
        creditAccountCode = customMappings.creditAccount;
      } else {
        // Mapeamento automático baseado no tipo de transação
        const mapping = this.getAutomaticMapping(transaction);
        debitAccountCode = mapping.debitAccount;
        creditAccountCode = mapping.creditAccount;
      }

      // Validar contas
      const debitAccount = this.getAccountByCode(debitAccountCode);
      const creditAccount = this.getAccountByCode(creditAccountCode);

      if (!debitAccount || !creditAccount) {
        return {
          success: false,
          error: `Contas não encontradas: ${!debitAccount ? debitAccountCode : ""} ${!creditAccount ? creditAccountCode : ""}`,
        };
      }

      if (!debitAccount.acceptsEntries || !creditAccount.acceptsEntries) {
        return {
          success: false,
          error: "Uma ou ambas as contas não aceitam lançamentos",
        };
      }

      // Criar lançamentos
      const entries: LedgerEntry[] = [
        {
          id: this.generateId(),
          batchId,
          transactionId: transaction.id,
          accountCode: debitAccountCode,
          accountName: debitAccount.name,
          accountType: debitAccount.type,
          debit: transaction.amount,
          credit: 0,
          balance: 0, // Será calculado ao salvar
          description: transaction.description,
          reference: transaction.notes,
          date: transaction.date,
          createdAt: this.getTimestamp(),
          createdBy: userId,
          status: "CONFIRMED",
        },
        {
          id: this.generateId(),
          batchId,
          transactionId: transaction.id,
          accountCode: creditAccountCode,
          accountName: creditAccount.name,
          accountType: creditAccount.type,
          debit: 0,
          credit: transaction.amount,
          balance: 0, // Será calculado ao salvar
          description: transaction.description,
          reference: transaction.notes,
          date: transaction.date,
          createdAt: this.getTimestamp(),
          createdBy: userId,
          status: "CONFIRMED",
        },
      ];

      // Validar partidas dobradas
      const validation = this.validateEntries(entries);
      if (!validation.isValid) {
        return {
          success: false,
          validation,
          error:
            "Falha na validação das partidas dobradas: " +
            validation.errors.join(", "),
        };
      }

      // Calcular saldos e salvar
      await this.saveEntriesWithBalanceUpdate(entries);

      // Log de auditoria
      await auditLogger.log({
        action: "LEDGER_DOUBLE_ENTRY_CREATED",
        userId,
        details: {
          batchId,
          transactionId: transaction.id,
          debitAccount: debitAccountCode,
          creditAccount: creditAccountCode,
          amount: transaction.amount,
        },
        severity: "medium",
      });

      return { success: true, entries, validation };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar lançamento contábil",
      };
    }
  }

  // Mapeamento automático de transações para contas
  private getAutomaticMapping(transaction: Transaction): {
    debitAccount: string;
    creditAccount: string;
  } {
    const accountMapping = this.mapAccountNameToCode(transaction.account);

    if (transaction.type === "income") {
      // Receita: Débito na conta (ativo) / Crédito na receita
      return {
        debitAccount: accountMapping,
        creditAccount: this.mapCategoryToRevenueAccount(transaction.category),
      };
    } else if (transaction.type === "expense") {
      // Despesa: Débito na despesa / Crédito na conta (ativo)
      return {
        debitAccount: this.mapCategoryToExpenseAccount(transaction.category),
        creditAccount: accountMapping,
      };
    } else {
      // Transferência ou outros: usar contas padrão
      return {
        debitAccount: accountMapping,
        creditAccount: "3.1", // Capital próprio
      };
    }
  }

  // Mapear nome da conta para código
  private mapAccountNameToCode(accountName: string): string {
    const lowerName = accountName.toLowerCase();

    if (lowerName.includes("caixa")) return "1.1.01";
    if (lowerName.includes("corrente") || lowerName.includes("conta"))
      return "1.1.02";
    if (lowerName.includes("poupança")) return "1.1.03";
    if (lowerName.includes("investimento")) return "1.1.04";
    if (lowerName.includes("cartão") || lowerName.includes("crédito"))
      return "2.1.01";

    return "1.1.02"; // Conta corrente como padrão
  }

  // Mapear categoria para conta de receita
  private mapCategoryToRevenueAccount(category: string): string {
    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes("salário") || lowerCategory.includes("salario"))
      return "4.1.01";
    if (lowerCategory.includes("freelance")) return "4.1.02";
    if (lowerCategory.includes("venda")) return "4.1.03";
    if (
      lowerCategory.includes("investimento") ||
      lowerCategory.includes("rendimento")
    )
      return "4.2.01";
    if (lowerCategory.includes("dividendo")) return "4.2.02";

    return "4.1.01"; // Salários como padrão
  }

  // Mapear categoria para conta de despesa
  private mapCategoryToExpenseAccount(category: string): string {
    const lowerCategory = category.toLowerCase();

    if (
      lowerCategory.includes("alimentação") ||
      lowerCategory.includes("comida") ||
      lowerCategory.includes("restaurante")
    )
      return "5.1.01";
    if (
      lowerCategory.includes("transporte") ||
      lowerCategory.includes("combustível") ||
      lowerCategory.includes("uber")
    )
      return "5.1.02";
    if (
      lowerCategory.includes("moradia") ||
      lowerCategory.includes("aluguel") ||
      lowerCategory.includes("casa")
    )
      return "5.1.03";
    if (
      lowerCategory.includes("saúde") ||
      lowerCategory.includes("médico") ||
      lowerCategory.includes("farmácia")
    )
      return "5.1.04";
    if (
      lowerCategory.includes("educação") ||
      lowerCategory.includes("curso") ||
      lowerCategory.includes("escola")
    )
      return "5.1.05";
    if (
      lowerCategory.includes("lazer") ||
      lowerCategory.includes("entretenimento") ||
      lowerCategory.includes("cinema")
    )
      return "5.1.06";
    if (lowerCategory.includes("juros") || lowerCategory.includes("empréstimo"))
      return "5.2.01";
    if (lowerCategory.includes("tarifa") || lowerCategory.includes("banco"))
      return "5.2.02";

    return "5.1.01"; // Alimentação como padrão
  }

  // Validar lançamentos
  private validateEntries(entries: LedgerEntry[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    // Validação de partidas dobradas
    if (difference > 0.01) {
      // Tolerância para arredondamento
      errors.push(
        `Partidas não balanceadas: Débitos ${totalDebits.toFixed(2)} ≠ Créditos ${totalCredits.toFixed(2)}`,
      );
    }

    // Validar se todas as contas existem
    for (const entry of entries) {
      const account = this.getAccountByCode(entry.accountCode);
      if (!account) {
        errors.push(`Conta não encontrada: ${entry.accountCode}`);
      } else if (!account.acceptsEntries) {
        errors.push(
          `Conta não aceita lançamentos: ${entry.accountCode} - ${account.name}`,
        );
      }
    }

    // Validar valores
    for (const entry of entries) {
      if (entry.debit < 0 || entry.credit < 0) {
        errors.push(`Valores negativos não permitidos: ${entry.accountCode}`);
      }
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(
          `Lançamento não pode ter débito e crédito simultaneamente: ${entry.accountCode}`,
        );
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(
          `Lançamento deve ter valor em débito ou crédito: ${entry.accountCode}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalDebits,
      totalCredits,
      difference,
    };
  }

  // Salvar lançamentos com atualização de saldo
  private async saveEntriesWithBalanceUpdate(
    entries: LedgerEntry[],
  ): Promise<void> {
    const existingEntries = this.getLedgerEntries();

    // Calcular saldos para cada conta afetada
    for (const entry of entries) {
      const accountEntries = existingEntries
        .filter(
          (e) => e.accountCode === entry.accountCode && e.date <= entry.date,
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      let balance = 0;
      const account = this.getAccountByCode(entry.accountCode)!;

      // Calcular saldo baseado na natureza da conta
      for (const accEntry of accountEntries) {
        if (account.normalBalance === "DEBIT") {
          balance += accEntry.debit - accEntry.credit;
        } else {
          balance += accEntry.credit - accEntry.debit;
        }
      }

      // Aplicar o novo lançamento
      if (account.normalBalance === "DEBIT") {
        balance += entry.debit - entry.credit;
      } else {
        balance += entry.credit - entry.debit;
      }

      entry.balance = balance;
    }

    // Salvar no localStorage
    const allEntries = [...existingEntries, ...entries];
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allEntries));
    }

    // Disparar evento de mudança
    if (typeof window !== "undefined") {
      const event = new CustomEvent("storageChange", {
        detail: {
          key: this.STORAGE_KEY,
          action: "save",
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(event);
    }
  }

  // Obter lançamentos do razão
  getLedgerEntries(
    accountCode?: string,
    startDate?: string,
    endDate?: string,
  ): LedgerEntry[] {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      let entries: LedgerEntry[] = JSON.parse(data);

      // Filtrar por conta se especificado
      if (accountCode) {
        entries = entries.filter((entry) => entry.accountCode === accountCode);
      }

      // Filtrar por período se especificado
      if (startDate) {
        entries = entries.filter((entry) => entry.date >= startDate);
      }
      if (endDate) {
        entries = entries.filter((entry) => entry.date <= endDate);
      }

      return entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    } catch (error) {
      logComponents.error("Erro ao carregar lançamentos do razão:", error);
      return [];
    }
  }

  // Calcular saldo de uma conta
  getAccountBalance(accountCode: string, date?: string): AccountBalance {
    const account = this.getAccountByCode(accountCode);
    if (!account) {
      throw new Error(`Conta não encontrada: ${accountCode}`);
    }

    const entries = this.getLedgerEntries(accountCode, undefined, date);

    const debitTotal = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const creditTotal = entries.reduce((sum, entry) => sum + entry.credit, 0);

    let balance: number;
    if (account.normalBalance === "DEBIT") {
      balance = debitTotal - creditTotal;
    } else {
      balance = creditTotal - debitTotal;
    }

    const lastEntry = entries[entries.length - 1];

    return {
      accountCode,
      accountName: account.name,
      accountType: account.type,
      debitTotal,
      creditTotal,
      balance,
      normalBalance: account.normalBalance,
      lastMovement: lastEntry?.date,
    };
  }

  // Gerar balancete
  generateTrialBalance(startDate?: string, endDate?: string): TrialBalance {
    const accounts = this.chartOfAccounts.filter((acc) => acc.acceptsEntries);
    const balances: AccountBalance[] = [];

    let totalDebits = 0;
    let totalCredits = 0;

    for (const account of accounts) {
      const balance = this.getAccountBalance(account.code, endDate);
      balances.push(balance);

      totalDebits += balance.debitTotal;
      totalCredits += balance.creditTotal;
    }

    const difference = Math.abs(totalDebits - totalCredits);

    return {
      period: {
        start: startDate || this.getFirstEntryDate(),
        end: endDate || new Date().toISOString().split("T")[0],
      },
      accounts: balances,
      totals: {
        totalDebits,
        totalCredits,
        difference,
      },
      isBalanced: difference < 0.01,
      generatedAt: this.getTimestamp(),
    };
  }

  // Obter conta por código
  getAccountByCode(code: string): ChartAccount | undefined {
    return this.chartOfAccounts.find((acc) => acc.code === code);
  }

  // Obter plano de contas
  getChartOfAccounts(): ChartAccount[] {
    return this.chartOfAccounts;
  }

  // Adicionar nova conta
  addAccount(account: Omit<ChartAccount, "code">): ChartAccount {
    const code = this.generateAccountCode(account.parentCode, account.level);
    const newAccount: ChartAccount = {
      ...account,
      code,
    };

    this.chartOfAccounts.push(newAccount);
    this.saveChartOfAccounts();

    return newAccount;
  }

  // Gerar código de conta
  private generateAccountCode(parentCode?: string, level?: number): string {
    if (!parentCode) {
      // Conta de nível 1
      const maxCode = Math.max(
        ...this.chartOfAccounts
          .filter((acc) => acc.level === 1)
          .map((acc) => parseInt(acc.code)),
      );
      return (maxCode + 1).toString();
    }

    // Conta filha
    const siblings = this.chartOfAccounts.filter(
      (acc) => acc.parentCode === parentCode,
    );
    const maxSuffix = Math.max(
      0,
      ...siblings.map((acc) => {
        const parts = acc.code.split(".");
        return parseInt(parts[parts.length - 1]) || 0;
      }),
    );

    return `${parentCode}.${String(maxSuffix + 1).padStart(2, "0")}`;
  }

  // Migrar dados existentes
  async migrateExistingData(): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
  }> {
    try {
      const transactions = transactions;
      const errors: string[] = [];
      let migrated = 0;

      for (const transaction of transactions) {
        try {
          const result = await this.createDoubleEntry(transaction);
          if (result.success) {
            migrated++;
          } else {
            errors.push(`Transação ${transaction.id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(
            `Transação ${transaction.id}: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          );
        }
      }

      return { success: true, migrated, errors };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        errors: [error instanceof Error ? error.message : "Erro na migração"],
      };
    }
  }

  // Validar integridade do sistema
  validateSystemIntegrity(): {
    isValid: boolean;
    issues: string[];
    summary: {
      totalEntries: number;
      totalDebits: number;
      totalCredits: number;
      difference: number;
      accountsWithIssues: string[];
    };
  } {
    const entries = this.getLedgerEntries();
    const issues: string[] = [];
    const accountsWithIssues: string[] = [];

    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    // Verificar balanceamento geral
    if (difference > 0.01) {
      issues.push(
        `Sistema desbalanceado: diferença de ${difference.toFixed(2)}`,
      );
    }

    // Verificar integridade por lote
    const batches = new Set(entries.map((e) => e.batchId));
    for (const batchId of batches) {
      const batchEntries = entries.filter((e) => e.batchId === batchId);
      const batchDebits = batchEntries.reduce((sum, e) => sum + e.debit, 0);
      const batchCredits = batchEntries.reduce((sum, e) => sum + e.credit, 0);

      if (Math.abs(batchDebits - batchCredits) > 0.01) {
        issues.push(`Lote ${batchId} desbalanceado`);
      }
    }

    // Verificar contas órfãs
    const usedAccounts = new Set(entries.map((e) => e.accountCode));
    for (const accountCode of usedAccounts) {
      const account = this.getAccountByCode(accountCode);
      if (!account) {
        issues.push(`Conta órfã encontrada: ${accountCode}`);
        accountsWithIssues.push(accountCode);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      summary: {
        totalEntries: entries.length,
        totalDebits,
        totalCredits,
        difference,
        accountsWithIssues,
      },
    };
  }

  // Utilitários
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private getFirstEntryDate(): string {
    const entries = this.getLedgerEntries();
    if (entries.length === 0) return new Date().toISOString().split("T")[0];

    return entries.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )[0].date;
  }

  private saveChartOfAccounts(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(
        this.CHART_KEY,
        JSON.stringify(this.chartOfAccounts),
      );
    }
  }

  private loadChartOfAccounts(): ChartAccount[] | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    try {
      const data = localStorage.getItem(this.CHART_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logComponents.error("Erro ao carregar plano de contas:", error);
      return null;
    }
  }
}

export const centralizedLedger = new CentralizedLedger();
