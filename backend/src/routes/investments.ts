import { Router } from "express";
import { body, query, param, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} from "@/middleware/errorHandler";
import { authMiddleware } from "@/middleware/auth";
import { tenantMiddleware } from "@/middleware/tenant";

const invalidateInvestmentCache = (req: any, res: any, next: any) => {
  // Cache invalidation placeholder
  next();
};

const loggerUtils = {
  logFinancial: (action: string, userId: string, amount?: number, resourceId?: string) => {
    console.log(`Financial action: ${action}, User: ${userId}, Amount: ${amount}, Resource: ${resourceId}`);
  }
};

type InvestmentType = "STOCK" | "BOND" | "FUND" | "ETF" | "CRYPTO" | "REAL_ESTATE" | "OTHER";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de teste de investimentos funcionando",
    timestamp: new Date().toISOString(),
  });
});

// Rota de teste para POST
router.post("/test-post", (req, res) => {
  res.json({
    success: true,
    message: "Rota POST de teste funcionando",
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Rota para verificar usuários
router.get("/test-users", asyncHandler(async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      take: 10,
    });

    res.json({
      success: true,
      message: "Usuários encontrados",
      data: { users, count: users.length },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error.message,
    });
  }
}));



// Validações para investimentos
const createInvestmentValidation = [
  body("symbol")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Símbolo deve ter entre 2 e 20 caracteres"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  body("type")
    .isIn(["STOCK", "BOND", "FUND", "ETF", "CRYPTO", "REAL_ESTATE", "OTHER"])
    .withMessage("Tipo de investimento inválido"),
  body("quantity")
    .isDecimal({ decimal_digits: "0,8" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Quantidade deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Quantidade deve ser um decimal positivo"),
  body("purchasePrice")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Preço de compra deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Preço de compra deve ser um decimal positivo"),
  body("currentPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error("Preço atual não pode ser negativo");
      }
      return true;
    })
    .withMessage("Preço atual deve ser um decimal não negativo"),
  body("purchaseDate")
    .isISO8601()
    .withMessage("Data de compra deve estar no formato ISO 8601"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notas devem ter no máximo 1000 caracteres"),
];

const updateInvestmentValidation = [
  body("symbol")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Símbolo deve ter entre 2 e 20 caracteres"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  body("type")
    .optional()
    .isIn(["STOCK", "BOND", "FUND", "ETF", "CRYPTO", "REAL_ESTATE", "OTHER"])
    .withMessage("Tipo de investimento inválido"),
  body("quantity")
    .optional()
    .isDecimal({ decimal_digits: "0,8" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error("Quantidade deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Quantidade deve ser um decimal positivo"),
  body("purchasePrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error("Preço de compra deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Preço de compra deve ser um decimal positivo"),
  body("currentPrice")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error("Preço atual não pode ser negativo");
      }
      return true;
    })
    .withMessage("Preço atual deve ser um decimal não negativo"),
  body("purchaseDate")
    .optional()
    .isISO8601()
    .withMessage("Data de compra deve estar no formato ISO 8601"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notas devem ter no máximo 1000 caracteres"),
];

// Validações para dividendos
const createDividendValidation = [
  body("amount")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Valor do dividendo deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor do dividendo deve ser um decimal positivo"),
  body("paymentDate")
    .isISO8601()
    .withMessage("Data de pagamento deve estar no formato ISO 8601"),
  body("type")
    .optional()
    .isIn(["CASH", "STOCK", "OTHER"])
    .withMessage("Tipo de dividendo inválido"),
];

const listInvestmentsValidation = [
  query("type")
    .optional()
    .isIn(["STOCK", "BOND", "FUND", "ETF", "CRYPTO", "REAL_ESTATE", "OTHER"])
    .withMessage("Tipo de investimento inválido"),
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

// GET /api/investments - Listar investimentos
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  listInvestmentsValidation,
  validateInput,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const userId = req.tenant.userId;
    const { type, search, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = { userId };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { symbol: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Buscar investimentos e total
    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        select: {
          id: true,
          symbol: true,
          name: true,
          type: true,
          quantity: true,
          purchasePrice: true,
          currentPrice: true,
          purchaseDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              dividends: true,
            },
          },
        },
        orderBy: [{ symbol: "asc" }],
        skip,
        take: limitNum,
      }),
      prisma.investment.count({ where }),
    ]);

    // Calcular métricas para cada investimento
    const investmentsWithMetrics = investments.map((inv) => {
      const quantity = Number(inv.quantity);
      const purchasePrice = Number(inv.purchasePrice);
      const currentPrice = Number(inv.currentPrice || inv.purchasePrice);
      const totalInvested = quantity * purchasePrice;
      const currentValue = quantity * currentPrice;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercentage =
        totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

      return {
        ...inv,
        metrics: {
          totalInvested: Math.round(totalInvested * 100) / 100,
          currentValue: Math.round(currentValue * 100) / 100,
          gainLoss: Math.round(gainLoss * 100) / 100,
          gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
        },
      };
    });

    // Calcular totais da carteira
    const portfolioTotals = investmentsWithMetrics.reduce(
      (acc, inv) => {
        acc.totalInvested += inv.metrics.totalInvested;
        acc.currentValue += inv.metrics.currentValue;
        acc.gainLoss += inv.metrics.gainLoss;
        return acc;
      },
      { totalInvested: 0, currentValue: 0, gainLoss: 0 },
    );

    const portfolioGainLossPercentage =
      portfolioTotals.totalInvested > 0
        ? (portfolioTotals.gainLoss / portfolioTotals.totalInvested) * 100
        : 0;

    // Agrupar por tipo
    const byType = await prisma.investment.groupBy({
      by: ["type"],
      where: { userId },
      _count: { id: true },
      _sum: {
        quantity: true,
        purchasePrice: true,
        currentPrice: true,
      },
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
        investments: investmentsWithMetrics,
        pagination,
        portfolio: {
          totalInvested: Math.round(portfolioTotals.totalInvested * 100) / 100,
          currentValue: Math.round(portfolioTotals.currentValue * 100) / 100,
          gainLoss: Math.round(portfolioTotals.gainLoss * 100) / 100,
          gainLossPercentage:
            Math.round(portfolioGainLossPercentage * 100) / 100,
          totalInvestments: total,
        },
        byType: byType.map((item) => ({
          type: item.type,
          count: item._count.id,
        })),
      },
    });
  }),
);

// GET /api/investments/dividends - Listar todos os dividendos
router.get(
  "/dividends",
  authMiddleware,
  tenantMiddleware,
  query("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Ano deve ser um número entre 2000 e 2100"),
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Mês deve ser um número entre 1 e 12"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Página deve ser um número inteiro maior que 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limite deve ser um número entre 1 e 100"),
  validateInput,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const userId = req.tenant.userId;
    const { year, month, page = "1", limit = "20" } = req.query;

    // Construir filtros de data
    const dateFilters: any = {};
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);
      dateFilters.paymentDate = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (month && year) {
      const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      dateFilters.paymentDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    try {
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [dividends, total, totalAmount] = await Promise.all([
        prisma.dividend.findMany({
          where: {
            investment: {
              userId,
            },
            ...dateFilters,
          },
          include: {
            investment: {
              select: {
                symbol: true,
                name: true,
              },
            },
          },
          orderBy: {
            paymentDate: "desc",
          },
          skip,
          take: limitNum,
        }),
        prisma.dividend.count({
          where: {
            investment: {
              userId,
            },
            ...dateFilters,
          },
        }),
        prisma.dividend.aggregate({
          where: {
            investment: {
              userId,
            },
            ...dateFilters,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const pagination = {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      };

      res.json({
        success: true,
        data: {
          dividends,
          pagination,
          summary: {
            totalAmount: Number(totalAmount._sum.amount || 0),
            totalDividends: total,
            period: year
              ? {
                  year: parseInt(year as string),
                  month: month ? parseInt(month as string) : undefined,
                }
              : undefined,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }),
);

// GET /api/investments/portfolio/summary - Resumo da carteira
router.get(
  "/portfolio/summary",
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const userId = req.tenant.userId;

    try {
      const investments = await prisma.investment.findMany({
        where: {
          userId,
        },
        include: {
          dividends: true,
        },
      });

      let totalInvested = 0;
      let currentValue = 0;
      let totalDividends = 0;
      const typeAllocation: { [key: string]: { count: number; value: number } } = {};

      investments.forEach((investment) => {
        const invested = parseFloat(investment.quantity) * parseFloat(investment.purchasePrice);
        const current = parseFloat(investment.quantity) * parseFloat(investment.currentPrice || investment.purchasePrice);
        const dividendSum = investment.dividends.reduce((sum, div) => sum + parseFloat(div.amount), 0);

        totalInvested += invested;
        currentValue += current;
        totalDividends += dividendSum;

        if (!typeAllocation[investment.type]) {
          typeAllocation[investment.type] = { count: 0, value: 0 };
        }
        typeAllocation[investment.type].count++;
        typeAllocation[investment.type].value += current;
      });

      const gainLoss = currentValue - totalInvested;
      const gainLossPercentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
      const dividendYield = totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

      const allocationByType = Object.entries(typeAllocation).map(([type, data]) => ({
        type,
        count: data.count,
        value: Math.round(data.value * 100) / 100,
        percentage: currentValue > 0 ? Math.round((data.value / currentValue) * 10000) / 100 : 0,
      }));

      res.json({
        success: true,
        data: {
          portfolio: {
            totalInvestments: investments.length,
            totalInvested: Math.round(totalInvested * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            gainLoss: Math.round(gainLoss * 100) / 100,
            gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
            totalDividends: Math.round(totalDividends * 100) / 100,
            dividendYield: Math.round(dividendYield * 100) / 100,
          },
          allocation: {
            byType: allocationByType,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }),
);



// POST /api/investments/:id/dividends - Adicionar dividendo
router.post("/:id/dividends", authMiddleware, tenantMiddleware, createDividendValidation, validateInput, asyncHandler(async (req, res) => {
  if (!req.tenant) {
    throw new ValidationError("Contexto do tenant não encontrado");
  }

  const { id } = req.params;
  const {
    amount,
    paymentDate,
    type = "CASH",
  } = req.body;
  const userId = req.tenant.userId;

  // Verificar se investimento existe e pertence ao usuário
  const investment = await prisma.investment.findFirst({
    where: { id, userId },
  });

  if (!investment) {
    throw new NotFoundError("Investimento");
  }

  const dividend = await prisma.dividend.create({
    data: {
      tenantId: req.tenant.id,
      investmentId: id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      type: type as "CASH" | "STOCK" | "OTHER",
    },
  });

  loggerUtils.logFinancial(
    "dividend_created",
    userId,
    parseFloat(amount),
    id,
  );

  res.status(201).json({
    success: true,
    message: "Dividendo adicionado com sucesso",
    data: { dividend },
  });
}));

// GET /api/investments/:id - Obter investimento por ID
router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id")
    .isLength({ min: 20, max: 30 })
    .matches(/^[a-z0-9]+$/)
    .withMessage("ID do investimento deve ser um CUID válido"),
  validateInput,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const userId = req.tenant.userId;

    const investment = await prisma.investment.findFirst({
      where: { id, userId },
      include: {
        dividends: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            type: true,
            createdAt: true,
          },
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!investment) {
      throw new NotFoundError("Investimento");
    }

    // Calcular métricas
    const quantity = Number(investment.quantity);
    const purchasePrice = Number(investment.purchasePrice);
    const currentPrice = Number(
      investment.currentPrice || investment.purchasePrice,
    );
    const totalInvested = quantity * purchasePrice;
    const currentValue = quantity * currentPrice;
    const gainLoss = currentValue - totalInvested;
    const gainLossPercentage =
      totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    // Calcular total de dividendos
    const totalDividends = investment.dividends.reduce(
      (sum, div) => sum + Number(div.amount),
      0,
    );
    const dividendYield =
      totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

    res.json({
      success: true,
      data: {
        investment: {
          ...investment,
          metrics: {
            totalInvested: Math.round(totalInvested * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            gainLoss: Math.round(gainLoss * 100) / 100,
            gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
            totalDividends: Math.round(totalDividends * 100) / 100,
            dividendYield: Math.round(dividendYield * 100) / 100,
          },
        },
      },
    });
  }),
);

// POST /api/investments - Criar novo investimento
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  createInvestmentValidation,
  validateInput,
  invalidateInvestmentCache,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const {
      symbol,
      name,
      type,
      quantity,
      purchasePrice,
      currentPrice,
      purchaseDate,
    } = req.body;
    
    const userId = req.tenant.userId;
    const tenantId = req.tenant.id;

    // Verificar se já existe investimento com mesmo símbolo
    const existingInvestment = await prisma.investment.findFirst({
      where: { userId, symbol: symbol.toUpperCase() },
    });

    if (existingInvestment) {
      throw new ConflictError("Já existe um investimento com este símbolo");
    }

    const investment = await prisma.investment.create({
      data: {
        userId,
        tenantId,
        symbol: symbol.toUpperCase(),
        name,
        type,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currentPrice: currentPrice
          ? parseFloat(currentPrice)
          : parseFloat(purchasePrice),
        purchaseDate: new Date(purchaseDate),
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        quantity: true,
        purchasePrice: true,
        currentPrice: true,
        purchaseDate: true,
        createdAt: true,
      },
    });

    loggerUtils.logFinancial(
      "investment_created",
      userId,
      parseFloat(quantity) * parseFloat(purchasePrice),
      investment.id,
    );

    res.status(201).json({
      success: true,
      message: "Investimento criado com sucesso",
      data: { investment },
    });
  }),
);

// PUT /api/investments/:id - Atualizar investimento
router.put(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id")
    .isLength({ min: 20, max: 30 })
    .matches(/^[a-z0-9]+$/)
    .withMessage("ID do investimento deve ser um CUID válido"),
  updateInvestmentValidation,
  validateInput,
  invalidateInvestmentCache,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const userId = req.tenant.userId;
    const updateData = req.body;

    // Verificar se investimento existe e pertence ao usuário
    const existingInvestment = await prisma.investment.findFirst({
      where: { id, userId },
    });

    if (!existingInvestment) {
      throw new NotFoundError("Investimento");
    }

    // Se mudando o símbolo, verificar se não conflita
    if (
      updateData.symbol &&
      updateData.symbol.toUpperCase() !== existingInvestment.symbol
    ) {
      const symbolConflict = await prisma.investment.findFirst({
        where: {
          userId,
          symbol: updateData.symbol.toUpperCase(),
          id: { not: id },
        },
      });

      if (symbolConflict) {
        throw new ConflictError("Já existe um investimento com este símbolo");
      }
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: {
        ...(updateData.symbol && { symbol: updateData.symbol.toUpperCase() }),
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.type && { type: updateData.type as InvestmentType }),
        ...(updateData.quantity && {
          quantity: parseFloat(updateData.quantity),
        }),
        ...(updateData.purchasePrice && {
          purchasePrice: parseFloat(updateData.purchasePrice),
        }),
        ...(updateData.currentPrice !== undefined && {
          currentPrice: parseFloat(updateData.currentPrice),
        }),
        ...(updateData.purchaseDate && {
          purchaseDate: new Date(updateData.purchaseDate),
        }),
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        quantity: true,
        purchasePrice: true,
        currentPrice: true,
        purchaseDate: true,
        updatedAt: true,
      },
    });

    loggerUtils.logFinancial("investment_updated", userId, undefined, id);

    res.json({
      success: true,
      message: "Investimento atualizado com sucesso",
      data: { investment: updatedInvestment },
    });
  }),
);

// DELETE /api/investments/:id - Deletar investimento
router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id")
    .isLength({ min: 20, max: 30 })
    .matches(/^[a-z0-9]+$/)
    .withMessage("ID do investimento deve ser um CUID válido"),
  validateInput,
  invalidateInvestmentCache,
  asyncHandler(async (req, res) => {
    if (!req.tenant) {
      throw new ValidationError("Contexto do tenant não encontrado");
    }

    const { id } = req.params;
    const userId = req.tenant.userId;

    // Verificar se investimento existe e pertence ao usuário
    const investment = await prisma.investment.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: {
            dividends: true,
          },
        },
      },
    });

    if (!investment) {
      throw new NotFoundError("Investimento");
    }

    // Deletar investimento e dividendos em cascata
    await prisma.investment.delete({
      where: { id },
    });

    loggerUtils.logFinancial("investment_deleted", userId, undefined, id);

    res.json({
      success: true,
      message: `Investimento deletado com sucesso${investment._count.dividends > 0 ? " (incluindo dividendos)" : ""}`,
    });
  }),
);

export default router;
