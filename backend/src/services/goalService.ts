import { PrismaClient, GoalStatus, GoalRecurrence } from "@prisma/client";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";

const prisma = new PrismaClient();

export interface CreateGoalData {
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate: Date;
  category?: string;
  recurrence?: GoalRecurrence;
  priority?: number;
}

export interface UpdateGoalData {
  name?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: Date;
  category?: string;
  recurrence?: GoalRecurrence;
  priority?: number;
  status?: GoalStatus;
}

export interface AddProgressData {
  amount: number;
  description?: string;
}

export interface GoalWithMetrics {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category?: string;
  recurrence?: GoalRecurrence;
  priority: number;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
  // Métricas calculadas
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  dailyTargetAmount: number;
  isOverdue: boolean;
  progressVsExpected: number;
  expectedProgressPercentage: number;
}

export interface GoalDashboard {
  overview: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    pausedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgressPercentage: number;
  };
  alerts: {
    urgentGoals: Array<{
      id: string;
      name: string;
      daysRemaining: number;
      progressPercentage: number;
    }>;
    overdueGoals: Array<{
      id: string;
      name: string;
      daysOverdue: number;
      progressPercentage: number;
    }>;
    nearCompletionGoals: Array<{
      id: string;
      name: string;
      progressPercentage: number;
      remainingAmount: number;
    }>;
  };
  byCategory: Array<{
    category: string;
    count: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    progressPercentage: number;
  }>;
  byStatus: Array<{
    status: GoalStatus;
    count: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
  }>;
  recentProgress: Array<{
    goalId: string;
    goalName: string;
    amount: number;
    description?: string;
    date: Date;
  }>;
}

export interface GoalFilters {
  status?: GoalStatus;
  category?: string;
  recurrence?: GoalRecurrence;
  priority?: number;
  search?: string;
  isOverdue?: boolean;
  minProgress?: number;
  maxProgress?: number;
}

class GoalService {
  /**
   * Lista metas com filtros e métricas
   */
  async getGoals(
    userId: string,
    filters: GoalFilters = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {},
  ): Promise<{
    goals: GoalWithMetrics[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        status,
        category,
        recurrence,
        priority,
        search,
        isOverdue,
        minProgress,
        maxProgress,
      } = filters;
      const {
        page = 1,
        limit = 20,
        sortBy = "targetDate",
        sortOrder = "asc",
      } = pagination;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = { userId };

      if (status) where.status = status;
      if (category)
        where.category = { contains: category, mode: "insensitive" };
      if (recurrence) where.recurrence = recurrence;
      if (priority !== undefined) where.priority = priority;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Buscar metas
      const [goals, totalCount] = await Promise.all([
        prisma.goal.findMany({
          where,
          skip,
          take: limit,
        }),
        prisma.goal.count({ where }),
      ]);

      // Calcular métricas para cada meta
      let goalsWithMetrics: GoalWithMetrics[] = goals.map((goal) =>
        this.calculateGoalMetrics(goal),
      );

      // Aplicar filtros baseados em métricas calculadas
      if (isOverdue !== undefined) {
        goalsWithMetrics = goalsWithMetrics.filter((goal) =>
          isOverdue ? goal.isOverdue : !goal.isOverdue,
        );
      }

      if (minProgress !== undefined || maxProgress !== undefined) {
        goalsWithMetrics = goalsWithMetrics.filter((goal) => {
          if (
            minProgress !== undefined &&
            goal.progressPercentage < minProgress
          )
            return false;
          if (
            maxProgress !== undefined &&
            goal.progressPercentage > maxProgress
          )
            return false;
          return true;
        });
      }

      // Ordenar
      goalsWithMetrics.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case "progressPercentage":
            aValue = a.progressPercentage;
            bValue = b.progressPercentage;
            break;
          case "daysRemaining":
            aValue = a.daysRemaining;
            bValue = b.daysRemaining;
            break;
          case "priority":
            aValue = a.priority;
            bValue = b.priority;
            break;
          case "targetAmount":
            aValue = a.targetAmount;
            bValue = b.targetAmount;
            break;
          case "currentAmount":
            aValue = a.currentAmount;
            bValue = b.currentAmount;
            break;
          case "targetDate":
            aValue = a.targetDate.getTime();
            bValue = b.targetDate.getTime();
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }

        if (typeof aValue === "string") {
          return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });

      return {
        goals: goalsWithMetrics,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Get goals failed", { userId, filters, pagination, error });
      throw error;
    }
  }

  /**
   * Obtém uma meta específica com métricas
   */
  async getGoalById(userId: string, goalId: string): Promise<GoalWithMetrics> {
    try {
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });

      if (!goal) {
        throw new NotFoundError("Meta não encontrada");
      }

      return this.calculateGoalMetrics(goal);
    } catch (error) {
      logger.error("Get goal by ID failed", { userId, goalId, error });
      throw error;
    }
  }

  /**
   * Cria uma nova meta
   */
  async createGoal(
    userId: string,
    data: CreateGoalData,
  ): Promise<GoalWithMetrics> {
    try {
      const {
        name,
        description,
        targetAmount,
        currentAmount = 0,
        targetDate,
        category,
        recurrence,
        priority = 1,
      } = data;

      // Validações
      if (targetAmount <= 0) {
        throw new ValidationError("O valor da meta deve ser maior que zero");
      }

      if (currentAmount < 0) {
        throw new ValidationError("O valor atual não pode ser negativo");
      }

      if (currentAmount > targetAmount) {
        throw new ValidationError(
          "O valor atual não pode ser maior que a meta",
        );
      }

      if (targetDate <= new Date()) {
        throw new ValidationError("A data da meta deve ser futura");
      }

      if (priority < 1 || priority > 5) {
        throw new ValidationError("A prioridade deve estar entre 1 e 5");
      }

      // Verificar se já existe uma meta com o mesmo nome
      const existingGoal = await prisma.goal.findFirst({
        where: { userId, name: name.trim() },
      });

      if (existingGoal) {
        throw new ConflictError("Já existe uma meta com este nome");
      }

      // Validar recorrência
      if (
        recurrence &&
        !["NONE", "WEEKLY", "MONTHLY", "YEARLY"].includes(recurrence)
      ) {
        throw new ValidationError("Recorrência inválida");
      }

      // Determinar status inicial
      const status: GoalStatus =
        currentAmount >= targetAmount ? "COMPLETED" : "ACTIVE";

      const goal = await prisma.goal.create({
        data: {
          userId,
          name: name.trim(),
          description: description?.trim() || null,
          targetAmount,
          currentAmount,
          targetDate,
          category: category?.trim() || null,
          recurrence: recurrence || "NONE",
          priority,
          status,
        },
      });

      loggerUtils.logFinancial("Goal created", {
        userId,
        goalId: goal.id,
        name: goal.name,
        targetAmount,
        targetDate,
        status,
      });

      return this.calculateGoalMetrics(goal);
    } catch (error) {
      logger.error("Create goal failed", { userId, data, error });
      throw error;
    }
  }

  /**
   * Atualiza uma meta
   */
  async updateGoal(
    userId: string,
    goalId: string,
    data: UpdateGoalData,
  ): Promise<GoalWithMetrics> {
    try {
      // Verificar se a meta existe e pertence ao usuário
      const existingGoal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });

      if (!existingGoal) {
        throw new NotFoundError("Meta não encontrada");
      }

      const {
        name,
        description,
        targetAmount,
        currentAmount,
        targetDate,
        category,
        recurrence,
        priority,
        status,
      } = data;

      const updateData: any = { updatedAt: new Date() };

      if (name !== undefined) {
        // Verificar conflito de nome
        const conflictGoal = await prisma.goal.findFirst({
          where: {
            userId,
            name: name.trim(),
            id: { not: goalId },
          },
        });

        if (conflictGoal) {
          throw new ConflictError("Já existe uma meta com este nome");
        }

        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      if (targetAmount !== undefined) {
        if (targetAmount <= 0) {
          throw new ValidationError("O valor da meta deve ser maior que zero");
        }
        updateData.targetAmount = targetAmount;
      }

      if (currentAmount !== undefined) {
        if (currentAmount < 0) {
          throw new ValidationError("O valor atual não pode ser negativo");
        }

        const finalTargetAmount =
          targetAmount !== undefined ? targetAmount : existingGoal.targetAmount;
        if (currentAmount > finalTargetAmount) {
          throw new ValidationError(
            "O valor atual não pode ser maior que a meta",
          );
        }

        updateData.currentAmount = currentAmount;
      }

      if (targetDate !== undefined) {
        if (targetDate <= new Date()) {
          throw new ValidationError("A data da meta deve ser futura");
        }
        updateData.targetDate = targetDate;
      }

      if (category !== undefined) {
        updateData.category = category?.trim() || null;
      }

      if (recurrence !== undefined) {
        if (!["NONE", "WEEKLY", "MONTHLY", "YEARLY"].includes(recurrence)) {
          throw new ValidationError("Recorrência inválida");
        }
        updateData.recurrence = recurrence;
      }

      if (priority !== undefined) {
        if (priority < 1 || priority > 5) {
          throw new ValidationError("A prioridade deve estar entre 1 e 5");
        }
        updateData.priority = priority;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      // Auto-completar meta se currentAmount atingir targetAmount
      const finalCurrentAmount =
        currentAmount !== undefined
          ? currentAmount
          : Number(existingGoal.currentAmount);
      const finalTargetAmount =
        targetAmount !== undefined
          ? targetAmount
          : Number(existingGoal.targetAmount);

      if (
        finalCurrentAmount >= finalTargetAmount &&
        updateData.status !== "COMPLETED"
      ) {
        updateData.status = "COMPLETED";
      }

      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: updateData,
      });

      loggerUtils.logFinancial("Goal updated", {
        userId,
        goalId,
        updatedFields: Object.keys(updateData),
        previousStatus: existingGoal.status,
        newStatus: updatedGoal.status,
      });

      return this.calculateGoalMetrics(updatedGoal);
    } catch (error) {
      logger.error("Update goal failed", { userId, goalId, data, error });
      throw error;
    }
  }

  /**
   * Adiciona progresso a uma meta
   */
  async addProgress(
    userId: string,
    goalId: string,
    data: AddProgressData,
  ): Promise<GoalWithMetrics> {
    try {
      const { amount, description } = data;

      // Validações
      if (amount <= 0) {
        throw new ValidationError(
          "O valor do progresso deve ser maior que zero",
        );
      }

      // Verificar se a meta existe e pertence ao usuário
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });

      if (!goal) {
        throw new NotFoundError("Meta não encontrada");
      }

      if (goal.status === "COMPLETED") {
        throw new ValidationError(
          "Não é possível adicionar progresso a uma meta já concluída",
        );
      }

      if (goal.status === "PAUSED") {
        throw new ValidationError(
          "Não é possível adicionar progresso a uma meta pausada",
        );
      }

      const newCurrentAmount = Number(goal.currentAmount) + amount;
      const targetAmount = Number(goal.targetAmount);

      // Determinar novo status
      const newStatus: GoalStatus =
        newCurrentAmount >= targetAmount ? "COMPLETED" : "ACTIVE";

      const updatedGoal = await prisma.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      loggerUtils.logFinancial("Goal progress added", {
        userId,
        goalId,
        progressAmount: amount,
        newCurrentAmount,
        targetAmount,
        newStatus,
        description,
      });

      return this.calculateGoalMetrics(updatedGoal);
    } catch (error) {
      logger.error("Add goal progress failed", { userId, goalId, data, error });
      throw error;
    }
  }

  /**
   * Deleta uma meta
   */
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    try {
      // Verificar se a meta existe e pertence ao usuário
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId },
      });

      if (!goal) {
        throw new NotFoundError("Meta não encontrada");
      }

      await prisma.goal.delete({
        where: { id: goalId },
      });

      loggerUtils.logFinancial("Goal deleted", {
        userId,
        goalId,
        goalName: goal.name,
        status: goal.status,
      });
    } catch (error) {
      logger.error("Delete goal failed", { userId, goalId, error });
      throw error;
    }
  }

  /**
   * Obtém dashboard de metas
   */
  async getGoalsDashboard(userId: string): Promise<GoalDashboard> {
    try {
      const goals = await prisma.goal.findMany({
        where: { userId },
      });

      const goalsWithMetrics = goals.map((goal) =>
        this.calculateGoalMetrics(goal),
      );

      // Overview
      const overview = {
        totalGoals: goals.length,
        completedGoals: goals.filter((g) => g.status === "COMPLETED").length,
        activeGoals: goals.filter((g) => g.status === "ACTIVE").length,
        pausedGoals: goals.filter((g) => g.status === "PAUSED").length,
        totalTargetAmount: goals.reduce(
          (sum, g) => sum + Number(g.targetAmount),
          0,
        ),
        totalCurrentAmount: goals.reduce(
          (sum, g) => sum + Number(g.currentAmount),
          0,
        ),
        overallProgressPercentage: 0,
      };

      overview.overallProgressPercentage =
        overview.totalTargetAmount > 0
          ? (overview.totalCurrentAmount / overview.totalTargetAmount) * 100
          : 0;
      overview.overallProgressPercentage =
        Math.round(overview.overallProgressPercentage * 100) / 100;

      // Alertas
      const now = new Date();
      const urgentGoals = goalsWithMetrics
        .filter(
          (g) =>
            g.status === "ACTIVE" &&
            g.daysRemaining <= 30 &&
            g.daysRemaining > 0,
        )
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.name,
          daysRemaining: g.daysRemaining,
          progressPercentage: g.progressPercentage,
        }));

      const overdueGoals = goalsWithMetrics
        .filter((g) => g.status === "ACTIVE" && g.isOverdue)
        .sort((a, b) => Math.abs(b.daysRemaining) - Math.abs(a.daysRemaining))
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.name,
          daysOverdue: Math.abs(g.daysRemaining),
          progressPercentage: g.progressPercentage,
        }));

      const nearCompletionGoals = goalsWithMetrics
        .filter((g) => g.status === "ACTIVE" && g.progressPercentage >= 80)
        .sort((a, b) => b.progressPercentage - a.progressPercentage)
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.name,
          progressPercentage: g.progressPercentage,
          remainingAmount: g.remainingAmount,
        }));

      // Agrupamento por categoria
      const byCategory = goals
        .filter((g) => g.category)
        .reduce((acc, goal) => {
          const category = goal.category!;
          const existing = acc.find((item) => item.category === category);
          const targetAmount = Number(goal.targetAmount);
          const currentAmount = Number(goal.currentAmount);

          if (existing) {
            existing.count += 1;
            existing.totalTargetAmount += targetAmount;
            existing.totalCurrentAmount += currentAmount;
          } else {
            acc.push({
              category,
              count: 1,
              totalTargetAmount: targetAmount,
              totalCurrentAmount: currentAmount,
              progressPercentage: 0,
            });
          }

          return acc;
        }, [] as any[]);

      // Calcular percentuais por categoria
      byCategory.forEach((item) => {
        item.progressPercentage =
          item.totalTargetAmount > 0
            ? (item.totalCurrentAmount / item.totalTargetAmount) * 100
            : 0;
        item.progressPercentage =
          Math.round(item.progressPercentage * 100) / 100;
        item.totalTargetAmount = Math.round(item.totalTargetAmount * 100) / 100;
        item.totalCurrentAmount =
          Math.round(item.totalCurrentAmount * 100) / 100;
      });

      // Agrupamento por status
      const byStatus = goals.reduce((acc, goal) => {
        const existing = acc.find((item) => item.status === goal.status);
        const targetAmount = Number(goal.targetAmount);
        const currentAmount = Number(goal.currentAmount);

        if (existing) {
          existing.count += 1;
          existing.totalTargetAmount += targetAmount;
          existing.totalCurrentAmount += currentAmount;
        } else {
          acc.push({
            status: goal.status,
            count: 1,
            totalTargetAmount: targetAmount,
            totalCurrentAmount: currentAmount,
          });
        }

        return acc;
      }, [] as any[]);

      // Formatar valores por status
      byStatus.forEach((item) => {
        item.totalTargetAmount = Math.round(item.totalTargetAmount * 100) / 100;
        item.totalCurrentAmount =
          Math.round(item.totalCurrentAmount * 100) / 100;
      });

      // Progresso recente (simulado - em uma implementação real, você teria uma tabela de histórico)
      const recentProgress: any[] = [];

      return {
        overview,
        alerts: {
          urgentGoals,
          overdueGoals,
          nearCompletionGoals,
        },
        byCategory: byCategory.sort(
          (a, b) => b.totalTargetAmount - a.totalTargetAmount,
        ),
        byStatus,
        recentProgress,
      };
    } catch (error) {
      logger.error("Get goals dashboard failed", { userId, error });
      throw error;
    }
  }

  /**
   * Calcula métricas de uma meta
   */
  private calculateGoalMetrics(goal: any): GoalWithMetrics {
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const targetDate = new Date(goal.targetDate);
    const now = new Date();

    // Progresso
    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    // Dias restantes
    const timeDiff = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isOverdue = daysRemaining < 0;

    // Meta diária
    const dailyTargetAmount =
      daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

    // Progresso vs esperado
    const totalDays = Math.ceil(
      (targetDate.getTime() - new Date(goal.createdAt).getTime()) /
        (1000 * 3600 * 24),
    );
    const daysPassed = totalDays - daysRemaining;
    const expectedProgressPercentage =
      totalDays > 0 && daysPassed >= 0 ? (daysPassed / totalDays) * 100 : 0;
    const progressVsExpected = progressPercentage - expectedProgressPercentage;

    return {
      id: goal.id,
      name: goal.name,
      description: goal.description || undefined,
      targetAmount,
      currentAmount,
      targetDate,
      category: goal.category || undefined,
      recurrence: goal.recurrence,
      priority: goal.priority,
      status: goal.status,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      remainingAmount: Math.round(remainingAmount * 100) / 100,
      daysRemaining,
      dailyTargetAmount: Math.round(dailyTargetAmount * 100) / 100,
      isOverdue,
      progressVsExpected: Math.round(progressVsExpected * 100) / 100,
      expectedProgressPercentage:
        Math.round(expectedProgressPercentage * 100) / 100,
    };
  }
}

export const goalService = new GoalService();
export default goalService;
