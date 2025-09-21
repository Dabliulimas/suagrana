import { Router, Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} from "@/middleware/errorHandler";
import { invalidateAccountCache } from "@/middleware/cacheInvalidation";
import { devBypassMiddleware } from "@/middleware/auth";
import { tenantMiddleware } from "@/middleware/tenant";
import { logger, loggerUtils } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste simples
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de contas funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const createAccountValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da conta deve ter entre 2 e 100 caracteres"),
  body("type")
    .isIn(["CHECKING", "SAVINGS", "INVESTMENT", "CREDIT_CARD", "CASH", "OTHER"])
    .withMessage("Tipo de conta inválido"),
  body("balance")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Saldo deve ser um valor decimal válido"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Moeda deve ter 3 caracteres (ex: BRL, USD)"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
];

const updateAccountValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da conta deve ter entre 2 e 100 caracteres"),
  body("type")
    .optional()
    .isIn(["CHECKING", "SAVINGS", "INVESTMENT", "CREDIT_CARD", "CASH", "OTHER"])
    .withMessage("Tipo de conta inválido"),
  body("balance")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Saldo deve ser um valor decimal válido"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Moeda deve ter 3 caracteres (ex: BRL, USD)"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive deve ser um valor booleano"),
];

const listAccountsValidation = [
  query("type")
    .optional()
    .isIn(["CHECKING", "SAVINGS", "INVESTMENT", "CREDIT_CARD", "CASH", "OTHER"])
    .withMessage("Tipo de conta inválido"),
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive deve ser um valor booleano"),
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

// GET /api/accounts - Listar contas do usuário
router.get(
  "/",
  devBypassMiddleware,
  tenantMiddleware,
  listAccountsValidation,
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    // Mock de dados para desenvolvimento
    const tenantId = "dev-tenant-id";
    const { type, isActive, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = { tenantId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === "true";

    // Buscar contas e total
    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          subtype: true,
          currency: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              entries: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip,
        take: limitNum,
      }),
      prisma.account.count({ where }),
    ]);

    // Calcular totais por tipo
    const totalsByType = await prisma.account.groupBy({
      by: ["type"],
      where: { tenantId, isActive: true },
      _count: { id: true },
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
        accounts,
        pagination,
        summary: {
          totalsByType: totalsByType.map((item) => ({
            type: item.type,
            count: item._count.id,
          })),
          activeAccounts: accounts.filter((acc) => acc.isActive).length,
        },
      },
    });
  }),
);

// GET /api/accounts/:id - Obter conta específica
router.get(
  "/:id",
  devBypassMiddleware,
  tenantMiddleware,
  param("id").isUUID().withMessage("ID da conta deve ser um UUID válido"),
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const { tenantId } = req.tenant;

    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        currency: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundError("Conta");
    }

    // Buscar últimas transações
    const recentTransactions = await prisma.transaction.findMany({
      where: { 
        tenantId,
        entries: {
          some: {
            accountId: id
          }
        }
      },
      select: {
        id: true,

        description: true,
        date: true,
        status: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        account,
        recentTransactions,
      },
    });
  }),
);

// POST /api/accounts - Criar nova conta
router.post(
  "/",
  devBypassMiddleware,
  tenantMiddleware,
  createAccountValidation,
  validateInput,
  invalidateAccountCache,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { name, type, balance = 0, currency = "BRL", description } = req.body;
    const { tenantId, userId } = req.tenant;

    // Verificar se já existe conta com mesmo nome
    const existingAccount = await prisma.account.findFirst({
      where: { tenantId, name, isActive: true },
    });

    if (existingAccount) {
      throw new ConflictError("Já existe uma conta ativa com este nome");
    }

    const account = await prisma.account.create({
      data: {
        tenantId,
        name,
        type,
        currency,
        description,
      },
      select: {
        id: true,
        name: true,
        type: true,
        subtype: true,
        currency: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    });

    loggerUtils.logFinancial(
      "account_created",
      userId,
      0,
      account.id,
    );

    res.status(201).json({
      success: true,
      message: "Conta criada com sucesso",
      data: { account },
    });
  }),
);

// PUT /api/accounts/:id - Atualizar conta
router.put(
  "/:id",
  devBypassMiddleware,
  tenantMiddleware,
  param("id").isUUID().withMessage("ID da conta deve ser um UUID válido"),
  updateAccountValidation,
  validateInput,
  invalidateAccountCache,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const { tenantId, userId } = req.tenant;
    const { name, type, currency, description, isActive } = req.body;

    // Verificar se conta existe e pertence ao usuário
    const existingAccount = await prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!existingAccount) {
      throw new NotFoundError("Conta");
    }

    // Se mudando o nome, verificar se não conflita
    if (name && name !== existingAccount.name) {
      const nameConflict = await prisma.account.findFirst({
        where: {
          tenantId,
          name,
          isActive: true,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictError("Já existe uma conta ativa com este nome");
      }
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(currency && { currency }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        subtype: true,
        currency: true,
        description: true,
        isActive: true,
        updatedAt: true,
      },
    });

    loggerUtils.logFinancial("account_updated", userId, undefined, id);

    res.json({
      success: true,
      message: "Conta atualizada com sucesso",
      data: { account: updatedAccount },
    });
  }),
);

// DELETE /api/accounts/:id - Deletar conta
router.delete(
  "/:id",
  devBypassMiddleware,
  tenantMiddleware,
  param("id").isUUID().withMessage("ID da conta deve ser um UUID válido"),
  validateInput,
  invalidateAccountCache,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const { tenantId, userId } = req.tenant;

    // Verificar se conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundError("Conta");
    }

    // Se tem transações, apenas desativar
    if (account._count.entries > 0) {
      await prisma.account.update({
        where: { id },
        data: { isActive: false },
      });

      loggerUtils.logFinancial("account_deactivated", userId, undefined, id);

      res.json({
        success: true,
        message: "Conta desativada com sucesso (possui transações vinculadas)",
      });
    } else {
      // Se não tem transações, deletar permanentemente
      await prisma.account.delete({
        where: { id },
      });

      loggerUtils.logFinancial("account_deleted", userId, undefined, id);

      res.json({
        success: true,
        message: "Conta deletada com sucesso",
      });
    }
  }),
);

// GET /api/accounts/:id/balance-history - Histórico de saldo
router.get(
  "/:id/balance-history",
  devBypassMiddleware,
  tenantMiddleware,
  param("id").isUUID().withMessage("ID da conta deve ser um UUID válido"),
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Dias deve ser um número entre 1 e 365"),
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const { tenantId } = req.tenant;
    const days = parseInt(req.query.days as string) || 30;

    // Verificar se conta existe e pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id, tenantId },
    });

    if (!account) {
      throw new NotFoundError("Conta");
    }

    // Calcular data inicial
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Buscar transações no período
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        entries: {
          some: {
            accountId: id
          }
        },
        date: { gte: startDate },
      },
      select: {
        date: true,
        description: true,
      },
      orderBy: { date: "asc" },
    });

    // Calcular histórico de saldo
    const balanceHistory = [];
    let runningBalance = 0; // Começar com 0 já que Account não tem campo balance

    // Agrupar transações por data
    const transactionsByDate = new Map();
    transactions.forEach((t) => {
      const dateKey = t.date.toISOString().split("T")[0];
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, []);
      }
      transactionsByDate.get(dateKey).push(t);
    });

    // Gerar histórico dia a dia
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const dayTransactions = transactionsByDate.get(dateKey) || [];
      const dayChange = dayTransactions.reduce((sum: number, t: any) => {
        // Simplificado já que não temos campo amount em Transaction
        return sum;
      }, 0);

      runningBalance += dayChange;

      balanceHistory.push({
        date: dateKey,
        balance: Math.round(runningBalance * 100) / 100,
        change: Math.round(dayChange * 100) / 100,
        transactionCount: dayTransactions.length,
      });
    }

    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          name: account.name,
          currentBalance: 0, // Account não tem campo balance
        },
        balanceHistory,
        period: {
          days,
          startDate: startDate.toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
        },
      },
    });
  }),
);

// GET /api/accounts/summary - Resumo das contas
router.get(
  "/summary",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = "demo-user-1";

    // Buscar todas as contas do usuário
    const accounts = await prisma.account.findMany({
      include: {
        entries: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
    });

    // Calcular resumo por tipo de conta
    const summary = {
      totalAccounts: accounts.length,
      totalBalance: 0,
      byType: {} as Record<string, { count: number; balance: number }>,
      activeAccounts: 0,
      inactiveAccounts: 0,
    };

    accounts.forEach((account: any) => {
      // Calcular saldo da conta baseado nas entries
      const accountBalance = account.entries.reduce((sum: number, entry: any) => {
        return sum + Number(entry.credit) - Number(entry.debit);
      }, 0);

      summary.totalBalance += accountBalance;

      // Agrupar por tipo
      if (!summary.byType[account.type]) {
        summary.byType[account.type] = { count: 0, balance: 0 };
      }
      summary.byType[account.type].count++;
      summary.byType[account.type].balance += accountBalance;

      // Contar ativas/inativas
      if (account.isActive) {
        summary.activeAccounts++;
      } else {
        summary.inactiveAccounts++;
      }
    });

    // Arredondar valores
    summary.totalBalance = Math.round(summary.totalBalance * 100) / 100;
    Object.keys(summary.byType).forEach((type) => {
      summary.byType[type].balance = Math.round(summary.byType[type].balance * 100) / 100;
    });

    res.json({
      success: true,
      data: summary,
    });
  }),
);

export default router;
