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
import { auditLogger } from "./audit";
import { authService } from "./auth";

// Interface para resultado de validação
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  criticalIssues: CriticalIssue[];
  score: number; // 0-100, onde 100 é perfeito
}

// Interface para erro de validação
export interface ValidationError {
  id: string;
  type:
    | "REQUIRED_FIELD"
    | "INVALID_FORMAT"
    | "BUSINESS_RULE"
    | "REFERENTIAL_INTEGRITY"
    | "BALANCE_MISMATCH"
    | "DUPLICATE_DATA";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  field?: string;
  message: string;
  suggestion?: string;
  relatedData?: any;
}

// Interface para aviso de validação
export interface ValidationWarning {
  id: string;
  type:
    | "UNUSUAL_VALUE"
    | "POTENTIAL_DUPLICATE"
    | "OUTDATED_DATA"
    | "PERFORMANCE_IMPACT"
    | "BEST_PRACTICE";
  message: string;
  suggestion?: string;
  impact?: "LOW" | "MEDIUM" | "HIGH";
}

// Interface para problema crítico
export interface CriticalIssue {
  id: string;
  type:
    | "DATA_CORRUPTION"
    | "BALANCE_INCONSISTENCY"
    | "MISSING_ENTRIES"
    | "ORPHANED_DATA"
    | "SECURITY_VIOLATION";
  description: string;
  affectedData: string[];
  autoFixAvailable: boolean;
  fixAction?: string;
  priority: "IMMEDIATE" | "URGENT" | "HIGH" | "MEDIUM";
}

// Interface para configurações de validação
export interface ValidationConfig {
  strictMode: boolean; // Modo rigoroso bloqueia operações com erros
  autoFix: boolean; // Correção automática quando possível
  realTimeValidation: boolean; // Validação em tempo real
  balanceValidation: boolean; // Validação de saldos
  referentialIntegrity: boolean; // Validação de integridade referencial
  businessRules: boolean; // Validação de regras de negócio
  performanceMode: boolean; // Modo de performance (validações mais leves)
  auditLevel: "minimal" | "standard" | "detailed";
}

// Interface para contexto de validação
export interface ValidationContext {
  operation: "CREATE" | "UPDATE" | "DELETE" | "TRANSFER" | "BULK_OPERATION";
  entityType: "TRANSACTION" | "ACCOUNT" | "INVESTMENT" | "GOAL" | "SYSTEM";
  userId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Interface para relatório de integridade
export interface IntegrityReport {
  timestamp: string;
  overallScore: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL" | "CORRUPTED";
  summary: {
    totalTransactions: number;
    validTransactions: number;
    invalidTransactions: number;
    totalAccounts: number;
    balancedAccounts: number;
    unbalancedAccounts: number;
    orphanedEntries: number;
    duplicateEntries: number;
  };
  validationResults: ValidationResult[];
  criticalIssues: CriticalIssue[];
  recommendations: string[];
  autoFixesApplied: number;
}

class DataValidationLayer {
  private config: ValidationConfig = {
    strictMode: false, // Desabilitado para permitir transações com avisos
    autoFix: false,
    realTimeValidation: true,
    balanceValidation: true,
    referentialIntegrity: true,
    businessRules: true,
    performanceMode: false,
    auditLevel: "standard",
  };

  private validationCache = new Map<
    string,
    { result: ValidationResult; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.setupRealTimeValidation();
  }

  // Configurar validação
  configure(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.realTimeValidation !== undefined) {
      if (config.realTimeValidation) {
        this.setupRealTimeValidation();
      } else {
        this.teardownRealTimeValidation();
      }
    }
  }

  // Validar transação
  async validateTransaction(
    transaction: Transaction,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const cacheKey = `transaction_${transaction.id}_${context.operation}`;

    // Verificar cache se não for modo rigoroso
    if (!this.config.strictMode && !this.config.performanceMode) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const criticalIssues: CriticalIssue[] = [];

    // Validações básicas obrigatórias
    this.validateRequiredFields(transaction, errors);
    this.validateDataFormats(transaction, errors, warnings);

    // Validações de regras de negócio
    if (this.config.businessRules) {
      await this.validateBusinessRules(transaction, context, errors, warnings);
    }

    // Validações de integridade referencial
    if (this.config.referentialIntegrity) {
      await this.validateReferentialIntegrity(
        transaction,
        errors,
        criticalIssues,
      );
    }

    // Validações de saldo
    if (this.config.balanceValidation) {
      await this.validateBalanceImpact(transaction, context, errors, warnings);
    }

    // Validações específicas por operação
    await this.validateOperationSpecific(
      transaction,
      context,
      errors,
      warnings,
    );

    // Calcular score
    const score = this.calculateValidationScore(
      errors,
      warnings,
      criticalIssues,
    );

    const result: ValidationResult = {
      isValid: this.config.strictMode
        ? errors.length === 0 && criticalIssues.length === 0
        : criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues,
      score,
    };

    // Cache do resultado
    this.setCachedResult(cacheKey, result);

    // Log de auditoria para problemas críticos
    if (criticalIssues.length > 0 && this.config.auditLevel !== "minimal") {
      await auditLogger.log({
        action: "CRITICAL_VALIDATION_ISSUES",
        userId: context.userId,
        details: {
          transactionId: transaction.id,
          operation: context.operation,
          criticalIssues: criticalIssues.length,
          errors: errors.length,
        },
        severity: "high",
      });
    }

    return result;
  }

  // Validar conta
  async validateAccount(
    account: Account,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const criticalIssues: CriticalIssue[] = [];

    // Validações básicas
    if (!account.name || account.name.trim().length === 0) {
      errors.push({
        id: this.generateId(),
        type: "REQUIRED_FIELD",
        severity: "HIGH",
        field: "name",
        message: "Nome da conta é obrigatório",
        suggestion: "Informe um nome descritivo para a conta",
      });
    }

    if (!account.type) {
      errors.push({
        id: this.generateId(),
        type: "REQUIRED_FIELD",
        severity: "HIGH",
        field: "type",
        message: "Tipo da conta é obrigatório",
        suggestion:
          "Selecione um tipo válido (checking, savings, credit, etc.)",
      });
    }

    // Validar saldo inicial
    if (account.balance === undefined || account.balance === null) {
      errors.push({
        id: this.generateId(),
        type: "REQUIRED_FIELD",
        severity: "MEDIUM",
        field: "balance",
        message: "Saldo inicial é obrigatório",
        suggestion: "Informe o saldo inicial da conta (pode ser 0)",
      });
    }

    // Validar duplicatas
    const existingAccounts = accounts;
    const duplicate = existingAccounts.find(
      (acc) =>
        acc.id !== account.id &&
        acc.name.toLowerCase() === account.name.toLowerCase(),
    );

    if (duplicate) {
      if (this.config.strictMode) {
        errors.push({
          id: this.generateId(),
          type: "DUPLICATE_DATA",
          severity: "HIGH",
          field: "name",
          message: `Já existe uma conta com o nome "${account.name}"`,
          suggestion: "Use um nome único para a conta",
          relatedData: { duplicateId: duplicate.id },
        });
      } else {
        warnings.push({
          id: this.generateId(),
          type: "POTENTIAL_DUPLICATE",
          message: `Possível conta duplicada: "${account.name}"`,
          suggestion: "Verifique se não é uma conta duplicada",
          impact: "MEDIUM",
        });
      }
    }

    // Validar limites de crédito
    if (
      account.type === "credit" &&
      account.creditLimit &&
      account.creditLimit < 0
    ) {
      errors.push({
        id: this.generateId(),
        type: "BUSINESS_RULE",
        severity: "MEDIUM",
        field: "creditLimit",
        message: "Limite de crédito não pode ser negativo",
        suggestion: "Informe um valor positivo ou zero",
      });
    }

    // Validar consistência de saldo
    if (this.config.balanceValidation && context.operation !== "CREATE") {
      const calculatedBalance = await this.calculateAccountBalance(
        account.name,
      );
      const difference = Math.abs(account.balance - calculatedBalance);

      if (difference > 0.01) {
        // Tolerância de 1 centavo
        criticalIssues.push({
          id: this.generateId(),
          type: "BALANCE_INCONSISTENCY",
          description: `Saldo da conta "${account.name}" inconsistente`,
          affectedData: [account.id],
          autoFixAvailable: true,
          fixAction: `Corrigir saldo de ${account.balance} para ${calculatedBalance}`,
          priority: "HIGH",
        });
      }
    }

    const score = this.calculateValidationScore(
      errors,
      warnings,
      criticalIssues,
    );

    return {
      isValid: errors.length === 0 && criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues,
      score,
    };
  }

  // Validar sistema completo
  async validateSystemIntegrity(): Promise<IntegrityReport> {
    const startTime = Date.now();
    const userId = authService.getCurrentUser()?.id || "system";

    const validationResults: ValidationResult[] = [];
    const criticalIssues: CriticalIssue[] = [];
    const recommendations: string[] = [];
    let autoFixesApplied = 0;

    // Validar todas as transações
    const transactions = transactions;
    let validTransactions = 0;
    let invalidTransactions = 0;

    for (const transaction of transactions) {
      const context: ValidationContext = {
        operation: "UPDATE",
        entityType: "TRANSACTION",
        userId,
        timestamp: new Date().toISOString(),
      };

      const result = await this.validateTransaction(transaction, context);
      validationResults.push(result);

      if (result.isValid) {
        validTransactions++;
      } else {
        invalidTransactions++;
        criticalIssues.push(...result.criticalIssues);

        // Aplicar correções automáticas se habilitado
        if (this.config.autoFix) {
          const fixes = await this.applyAutoFixes(transaction, result);
          autoFixesApplied += fixes;
        }
      }
    }

    // Validar todas as contas
    const accounts = accounts;
    let balancedAccounts = 0;
    let unbalancedAccounts = 0;

    for (const account of accounts) {
      const context: ValidationContext = {
        operation: "UPDATE",
        entityType: "ACCOUNT",
        userId,
        timestamp: new Date().toISOString(),
      };

      const result = await this.validateAccount(account, context);
      validationResults.push(result);

      if (
        result.criticalIssues.some(
          (issue) => issue.type === "BALANCE_INCONSISTENCY",
        )
      ) {
        unbalancedAccounts++;
      } else {
        balancedAccounts++;
      }

      criticalIssues.push(...result.criticalIssues);
    }

    // Validar integridade do razão contábil
    const ledgerIntegrity = centralizedLedger.validateSystemIntegrity();
    if (!ledgerIntegrity.isValid) {
      criticalIssues.push({
        id: this.generateId(),
        type: "DATA_CORRUPTION",
        description: "Problemas de integridade no razão contábil",
        affectedData: ["ledger"],
        autoFixAvailable: false,
        priority: "IMMEDIATE",
      });
    }

    // Validar sistema de partidas dobradas
    const doubleEntryIntegrity = doubleEntrySystem.validateSystemIntegrity();
    if (!doubleEntryIntegrity.isValid) {
      criticalIssues.push({
        id: this.generateId(),
        type: "BALANCE_INCONSISTENCY",
        description: "Problemas no sistema de partidas dobradas",
        affectedData: ["double-entries"],
        autoFixAvailable: true,
        fixAction: "Rebalancear lançamentos contábeis",
        priority: "URGENT",
      });
    }

    // Detectar dados órfãos
    const orphanedEntries = await this.detectOrphanedData();
    if (orphanedEntries.length > 0) {
      criticalIssues.push({
        id: this.generateId(),
        type: "ORPHANED_DATA",
        description: `${orphanedEntries.length} registros órfãos encontrados`,
        affectedData: orphanedEntries,
        autoFixAvailable: true,
        fixAction: "Remover ou recriar vínculos",
        priority: "HIGH",
      });
    }

    // Detectar duplicatas
    const duplicates = await this.detectDuplicates();
    if (duplicates.length > 0) {
      criticalIssues.push({
        id: this.generateId(),
        type: "DUPLICATE_DATA",
        description: `${duplicates.length} registros duplicados encontrados`,
        affectedData: duplicates,
        autoFixAvailable: true,
        fixAction: "Consolidar ou remover duplicatas",
        priority: "MEDIUM",
      });
    }

    // Gerar recomendações
    if (invalidTransactions > 0) {
      recommendations.push(
        `Corrigir ${invalidTransactions} transações inválidas`,
      );
    }

    if (unbalancedAccounts > 0) {
      recommendations.push(
        `Rebalancear ${unbalancedAccounts} contas com saldos inconsistentes`,
      );
    }

    if (criticalIssues.length > 0) {
      recommendations.push("Resolver problemas críticos identificados");
    }

    if (orphanedEntries.length > 0) {
      recommendations.push("Limpar dados órfãos do sistema");
    }

    // Calcular score geral
    const totalErrors = validationResults.reduce(
      (sum, result) => sum + result.errors.length,
      0,
    );
    const totalWarnings = validationResults.reduce(
      (sum, result) => sum + result.warnings.length,
      0,
    );
    const overallScore = this.calculateSystemScore(
      totalErrors,
      totalWarnings,
      criticalIssues.length,
    );

    // Determinar status
    let status: IntegrityReport["status"] = "HEALTHY";
    if (criticalIssues.some((issue) => issue.priority === "IMMEDIATE")) {
      status = "CORRUPTED";
    } else if (criticalIssues.some((issue) => issue.priority === "URGENT")) {
      status = "CRITICAL";
    } else if (criticalIssues.length > 0 || totalErrors > 0) {
      status = "WARNING";
    }

    const report: IntegrityReport = {
      timestamp: new Date().toISOString(),
      overallScore,
      status,
      summary: {
        totalTransactions: transactions.length,
        validTransactions,
        invalidTransactions,
        totalAccounts: accounts.length,
        balancedAccounts,
        unbalancedAccounts,
        orphanedEntries: orphanedEntries.length,
        duplicateEntries: duplicates.length,
      },
      validationResults,
      criticalIssues,
      recommendations,
      autoFixesApplied,
    };

    // Log de auditoria
    if (this.config.auditLevel !== "minimal") {
      await auditLogger.log({
        action: "SYSTEM_INTEGRITY_VALIDATION",
        userId,
        details: {
          duration: Date.now() - startTime,
          overallScore,
          status,
          criticalIssues: criticalIssues.length,
          autoFixesApplied,
        },
        severity:
          status === "HEALTHY"
            ? "low"
            : status === "WARNING"
              ? "medium"
              : "high",
      });
    }

    return report;
  }

  // Aplicar correções automáticas
  async applyAutoFixes(
    transaction: Transaction,
    validation: ValidationResult,
  ): Promise<number> {
    let fixesApplied = 0;
    const userId = authService.getCurrentUser()?.id || "system";

    for (const issue of validation.criticalIssues) {
      if (!issue.autoFixAvailable) continue;

      try {
        switch (issue.type) {
          case "BALANCE_INCONSISTENCY":
            // Recalcular e corrigir saldos
            await this.fixBalanceInconsistency(transaction);
            fixesApplied++;
            break;

          case "MISSING_ENTRIES":
            // Recriar lançamentos contábeis
            await this.recreateLedgerEntries(transaction);
            fixesApplied++;
            break;

          case "ORPHANED_DATA":
            // Remover dados órfãos
            await this.removeOrphanedData(issue.affectedData);
            fixesApplied++;
            break;
        }

        // Log da correção
        if (this.config.auditLevel === "detailed") {
          await auditLogger.log({
            action: "AUTO_FIX_APPLIED",
            userId,
            details: {
              issueType: issue.type,
              transactionId: transaction.id,
              fixAction: issue.fixAction,
            },
            severity: "medium",
          });
        }
      } catch (error) {
        logComponents.error("Erro ao aplicar correção automática:", error);
      }
    }

    return fixesApplied;
  }

  // Validações específicas
  private validateRequiredFields(
    transaction: Transaction,
    errors: ValidationError[],
  ): void {
    const requiredFieldsMap = {
      description: "Descrição",
      amount: "Valor",
      type: "Tipo",
      account: "Conta",
      date: "Data",
      category: "Categoria",
    };

    for (const [field, displayName] of Object.entries(requiredFieldsMap)) {
      const value = (transaction as any)[field];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (field === "amount" && value === 0)
      ) {
        errors.push({
          id: this.generateId(),
          type: "REQUIRED_FIELD",
          severity: "HIGH",
          field,
          message: `${displayName} é obrigatória`,
          suggestion: `Preencha o campo ${displayName}`,
        });
      }
    }
  }

  private validateDataFormats(
    transaction: Transaction,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    // Validar valor
    if (transaction.amount !== undefined) {
      const amount = Math.abs(transaction.amount); // Considerar valor absoluto para validação
      if (amount <= 0 || isNaN(amount)) {
        errors.push({
          id: this.generateId(),
          type: "INVALID_FORMAT",
          severity: "HIGH",
          field: "amount",
          message: "Valor deve ser maior que zero",
          suggestion: "Informe um valor positivo válido",
        });
      }

      if (transaction.amount > 1000000) {
        warnings.push({
          id: this.generateId(),
          type: "UNUSUAL_VALUE",
          message: "Valor muito alto para uma transação",
          suggestion: "Verifique se o valor está correto",
          impact: "MEDIUM",
        });
      }
    }

    // Validar data
    if (transaction.date) {
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

      if (isNaN(transactionDate.getTime())) {
        errors.push({
          id: this.generateId(),
          type: "INVALID_FORMAT",
          severity: "HIGH",
          field: "date",
          message: "Data inválida",
          suggestion: "Use o formato YYYY-MM-DD",
        });
      } else {
        if (transactionDate < oneYearAgo) {
          warnings.push({
            id: this.generateId(),
            type: "OUTDATED_DATA",
            message: "Data da transação é muito antiga",
            suggestion: "Verifique se a data está correta",
            impact: "LOW",
          });
        }

        if (transactionDate > oneYearFromNow) {
          errors.push({
            id: this.generateId(),
            type: "INVALID_FORMAT",
            severity: "MEDIUM",
            field: "date",
            message: "Data não pode ser mais de 1 ano no futuro",
            suggestion: "Verifique a data informada",
          });
        }
      }
    }
  }

  private async validateBusinessRules(
    transaction: Transaction,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    // Validar parcelamento
    if (transaction.installments && transaction.installments > 1) {
      if (transaction.installments > 60) {
        errors.push({
          id: this.generateId(),
          type: "BUSINESS_RULE",
          severity: "MEDIUM",
          field: "installments",
          message: "Máximo de 60 parcelas permitidas",
          suggestion: "Reduza o número de parcelas",
        });
      }

      if (
        transaction.currentInstallment &&
        transaction.currentInstallment > transaction.installments
      ) {
        errors.push({
          id: this.generateId(),
          type: "BUSINESS_RULE",
          severity: "HIGH",
          field: "currentInstallment",
          message: "Parcela atual não pode ser maior que o total",
          suggestion: "Verifique os valores de parcelamento",
        });
      }
    }

    // Validar transações compartilhadas
    if (transaction.type === "shared") {
      if (!transaction.sharedWith || transaction.sharedWith.length === 0) {
        errors.push({
          id: this.generateId(),
          type: "BUSINESS_RULE",
          severity: "HIGH",
          field: "sharedWith",
          message: "Transação compartilhada deve ter participantes",
          suggestion: "Adicione pelo menos um participante",
        });
      }

      if (
        transaction.myShare &&
        (transaction.myShare <= 0 || transaction.myShare > transaction.amount)
      ) {
        errors.push({
          id: this.generateId(),
          type: "BUSINESS_RULE",
          severity: "HIGH",
          field: "myShare",
          message: "Minha parte deve estar entre 0 e o valor total",
          suggestion: "Ajuste o valor da sua parte",
        });
      }
    }
  }

  private async validateReferentialIntegrity(
    transaction: Transaction,
    errors: ValidationError[],
    criticalIssues: CriticalIssue[],
  ): Promise<void> {
    // Validar se a conta existe
    const accounts = accounts;
    const account = accounts.find(
      (acc) =>
        acc.id === transaction.account || acc.name === transaction.account,
    );

    if (!account && transaction.account) {
      errors.push({
        id: this.generateId(),
        type: "REFERENTIAL_INTEGRITY",
        severity: "HIGH",
        field: "account",
        message: `Conta não encontrada: ${transaction.account || "Conta não especificada"}`,
        suggestion: "Selecione uma conta válida ou crie a conta",
      });
    } else if (!transaction.account) {
      errors.push({
        id: this.generateId(),
        type: "REQUIRED_FIELD",
        severity: "HIGH",
        field: "account",
        message: "Conta é obrigatória",
        suggestion: "Selecione uma conta para a transação",
      });
    }

    // Validar lançamentos contábeis
    const ledgerEntries = centralizedLedger.getLedgerEntries();
    const relatedEntries = ledgerEntries.filter(
      (entry) => entry.transactionId === transaction.id,
    );

    if (relatedEntries.length === 0) {
      criticalIssues.push({
        id: this.generateId(),
        type: "MISSING_ENTRIES",
        description: `Transação sem lançamentos contábeis: ${transaction.id}`,
        affectedData: [transaction.id],
        autoFixAvailable: true,
        fixAction: "Recriar lançamentos contábeis",
        priority: "HIGH",
      });
    }
  }

  private async validateBalanceImpact(
    transaction: Transaction,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    if (transaction.type === "expense" && transaction.account) {
      const account = storage
        .getAccounts()
        .find(
          (acc) =>
            acc.id === transaction.account || acc.name === transaction.account,
        );

      if (account) {
        const transactionAmount = Math.abs(transaction.amount); // Garantir valor positivo para cálculo
        const newBalance = account.balance - transactionAmount;

        if (newBalance < 0 && account.type !== "credit") {
          if (this.config.strictMode) {
            errors.push({
              id: this.generateId(),
              type: "BUSINESS_RULE",
              severity: "HIGH",
              field: "amount",
              message: "Saldo insuficiente na conta",
              suggestion: `Saldo atual: R$ ${account.balance.toFixed(2)}. Reduza o valor ou escolha outra conta`,
            });
          } else {
            warnings.push({
              id: this.generateId(),
              type: "UNUSUAL_VALUE",
              message: "Transação resultará em saldo negativo",
              suggestion: `Saldo atual: R$ ${account.balance.toFixed(2)}. Verifique se o valor está correto`,
              impact: "MEDIUM",
            });
          }
        }
      }
    }
  }

  private async validateOperationSpecific(
    transaction: Transaction,
    context: ValidationContext,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    switch (context.operation) {
      case "CREATE":
        // Validações específicas para criação
        const duplicates = await this.findPotentialDuplicates(transaction);
        if (duplicates.length > 0) {
          warnings.push({
            id: this.generateId(),
            type: "POTENTIAL_DUPLICATE",
            message: `${duplicates.length} transações similares encontradas`,
            suggestion: "Verifique se não é uma transação duplicada",
            impact: "MEDIUM",
          });
        }
        break;

      case "UPDATE":
        // Validações específicas para atualização
        if (transaction.createdAt) {
          const createdDate = new Date(transaction.createdAt);
          const now = new Date();
          const daysDiff =
            (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysDiff > 30) {
            warnings.push({
              id: this.generateId(),
              type: "OUTDATED_DATA",
              message: "Alterando transação antiga (mais de 30 dias)",
              suggestion: "Considere criar uma nova transação de ajuste",
              impact: "LOW",
            });
          }
        }
        break;

      case "DELETE":
        // Validações específicas para exclusão
        const hasRelatedEntries = centralizedLedger
          .getLedgerEntries()
          .some((entry) => entry.transactionId === transaction.id);

        if (hasRelatedEntries) {
          warnings.push({
            id: this.generateId(),
            type: "BEST_PRACTICE",
            message: "Transação possui lançamentos contábeis",
            suggestion: "Considere estornar ao invés de deletar",
            impact: "MEDIUM",
          });
        }
        break;
    }
  }

  // Métodos auxiliares
  private async calculateAccountBalance(
    accountIdentifier: string,
  ): Promise<number> {
    // Buscar transações por ID ou nome da conta para compatibilidade
    const accounts = accounts;
    const account = accounts.find(
      (acc) => acc.id === accountIdentifier || acc.name === accountIdentifier,
    );

    if (!account) {
      return 0;
    }

    const transactions = storage
      .getTransactions()
      .filter((t) => t.account === account.id || t.account === account.name);

    let balance = 0;
    for (const transaction of transactions) {
      if (transaction.type === "income") {
        balance += transaction.amount;
      } else if (transaction.type === "expense") {
        balance -= transaction.amount;
      }
    }

    return balance;
  }

  private async findPotentialDuplicates(
    transaction: Transaction,
  ): Promise<Transaction[]> {
    const transactions = transactions;

    return transactions.filter(
      (t) =>
        t.id !== transaction.id &&
        t.amount === transaction.amount &&
        t.account === transaction.account &&
        t.date === transaction.date &&
        Math.abs(new Date(t.createdAt || "").getTime() - new Date().getTime()) <
          24 * 60 * 60 * 1000, // 24 horas
    );
  }

  private async detectOrphanedData(): Promise<string[]> {
    const orphaned: string[] = [];

    // Lançamentos contábeis órfãos
    const ledgerEntries = centralizedLedger.getLedgerEntries();
    const transactions = transactions;

    for (const entry of ledgerEntries) {
      const hasTransaction = transactions.some(
        (t) => t.id === entry.transactionId,
      );
      if (!hasTransaction) {
        orphaned.push(`ledger_entry_${entry.id}`);
      }
    }

    return orphaned;
  }

  private async detectDuplicates(): Promise<string[]> {
    const duplicates: string[] = [];
    const transactions = transactions;

    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const t1 = transactions[i];
        const t2 = transactions[j];

        if (
          t1.amount === t2.amount &&
          t1.account === t2.account &&
          t1.date === t2.date &&
          t1.description === t2.description
        ) {
          duplicates.push(t2.id);
        }
      }
    }

    return duplicates;
  }

  private async fixBalanceInconsistency(
    transaction: Transaction,
  ): Promise<void> {
    // Recalcular saldo da conta
    const calculatedBalance = await this.calculateAccountBalance(
      transaction.account,
    );
    const account = storage
      .getAccounts()
      .find(
        (acc) =>
          acc.id === transaction.account || acc.name === transaction.account,
      );

    if (account) {
      await updateAccount(account.id, { balance: calculatedBalance });
    }
  }

  private async recreateLedgerEntries(transaction: Transaction): Promise<void> {
    // Recriar lançamentos contábeis
    await centralizedLedger.createDoubleEntry(transaction);
  }

  private async removeOrphanedData(affectedData: string[]): Promise<void> {
    // Remover dados órfãos
    for (const dataId of affectedData) {
      if (dataId.startsWith("ledger_entry_")) {
        const entryId = dataId.replace("ledger_entry_", "");
        // Implementar remoção de lançamento órfão
      }
    }
  }

  private calculateValidationScore(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    criticalIssues: CriticalIssue[],
  ): number {
    let score = 100;

    // Penalizar por erros
    for (const error of errors) {
      switch (error.severity) {
        case "CRITICAL":
          score -= 25;
          break;
        case "HIGH":
          score -= 15;
          break;
        case "MEDIUM":
          score -= 10;
          break;
        case "LOW":
          score -= 5;
          break;
      }
    }

    // Penalizar por avisos
    for (const warning of warnings) {
      switch (warning.impact) {
        case "HIGH":
          score -= 5;
          break;
        case "MEDIUM":
          score -= 3;
          break;
        case "LOW":
          score -= 1;
          break;
      }
    }

    // Penalizar por problemas críticos
    for (const issue of criticalIssues) {
      switch (issue.priority) {
        case "IMMEDIATE":
          score -= 50;
          break;
        case "URGENT":
          score -= 30;
          break;
        case "HIGH":
          score -= 20;
          break;
        case "MEDIUM":
          score -= 10;
          break;
      }
    }

    return Math.max(0, score);
  }

  private calculateSystemScore(
    errors: number,
    warnings: number,
    criticalIssues: number,
  ): number {
    let score = 100;

    score -= errors * 5;
    score -= warnings * 2;
    score -= criticalIssues * 15;

    return Math.max(0, score);
  }

  private setupRealTimeValidation(): void {
    if (typeof window !== "undefined") {
      window.addEventListener(
        "storageChange",
        this.handleStorageChange.bind(this),
      );
    }
  }

  private teardownRealTimeValidation(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "storageChange",
        this.handleStorageChange.bind(this),
      );
    }
  }

  private async handleStorageChange(event: CustomEvent): Promise<void> {
    if (!this.config.realTimeValidation) return;

    const { key } = event.detail;

    if (key.startsWith("sua-grana-")) {
      // Limpar cache relacionado
      this.clearValidationCache();

      // Executar validação em background se necessário
      if (this.config.auditLevel === "detailed") {
        setTimeout(() => this.validateSystemIntegrity(), 1000);
      }
    }
  }

  private getCachedResult(key: string): ValidationResult | null {
    const cached = this.validationCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCachedResult(key: string, result: ValidationResult): void {
    this.validationCache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private clearValidationCache(): void {
    this.validationCache.clear();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const dataValidationLayer = new DataValidationLayer();
