import { PrismaClient, AccountType } from "@prisma/client";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";

const prisma = new PrismaClient();

export interface CreateAccountData {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  description?: string;
}

export interface UpdateAccountData {
  name?: string;
  balance?: number;
  description?: string;
  isActive?: boolean;
}

export interface AccountWithTransactions {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    category: string;
    date: Date;
  }>;
}

export interface AccountSummary {
  totalAccounts: number;
  totalBalance: number;
  byType: Array<{
    type: AccountType;
    count: number;
    totalBalance: number;
    percentage: number;
  }>;
  activeAccounts: number;
  inactiveAccounts: number;
}

export interface BalanceHistory {
  date: string;
  balance: number;
  dailyChange: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    category: string;
  }>;
}

class AccountService {
  /**
   * Lista todas as contas do usuário
   */
  async getAccounts(
    userId: string,
    filters: {
      type?: AccountType;
      isActive?: boolean;
      search?: string;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    accounts: AccountWithTransactions[];
    summary: AccountSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { type, isActive, search } = filters;
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = { userId };
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Buscar contas com paginação
      const [accounts, totalCount] = await Promise.all([
        prisma.account.findMany({
          where,
          include: {
            transactions: {
              take: 5,
              orderBy: { date: "desc" },
              select: {
                id: true,
                type: true,
                amount: true,
                description: true,
                category: true,
                date: true,
              },
            },
          },
          orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
          skip,
          take: limit,
        }),
        prisma.account.count({ where }),
      ]);

      // Buscar todas as contas para o resumo
      const allAccounts = await prisma.account.findMany({
        where: { userId },
        select: {
          type: true,
          balance: true,
          isActive: true,
        },
      });

      // Calcular resumo
      const summary = this.calculateAccountSummary(allAccounts);

      // Formatar contas
      const formattedAccounts: AccountWithTransactions[] = accounts.map(
        (account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
          balance: Number(account.balance),
          currency: account.currency,
          description: account.description || undefined,
          isActive: account.isActive,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          recentTransactions: account.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            description: t.description,
            category: t.category,
            date: t.date,
          })),
        }),
      );

      return {
        accounts: formattedAccounts,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Get accounts failed", {
        userId,
        filters,
        pagination,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém uma conta específica
   */
  async getAccountById(
    userId: string,
    accountId: string,
  ): Promise<AccountWithTransactions> {
    try {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
        include: {
          transactions: {
            take: 10,
            orderBy: { date: "desc" },
            select: {
              id: true,
              type: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
        },
      });

      if (!account) {
        throw new NotFoundError("Conta não encontrada");
      }

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        currency: account.currency,
        description: account.description || undefined,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        recentTransactions: account.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          category: t.category,
          date: t.date,
        })),
      };
    } catch (error) {
      logger.error("Get account by ID failed", { userId, accountId, error });
      throw error;
    }
  }

  /**
   * Cria uma nova conta
   */
  async createAccount(
    userId: string,
    data: CreateAccountData,
  ): Promise<AccountWithTransactions> {
    try {
      const { name, type, balance = 0, currency = "BRL", description } = data;

      // Verificar se já existe uma conta com o mesmo nome
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId,
          name: { equals: name.trim(), mode: "insensitive" },
        },
      });

      if (existingAccount) {
        throw new ConflictError("Já existe uma conta com este nome");
      }

      // Validar saldo inicial
      if (balance < 0 && type !== "CREDIT_CARD") {
        throw new ValidationError(
          "Saldo inicial não pode ser negativo para este tipo de conta",
        );
      }

      const account = await prisma.account.create({
        data: {
          userId,
          name: name.trim(),
          type,
          balance,
          currency,
          description: description?.trim() || null,
          isActive: true,
        },
      });

      loggerUtils.logFinancial("Account created", {
        userId,
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        initialBalance: Number(account.balance),
      });

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        currency: account.currency,
        description: account.description || undefined,
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        recentTransactions: [],
      };
    } catch (error) {
      logger.error("Create account failed", { userId, data, error });
      throw error;
    }
  }

  /**
   * Atualiza uma conta
   */
  async updateAccount(
    userId: string,
    accountId: string,
    data: UpdateAccountData,
  ): Promise<AccountWithTransactions> {
    try {
      // Verificar se a conta existe e pertence ao usuário
      const existingAccount = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!existingAccount) {
        throw new NotFoundError("Conta não encontrada");
      }

      const { name, balance, description, isActive } = data;
      const updateData: any = { updatedAt: new Date() };

      if (name !== undefined) {
        const trimmedName = name.trim();

        // Verificar conflito de nome
        const nameConflict = await prisma.account.findFirst({
          where: {
            userId,
            name: { equals: trimmedName, mode: "insensitive" },
            id: { not: accountId },
          },
        });

        if (nameConflict) {
          throw new ConflictError("Já existe uma conta com este nome");
        }

        updateData.name = trimmedName;
      }

      if (balance !== undefined) {
        // Validar saldo
        if (balance < 0 && existingAccount.type !== "CREDIT_CARD") {
          throw new ValidationError(
            "Saldo não pode ser negativo para este tipo de conta",
          );
        }
        updateData.balance = balance;
      }

      if (description !== undefined) {
        updateData.description = description.trim() || null;
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: updateData,
        include: {
          transactions: {
            take: 10,
            orderBy: { date: "desc" },
            select: {
              id: true,
              type: true,
              amount: true,
              description: true,
              category: true,
              date: true,
            },
          },
        },
      });

      loggerUtils.logFinancial("Account updated", {
        userId,
        accountId,
        updatedFields: Object.keys(updateData),
        previousBalance: Number(existingAccount.balance),
        newBalance: Number(updatedAccount.balance),
      });

      return {
        id: updatedAccount.id,
        name: updatedAccount.name,
        type: updatedAccount.type,
        balance: Number(updatedAccount.balance),
        currency: updatedAccount.currency,
        description: updatedAccount.description || undefined,
        isActive: updatedAccount.isActive,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
        recentTransactions: updatedAccount.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description,
          category: t.category,
          date: t.date,
        })),
      };
    } catch (error) {
      logger.error("Update account failed", { userId, accountId, data, error });
      throw error;
    }
  }

  /**
   * Deleta ou desativa uma conta
   */
  async deleteAccount(
    userId: string,
    accountId: string,
  ): Promise<{ deleted: boolean; message: string }> {
    try {
      // Verificar se a conta existe e pertence ao usuário
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      });

      if (!account) {
        throw new NotFoundError("Conta não encontrada");
      }

      // Se a conta tem transações, apenas desativar
      if (account._count.transactions > 0) {
        await prisma.account.update({
          where: { id: accountId },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        loggerUtils.logFinancial("Account deactivated", {
          userId,
          accountId,
          accountName: account.name,
          transactionCount: account._count.transactions,
        });

        return {
          deleted: false,
          message: "Conta desativada pois possui transações vinculadas",
        };
      } else {
        // Se não tem transações, deletar permanentemente
        await prisma.account.delete({
          where: { id: accountId },
        });

        loggerUtils.logFinancial("Account deleted", {
          userId,
          accountId,
          accountName: account.name,
        });

        return {
          deleted: true,
          message: "Conta deletada permanentemente",
        };
      }
    } catch (error) {
      logger.error("Delete account failed", { userId, accountId, error });
      throw error;
    }
  }

  /**
   * Obtém o histórico de saldo de uma conta
   */
  async getBalanceHistory(
    userId: string,
    accountId: string,
    days: number = 30,
  ): Promise<BalanceHistory[]> {
    try {
      // Verificar se a conta existe e pertence ao usuário
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new NotFoundError("Conta não encontrada");
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Buscar transações do período
      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [{ accountId }, { toAccountId: accountId }],
          date: { gte: startDate, lte: endDate },
          status: "COMPLETED",
        },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          category: true,
          date: true,
          accountId: true,
          toAccountId: true,
        },
        orderBy: { date: "asc" },
      });

      // Calcular saldo diário
      const history: BalanceHistory[] = [];
      let currentBalance = Number(account.balance);

      // Calcular saldo inicial (subtraindo transações futuras)
      const futureTransactions = transactions.filter((t) => t.date > endDate);
      for (const transaction of futureTransactions) {
        const amount = Number(transaction.amount);
        if (transaction.accountId === accountId) {
          // Transação de saída
          if (transaction.type === "EXPENSE") {
            currentBalance += amount;
          } else if (transaction.type === "INCOME") {
            currentBalance -= amount;
          }
        }
        if (transaction.toAccountId === accountId) {
          // Transação de entrada (transferência)
          currentBalance -= amount;
        }
      }

      // Gerar histórico dia a dia
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        // Transações do dia
        const dayTransactions = transactions.filter(
          (t) => t.date.toISOString().split("T")[0] === dateStr,
        );

        let dailyChange = 0;
        const dayTransactionDetails = [];

        for (const transaction of dayTransactions) {
          const amount = Number(transaction.amount);
          let change = 0;

          if (transaction.accountId === accountId) {
            // Transação de saída
            if (transaction.type === "EXPENSE") {
              change = -amount;
            } else if (transaction.type === "INCOME") {
              change = amount;
            }
          }
          if (transaction.toAccountId === accountId) {
            // Transação de entrada (transferência)
            change = amount;
          }

          dailyChange += change;
          dayTransactionDetails.push({
            id: transaction.id,
            type: transaction.type,
            amount,
            description: transaction.description,
            category: transaction.category,
          });
        }

        currentBalance += dailyChange;

        history.push({
          date: dateStr,
          balance: Math.round(currentBalance * 100) / 100,
          dailyChange: Math.round(dailyChange * 100) / 100,
          transactions: dayTransactionDetails,
        });
      }

      return history;
    } catch (error) {
      logger.error("Get balance history failed", {
        userId,
        accountId,
        days,
        error,
      });
      throw error;
    }
  }

  /**
   * Atualiza o saldo de uma conta
   */
  async updateBalance(
    accountId: string,
    amount: number,
    operation: "add" | "subtract" | "set",
  ): Promise<number> {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { balance: true },
      });

      if (!account) {
        throw new NotFoundError("Conta não encontrada");
      }

      let newBalance: number;
      const currentBalance = Number(account.balance);

      switch (operation) {
        case "add":
          newBalance = currentBalance + amount;
          break;
        case "subtract":
          newBalance = currentBalance - amount;
          break;
        case "set":
          newBalance = amount;
          break;
        default:
          throw new ValidationError("Operação inválida");
      }

      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: newBalance,
          updatedAt: new Date(),
        },
      });

      loggerUtils.logFinancial("Account balance updated", {
        accountId,
        operation,
        amount,
        previousBalance: currentBalance,
        newBalance,
      });

      return Math.round(newBalance * 100) / 100;
    } catch (error) {
      logger.error("Update balance failed", {
        accountId,
        amount,
        operation,
        error,
      });
      throw error;
    }
  }

  /**
   * Calcula resumo das contas
   */
  private calculateAccountSummary(
    accounts: Array<{
      type: AccountType;
      balance: any;
      isActive: boolean;
    }>,
  ): AccountSummary {
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance),
      0,
    );
    const activeAccounts = accounts.filter((acc) => acc.isActive).length;
    const inactiveAccounts = accounts.length - activeAccounts;

    // Agrupar por tipo
    const byType = accounts.reduce(
      (acc, account) => {
        const existing = acc.find((item) => item.type === account.type);
        const balance = Number(account.balance);

        if (existing) {
          existing.count += 1;
          existing.totalBalance += balance;
        } else {
          acc.push({
            type: account.type,
            count: 1,
            totalBalance: balance,
            percentage: 0,
          });
        }

        return acc;
      },
      [] as Array<{
        type: AccountType;
        count: number;
        totalBalance: number;
        percentage: number;
      }>,
    );

    // Calcular percentuais
    byType.forEach((item) => {
      item.percentage =
        totalBalance > 0 ? (item.totalBalance / totalBalance) * 100 : 0;
      item.totalBalance = Math.round(item.totalBalance * 100) / 100;
      item.percentage = Math.round(item.percentage * 100) / 100;
    });

    return {
      totalAccounts: accounts.length,
      totalBalance: Math.round(totalBalance * 100) / 100,
      byType,
      activeAccounts,
      inactiveAccounts,
    };
  }
}

export const accountService = new AccountService();
export default accountService;
