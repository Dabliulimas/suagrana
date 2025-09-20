import { Router } from "express";
import { body, query, param, validationResult } from "express-validator";
import { PrismaClient, GoalStatus } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} from "@/middleware/errorHandler";

import { invalidateGoalCache } from "@/middleware/cacheInvalidation";
import { logger, loggerUtils } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de metas funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const createGoalValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da meta deve ter entre 2 e 100 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
  body("targetAmount")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Valor da meta deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor da meta deve ser um decimal positivo"),
  body("currentAmount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error("Valor atual não pode ser negativo");
      }
      return true;
    })
    .withMessage("Valor atual deve ser um decimal não negativo"),
  body("targetDate")
    .isISO8601()
    .custom((value) => {
      const targetDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate <= today) {
        throw new Error("Data da meta deve ser futura");
      }
      return true;
    })
    .withMessage("Data da meta deve estar no formato ISO 8601 e ser futura"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Prioridade deve ser LOW, MEDIUM ou HIGH"),
  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring deve ser um valor booleano"),
  body("recurringPeriod")
    .optional()
    .isIn(["MONTHLY", "QUARTERLY", "YEARLY"])
    .withMessage("Período recorrente deve ser MONTHLY, QUARTERLY ou YEARLY"),
];

const updateGoalValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da meta deve ter entre 2 e 100 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
  body("targetAmount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error("Valor da meta deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor da meta deve ser um decimal positivo"),
  body("currentAmount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error("Valor atual não pode ser negativo");
      }
      return true;
    })
    .withMessage("Valor atual deve ser um decimal não negativo"),
  body("targetDate")
    .optional()
    .isISO8601()
    .custom((value) => {
      if (value) {
        const targetDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate <= today) {
          throw new Error("Data da meta deve ser futura");
        }
      }
      return true;
    })
    .withMessage("Data da meta deve estar no formato ISO 8601 e ser futura"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Prioridade deve ser LOW, MEDIUM ou HIGH"),
  body("status")
    .optional()
    .isIn(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"])
    .withMessage("Status deve ser ACTIVE, COMPLETED, PAUSED ou CANCELLED"),
  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring deve ser um valor booleano"),
  body("recurringPeriod")
    .optional()
    .isIn(["MONTHLY", "QUARTERLY", "YEARLY"])
    .withMessage("Período recorrente deve ser MONTHLY, QUARTERLY ou YEARLY"),
];

const addProgressValidation = [
  body("amount")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Valor do progresso deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor do progresso deve ser um decimal positivo"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Descrição deve ter no máximo 200 caracteres"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Data deve estar no formato ISO 8601"),
];

const listGoalsValidation = [
  query("status")
    .optional()
    .isIn(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"])
    .withMessage("Status deve ser ACTIVE, COMPLETED, PAUSED ou CANCELLED"),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  query("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Prioridade deve ser LOW, MEDIUM ou HIGH"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Busca deve ter entre 1 e 100 caracteres"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Página deve ser um número inteiro maior que 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limite deve ser um número entre 1 e 100"),
];

// Função para validar entrada
const validateInput = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    throw new ValidationError(errorMessages);
  }
  next();
};

// Função para calcular progresso da meta
const calculateGoalProgress = (currentAmount: number, targetAmount: number) => {
  const percentage =
    targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  return {
    percentage: Math.min(Math.round(percentage * 100) / 100, 100),
    remaining: Math.max(targetAmount - currentAmount, 0),
    isCompleted: currentAmount >= targetAmount,
  };
};

// Função para calcular dias restantes
const calculateDaysRemaining = (targetDate: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// GET /api/goals - Listar metas
router.get(
  "/",
  listGoalsValidation,
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const {
      status,
      category,
      priority,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = { userId };
    if (status) where.status = status;
    if (category) where.category = { contains: category, mode: "insensitive" };
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    // Buscar metas e total
    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          targetAmount: true,
          currentAmount: true,
          targetDate: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { priority: "desc" },
          { targetDate: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limitNum,
      }),
      prisma.goal.count({ where }),
    ]);

    // Calcular métricas para cada meta
    const goalsWithMetrics = goals.map((goal) => {
      const currentAmount = Number(goal.currentAmount);
      const targetAmount = Number(goal.targetAmount);
      const progress = calculateGoalProgress(currentAmount, targetAmount);
      const daysRemaining = calculateDaysRemaining(goal.targetDate);

      return {
        ...goal,
        metrics: {
          ...progress,
          daysRemaining,
          isOverdue: daysRemaining < 0,
          dailyTargetAmount:
            daysRemaining > 0
              ? Math.round((progress.remaining / daysRemaining) * 100) / 100
              : 0,
        },
      };
    });

    // Calcular estatísticas gerais
    const stats = await prisma.goal.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
      _sum: { targetAmount: true, currentAmount: true },
    });

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    };

    res.json({
      success: true,
      data: {
        goals: goalsWithMetrics,
        pagination,
        summary: {
          stats: stats.map((item) => ({
            status: item.status,
            count: item._count.id,
            totalTarget: Number(item._sum.targetAmount || 0),
            totalCurrent: Number(item._sum.currentAmount || 0),
          })),
          totalGoals: total,
          activeGoals: stats.find((s) => s.status === "ACTIVE")?._count.id || 0,
          completedGoals:
            stats.find((s) => s.status === "COMPLETED")?._count.id || 0,
        },
      },
    });
  }),
);

// GET /api/goals/dashboard - Dashboard de metas
router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";

    // Buscar todas as metas ativas
    const activeGoals = await prisma.goal.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        priority: true,
        category: true,
      },
      orderBy: [{ priority: "desc" }, { targetDate: "asc" }],
    });

    // Calcular métricas para cada meta
    const goalsWithMetrics = activeGoals.map((goal) => {
      const currentAmount = Number(goal.currentAmount);
      const targetAmount = Number(goal.targetAmount);
      const progress = calculateGoalProgress(currentAmount, targetAmount);
      const daysRemaining = calculateDaysRemaining(goal.targetDate);

      return {
        ...goal,
        metrics: {
          ...progress,
          daysRemaining,
          isOverdue: daysRemaining < 0,
          isUrgent: daysRemaining <= 30 && daysRemaining > 0,
          dailyTargetAmount:
            daysRemaining > 0
              ? Math.round((progress.remaining / daysRemaining) * 100) / 100
              : 0,
        },
      };
    });

    // Separar metas por status
    const urgentGoals = goalsWithMetrics.filter((g) => g.metrics.isUrgent);
    const overdueGoals = goalsWithMetrics.filter((g) => g.metrics.isOverdue);
    const nearCompletionGoals = goalsWithMetrics.filter(
      (g) => g.metrics.percentage >= 80,
    );

    // Calcular estatísticas gerais
    const totalStats = await prisma.goal.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
      _sum: { targetAmount: true, currentAmount: true },
    });

    const totalTargetAmount = totalStats.reduce(
      (sum, stat) => sum + Number(stat._sum.targetAmount || 0),
      0,
    );
    const totalCurrentAmount = totalStats.reduce(
      (sum, stat) => sum + Number(stat._sum.currentAmount || 0),
      0,
    );
    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalGoals: totalStats.reduce((sum, stat) => sum + stat._count.id, 0),
          activeGoals: activeGoals.length,
          completedGoals:
            totalStats.find((s) => s.status === "COMPLETED")?._count.id || 0,
          totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
          totalCurrentAmount: Math.round(totalCurrentAmount * 100) / 100,
          overallProgress: Math.round(overallProgress * 100) / 100,
        },
        alerts: {
          urgentGoals: urgentGoals.length,
          overdueGoals: overdueGoals.length,
          nearCompletionGoals: nearCompletionGoals.length,
        },
        topGoals: {
          urgent: urgentGoals.slice(0, 5),
          overdue: overdueGoals.slice(0, 5),
          nearCompletion: nearCompletionGoals.slice(0, 5),
          highPriority: goalsWithMetrics
            .filter((g) => g.priority === "HIGH")
            .slice(0, 5),
        },
        byCategory: await prisma.goal
          .groupBy({
            by: ["category"],
            where: { userId, status: "ACTIVE" },
            _count: { id: true },
            _sum: { targetAmount: true, currentAmount: true },
          })
          .then((results) =>
            results.map((item) => ({
              category: item.category || "Sem categoria",
              count: item._count.id,
              totalTarget: Number(item._sum.targetAmount || 0),
              totalCurrent: Number(item._sum.currentAmount || 0),
              progress: item._sum.targetAmount
                ? Math.round(
                    (Number(item._sum.currentAmount || 0) /
                      Number(item._sum.targetAmount)) *
                      10000,
                  ) / 100
                : 0,
            })),
          ),
      },
    });
  }),
);

// GET /api/goals/:id - Obter meta específica
router.get(
  "/:id",
  param("id").isUUID().withMessage("ID da meta deve ser um UUID válido"),
  validateInput,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";

    const goal = await prisma.goal.findFirst({
      where: { id, createdBy: userId },
    });

    if (!goal) {
      throw new NotFoundError("Meta");
    }

    // Calcular métricas
    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);
    const progress = calculateGoalProgress(currentAmount, targetAmount);
    const daysRemaining = calculateDaysRemaining(goal.targetDate);

    // Calcular histórico de progresso (simulado - em uma implementação real, você teria uma tabela de histórico)
    const createdDate = new Date(goal.createdAt);
    const totalDays = Math.ceil(
      (goal.targetDate.getTime() - createdDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const elapsedDays = totalDays - daysRemaining;
    const expectedProgress =
      elapsedDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    res.json({
      success: true,
      data: {
        goal: {
          ...goal,
          metrics: {
            ...progress,
            daysRemaining,
            isOverdue: daysRemaining < 0,
            dailyTargetAmount:
              daysRemaining > 0
                ? Math.round((progress.remaining / daysRemaining) * 100) / 100
                : 0,
            totalDays,
            elapsedDays,
            expectedProgress: Math.round(expectedProgress * 100) / 100,
            progressVsExpected:
              Math.round((progress.percentage - expectedProgress) * 100) / 100,
          },
        },
      },
    });
  }),
);

// POST /api/goals - Criar nova meta
router.post(
  "/",
  createGoalValidation,
  validateInput,
  invalidateGoalCache,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      targetAmount,
      currentAmount = 0,
      targetDate,
      category,
      priority = "MEDIUM",
      isRecurring = false,
      recurringPeriod,
    } = req.body;
    const userId = "demo-user-1";

    // Verificar se já existe meta ativa com mesmo nome
    const existingGoal = await prisma.goal.findFirst({
      where: {
        userId,
        name,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });

    if (existingGoal) {
      throw new ConflictError("Já existe uma meta ativa com este nome");
    }

    // Validar período recorrente
    if (isRecurring && !recurringPeriod) {
      throw new ValidationError(
        "Período recorrente é obrigatório para metas recorrentes",
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        name,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount.toString()),
        targetDate: new Date(targetDate),
        category,
        priority,
        status: "ACTIVE",
        isRecurring,
        recurringPeriod,
      },
      select: {
        id: true,
        name: true,
        description: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        category: true,
        priority: true,
        status: true,
        isRecurring: true,
        recurringPeriod: true,
        createdAt: true,
      },
    });

    loggerUtils.logFinancial(
      "goal_created",
      userId,
      parseFloat(targetAmount),
      goal.id,
    );

    res.status(201).json({
      success: true,
      message: "Meta criada com sucesso",
      data: { goal },
    });
  }),
);

// PUT /api/goals/:id - Atualizar meta
router.put(
  "/:id",
  param("id").isUUID().withMessage("ID da meta deve ser um UUID válido"),
  updateGoalValidation,
  validateInput,
  invalidateGoalCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";
    const updateData = req.body;

    // Verificar se meta existe e pertence ao usuário
    const existingGoal = await prisma.goal.findFirst({
      where: { id, createdBy: userId },
    });

    if (!existingGoal) {
      throw new NotFoundError("Meta");
    }

    // Se mudando o nome, verificar se não conflita
    if (updateData.name && updateData.name !== existingGoal.name) {
      const nameConflict = await prisma.goal.findFirst({
        where: {
          userId,
          name: updateData.name,
          status: { in: ["ACTIVE", "PAUSED"] },
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictError("Já existe uma meta ativa com este nome");
      }
    }

    // Se atualizando currentAmount, verificar se completa a meta
    let autoCompleteStatus = undefined;
    if (updateData.currentAmount !== undefined) {
      const newCurrentAmount = parseFloat(updateData.currentAmount);
      const targetAmount = Number(
        updateData.targetAmount || existingGoal.targetAmount,
      );

      if (
        newCurrentAmount >= targetAmount &&
        existingGoal.status === "ACTIVE"
      ) {
        autoCompleteStatus = "COMPLETED";
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && {
          description: updateData.description,
        }),
        ...(updateData.targetAmount && {
          targetAmount: parseFloat(updateData.targetAmount),
        }),
        ...(updateData.currentAmount !== undefined && {
          currentAmount: parseFloat(updateData.currentAmount),
        }),
        ...(updateData.targetDate && {
          targetDate: new Date(updateData.targetDate),
        }),
        ...(updateData.category !== undefined && {
          category: updateData.category,
        }),
        ...(updateData.priority && { priority: updateData.priority }),
        ...(updateData.status && { status: updateData.status }),
        ...(autoCompleteStatus && { status: autoCompleteStatus }),
        ...(updateData.isRecurring !== undefined && {
          isRecurring: updateData.isRecurring,
        }),
        ...(updateData.recurringPeriod !== undefined && {
          recurringPeriod: updateData.recurringPeriod,
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        category: true,
        priority: true,
        status: true,
        isRecurring: true,
        recurringPeriod: true,
        updatedAt: true,
      },
    });

    loggerUtils.logFinancial("goal_updated", userId, undefined, id);

    res.json({
      success: true,
      message: `Meta atualizada com sucesso${autoCompleteStatus ? " e marcada como concluída" : ""}`,
      data: { goal: updatedGoal },
    });
  }),
);

// POST /api/goals/:id/progress - Adicionar progresso à meta
router.post(
  "/:id/progress",
  param("id").isUUID().withMessage("ID da meta deve ser um UUID válido"),
  addProgressValidation,
  validateInput,
  invalidateGoalCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, description, date } = req.body;
    const userId = "demo-user-1";

    // Verificar se meta existe e pertence ao usuário
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundError("Meta");
    }

    if (goal.status !== "ACTIVE") {
      throw new ValidationError(
        "Só é possível adicionar progresso a metas ativas",
      );
    }

    const progressAmount = parseFloat(amount);
    const newCurrentAmount = Number(goal.currentAmount) + progressAmount;
    const targetAmount = Number(goal.targetAmount);

    // Verificar se completa a meta
    const isCompleted = newCurrentAmount >= targetAmount;
    const newStatus = isCompleted ? "COMPLETED" : "ACTIVE";

    // Atualizar a meta
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        currentAmount: newCurrentAmount,
        status: newStatus,
      },
      select: {
        id: true,
        name: true,
        currentAmount: true,
        targetAmount: true,
        status: true,
      },
    });

    loggerUtils.logFinancial("goal_progress_added", userId, progressAmount, id);

    // Calcular métricas atualizadas
    const progress = calculateGoalProgress(newCurrentAmount, targetAmount);

    res.json({
      success: true,
      message: `Progresso adicionado com sucesso${isCompleted ? ". Meta concluída!" : ""}`,
      data: {
        goal: updatedGoal,
        progress: {
          addedAmount: progressAmount,
          ...progress,
        },
      },
    });
  }),
);

// DELETE /api/goals/:id - Deletar meta
router.delete(
  "/:id",
  param("id").isUUID().withMessage("ID da meta deve ser um UUID válido"),
  validateInput,
  invalidateGoalCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";

    // Verificar se meta existe e pertence ao usuário
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundError("Meta");
    }

    await prisma.goal.delete({
      where: { id },
    });

    loggerUtils.logFinancial("goal_deleted", userId, undefined, id);

    res.json({
      success: true,
      message: "Meta deletada com sucesso",
    });
  }),
);



export default router;
