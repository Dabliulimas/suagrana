"use client";

import { storage, type Transaction, type Account } from "./storage";
import { auditLogger } from "./audit";
import { authService } from "./auth";
import { accountingSystem, type AccountingEntry } from "./accounting-system";

// Plano de Contas Estruturado seguindo padrões contábeis brasileiros
export interface ChartOfAccounts {
  code: string;
  name: string;
  type: "ATIVO" | "PASSIVO" | "PATRIMONIO_LIQUIDO" | "RECEITA" | "DESPESA";
  subtype: string;
  level: number;
  parent?: string;
  isActive: boolean;
  acceptsLaunches: boolean;
  nature: "DEVEDORA" | "CREDORA";
}

// Lançamento Contábil Aprimorado
export interface EnhancedAccountingEntry {
  id: string;
  transactionId: string;
  batchId: string; // Para agrupar lançamentos da mesma operação
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  complement?: string;
  date: string;
  dueDate?: string;
  documentNumber?: string;
  documentType?: string;
  costCenter?: string;
  project?: string;
  createdAt: string;
  createdBy: string;
  status: "PROVISORIO" | "DEFINITIVO" | "CANCELADO";
  validatedAt?: string;
  validatedBy?: string;
}

// Balancete Aprimorado
export interface EnhancedTrialBalance {
  period: { start: string; end: string };
  accounts: Record<
    string,
    {
      code: string;
      name: string;
      type: string;
      previousBalance: number;
      debitMovements: number;
      creditMovements: number;
      currentBalance: number;
      nature: "DEVEDORA" | "CREDORA";
    }
  >;
  totals: {
    previousBalance: number;
    debitMovements: number;
    creditMovements: number;
    currentBalance: number;
  };
  isBalanced: boolean;
  generatedAt: string;
}

// Demonstrações Contábeis
export interface BalanceSheet {
  period: { start: string; end: string };
  assets: {
    current: Record<string, number>;
    nonCurrent: Record<string, number>;
    total: number;
  };
  liabilities: {
    current: Record<string, number>;
    nonCurrent: Record<string, number>;
    total: number;
  };
  equity: {
    capital: number;
    reserves: number;
    retainedEarnings: number;
    total: number;
  };
  isBalanced: boolean;
  generatedAt: string;
}

export interface IncomeStatement {
  period: { start: string; end: string };
  revenue: {
    operating: Record<string, number>;
    nonOperating: Record<string, number>;
    total: number;
  };
  expenses: {
    operating: Record<string, number>;
    nonOperating: Record<string, number>;
    total: number;
  };
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  generatedAt: string;
}

// Validações Contábeis
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class EnhancedAccountingSystem {
  private chartOfAccounts: ChartOfAccounts[] = [];

  constructor() {
    this.initializeChartOfAccounts();
  }

  // Inicializar Plano de Contas padrão
  private initializeChartOfAccounts() {
    const defaultAccounts: ChartOfAccounts[] = [
      // ATIVO
      {
        code: "1",
        name: "ATIVO",
        type: "ATIVO",
        subtype: "GRUPO",
        level: 1,
        isActive: true,
        acceptsLaunches: false,
        nature: "DEVEDORA",
      },
      {
        code: "1.1",
        name: "ATIVO CIRCULANTE",
        type: "ATIVO",
        subtype: "SUBGRUPO",
        level: 2,
        parent: "1",
        isActive: true,
        acceptsLaunches: false,
        nature: "DEVEDORA",
      },
      {
        code: "1.1.1",
        name: "DISPONIBILIDADES",
        type: "ATIVO",
        subtype: "CONTA",
        level: 3,
        parent: "1.1",
        isActive: true,
        acceptsLaunches: false,
        nature: "DEVEDORA",
      },
      {
        code: "1.1.1.001",
        name: "CAIXA",
        type: "ATIVO",
        subtype: "SUBCONTA",
        level: 4,
        parent: "1.1.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },
      {
        code: "1.1.1.002",
        name: "BANCOS CONTA MOVIMENTO",
        type: "ATIVO",
        subtype: "SUBCONTA",
        level: 4,
        parent: "1.1.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },
      {
        code: "1.1.1.003",
        name: "APLICAÇÕES FINANCEIRAS",
        type: "ATIVO",
        subtype: "SUBCONTA",
        level: 4,
        parent: "1.1.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },

      // PASSIVO
      {
        code: "2",
        name: "PASSIVO",
        type: "PASSIVO",
        subtype: "GRUPO",
        level: 1,
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "2.1",
        name: "PASSIVO CIRCULANTE",
        type: "PASSIVO",
        subtype: "SUBGRUPO",
        level: 2,
        parent: "2",
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "2.1.1",
        name: "OBRIGAÇÕES TRABALHISTAS",
        type: "PASSIVO",
        subtype: "CONTA",
        level: 3,
        parent: "2.1",
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "2.1.2",
        name: "FORNECEDORES",
        type: "PASSIVO",
        subtype: "CONTA",
        level: 3,
        parent: "2.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },
      {
        code: "2.1.3",
        name: "EMPRÉSTIMOS E FINANCIAMENTOS",
        type: "PASSIVO",
        subtype: "CONTA",
        level: 3,
        parent: "2.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },

      // PATRIMÔNIO LÍQUIDO
      {
        code: "3",
        name: "PATRIMÔNIO LÍQUIDO",
        type: "PATRIMONIO_LIQUIDO",
        subtype: "GRUPO",
        level: 1,
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "3.1",
        name: "CAPITAL SOCIAL",
        type: "PATRIMONIO_LIQUIDO",
        subtype: "CONTA",
        level: 2,
        parent: "3",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },
      {
        code: "3.2",
        name: "RESERVAS",
        type: "PATRIMONIO_LIQUIDO",
        subtype: "CONTA",
        level: 2,
        parent: "3",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },
      {
        code: "3.3",
        name: "LUCROS ACUMULADOS",
        type: "PATRIMONIO_LIQUIDO",
        subtype: "CONTA",
        level: 2,
        parent: "3",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },

      // RECEITAS
      {
        code: "4",
        name: "RECEITAS",
        type: "RECEITA",
        subtype: "GRUPO",
        level: 1,
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "4.1",
        name: "RECEITAS OPERACIONAIS",
        type: "RECEITA",
        subtype: "SUBGRUPO",
        level: 2,
        parent: "4",
        isActive: true,
        acceptsLaunches: false,
        nature: "CREDORA",
      },
      {
        code: "4.1.1",
        name: "RECEITAS DE VENDAS",
        type: "RECEITA",
        subtype: "CONTA",
        level: 3,
        parent: "4.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },
      {
        code: "4.1.2",
        name: "RECEITAS DE SERVIÇOS",
        type: "RECEITA",
        subtype: "CONTA",
        level: 3,
        parent: "4.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },
      {
        code: "4.2",
        name: "RECEITAS FINANCEIRAS",
        type: "RECEITA",
        subtype: "CONTA",
        level: 2,
        parent: "4",
        isActive: true,
        acceptsLaunches: true,
        nature: "CREDORA",
      },

      // DESPESAS
      {
        code: "5",
        name: "DESPESAS",
        type: "DESPESA",
        subtype: "GRUPO",
        level: 1,
        isActive: true,
        acceptsLaunches: false,
        nature: "DEVEDORA",
      },
      {
        code: "5.1",
        name: "DESPESAS OPERACIONAIS",
        type: "DESPESA",
        subtype: "SUBGRUPO",
        level: 2,
        parent: "5",
        isActive: true,
        acceptsLaunches: false,
        nature: "DEVEDORA",
      },
      {
        code: "5.1.1",
        name: "DESPESAS ADMINISTRATIVAS",
        type: "DESPESA",
        subtype: "CONTA",
        level: 3,
        parent: "5.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },
      {
        code: "5.1.2",
        name: "DESPESAS COMERCIAIS",
        type: "DESPESA",
        subtype: "CONTA",
        level: 3,
        parent: "5.1",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },
      {
        code: "5.2",
        name: "DESPESAS FINANCEIRAS",
        type: "DESPESA",
        subtype: "CONTA",
        level: 2,
        parent: "5",
        isActive: true,
        acceptsLaunches: true,
        nature: "DEVEDORA",
      },
    ];

    this.chartOfAccounts = this.loadChartOfAccounts() || defaultAccounts;
    this.saveChartOfAccounts();
  }

  // Validação rigorosa de partida dobrada
  private validateDoubleEntry(
    entries: EnhancedAccountingEntry[],
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Verificar se há pelo menos 2 lançamentos
    if (entries.length < 2) {
      errors.push(
        "Lançamento deve ter pelo menos 2 entradas (débito e crédito)",
      );
    }

    // 2. Verificar se débitos = créditos
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(
        `Débitos (${totalDebits.toFixed(2)}) não conferem com créditos (${totalCredits.toFixed(2)})`,
      );
    }

    // 3. Verificar se cada entrada tem apenas débito OU crédito
    entries.forEach((entry, index) => {
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(
          `Entrada ${index + 1}: não pode ter débito E crédito simultaneamente`,
        );
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(`Entrada ${index + 1}: deve ter débito OU crédito`);
      }
      if (entry.debit < 0 || entry.credit < 0) {
        errors.push(`Entrada ${index + 1}: valores não podem ser negativos`);
      }
    });

    // 4. Verificar se as contas existem no plano de contas
    entries.forEach((entry, index) => {
      const account = this.chartOfAccounts.find(
        (acc) => acc.code === entry.accountCode,
      );
      if (!account) {
        errors.push(
          `Entrada ${index + 1}: conta ${entry.accountCode} não existe no plano de contas`,
        );
      } else if (!account.acceptsLaunches) {
        errors.push(
          `Entrada ${index + 1}: conta ${entry.accountCode} não aceita lançamentos`,
        );
      } else if (!account.isActive) {
        warnings.push(
          `Entrada ${index + 1}: conta ${entry.accountCode} está inativa`,
        );
      }
    });

    // 5. Verificar datas
    entries.forEach((entry, index) => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const futureLimit = new Date();
      futureLimit.setMonth(futureLimit.getMonth() + 3);

      if (entryDate > futureLimit) {
        warnings.push(
          `Entrada ${index + 1}: data muito no futuro (${entry.date})`,
        );
      }

      if (entryDate < new Date("2020-01-01")) {
        warnings.push(
          `Entrada ${index + 1}: data muito antiga (${entry.date})`,
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Criar lançamento contábil aprimorado
  async createEnhancedDoubleEntry(
    transaction: Transaction,
    customEntries?: Partial<EnhancedAccountingEntry>[],
  ): Promise<{
    success: boolean;
    entries?: EnhancedAccountingEntry[];
    validation?: ValidationResult;
    error?: string;
  }> {
    try {
      const batchId = this.generateId();
      const userId = authService.getCurrentUser()?.id || "system";

      let entries: EnhancedAccountingEntry[];

      if (customEntries && customEntries.length > 0) {
        // Usar lançamentos customizados
        entries = customEntries.map((entry) => ({
          id: this.generateId(),
          transactionId: transaction.id,
          batchId,
          accountCode: entry.accountCode || "",
          accountName: entry.accountName || "",
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          description: entry.description || transaction.description,
          complement: entry.complement,
          date: entry.date || transaction.date,
          dueDate: entry.dueDate,
          documentNumber: entry.documentNumber,
          documentType: entry.documentType,
          costCenter: entry.costCenter,
          project: entry.project,
          createdAt: this.getTimestamp(),
          createdBy: userId,
          status: "PROVISORIO",
          ...entry,
        }));
      } else {
        // Gerar lançamentos automáticos
        entries = this.generateAutomaticEntries(transaction, batchId, userId);
      }

      // Validar lançamentos
      const validation = this.validateDoubleEntry(entries);

      if (!validation.isValid) {
        return {
          success: false,
          validation,
          error: `Validação falhou: ${validation.errors.join(", ")}`,
        };
      }

      // Salvar lançamentos
      this.saveEnhancedAccountingEntries(entries);

      // Log de auditoria
      await auditLogger.log({
        action: "ENHANCED_DOUBLE_ENTRY_CREATED",
        userId,
        details: {
          transactionId: transaction.id,
          batchId,
          entriesCount: entries.length,
          totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
          totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
          validation: {
            errors: validation.errors.length,
            warnings: validation.warnings.length,
          },
        },
        severity: validation.warnings.length > 0 ? "medium" : "low",
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

  // Gerar lançamentos automáticos baseados na transação
  private generateAutomaticEntries(
    transaction: Transaction,
    batchId: string,
    userId: string,
  ): EnhancedAccountingEntry[] {
    const entries: EnhancedAccountingEntry[] = [];
    const account = storage
      .getAccounts()
      .find((a) => a.name === transaction.account);

    if (!account) {
      throw new Error(`Conta não encontrada: ${transaction.account}`);
    }

    // Mapear conta do sistema para plano de contas
    const accountCode = this.mapAccountToChartOfAccounts(account);
    const contraAccountCode = this.getContraAccountCode(transaction);

    const baseEntry = {
      transactionId: transaction.id,
      batchId,
      description: transaction.description,
      date: transaction.date,
      createdAt: this.getTimestamp(),
      createdBy: userId,
      status: "PROVISORIO" as const,
    };

    // Lançamento principal
    if (transaction.type === "income") {
      // Receita: Débito na conta (aumenta ativo) / Crédito em receita
      entries.push({
        ...baseEntry,
        id: this.generateId(),
        accountCode,
        accountName: account.name,
        debit: transaction.amount,
        credit: 0,
      });

      entries.push({
        ...baseEntry,
        id: this.generateId(),
        accountCode: contraAccountCode,
        accountName: this.getAccountName(contraAccountCode),
        debit: 0,
        credit: transaction.amount,
      });
    } else if (transaction.type === "expense") {
      // Despesa: Débito em despesa / Crédito na conta (diminui ativo)
      entries.push({
        ...baseEntry,
        id: this.generateId(),
        accountCode: contraAccountCode,
        accountName: this.getAccountName(contraAccountCode),
        debit: transaction.amount,
        credit: 0,
      });

      entries.push({
        ...baseEntry,
        id: this.generateId(),
        accountCode,
        accountName: account.name,
        debit: 0,
        credit: transaction.amount,
      });
    }

    return entries;
  }

  // Mapear conta do sistema para plano de contas
  private mapAccountToChartOfAccounts(account: Account): string {
    switch (account.type) {
      case "checking":
        return "1.1.1.002"; // BANCOS CONTA MOVIMENTO
      case "savings":
        return "1.1.1.003"; // APLICAÇÕES FINANCEIRAS
      case "investment":
        return "1.1.1.003"; // APLICAÇÕES FINANCEIRAS
      case "credit":
        return "2.1.3"; // EMPRÉSTIMOS E FINANCIAMENTOS
      default:
        return "1.1.1.001"; // CAIXA
    }
  }

  // Obter código da conta de contrapartida
  private getContraAccountCode(transaction: Transaction): string {
    if (transaction.type === "income") {
      // Mapear categoria para conta de receita
      switch (transaction.category?.toLowerCase()) {
        case "salary":
        case "salário":
          return "4.1.2"; // RECEITAS DE SERVIÇOS
        case "investment":
        case "investimento":
          return "4.2"; // RECEITAS FINANCEIRAS
        default:
          return "4.1.1"; // RECEITAS DE VENDAS
      }
    } else {
      // Mapear categoria para conta de despesa
      switch (transaction.category?.toLowerCase()) {
        case "food":
        case "alimentação":
          return "5.1.1"; // DESPESAS ADMINISTRATIVAS
        case "transport":
        case "transporte":
          return "5.1.1"; // DESPESAS ADMINISTRATIVAS
        case "entertainment":
        case "lazer":
          return "5.1.2"; // DESPESAS COMERCIAIS
        default:
          return "5.1.1"; // DESPESAS ADMINISTRATIVAS
      }
    }
  }

  // Obter nome da conta pelo código
  private getAccountName(code: string): string {
    const account = this.chartOfAccounts.find((acc) => acc.code === code);
    return account?.name || "Conta não encontrada";
  }

  // Gerar balancete aprimorado
  generateEnhancedTrialBalance(
    startDate?: string,
    endDate?: string,
  ): EnhancedTrialBalance {
    const entries = this.getEnhancedAccountingEntries();
    const period = {
      start: startDate || this.getFirstEntryDate(),
      end: endDate || this.getTimestamp().split("T")[0],
    };

    // Filtrar entradas por período
    const filteredEntries = entries.filter((entry) => {
      const entryDate = entry.date;
      return entryDate >= period.start && entryDate <= period.end;
    });

    const accounts: Record<string, any> = {};
    let totalPreviousBalance = 0;
    let totalDebitMovements = 0;
    let totalCreditMovements = 0;
    let totalCurrentBalance = 0;

    // Processar cada conta do plano de contas
    this.chartOfAccounts.forEach((chartAccount) => {
      if (!chartAccount.acceptsLaunches) return;

      const accountEntries = filteredEntries.filter(
        (entry) => entry.accountCode === chartAccount.code,
      );
      const previousEntries = entries.filter(
        (entry) =>
          entry.accountCode === chartAccount.code && entry.date < period.start,
      );

      // Calcular saldo anterior
      const previousBalance = previousEntries.reduce((sum, entry) => {
        return chartAccount.nature === "DEVEDORA"
          ? sum + entry.debit - entry.credit
          : sum + entry.credit - entry.debit;
      }, 0);

      // Calcular movimentações do período
      const debitMovements = accountEntries.reduce(
        (sum, entry) => sum + entry.debit,
        0,
      );
      const creditMovements = accountEntries.reduce(
        (sum, entry) => sum + entry.credit,
        0,
      );

      // Calcular saldo atual
      const currentBalance =
        chartAccount.nature === "DEVEDORA"
          ? previousBalance + debitMovements - creditMovements
          : previousBalance + creditMovements - debitMovements;

      if (
        previousBalance !== 0 ||
        debitMovements !== 0 ||
        creditMovements !== 0 ||
        currentBalance !== 0
      ) {
        accounts[chartAccount.code] = {
          code: chartAccount.code,
          name: chartAccount.name,
          type: chartAccount.type,
          previousBalance,
          debitMovements,
          creditMovements,
          currentBalance,
          nature: chartAccount.nature,
        };

        totalPreviousBalance += Math.abs(previousBalance);
        totalDebitMovements += debitMovements;
        totalCreditMovements += creditMovements;
        totalCurrentBalance += Math.abs(currentBalance);
      }
    });

    return {
      period,
      accounts,
      totals: {
        previousBalance: totalPreviousBalance,
        debitMovements: totalDebitMovements,
        creditMovements: totalCreditMovements,
        currentBalance: totalCurrentBalance,
      },
      isBalanced: Math.abs(totalDebitMovements - totalCreditMovements) < 0.01,
      generatedAt: this.getTimestamp(),
    };
  }

  // Gerar Balanço Patrimonial
  generateBalanceSheet(date?: string): BalanceSheet {
    const balanceDate = date || this.getTimestamp().split("T")[0];
    const entries = this.getEnhancedAccountingEntries().filter(
      (entry) => entry.date <= balanceDate,
    );

    const assets = { current: {}, nonCurrent: {}, total: 0 };
    const liabilities = { current: {}, nonCurrent: {}, total: 0 };
    const equity = { capital: 0, reserves: 0, retainedEarnings: 0, total: 0 };

    // Processar contas de ativo
    this.chartOfAccounts
      .filter((acc) => acc.type === "ATIVO" && acc.acceptsLaunches)
      .forEach((account) => {
        const accountEntries = entries.filter(
          (entry) => entry.accountCode === account.code,
        );
        const balance = accountEntries.reduce(
          (sum, entry) => sum + entry.debit - entry.credit,
          0,
        );

        if (balance !== 0) {
          if (account.code.startsWith("1.1")) {
            assets.current[account.name] = balance;
          } else {
            assets.nonCurrent[account.name] = balance;
          }
          assets.total += balance;
        }
      });

    // Processar contas de passivo
    this.chartOfAccounts
      .filter((acc) => acc.type === "PASSIVO" && acc.acceptsLaunches)
      .forEach((account) => {
        const accountEntries = entries.filter(
          (entry) => entry.accountCode === account.code,
        );
        const balance = accountEntries.reduce(
          (sum, entry) => sum + entry.credit - entry.debit,
          0,
        );

        if (balance !== 0) {
          if (account.code.startsWith("2.1")) {
            liabilities.current[account.name] = balance;
          } else {
            liabilities.nonCurrent[account.name] = balance;
          }
          liabilities.total += balance;
        }
      });

    // Processar patrimônio líquido
    this.chartOfAccounts
      .filter((acc) => acc.type === "PATRIMONIO_LIQUIDO" && acc.acceptsLaunches)
      .forEach((account) => {
        const accountEntries = entries.filter(
          (entry) => entry.accountCode === account.code,
        );
        const balance = accountEntries.reduce(
          (sum, entry) => sum + entry.credit - entry.debit,
          0,
        );

        if (balance !== 0) {
          if (account.code === "3.1") {
            equity.capital = balance;
          } else if (account.code === "3.2") {
            equity.reserves = balance;
          } else if (account.code === "3.3") {
            equity.retainedEarnings = balance;
          }
          equity.total += balance;
        }
      });

    return {
      period: { start: this.getFirstEntryDate(), end: balanceDate },
      assets,
      liabilities,
      equity,
      isBalanced:
        Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01,
      generatedAt: this.getTimestamp(),
    };
  }

  // Gerar Demonstração de Resultado
  generateIncomeStatement(
    startDate?: string,
    endDate?: string,
  ): IncomeStatement {
    const period = {
      start: startDate || this.getFirstEntryDate(),
      end: endDate || this.getTimestamp().split("T")[0],
    };

    const entries = this.getEnhancedAccountingEntries().filter(
      (entry) => entry.date >= period.start && entry.date <= period.end,
    );

    const revenue = { operating: {}, nonOperating: {}, total: 0 };
    const expenses = { operating: {}, nonOperating: {}, total: 0 };

    // Processar receitas
    this.chartOfAccounts
      .filter((acc) => acc.type === "RECEITA" && acc.acceptsLaunches)
      .forEach((account) => {
        const accountEntries = entries.filter(
          (entry) => entry.accountCode === account.code,
        );
        const balance = accountEntries.reduce(
          (sum, entry) => sum + entry.credit - entry.debit,
          0,
        );

        if (balance !== 0) {
          if (account.code.startsWith("4.1")) {
            revenue.operating[account.name] = balance;
          } else {
            revenue.nonOperating[account.name] = balance;
          }
          revenue.total += balance;
        }
      });

    // Processar despesas
    this.chartOfAccounts
      .filter((acc) => acc.type === "DESPESA" && acc.acceptsLaunches)
      .forEach((account) => {
        const accountEntries = entries.filter(
          (entry) => entry.accountCode === account.code,
        );
        const balance = accountEntries.reduce(
          (sum, entry) => sum + entry.debit - entry.credit,
          0,
        );

        if (balance !== 0) {
          if (account.code.startsWith("5.1")) {
            expenses.operating[account.name] = balance;
          } else {
            expenses.nonOperating[account.name] = balance;
          }
          expenses.total += balance;
        }
      });

    const grossProfit = revenue.total - expenses.total;
    const operatingProfit =
      Object.values(revenue.operating).reduce((sum, val) => sum + val, 0) -
      Object.values(expenses.operating).reduce((sum, val) => sum + val, 0);
    const netProfit = grossProfit;

    return {
      period,
      revenue,
      expenses,
      grossProfit,
      operatingProfit,
      netProfit,
      generatedAt: this.getTimestamp(),
    };
  }

  // Métodos auxiliares
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private getFirstEntryDate(): string {
    const entries = this.getEnhancedAccountingEntries();
    if (entries.length === 0) return new Date().toISOString().split("T")[0];

    return entries.reduce(
      (earliest, entry) => (entry.date < earliest ? entry.date : earliest),
      entries[0].date,
    );
  }

  // Persistência
  private saveEnhancedAccountingEntries(
    entries: EnhancedAccountingEntry[],
  ): void {
    if (typeof window === "undefined") return;

    const existingEntries = this.getEnhancedAccountingEntries();
    const updatedEntries = [...existingEntries, ...entries];
    localStorage.setItem(
      "sua-grana-enhanced-accounting-entries",
      JSON.stringify(updatedEntries),
    );
  }

  getEnhancedAccountingEntries(): EnhancedAccountingEntry[] {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem("sua-grana-enhanced-accounting-entries");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    return data ? JSON.parse(data) : [];
  }

  private saveChartOfAccounts(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "sua-grana-chart-of-accounts",
      JSON.stringify(this.chartOfAccounts),
    );
  }

  private loadChartOfAccounts(): ChartOfAccounts[] | null {
    if (typeof window === "undefined") return null;

    const data = localStorage.getItem("sua-grana-chart-of-accounts");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    return data ? JSON.parse(data) : null;
  }

  // Getters públicos
  getChartOfAccounts(): ChartOfAccounts[] {
    return this.chartOfAccounts;
  }

  getAccountByCode(code: string): ChartOfAccounts | undefined {
    return this.chartOfAccounts.find((acc) => acc.code === code);
  }

  // Migração do sistema antigo
  async migrateFromOldSystem(): Promise<{
    success: boolean;
    migrated: number;
    error?: string;
  }> {
    try {
      const oldEntries = accountingSystem.getAccountingEntries();
      let migrated = 0;

      for (const oldEntry of oldEntries) {
        // Verificar se já foi migrado
        const existingEntry = this.getEnhancedAccountingEntries().find(
          (entry) => entry.transactionId === oldEntry.transactionId,
        );

        if (!existingEntry) {
          // Converter para formato aprimorado
          const enhancedEntry: EnhancedAccountingEntry = {
            id: this.generateId(),
            transactionId: oldEntry.transactionId,
            batchId: this.generateId(),
            accountCode: this.mapOldAccountToCode(oldEntry.accountName),
            accountName: oldEntry.accountName,
            debit: oldEntry.debit,
            credit: oldEntry.credit,
            description: oldEntry.description,
            date: oldEntry.date,
            createdAt: oldEntry.createdAt,
            createdBy: "migration",
            status: "DEFINITIVO",
          };

          this.saveEnhancedAccountingEntries([enhancedEntry]);
          migrated++;
        }
      }

      return { success: true, migrated };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        error: error instanceof Error ? error.message : "Erro na migração",
      };
    }
  }

  private mapOldAccountToCode(accountName: string): string {
    // Mapear nomes antigos para códigos do plano de contas
    const mapping: Record<string, string> = {
      Caixa: "1.1.1.001",
      Banco: "1.1.1.002",
      Poupança: "1.1.1.003",
      "Cartão de Crédito": "2.1.3",
      Receitas: "4.1.1",
      Despesas: "5.1.1",
    };

    return mapping[accountName] || "1.1.1.001";
  }
}

export const enhancedAccountingSystem = new EnhancedAccountingSystem();
