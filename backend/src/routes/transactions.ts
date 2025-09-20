import { Router } from "express";
import { body, query, param, validationResult } from "express-validator";
import {
  PrismaClient,
  Prisma,
  TransactionType,
  TransactionStatus,
} from "@prisma/client";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
} from "@/middleware/errorHandler";
import { invalidateTransactionCache } from "@/middleware/cacheInvalidation";
import { logger, loggerUtils } from "@/utils/logger";
import { DoubleEntryService } from "@/services/doubleEntryService";
import { AuditService } from "@/services/auditService";

const router = Router();
const prisma = new PrismaClient();
const auditService = new AuditService(prisma);
const doubleEntryService = new DoubleEntryService(prisma, auditService);

// Rota de teste
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de transações funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const createTransactionValidation = [
  body("type")
    .isIn(["INCOME", "EXPENSE", "TRANSFER"])
    .withMessage("Tipo de transação inválido"),
  body("accountId").isUUID().withMessage("ID da conta deve ser um UUID válido"),
  body("amount")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Valor deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor deve ser um decimal positivo"),
  body("category")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Categoria deve ter entre 2 e 50 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
  body("date").isISO8601().withMessage("Data deve estar no formato ISO 8601"),
  body("toAccountId")
    .optional()
    .isUUID()
    .withMessage("ID da conta destino deve ser um UUID válido"),
  body("tags").optional().isArray().withMessage("Tags devem ser um array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Cada tag deve ter entre 1 e 30 caracteres"),
];

const updateTransactionValidation = [
  body("type")
    .optional()
    .isIn(["INCOME", "EXPENSE", "TRANSFER"])
    .withMessage("Tipo de transação inválido"),
  body("accountId")
    .optional()
    .isUUID()
    .withMessage("ID da conta deve ser um UUID válido"),
  body("amount")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (value !== undefined && parseFloat(value) <= 0) {
        throw new Error("Valor deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Valor deve ser um decimal positivo"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Categoria deve ter entre 2 e 50 caracteres"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Descrição deve ter no máximo 500 caracteres"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Data deve estar no formato ISO 8601"),
  body("status")
    .optional()
    .isIn(["PENDING", "COMPLETED", "CANCELLED"])
    .withMessage("Status inválido"),
  body("toAccountId")
    .optional()
    .isUUID()
    .withMessage("ID da conta destino deve ser um UUID válido"),
  body("tags").optional().isArray().withMessage("Tags devem ser um array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Cada tag deve ter entre 1 e 30 caracteres"),
];

const listTransactionsValidation = [
  query("accountId")
    .optional()
    .isUUID()
    .withMessage("ID da conta deve ser um UUID válido"),
  query("type")
    .optional()
    .isIn(["INCOME", "EXPENSE", "TRANSFER"])
    .withMessage("Tipo de transação inválido"),
  query("status")
    .optional()
    .isIn(["PENDING", "COMPLETED", "CANCELLED"])
    .withMessage("Status inválido"),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Data inicial deve estar no formato ISO 8601"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Data final deve estar no formato ISO 8601"),
  query("minAmount")
    .optional()
    .isDecimal()
    .withMessage("Valor mínimo deve ser um decimal"),
  query("maxAmount")
    .optional()
    .isDecimal()
    .withMessage("Valor máximo deve ser um decimal"),
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

// Função para atualizar saldo da conta
const updateAccountBalance = async (
  accountId: string,
  amount: number,
  operation: "add" | "subtract",
) => {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError("Conta");

  const currentBalance = Number(account.balance);
  const newBalance =
    operation === "add" ? currentBalance + amount : currentBalance - amount;

  await prisma.account.update({
    where: { id: accountId },
    data: { balance: newBalance },
  });

  return newBalance;
};

// GET /api/transactions - Listar transações
router.get(
  "/",
  listTransactionsValidation,
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const {
      accountId,
      type,
      status,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = { 
      createdBy: userId,
      tenantId: "demo-tenant-1" 
    };
    
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    // Aplicar filtros baseados em entradas na query principal
    if (accountId) {
      where.entries = { some: { accountId } };
    }
    if (category) {
      where.entries = { 
        ...where.entries,
        some: { 
          ...where.entries?.some,
          category: { name: { contains: category, mode: "insensitive" } }
        }
      };
    }
    if (minAmount || maxAmount) {
      const amountConditions: any[] = [];
      if (minAmount) {
        amountConditions.push(
          { credit: { gte: parseFloat(minAmount as string) } },
          { debit: { gte: parseFloat(minAmount as string) } }
        );
      }
      if (maxAmount) {
        amountConditions.push(
          { credit: { lte: parseFloat(maxAmount as string) } },
          { debit: { lte: parseFloat(maxAmount as string) } }
        );
      }
      where.entries = {
        ...where.entries,
        some: {
          ...where.entries?.some,
          OR: amountConditions
        }
      };
    }

    // Buscar transações e total
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: {
          id: true,
          description: true,
          date: true,
          status: true,
          tags: true,
          createdAt: true,
          entries: {
            select: {
              id: true,
              debit: true,
              credit: true,
              account: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calcular estatísticas baseadas nas entradas (double-entry)
    const incomeEntries = await prisma.entry.aggregate({
      where: {
        transaction: { ...where, status: "COMPLETED" },
        credit: { gt: 0 },
        account: { type: { in: ["ASSET", "CHECKING", "SAVINGS", "CASH"] } }
      },
      _sum: { credit: true },
      _count: { id: true },
    });

    const expenseEntries = await prisma.entry.aggregate({
      where: {
        transaction: { ...where, status: "COMPLETED" },
        debit: { gt: 0 },
        account: { type: { in: ["ASSET", "CHECKING", "SAVINGS", "CASH"] } }
      },
      _sum: { debit: true },
      _count: { id: true },
    });

    const totalIncome = Number(incomeEntries._sum.credit || 0);
    const totalExpense = Number(expenseEntries._sum.debit || 0);

    // Processar transações para adicionar tipo, valor e categoria
    const processedTransactions = transactions.map(transaction => {
      const entries = transaction.entries;
      
      // Determinar tipo baseado nas entradas
      let type = "EXPENSE";
      let amount = 0;
      let category = "";
      let account = null;
      
      // Encontrar a entrada principal (conta de ativo - incluindo ASSET, CHECKING, SAVINGS, CASH)
      const assetEntry = entries.find(entry => 
        ["ASSET", "CHECKING", "SAVINGS", "CASH"].includes(entry.account.type)
      );
      
      if (assetEntry) {
        account = assetEntry.account;
        
        if (Number(assetEntry.credit) > 0) {
          type = "INCOME";
          amount = Number(assetEntry.credit);
        } else if (Number(assetEntry.debit) > 0) {
          type = "EXPENSE";
          amount = Number(assetEntry.debit);
        }
      }
      
      // Encontrar categoria da entrada de contrapartida ou da própria entrada
      const categoryEntry = entries.find(entry => entry.category);
      if (categoryEntry?.category) {
        category = categoryEntry.category.name;
      }
      
      return {
        id: transaction.id,
        description: transaction.description,
        date: transaction.date,
        status: transaction.status,
        tags: transaction.tags,
        createdAt: transaction.createdAt,
        type,
        amount,
        category,
        account,
      };
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
        transactions: processedTransactions,
        pagination,
        summary: {
          stats: [
            {
              type: "INCOME",
              count: incomeEntries._count.id,
              total: totalIncome,
            },
            {
              type: "EXPENSE", 
              count: expenseEntries._count.id,
              total: totalExpense,
            }
          ],
          totalIncome,
          totalExpense,
          netAmount: totalIncome - totalExpense,
        },
      },
    });
  }),
);

// GET /api/transactions/:id - Obter transação específica
router.get(
  "/:id",
  param("id").isUUID().withMessage("ID da transação deve ser um UUID válido"),
  validateInput,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";

    const transaction = await prisma.transaction.findFirst({
      where: { id, createdBy: userId, tenantId: "demo-tenant-1" },
      select: {
        id: true,
        type: true,
        amount: true,
        category: true,
        description: true,
        date: true,
        status: true,
        tags: true,
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError("Transação");
    }

    res.json({
      success: true,
      data: { transaction },
    });
  }),
);

// POST /api/transactions - Criar nova transação
router.post(
  "/",
  createTransactionValidation,
  validateInput,
  invalidateTransactionCache,
  asyncHandler(async (req, res) => {
    const {
      type,
      accountId,
      amount,
      category,
      description,
      date,
      toAccountId,
      tags = [],
    } = req.body;
    const userId = req.headers.authorization?.replace('Bearer ', '') || "demo-user-1";
    const tenantId = req.headers['x-tenant-id'] || "demo-tenant-1";

    // Verificar se conta origem existe
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        tenantId,
        isActive: true,
      },
    });
    if (!account) {
      throw new NotFoundError("Conta de origem");
    }

    // Para transferências, verificar conta destino
    let toAccount = null;
    if (type === "TRANSFER") {
      if (!toAccountId) {
        throw new ValidationError(
          "Conta destino é obrigatória para transferências",
        );
      }
      if (toAccountId === accountId) {
        throw new ValidationError(
          "Conta destino deve ser diferente da conta origem",
        );
      }
      toAccount = await prisma.account.findFirst({
        where: { id: toAccountId, createdBy: userId, isActive: true },
      });
      if (!toAccount) {
        throw new NotFoundError("Conta destino");
      }
    }

    // Buscar ou criar categoria
    let categoryRecord = await prisma.category.findFirst({
      where: { name: category, tenantId },
    });
    
    if (!categoryRecord) {
      categoryRecord = await prisma.category.create({
        data: {
          name: category,
          tenantId,
          type: type === "INCOME" ? "INCOME" : "EXPENSE",
        },
      });
    }

    const amountValue = parseFloat(amount);
    const idempotencyKey = `${userId}-${Date.now()}-${Math.random()}`;

    // Usar o doubleEntryService para criar a transação
    const result = await doubleEntryService.createTransaction({
      tenantId,
      userId,
      description,
      amount: new Prisma.Decimal(amountValue),
      type: type.toLowerCase() as "income" | "expense" | "transfer",
      fromAccountId: type === "EXPENSE" || type === "TRANSFER" ? accountId : undefined,
      toAccountId: type === "INCOME" || type === "TRANSFER" ? (toAccountId || accountId) : undefined,
      categoryId: categoryRecord.id,
      date: new Date(date),
      tags,
      idempotencyKey,
    });

    loggerUtils.logFinancial(
      "transaction_created",
      userId,
      amountValue,
      accountId,
    );

    res.status(201).json({
      success: true,
      message: "Transação criada com sucesso",
      data: { transaction: result.transaction },
    });
  }),
);

// PUT /api/transactions/:id - Atualizar transação
router.put(
  "/:id",
  param("id").isUUID().withMessage("ID da transação deve ser um UUID válido"),
  updateTransactionValidation,
  validateInput,
  invalidateTransactionCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";
    const updateData = req.body;

    // Buscar transação atual
    const currentTransaction = await prisma.transaction.findFirst({
      where: { id, createdBy: userId, tenantId: "demo-tenant-1" },
      include: {
        account: true,
        toAccount: true,
      },
    });

    if (!currentTransaction) {
      throw new NotFoundError("Transação");
    }

    // Não permitir alterar transações canceladas
    if (currentTransaction.status === "CANCELLED") {
      throw new ValidationError("Não é possível alterar transações canceladas");
    }

    // Usar transação do banco para garantir consistência
    const result = await prisma.$transaction(async (tx) => {
      // Se mudando status para cancelado, reverter saldos
      if (
        updateData.status === "CANCELLED" &&
        currentTransaction.status === "COMPLETED"
      ) {
        const amount = Number(currentTransaction.amount);

        if (currentTransaction.type === "INCOME") {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { decrement: amount } },
          });
        } else if (currentTransaction.type === "EXPENSE") {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { increment: amount } },
          });
        } else if (
          currentTransaction.type === "TRANSFER" &&
          currentTransaction.toAccountId
        ) {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { increment: amount } },
          });
          await tx.account.update({
            where: { id: currentTransaction.toAccountId },
            data: { balance: { decrement: amount } },
          });
        }
      }

      // Se mudando de cancelado para completo, aplicar saldos
      if (
        updateData.status === "COMPLETED" &&
        currentTransaction.status === "CANCELLED"
      ) {
        const amount = Number(updateData.amount || currentTransaction.amount);

        if (currentTransaction.type === "INCOME") {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { increment: amount } },
          });
        } else if (currentTransaction.type === "EXPENSE") {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { decrement: amount } },
          });
        } else if (
          currentTransaction.type === "TRANSFER" &&
          currentTransaction.toAccountId
        ) {
          await tx.account.update({
            where: { id: currentTransaction.accountId },
            data: { balance: { decrement: amount } },
          });
          await tx.account.update({
            where: { id: currentTransaction.toAccountId },
            data: { balance: { increment: amount } },
          });
        }
      }

      // Atualizar a transação
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.date && { date: new Date(updateData.date) }),
          ...(updateData.amount && { amount: parseFloat(updateData.amount) }),
        },
        select: {
          id: true,
          type: true,
          amount: true,
          category: true,
          description: true,
          date: true,
          status: true,
          tags: true,
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
          updatedAt: true,
        },
      });

      return updatedTransaction;
    });

    loggerUtils.logFinancial("transaction_updated", userId, undefined, id);

    res.json({
      success: true,
      message: "Transação atualizada com sucesso",
      data: { transaction: result },
    });
  }),
);

// DELETE /api/transactions/:id - Deletar transação
router.delete(
  "/:id",
  param("id").isUUID().withMessage("ID da transação deve ser um UUID válido"),
  validateInput,
  invalidateTransactionCache,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = "demo-user-1";

    // Buscar transação
    const transaction = await prisma.transaction.findFirst({
      where: { id, createdBy: userId, tenantId: "demo-tenant-1" },
    });

    if (!transaction) {
      throw new NotFoundError("Transação");
    }

    // Usar transação do banco para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Se transação estava completa, reverter saldos
      if (transaction.status === "COMPLETED") {
        const amount = Number(transaction.amount);

        if (transaction.type === "INCOME") {
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { decrement: amount } },
          });
        } else if (transaction.type === "EXPENSE") {
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: amount } },
          });
        } else if (transaction.type === "TRANSFER" && transaction.toAccountId) {
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { balance: { increment: amount } },
          });
          await tx.account.update({
            where: { id: transaction.toAccountId },
            data: { balance: { decrement: amount } },
          });
        }
      }

      // Deletar a transação
      await tx.transaction.delete({
        where: { id },
      });
    });

    loggerUtils.logFinancial("transaction_deleted", userId, undefined, id);

    res.json({
      success: true,
      message: "Transação deletada com sucesso",
    });
  }),
);

// GET /api/transactions/categories - Listar categorias usadas
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";

    const categories = await prisma.transaction.groupBy({
      by: ["category", "type"],
      where: { createdBy: userId, tenantId: "demo-tenant-1" },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const categoriesFormatted = categories.map((cat) => ({
      category: cat.category,
      type: cat.type,
      count: cat._count.id,
      totalAmount: Number(cat._sum.amount || 0),
    }));

    res.json({
      success: true,
      data: { categories: categoriesFormatted },
    });
  }),
);

// GET /api/transactions/summary - Resumo de transações
router.get(
  "/summary",
  query("period")
    .optional()
    .isIn(["week", "month", "quarter", "year"])
    .withMessage("Período deve ser: week, month, quarter ou year"),
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const period = (req.query.period as string) || "month";

    // Calcular datas
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        createdBy: userId,
        tenantId: "demo-tenant-1",
        date: { gte: startDate },
        status: "COMPLETED",
      },
      select: {
        type: true,
        amount: true,
        category: true,
        date: true,
      },
    });

    // Calcular totais
    const totalIncome = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Agrupar por categoria
    const byCategory = transactions.reduce((acc, t) => {
      const key = `${t.category}-${t.type}`;
      if (!acc[key]) {
        acc[key] = {
          category: t.category,
          type: t.type,
          total: 0,
          count: 0,
        };
      }
      acc[key].total += Number(t.amount);
      acc[key].count += 1;
      return acc;
    }, {} as any);

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0],
        },
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpense: Math.round(totalExpense * 100) / 100,
          netAmount: Math.round((totalIncome - totalExpense) * 100) / 100,
          transactionCount: transactions.length,
        },
        byCategory: Object.values(byCategory),
      },
    });
  }),
);

export default router;
