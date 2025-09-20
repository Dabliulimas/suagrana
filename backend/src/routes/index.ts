import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";
import accountRoutes from "./accounts";
import transactionRoutes from "./transactions";
import investmentRoutes from "./investments";
import goalRoutes from "./goals";
import reportRoutes from "./reports";
import healthRoutes from "./health";
import categoriesRoutes from "./categories";
import tagsRoutes from "./tags";
import budgetRoutes from "./budget";
import contactRoutes from "./contacts";
import testRoutes from "./test";
import { logger } from "@/utils/logger";

const router = Router();

// Middleware para log de todas as requisições
router.use((req, res, next) => {
  const start = Date.now();

  // Log da requisição
  logger.info("API Request", {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: req.user?.id || "anonymous",
  });

  // Interceptar a resposta para log
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    logger.info("API Response", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || "anonymous",
    });

    return originalSend.call(this, data);
  };

  next();
});

// Rotas de saúde (sem autenticação)
router.use("/health", healthRoutes);

// Rotas de teste (sem autenticação)
router.use("/test", testRoutes);

// Rotas de autenticação
router.use("/auth", authRoutes);

// Rotas sem autenticação (acesso direto)
router.use("/users", userRoutes);
router.use("/accounts", accountRoutes);
router.use("/transactions", transactionRoutes);
router.use("/investments", investmentRoutes);
router.use("/goals", goalRoutes);
router.use("/reports", reportRoutes);
router.use("/categories", categoriesRoutes);
router.use("/tags", tagsRoutes);
router.use("/budget", budgetRoutes);
router.use("/contacts", contactRoutes);

// Rota de teste da API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SuaGrana API está funcionando!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      accounts: "/api/accounts",
      transactions: "/api/transactions",
      investments: "/api/investments",
      goals: "/api/goals",
      reports: "/api/reports",
      categories: "/api/categories",
      tags: "/api/tags",
      budget: "/api/budget",
    },
  });
});

// Middleware para rotas não encontradas
router.use("*", (req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Rota não encontrada",
      details: `${req.method} ${req.originalUrl} não existe`,
    },
  });
});

export default router;
