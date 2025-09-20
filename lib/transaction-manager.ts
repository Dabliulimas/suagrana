import { type Transaction } from "./data-layer/types";
import { auditLogger } from "./audit";
import { authService } from "./auth";
import { accountingSystem } from "./accounting-system";
import type { AuditLog } from "./audit";
import { logComponents } from "./utils/logger";

export interface TransactionResult {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  rollbackData?: any;
}

class TransactionManager {
  private pendingTransactions: Map<string, any> = new Map();

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ACID Transaction Implementation
  async executeTransaction(
    operations: Array<() => Promise<any>>,
    rollbackOperations: Array<() => Promise<any>>,
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    const transactionId = this.generateId();
    const results: any[] = [];

    try {
      // Begin transaction
      this.pendingTransactions.set(transactionId, {
        operations,
        rollbackOperations,
        results,
      });

      // Execute all operations atomically
      for (let i = 0; i < operations.length; i++) {
        const result = await operations[i]();
        results.push(result);
      }

      // Commit transaction
      this.pendingTransactions.delete(transactionId);

      await auditLogger.log({
        action: "TRANSACTION_COMMITTED",
        userId: authService.getCurrentUser()?.id,
        details: { transactionId, operationCount: operations.length },
        severity: "medium",
      });

      return { success: true, results };
    } catch (error) {
      // Rollback transaction
      try {
        for (let i = rollbackOperations.length - 1; i >= 0; i--) {
          await rollbackOperations[i]();
        }

        await auditLogger.log({
          action: "TRANSACTION_ROLLED_BACK",
          userId: authService.getCurrentUser()?.id,
          details: {
            transactionId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          severity: "high",
        });
      } catch (rollbackError) {
        await auditLogger.log({
          action: "TRANSACTION_ROLLBACK_FAILED",
          userId: authService.getCurrentUser()?.id,
          details: { transactionId, originalError: error, rollbackError },
          severity: "critical",
        });
      }

      this.pendingTransactions.delete(transactionId);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Transaction failed",
      };
    }
  }

  // Create financial transaction with double-entry bookkeeping
  async createFinancialTransaction(
    transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<TransactionResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate transaction data
    if (!this.validateTransactionData(transactionData)) {
      return { success: false, error: "Invalid transaction data" };
    }

    const transactionId = this.generateId();
    let createdTransaction: Transaction | undefined;
    let originalAccountBalance: number | undefined;

    const operations = [
      // Create transaction record
      async () => {
        // This would need to be replaced with the new data layer
        // createdTransaction = await dataLayer.create('transactions', transactionData);
        throw new Error('Transaction creation needs to be implemented with new data layer');
        return createdTransaction;
      },
      // Create double-entry accounting entries
      async () => {
        if (createdTransaction) {
          const accountingResult =
            await accountingSystem.createDoubleEntry(createdTransaction);
          if (!accountingResult.success) {
            throw new Error(
              `Erro na contabilização: ${accountingResult.error}`,
            );
          }
        }
      },
      // Update account balance using accounting system
      async () => {
        const accounts = accounts;
        const account = accounts.find(
          (a) => a.name === transactionData.account,
        );
        if (account) {
          originalAccountBalance = account.balance;
          const newBalance = accountingSystem.calculateAccountBalance(
            account.name,
          );
          await updateAccount(account.id, { balance: newBalance });
        }
      },
      // Update trip expenses if applicable
      async () => {
        if (transactionData.tripId && transactionData.type === "expense") {
          // Trip expenses would be handled through the new data layer
          logComponents.info("Trip expense would be added", { tripId: transactionData.tripId, amount: transactionData.amount });
        }
      },
    ];

    const rollbackOperations = [
      // Remove transaction
      async () => {
        if (createdTransaction) {
          await deleteTransaction(createdTransaction.id);
        }
      },
      // Restore account balance
      async () => {
        if (originalAccountBalance !== undefined) {
          const accounts = accounts;
          const account = accounts.find(
            (a) => a.name === transactionData.account,
          );
          if (account) {
            await updateAccount(account.id, {
              balance: originalAccountBalance,
            });
          }
        }
      },
      // Rollback trip expenses
      async () => {
        if (transactionData.tripId && transactionData.type === "expense") {
          // Trip expense rollback would be handled through the new data layer
          logComponents.info("Trip expense rollback would be processed", { tripId: transactionData.tripId, amount: -transactionData.amount });
        }
      },
    ];

    const result = await this.executeTransaction(
      operations,
      rollbackOperations,
    );

    if (result.success && createdTransaction) {
      await auditLogger.log({
        action: "TRANSACTION_CREATED",
        userId: user.id,
        details: {
          transactionId: createdTransaction.id,
          amount: transactionData.amount,
          type: transactionData.type,
          account: transactionData.account,
        },
        severity: transactionData.amount > 10000 ? "high" : "medium",
      });

      return { success: true, transaction: createdTransaction };
    }

    return { success: false, error: result.error };
  }

  // Update transaction with consistency checks
  async updateTransaction(
    transactionId: string,
    updates: Partial<Transaction>,
  ): Promise<TransactionResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const originalTransaction = storage
      .getTransactions()
      .find((t) => t.id === transactionId);
    if (!originalTransaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Check permissions
    if (
      !authService.hasPermission(user, "write:own") &&
      originalTransaction.id !== transactionId
    ) {
      await auditLogger.log({
        action: "PERMISSION_DENIED",
        userId: user.id,
        details: { action: "UPDATE_TRANSACTION", transactionId },
        severity: "critical",
      });
      return { success: false, error: "Permission denied" };
    }

    let balanceAdjustment = 0;
    if (
      updates.amount !== undefined &&
      updates.amount !== originalTransaction.amount
    ) {
      const oldAmount =
        originalTransaction.type === "income"
          ? originalTransaction.amount
          : -originalTransaction.amount;
      const newAmount =
        (updates.type || originalTransaction.type) === "income"
          ? updates.amount
          : -updates.amount;
      balanceAdjustment = newAmount - oldAmount;
    }

    const operations = [
      async () => {
        await updateTransaction(transactionId, updates);
        return true;
      },
      async () => {
        if (balanceAdjustment !== 0) {
          storage.updateAccountBalance(
            originalTransaction.account,
            balanceAdjustment,
          );
        }
        return true;
      },
    ];

    const rollbackOperations = [
      async () => {
        await updateTransaction(transactionId, originalTransaction);
        return true;
      },
      async () => {
        if (balanceAdjustment !== 0) {
          storage.updateAccountBalance(
            originalTransaction.account,
            -balanceAdjustment,
          );
        }
        return true;
      },
    ];

    const result = await this.executeTransaction(
      operations,
      rollbackOperations,
    );

    if (result.success) {
      await auditLogger.log({
        action: "TRANSACTION_UPDATED",
        userId: user.id,
        details: { transactionId, updates },
        severity: "medium",
      });

      const updatedTransaction = storage
        .getTransactions()
        .find((t) => t.id === transactionId);
      return { success: true, transaction: updatedTransaction };
    }

    return { success: false, error: result.error };
  }

  // Delete transaction with proper cleanup
  async deleteTransaction(transactionId: string): Promise<TransactionResult> {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const transaction = storage
      .getTransactions()
      .find((t) => t.id === transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Check permissions
    if (!authService.hasPermission(user, "delete:own")) {
      await auditLogger.log({
        action: "PERMISSION_DENIED",
        userId: user.id,
        details: { action: "DELETE_TRANSACTION", transactionId },
        severity: "critical",
      });
      return { success: false, error: "Permission denied" };
    }

    const balanceAdjustment =
      transaction.type === "income" ? -transaction.amount : transaction.amount;

    const operations = [
      async () => {
        await deleteTransaction(transactionId);
        return true;
      },
      async () => {
        storage.updateAccountBalance(transaction.account, balanceAdjustment);
        return true;
      },
    ];

    const rollbackOperations = [
      async () => {
        storage.saveTransaction(transaction);
        return true;
      },
      async () => {
        storage.updateAccountBalance(transaction.account, -balanceAdjustment);
        return true;
      },
    ];

    const result = await this.executeTransaction(
      operations,
      rollbackOperations,
    );

    if (result.success) {
      await auditLogger.log({
        action: "TRANSACTION_DELETED",
        userId: user.id,
        details: {
          transactionId,
          amount: transaction.amount,
          type: transaction.type,
        },
        severity: "high",
      });

      return { success: true };
    }

    return { success: false, error: result.error };
  }

  private validateTransactionData(
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): boolean {
    if (!data.description || data.description.trim().length === 0) return false;
    if (!data.amount || data.amount <= 0) return false;
    if (!data.type || !["income", "expense", "shared"].includes(data.type))
      return false;
    if (!data.category || data.category.trim().length === 0) return false;
    if (!data.account || data.account.trim().length === 0) return false;
    if (!data.date) return false;

    return true;
  }

  // Get transaction history with audit trail
  getTransactionHistory(transactionId: string): AuditLog[] {
    return auditLogger
      .getLogs({
        action: "TRANSACTION_CREATED",
      })
      .filter((log) => log.details.transactionId === transactionId);
  }

  // Integrity check
  async performIntegrityCheck(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const transactions = transactions;
      const accounts = accounts;

      // Check transaction-account consistency
      for (const transaction of transactions) {
        const account = accounts.find((a) => a.name === transaction.account);
        if (!account) {
          issues.push(
            `Transaction ${transaction.id} references non-existent account: ${transaction.account}`,
          );
        }
      }

      // Check balance calculations
      for (const account of accounts) {
        const accountTransactions = transactions.filter(
          (t) => t.account === account.name,
        );
        const calculatedBalance = accountTransactions.reduce((sum, t) => {
          return sum + (t.type === "income" ? t.amount : -t.amount);
        }, 0);

        if (Math.abs(calculatedBalance - account.balance) > 0.01) {
          issues.push(
            `Account ${account.name} balance mismatch: expected ${calculatedBalance}, actual ${account.balance}`,
          );
        }
      }

      await auditLogger.log({
        action: "INTEGRITY_CHECK",
        userId: authService.getCurrentUser()?.id,
        details: { issuesFound: issues.length, issues },
        severity: issues.length > 0 ? "high" : "low",
      });

      return { valid: issues.length === 0, issues };
    } catch (error) {
      issues.push(
        `Integrity check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { valid: false, issues };
    }
  }
}

export const transactionManager = new TransactionManager();
