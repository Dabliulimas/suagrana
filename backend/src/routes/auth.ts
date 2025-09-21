import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import {
  generateTokens,
  verifyRefreshToken,
  blacklistToken,
  authMiddleware,
} from "@/middleware/auth";
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  asyncHandler,
} from "@/middleware/errorHandler";
import { logger, loggerUtils } from "@/utils/logger";
import { config } from "@/config/config";

const router = Router();
const prisma = new PrismaClient();

// Validações
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Nome deve ter entre 2 e 100 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Senha deve ter pelo menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial",
    ),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
];

// Removido refreshTokenValidation pois agora usamos cookies

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

// POST /api/auth/register
router.post(
  "/register",
  registerValidation,
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      loggerUtils.logAuth(
        "register_attempt_existing_email",
        undefined,
        email,
        false,
      );
      throw new ConflictError("Email já está em uso");
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(
      password,
      config.security.bcryptRounds,
    );

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Gerar tokens
    const tokens = generateTokens(user.id, user.email);

    // Definir cookies seguros
    res.cookie('sua-grana-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    res.cookie('sua-grana-refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    loggerUtils.logAuth("register_success", user.id, user.email, true);

    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: {
        user,
      },
    });
  }),
);

// POST /api/auth/login
router.post(
  "/login",
  loginValidation,
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      loggerUtils.logAuth(
        "login_attempt_invalid_email",
        undefined,
        email,
        false,
      );
      throw new AuthenticationError("Email ou senha inválidos");
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      loggerUtils.logAuth(
        "login_attempt_invalid_password",
        user.id,
        email,
        false,
      );
      throw new AuthenticationError("Email ou senha inválidos");
    }

    // Gerar tokens
    const tokens = generateTokens(user.id, user.email);

    // Definir cookies seguros
    res.cookie('sua-grana-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    res.cookie('sua-grana-refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    loggerUtils.logAuth("login_success", user.id, user.email, true);

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken: tokens.accessToken,
      },
    });
  }),
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.['sua-grana-refresh-token'];

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token não encontrado");
    }

    try {
      // Verificar refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        loggerUtils.logAuth(
          "refresh_attempt_user_not_found",
          decoded.userId,
          decoded.email,
          false,
        );
        throw new AuthenticationError("Usuário não encontrado");
      }

      if (user.email !== decoded.email) {
        loggerUtils.logAuth(
          "refresh_attempt_email_mismatch",
          user.id,
          decoded.email,
          false,
        );
        throw new AuthenticationError("Token inválido");
      }

      // Gerar novos tokens
      const tokens = generateTokens(user.id, user.email);

      // Definir novos cookies seguros
      res.cookie('sua-grana-token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
      });

      res.cookie('sua-grana-refresh-token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      loggerUtils.logAuth("refresh_success", user.id, user.email, true);

      res.json({
        success: true,
        message: "Token renovado com sucesso",
        data: {
          user,
        },
      });
    } catch (error) {
      loggerUtils.logAuth(
        "refresh_attempt_invalid_token",
        undefined,
        undefined,
        false,
        error,
      );
      throw new AuthenticationError("Refresh token inválido ou expirado");
    }
  }),
);

// POST /api/auth/logout
router.post(
  "/logout",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.['sua-grana-token'];

    if (token) {
      // Adicionar token à blacklist
      // Calcular tempo restante do token para definir TTL no Redis
      const tokenPayload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString(),
      );
      const expiresIn = tokenPayload.exp - Math.floor(Date.now() / 1000);

      if (expiresIn > 0) {
        await blacklistToken(token, expiresIn);
      }
    }

    // Limpar cookies
    res.clearCookie('sua-grana-token');
    res.clearCookie('sua-grana-refresh-token');

    loggerUtils.logAuth("logout_success", req.user!.id, req.user!.email, true);

    res.json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  }),
);

// GET /api/auth/me
router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        userProfile: {
          select: {
            monthlyIncome: true,
            emergencyReserve: true,
            riskProfile: true,
            financialGoals: true,
            preferences: true,
          },
        },
        userTenants: {
          where: {
            isActive: true,
          },
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AuthenticationError("Usuário não encontrado");
    }

    res.json({
      success: true,
      data: { user },
    });
  }),
);

// PUT /api/auth/change-password
router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("Senha atual é obrigatória"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Nova senha deve ter pelo menos 8 caracteres")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      )
      .withMessage(
        "Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial",
      ),
  ],
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Usuário não encontrado");
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      loggerUtils.logAuth(
        "change_password_invalid_current",
        userId,
        req.user!.email,
        false,
      );
      throw new AuthenticationError("Senha atual incorreta");
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(
      newPassword,
      config.security.bcryptRounds,
    );

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    loggerUtils.logAuth(
      "change_password_success",
      userId,
      req.user!.email,
      true,
    );

    res.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  }),
);

// PUT /api/auth/forgot-password
router.put(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Email inválido")],
  validateInput,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      loggerUtils.logAuth(
        "login_attempt_invalid_email",
        undefined,
        email,
        false,
      );
      throw new AuthenticationError("Email ou senha inválidos");
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      loggerUtils.logAuth(
        "login_attempt_invalid_password",
        user.id,
        email,
        false,
      );
      throw new AuthenticationError("Email ou senha inválidos");
    }

    // Gerar tokens
    const tokens = generateTokens(user.id, user.email);

    // Definir cookies seguros
    res.cookie('sua-grana-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    res.cookie('sua-grana-refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    loggerUtils.logAuth("login_success", user.id, user.email, true);

    res.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken: tokens.accessToken,
      },
    });
  }),
);

export default router;
