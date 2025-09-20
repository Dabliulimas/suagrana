import { Router } from 'express';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

const router = Router();

// Schema de validação para orçamento
const BudgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  alertThreshold: z.number().min(0).max(100).default(80), // Porcentagem para alerta
  description: z.string().optional()
});

const UpdateBudgetSchema = BudgetSchema.partial();

/**
 * @route GET /api/budget
 * @desc Buscar todos os orçamentos do usuário
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { period, active, categoryId } = req.query;
    const userId = req.user?.id || '1';
    
    const where: any = {
      userId
    };

    if (period && (period === 'monthly' || period === 'yearly')) {
      where.period = period;
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const budgets = await db.budget.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { category: { name: 'asc' } }
      ]
    });

    // Calcular gastos atuais para cada orçamento
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const currentMonth = new Date();
        const startDate = startOfMonth(currentMonth);
        const endDate = endOfMonth(currentMonth);

        const transactions = await db.transaction.findMany({
          where: {
            userId,
            categoryId: budget.categoryId,
            amount: { lt: 0 }, // Apenas despesas
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const spent = transactions.reduce((sum, transaction) => 
          sum + Math.abs(transaction.amount), 0
        );

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remaining = Math.max(budget.amount - spent, 0);
        
        let status: 'good' | 'warning' | 'exceeded' = 'good';
        if (percentage > 100) status = 'exceeded';
        else if (percentage >= budget.alertThreshold) status = 'warning';

        return {
          ...budget,
          spent: Math.round(spent * 100) / 100,
          remaining: Math.round(remaining * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          status,
          period: {
            start: startDate,
            end: endDate
          }
        };
      })
    );

    logger.info('Budgets fetched successfully', {
      userId,
      count: budgets.length,
      filters: { period, active, categoryId }
    });

    res.json({
      success: true,
      data: budgetsWithSpending,
      meta: {
        total: budgets.length,
        currentPeriod: {
          start: startOfMonth(new Date()),
          end: endOfMonth(new Date())
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching budgets', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGETS_ERROR',
        message: 'Erro ao buscar orçamentos'
      }
    });
  }
});

/**
 * @route GET /api/budget/:id
 * @desc Buscar orçamento específico
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const budget = await db.budget.findFirst({
      where: {
        id,
        userId
      },
      include: {
        category: true
      }
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Orçamento não encontrado'
        }
      });
    }

    // Buscar histórico de gastos dos últimos 6 meses
    const sixMonthsAgo = subMonths(new Date(), 6);
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        categoryId: budget.categoryId,
        amount: { lt: 0 },
        date: {
          gte: sixMonthsAgo
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Agrupar por mês
    const monthlySpending = transactions.reduce((acc, transaction) => {
      const monthKey = format(transaction.date, 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    logger.info('Budget fetched successfully', {
      budgetId: id,
      userId
    });

    res.json({
      success: true,
      data: {
        ...budget,
        monthlySpending,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    logger.error('Error fetching budget', {
      error: error.message,
      budgetId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGET_ERROR',
        message: 'Erro ao buscar orçamento'
      }
    });
  }
});

/**
 * @route POST /api/budget
 * @desc Criar novo orçamento
 * @access Private
 */
router.post('/', validateRequest(BudgetSchema), async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const budgetData = req.body;

    // Verificar se categoria existe
    const category = await db.category.findFirst({
      where: {
        id: budgetData.categoryId,
        userId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada'
        }
      });
    }

    // Verificar se já existe orçamento ativo para esta categoria no período
    const existingBudget = await db.budget.findFirst({
      where: {
        categoryId: budgetData.categoryId,
        userId,
        period: budgetData.period,
        isActive: true
      }
    });

    if (existingBudget) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'BUDGET_ALREADY_EXISTS',
          message: 'Já existe um orçamento ativo para esta categoria no período'
        }
      });
    }

    const budget = await db.budget.create({
      data: {
        ...budgetData,
        userId,
        startDate: budgetData.startDate ? new Date(budgetData.startDate) : undefined,
        endDate: budgetData.endDate ? new Date(budgetData.endDate) : undefined
      },
      include: {
        category: true
      }
    });

    logger.info('Budget created successfully', {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      amount: budget.amount,
      userId
    });

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Orçamento criado com sucesso'
    });
  } catch (error) {
    logger.error('Error creating budget', {
      error: error.message,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_BUDGET_ERROR',
        message: 'Erro ao criar orçamento'
      }
    });
  }
});

/**
 * @route PUT /api/budget/:id
 * @desc Atualizar orçamento
 * @access Private
 */
router.put('/:id', validateRequest(UpdateBudgetSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';
    const updateData = req.body;

    // Verificar se orçamento existe
    const existingBudget = await db.budget.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Orçamento não encontrado'
        }
      });
    }

    // Se está alterando categoria, verificar se nova categoria existe
    if (updateData.categoryId && updateData.categoryId !== existingBudget.categoryId) {
      const category = await db.category.findFirst({
        where: {
          id: updateData.categoryId,
          userId
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Nova categoria não encontrada'
          }
        });
      }

      // Verificar se já existe orçamento para nova categoria
      const duplicateBudget = await db.budget.findFirst({
        where: {
          categoryId: updateData.categoryId,
          userId,
          period: updateData.period || existingBudget.period,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateBudget) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BUDGET_CATEGORY_EXISTS',
            message: 'Já existe um orçamento ativo para esta categoria'
          }
        });
      }
    }

    const updatedBudget = await db.budget.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    logger.info('Budget updated successfully', {
      budgetId: id,
      changes: updateData,
      userId
    });

    res.json({
      success: true,
      data: updatedBudget,
      message: 'Orçamento atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Error updating budget', {
      error: error.message,
      budgetId: req.params.id,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_BUDGET_ERROR',
        message: 'Erro ao atualizar orçamento'
      }
    });
  }
});

/**
 * @route DELETE /api/budget/:id
 * @desc Deletar orçamento
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    // Verificar se orçamento existe
    const budget = await db.budget.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Orçamento não encontrado'
        }
      });
    }

    await db.budget.delete({
      where: { id }
    });

    logger.info('Budget deleted successfully', {
      budgetId: id,
      userId
    });

    res.json({
      success: true,
      message: 'Orçamento deletado com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting budget', {
      error: error.message,
      budgetId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_BUDGET_ERROR',
        message: 'Erro ao deletar orçamento'
      }
    });
  }
});

/**
 * @route GET /api/budget/summary
 * @desc Resumo geral dos orçamentos
 * @access Private
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    // Buscar todos os orçamentos ativos
    const budgets = await db.budget.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        category: true
      }
    });

    // Calcular gastos para cada orçamento
    const budgetSummary = await Promise.all(
      budgets.map(async (budget) => {
        const transactions = await db.transaction.findMany({
          where: {
            userId,
            categoryId: budget.categoryId,
            amount: { lt: 0 },
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const spent = transactions.reduce((sum, transaction) => 
          sum + Math.abs(transaction.amount), 0
        );

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        let status: 'good' | 'warning' | 'exceeded' = 'good';
        if (percentage > 100) status = 'exceeded';
        else if (percentage >= budget.alertThreshold) status = 'warning';

        return {
          budgetId: budget.id,
          categoryName: budget.category.name,
          budgeted: budget.amount,
          spent,
          percentage,
          status
        };
      })
    );

    const totalBudgeted = budgetSummary.reduce((sum, item) => sum + item.budgeted, 0);
    const totalSpent = budgetSummary.reduce((sum, item) => sum + item.spent, 0);
    const overBudgetCount = budgetSummary.filter(item => item.status === 'exceeded').length;
    const warningCount = budgetSummary.filter(item => item.status === 'warning').length;

    res.json({
      success: true,
      data: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalRemaining: Math.round((totalBudgeted - totalSpent) * 100) / 100,
        overallPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100 * 100) / 100 : 0,
        budgetCount: budgets.length,
        overBudgetCount,
        warningCount,
        goodCount: budgets.length - overBudgetCount - warningCount,
        budgets: budgetSummary
      },
      meta: {
        period: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching budget summary', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGET_SUMMARY_ERROR',
        message: 'Erro ao buscar resumo dos orçamentos'
      }
    });
  }
});

/**
 * @route GET /api/budget/alerts
 * @desc Buscar alertas de orçamento
 * @access Private
 */
router.get('/stats/alerts', async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const currentMonth = new Date();
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);

    const budgets = await db.budget.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        category: true
      }
    });

    const alerts = [];

    for (const budget of budgets) {
      const transactions = await db.transaction.findMany({
        where: {
          userId,
          categoryId: budget.categoryId,
          amount: { lt: 0 },
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const spent = transactions.reduce((sum, transaction) => 
        sum + Math.abs(transaction.amount), 0
      );

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      if (percentage >= budget.alertThreshold) {
        alerts.push({
          budgetId: budget.id,
          categoryName: budget.category.name,
          budgeted: budget.amount,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          alertThreshold: budget.alertThreshold,
          severity: percentage > 100 ? 'critical' : 'warning',
          message: percentage > 100 
            ? `Orçamento de ${budget.category.name} excedido em ${Math.round((percentage - 100) * 100) / 100}%`
            : `Orçamento de ${budget.category.name} atingiu ${Math.round(percentage * 100) / 100}% do limite`
        });
      }
    }

    res.json({
      success: true,
      data: alerts,
      meta: {
        alertCount: alerts.length,
        criticalCount: alerts.filter(alert => alert.severity === 'critical').length,
        warningCount: alerts.filter(alert => alert.severity === 'warning').length
      }
    });
  } catch (error) {
    logger.error('Error fetching budget alerts', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_BUDGET_ALERTS_ERROR',
        message: 'Erro ao buscar alertas de orçamento'
      }
    });
  }
});

export default router;