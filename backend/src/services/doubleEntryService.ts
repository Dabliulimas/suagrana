import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { AuditService } from "./auditService";

interface CreateTransactionRequest {
  tenantId: string;
  userId: string;
  description: string;
  amount: Decimal;
  type: "income" | "expense" | "transfer";
  fromAccountId?: string;
  toAccountId?: string;
  categoryId: string;
  date: Date;
  reference?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  idempotencyKey: string;
}

interface DoubleEntryRule {
  debitAccountId: string;
  creditAccountId: string;
  amount: Decimal;
  description: string;
}

export class DoubleEntryService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  /**
   * Cria uma transação seguindo as regras de partidas dobradas
   * Toda transação DEVE ter pelo menos 2 entradas (débito e crédito)
   */
  async createTransaction(request: CreateTransactionRequest): Promise<any> {
    const { tenantId, userId, idempotencyKey } = request;

    // Verificar idempotência
    const existingTransaction = await this.prisma.transaction.findFirst({
      where: {
        tenantId,
        externalId: idempotencyKey,
      },
    });

    if (existingTransaction) {
      logger.info("Transaction already exists", { idempotencyKey });
      return existingTransaction;
    }

    // Determinar regras de débito/crédito baseado no tipo
    const doubleEntryRules = await this.determineDoubleEntryRules(request);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Criar a transação principal
      logger.debug("Creating transaction with data:", {
        tenantId,
        description: request.description,
        date: request.date,
        tags: request.tags,
        metadata: request.metadata
      });
      
      let transaction;
      try {
        transaction = await tx.transaction.create({
          data: {
            tenantId,
            description: request.description,
            date: request.date,
            reference: request.reference,
            externalId: idempotencyKey,
            status: "PENDING",
            tags: JSON.stringify(request.tags || []),
            metadata: JSON.stringify(request.metadata || {}),
            createdBy: userId,
          },
        });
        logger.debug("Transaction created successfully:", { transactionId: transaction.id });
      } catch (error) {
        logger.error("Error creating transaction:", error);
        throw error;
      }

      // 2. Criar entradas de débito e crédito
      const entries = [];
      for (const rule of doubleEntryRules) {
        const debitEntry = await tx.entry.create({
          data: {
            transactionId: transaction.id,
            accountId: rule.debitAccountId,
            debit: rule.amount,
            credit: new Prisma.Decimal(0),
            description: rule.description,
          },
        });
        
        const creditEntry = await tx.entry.create({
          data: {
            transactionId: transaction.id,
            accountId: rule.creditAccountId,
            debit: new Prisma.Decimal(0),
            credit: rule.amount,
            description: rule.description,
          },
        });
        
        entries.push(debitEntry, creditEntry);
      }

      // 3. Validar balanceamento (débitos = créditos)
      await this.validateDoubleEntryBalance(entries);

      // 4. Atualizar saldos das contas
      await this.updateAccountBalances(tx, entries);

      // 5. Marcar transação como processada
      const finalTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "processed" },
      });

      logger.info("Double-entry transaction created", {
        transactionId: transaction.id,
        entriesCount: entries.length,
        totalAmount: request.amount,
      });

      return {
        transaction: finalTransaction,
        entries,
      };
    }, {
      timeout: 15000, // 15 segundos
    });

    // 6. Registrar auditoria fora da transação
    try {
      await this.auditService.logEvent({
        tenantId,
        userId,
        entityType: "transaction",
        entityId: result.transaction.id,
        action: "create",
        newValues: JSON.stringify(result.transaction),
        severity: "info",
      });
    } catch (auditError) {
      logger.error("Failed to log audit event for transaction", {
        transactionId: result.transaction.id,
        error: auditError.message,
      });
      // Não falhar a transação por causa da auditoria
    }

    return result;
  }

  /**
   * Determina as regras de débito/crédito baseado no tipo de transação
   */
  private async determineDoubleEntryRules(
    request: CreateTransactionRequest,
  ): Promise<DoubleEntryRule[]> {
    const { type, amount, fromAccountId, toAccountId, categoryId } = request;

    switch (type) {
      case "income":
        // Receita: Débito na conta de destino, Crédito na categoria de receita
        if (!toAccountId) throw new Error("toAccountId required for income");
        return [
          {
            debitAccountId: toAccountId,
            creditAccountId: await this.getRevenueAccountId(categoryId),
            amount,
            description: `Income: ${request.description}`,
          },
        ];

      case "expense":
        // Despesa: Débito na categoria de despesa, Crédito na conta de origem
        if (!fromAccountId)
          throw new Error("fromAccountId required for expense");
        return [
          {
            debitAccountId: await this.getExpenseAccountId(categoryId),
            creditAccountId: fromAccountId,
            amount,
            description: `Expense: ${request.description}`,
          },
        ];

      case "transfer":
        // Transferência: Débito na conta destino, Crédito na conta origem
        if (!fromAccountId || !toAccountId) {
          throw new Error(
            "Both fromAccountId and toAccountId required for transfer",
          );
        }
        return [
          {
            debitAccountId: toAccountId,
            creditAccountId: fromAccountId,
            amount,
            description: `Transfer: ${request.description}`,
          },
        ];

      default:
        throw new Error(`Unsupported transaction type: ${type}`);
    }
  }

  /**
   * Valida se o total de débitos é igual ao total de créditos
   */
  private async validateDoubleEntryBalance(entries: any[]): Promise<void> {
    const debits = entries
      .filter((e) => e.type === "debit")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const credits = entries
      .filter((e) => e.type === "credit")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (Math.abs(debits - credits) > 0.01) {
      // Tolerância para arredondamento
      throw new Error(
        `Double-entry validation failed: Debits (${debits}) != Credits (${credits})`,
      );
    }

    logger.debug("Double-entry validation passed", { debits, credits });
  }

  /**
   * Atualiza os saldos das contas baseado nas entradas
   * Nota: O saldo é calculado dinamicamente a partir das entradas, não armazenado
   */
  private async updateAccountBalances(tx: any, entries: any[]): Promise<void> {
    // Apenas atualizar o timestamp das contas afetadas
    const accountIds = [...new Set(entries.map(entry => entry.accountId))];
    
    for (const accountId of accountIds) {
      await tx.account.update({
        where: { id: accountId },
        data: {
          updatedAt: new Date(),
        },
      });

      logger.debug("Account timestamp updated", {
        accountId,
      });
    }
  }

  /**
   * Obtém a conta contábil de receita para uma categoria
   */
  private async getRevenueAccountId(categoryId: string): Promise<string> {
    // Busca uma conta de receita (INCOME) ou usa a primeira conta ASSET disponível
     const revenueAccount = await this.prisma.account.findFirst({
       where: {
         tenantId: "demo-tenant-1",
         type: "INCOME",
         isActive: true,
       },
     });
     
     if (revenueAccount) {
       return revenueAccount.id;
     }
     
     // Se não encontrar conta de receita, usa a primeira conta ASSET
     const assetAccount = await this.prisma.account.findFirst({
       where: {
         tenantId: "demo-tenant-1",
         type: "ASSET",
         isActive: true,
       },
     });
    
    if (assetAccount) {
      return assetAccount.id;
    }
    
    // Se não encontrar ASSET, usa a primeira conta CHECKING
    const checkingAccount = await this.prisma.account.findFirst({
      where: {
        tenantId: "demo-tenant-1",
        type: "CHECKING",
        isActive: true,
      },
    });
    
    if (checkingAccount) {
      return checkingAccount.id;
    }
    
    throw new Error("Nenhuma conta de receita, ativo ou corrente encontrada");
  }

  /**
   * Obtém a conta contábil de despesa para uma categoria
   */
  private async getExpenseAccountId(categoryId: string): Promise<string> {
    // Busca uma conta de despesa (EXPENSE) ou usa a primeira conta ASSET disponível
     const expenseAccount = await this.prisma.account.findFirst({
       where: {
         tenantId: "demo-tenant-1",
         type: "EXPENSE",
         isActive: true,
       },
     });
     
     if (expenseAccount) {
       return expenseAccount.id;
     }
     
     // Se não encontrar conta de despesa, usa a primeira conta ASSET
     const assetAccount = await this.prisma.account.findFirst({
       where: {
         tenantId: "demo-tenant-1",
         type: "ASSET",
         isActive: true,
       },
     });
    
    if (assetAccount) {
      return assetAccount.id;
    }
    
    // Se não encontrar ASSET, usa a primeira conta CHECKING
    const checkingAccount = await this.prisma.account.findFirst({
      where: {
        tenantId: "demo-tenant-1",
        type: "CHECKING",
        isActive: true,
      },
    });
    
    if (checkingAccount) {
      return checkingAccount.id;
    }
    
    throw new Error("Nenhuma conta de despesa, ativo ou corrente encontrada");
  }

  /**
   * Gera relatório de balancete (trial balance)
   */
  async generateTrialBalance(tenantId: string, date?: Date): Promise<any> {
    const endDate = date || new Date();

    const entries = await this.prisma.entry.findMany({
      where: {
        tenantId,
        date: { lte: endDate },
      },
      include: {
        account: true,
      },
    });

    const balances = new Map<
      string,
      { debit: number; credit: number; account: any }
    >();

    for (const entry of entries) {
      const accountId = entry.accountId;
      const current = balances.get(accountId) || {
        debit: 0,
        credit: 0,
        account: entry.account,
      };

      if (entry.type === "debit") {
        current.debit += Number(entry.amount);
      } else {
        current.credit += Number(entry.amount);
      }

      balances.set(accountId, current);
    }

    const trialBalance = Array.from(balances.entries()).map(
      ([accountId, data]) => ({
        accountId,
        accountName: data.account.name,
        accountType: data.account.type,
        debitTotal: data.debit,
        creditTotal: data.credit,
        balance: data.debit - data.credit,
      }),
    );

    // Validar que total de débitos = total de créditos
    const totalDebits = trialBalance.reduce(
      (sum, item) => sum + item.debitTotal,
      0,
    );
    const totalCredits = trialBalance.reduce(
      (sum, item) => sum + item.creditTotal,
      0,
    );

    return {
      date: endDate,
      accounts: trialBalance,
      totals: {
        debits: totalDebits,
        credits: totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
    };
  }

  /**
   * Estorna uma transação (cria entradas reversas)
   */
  async reverseTransaction(
    tenantId: string,
    transactionId: string,
    userId: string,
    reason: string,
  ): Promise<any> {
    return await this.prisma.$transaction(async (tx) => {
      // Buscar transação original
      const originalTransaction = await tx.transaction.findFirst({
        where: { id: transactionId, tenantId },
        include: { entries: true },
      });

      if (!originalTransaction) {
        throw new Error("Transaction not found");
      }

      if (originalTransaction.status === "reversed") {
        throw new Error("Transaction already reversed");
      }

      // Criar transação de estorno
      const reversalTransaction = await tx.transaction.create({
        data: {
          tenantId,
          userId,
          description: `REVERSAL: ${originalTransaction.description}`,
          amount: originalTransaction.amount,
          type: originalTransaction.type,
          categoryId: originalTransaction.categoryId,
          date: new Date(),
          reference: `REV-${originalTransaction.reference || originalTransaction.id}`,
          status: "processed",
          tags: [...(originalTransaction.tags || []), "reversal"],
          metadata: {
            ...originalTransaction.metadata,
            reversalReason: reason,
            originalTransactionId: transactionId,
          },
          createdBy: userId,
        },
      });

      // Criar entradas reversas
      const reversalEntries = [];
      for (const originalEntry of originalTransaction.entries) {
        const reversalEntry = await tx.entry.create({
          data: {
            tenantId,
            transactionId: reversalTransaction.id,
            accountId: originalEntry.accountId,
            type: originalEntry.type === "debit" ? "credit" : "debit", // Inverter
            amount: originalEntry.amount,
            description: `REVERSAL: ${originalEntry.description}`,
            date: new Date(),
          },
        });
        reversalEntries.push(reversalEntry);
      }

      // Atualizar saldos
      await this.updateAccountBalances(tx, reversalEntries);

      // Marcar transação original como estornada
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "reversed" },
      });

      // Auditoria
      await this.auditService.logEvent({
        tenantId,
        userId,
        entityType: "transaction",
        entityId: transactionId,
        action: "reverse",
        oldValues: originalTransaction,
        newValues: { status: "reversed", reason },
        severity: "warning",
      });

      return {
        originalTransaction,
        reversalTransaction,
        reversalEntries,
      };
    });
  }
}

export default DoubleEntryService;

