import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  asyncHandler,
} from "@/middleware/errorHandler";
import { authMiddleware } from "@/middleware/auth";
import { logger, loggerUtils } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste simples
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de usuários funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  body("avatar")
    .optional()
    .isURL()
    .withMessage("Avatar deve ser uma URL válida"),
];

const updateUserProfileValidation = [
  body("monthlyIncome")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Renda mensal deve ser um valor decimal válido"),
  body("emergencyReserve")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Reserva de emergência deve ser um valor decimal válido"),
  body("riskProfile")
    .optional()
    .isIn(["conservative", "moderate", "aggressive"])
    .withMessage(
      "Perfil de risco deve ser: conservative, moderate ou aggressive",
    ),
  body("financialGoals")
    .optional()
    .isArray()
    .withMessage("Metas financeiras devem ser um array"),
  body("preferences")
    .optional()
    .isObject()
    .withMessage("Preferências devem ser um objeto"),
];

// Função para validar entrada
const validateInput = (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/users/profile - Obter perfil do usuário
router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError("Usuário não autenticado");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    // Contar registros
    const [accountsCount, transactionsCount, investmentsCount, goalsCount] =
      await Promise.all([
        prisma.account.count(),
        prisma.transaction.count({ where: { createdBy: user.id } }),
        prisma.investment.count({ where: { userId: user.id } }),
        prisma.goal.count({ where: { userId: user.id } }),
      ]);

    const userWithCounts = {
      ...user,
      _count: {
        accounts: accountsCount,
        transactions: transactionsCount,
        investments: investmentsCount,
        goals: goalsCount,
      },
    };

    res.json({
      success: true,
      data: { user: userWithCounts },
    });
  }),
);

// PUT /api/users/profile - Atualizar perfil básico do usuário
router.put(
  "/profile",
  authMiddleware,
  updateProfileValidation,
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, avatar } = req.body;
    const userId = req.user!.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        updatedAt: true,
      },
    });

    logger.info("User profile updated", {
      userId,
      updatedFields: Object.keys(req.body),
    });

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: { user: updatedUser },
    });
  }),
);

// GET /api/users/financial-profile - Obter perfil financeiro
router.get(
  "/financial-profile",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        monthlyIncome: true,
        emergencyReserve: true,
        riskProfile: true,
        financialGoals: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Se não existe perfil financeiro, criar um vazio
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId: req.user!.id,
        },
        select: {
          id: true,
          monthlyIncome: true,
          emergencyReserve: true,
          riskProfile: true,
          financialGoals: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    res.json({
      success: true,
      data: { profile: userProfile },
    });
  }),
);

// PUT /api/users/financial-profile - Atualizar perfil financeiro
router.put(
  "/financial-profile",
  authMiddleware,
  updateUserProfileValidation,
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      monthlyIncome,
      emergencyReserve,
      riskProfile,
      financialGoals,
      preferences,
    } = req.body;
    const userId = req.user!.id;

    // Verificar se perfil existe
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    let updatedProfile;

    if (existingProfile) {
      // Atualizar perfil existente
      updatedProfile = await prisma.userProfile.update({
        where: { userId },
        data: {
          ...(monthlyIncome !== undefined && { monthlyIncome }),
          ...(emergencyReserve !== undefined && { emergencyReserve }),
          ...(riskProfile && { riskProfile }),
          ...(financialGoals && { financialGoals }),
          ...(preferences && { preferences }),
        },
        select: {
          id: true,
          monthlyIncome: true,
          emergencyReserve: true,
          riskProfile: true,
          financialGoals: true,
          preferences: true,
          updatedAt: true,
        },
      });
    } else {
      // Criar novo perfil
      updatedProfile = await prisma.userProfile.create({
        data: {
          userId,
          ...(monthlyIncome !== undefined && { monthlyIncome }),
          ...(emergencyReserve !== undefined && { emergencyReserve }),
          ...(riskProfile && { riskProfile }),
          ...(financialGoals && { financialGoals }),
          ...(preferences && { preferences }),
        },
        select: {
          id: true,
          monthlyIncome: true,
          emergencyReserve: true,
          riskProfile: true,
          financialGoals: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    loggerUtils.logFinancial("profile_updated", userId);

    res.json({
      success: true,
      message: "Perfil financeiro atualizado com sucesso",
      data: { profile: updatedProfile },
    });
  }),
);

// GET /api/users/dashboard-summary - Resumo para dashboard
router.get(
  "/dashboard-summary",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Buscar dados em paralelo
    const [
      user,
      accountsCount,
      transactionsCount,
      investmentsCount,
      goalsCount,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          userProfile: {
            select: {
              monthlyIncome: true,
              emergencyReserve: true,
              riskProfile: true,
            },
          },
        },
      }),
      prisma.account.count(),
      prisma.transaction.count({ where: { createdBy: userId } }),
      prisma.investment.count({ where: { userId, status: "ACTIVE" } }),
      prisma.goal.count({ where: { userId, status: "ACTIVE" } }),
    ]);

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    // Calcular totais básicos
    const totalBalance = 0; // Simplificado por enquanto

    // Transações do mês atual - simplificado
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyTransactionsCount = await prisma.transaction.count({
      where: {
        createdBy: userId,
        date: { gte: currentMonth },
      },
    });

    const monthlyIncome = 0; // Simplificado por enquanto
    const monthlyExpenses = 0; // Simplificado por enquanto

    const summary = {
      user: {
        name: user.name,
        profile: user.userProfile,
      },
      counts: {
        accounts: accountsCount,
        transactions: transactionsCount,
        investments: investmentsCount,
        goals: goalsCount,
      },
      financial: {
        totalBalance: totalBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlyBalance: monthlyIncome - monthlyExpenses,
      },
    };

    res.json({
      success: true,
      data: { summary },
    });
  }),
);

// DELETE /api/users/account - Deletar conta do usuário
router.delete(
  "/account",
  authMiddleware,
  body("confirmPassword")
    .notEmpty()
    .withMessage("Senha de confirmação é obrigatória"),
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { confirmPassword } = req.body;
    const userId = req.user!.id;

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundError("Usuário");
    }

    // Verificar senha
    const bcrypt = require("bcryptjs");
    const isPasswordValid = await bcrypt.compare(
      confirmPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new ValidationError("Senha incorreta");
    }

    // Deletar usuário (cascade irá deletar dados relacionados)
    await prisma.user.delete({
      where: { id: userId },
    });

    loggerUtils.logSecurity("account_deleted", "high", {
      userId,
      email: req.user!.email,
    });

    res.json({
      success: true,
      message: "Conta deletada com sucesso",
    });
  }),
);

export default router;
