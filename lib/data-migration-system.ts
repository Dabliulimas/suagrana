"use client";

import {
  storage,
  type Transaction,
  type Account,
  type Investment,
  type Goal,
} from "./storage";
import { centralizedLedger } from "./centralized-ledger";
import { logComponents } from "../logger";
import { doubleEntrySystem } from "./double-entry-system";
import { transactionEngine } from "./transaction-engine";
import { dataValidationLayer } from "./data-validation-layer";
import { auditLogger } from "./audit";
import { authService } from "./auth";

// Interface para resultado de migração
export interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  duration: number;
  backupCreated: boolean;
  rollbackAvailable: boolean;
}

// Interface para erro de migração
export interface MigrationError {
  id: string;
  recordId: string;
  recordType:
    | "TRANSACTION"
    | "ACCOUNT"
    | "INVESTMENT"
    | "GOAL"
    | "LEDGER_ENTRY";
  error: string;
  originalData: any;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  canRetry: boolean;
  suggestion?: string;
}

// Interface para aviso de migração
export interface MigrationWarning {
  id: string;
  recordId: string;
  recordType: string;
  message: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  suggestion?: string;
}

// Interface para configuração de migração
export interface MigrationConfig {
  createBackup: boolean;
  validateBeforeMigration: boolean;
  validateAfterMigration: boolean;
  stopOnError: boolean;
  batchSize: number;
  enableRollback: boolean;
  preserveOriginalData: boolean;
  auditLevel: "minimal" | "standard" | "detailed";
  dryRun: boolean; // Simular migração sem alterar dados
}

// Interface para status de migração
export interface MigrationStatus {
  isRunning: boolean;
  currentStep: string;
  progress: number; // 0-100
  recordsProcessed: number;
  totalRecords: number;
  startTime: string;
  estimatedTimeRemaining?: number;
  errors: number;
  warnings: number;
}

// Interface para backup
export interface BackupData {
  timestamp: string;
  version: string;
  transactions: Transaction[];
  accounts: Account[];
  investments: Investment[];
  goals: Goal[];
  ledgerEntries: any[];
  doubleEntries: any[];
  metadata: {
    totalRecords: number;
    createdBy: string;
    migrationId: string;
  };
}

class DataMigrationSystem {
  private config: MigrationConfig = {
    createBackup: true,
    validateBeforeMigration: true,
    validateAfterMigration: true,
    stopOnError: false,
    batchSize: 50,
    enableRollback: true,
    preserveOriginalData: true,
    auditLevel: "standard",
    dryRun: false,
  };

  private migrationStatus: MigrationStatus = {
    isRunning: false,
    currentStep: "",
    progress: 0,
    recordsProcessed: 0,
    totalRecords: 0,
    startTime: "",
    errors: 0,
    warnings: 0,
  };

  private backupData: BackupData | null = null;
  private migrationId: string = "";

  // Configurar migração
  configure(config: Partial<MigrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Obter status da migração
  getStatus(): MigrationStatus {
    return { ...this.migrationStatus };
  }

  // Executar migração completa
  async migrateAllData(): Promise<MigrationResult> {
    const startTime = Date.now();
    this.migrationId = this.generateMigrationId();
    const userId = authService.getCurrentUser()?.id || "system";

    this.migrationStatus = {
      isRunning: true,
      currentStep: "Iniciando migração",
      progress: 0,
      recordsProcessed: 0,
      totalRecords: 0,
      startTime: new Date().toISOString(),
      errors: 0,
      warnings: 0,
    };

    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    let totalRecords = 0;
    let migratedRecords = 0;
    let failedRecords = 0;
    let backupCreated = false;

    try {
      // Log início da migração
      await auditLogger.log({
        action: "DATA_MIGRATION_STARTED",
        userId,
        details: {
          migrationId: this.migrationId,
          config: this.config,
        },
        severity: "medium",
      });

      // Passo 1: Criar backup
      if (this.config.createBackup) {
        this.updateStatus("Criando backup dos dados", 5);
        backupCreated = await this.createBackup();
        if (!backupCreated && this.config.stopOnError) {
          throw new Error("Falha ao criar backup");
        }
      }

      // Passo 2: Validação pré-migração
      if (this.config.validateBeforeMigration) {
        this.updateStatus("Validando dados antes da migração", 10);
        const preValidation = await this.validateExistingData();
        if (!preValidation.success && this.config.stopOnError) {
          throw new Error("Dados existentes contêm erros críticos");
        }
        warnings.push(...preValidation.warnings);

        // Converter erros de string para MigrationError
        preValidation.errors.forEach((errorMsg) => {
          errors.push({
            id: this.generateId(),
            recordId: "system",
            recordType: "VALIDATION",
            error: errorMsg,
            originalData: null,
            severity: "HIGH",
            canRetry: false,
            suggestion: "Resolva os problemas de validação antes de continuar",
          });
        });
      }

      // Passo 3: Contar registros totais
      this.updateStatus("Contando registros", 15);
      totalRecords = await this.countTotalRecords();
      this.migrationStatus.totalRecords = totalRecords;

      // Passo 4: Migrar contas
      this.updateStatus("Migrando contas", 20);
      const accountsResult = await this.migrateAccounts();
      migratedRecords += accountsResult.migrated;
      failedRecords += accountsResult.failed;
      errors.push(...accountsResult.errors);
      warnings.push(...accountsResult.warnings);

      // Passo 5: Migrar transações
      this.updateStatus("Migrando transações", 40);
      const transactionsResult = await this.migrateTransactions();
      migratedRecords += transactionsResult.migrated;
      failedRecords += transactionsResult.failed;
      errors.push(...transactionsResult.errors);
      warnings.push(...transactionsResult.warnings);

      // Passo 6: Migrar investimentos
      this.updateStatus("Migrando investimentos", 60);
      const investmentsResult = await this.migrateInvestments();
      migratedRecords += investmentsResult.migrated;
      failedRecords += investmentsResult.failed;
      errors.push(...investmentsResult.errors);
      warnings.push(...investmentsResult.warnings);

      // Passo 7: Migrar metas
      this.updateStatus("Migrando metas", 70);
      const goalsResult = await this.migrateGoals();
      migratedRecords += goalsResult.migrated;
      failedRecords += goalsResult.failed;
      errors.push(...goalsResult.errors);
      warnings.push(...goalsResult.warnings);

      // Passo 8: Criar lançamentos contábeis
      this.updateStatus("Criando lançamentos contábeis", 80);
      const ledgerResult = await this.createLedgerEntries();
      errors.push(...ledgerResult.errors);
      warnings.push(...ledgerResult.warnings);

      // Passo 9: Validação pós-migração
      if (this.config.validateAfterMigration) {
        this.updateStatus("Validando dados após migração", 90);
        const postValidation = await this.validateMigratedData();
        if (!postValidation.success) {
          warnings.push({
            id: this.generateId(),
            recordId: "system",
            recordType: "VALIDATION",
            message: "Problemas encontrados na validação pós-migração",
            impact: "HIGH",
            suggestion: "Execute uma validação completa do sistema",
          });
        }
      }

      // Passo 10: Finalizar
      this.updateStatus("Finalizando migração", 100);

      const duration = Date.now() - startTime;
      const success =
        failedRecords === 0 &&
        errors.filter((e) => e.severity === "CRITICAL").length === 0;

      const result: MigrationResult = {
        success,
        totalRecords,
        migratedRecords,
        failedRecords,
        errors,
        warnings,
        duration,
        backupCreated,
        rollbackAvailable: this.config.enableRollback && backupCreated,
      };

      // Log resultado da migração
      await auditLogger.log({
        action: "DATA_MIGRATION_COMPLETED",
        userId,
        details: {
          migrationId: this.migrationId,
          success,
          duration,
          totalRecords,
          migratedRecords,
          failedRecords,
          errorsCount: errors.length,
          warningsCount: warnings.length,
        },
        severity: success ? "low" : "high",
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await auditLogger.log({
        action: "DATA_MIGRATION_FAILED",
        userId,
        details: {
          migrationId: this.migrationId,
          error: error instanceof Error ? error.message : "Erro desconhecido",
          duration,
        },
        severity: "high",
      });

      return {
        success: false,
        totalRecords,
        migratedRecords,
        failedRecords: totalRecords - migratedRecords,
        errors: [
          {
            id: this.generateId(),
            recordId: "system",
            recordType: "TRANSACTION",
            error: error instanceof Error ? error.message : "Erro desconhecido",
            originalData: null,
            severity: "CRITICAL",
            canRetry: true,
          },
        ],
        warnings,
        duration: Date.now() - startTime,
        backupCreated,
        rollbackAvailable: false,
      };
    } finally {
      this.migrationStatus.isRunning = false;
    }
  }

  // Criar backup dos dados
  private async createBackup(): Promise<boolean> {
    try {
      const userId = authService.getCurrentUser()?.id || "system";

      this.backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        transactions: transactions,
        accounts: accounts,
        investments: storage.getInvestments(),
        goals: goals,
        ledgerEntries: centralizedLedger.getLedgerEntries(),
        doubleEntries: doubleEntrySystem.getDoubleEntries(),
        metadata: {
          totalRecords: 0,
          createdBy: userId,
          migrationId: this.migrationId,
        },
      };

      this.backupData.metadata.totalRecords =
        this.backupData.transactions.length +
        this.backupData.accounts.length +
        this.backupData.investments.length +
        this.backupData.goals.length;

      // Salvar backup no localStorage
      const backupKey = `sua-grana-backup-${this.migrationId}`;
      localStorage.setItem(backupKey, JSON.stringify(this.backupData));

      return true;
    } catch (error) {
      logComponents.error("Erro ao criar backup:", error);
      return false;
    }
  }

  // Validar dados existentes
  private async validateExistingData(): Promise<{
    success: boolean;
    warnings: MigrationWarning[];
    errors: string[];
  }> {
    const warnings: MigrationWarning[] = [];
    const errors: string[] = [];

    try {
      const integrityReport =
        await dataValidationLayer.validateSystemIntegrity();

      if (integrityReport.status === "CORRUPTED") {
        errors.push("Sistema de dados corrompido detectado");
        return { success: false, warnings, errors };
      }

      if (integrityReport.criticalIssues.length > 0) {
        warnings.push({
          id: this.generateId(),
          recordId: "system",
          recordType: "VALIDATION",
          message: `${integrityReport.criticalIssues.length} problemas críticos encontrados`,
          impact: "HIGH",
          suggestion: "Resolva os problemas críticos antes da migração",
        });
      }

      return { success: true, warnings, errors };
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Erro na validação de dados",
      );
      return { success: false, warnings, errors };
    }
  }

  // Contar registros totais
  private async countTotalRecords(): Promise<number> {
    const transactions = transactions.length;
    const accounts = accounts.length;
    const investments = storage.getInvestments().length;
    const goals = goals.length;

    return transactions + accounts + investments + goals;
  }

  // Migrar contas
  private async migrateAccounts(): Promise<{
    migrated: number;
    failed: number;
    errors: MigrationError[];
    warnings: MigrationWarning[];
  }> {
    const accounts = accounts;
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    let migrated = 0;
    let failed = 0;

    for (const account of accounts) {
      try {
        // Validar conta
        const validation = await dataValidationLayer.validateAccount(account, {
          operation: "UPDATE",
          entityType: "ACCOUNT",
          userId: authService.getCurrentUser()?.id || "system",
          timestamp: new Date().toISOString(),
        });

        if (!validation.isValid && this.config.stopOnError) {
          failed++;
          errors.push({
            id: this.generateId(),
            recordId: account.id,
            recordType: "ACCOUNT",
            error: `Conta inválida: ${validation.errors.map((e) => e.message).join(", ")}`,
            originalData: account,
            severity: "HIGH",
            canRetry: true,
          });
          continue;
        }

        // Migrar conta para o novo sistema
        if (!this.config.dryRun) {
          // Criar conta no razão contábil se não existir
          const chartAccount = centralizedLedger
            .getChartOfAccounts()
            .find(
              (acc) => acc.name.toLowerCase() === account.name.toLowerCase(),
            );

          if (!chartAccount) {
            centralizedLedger.addAccount({
              code: this.generateAccountCode(account.type),
              name: account.name,
              type: this.mapAccountType(account.type),
              parentCode: this.getParentAccountCode(account.type),
              isActive: true,
              description: `Conta migrada: ${account.name}`,
            });
          }
        }

        migrated++;
        this.migrationStatus.recordsProcessed++;

        // Adicionar avisos se houver
        if (validation.warnings.length > 0) {
          warnings.push({
            id: this.generateId(),
            recordId: account.id,
            recordType: "ACCOUNT",
            message: `Avisos na conta: ${validation.warnings.map((w) => w.message).join(", ")}`,
            impact: "LOW",
          });
        }
      } catch (error) {
        failed++;
        errors.push({
          id: this.generateId(),
          recordId: account.id,
          recordType: "ACCOUNT",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          originalData: account,
          severity: "MEDIUM",
          canRetry: true,
        });
      }
    }

    return { migrated, failed, errors, warnings };
  }

  // Migrar transações
  private async migrateTransactions(): Promise<{
    migrated: number;
    failed: number;
    errors: MigrationError[];
    warnings: MigrationWarning[];
  }> {
    const transactions = transactions;
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    let migrated = 0;
    let failed = 0;

    // Processar em lotes
    for (let i = 0; i < transactions.length; i += this.config.batchSize) {
      const batch = transactions.slice(i, i + this.config.batchSize);

      for (const transaction of batch) {
        try {
          // Validar transação
          const validation = await dataValidationLayer.validateTransaction(
            transaction,
            {
              operation: "UPDATE",
              entityType: "TRANSACTION",
              userId: authService.getCurrentUser()?.id || "system",
              timestamp: new Date().toISOString(),
            },
          );

          if (!validation.isValid && this.config.stopOnError) {
            failed++;
            errors.push({
              id: this.generateId(),
              recordId: transaction.id,
              recordType: "TRANSACTION",
              error: `Transação inválida: ${validation.errors.map((e) => e.message).join(", ")}`,
              originalData: transaction,
              severity: "HIGH",
              canRetry: true,
            });
            continue;
          }

          // Migrar transação
          if (!this.config.dryRun) {
            // Verificar se já existe lançamento contábil
            const existingEntries = centralizedLedger
              .getLedgerEntries()
              .filter((entry) => entry.transactionId === transaction.id);

            if (existingEntries.length === 0) {
              // Criar lançamento contábil
              await centralizedLedger.createDoubleEntry(transaction);

              // Criar entrada no sistema de partidas dobradas
              await doubleEntrySystem.createDoubleEntry(transaction);
            }
          }

          migrated++;
          this.migrationStatus.recordsProcessed++;

          // Adicionar avisos se houver
          if (validation.warnings.length > 0) {
            warnings.push({
              id: this.generateId(),
              recordId: transaction.id,
              recordType: "TRANSACTION",
              message: `Avisos na transação: ${validation.warnings.map((w) => w.message).join(", ")}`,
              impact: "LOW",
            });
          }
        } catch (error) {
          failed++;
          errors.push({
            id: this.generateId(),
            recordId: transaction.id,
            recordType: "TRANSACTION",
            error: error instanceof Error ? error.message : "Erro desconhecido",
            originalData: transaction,
            severity: "MEDIUM",
            canRetry: true,
          });
        }
      }

      // Atualizar progresso
      const progress = 40 + (i / transactions.length) * 20; // 40-60%
      this.migrationStatus.progress = Math.min(progress, 60);
    }

    return { migrated, failed, errors, warnings };
  }

  // Migrar investimentos
  private async migrateInvestments(): Promise<{
    migrated: number;
    failed: number;
    errors: MigrationError[];
    warnings: MigrationWarning[];
  }> {
    const investments = storage.getInvestments();
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    let migrated = 0;
    let failed = 0;

    for (const investment of investments) {
      try {
        // Validações básicas
        if (
          !investment.name ||
          !investment.type ||
          investment.amount === undefined
        ) {
          failed++;
          errors.push({
            id: this.generateId(),
            recordId: investment.id,
            recordType: "INVESTMENT",
            error: "Investimento com dados obrigatórios faltando",
            originalData: investment,
            severity: "HIGH",
            canRetry: false,
            suggestion: "Complete os dados obrigatórios",
          });
          continue;
        }

        // Migrar investimento
        if (!this.config.dryRun) {
          // Criar transação equivalente se necessário
          const equivalentTransaction: Transaction = {
            id: `inv_${investment.id}`,
            description: `Investimento: ${investment.name}`,
            amount: investment.amount,
            type: "investment",
            account: "Investimentos",
            date:
              investment.purchaseDate || new Date().toISOString().split("T")[0],
            category: investment.type,
            createdAt: investment.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Criar lançamento contábil para o investimento
          await centralizedLedger.createDoubleEntry(equivalentTransaction);
        }

        migrated++;
        this.migrationStatus.recordsProcessed++;
      } catch (error) {
        failed++;
        errors.push({
          id: this.generateId(),
          recordId: investment.id,
          recordType: "INVESTMENT",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          originalData: investment,
          severity: "MEDIUM",
          canRetry: true,
        });
      }
    }

    return { migrated, failed, errors, warnings };
  }

  // Migrar metas
  private async migrateGoals(): Promise<{
    migrated: number;
    failed: number;
    errors: MigrationError[];
    warnings: MigrationWarning[];
  }> {
    const goals = goals;
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];
    let migrated = 0;
    let failed = 0;

    for (const goal of goals) {
      try {
        // Validações básicas
        if (!goal.name || goal.targetAmount === undefined) {
          failed++;
          errors.push({
            id: this.generateId(),
            recordId: goal.id,
            recordType: "GOAL",
            error: "Meta com dados obrigatórios faltando",
            originalData: goal,
            severity: "MEDIUM",
            canRetry: false,
            suggestion: "Complete os dados obrigatórios",
          });
          continue;
        }

        // Migrar meta (metas não precisam de lançamentos contábeis diretos)
        migrated++;
        this.migrationStatus.recordsProcessed++;
      } catch (error) {
        failed++;
        errors.push({
          id: this.generateId(),
          recordId: goal.id,
          recordType: "GOAL",
          error: error instanceof Error ? error.message : "Erro desconhecido",
          originalData: goal,
          severity: "LOW",
          canRetry: true,
        });
      }
    }

    return { migrated, failed, errors, warnings };
  }

  // Criar lançamentos contábeis
  private async createLedgerEntries(): Promise<{
    errors: MigrationError[];
    warnings: MigrationWarning[];
  }> {
    const errors: MigrationError[] = [];
    const warnings: MigrationWarning[] = [];

    try {
      if (!this.config.dryRun) {
        // Validar integridade do razão contábil
        const integrity = centralizedLedger.validateSystemIntegrity();
        if (!integrity.isValid) {
          warnings.push({
            id: this.generateId(),
            recordId: "ledger",
            recordType: "VALIDATION",
            message: "Problemas de integridade no razão contábil após migração",
            impact: "HIGH",
            suggestion: "Execute uma validação completa do sistema",
          });
        }

        // Validar sistema de partidas dobradas
        const doubleEntryIntegrity =
          doubleEntrySystem.validateSystemIntegrity();
        if (!doubleEntryIntegrity.isValid) {
          warnings.push({
            id: this.generateId(),
            recordId: "double-entry",
            recordType: "VALIDATION",
            message: "Problemas no sistema de partidas dobradas após migração",
            impact: "HIGH",
            suggestion: "Rebalancear lançamentos contábeis",
          });
        }
      }
    } catch (error) {
      errors.push({
        id: this.generateId(),
        recordId: "system",
        recordType: "LEDGER_ENTRY",
        error:
          error instanceof Error
            ? error.message
            : "Erro ao validar lançamentos",
        originalData: null,
        severity: "MEDIUM",
        canRetry: true,
      });
    }

    return { errors, warnings };
  }

  // Validar dados migrados
  private async validateMigratedData(): Promise<{ success: boolean }> {
    try {
      const integrityReport =
        await dataValidationLayer.validateSystemIntegrity();
      return { success: integrityReport.status !== "CORRUPTED" };
    } catch (error) {
      return { success: false };
    }
  }

  // Rollback da migração
  async rollback(): Promise<boolean> {
    if (!this.backupData || !this.config.enableRollback) {
      return false;
    }

    try {
      const userId = authService.getCurrentUser()?.id || "system";

      // Restaurar dados do backup
      if (!this.config.dryRun) {
        storage.saveToStorage(
          "sua-grana-transactions",
          this.backupData.transactions,
        );
        storage.saveToStorage("sua-grana-accounts", this.backupData.accounts);
        storage.saveToStorage(
          "sua-grana-investments",
          this.backupData.investments,
        );
        storage.saveToStorage("sua-grana-goals", this.backupData.goals);

        // Limpar dados migrados
        centralizedLedger.clearAllEntries();
        doubleEntrySystem.clearAllEntries();
      }

      await auditLogger.log({
        action: "DATA_MIGRATION_ROLLBACK",
        userId,
        details: {
          migrationId: this.migrationId,
          backupTimestamp: this.backupData.timestamp,
        },
        severity: "medium",
      });

      return true;
    } catch (error) {
      logComponents.error("Erro no rollback:", error);
      return false;
    }
  }

  // Métodos auxiliares
  private updateStatus(step: string, progress: number): void {
    this.migrationStatus.currentStep = step;
    this.migrationStatus.progress = progress;
  }

  private generateMigrationId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateAccountCode(accountType: string): string {
    const typeMap: Record<string, string> = {
      checking: "1.1.01",
      savings: "1.1.02",
      credit: "2.1.01",
      investment: "1.2.01",
    };
    return typeMap[accountType] || "1.1.99";
  }

  private mapAccountType(
    accountType: string,
  ): "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" {
    const typeMap: Record<
      string,
      "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
    > = {
      checking: "ASSET",
      savings: "ASSET",
      credit: "LIABILITY",
      investment: "ASSET",
    };
    return typeMap[accountType] || "ASSET";
  }

  private getParentAccountCode(accountType: string): string {
    const parentMap: Record<string, string> = {
      checking: "1.1",
      savings: "1.1",
      credit: "2.1",
      investment: "1.2",
    };
    return parentMap[accountType] || "1.1";
  }
}

export const dataMigrationSystem = new DataMigrationSystem();
