import { Router, Request, Response, NextFunction } from "express";
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
import { logger, loggerUtils } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de viagens funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const createTripValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da viagem deve ter entre 2 e 100 caracteres"),
  body("destination")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Destino deve ter entre 2 e 100 caracteres"),
  body("startDate")
    .isISO8601()
    .withMessage("Data de início deve ser uma data válida"),
  body("endDate")
    .isISO8601()
    .withMessage("Data de fim deve ser uma data válida")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("Data de fim deve ser posterior à data de início");
      }
      return true;
    }),
  body("budget")
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Orçamento deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Orçamento deve ser um decimal positivo"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Descrição deve ter no máximo 2000 caracteres"),
  body("status")
    .optional()
    .isIn(["planning", "active", "completed", "cancelled"])
    .withMessage("Status deve ser: planning, active, completed ou cancelled"),
];

const updateTripValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome da viagem deve ter entre 2 e 100 caracteres"),
  body("destination")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Destino deve ter entre 2 e 100 caracteres"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Data de início deve ser uma data válida"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Data de fim deve ser uma data válida"),
  body("budget")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Orçamento deve ser maior que zero");
      }
      return true;
    })
    .withMessage("Orçamento deve ser um decimal positivo"),
  body("spent")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error("Valor gasto não pode ser negativo");
      }
      return true;
    })
    .withMessage("Valor gasto deve ser um decimal não negativo"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Descrição deve ter no máximo 2000 caracteres"),
  body("status")
    .optional()
    .isIn(["planning", "active", "completed", "cancelled"])
    .withMessage("Status deve ser: planning, active, completed ou cancelled"),
];

// Middleware para validar erros
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Dados inválidos", errors.array());
  }
  next();
};

// GET /api/trips - Listar todas as viagens do usuário
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;

    logger.info("Buscando viagens", {
      tenantId,
      userId,
      component: "trips",
    });

    const trips = await prisma.trip.findMany({
      where: {
        tenantId: tenantId,
        userId: userId,
      },
      orderBy: {
        startDate: "desc",
      },
    });

    logger.info("Viagens encontradas", {
      tenantId,
      userId,
      count: trips.length,
      component: "trips",
    });

    res.json({
      success: true,
      data: trips,
      count: trips.length,
    });
  })
);

// GET /api/trips/:id - Buscar viagem específica
router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id").isString().withMessage("ID da viagem deve ser uma string"),
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;
    const { id } = req.params;

    logger.info("Buscando viagem específica", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        tenantId: tenantId,
        userId: userId,
      },
    });

    if (!trip) {
      throw new NotFoundError("Viagem não encontrada");
    }

    logger.info("Viagem encontrada", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    res.json({
      success: true,
      data: trip,
    });
  })
);

// POST /api/trips - Criar nova viagem
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  createTripValidation,
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;
    const {
      name,
      destination,
      startDate,
      endDate,
      budget,
      description,
      status = "planning",
    } = req.body;

    logger.info("Criando nova viagem", {
      tenantId,
      userId,
      name,
      destination,
      component: "trips",
    });

    const trip = await prisma.trip.create({
      data: {
        tenantId: tenantId,
        userId: userId,
        name,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget: parseFloat(budget),
        description,
        status,
      },
    });

    logger.info("Viagem criada com sucesso", {
      tenantId,
      userId,
      tripId: trip.id,
      component: "trips",
    });

    res.status(201).json({
      success: true,
      data: trip,
      message: "Viagem criada com sucesso",
    });
  })
);

// PUT /api/trips/:id - Atualizar viagem
router.put(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id").isString().withMessage("ID da viagem deve ser uma string"),
  updateTripValidation,
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;
    const { id } = req.params;
    const updateData = req.body;

    logger.info("Atualizando viagem", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    // Verificar se a viagem existe e pertence ao usuário
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id,
        tenantId: tenantId,
        userId: userId,
      },
    });

    if (!existingTrip) {
      throw new NotFoundError("Viagem não encontrada");
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {};
    
    if (updateData.name) dataToUpdate.name = updateData.name;
    if (updateData.destination) dataToUpdate.destination = updateData.destination;
    if (updateData.startDate) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate) dataToUpdate.endDate = new Date(updateData.endDate);
    if (updateData.budget) dataToUpdate.budget = parseFloat(updateData.budget);
    if (updateData.spent !== undefined) dataToUpdate.spent = parseFloat(updateData.spent);
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.status) dataToUpdate.status = updateData.status;

    // Validar datas se ambas estão sendo atualizadas
    if (dataToUpdate.startDate && dataToUpdate.endDate) {
      if (dataToUpdate.endDate <= dataToUpdate.startDate) {
        throw new ValidationError("Data de fim deve ser posterior à data de início");
      }
    } else if (dataToUpdate.startDate && existingTrip.endDate) {
      if (existingTrip.endDate <= dataToUpdate.startDate) {
        throw new ValidationError("Data de início não pode ser posterior à data de fim existente");
      }
    } else if (dataToUpdate.endDate && existingTrip.startDate) {
      if (dataToUpdate.endDate <= existingTrip.startDate) {
        throw new ValidationError("Data de fim deve ser posterior à data de início existente");
      }
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: dataToUpdate,
    });

    logger.info("Viagem atualizada com sucesso", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    res.json({
      success: true,
      data: trip,
      message: "Viagem atualizada com sucesso",
    });
  })
);

// DELETE /api/trips/:id - Deletar viagem
router.delete(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  param("id").isString().withMessage("ID da viagem deve ser uma string"),
  handleValidationErrors,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;
    const { id } = req.params;

    logger.info("Deletando viagem", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    // Verificar se a viagem existe e pertence ao usuário
    const existingTrip = await prisma.trip.findFirst({
      where: {
        id,
        tenantId: tenantId,
        userId: userId,
      },
    });

    if (!existingTrip) {
      throw new NotFoundError("Viagem não encontrada");
    }

    await prisma.trip.delete({
      where: { id },
    });

    logger.info("Viagem deletada com sucesso", {
      tenantId,
      userId,
      tripId: id,
      component: "trips",
    });

    res.json({
      success: true,
      message: "Viagem deletada com sucesso",
    });
  })
);

// GET /api/trips/stats - Estatísticas das viagens
router.get(
  "/stats",
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { tenantId, userId } = req;

    logger.info("Buscando estatísticas de viagens", {
      tenantId,
      userId,
      component: "trips",
    });

    const [totalTrips, activeTrips, completedTrips, totalBudget, totalSpent] = await Promise.all([
      prisma.trip.count({
        where: {
          tenantId: tenantId,
          userId: userId,
        },
      }),
      prisma.trip.count({
        where: {
          tenantId: tenantId,
          userId: userId,
          status: "active",
        },
      }),
      prisma.trip.count({
        where: {
          tenantId: tenantId,
          userId: userId,
          status: "completed",
        },
      }),
      prisma.trip.aggregate({
        where: {
          tenantId: tenantId,
          userId: userId,
        },
        _sum: {
          budget: true,
        },
      }),
      prisma.trip.aggregate({
        where: {
          tenantId: tenantId,
          userId: userId,
        },
        _sum: {
          spent: true,
        },
      }),
    ]);

    const stats = {
      totalTrips,
      activeTrips,
      completedTrips,
      planningTrips: totalTrips - activeTrips - completedTrips,
      totalBudget: Number(totalBudget._sum.budget) || 0,
      totalSpent: Number(totalSpent._sum.spent) || 0,
      remainingBudget: (Number(totalBudget._sum.budget) || 0) - (Number(totalSpent._sum.spent) || 0),
    };

    logger.info("Estatísticas de viagens calculadas", {
      tenantId,
      userId,
      stats,
      component: "trips",
    });

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;