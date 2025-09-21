import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { config } from "@/config/config";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/middleware/errorHandler";

const prisma = new PrismaClient();

// Middleware de bypass para desenvolvimento
export const devBypassMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Só funciona em desenvolvimento
  if (config.server.nodeEnv !== "development") {
    return next();
  }

  // Criar usuário demo para desenvolvimento
  req.user = {
    id: "demo-user-id",
    email: "demo@suagrana.com",
    name: "Usuario Demo",
  };

  console.log("🔓 Bypass de autenticação ativo (desenvolvimento)");
  next();
};

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function extractTokenFromCookies(req: Request): string | null {
  // Primeiro tenta pegar do cookie
  const cookieToken = req.cookies?.['sua-grana-token'];
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback para header (compatibilidade temporária)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      throw new AuthenticationError("Token de acesso requerido");
    }

    // Verificar se o JWT secret está configurado
    if (!config.jwt.secret) {
      throw new AuthenticationError("Configuração JWT inválida");
    }

    // Verificar e decodificar o token
    let decoded: JWTPayload;
    try {
      const jwtSecret = config.jwt.secret;
      if (!jwtSecret) {
        throw new Error("JWT secret not configured");
      }
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.error("Erro ao verificar JWT:", jwtError);
      throw new AuthenticationError("Token inválido");
    }

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      throw new AuthenticationError("Usuário não encontrado");
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    console.log(`Usuário autenticado: ${user.email}`);
    next();
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);

    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        message: error.message,
        code: "AUTHENTICATION_ERROR",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        code: "INTERNAL_ERROR",
      });
    }
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractTokenFromCookies(req);

    if (!token) {
      // Sem token, continua sem autenticação
      next();
      return;
    }

    // Verificar se o JWT secret está configurado
    if (!config.jwt.secret) {
      console.warn("JWT secret não configurado");
      next();
      return;
    }

    // Verificar e decodificar o token
    let decoded: JWTPayload;
    try {
      const jwtSecret = config.jwt.secret;
      if (!jwtSecret) {
        console.warn("JWT secret not configured");
        next();
        return;
      }
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.warn("Token inválido no middleware opcional:", jwtError);
      next();
      return;
    }

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    if (user) {
      // Adicionar usuário ao request se encontrado e ativo
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      console.log(`Usuário autenticado opcionalmente: ${user.email}`);
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de autenticação opcional:", error);
    // Em caso de erro, continua sem autenticação
    next();
  }
};

export const ownershipMiddleware = (resourceUserIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Autenticação requerida",
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId && resourceUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado: recurso não pertence ao usuário",
        code: "OWNERSHIP_ERROR",
      });
    }

    next();
  };
};

// Função para adicionar token à blacklist
export async function blacklistToken(
  token: string,
  expiresIn: number,
): Promise<void> {
  try {
    // Redis desabilitado temporariamente
    // await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
    console.log("Token seria adicionado à blacklist (Redis desabilitado)", {
      token: token.substring(0, 20) + "...",
    });
  } catch (error) {
    console.error("Erro ao adicionar token à blacklist:", error);
  }
}

// Função para gerar tokens JWT
export function generateTokens(userId: string, email: string) {
  const accessTokenPayload = {
    userId,
    email,
  };

  const refreshTokenPayload = {
    userId,
    email,
    type: "refresh",
  };

  const jwtSecret = config.jwt.secret;
  const jwtRefreshSecret = config.jwt.refreshSecret;

  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error("JWT secrets not configured");
  }

  const accessTokenOptions: any = {
    expiresIn: config.jwt.expiresIn,
  };

  const refreshTokenOptions: any = {
    expiresIn: config.jwt.refreshExpiresIn,
  };

  const accessToken = jwt.sign(accessTokenPayload, jwtSecret, accessTokenOptions);
  const refreshToken = jwt.sign(refreshTokenPayload, jwtRefreshSecret, refreshTokenOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
  };
}

// Função para verificar refresh token
export function verifyRefreshToken(token: string): JWTPayload {
  const jwtRefreshSecret = config.jwt.refreshSecret;
  if (!jwtRefreshSecret) {
    throw new Error("JWT refresh secret not configured");
  }
  return jwt.verify(token, jwtRefreshSecret) as JWTPayload;
}

export default authMiddleware;
