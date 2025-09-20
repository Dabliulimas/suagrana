import { Router } from 'express';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Schema de validação para categoria
const CategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  icon: z.string().optional(),
  type: z.enum(['income', 'expense']).default('expense'),
  isActive: z.boolean().default(true)
});

const UpdateCategorySchema = CategorySchema.partial();

/**
 * @route GET /api/categories
 * @desc Buscar todas as categorias do usuário
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;
    
    const where: any = {
      userId: req.user?.id || '1' // Temporário até implementar auth
    };

    if (type && (type === 'income' || type === 'expense')) {
      where.type = type;
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const categories = await db.category.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    logger.info('Categories fetched successfully', {
      userId: req.user?.id,
      count: categories.length,
      filters: { type, active }
    });

    res.json({
      success: true,
      data: categories,
      meta: {
        total: categories.length
      }
    });
  } catch (error) {
    logger.error('Error fetching categories', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORIES_ERROR',
        message: 'Erro ao buscar categorias'
      }
    });
  }
});

/**
 * @route GET /api/categories/:id
 * @desc Buscar categoria específica
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const category = await db.category.findFirst({
      where: {
        id,
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

    logger.info('Category fetched successfully', {
      categoryId: id,
      userId
    });

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Error fetching category', {
      error: error.message,
      categoryId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORY_ERROR',
        message: 'Erro ao buscar categoria'
      }
    });
  }
});

/**
 * @route POST /api/categories
 * @desc Criar nova categoria
 * @access Private
 */
router.post('/', validateRequest(CategorySchema), async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const categoryData = req.body;

    // Verificar se já existe categoria com mesmo nome para o usuário
    const existingCategory = await db.category.findFirst({
      where: {
        name: categoryData.name,
        userId,
        type: categoryData.type
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CATEGORY_ALREADY_EXISTS',
          message: 'Já existe uma categoria com este nome'
        }
      });
    }

    const category = await db.category.create({
      data: {
        ...categoryData,
        userId
      }
    });

    logger.info('Category created successfully', {
      categoryId: category.id,
      name: category.name,
      userId
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Categoria criada com sucesso'
    });
  } catch (error) {
    logger.error('Error creating category', {
      error: error.message,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CATEGORY_ERROR',
        message: 'Erro ao criar categoria'
      }
    });
  }
});

/**
 * @route PUT /api/categories/:id
 * @desc Atualizar categoria
 * @access Private
 */
router.put('/:id', validateRequest(UpdateCategorySchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';
    const updateData = req.body;

    // Verificar se categoria existe
    const existingCategory = await db.category.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Categoria não encontrada'
        }
      });
    }

    // Se está alterando o nome, verificar duplicatas
    if (updateData.name && updateData.name !== existingCategory.name) {
      const duplicateCategory = await db.category.findFirst({
        where: {
          name: updateData.name,
          userId,
          type: updateData.type || existingCategory.type,
          id: { not: id }
        }
      });

      if (duplicateCategory) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CATEGORY_NAME_EXISTS',
            message: 'Já existe uma categoria com este nome'
          }
        });
      }
    }

    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    logger.info('Category updated successfully', {
      categoryId: id,
      changes: updateData,
      userId
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Categoria atualizada com sucesso'
    });
  } catch (error) {
    logger.error('Error updating category', {
      error: error.message,
      categoryId: req.params.id,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_CATEGORY_ERROR',
        message: 'Erro ao atualizar categoria'
      }
    });
  }
});

/**
 * @route DELETE /api/categories/:id
 * @desc Deletar categoria (soft delete)
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    // Verificar se categoria existe
    const category = await db.category.findFirst({
      where: {
        id,
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

    // Verificar se categoria está sendo usada em transações
    const transactionsCount = await db.transaction.count({
      where: {
        categoryId: id,
        userId
      }
    });

    if (transactionsCount > 0) {
      // Soft delete - apenas desativar
      await db.category.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logger.info('Category deactivated (soft delete)', {
        categoryId: id,
        transactionsCount,
        userId
      });

      return res.json({
        success: true,
        message: 'Categoria desativada com sucesso (possui transações vinculadas)'
      });
    }

    // Hard delete se não há transações
    await db.category.delete({
      where: { id }
    });

    logger.info('Category deleted successfully', {
      categoryId: id,
      userId
    });

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting category', {
      error: error.message,
      categoryId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_CATEGORY_ERROR',
        message: 'Erro ao deletar categoria'
      }
    });
  }
});

/**
 * @route GET /api/categories/stats
 * @desc Estatísticas de uso das categorias
 * @access Private
 */
router.get('/stats/usage', async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const { startDate, endDate } = req.query;

    const where: any = {
      userId
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const categoryStats = await db.transaction.groupBy({
      by: ['categoryId'],
      where,
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });

    // Buscar informações das categorias
    const categoryIds = categoryStats.map(stat => stat.categoryId).filter(Boolean);
    const categories = await db.category.findMany({
      where: {
        id: { in: categoryIds },
        userId
      }
    });

    const statsWithDetails = categoryStats.map(stat => {
      const category = categories.find(cat => cat.id === stat.categoryId);
      return {
        categoryId: stat.categoryId,
        categoryName: category?.name || 'Sem categoria',
        categoryType: category?.type || 'expense',
        transactionCount: stat._count.id,
        totalAmount: stat._sum.amount || 0
      };
    });

    res.json({
      success: true,
      data: statsWithDetails,
      meta: {
        period: { startDate, endDate },
        totalCategories: statsWithDetails.length
      }
    });
  } catch (error) {
    logger.error('Error fetching category stats', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_CATEGORY_STATS_ERROR',
        message: 'Erro ao buscar estatísticas das categorias'
      }
    });
  }
});

export default router;