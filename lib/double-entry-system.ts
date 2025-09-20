"use client";

import { storage, type Transaction } from "./storage";
import { logComponents } from "../logger";
import {
  centralizedLedger,
  type LedgerEntry,
  type ChartAccount,
} from "./centralized-ledger";
import { auditLogger } from "./audit";
import { authService } from "./auth";

// Interface para entrada de partida dobrada
export interface DoubleEntry {
  id: string;
  transactionId: string;
  description: string;
  date: string;
  reference?: string;
  entries: DoubleEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: "DRAFT" | "CONFIRMED" | "POSTED" | "REVERSED";
  createdAt: string;
  createdBy: string;
  postedAt?: string;
  postedBy?: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
}

// Interface para linha de lançamento
export interface DoubleEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  reference?: string;
  costCenter?: string;
  project?: string;
}

// Interface para validação de partidas dobradas
export interface DoubleEntryValidation {
  isValid: boolean;
  isBalanced: boolean;
  errors: string[];
  warnings: string[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
  accountValidations: AccountValidation[];
}

// Interface para validação de conta
export interface AccountValidation {
  accountCode: string;
  accountName: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
}

// Interface para relatório de balanceamento
export interface BalanceReport {
  period: string;
  totalEntries: number;
  balancedEntries: number;
  unbalancedEntries: number;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  accountBalances: AccountBalance[];
  issues: BalanceIssue[];
}

// Interface para saldo de conta
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  debitTotal: number;
  creditTotal: number;
  balance: number;
  normalBalance: "DEBIT" | "CREDIT";
  isNormalBalance: boolean;
}

// Interface para problemas de balanceamento
export interface BalanceIssue {
  type:
    | "UNBALANCED_ENTRY"
    | "INVALID_ACCOUNT"
    | "NEGATIVE_BALANCE"
    | "MISSING_ENTRY"
    | "DUPLICATE_ENTRY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  entryId?: string;
  accountCode?: string;
  amount?: number;
  suggestion?: string;
}

// Interface para configurações do sistema
export interface DoubleEntryConfig {
  enforceBalance: boolean; // Força balanceamento obrigatório
  allowZeroEntries: boolean; // Permite lançamentos com valor zero
  requireDescription: boolean; // Exige descrição em todos os lançamentos
  maxDecimalPlaces: number; // Máximo de casas decimais
  autoRounding: boolean; // Arredondamento automático
  strictAccountValidation: boolean; // Validação rigorosa de contas
  auditLevel: "minimal" | "standard" | "detailed";
}

class DoubleEntrySystem {
  private entries: Map<string, DoubleEntry> = new Map();
  private readonly ENTRIES_KEY = "sua-grana-double-entries";
  private config: DoubleEntryConfig = {
    enforceBalance: true,
    allowZeroEntries: false,
    requireDescription: true,
    maxDecimalPlaces: 2,
    autoRounding: true,
    strictAccountValidation: true,
    auditLevel: "standard",
  };

  constructor() {
    this.loadEntries();
  }

  // Configurar sistema
  configure(config: Partial<DoubleEntryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Criar partida dobrada a partir de transação
  async createDoubleEntryFromTransaction(
    transaction: Transaction,
    customMapping?: { debitAccount: string; creditAccount: string },
  ): Promise<{
    success: boolean;
    entry?: DoubleEntry;
    validation?: DoubleEntryValidation;
    error?: string;
  }> {
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Determinar contas de débito e crédito
      const mapping = customMapping || this.getAccountMapping(transaction);

      if (!mapping) {
        return {
          success: false,
          error: `Não foi possível determinar mapeamento de contas para transação tipo ${transaction.type}, categoria ${transaction.category}`,
        };
      }

      // Buscar informações das contas
      const chartOfAccounts = centralizedLedger.getChartOfAccounts();
      const debitAccount = chartOfAccounts.find(
        (acc) => acc.code === mapping.debitAccount,
      );
      const creditAccount = chartOfAccounts.find(
        (acc) => acc.code === mapping.creditAccount,
      );

      if (!debitAccount || !creditAccount) {
        return {
          success: false,
          error: `Conta não encontrada no plano de contas: ${!debitAccount ? mapping.debitAccount : mapping.creditAccount}`,
        };
      }

      // Arredondar valor se necessário
      const amount = this.config.autoRounding
        ? this.roundAmount(transaction.amount)
        : transaction.amount;

      // Criar linhas de lançamento
      const entries: DoubleEntryLine[] = [
        {
          id: this.generateId(),
          accountCode: mapping.debitAccount,
          accountName: debitAccount.name,
          debit: amount,
          credit: 0,
          description: transaction.description,
          reference: transaction.id,
        },
        {
          id: this.generateId(),
          accountCode: mapping.creditAccount,
          accountName: creditAccount.name,
          debit: 0,
          credit: amount,
          description: transaction.description,
          reference: transaction.id,
        },
      ];

      // Criar partida dobrada
      const doubleEntry: DoubleEntry = {
        id: this.generateId(),
        transactionId: transaction.id,
        description: transaction.description,
        date: transaction.date,
        reference: transaction.id,
        entries,
        totalDebit: amount,
        totalCredit: amount,
        isBalanced: true,
        status: "DRAFT",
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      // Validar partida dobrada
      const validation = this.validateDoubleEntry(doubleEntry);

      if (!validation.isValid && this.config.enforceBalance) {
        return {
          success: false,
          validation,
          error: `Partida dobrada inválida: ${validation.errors.join("; ")}`,
        };
      }

      // Salvar partida dobrada
      this.entries.set(doubleEntry.id, doubleEntry);
      await this.saveEntries();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "DOUBLE_ENTRY_CREATED",
          userId,
          details: {
            entryId: doubleEntry.id,
            transactionId: transaction.id,
            debitAccount: mapping.debitAccount,
            creditAccount: mapping.creditAccount,
            amount,
            isBalanced: validation.isBalanced,
          },
          severity: validation.isValid ? "low" : "medium",
        });
      }

      return {
        success: true,
        entry: doubleEntry,
        validation,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar partida dobrada",
      };
    }
  }

  // Criar partida dobrada manual
  async createManualDoubleEntry(
    description: string,
    date: string,
    entries: Omit<DoubleEntryLine, "id">[],
    reference?: string,
  ): Promise<{
    success: boolean;
    entry?: DoubleEntry;
    validation?: DoubleEntryValidation;
    error?: string;
  }> {
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Validar entradas básicas
      if (entries.length < 2) {
        return {
          success: false,
          error: "Partida dobrada deve ter pelo menos 2 lançamentos",
        };
      }

      // Criar linhas com IDs
      const entryLines: DoubleEntryLine[] = entries.map((entry) => ({
        ...entry,
        id: this.generateId(),
        debit: this.config.autoRounding
          ? this.roundAmount(entry.debit)
          : entry.debit,
        credit: this.config.autoRounding
          ? this.roundAmount(entry.credit)
          : entry.credit,
      }));

      // Calcular totais
      const totalDebit = entryLines.reduce(
        (sum, entry) => sum + entry.debit,
        0,
      );
      const totalCredit = entryLines.reduce(
        (sum, entry) => sum + entry.credit,
        0,
      );
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01; // Tolerância de 1 centavo

      // Criar partida dobrada
      const doubleEntry: DoubleEntry = {
        id: this.generateId(),
        transactionId: reference || this.generateId(),
        description,
        date,
        reference,
        entries: entryLines,
        totalDebit: this.config.autoRounding
          ? this.roundAmount(totalDebit)
          : totalDebit,
        totalCredit: this.config.autoRounding
          ? this.roundAmount(totalCredit)
          : totalCredit,
        isBalanced,
        status: "DRAFT",
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      // Validar partida dobrada
      const validation = this.validateDoubleEntry(doubleEntry);

      if (!validation.isValid && this.config.enforceBalance) {
        return {
          success: false,
          validation,
          error: `Partida dobrada inválida: ${validation.errors.join("; ")}`,
        };
      }

      // Salvar partida dobrada
      this.entries.set(doubleEntry.id, doubleEntry);
      await this.saveEntries();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "MANUAL_DOUBLE_ENTRY_CREATED",
          userId,
          details: {
            entryId: doubleEntry.id,
            description,
            totalDebit,
            totalCredit,
            isBalanced: validation.isBalanced,
            entriesCount: entryLines.length,
          },
          severity: validation.isValid ? "low" : "medium",
        });
      }

      return {
        success: true,
        entry: doubleEntry,
        validation,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar partida dobrada manual",
      };
    }
  }

  // Confirmar partida dobrada
  async confirmDoubleEntry(entryId: string): Promise<{
    success: boolean;
    entry?: DoubleEntry;
    error?: string;
  }> {
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      const entry = this.entries.get(entryId);
      if (!entry) {
        return {
          success: false,
          error: `Partida dobrada não encontrada: ${entryId}`,
        };
      }

      if (entry.status !== "DRAFT") {
        return {
          success: false,
          error: `Partida dobrada não pode ser confirmada. Status atual: ${entry.status}`,
        };
      }

      // Validar novamente antes de confirmar
      const validation = this.validateDoubleEntry(entry);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Partida dobrada inválida: ${validation.errors.join("; ")}`,
        };
      }

      // Atualizar status
      entry.status = "CONFIRMED";
      entry.postedAt = this.getTimestamp();
      entry.postedBy = userId;

      // Salvar alterações
      this.entries.set(entryId, entry);
      await this.saveEntries();

      // Criar lançamentos no razão centralizado
      for (const line of entry.entries) {
        await centralizedLedger.addLedgerEntry({
          id: this.generateId(),
          transactionId: entry.transactionId,
          accountCode: line.accountCode,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          date: entry.date,
          reference: entry.reference,
          status: "CONFIRMED",
          createdAt: this.getTimestamp(),
          createdBy: userId,
        });
      }

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "DOUBLE_ENTRY_CONFIRMED",
          userId,
          details: {
            entryId,
            transactionId: entry.transactionId,
            totalDebit: entry.totalDebit,
            totalCredit: entry.totalCredit,
          },
          severity: "medium",
        });
      }

      return {
        success: true,
        entry,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao confirmar partida dobrada",
      };
    }
  }

  // Estornar partida dobrada
  async reverseDoubleEntry(
    entryId: string,
    reason: string,
  ): Promise<{
    success: boolean;
    originalEntry?: DoubleEntry;
    reversalEntry?: DoubleEntry;
    error?: string;
  }> {
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      const originalEntry = this.entries.get(entryId);
      if (!originalEntry) {
        return {
          success: false,
          error: `Partida dobrada não encontrada: ${entryId}`,
        };
      }

      if (
        originalEntry.status !== "CONFIRMED" &&
        originalEntry.status !== "POSTED"
      ) {
        return {
          success: false,
          error: `Partida dobrada não pode ser estornada. Status atual: ${originalEntry.status}`,
        };
      }

      // Criar lançamentos de estorno (inverter débito/crédito)
      const reversalEntries: DoubleEntryLine[] = originalEntry.entries.map(
        (line) => ({
          id: this.generateId(),
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.credit, // Inverter
          credit: line.debit, // Inverter
          description: `ESTORNO: ${line.description}`,
          reference: originalEntry.reference,
          costCenter: line.costCenter,
          project: line.project,
        }),
      );

      // Criar partida dobrada de estorno
      const reversalEntry: DoubleEntry = {
        id: this.generateId(),
        transactionId: originalEntry.transactionId,
        description: `ESTORNO: ${originalEntry.description}`,
        date: this.getTimestamp().split("T")[0], // Data atual
        reference: originalEntry.id, // Referência ao lançamento original
        entries: reversalEntries,
        totalDebit: originalEntry.totalCredit, // Inverter
        totalCredit: originalEntry.totalDebit, // Inverter
        isBalanced: originalEntry.isBalanced,
        status: "CONFIRMED", // Estorno já confirmado
        createdAt: this.getTimestamp(),
        createdBy: userId,
        postedAt: this.getTimestamp(),
        postedBy: userId,
      };

      // Marcar entrada original como estornada
      originalEntry.status = "REVERSED";
      originalEntry.reversedAt = this.getTimestamp();
      originalEntry.reversedBy = userId;
      originalEntry.reversalReason = reason;

      // Salvar alterações
      this.entries.set(entryId, originalEntry);
      this.entries.set(reversalEntry.id, reversalEntry);
      await this.saveEntries();

      // Criar lançamentos de estorno no razão centralizado
      for (const line of reversalEntry.entries) {
        await centralizedLedger.addLedgerEntry({
          id: this.generateId(),
          transactionId: reversalEntry.transactionId,
          accountCode: line.accountCode,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          date: reversalEntry.date,
          reference: reversalEntry.reference,
          status: "CONFIRMED",
          createdAt: this.getTimestamp(),
          createdBy: userId,
        });
      }

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "DOUBLE_ENTRY_REVERSED",
          userId,
          details: {
            originalEntryId: entryId,
            reversalEntryId: reversalEntry.id,
            reason,
            amount: originalEntry.totalDebit,
          },
          severity: "high",
        });
      }

      return {
        success: true,
        originalEntry,
        reversalEntry,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao estornar partida dobrada",
      };
    }
  }

  // Validar partida dobrada
  validateDoubleEntry(entry: DoubleEntry): DoubleEntryValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const accountValidations: AccountValidation[] = [];

    // Validações básicas
    if (!entry.description || entry.description.trim().length === 0) {
      if (this.config.requireDescription) {
        errors.push("Descrição é obrigatória");
      } else {
        warnings.push("Descrição não informada");
      }
    }

    if (!entry.date) {
      errors.push("Data é obrigatória");
    }

    if (entry.entries.length < 2) {
      errors.push("Partida dobrada deve ter pelo menos 2 lançamentos");
    }

    // Validar cada linha
    const chartOfAccounts = centralizedLedger.getChartOfAccounts();
    const accountTotals = new Map<string, { debit: number; credit: number }>();

    for (const line of entry.entries) {
      const account = chartOfAccounts.find(
        (acc) => acc.code === line.accountCode,
      );
      const lineErrors: string[] = [];
      const lineWarnings: string[] = [];

      // Validar conta
      if (!account) {
        if (this.config.strictAccountValidation) {
          lineErrors.push(
            `Conta não encontrada no plano de contas: ${line.accountCode}`,
          );
        } else {
          lineWarnings.push(
            `Conta não encontrada no plano de contas: ${line.accountCode}`,
          );
        }
      }

      // Validar valores
      if (line.debit < 0 || line.credit < 0) {
        lineErrors.push("Valores de débito e crédito não podem ser negativos");
      }

      if (line.debit > 0 && line.credit > 0) {
        lineErrors.push(
          "Uma linha não pode ter débito e crédito simultaneamente",
        );
      }

      if (line.debit === 0 && line.credit === 0) {
        if (!this.config.allowZeroEntries) {
          lineErrors.push("Lançamentos com valor zero não são permitidos");
        } else {
          lineWarnings.push("Lançamento com valor zero");
        }
      }

      // Validar casas decimais
      if (
        this.getDecimalPlaces(line.debit) > this.config.maxDecimalPlaces ||
        this.getDecimalPlaces(line.credit) > this.config.maxDecimalPlaces
      ) {
        if (this.config.autoRounding) {
          lineWarnings.push(
            `Valor arredondado para ${this.config.maxDecimalPlaces} casas decimais`,
          );
        } else {
          lineErrors.push(
            `Máximo de ${this.config.maxDecimalPlaces} casas decimais permitidas`,
          );
        }
      }

      // Acumular totais por conta
      const accountCode = line.accountCode;
      const current = accountTotals.get(accountCode) || { debit: 0, credit: 0 };
      accountTotals.set(accountCode, {
        debit: current.debit + line.debit,
        credit: current.credit + line.credit,
      });

      // Criar validação da conta
      accountValidations.push({
        accountCode: line.accountCode,
        accountName: line.accountName,
        isValid: lineErrors.length === 0,
        errors: lineErrors,
        warnings: lineWarnings,
        debitAmount: line.debit,
        creditAmount: line.credit,
        netAmount: line.debit - line.credit,
      });

      errors.push(...lineErrors);
      warnings.push(...lineWarnings);
    }

    // Calcular totais
    const totalDebit = this.roundAmount(
      entry.entries.reduce((sum, line) => sum + line.debit, 0),
    );
    const totalCredit = this.roundAmount(
      entry.entries.reduce((sum, line) => sum + line.credit, 0),
    );
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Tolerância de 1 centavo

    // Validar balanceamento
    if (!isBalanced) {
      errors.push(
        `Partida dobrada desbalanceada. Diferença: ${difference.toFixed(2)}`,
      );
    }

    // Atualizar totais na entrada
    entry.totalDebit = totalDebit;
    entry.totalCredit = totalCredit;
    entry.isBalanced = isBalanced;

    return {
      isValid: errors.length === 0,
      isBalanced,
      errors,
      warnings,
      totalDebit,
      totalCredit,
      difference,
      accountValidations,
    };
  }

  // Gerar relatório de balanceamento
  generateBalanceReport(startDate?: string, endDate?: string): BalanceReport {
    const entries = this.getDoubleEntries();
    const filteredEntries = entries.filter((entry) => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });

    const balancedEntries = filteredEntries.filter((entry) => entry.isBalanced);
    const unbalancedEntries = filteredEntries.filter(
      (entry) => !entry.isBalanced,
    );

    const totalDebit = filteredEntries.reduce(
      (sum, entry) => sum + entry.totalDebit,
      0,
    );
    const totalCredit = filteredEntries.reduce(
      (sum, entry) => sum + entry.totalCredit,
      0,
    );

    // Calcular saldos por conta
    const accountBalances = this.calculateAccountBalances(filteredEntries);

    // Identificar problemas
    const issues: BalanceIssue[] = [];

    // Lançamentos desbalanceados
    for (const entry of unbalancedEntries) {
      issues.push({
        type: "UNBALANCED_ENTRY",
        severity: "HIGH",
        description: `Lançamento desbalanceado: ${entry.description}`,
        entryId: entry.id,
        amount: Math.abs(entry.totalDebit - entry.totalCredit),
        suggestion: "Revisar e corrigir os valores de débito e crédito",
      });
    }

    // Contas com saldo anormal
    for (const balance of accountBalances) {
      if (!balance.isNormalBalance && Math.abs(balance.balance) > 0.01) {
        issues.push({
          type: "NEGATIVE_BALANCE",
          severity: "MEDIUM",
          description: `Conta ${balance.accountName} com saldo anormal`,
          accountCode: balance.accountCode,
          amount: balance.balance,
          suggestion: "Verificar se os lançamentos estão corretos",
        });
      }
    }

    return {
      period: `${startDate || "início"} a ${endDate || "fim"}`,
      totalEntries: filteredEntries.length,
      balancedEntries: balancedEntries.length,
      unbalancedEntries: unbalancedEntries.length,
      totalDebit,
      totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
      accountBalances,
      issues,
    };
  }

  // Calcular saldos por conta
  private calculateAccountBalances(entries: DoubleEntry[]): AccountBalance[] {
    const chartOfAccounts = centralizedLedger.getChartOfAccounts();
    const balances = new Map<string, { debit: number; credit: number }>();

    // Acumular movimentações por conta
    for (const entry of entries) {
      for (const line of entry.entries) {
        const current = balances.get(line.accountCode) || {
          debit: 0,
          credit: 0,
        };
        balances.set(line.accountCode, {
          debit: current.debit + line.debit,
          credit: current.credit + line.credit,
        });
      }
    }

    // Converter para AccountBalance
    const accountBalances: AccountBalance[] = [];

    for (const [accountCode, totals] of balances) {
      const account = chartOfAccounts.find((acc) => acc.code === accountCode);
      if (!account) continue;

      const balance = totals.debit - totals.credit;
      const normalBalance = this.getAccountNormalBalance(account.type);
      const isNormalBalance =
        (normalBalance === "DEBIT" && balance >= 0) ||
        (normalBalance === "CREDIT" && balance <= 0);

      accountBalances.push({
        accountCode,
        accountName: account.name,
        accountType: account.type,
        debitTotal: totals.debit,
        creditTotal: totals.credit,
        balance: Math.abs(balance),
        normalBalance,
        isNormalBalance,
      });
    }

    return accountBalances.sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode),
    );
  }

  // Determinar saldo normal da conta
  private getAccountNormalBalance(accountType: string): "DEBIT" | "CREDIT" {
    switch (accountType) {
      case "ASSET":
      case "EXPENSE":
        return "DEBIT";
      case "LIABILITY":
      case "EQUITY":
      case "REVENUE":
        return "CREDIT";
      default:
        return "DEBIT";
    }
  }

  // Obter mapeamento de contas para transação
  private getAccountMapping(
    transaction: Transaction,
  ): { debitAccount: string; creditAccount: string } | null {
    const chartOfAccounts = centralizedLedger.getChartOfAccounts();

    // Mapeamentos baseados no tipo de transação
    switch (transaction.type) {
      case "income":
        // Receita: Débito em Caixa/Banco, Crédito em Receita
        return {
          debitAccount:
            this.findAccountByName(chartOfAccounts, transaction.account) ||
            "1.1.01", // Caixa
          creditAccount:
            this.findAccountByCategory(
              chartOfAccounts,
              transaction.category,
              "REVENUE",
            ) || "4.1.01", // Receitas
        };

      case "expense":
        // Despesa: Débito em Despesa, Crédito em Caixa/Banco
        return {
          debitAccount:
            this.findAccountByCategory(
              chartOfAccounts,
              transaction.category,
              "EXPENSE",
            ) || "5.1.01", // Despesas
          creditAccount:
            this.findAccountByName(chartOfAccounts, transaction.account) ||
            "1.1.01", // Caixa
        };

      case "transfer":
        // Transferência será tratada pelo motor de transações
        return null;

      default:
        return null;
    }
  }

  // Encontrar conta por nome
  private findAccountByName(
    chartOfAccounts: ChartAccount[],
    accountName: string,
  ): string | null {
    const account = chartOfAccounts.find((acc) =>
      acc.name.toLowerCase().includes(accountName.toLowerCase()),
    );
    return account?.code || null;
  }

  // Encontrar conta por categoria
  private findAccountByCategory(
    chartOfAccounts: ChartAccount[],
    category: string,
    type: string,
  ): string | null {
    const account = chartOfAccounts.find(
      (acc) =>
        acc.type === type &&
        acc.name.toLowerCase().includes(category.toLowerCase()),
    );
    return account?.code || null;
  }

  // Obter partidas dobradas
  getDoubleEntries(status?: DoubleEntry["status"]): DoubleEntry[] {
    const entries = Array.from(this.entries.values());

    if (status) {
      return entries.filter((entry) => entry.status === status);
    }

    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // Obter partida dobrada por ID
  getDoubleEntry(entryId: string): DoubleEntry | undefined {
    return this.entries.get(entryId);
  }

  // Obter partidas dobradas por transação
  getDoubleEntriesByTransaction(transactionId: string): DoubleEntry[] {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.transactionId === transactionId,
    );
  }

  // Validar integridade do sistema
  validateSystemIntegrity(): {
    isValid: boolean;
    issues: string[];
    summary: {
      totalEntries: number;
      balancedEntries: number;
      unbalancedEntries: number;
      confirmedEntries: number;
      draftEntries: number;
    };
  } {
    const entries = this.getDoubleEntries();
    const issues: string[] = [];

    const balanced = entries.filter((entry) => entry.isBalanced).length;
    const unbalanced = entries.filter((entry) => !entry.isBalanced).length;
    const confirmed = entries.filter(
      (entry) => entry.status === "CONFIRMED" || entry.status === "POSTED",
    ).length;
    const draft = entries.filter((entry) => entry.status === "DRAFT").length;

    // Verificar lançamentos desbalanceados
    if (unbalanced > 0) {
      issues.push(`${unbalanced} lançamentos desbalanceados encontrados`);
    }

    // Verificar lançamentos órfãos (sem transação correspondente)
    const transactions = transactions;
    for (const entry of entries) {
      const transaction = transactions.find(
        (t) => t.id === entry.transactionId,
      );
      if (!transaction && entry.status !== "REVERSED") {
        issues.push(`Lançamento órfão encontrado: ${entry.id}`);
      }
    }

    // Verificar transações sem lançamentos
    for (const transaction of transactions) {
      const hasEntries = entries.some(
        (entry) => entry.transactionId === transaction.id,
      );
      if (!hasEntries) {
        issues.push(`Transação sem lançamentos contábeis: ${transaction.id}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      summary: {
        totalEntries: entries.length,
        balancedEntries: balanced,
        unbalancedEntries: unbalanced,
        confirmedEntries: confirmed,
        draftEntries: draft,
      },
    };
  }

  // Utilitários
  private roundAmount(amount: number): number {
    return (
      Math.round(amount * Math.pow(10, this.config.maxDecimalPlaces)) /
      Math.pow(10, this.config.maxDecimalPlaces)
    );
  }

  private getDecimalPlaces(num: number): number {
    const str = num.toString();
    if (str.indexOf(".") !== -1) {
      return str.split(".")[1].length;
    }
    return 0;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private async saveEntries(): Promise<void> {
    try {
      const entriesArray = Array.from(this.entries.values());
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(this.ENTRIES_KEY, JSON.stringify(entriesArray));
      }

      // Disparar evento de mudança
      if (typeof window !== "undefined") {
        const event = new CustomEvent("storageChange", {
          detail: {
            key: this.ENTRIES_KEY,
            action: "save",
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      logComponents.error("Erro ao salvar partidas dobradas:", error);
    }
  }

  private loadEntries(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    try {
      const data = localStorage.getItem(this.ENTRIES_KEY);
      if (data) {
        const entriesArray: DoubleEntry[] = JSON.parse(data);
        this.entries.clear();

        for (const entry of entriesArray) {
          this.entries.set(entry.id, entry);
        }
      }
    } catch (error) {
      logComponents.error("Erro ao carregar partidas dobradas:", error);
      this.entries.clear();
    }
  }
}

export const doubleEntrySystem = new DoubleEntrySystem();
