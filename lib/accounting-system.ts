import { storage, type Transaction, type Account } from "./storage";
import { auditLogger } from "./audit";
import { authService } from "./auth";

export interface AccountingEntry {
  id: string;
  transactionId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface BalanceSheet {
  assets: Record<string, number>;
  liabilities: Record<string, number>;
  equity: Record<string, number>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

class AccountingSystem {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  // Implementa os princípios de débito e crédito
  async createDoubleEntry(
    transaction: Transaction,
    contraAccount?: string,
  ): Promise<{
    success: boolean;
    entries?: AccountingEntry[];
    error?: string;
  }> {
    try {
      const entries: AccountingEntry[] = [];
      const account = storage
        .getAccounts()
        .find((a) => a.name === transaction.account);

      if (!account) {
        return {
          success: false,
          error: `Conta não encontrada: ${transaction.account}`,
        };
      }

      // Regras de débito e crédito baseadas no tipo de conta e transação
      const mainEntry = this.createAccountingEntry(
        transaction,
        account,
        transaction.amount,
      );
      entries.push(mainEntry);

      // Criar entrada de contrapartida
      if (contraAccount) {
        const contraAcc = storage
          .getAccounts()
          .find((a) => a.name === contraAccount);
        if (contraAcc) {
          const contraEntry = this.createAccountingEntry(
            transaction,
            contraAcc,
            transaction.amount,
            true, // é contrapartida
          );
          entries.push(contraEntry);
        }
      } else {
        // Criar conta de contrapartida automática baseada na categoria
        const autoContraEntry = this.createAutoContraEntry(transaction);
        entries.push(autoContraEntry);
      }

      // Salvar entradas contábeis
      this.saveAccountingEntries(entries);

      await auditLogger.log({
        action: "DOUBLE_ENTRY_CREATED",
        userId: authService.getCurrentUser()?.id,
        details: {
          transactionId: transaction.id,
          entriesCount: entries.length,
          totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
          totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
        },
        severity: "medium",
      });

      return { success: true, entries };
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

  private createAccountingEntry(
    transaction: Transaction,
    account: Account,
    amount: number,
    isContra: boolean = false,
  ): AccountingEntry {
    let debit = 0;
    let credit = 0;

    // Aplicar regras de débito e crédito
    if (account.type === "checking" || account.type === "savings") {
      // Contas de ativo (Caixa/Bancos): débito aumenta, crédito diminui
      if (transaction.type === "income") {
        // Receita: Débito na conta (aumenta ativo)
        if (!isContra) {
          debit = amount; // Recebimento aumenta o ativo
        } else {
          credit = amount; // Contrapartida da receita
        }
      } else {
        // Despesa: Crédito na conta (diminui ativo)
        if (!isContra) {
          credit = amount; // Pagamento diminui o ativo
        } else {
          debit = amount; // Contrapartida da despesa
        }
      }
    } else if (account.type === "credit") {
      // Contas de passivo (Cartão de Crédito): crédito aumenta, débito diminui
      if (transaction.type === "expense") {
        // Despesa no cartão: Crédito na conta (aumenta passivo)
        if (!isContra) {
          credit = amount; // Gasto no cartão aumenta o passivo
        } else {
          debit = amount; // Contrapartida da despesa
        }
      } else {
        // Receita no cartão (pagamento): Débito na conta (diminui passivo)
        if (!isContra) {
          debit = amount; // Pagamento do cartão diminui o passivo
        } else {
          credit = amount; // Contrapartida do pagamento
        }
      }
    }

    return {
      id: this.generateId(),
      transactionId: transaction.id,
      accountName: account.name,
      debit,
      credit,
      description: transaction.description,
      date: transaction.date,
      createdAt: this.getTimestamp(),
    };
  }

  private createAutoContraEntry(transaction: Transaction): AccountingEntry {
    let contraAccountName: string;
    let debit = 0;
    let credit = 0;

    // Definir conta de contrapartida baseada na categoria
    // Para contrapartidas:
    // Receita: Crédito em "Receitas" (aumenta receita)
    // Despesa: Débito em "Despesas" (aumenta despesa)
    if (transaction.type === "income") {
      contraAccountName = "Receitas";
      credit = transaction.amount; // Receitas são creditadas
    } else {
      contraAccountName = `Despesas - ${transaction.category}`;
      debit = transaction.amount; // Despesas são debitadas
    }

    return {
      id: this.generateId(),
      transactionId: transaction.id,
      accountName: contraAccountName,
      debit,
      credit,
      description: transaction.description,
      date: transaction.date,
      createdAt: this.getTimestamp(),
    };
  }

  private saveAccountingEntries(entries: AccountingEntry[]): void {
    if (typeof window === "undefined") return;

    const existingEntries = this.getAccountingEntries();
    const updatedEntries = [...existingEntries, ...entries];
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(
        "sua-grana-accounting-entries",
        JSON.stringify(updatedEntries),
      );
    }
  }

  getAccountingEntries(): AccountingEntry[] {
    if (typeof window === "undefined") return [];

    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    const data = localStorage.getItem("sua-grana-accounting-entries");
    return data ? JSON.parse(data) : [];
  }

  // Calcular saldo correto baseado nos lançamentos contábeis
  calculateAccountBalance(accountIdentifier: string | number): number {
    // Determinar se é ID ou nome
    let accountName: string;
    let account: any;
    
    if (typeof accountIdentifier === 'number') {
      account = storage.getAccounts().find((a) => a.id === accountIdentifier.toString());
      accountName = account?.name || '';
    } else {
      accountName = accountIdentifier;
      account = storage.getAccounts().find((a) => a.name === accountName);
    }

    if (!account) {
      // Se não encontrou a conta, tentar calcular baseado nas transações diretamente
      const transactions = storage.getTransactions();
      let balance = 0;
      
      for (const transaction of transactions) {
        // Verificar se é a conta correta (por nome ou ID)
        const matchesAccount = typeof accountIdentifier === 'number' 
          ? transaction.account === accountName // se ID, usar nome encontrado
          : transaction.account === accountIdentifier; // se nome, usar diretamente
          
        if (matchesAccount) {
          if (transaction.type === 'income') {
            balance += transaction.amount;
          } else if (transaction.type === 'expense') {
            balance += transaction.amount; // amount já é negativo para expenses
          }
        }
      }
      
      return balance;
    }

    // Se encontrou a conta, usar o sistema de entradas contábeis
    const entries = this.getAccountingEntries().filter(
      (e) => e.accountName === accountName,
    );

    let balance = 0;

    for (const entry of entries) {
      if (
        account.type === "checking" ||
        account.type === "savings" ||
        account.type === "investment"
      ) {
        // Contas de ativo: débito positivo, crédito negativo
        balance += entry.debit - entry.credit;
      } else if (account.type === "credit") {
        // Contas de passivo: crédito positivo, débito negativo
        balance += entry.credit - entry.debit;
      }
    }

    return balance;
  }

  // Gerar balancete de verificação
  generateTrialBalance(): {
    accounts: Record<string, { debit: number; credit: number }>;
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
  } {
    const entries = this.getAccountingEntries();
    const accounts: Record<string, { debit: number; credit: number }> = {};

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (!accounts[entry.accountName]) {
        accounts[entry.accountName] = { debit: 0, credit: 0 };
      }

      accounts[entry.accountName].debit += entry.debit;
      accounts[entry.accountName].credit += entry.credit;

      totalDebits += entry.debit;
      totalCredits += entry.credit;
    }

    return {
      accounts,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }

  // Corrigir saldos das contas baseado nos lançamentos contábeis
  async fixAccountBalances(): Promise<{
    success: boolean;
    corrections: number;
    error?: string;
  }> {
    try {
      const accounts = storage.getAccounts();
      let corrections = 0;

      for (const account of accounts) {
        const calculatedBalance = this.calculateAccountBalance(account.name);

        if (Math.abs(calculatedBalance - account.balance) > 0.01) {
          storage.updateAccount(account.id, { balance: calculatedBalance });
          corrections++;

          await auditLogger.log({
            action: "BALANCE_CORRECTED",
            userId: authService.getCurrentUser()?.id,
            details: {
              accountName: account.name,
              oldBalance: account.balance,
              newBalance: calculatedBalance,
              difference: calculatedBalance - account.balance,
            },
            severity: "medium",
          });
        }
      }

      return { success: true, corrections };
    } catch (error) {
      return {
        success: false,
        corrections: 0,
        error:
          error instanceof Error ? error.message : "Erro ao corrigir saldos",
      };
    }
  }

  // Migrar transações existentes para o sistema de partidas dobradas
  async migrateExistingTransactions(): Promise<{
    success: boolean;
    migrated: number;
    error?: string;
  }> {
    try {
      const transactions = storage.getTransactions();
      const existingEntries = this.getAccountingEntries();
      const existingTransactionIds = new Set(
        existingEntries.map((e) => e.transactionId),
      );

      let migrated = 0;

      for (const transaction of transactions) {
        if (!existingTransactionIds.has(transaction.id)) {
          const result = await this.createDoubleEntry(transaction);
          if (result.success) {
            migrated++;
          }
        }
      }

      await auditLogger.log({
        action: "TRANSACTIONS_MIGRATED",
        userId: authService.getCurrentUser()?.id,
        details: {
          totalTransactions: transactions.length,
          migratedTransactions: migrated,
        },
        severity: "medium",
      });

      return { success: true, migrated };
    } catch (error) {
      return {
        success: false,
        migrated: 0,
        error: error instanceof Error ? error.message : "Erro na migração",
      };
    }
  }

  // Métodos adicionais para compatibilidade com testes
  calculateAccountBalanceById(accountId: number | string): number {
    return this.calculateAccountBalance(accountId);
  }

  validateAccountBalance(accountId: number | string): boolean {
    const calculatedBalance = this.calculateAccountBalanceById(accountId);
    let storedBalance: number;
    
    if (typeof accountId === 'number') {
      const account = storage.getAccounts().find(a => a.id === accountId.toString());
      storedBalance = account?.balance || 0;
    } else {
      const account = storage.getAccounts().find(a => a.name === accountId);
      storedBalance = account?.balance || 0;
    }
    
    return Math.abs(calculatedBalance - storedBalance) < 0.01;
  }

  // Versão síncrona para compatibilidade com testes
  fixAccountBalance(accountId: number | string): boolean {
    try {
      const calculatedBalance = this.calculateAccountBalanceById(accountId);
      
      if (typeof accountId === 'number') {
        const account = storage.getAccounts().find(a => a.id === accountId.toString());
        if (account) {
          storage.updateAccount(account.id, { balance: calculatedBalance });
          return true;
        }
      } else {
        const account = storage.getAccounts().find(a => a.name === accountId);
        if (account) {
          storage.updateAccount(account.id, { balance: calculatedBalance });
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  isValidAccountType(type: string): boolean {
    const validTypes = ['checking', 'savings', 'credit', 'investment', 'loan'];
    return validTypes.includes(type);
  }

  calculateNetWorth(): number {
    const accounts = storage.getAccounts();
    
    let assets = 0;
    let liabilities = 0;
    
    for (const account of accounts) {
      if (account.type === 'checking' || account.type === 'savings' || account.type === 'investment') {
        assets += account.balance;
      } else if (account.type === 'credit' || account.type === 'loan') {
        liabilities += Math.abs(account.balance);
      }
    }
    
    return assets - liabilities;
  }

  generateCashFlowReport(startDate: string, endDate: string): {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    incomeByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
    // Aliases para compatibilidade com testes legacy
    income?: number;
    expenses?: number;
    netFlow?: number;
  } {
    const transactions = storage.getTransactions();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    
    for (const transaction of relevantTransactions) {
      const amount = Math.abs(transaction.amount);
      
      if (transaction.type === 'income') {
        totalIncome += amount;
        incomeByCategory[transaction.category] = (incomeByCategory[transaction.category] || 0) + amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += amount;
        expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + amount;
      }
    }
    
    const netCashFlow = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      incomeByCategory,
      expensesByCategory,
      // Aliases para compatibilidade com testes legacy
      income: totalIncome,
      expenses: totalExpenses,
      netFlow: netCashFlow,
    };
  }
}

export const accountingSystem = new AccountingSystem();
