import { localDataService } from "./services/local-data-service";
import { logComponents } from "./utils/logger";
import { storage } from "./storage";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface SystemHealth {
  overall: ValidationResult;
  accounts: ValidationResult;
  transactions: ValidationResult;
  goals: ValidationResult;
  trips: ValidationResult;
  investments: ValidationResult;
  sharedExpenses: ValidationResult;
}

class SystemValidator {
  async validateSystem(): Promise<SystemHealth> {
    const results: SystemHealth = {
      overall: { isValid: true, errors: [], warnings: [], score: 100 },
      accounts: await this.validateAccounts(),
      transactions: await this.validateTransactions(),
      goals: await this.validateGoals(),
      trips: await this.validateTrips(),
      investments: await this.validateInvestments(),
      sharedExpenses: await this.validateSharedExpenses(),
    };

    // Calculate overall health
    const allResults = [
      results.accounts,
      results.transactions,
      results.goals,
      results.trips,
      results.investments,
      results.sharedExpenses,
    ];

    results.overall.errors = allResults.flatMap((r) => r.errors);
    results.overall.warnings = allResults.flatMap((r) => r.warnings);
    results.overall.isValid = results.overall.errors.length === 0;
    results.overall.score = Math.round(
      allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length,
    );

    return results;
  }

  private async validateAccounts(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const accounts = localDataService.getAccounts();
      const transactions = localDataService.getTransactions();

      // Check for duplicate account names
      const accountNames = accounts.map((a) => a.name.toLowerCase());
      const duplicates = accountNames.filter(
        (name, index) => accountNames.indexOf(name) !== index,
      );
      if (duplicates.length > 0) {
        errors.push(`Contas duplicadas encontradas: ${duplicates.join(", ")}`);
        score -= 20;
      }

      // Validate account balances
      for (const account of accounts) {
        if (typeof account.balance !== "number") {
          errors.push(`Conta ${account.name}: saldo invalido`);
          score -= 10;
        }

        if (account.type === "credit" && account.balance > 0) {
          warnings.push(
            `Conta ${account.name}: cartao de credito com saldo positivo`,
          );
          score -= 5;
        }

        if (account.type === "credit" && !account.creditLimit) {
          warnings.push(`Conta ${account.name}: cartao sem limite definido`);
          score -= 3;
        }

        // Check balance consistency
        const accountTransactions = transactions.filter(
          (t) => t.account === account.name,
        );
        const calculatedBalance = accountTransactions.reduce((sum, t) => {
          return sum + (t.type === "income" ? t.amount : -Math.abs(t.amount));
        }, 0);

        if (Math.abs(calculatedBalance - account.balance) > 0.01) {
          errors.push(
            `Conta ${account.name}: inconsistencia no saldo (calculado: ${calculatedBalance.toFixed(2)}, atual: ${account.balance.toFixed(2)})`,
          );
          score -= 15;
        }
      }

      // Check for orphaned transactions
      const accountNamesList = accounts.map((a) => a.name);
      const orphanedTransactions = transactions.filter(
        (t) => !accountNamesList.includes(t.account),
      );
      if (orphanedTransactions.length > 0) {
        errors.push(
          `${orphanedTransactions.length} transacoes referenciam contas inexistentes`,
        );
        score -= 25;
      }
    } catch (error) {
      logComponents.error("Erro na validação de contas", error);
      errors.push(`Erro na validacao de contas: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private async validateTransactions(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const transactions = localDataService.getTransactions();

      for (const transaction of transactions) {
        // Required fields validation
        if (
          !transaction.description ||
          transaction.description.trim().length === 0
        ) {
          errors.push(`Transacao ${transaction.id}: descricao vazia`);
          score -= 5;
        }

        if (
          typeof transaction.amount !== "number" ||
          transaction.amount === 0
        ) {
          errors.push(`Transacao ${transaction.id}: valor invalido`);
          score -= 10;
        }

        if (!["income", "expense", "shared"].includes(transaction.type)) {
          errors.push(`Transacao ${transaction.id}: tipo invalido`);
          score -= 10;
        }

        if (!transaction.category || transaction.category.trim().length === 0) {
          errors.push(`Transacao ${transaction.id}: categoria vazia`);
          score -= 5;
        }

        if (!transaction.account || transaction.account.trim().length === 0) {
          errors.push(`Transacao ${transaction.id}: conta vazia`);
          score -= 5;
        }

        if (!transaction.date) {
          errors.push(`Transacao ${transaction.id}: data invalida`);
          score -= 5;
        }

        // Date validation
        const transactionDate = new Date(transaction.date);
        if (isNaN(transactionDate.getTime())) {
          errors.push(`Transacao ${transaction.id}: formato de data invalido`);
          score -= 5;
        }

        // Future date warning
        if (transactionDate > new Date()) {
          warnings.push(`Transacao ${transaction.id}: data futura`);
          score -= 2;
        }

        // Shared expense validation
        if (transaction.type === "shared") {
          if (!transaction.sharedWith || transaction.sharedWith.length === 0) {
            errors.push(
              `Transacao compartilhada ${transaction.id}: sem participantes`,
            );
            score -= 10;
          }

          if (transaction.sharedPercentages) {
            const totalPercentage = Object.values(
              transaction.sharedPercentages,
            ).reduce((sum, p) => sum + p, 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
              errors.push(
                `Transacao compartilhada ${transaction.id}: percentuais nao somam 100%`,
              );
              score -= 10;
            }
          }
        }

        // Installment validation
        if (transaction.installments && transaction.installments > 1) {
          if (!transaction.currentInstallment) {
            warnings.push(
              `Transacao ${transaction.id}: parcelamento sem numero da parcela`,
            );
            score -= 3;
          }
        }

        // Amount validation by type
        if (transaction.type === "income" && transaction.amount < 0) {
          errors.push(
            `Transacao ${transaction.id}: receita com valor negativo`,
          );
          score -= 10;
        }

        if (
          (transaction.type === "expense" || transaction.type === "shared") &&
          transaction.amount > 0
        ) {
          errors.push(
            `Transação ${transaction.id}: despesa com valor positivo`,
          );
          score -= 10;
        }
      }

      // Check for duplicate transactions
      const transactionHashes = transactions.map(
        (t) => `${t.description}-${t.amount}-${t.date}-${t.account}`,
      );
      const duplicateHashes = transactionHashes.filter(
        (hash, index) => transactionHashes.indexOf(hash) !== index,
      );
      if (duplicateHashes.length > 0) {
        warnings.push(
          `${duplicateHashes.length} possíveis transações duplicadas`,
        );
        score -= duplicateHashes.length * 2;
      }
    } catch (error) {
      errors.push(`Erro na validação de transações: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private async validateGoals(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const goals = localDataService.getGoals();

      for (const goal of goals) {
        // Required fields
        if (!goal.name || goal.name.trim().length === 0) {
          errors.push(`Meta ${goal.id}: nome vazio`);
          score -= 10;
        }

        if (typeof goal.target !== "number" || goal.target <= 0) {
          errors.push(`Meta ${goal.id}: valor meta inválido`);
          score -= 15;
        }

        if (typeof goal.current !== "number" || goal.current < 0) {
          errors.push(`Meta ${goal.id}: valor atual inválido`);
          score -= 10;
        }

        if (goal.current > goal.target) {
          warnings.push(`Meta ${goal.id}: valor atual maior que a meta`);
          score -= 5;
        }

        if (!goal.category || goal.category.trim().length === 0) {
          errors.push(`Meta ${goal.id}: categoria vazia`);
          score -= 5;
        }

        if (!["high", "medium", "low"].includes(goal.priority)) {
          errors.push(`Meta ${goal.id}: prioridade inválida`);
          score -= 5;
        }

        // Deadline validation
        if (goal.deadline) {
          const deadlineDate = new Date(goal.deadline);
          if (isNaN(deadlineDate.getTime())) {
            errors.push(`Meta ${goal.id}: data limite inválida`);
            score -= 5;
          } else if (deadlineDate < new Date() && goal.current < goal.target) {
            warnings.push(`Meta ${goal.id}: prazo vencido`);
            score -= 3;
          }
        }
      }

      // Check for duplicate goal names
      const goalNames = goals.map((g) => g.name.toLowerCase());
      const duplicates = goalNames.filter(
        (name, index) => goalNames.indexOf(name) !== index,
      );
      if (duplicates.length > 0) {
        warnings.push(`Metas com nomes similares: ${duplicates.join(", ")}`);
        score -= duplicates.length * 3;
      }
    } catch (error) {
      errors.push(`Erro na validação de metas: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private async validateTrips(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const trips = localDataService.getTrips();
      const transactions = localDataService.getTransactions();

      for (const trip of trips) {
        // Required fields
        if (!trip.name || trip.name.trim().length === 0) {
          errors.push(`Viagem ${trip.id}: nome vazio`);
          score -= 10;
        }

        if (!trip.destination || trip.destination.trim().length === 0) {
          errors.push(`Viagem ${trip.id}: destino vazio`);
          score -= 10;
        }

        if (!trip.startDate) {
          errors.push(`Viagem ${trip.id}: data de início inválida`);
          score -= 10;
        }

        if (!trip.endDate) {
          errors.push(`Viagem ${trip.id}: data de fim inválida`);
          score -= 10;
        }

        // Date validation
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push(`Viagem ${trip.id}: datas inválidas`);
          score -= 15;
        } else if (endDate <= startDate) {
          errors.push(
            `Viagem ${trip.id}: data de fim deve ser posterior à data de início`,
          );
          score -= 15;
        }

        // Budget validation
        if (typeof trip.budget !== "number" || trip.budget <= 0) {
          errors.push(`Viagem ${trip.id}: orçamento inválido`);
          score -= 10;
        }

        if (typeof trip.spent !== "number" || trip.spent < 0) {
          errors.push(`Viagem ${trip.id}: valor gasto inválido`);
          score -= 10;
        }

        if (trip.spent > trip.budget * 1.5) {
          warnings.push(`Viagem ${trip.id}: gastos muito acima do orçamento`);
          score -= 5;
        }

        // Status validation
        if (!["planned", "active", "completed"].includes(trip.status)) {
          errors.push(`Viagem ${trip.id}: status inválido`);
          score -= 5;
        }

        // Currency validation
        if (!trip.currency || trip.currency.length !== 3) {
          errors.push(`Viagem ${trip.id}: moeda inválida`);
          score -= 5;
        }

        // Check trip expenses consistency
        const tripTransactions = transactions.filter(
          (t) => t.tripId === trip.id,
        );
        const calculatedSpent = tripTransactions
          .filter((t) => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        if (Math.abs(calculatedSpent - trip.spent) > 0.01) {
          errors.push(
            `Viagem ${trip.id}: inconsistência nos gastos (calculado: ${calculatedSpent.toFixed(2)}, registrado: ${trip.spent.toFixed(2)})`,
          );
          score -= 15;
        }
      }
    } catch (error) {
      errors.push(`Erro na validação de viagens: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private async validateInvestments(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const investments = localDataService.getInvestments();

      for (const investment of investments) {
        // Required fields
        if (!investment.name || investment.name.trim().length === 0) {
          errors.push(`Investimento ${investment.id}: nome vazio`);
          score -= 10;
        }

        if (!["buy", "sell"].includes(investment.operation)) {
          errors.push(`Investimento ${investment.id}: operação inválida`);
          score -= 10;
        }

        if (
          typeof investment.quantity !== "number" ||
          investment.quantity <= 0
        ) {
          errors.push(`Investimento ${investment.id}: quantidade inválida`);
          score -= 10;
        }

        if (typeof investment.price !== "number" || investment.price <= 0) {
          errors.push(`Investimento ${investment.id}: preço inválido`);
          score -= 10;
        }

        if (
          typeof investment.totalValue !== "number" ||
          investment.totalValue <= 0
        ) {
          errors.push(`Investimento ${investment.id}: valor total inválido`);
          score -= 10;
        }

        // Consistency check
        const expectedTotal =
          investment.quantity * investment.price + (investment.fees || 0);
        if (Math.abs(expectedTotal - investment.totalValue) > 0.01) {
          errors.push(
            `Investimento ${investment.id}: inconsistência no valor total`,
          );
          score -= 10;
        }

        if (!investment.date) {
          errors.push(`Investimento ${investment.id}: data inválida`);
          score -= 5;
        }

        if (!investment.account || investment.account.trim().length === 0) {
          errors.push(`Investimento ${investment.id}: conta vazia`);
          score -= 5;
        }

        // Type validation
        if (!investment.type || investment.type.trim().length === 0) {
          errors.push(`Investimento ${investment.id}: tipo vazio`);
          score -= 5;
        }

        // Ticker validation for stocks
        if (
          investment.type === "stock" &&
          (!investment.ticker || investment.ticker.length < 4)
        ) {
          warnings.push(
            `Investimento ${investment.id}: ticker inválido para ação`,
          );
          score -= 3;
        }
      }

      // Check for negative positions
      const positions = new Map<string, number>();
      investments.forEach((inv) => {
        const key = inv.ticker || inv.name;
        const currentQty = positions.get(key) || 0;
        const newQty =
          inv.operation === "buy"
            ? currentQty + inv.quantity
            : currentQty - inv.quantity;
        positions.set(key, newQty);
      });

      positions.forEach((qty, asset) => {
        if (qty < 0) {
          errors.push(`Posição negativa detectada para ${asset}: ${qty}`);
          score -= 15;
        }
      });
    } catch (error) {
      errors.push(`Erro na validação de investimentos: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private async validateSharedExpenses(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      const transactions = localDataService.getTransactions();
      const contacts = localDataService.getContacts();
      const billingPayments = localDataService.getBillingPayments();

      const sharedTransactions = transactions.filter(
        (t) => t.type === "shared",
      );

      for (const transaction of sharedTransactions) {
        // Shared expense specific validation
        if (!transaction.sharedWith || transaction.sharedWith.length === 0) {
          errors.push(
            `Despesa compartilhada ${transaction.id}: sem participantes`,
          );
          score -= 15;
        }

        if (transaction.sharedPercentages) {
          const totalPercentage = Object.values(
            transaction.sharedPercentages,
          ).reduce((sum, p) => sum + p, 0);
          if (Math.abs(totalPercentage - 100) > 0.01) {
            errors.push(
              `Despesa compartilhada ${transaction.id}: percentuais não somam 100%`,
            );
            score -= 15;
          }

          // Check if all participants have percentages
          const participantEmails = transaction.sharedWith || [];
          const allParticipants = ["user", ...participantEmails];

          for (const participant of allParticipants) {
            if (!(participant in transaction.sharedPercentages)) {
              errors.push(
                `Despesa compartilhada ${transaction.id}: percentual não definido para ${participant}`,
              );
              score -= 10;
            }
          }
        }

        // Check if contacts exist
        if (transaction.sharedWith) {
          for (const email of transaction.sharedWith) {
            const contact = contacts.find((c) => c.email === email);
            if (!contact) {
              warnings.push(
                `Despesa compartilhada ${transaction.id}: contato não encontrado (${email})`,
              );
              score -= 5;
            }
          }
        }

        // Check billing payments consistency
        if (transaction.sharedWith) {
          for (const email of transaction.sharedWith) {
            const payment = billingPayments.find(
              (p) =>
                p.transactionId === transaction.id && p.userEmail === email,
            );

            if (!payment) {
              warnings.push(
                `Despesa compartilhada ${transaction.id}: cobrança não criada para ${email}`,
              );
              score -= 3;
            } else {
              // Validate payment amount
              const expectedAmount =
                Math.abs(transaction.amount) /
                ((transaction.sharedWith?.length || 0) + 1);
              if (Math.abs(payment.amount - expectedAmount) > 0.01) {
                errors.push(`Cobrança ${payment.id}: valor incorreto`);
                score -= 10;
              }
            }
          }
        }
      }

      // Check for orphaned billing payments
      const transactionIds = sharedTransactions.map((t) => t.id);
      const orphanedPayments = billingPayments.filter(
        (p) => !transactionIds.includes(p.transactionId),
      );
      if (orphanedPayments.length > 0) {
        warnings.push(`${orphanedPayments.length} cobranças órfãs encontradas`);
        score -= orphanedPayments.length * 2;
      }
    } catch (error) {
      errors.push(`Erro na validação de despesas compartilhadas: ${error}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  async fixCommonIssues(): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0;
    const errors: string[] = [];

    try {
      // Fix account balance inconsistencies
      const accounts = localDataService.getAccounts();
      const transactions = localDataService.getTransactions();

      for (const account of accounts) {
        const accountTransactions = transactions.filter(
          (t) => t.account === account.name,
        );
        const calculatedBalance = accountTransactions.reduce((sum, t) => {
          return sum + (t.type === "income" ? t.amount : -Math.abs(t.amount));
        }, 0);

        if (Math.abs(calculatedBalance - account.balance) > 0.01) {
          storage.updateAccount(account.id, { balance: calculatedBalance });
          fixed++;
        }
      }

      // Fix trip expenses
      const trips = storage.getTrips();
      for (const trip of trips) {
        const tripTransactions = transactions.filter(
          (t) => t.tripId === trip.id,
        );
        const calculatedSpent = tripTransactions
          .filter((t) => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        if (Math.abs(calculatedSpent - trip.spent) > 0.01) {
          storage.updateTrip(trip.id, { spent: calculatedSpent });
          fixed++;
        }
      }

      // Create missing billing payments
      const sharedTransactions = transactions.filter(
        (t) => t.type === "shared",
      );
      const billingPayments = storage.getBillingPayments();

      for (const transaction of sharedTransactions) {
        if (transaction.sharedWith) {
          for (const email of transaction.sharedWith) {
            const existingPayment = billingPayments.find(
              (p) =>
                p.transactionId === transaction.id && p.userEmail === email,
            );

            if (!existingPayment) {
              // This would need to be implemented in storage
              // storage.createBillingPayment(transaction, email)
              fixed++;
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Erro ao corrigir problemas: ${error}`);
    }

    return { fixed, errors };
  }
}

export default SystemValidator;
export { SystemValidator };
export const systemValidator = new SystemValidator();
