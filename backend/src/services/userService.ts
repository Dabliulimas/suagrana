import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthenticationError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";
import { config } from "../config/config";

const prisma = new PrismaClient();

export interface UpdateUserProfileData {
  name?: string;
  email?: string;
}

export interface UpdateFinancialProfileData {
  phone?: string;
  dateOfBirth?: string;
  occupation?: string;
  monthlyIncome?: number;
  financialGoals?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface FinancialProfile {
  id: string;
  userId: string;
  phone?: string;
  dateOfBirth?: Date;
  occupation?: string;
  monthlyIncome?: number;
  financialGoals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardSummary {
  accounts: {
    total: number;
    totalBalance: number;
    byType: Array<{
      type: string;
      count: number;
      balance: number;
    }>;
  };
  transactions: {
    total: number;
    thisMonth: {
      income: number;
      expense: number;
      net: number;
      count: number;
    };
    lastMonth: {
      income: number;
      expense: number;
      net: number;
      count: number;
    };
  };
  investments: {
    total: number;
    totalInvested: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercentage: number;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
    totalTarget: number;
    totalCurrent: number;
    overallProgress: number;
  };
}

class UserService {
  /**
   * Obtém o perfil básico do usuário
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new NotFoundError("Usuário não encontrado");
      }

      return user;
    } catch (error) {
      logger.error("Get user profile failed", { userId, error });
      throw error;
    }
  }

  /**
   * Atualiza o perfil básico do usuário
   */
  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<UserProfile> {
    try {
      const { name, email } = data;
      const updateData: any = {};

      if (name !== undefined) {
        updateData.name = name.trim();
      }

      if (email !== undefined) {
        const normalizedEmail = email.toLowerCase().trim();

        // Verificar se o email já está em uso por outro usuário
        const existingUser = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new ConflictError(
            "Este email já está em uso por outro usuário",
          );
        }

        updateData.email = normalizedEmail;
        updateData.isEmailVerified = false; // Requer nova verificação
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError(
          "Nenhum dado válido fornecido para atualização",
        );
      }

      updateData.updatedAt = new Date();

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });

      loggerUtils.logDatabase("User profile updated", {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error("Update user profile failed", { userId, error });
      throw error;
    }
  }

  /**
   * Obtém o perfil financeiro do usuário
   */
  async getFinancialProfile(userId: string): Promise<FinancialProfile | null> {
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          phone: true,
          dateOfBirth: true,
          occupation: true,
          monthlyIncome: true,
          financialGoals: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!profile) {
        return null;
      }

      return {
        ...profile,
        monthlyIncome: profile.monthlyIncome
          ? Number(profile.monthlyIncome)
          : undefined,
      };
    } catch (error) {
      logger.error("Get financial profile failed", { userId, error });
      throw error;
    }
  }

  /**
   * Atualiza ou cria o perfil financeiro do usuário
   */
  async updateFinancialProfile(
    userId: string,
    data: UpdateFinancialProfileData,
  ): Promise<FinancialProfile> {
    try {
      const { phone, dateOfBirth, occupation, monthlyIncome, financialGoals } =
        data;

      const updateData: any = {};

      if (phone !== undefined) {
        updateData.phone = phone.trim() || null;
      }

      if (dateOfBirth !== undefined) {
        updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      }

      if (occupation !== undefined) {
        updateData.occupation = occupation.trim() || null;
      }

      if (monthlyIncome !== undefined) {
        updateData.monthlyIncome = monthlyIncome > 0 ? monthlyIncome : null;
      }

      if (financialGoals !== undefined) {
        updateData.financialGoals = Array.isArray(financialGoals)
          ? financialGoals
          : [];
      }

      updateData.updatedAt = new Date();

      // Verificar se o perfil já existe
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId },
      });

      let profile;
      if (existingProfile) {
        // Atualizar perfil existente
        profile = await prisma.userProfile.update({
          where: { userId },
          data: updateData,
          select: {
            id: true,
            userId: true,
            phone: true,
            dateOfBirth: true,
            occupation: true,
            monthlyIncome: true,
            financialGoals: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      } else {
        // Criar novo perfil
        profile = await prisma.userProfile.create({
          data: {
            userId,
            ...updateData,
            createdAt: new Date(),
          },
          select: {
            id: true,
            userId: true,
            phone: true,
            dateOfBirth: true,
            occupation: true,
            monthlyIncome: true,
            financialGoals: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      loggerUtils.logDatabase("Financial profile updated", {
        userId,
        profileId: profile.id,
        action: existingProfile ? "updated" : "created",
      });

      return {
        ...profile,
        monthlyIncome: profile.monthlyIncome
          ? Number(profile.monthlyIncome)
          : undefined,
      };
    } catch (error) {
      logger.error("Update financial profile failed", { userId, error });
      throw error;
    }
  }

  /**
   * Obtém resumo do dashboard do usuário
   */
  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        0,
        23,
        59,
        59,
      );

      // Buscar dados em paralelo
      const [
        accounts,
        thisMonthTransactions,
        lastMonthTransactions,
        investments,
        goals,
      ] = await Promise.all([
        // Contas
        prisma.account.findMany({
          where: { userId, isActive: true },
          select: {
            type: true,
            balance: true,
          },
        }),

        // Transações deste mês
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: startOfThisMonth },
            status: "COMPLETED",
          },
          select: {
            type: true,
            amount: true,
          },
        }),

        // Transações do mês passado
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: startOfLastMonth, lte: endOfLastMonth },
            status: "COMPLETED",
          },
          select: {
            type: true,
            amount: true,
          },
        }),

        // Investimentos
        prisma.investment.findMany({
          where: { userId },
          select: {
            quantity: true,
            purchasePrice: true,
            currentPrice: true,
          },
        }),

        // Metas
        prisma.goal.findMany({
          where: { userId },
          select: {
            status: true,
            targetAmount: true,
            currentAmount: true,
          },
        }),
      ]);

      // Processar contas
      const accountSummary = accounts.reduce(
        (acc, account) => {
          const balance = Number(account.balance);
          acc.totalBalance += balance;

          const typeIndex = acc.byType.findIndex(
            (t) => t.type === account.type,
          );
          if (typeIndex >= 0) {
            acc.byType[typeIndex].count += 1;
            acc.byType[typeIndex].balance += balance;
          } else {
            acc.byType.push({
              type: account.type,
              count: 1,
              balance,
            });
          }

          return acc;
        },
        {
          total: accounts.length,
          totalBalance: 0,
          byType: [] as Array<{ type: string; count: number; balance: number }>,
        },
      );

      // Processar transações deste mês
      const thisMonthSummary = thisMonthTransactions.reduce(
        (acc, transaction) => {
          const amount = Number(transaction.amount);
          acc.count += 1;

          if (transaction.type === "INCOME") {
            acc.income += amount;
          } else if (transaction.type === "EXPENSE") {
            acc.expense += amount;
          }

          return acc;
        },
        { income: 0, expense: 0, net: 0, count: 0 },
      );
      thisMonthSummary.net = thisMonthSummary.income - thisMonthSummary.expense;

      // Processar transações do mês passado
      const lastMonthSummary = lastMonthTransactions.reduce(
        (acc, transaction) => {
          const amount = Number(transaction.amount);
          acc.count += 1;

          if (transaction.type === "INCOME") {
            acc.income += amount;
          } else if (transaction.type === "EXPENSE") {
            acc.expense += amount;
          }

          return acc;
        },
        { income: 0, expense: 0, net: 0, count: 0 },
      );
      lastMonthSummary.net = lastMonthSummary.income - lastMonthSummary.expense;

      // Processar investimentos
      const investmentSummary = investments.reduce(
        (acc, investment) => {
          const quantity = Number(investment.quantity);
          const purchasePrice = Number(investment.purchasePrice);
          const currentPrice = Number(
            investment.currentPrice || investment.purchasePrice,
          );

          const invested = quantity * purchasePrice;
          const current = quantity * currentPrice;

          acc.totalInvested += invested;
          acc.currentValue += current;
          acc.gainLoss += current - invested;

          return acc;
        },
        {
          total: investments.length,
          totalInvested: 0,
          currentValue: 0,
          gainLoss: 0,
          gainLossPercentage: 0,
        },
      );

      investmentSummary.gainLossPercentage =
        investmentSummary.totalInvested > 0
          ? (investmentSummary.gainLoss / investmentSummary.totalInvested) * 100
          : 0;

      // Processar metas
      const goalSummary = goals.reduce(
        (acc, goal) => {
          acc.total += 1;

          if (goal.status === "ACTIVE") {
            acc.active += 1;
          } else if (goal.status === "COMPLETED") {
            acc.completed += 1;
          }

          acc.totalTarget += Number(goal.targetAmount);
          acc.totalCurrent += Number(goal.currentAmount);

          return acc;
        },
        {
          total: 0,
          active: 0,
          completed: 0,
          totalTarget: 0,
          totalCurrent: 0,
          overallProgress: 0,
        },
      );

      goalSummary.overallProgress =
        goalSummary.totalTarget > 0
          ? (goalSummary.totalCurrent / goalSummary.totalTarget) * 100
          : 0;

      return {
        accounts: {
          total: accountSummary.total,
          totalBalance: Math.round(accountSummary.totalBalance * 100) / 100,
          byType: accountSummary.byType.map((type) => ({
            ...type,
            balance: Math.round(type.balance * 100) / 100,
          })),
        },
        transactions: {
          total: thisMonthTransactions.length + lastMonthTransactions.length,
          thisMonth: {
            income: Math.round(thisMonthSummary.income * 100) / 100,
            expense: Math.round(thisMonthSummary.expense * 100) / 100,
            net: Math.round(thisMonthSummary.net * 100) / 100,
            count: thisMonthSummary.count,
          },
          lastMonth: {
            income: Math.round(lastMonthSummary.income * 100) / 100,
            expense: Math.round(lastMonthSummary.expense * 100) / 100,
            net: Math.round(lastMonthSummary.net * 100) / 100,
            count: lastMonthSummary.count,
          },
        },
        investments: {
          total: investmentSummary.total,
          totalInvested:
            Math.round(investmentSummary.totalInvested * 100) / 100,
          currentValue: Math.round(investmentSummary.currentValue * 100) / 100,
          gainLoss: Math.round(investmentSummary.gainLoss * 100) / 100,
          gainLossPercentage:
            Math.round(investmentSummary.gainLossPercentage * 100) / 100,
        },
        goals: {
          total: goalSummary.total,
          active: goalSummary.active,
          completed: goalSummary.completed,
          totalTarget: Math.round(goalSummary.totalTarget * 100) / 100,
          totalCurrent: Math.round(goalSummary.totalCurrent * 100) / 100,
          overallProgress: Math.round(goalSummary.overallProgress * 100) / 100,
        },
      };
    } catch (error) {
      logger.error("Get dashboard summary failed", { userId, error });
      throw error;
    }
  }

  /**
   * Deleta a conta do usuário
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    try {
      // Verificar senha
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true },
      });

      if (!user) {
        throw new NotFoundError("Usuário não encontrado");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError("Senha incorreta");
      }

      // Deletar em cascata (Prisma vai cuidar das relações)
      await prisma.user.delete({
        where: { id: userId },
      });

      loggerUtils.logAuth("User account deleted", {
        userId,
        email: user.email,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error("Delete account failed", { userId, error });
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
