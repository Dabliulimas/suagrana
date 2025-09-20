import {
  PrismaClient,
  TransactionType,
  TransactionStatus,
  Prisma,
} from "@prisma/client";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";
import { accountService } from "./accountService";
import { DoubleEntryService } from "./doubleEntryService";
import { AuditService } from "./auditService";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export interface CreateTransactionData {
  tenantId: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  fromAccountId?: string;
  toAccountId?: string;
  date?: Date;
  tags?: string[];
  reference?: string;
  metadata?: Record<string, any>;
  installments?: {
    count: number;
    frequency: "monthly" | "weekly" | "daily";
    startDate?: Date;
  };
}

export interface UpdateTransactionData {
  amount?: number;
  description?: string;
  category?: string;
  date?: Date;
  status?: TransactionStatus;
  tags?: string[];
}

export interface TransactionWithAccount {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: Date;
  status: TransactionStatus;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  account: {
    id: string;
    name: string;
    type: string;
  };
  toAccount?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface TransactionSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  netAmount: number;
  byStatus: Array<{
    status: TransactionStatus;
    count: number;
    totalAmount: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  byType: Array<{
    type: TransactionType;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  category?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  tags?: string[];
}

class TransactionService {
  private doubleEntryService: DoubleEntryService;
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService(prisma);
    this.doubleEntryService = new DoubleEntryService(prisma, this.auditService);
  }
  /**
   * Lista transações com filtros e paginação
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {},
  ): Promise<{
    transactions: TransactionWithAccount[];
    summary: TransactionSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        type,
        status,
        category,
        accountId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        tags,
      } = filters;
      const {
        page = 1,
        limit = 20,
        sortBy = "date",
        sortOrder = "desc",
      } = pagination;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = { userId };

      if (type) where.type = type;
      if (status) where.status = status;
      if (category)
        where.category = { contains: category, mode: "insensitive" };
      if (accountId) {
        where.OR = [{ accountId }, { toAccountId: accountId }];
      }
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }
      if (minAmount !== undefined || maxAmount !== undefined) {
        where.amount = {};
        if (minAmount !== undefined) where.amount.gte = minAmount;
        if (maxAmount !== undefined) where.amount.lte = maxAmount;
      }
      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ];
      }
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      // Buscar transações com paginação
      const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            toAccount: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where }),
      ]);

      // Buscar todas as transações para o resumo
      const allTransactions = await prisma.transaction.findMany({
        where: { userId },
        select: {
          type: true,
          amount: true,
          category: true,
          status: true,
        },
      });

      // Calcular resumo
      const summary = this.calculateTransactionSummary(allTransactions);

      // Formatar transações
      const formattedTransactions: TransactionWithAccount[] = transactions.map(
        (transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount),
          description: transaction.description,
          category: transaction.category,
          date: transaction.date,
          status: transaction.status,
          tags: transaction.tags || undefined,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          account: transaction.account,
          toAccount: transaction.toAccount || undefined,
        }),
      );

      return {
        transactions: formattedTransactions,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Get transactions failed", {
        userId,
        filters,
        pagination,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém uma transação específica
   */
  async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<TransactionWithAccount> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          toAccount: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundError("Transação não encontrada");
      }

      return {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        status: transaction.status,
        tags: transaction.tags || undefined,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        account: transaction.account,
        toAccount: transaction.toAccount || undefined,
      };
    } catch (error) {
      logger.error("Get transaction by ID failed", {
        userId,
        transactionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Cria uma nova transação com double-entry bookkeeping
   */
  async createTransaction(
    userId: string,
    data: CreateTransactionData,
  ): Promise<any> {
    try {
      // Validações de negócio
      await this.validateTransactionData(data);

      // Verificar se é parcelamento
      if (data.installments && data.installments.count > 1) {
        return await this.createInstallmentTransactions(userId, data);
      }

      // Mapear tipo para formato do double-entry
      const transactionType = this.mapTransactionType(data.type);

      // Criar transação única
      const idempotencyKey = uuidv4();
      const result = await this.doubleEntryService.createTransaction({
        tenantId: data.tenantId,
        userId,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        type: transactionType,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        categoryId: data.categoryId,
        date: data.date ? new Date(data.date) : new Date(),
        reference: data.reference,
        tags: data.tags,
        metadata: data.metadata,
        idempotencyKey,
      });

      loggerUtils.logFinancial("Transaction created with double-entry", {
        userId,
        transactionId: result.transaction.id,
        type: data.type,
        amount: data.amount,
        entriesCount: result.entries.length,
      });

      return this.formatTransactionResponse(result.transaction);
    } catch (error) {
      logger.error("Create transaction failed", { userId, data, error });
      throw error;
    }
  }

  /**
   * Cria transações parceladas
   */
  private async createInstallmentTransactions(
    userId: string,
    data: CreateTransactionData,
  ): Promise<any> {
    const { installments } = data;
    if (!installments) throw new Error("Installments data required");

    const installmentAmount = data.amount / installments.count;
    const startDate =
      installments.startDate || new Date(data.date || new Date());
    const transactions = [];

    for (let i = 0; i < installments.count; i++) {
      const installmentDate = new Date(startDate);

      // Calcular data baseada na frequência
      switch (installments.frequency) {
        case "monthly":
          installmentDate.setMonth(installmentDate.getMonth() + i);
          break;
        case "weekly":
          installmentDate.setDate(installmentDate.getDate() + i * 7);
          break;
        case "daily":
          installmentDate.setDate(installmentDate.getDate() + i);
          break;
      }

      const installmentData = {
        ...data,
        amount: installmentAmount,
        date: installmentDate,
        description: `${data.description} (${i + 1}/${installments.count})`,
        metadata: {
          ...data.metadata,
          installment: {
            number: i + 1,
            total: installments.count,
            originalAmount: data.amount,
          },
        },
        tags: [...(data.tags || []), "installment"],
      };

      const transactionType = this.mapTransactionType(data.type);
      const idempotencyKey = uuidv4();
      const result = await this.doubleEntryService.createTransaction({
        tenantId: data.tenantId,
        userId,
        description: installmentData.description,
        amount: new Prisma.Decimal(installmentAmount),
        type: transactionType,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        categoryId: data.categoryId,
        date: installmentDate,
        reference: data.reference,
        tags: installmentData.tags,
        metadata: installmentData.metadata,
        idempotencyKey,
      });

      transactions.push(result);
    }

    logger.info("Installment transactions created", {
      count: installments.count,
      totalAmount: data.amount,
      installmentAmount,
    });

    return {
      installments: transactions,
      summary: {
        totalTransactions: installments.count,
        totalAmount: data.amount,
        installmentAmount,
      },
    };
  }

  /**
   * Mapeia tipos de transação para o formato do double-entry
   */
  private mapTransactionType(
    type: TransactionType,
  ): "income" | "expense" | "transfer" {
    switch (type) {
      case "INCOME":
        return "income";
      case "EXPENSE":
        return "expense";
      case "TRANSFER":
        return "transfer";
      default:
        throw new ValidationError(`Tipo de transação inválido: ${type}`);
    }
  }

  /**
   * Formata resposta da transação
   */
  private async formatTransactionResponse(
    transaction: any,
  ): Promise<TransactionWithAccount> {
    const fullTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        category: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          include: {
            account: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    if (!fullTransaction) {
      throw new NotFoundError("Transação não encontrada após criação");
    }

    // Encontrar conta principal e conta de destino
    const debitEntry = fullTransaction.entries.find((e) => e.type === "debit");
    const creditEntry = fullTransaction.entries.find(
      (e) => e.type === "credit",
    );

    return {
      id: fullTransaction.id,
      type: fullTransaction.type as TransactionType,
      amount: Number(fullTransaction.amount),
      description: fullTransaction.description,
      category: fullTransaction.category?.name || "Sem categoria",
      date: fullTransaction.date,
      status: fullTransaction.status as TransactionStatus,
      tags: fullTransaction.tags || undefined,
      createdAt: fullTransaction.createdAt,
      updatedAt: fullTransaction.updatedAt,
      account: debitEntry?.account ||
        creditEntry?.account || {
          id: "",
          name: "Conta não encontrada",
          type: "unknown",
        },
      toAccount:
        fullTransaction.type === "TRANSFER"
          ? creditEntry?.account !== debitEntry?.account
            ? creditEntry?.account
            : undefined
          : undefined,
    };
  }

  /**
   * Atualiza uma transação
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    data: UpdateTransactionData,
  ): Promise<TransactionWithAccount> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const existingTransaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!existingTransaction) {
        throw new NotFoundError("Transação não encontrada");
      }

      const { amount, description, category, date, status, tags } = data;
      const updateData: any = { updatedAt: new Date() };

      if (amount !== undefined) {
        if (amount <= 0) {
          throw new ValidationError("O valor deve ser maior que zero");
        }
        updateData.amount = amount;
      }

      if (description !== undefined) {
        updateData.description = description.trim();
      }

      if (category !== undefined) {
        updateData.category = category.trim();
      }

      if (date !== undefined) {
        updateData.date = date;
      }

      if (tags !== undefined) {
        updateData.tags = tags;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      // Atualizar em uma transação do banco
      const result = await prisma.$transaction(async (tx) => {
        // Se o status está mudando, ajustar saldos
        if (status !== undefined && status !== existingTransaction.status) {
          const oldAmount = Number(existingTransaction.amount);
          const newAmount = amount !== undefined ? amount : oldAmount;

          if (
            existingTransaction.status === "COMPLETED" &&
            status === "CANCELLED"
          ) {
            // Reverter transação
            if (existingTransaction.type === "INCOME") {
              await accountService.updateBalance(
                existingTransaction.accountId,
                oldAmount,
                "subtract",
              );
            } else if (existingTransaction.type === "EXPENSE") {
              await accountService.updateBalance(
                existingTransaction.accountId,
                oldAmount,
                "add",
              );
            } else if (
              existingTransaction.type === "TRANSFER" &&
              existingTransaction.toAccountId
            ) {
              await accountService.updateBalance(
                existingTransaction.accountId,
                oldAmount,
                "add",
              );
              await accountService.updateBalance(
                existingTransaction.toAccountId,
                oldAmount,
                "subtract",
              );
            }
          } else if (
            existingTransaction.status === "CANCELLED" &&
            status === "COMPLETED"
          ) {
            // Aplicar transação
            if (existingTransaction.type === "INCOME") {
              await accountService.updateBalance(
                existingTransaction.accountId,
                newAmount,
                "add",
              );
            } else if (existingTransaction.type === "EXPENSE") {
              await accountService.updateBalance(
                existingTransaction.accountId,
                newAmount,
                "subtract",
              );
            } else if (
              existingTransaction.type === "TRANSFER" &&
              existingTransaction.toAccountId
            ) {
              await accountService.updateBalance(
                existingTransaction.accountId,
                newAmount,
                "subtract",
              );
              await accountService.updateBalance(
                existingTransaction.toAccountId,
                newAmount,
                "add",
              );
            }
          }
        }

        // Se o valor mudou e a transação está ativa, ajustar diferença
        if (
          amount !== undefined &&
          amount !== Number(existingTransaction.amount) &&
          (status === "COMPLETED" ||
            (status === undefined &&
              existingTransaction.status === "COMPLETED"))
        ) {
          const oldAmount = Number(existingTransaction.amount);
          const difference = amount - oldAmount;

          if (existingTransaction.type === "INCOME") {
            await accountService.updateBalance(
              existingTransaction.accountId,
              difference,
              "add",
            );
          } else if (existingTransaction.type === "EXPENSE") {
            await accountService.updateBalance(
              existingTransaction.accountId,
              difference,
              "subtract",
            );
          } else if (
            existingTransaction.type === "TRANSFER" &&
            existingTransaction.toAccountId
          ) {
            await accountService.updateBalance(
              existingTransaction.accountId,
              difference,
              "subtract",
            );
            await accountService.updateBalance(
              existingTransaction.toAccountId,
              difference,
              "add",
            );
          }
        }

        // Atualizar a transação
        const updatedTransaction = await tx.transaction.update({
          where: { id: transactionId },
          data: updateData,
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            toAccount: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        });

        return updatedTransaction;
      });

      loggerUtils.logFinancial("Transaction updated", {
        userId,
        transactionId,
        updatedFields: Object.keys(updateData),
        previousAmount: Number(existingTransaction.amount),
        newAmount: Number(result.amount),
      });

      return {
        id: result.id,
        type: result.type,
        amount: Number(result.amount),
        description: result.description,
        category: result.category,
        date: result.date,
        status: result.status,
        tags: result.tags || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        account: result.account,
        toAccount: result.toAccount || undefined,
      };
    } catch (error) {
      logger.error("Update transaction failed", {
        userId,
        transactionId,
        data,
        error,
      });
      throw error;
    }
  }

  /**
   * Deleta uma transação
   */
  async deleteTransaction(
    userId: string,
    transactionId: string,
  ): Promise<void> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, userId },
      });

      if (!transaction) {
        throw new NotFoundError("Transação não encontrada");
      }

      // Deletar em uma transação do banco
      await prisma.$transaction(async (tx) => {
        // Se a transação estava completa, reverter saldos
        if (transaction.status === "COMPLETED") {
          const amount = Number(transaction.amount);

          if (transaction.type === "INCOME") {
            await accountService.updateBalance(
              transaction.accountId,
              amount,
              "subtract",
            );
          } else if (transaction.type === "EXPENSE") {
            await accountService.updateBalance(
              transaction.accountId,
              amount,
              "add",
            );
          } else if (
            transaction.type === "TRANSFER" &&
            transaction.toAccountId
          ) {
            await accountService.updateBalance(
              transaction.accountId,
              amount,
              "add",
            );
            await accountService.updateBalance(
              transaction.toAccountId,
              amount,
              "subtract",
            );
          }
        }

        // Deletar a transação
        await tx.transaction.delete({
          where: { id: transactionId },
        });
      });

      loggerUtils.logFinancial("Transaction deleted", {
        userId,
        transactionId,
        type: transaction.type,
        amount: Number(transaction.amount),
        wasCompleted: transaction.status === "COMPLETED",
      });
    } catch (error) {
      logger.error("Delete transaction failed", {
        userId,
        transactionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém categorias de transações usadas pelo usuário
   */
  async getCategories(
    userId: string,
    type?: TransactionType,
  ): Promise<
    Array<{
      category: string;
      count: number;
      totalAmount: number;
      lastUsed: Date;
    }>
  > {
    try {
      const where: any = { userId };
      if (type) where.type = type;

      const categories = await prisma.transaction.groupBy({
        by: ["category"],
        where,
        _count: { category: true },
        _sum: { amount: true },
        _max: { date: true },
      });

      return categories
        .map((cat) => ({
          category: cat.category,
          count: cat._count.category,
          totalAmount: Number(cat._sum.amount || 0),
          lastUsed: cat._max.date || new Date(),
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      logger.error("Get categories failed", { userId, type, error });
      throw error;
    }
  }

  /**
   * Obtém resumo de transações por período
   */
  async getTransactionSummaryByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" = "day",
  ): Promise<
    Array<{
      period: string;
      income: number;
      expense: number;
      transfer: number;
      net: number;
      count: number;
    }>
  > {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
        select: {
          type: true,
          amount: true,
          date: true,
        },
        orderBy: { date: "asc" },
      });

      // Agrupar por período
      const grouped: {
        [key: string]: {
          income: number;
          expense: number;
          transfer: number;
          count: number;
        };
      } = {};

      transactions.forEach((transaction) => {
        let key: string;
        const date = new Date(transaction.date);

        if (groupBy === "day") {
          key = date.toISOString().split("T")[0];
        } else if (groupBy === "week") {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split("T")[0];
        } else {
          // month
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }

        if (!grouped[key]) {
          grouped[key] = { income: 0, expense: 0, transfer: 0, count: 0 };
        }

        const amount = Number(transaction.amount);
        grouped[key].count += 1;

        if (transaction.type === "INCOME") {
          grouped[key].income += amount;
        } else if (transaction.type === "EXPENSE") {
          grouped[key].expense += amount;
        } else if (transaction.type === "TRANSFER") {
          grouped[key].transfer += amount;
        }
      });

      return Object.entries(grouped)
        .map(([period, data]) => ({
          period,
          income: Math.round(data.income * 100) / 100,
          expense: Math.round(data.expense * 100) / 100,
          transfer: Math.round(data.transfer * 100) / 100,
          net: Math.round((data.income - data.expense) * 100) / 100,
          count: data.count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      logger.error("Get transaction summary by period failed", {
        userId,
        startDate,
        endDate,
        groupBy,
        error,
      });
      throw error;
    }
  }

  /**
   * Valida dados da transação
   */
  private async validateTransactionData(
    data: CreateTransactionData,
  ): Promise<void> {
    // Validar valor
    if (data.amount <= 0) {
      throw new ValidationError("O valor deve ser maior que zero");
    }

    // Validar contas baseado no tipo
    switch (data.type) {
      case "INCOME":
        if (!data.toAccountId) {
          throw new ValidationError(
            "Conta de destino é obrigatória para receitas",
          );
        }
        break;
      case "EXPENSE":
        if (!data.fromAccountId) {
          throw new ValidationError(
            "Conta de origem é obrigatória para despesas",
          );
        }
        break;
      case "TRANSFER":
        if (!data.fromAccountId || !data.toAccountId) {
          throw new ValidationError(
            "Contas de origem e destino são obrigatórias para transferências",
          );
        }
        if (data.fromAccountId === data.toAccountId) {
          throw new ValidationError(
            "Conta de origem e destino não podem ser iguais",
          );
        }
        break;
    }

    // Validar se contas existem e pertencem ao tenant
    const accountIds = [data.fromAccountId, data.toAccountId].filter(Boolean);
    if (accountIds.length > 0) {
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          tenantId: data.tenantId,
        },
      });

      if (accounts.length !== accountIds.length) {
        throw new NotFoundError(
          "Uma ou mais contas não foram encontradas ou não são acessíveis",
        );
      }
    }

    // Validar categoria
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        tenantId: data.tenantId,
      },
    });

    if (!category) {
      throw new NotFoundError("Categoria não encontrada ou não acessível");
    }
  }

  /**
   * Calcula resumo das transações
   */
  private calculateTransactionSummary(
    transactions: Array<{
      type: TransactionType;
      amount: any;
      category: string;
      status: TransactionStatus;
    }>,
  ): TransactionSummary {
    const totals = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount);
        acc.totalTransactions += 1;

        if (transaction.type === "INCOME") {
          acc.totalIncome += amount;
        } else if (transaction.type === "EXPENSE") {
          acc.totalExpense += amount;
        } else if (transaction.type === "TRANSFER") {
          acc.totalTransfer += amount;
        }

        return acc;
      },
      {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalTransfer: 0,
      },
    );

    const netAmount = totals.totalIncome - totals.totalExpense;
    const totalAmount =
      totals.totalIncome + totals.totalExpense + totals.totalTransfer;

    // Agrupar por status
    const byStatus = transactions.reduce(
      (acc, t) => {
        const existing = acc.find((item) => item.status === t.status);
        const amount = Number(t.amount);

        if (existing) {
          existing.count += 1;
          existing.totalAmount += amount;
        } else {
          acc.push({ status: t.status, count: 1, totalAmount: amount });
        }

        return acc;
      },
      [] as Array<{
        status: TransactionStatus;
        count: number;
        totalAmount: number;
      }>,
    );

    // Agrupar por categoria
    const byCategory = transactions.reduce(
      (acc, t) => {
        const existing = acc.find((item) => item.category === t.category);
        const amount = Number(t.amount);

        if (existing) {
          existing.count += 1;
          existing.totalAmount += amount;
        } else {
          acc.push({
            category: t.category,
            count: 1,
            totalAmount: amount,
            percentage: 0,
          });
        }

        return acc;
      },
      [] as Array<{
        category: string;
        count: number;
        totalAmount: number;
        percentage: number;
      }>,
    );

    // Calcular percentuais por categoria
    byCategory.forEach((item) => {
      item.percentage =
        totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0;
      item.totalAmount = Math.round(item.totalAmount * 100) / 100;
      item.percentage = Math.round(item.percentage * 100) / 100;
    });

    // Agrupar por tipo
    const byType = transactions.reduce(
      (acc, t) => {
        const existing = acc.find((item) => item.type === t.type);
        const amount = Number(t.amount);

        if (existing) {
          existing.count += 1;
          existing.totalAmount += amount;
        } else {
          acc.push({
            type: t.type,
            count: 1,
            totalAmount: amount,
            percentage: 0,
          });
        }

        return acc;
      },
      [] as Array<{
        type: TransactionType;
        count: number;
        totalAmount: number;
        percentage: number;
      }>,
    );

    // Calcular percentuais por tipo
    byType.forEach((item) => {
      item.percentage =
        totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0;
      item.totalAmount = Math.round(item.totalAmount * 100) / 100;
      item.percentage = Math.round(item.percentage * 100) / 100;
    });

    return {
      totalTransactions: totals.totalTransactions,
      totalIncome: Math.round(totals.totalIncome * 100) / 100,
      totalExpense: Math.round(totals.totalExpense * 100) / 100,
      totalTransfer: Math.round(totals.totalTransfer * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      byStatus: byStatus.map((item) => ({
        ...item,
        totalAmount: Math.round(item.totalAmount * 100) / 100,
      })),
      byCategory: byCategory.sort((a, b) => b.totalAmount - a.totalAmount),
      byType: byType.sort((a, b) => b.totalAmount - a.totalAmount),
    };
  }
}

export const transactionService = new TransactionService();
export default transactionService;
