import { Router } from 'express';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Schema de validação para tag
const TagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(30, 'Nome muito longo'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  isActive: z.boolean().default(true)
});

const UpdateTagSchema = TagSchema.partial();

/**
 * @route GET /api/tags
 * @desc Buscar todas as tags do usuário
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { active, search } = req.query;
    
    const where: any = {
      userId: req.user?.id || '1' // Temporário até implementar auth
    };

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    const tags = await db.tag.findMany({
      where,
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    logger.info('Tags fetched successfully', {
      userId: req.user?.id,
      count: tags.length,
      filters: { active, search }
    });

    res.json({
      success: true,
      data: tags.map(tag => ({
        ...tag,
        usageCount: tag._count.transactions
      })),
      meta: {
        total: tags.length
      }
    });
  } catch (error) {
    logger.error('Error fetching tags', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TAGS_ERROR',
        message: 'Erro ao buscar tags'
      }
    });
  }
});

/**
 * @route GET /api/tags/:id
 * @desc Buscar tag específica
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    const tag = await db.tag.findFirst({
      where: {
        id,
        userId
      },
      include: {
        transactions: {
          select: {
            id: true,
            description: true,
            amount: true,
            date: true
          },
          orderBy: {
            date: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag não encontrada'
        }
      });
    }

    logger.info('Tag fetched successfully', {
      tagId: id,
      userId
    });

    res.json({
      success: true,
      data: {
        ...tag,
        usageCount: tag._count.transactions
      }
    });
  } catch (error) {
    logger.error('Error fetching tag', {
      error: error.message,
      tagId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_TAG_ERROR',
        message: 'Erro ao buscar tag'
      }
    });
  }
});

/**
 * @route POST /api/tags
 * @desc Criar nova tag
 * @access Private
 */
router.post('/', validateRequest(TagSchema), async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const tagData = req.body;

    // Verificar se já existe tag com mesmo nome para o usuário
    const existingTag = await db.tag.findFirst({
      where: {
        name: tagData.name,
        userId
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'TAG_ALREADY_EXISTS',
          message: 'Já existe uma tag com este nome'
        }
      });
    }

    const tag = await db.tag.create({
      data: {
        ...tagData,
        userId
      }
    });

    logger.info('Tag created successfully', {
      tagId: tag.id,
      name: tag.name,
      userId
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag criada com sucesso'
    });
  } catch (error) {
    logger.error('Error creating tag', {
      error: error.message,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_TAG_ERROR',
        message: 'Erro ao criar tag'
      }
    });
  }
});

/**
 * @route PUT /api/tags/:id
 * @desc Atualizar tag
 * @access Private
 */
router.put('/:id', validateRequest(UpdateTagSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';
    const updateData = req.body;

    // Verificar se tag existe
    const existingTag = await db.tag.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag não encontrada'
        }
      });
    }

    // Se está alterando o nome, verificar duplicatas
    if (updateData.name && updateData.name !== existingTag.name) {
      const duplicateTag = await db.tag.findFirst({
        where: {
          name: updateData.name,
          userId,
          id: { not: id }
        }
      });

      if (duplicateTag) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'TAG_NAME_EXISTS',
            message: 'Já existe uma tag com este nome'
          }
        });
      }
    }

    const updatedTag = await db.tag.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    logger.info('Tag updated successfully', {
      tagId: id,
      changes: updateData,
      userId
    });

    res.json({
      success: true,
      data: updatedTag,
      message: 'Tag atualizada com sucesso'
    });
  } catch (error) {
    logger.error('Error updating tag', {
      error: error.message,
      tagId: req.params.id,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_TAG_ERROR',
        message: 'Erro ao atualizar tag'
      }
    });
  }
});

/**
 * @route DELETE /api/tags/:id
 * @desc Deletar tag (soft delete)
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || '1';

    // Verificar se tag existe
    const tag = await db.tag.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Tag não encontrada'
        }
      });
    }

    // Verificar se tag está sendo usada em transações
    const transactionsCount = await db.transaction.count({
      where: {
        tags: {
          some: {
            id: id
          }
        },
        userId
      }
    });

    if (transactionsCount > 0) {
      // Soft delete - apenas desativar
      await db.tag.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logger.info('Tag deactivated (soft delete)', {
        tagId: id,
        transactionsCount,
        userId
      });

      return res.json({
        success: true,
        message: 'Tag desativada com sucesso (possui transações vinculadas)'
      });
    }

    // Hard delete se não há transações
    await db.tag.delete({
      where: { id }
    });

    logger.info('Tag deleted successfully', {
      tagId: id,
      userId
    });

    res.json({
      success: true,
      message: 'Tag deletada com sucesso'
    });
  } catch (error) {
    logger.error('Error deleting tag', {
      error: error.message,
      tagId: req.params.id,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_TAG_ERROR',
        message: 'Erro ao deletar tag'
      }
    });
  }
});

/**
 * @route GET /api/tags/popular
 * @desc Buscar tags mais utilizadas
 * @access Private
 */
router.get('/stats/popular', async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const { limit = '10' } = req.query;

    const popularTags = await db.tag.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: popularTags.map(tag => ({
        ...tag,
        usageCount: tag._count.transactions
      })),
      meta: {
        limit: parseInt(limit as string)
      }
    });
  } catch (error) {
    logger.error('Error fetching popular tags', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_POPULAR_TAGS_ERROR',
        message: 'Erro ao buscar tags populares'
      }
    });
  }
});

/**
 * @route POST /api/tags/bulk
 * @desc Criar múltiplas tags de uma vez
 * @access Private
 */
router.post('/bulk', validateRequest(z.object({
  tags: z.array(TagSchema).min(1, 'Pelo menos uma tag é necessária').max(20, 'Máximo 20 tags por vez')
})), async (req, res) => {
  try {
    const userId = req.user?.id || '1';
    const { tags } = req.body;

    // Verificar duplicatas
    const tagNames = tags.map((tag: any) => tag.name);
    const existingTags = await db.tag.findMany({
      where: {
        name: { in: tagNames },
        userId
      },
      select: { name: true }
    });

    const existingNames = existingTags.map(tag => tag.name);
    const newTags = tags.filter((tag: any) => !existingNames.includes(tag.name));

    if (newTags.length === 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALL_TAGS_EXIST',
          message: 'Todas as tags já existem'
        }
      });
    }

    const createdTags = await db.tag.createMany({
      data: newTags.map((tag: any) => ({
        ...tag,
        userId
      }))
    });

    logger.info('Bulk tags created successfully', {
      count: createdTags.count,
      skipped: existingNames.length,
      userId
    });

    res.status(201).json({
      success: true,
      data: {
        created: createdTags.count,
        skipped: existingNames.length,
        existingTags: existingNames
      },
      message: `${createdTags.count} tags criadas com sucesso`
    });
  } catch (error) {
    logger.error('Error creating bulk tags', {
      error: error.message,
      data: req.body,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_BULK_TAGS_ERROR',
        message: 'Erro ao criar tags em lote'
      }
    });
  }
});

export default router;