"use client";

import { storage, type Transaction, type Account } from "./storage";
import { logComponents } from "../logger";
import {
  centralizedLedger,
  type LedgerEntry,
  type ValidationResult,
} from "./centralized-ledger";
import { auditLogger } from "./audit";
import { authService } from "./auth";

// Interface para operação de transação
export interface TransactionOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE" | "TRANSFER";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  transaction: Transaction;
  originalTransaction?: Transaction; // Para updates e deletes
  ledgerEntries?: LedgerEntry[];
  validationResult?: ValidationResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

// Interface para transferência entre contas
export interface TransferOperation {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
}

// Interface para resultado de operação
export interface OperationResult {
  success: boolean;
  operation?: TransactionOperation;
  transaction?: Transaction;
  ledgerEntries?: LedgerEntry[];
  validation?: ValidationResult;
  error?: string;
  warnings?: string[];
}

// Interface para configurações do motor
export interface EngineConfig {
  autoValidation: boolean;
  strictMode: boolean; // Modo rigoroso impede operações que quebrem integridade
  allowNegativeBalances: boolean;
  maxRetries: number;
  auditLevel: "minimal" | "standard" | "detailed";
}

class TransactionEngine {
  private operations: Map<string, TransactionOperation> = new Map();
  private readonly OPERATIONS_KEY = "sua-grana-transaction-operations";
  private config: EngineConfig = {
    autoValidation: true,
    strictMode: true,
    allowNegativeBalances: false,
    maxRetries: 3,
    auditLevel: "standard",
  };

  constructor() {
    this.loadOperations();
  }

  // Configurar motor
  configure(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Criar nova transação com validação completa
  async createTransaction(
    transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    customMapping?: { debitAccount: string; creditAccount: string },
  ): Promise<OperationResult> {
    const operationId = this.generateId();
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Criar transação temporária
      const transaction: Transaction = {
        ...transactionData,
        id: this.generateId(),
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      };

      // Criar operação
      const operation: TransactionOperation = {
        id: operationId,
        type: "CREATE",
        status: "PENDING",
        transaction,
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      this.operations.set(operationId, operation);
      await this.saveOperations();

      // Validações pré-execução
      const preValidation = await this.validateTransaction(transaction);
      if (!preValidation.success) {
        operation.status = "FAILED";
        operation.error = preValidation.error;
        await this.saveOperations();
        return preValidation;
      }

      // Atualizar status
      operation.status = "PROCESSING";
      await this.saveOperations();

      // Verificar saldos se necessário
      if (
        !this.config.allowNegativeBalances &&
        transaction.type === "expense"
      ) {
        const balanceCheck = await this.checkAccountBalance(
          transaction.account,
          transaction.amount,
        );
        if (!balanceCheck.sufficient) {
          operation.status = "FAILED";
          operation.error = `Saldo insuficiente na conta ${transaction.account}. Saldo: ${balanceCheck.currentBalance}, Necessário: ${transaction.amount}`;
          await this.saveOperations();
          return {
            success: false,
            operation,
            error: operation.error,
          };
        }
      }

      // Criar lançamentos contábeis
      const ledgerResult = await centralizedLedger.createDoubleEntry(
        transaction,
        customMapping,
      );
      if (!ledgerResult.success) {
        operation.status = "FAILED";
        operation.error = ledgerResult.error;
        await this.saveOperations();
        return {
          success: false,
          operation,
          error: ledgerResult.error,
        };
      }

      // Salvar transação no storage
      const savedTransaction = storage.saveTransaction(transactionData);

      // Atualizar saldos das contas
      await this.updateAccountBalances(transaction);

      // Finalizar operação
      operation.status = "COMPLETED";
      operation.completedAt = this.getTimestamp();
      operation.ledgerEntries = ledgerResult.entries;
      operation.validationResult = ledgerResult.validation;
      operation.transaction = savedTransaction;
      await this.saveOperations();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "TRANSACTION_CREATED",
          userId,
          details: {
            operationId,
            transactionId: savedTransaction.id,
            amount: transaction.amount,
            type: transaction.type,
            account: transaction.account,
            category: transaction.category,
          },
          severity: "low",
        });
      }

      return {
        success: true,
        operation,
        transaction: savedTransaction,
        ledgerEntries: ledgerResult.entries,
        validation: ledgerResult.validation,
      };
    } catch (error) {
      // Rollback em caso de erro
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = "FAILED";
        operation.error =
          error instanceof Error ? error.message : "Erro desconhecido";
        await this.saveOperations();
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao criar transação",
      };
    }
  }

  // Atualizar transação existente
  async updateTransaction(
    transactionId: string,
    updates: Partial<Transaction>,
  ): Promise<OperationResult> {
    const operationId = this.generateId();
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Buscar transação original
      const originalTransaction = storage
        .getTransactions()
        .find((t) => t.id === transactionId);
      if (!originalTransaction) {
        return {
          success: false,
          error: `Transação não encontrada: ${transactionId}`,
        };
      }

      // Criar transação atualizada
      const updatedTransaction: Transaction = {
        ...originalTransaction,
        ...updates,
        updatedAt: this.getTimestamp(),
      };

      // Criar operação
      const operation: TransactionOperation = {
        id: operationId,
        type: "UPDATE",
        status: "PENDING",
        transaction: updatedTransaction,
        originalTransaction,
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      this.operations.set(operationId, operation);
      await this.saveOperations();

      // Validações
      const validation = await this.validateTransaction(updatedTransaction);
      if (!validation.success) {
        operation.status = "FAILED";
        operation.error = validation.error;
        await this.saveOperations();
        return validation;
      }

      operation.status = "PROCESSING";
      await this.saveOperations();

      // Reverter lançamentos antigos
      await this.reverseLedgerEntries(originalTransaction);

      // Criar novos lançamentos
      const ledgerResult =
        await centralizedLedger.createDoubleEntry(updatedTransaction);
      if (!ledgerResult.success) {
        // Tentar restaurar lançamentos originais
        await centralizedLedger.createDoubleEntry(originalTransaction);

        operation.status = "FAILED";
        operation.error = ledgerResult.error;
        await this.saveOperations();
        return {
          success: false,
          operation,
          error: ledgerResult.error,
        };
      }

      // Atualizar no storage
      await updateTransaction(transactionId, updates);

      // Atualizar saldos
      await this.updateAccountBalances(updatedTransaction, originalTransaction);

      // Finalizar operação
      operation.status = "COMPLETED";
      operation.completedAt = this.getTimestamp();
      operation.ledgerEntries = ledgerResult.entries;
      operation.validationResult = ledgerResult.validation;
      await this.saveOperations();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "TRANSACTION_UPDATED",
          userId,
          details: {
            operationId,
            transactionId,
            changes: updates,
            originalAmount: originalTransaction.amount,
            newAmount: updatedTransaction.amount,
          },
          severity: "medium",
        });
      }

      return {
        success: true,
        operation,
        transaction: updatedTransaction,
        ledgerEntries: ledgerResult.entries,
        validation: ledgerResult.validation,
      };
    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = "FAILED";
        operation.error =
          error instanceof Error ? error.message : "Erro desconhecido";
        await this.saveOperations();
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar transação",
      };
    }
  }

  // Deletar transação
  async deleteTransaction(transactionId: string): Promise<OperationResult> {
    const operationId = this.generateId();
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Buscar transação
      const transaction = storage
        .getTransactions()
        .find((t) => t.id === transactionId);
      if (!transaction) {
        return {
          success: false,
          error: `Transação não encontrada: ${transactionId}`,
        };
      }

      // Criar operação
      const operation: TransactionOperation = {
        id: operationId,
        type: "DELETE",
        status: "PENDING",
        transaction,
        originalTransaction: transaction,
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      this.operations.set(operationId, operation);
      await this.saveOperations();

      operation.status = "PROCESSING";
      await this.saveOperations();

      // Reverter lançamentos contábeis
      await this.reverseLedgerEntries(transaction);

      // Deletar do storage
      await deleteTransaction(transactionId);

      // Atualizar saldos
      await this.updateAccountBalances(undefined, transaction);

      // Finalizar operação
      operation.status = "COMPLETED";
      operation.completedAt = this.getTimestamp();
      await this.saveOperations();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "TRANSACTION_DELETED",
          userId,
          details: {
            operationId,
            transactionId,
            amount: transaction.amount,
            type: transaction.type,
            account: transaction.account,
          },
          severity: "high",
        });
      }

      return {
        success: true,
        operation,
      };
    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = "FAILED";
        operation.error =
          error instanceof Error ? error.message : "Erro desconhecido";
        await this.saveOperations();
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro ao deletar transação",
      };
    }
  }

  // Transferir entre contas
  async transferBetweenAccounts(
    transfer: TransferOperation,
  ): Promise<OperationResult> {
    const operationId = this.generateId();
    const userId = authService.getCurrentUser()?.id || "system";

    try {
      // Validar contas
      const fromAccount = storage
        .getAccounts()
        .find((a) => a.name === transfer.fromAccount);
      const toAccount = storage
        .getAccounts()
        .find((a) => a.name === transfer.toAccount);

      if (!fromAccount || !toAccount) {
        return {
          success: false,
          error: `Conta não encontrada: ${!fromAccount ? transfer.fromAccount : transfer.toAccount}`,
        };
      }

      // Verificar saldo se necessário
      if (!this.config.allowNegativeBalances) {
        const balanceCheck = await this.checkAccountBalance(
          transfer.fromAccount,
          transfer.amount,
        );
        if (!balanceCheck.sufficient) {
          return {
            success: false,
            error: `Saldo insuficiente na conta ${transfer.fromAccount}`,
          };
        }
      }

      // Criar transação de transferência
      const transferTransaction: Transaction = {
        id: this.generateId(),
        description: transfer.description,
        amount: transfer.amount,
        type: "expense", // Será tratado como transferência
        category: "Transferência",
        account: transfer.fromAccount,
        date: transfer.date,
        notes: `Transferência para ${transfer.toAccount}. Ref: ${transfer.reference || ""}`,
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      };

      // Criar operação
      const operation: TransactionOperation = {
        id: operationId,
        type: "TRANSFER",
        status: "PENDING",
        transaction: transferTransaction,
        createdAt: this.getTimestamp(),
        createdBy: userId,
      };

      this.operations.set(operationId, operation);
      await this.saveOperations();

      operation.status = "PROCESSING";
      await this.saveOperations();

      // Criar lançamentos contábeis para transferência
      const fromAccountCode =
        centralizedLedger
          .getChartOfAccounts()
          .find((acc) =>
            acc.name.toLowerCase().includes(transfer.fromAccount.toLowerCase()),
          )?.code || "1.1.02";
      const toAccountCode =
        centralizedLedger
          .getChartOfAccounts()
          .find((acc) =>
            acc.name.toLowerCase().includes(transfer.toAccount.toLowerCase()),
          )?.code || "1.1.02";

      const ledgerResult = await centralizedLedger.createDoubleEntry(
        transferTransaction,
        {
          debitAccount: toAccountCode, // Débito na conta destino (aumenta ativo)
          creditAccount: fromAccountCode, // Crédito na conta origem (diminui ativo)
        },
      );

      if (!ledgerResult.success) {
        operation.status = "FAILED";
        operation.error = ledgerResult.error;
        await this.saveOperations();
        return {
          success: false,
          operation,
          error: ledgerResult.error,
        };
      }

      // Salvar transação
      const savedTransaction = storage.saveTransaction({
        description: transferTransaction.description,
        amount: transferTransaction.amount,
        type: transferTransaction.type,
        category: transferTransaction.category,
        account: transferTransaction.account,
        date: transferTransaction.date,
        notes: transferTransaction.notes,
      });

      // Atualizar saldos das contas
      await this.updateAccountBalanceForTransfer(transfer);

      // Finalizar operação
      operation.status = "COMPLETED";
      operation.completedAt = this.getTimestamp();
      operation.ledgerEntries = ledgerResult.entries;
      operation.validationResult = ledgerResult.validation;
      operation.transaction = savedTransaction;
      await this.saveOperations();

      // Log de auditoria
      if (this.config.auditLevel !== "minimal") {
        await auditLogger.log({
          action: "TRANSFER_COMPLETED",
          userId,
          details: {
            operationId,
            transferId: transfer.id,
            fromAccount: transfer.fromAccount,
            toAccount: transfer.toAccount,
            amount: transfer.amount,
          },
          severity: "medium",
        });
      }

      return {
        success: true,
        operation,
        transaction: savedTransaction,
        ledgerEntries: ledgerResult.entries,
        validation: ledgerResult.validation,
      };
    } catch (error) {
      const operation = this.operations.get(operationId);
      if (operation) {
        operation.status = "FAILED";
        operation.error =
          error instanceof Error ? error.message : "Erro desconhecido";
        await this.saveOperations();
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao realizar transferência",
      };
    }
  }

  // Validar transação
  private async validateTransaction(
    transaction: Transaction,
  ): Promise<OperationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if (
      !transaction.description ||
      transaction.description.trim().length === 0
    ) {
      errors.push("Descrição é obrigatória");
    }

    if (transaction.amount <= 0) {
      errors.push("Valor deve ser maior que zero");
    }

    if (!transaction.account || transaction.account.trim().length === 0) {
      errors.push("Conta é obrigatória");
    }

    if (!transaction.category || transaction.category.trim().length === 0) {
      errors.push("Categoria é obrigatória");
    }

    if (!transaction.date) {
      errors.push("Data é obrigatória");
    } else {
      const transactionDate = new Date(transaction.date);
      const today = new Date();
      const oneYearAgo = new Date(
        today.getFullYear() - 1,
        today.getMonth(),
        today.getDate(),
      );
      const oneYearFromNow = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate(),
      );

      if (transactionDate < oneYearAgo) {
        warnings.push("Data da transação é muito antiga (mais de 1 ano)");
      }

      if (transactionDate > oneYearFromNow) {
        errors.push("Data da transação não pode ser mais de 1 ano no futuro");
      }
    }

    // Validar se a conta existe (buscar por ID ou nome para compatibilidade)
    const account = storage
      .getAccounts()
      .find(
        (a) => a.id === transaction.account || a.name === transaction.account,
      );
    if (!account) {
      errors.push(`Conta não encontrada: ${transaction.account}`);
    }

    // Validações específicas por tipo
    if (transaction.type === "expense" && !this.config.allowNegativeBalances) {
      const balanceCheck = await this.checkAccountBalance(
        transaction.account,
        transaction.amount,
      );
      if (!balanceCheck.sufficient) {
        if (this.config.strictMode) {
          errors.push(`Saldo insuficiente na conta ${transaction.account}`);
        } else {
          warnings.push(
            `Transação resultará em saldo negativo na conta ${transaction.account}`,
          );
        }
      }
    }

    // Validar parcelamento
    if (transaction.installments && transaction.installments > 1) {
      if (transaction.installments > 60) {
        errors.push("Número máximo de parcelas é 60");
      }

      if (
        transaction.currentInstallment &&
        transaction.currentInstallment > transaction.installments
      ) {
        errors.push("Parcela atual não pode ser maior que o total de parcelas");
      }
    }

    // Validar transações compartilhadas
    if (transaction.type === "shared") {
      if (!transaction.sharedWith || transaction.sharedWith.length === 0) {
        errors.push(
          "Transação compartilhada deve ter pelo menos um participante",
        );
      }

      if (
        transaction.myShare &&
        (transaction.myShare <= 0 || transaction.myShare > transaction.amount)
      ) {
        errors.push("Minha parte deve estar entre 0 e o valor total");
      }
    }

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join("; ") : undefined,
      warnings,
    };
  }

  // Verificar saldo da conta
  private async checkAccountBalance(
    accountIdentifier: string,
    requiredAmount: number,
  ): Promise<{
    sufficient: boolean;
    currentBalance: number;
    availableBalance: number;
  }> {
    const account = storage
      .getAccounts()
      .find((a) => a.id === accountIdentifier || a.name === accountIdentifier);
    if (!account) {
      return {
        sufficient: false,
        currentBalance: 0,
        availableBalance: 0,
      };
    }

    let currentBalance = account.balance;
    let availableBalance = currentBalance;

    // Para contas de crédito, considerar limite
    if (account.type === "credit" && account.creditLimit) {
      availableBalance = currentBalance + account.creditLimit;
    }

    return {
      sufficient: availableBalance >= requiredAmount,
      currentBalance,
      availableBalance,
    };
  }

  // Atualizar saldos das contas
  private async updateAccountBalances(
    newTransaction?: Transaction,
    oldTransaction?: Transaction,
  ): Promise<void> {
    const accountsToUpdate = new Set<string>();

    if (newTransaction) {
      accountsToUpdate.add(newTransaction.account);
    }

    if (oldTransaction) {
      accountsToUpdate.add(oldTransaction.account);
    }

    for (const accountIdentifier of accountsToUpdate) {
      const account = storage
        .getAccounts()
        .find(
          (a) => a.id === accountIdentifier || a.name === accountIdentifier,
        );
      if (!account) continue;

      // Recalcular saldo baseado em todas as transações
      const transactions = storage
        .getTransactions()
        .filter((t) => t.account === account.id || t.account === account.name);

      let newBalance = 0;
      for (const transaction of transactions) {
        if (transaction.type === "income") {
          newBalance += transaction.amount;
        } else if (transaction.type === "expense") {
          newBalance -= transaction.amount;
        }
      }

      // Atualizar saldo da conta
      await updateAccount(account.id, { balance: newBalance });
    }
  }

  // Atualizar saldos para transferência
  private async updateAccountBalanceForTransfer(
    transfer: TransferOperation,
  ): Promise<void> {
    // Diminuir saldo da conta origem
    const fromAccount = storage
      .getAccounts()
      .find((a) => a.name === transfer.fromAccount);
    if (fromAccount) {
      await updateAccount(fromAccount.id, {
        balance: fromAccount.balance - transfer.amount,
      });
    }

    // Aumentar saldo da conta destino
    const toAccount = storage
      .getAccounts()
      .find((a) => a.name === transfer.toAccount);
    if (toAccount) {
      await updateAccount(toAccount.id, {
        balance: toAccount.balance + transfer.amount,
      });
    }
  }

  // Reverter lançamentos contábeis
  private async reverseLedgerEntries(transaction: Transaction): Promise<void> {
    // Buscar lançamentos relacionados à transação
    const entries = centralizedLedger
      .getLedgerEntries()
      .filter((entry) => entry.transactionId === transaction.id);

    // Criar lançamentos de estorno (inverter débito/crédito)
    for (const entry of entries) {
      const reverseEntry = {
        ...entry,
        id: this.generateId(),
        debit: entry.credit,
        credit: entry.debit,
        description: `ESTORNO: ${entry.description}`,
        createdAt: this.getTimestamp(),
        status: "CONFIRMED" as const,
      };

      // Salvar lançamento de estorno
      await centralizedLedger.createDoubleEntry(transaction, {
        debitAccount: entry.accountCode,
        creditAccount: entry.accountCode,
      });
    }
  }

  // Obter operações
  getOperations(
    status?: TransactionOperation["status"],
  ): TransactionOperation[] {
    const operations = Array.from(this.operations.values());

    if (status) {
      return operations.filter((op) => op.status === status);
    }

    return operations.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // Obter operação por ID
  getOperation(operationId: string): TransactionOperation | undefined {
    return this.operations.get(operationId);
  }

  // Validar integridade do sistema
  async validateSystemIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    summary: {
      totalOperations: number;
      completedOperations: number;
      failedOperations: number;
      pendingOperations: number;
      ledgerIntegrity: boolean;
    };
  }> {
    const operations = this.getOperations();
    const issues: string[] = [];

    const completed = operations.filter(
      (op) => op.status === "COMPLETED",
    ).length;
    const failed = operations.filter((op) => op.status === "FAILED").length;
    const pending = operations.filter(
      (op) => op.status === "PENDING" || op.status === "PROCESSING",
    ).length;

    // Verificar operações pendentes há muito tempo
    const now = new Date().getTime();
    const staleOperations = operations.filter((op) => {
      const opTime = new Date(op.createdAt).getTime();
      return (
        (op.status === "PENDING" || op.status === "PROCESSING") &&
        now - opTime > 5 * 60 * 1000
      ); // 5 minutos
    });

    if (staleOperations.length > 0) {
      issues.push(
        `${staleOperations.length} operações pendentes há mais de 5 minutos`,
      );
    }

    // Verificar integridade do razão
    const ledgerIntegrity = centralizedLedger.validateSystemIntegrity();
    if (!ledgerIntegrity.isValid) {
      issues.push(...ledgerIntegrity.issues);
    }

    // Verificar consistência entre transações e lançamentos
    const transactions = transactions;
    const ledgerEntries = centralizedLedger.getLedgerEntries();

    for (const transaction of transactions) {
      const relatedEntries = ledgerEntries.filter(
        (entry) => entry.transactionId === transaction.id,
      );
      if (relatedEntries.length === 0) {
        issues.push(`Transação ${transaction.id} sem lançamentos contábeis`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      summary: {
        totalOperations: operations.length,
        completedOperations: completed,
        failedOperations: failed,
        pendingOperations: pending,
        ledgerIntegrity: ledgerIntegrity.isValid,
      },
    };
  }

  // Limpar operações antigas
  async cleanupOldOperations(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const operations = Array.from(this.operations.values());
    let cleaned = 0;

    for (const operation of operations) {
      const operationDate = new Date(operation.createdAt);
      if (operationDate < cutoffDate && operation.status === "COMPLETED") {
        this.operations.delete(operation.id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveOperations();
    }

    return cleaned;
  }

  // Utilitários
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private async saveOperations(): Promise<void> {
    try {
      const operationsArray = Array.from(this.operations.values());
      if (typeof window !== "undefined") {
        // Migrado para dataService - localStorage deprecado
        const { dataService } = await import('../lib/services/data-service');
        await dataService.saveUserSettings({
          transactionOperations: operationsArray
        });
      }

      // Disparar evento de mudança
      if (typeof window !== "undefined") {
        const event = new CustomEvent("storageChange", {
          detail: {
            key: this.OPERATIONS_KEY,
            action: "save",
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      logComponents.error("Erro ao salvar operações:", error);
    }
  }

  private async loadOperations(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    try {
      // Migrado para dataService - localStorage deprecado
      const { dataService } = await import('../lib/services/data-service');
      const settings = await dataService.getUserSettings();
      const operationsArray = settings?.transactionOperations || [];
      
      this.operations.clear();
      if (operationsArray.length > 0) {

        for (const operation of operationsArray) {
          this.operations.set(operation.id, operation);
        }
      }
    } catch (error) {
      logComponents.error("Erro ao carregar operações:", error);
      this.operations.clear();
    }
  }
}

export const transactionEngine = new TransactionEngine();
