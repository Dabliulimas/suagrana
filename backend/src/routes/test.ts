import { Router, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { successResponse } from "@/utils/response";
import { generateTokens } from "@/middleware/auth";

const router = Router();

/**
 * @route GET /api/test/ping
 * @desc Teste básico de conectividade
 * @access Public
 */
router.get(
  "/ping",
  asyncHandler(async (req: Request, res: Response) => {
    const response = {
      message: "Pong! Backend está funcionando",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    };

    res.json(successResponse(response, "Conectividade OK"));
  }),
);

/**
 * @route GET /api/test/status
 * @desc Status detalhado do sistema
 * @access Public
 */
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response) => {
    const response = {
      status: "online",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      services: {
        database: "connected", // Simplificado para teste
        redis: "optional",
        api: "running",
      },
    };

    res.json(successResponse(response, "Status do sistema"));
  }),
);

/**
 * @route POST /api/test/echo
 * @desc Eco dos dados enviados
 * @access Public
 */
router.post(
  "/echo",
  asyncHandler(async (req: Request, res: Response) => {
    const response = {
      receivedData: req.body,
      headers: {
        "content-type": req.get("Content-Type"),
        "user-agent": req.get("User-Agent"),
        authorization: req.get("Authorization") ? "Present" : "Not present",
      },
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    };

    res.json(successResponse(response, "Dados ecoados com sucesso"));
  }),
);

/**
 * @route GET /api/test/transactions/mock
 * @desc Retorna transações mockadas para teste
 * @access Public
 */
router.get(
  "/transactions/mock",
  asyncHandler(async (req: Request, res: Response) => {
    const mockTransactions = [
      {
        id: "test-1",
        type: "expense",
        amount: 50.0,
        description: "Transação de teste 1",
        category: "Teste",
        account: "test-account",
        date: new Date().toISOString(),
        tags: ["mock", "test"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-2",
        type: "income",
        amount: 100.0,
        description: "Transação de teste 2",
        category: "Teste",
        account: "test-account",
        date: new Date().toISOString(),
        tags: ["mock", "test"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.json(successResponse(mockTransactions, "Transações mockadas"));
  }),
);

/**
 * @route GET /api/test/accounts/mock
 * @desc Retorna contas mockadas para teste
 * @access Public
 */
router.get(
  "/accounts/mock",
  asyncHandler(async (req: Request, res: Response) => {
    const mockAccounts = [
      {
        id: "test-account-1",
        name: "Conta Teste 1",
        type: "checking",
        balance: 1000.0,
        bankName: "Banco Teste",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "test-account-2",
        name: "Conta Teste 2",
        type: "savings",
        balance: 5000.0,
        bankName: "Banco Teste",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    res.json(successResponse(mockAccounts, "Contas mockadas"));
  }),
);

/**
 * @route POST /api/test/auth/mock
 * @desc Simula login para teste
 * @access Public
 */
router.post(
  "/auth/mock",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Simular validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
        code: "MISSING_CREDENTIALS",
      });
    }

    // Gerar tokens JWT válidos para teste
    const userId = "test-user-1";
    const tokens = generateTokens(userId, email);

    const response = {
      user: {
        id: userId,
        email: email,
        name: "Usuário Teste",
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };

    res.json(successResponse(response, "Login mockado realizado com sucesso"));
  }),
);

/**
 * @route GET /api/test/cors
 * @desc Teste de CORS
 * @access Public
 */
router.get(
  "/cors",
  asyncHandler(async (req: Request, res: Response) => {
    const response = {
      origin: req.get("Origin") || "No origin header",
      method: req.method,
      headers: {
        "access-control-allow-origin": res.get("Access-Control-Allow-Origin"),
        "access-control-allow-methods": res.get("Access-Control-Allow-Methods"),
        "access-control-allow-headers": res.get("Access-Control-Allow-Headers"),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(successResponse(response, "Teste de CORS"));
  }),
);

export default router;
