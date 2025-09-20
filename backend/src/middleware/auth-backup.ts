import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { config } from "@/config/config";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/middleware/errorHandler";
// import { logger, loggerUtils } from '@/utils/logger';
// import { redisClient } from '@/config/database';

const prisma = new PrismaClient();

// Interface para o payload do JWT
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Interface para o usuário autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

// Estender o tipo Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Função para verificar se o token está na blacklist
async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    // Redis desabilitado temporariamente
    // const blacklisted = await redisClient.get(`blacklist:${token}`);
    // return blacklisted === 'true';
    return false; // Sempre permitir acesso quando Redis está desabilitado
  } catch (error) {
    console.error("Erro ao verificar blacklist do token:", error);
    return false; // Em caso de erro, permitir o acesso
  }
}

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

// Função para extrair token do header Authorization
function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

// Middleware principal de autenticação
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extrair token do header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.log("Token ausente");
      throw new AuthenticationError("Token de acesso obrigatório");
    }

    // Verificar se o token está na blacklist
    if (await isTokenBlacklisted(token)) {
      console.log("Token na blacklist");
      throw new AuthenticationError("Token inválido");
    }

    // Verificar e decodificar o token
    if (!config.jwt.secret) {
      throw new AuthenticationError("JWT secret not configured");
    }
    const decoded = jwt.verify(token, String(config.jwt.secret)) as JWTPayload;

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
      console.log("Usuário não encontrado:", {
        userId: decoded.userId,
        email: decoded.email,
      });
      throw new AuthenticationError("Usuário não encontrado");
    }

    // Verificar se o email do token corresponde ao usuário
    if (user.email !== decoded.email) {
      console.log("Email não confere:", {
        userId: user.id,
        tokenEmail: decoded.email,
      });
      throw new AuthenticationError("Token inválido");
    }

    // Adicionar usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    console.log("Token validado:", { userId: user.id, email: user.email });
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.log("Token expirado:", error);
      next(new AuthenticationError("Token expirado. Faça login novamente."));
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("Token inválido:", error);
      next(new AuthenticationError("Token inválido"));
    } else {
      console.error("Erro inesperado na autenticação:", error);
      next(new AuthenticationError("Erro interno de autenticação"));
    }
  }
};

// Middleware opcional de autenticação (não falha se não houver token)
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next(); // Continuar sem usuário
    }

    // Verificar se o token está na blacklist
    if (await isTokenBlacklisted(token)) {
      return next(); // Continuar sem usuário
    }

    // Verificar e decodificar o token
    if (!config.jwt.secret) {
      throw new AuthenticationError("JWT secret not configured");
    }
    const decoded = jwt.verify(token, String(config.jwt.secret)) as JWTPayload;

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

    if (user && user.email === decoded.email) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }

    next();
  } catch (error) {
    // Em caso de erro, continuar sem usuário
    next();
  }
};

// Middleware para verificar se o usuário é proprietário do recurso
export const ownershipMiddleware = (resourceUserIdField: string = "userId") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (req.user.id !== resourceUserId) {
      console.warn("Acesso não autorizado:", {
        userId: req.user.id,
        attemptedResource: resourceUserId,
        endpoint: req.originalUrl,
      });
      return next(new AuthorizationError("Acesso negado ao recurso"));
    }

    next();
  };
};

// Middleware para verificar permissões específicas
export const permissionMiddleware = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AuthenticationError());
      }

      // Aqui você pode implementar lógica de permissões mais complexa
      // Por enquanto, todos os usuários autenticados têm todas as permissões
      // Em uma implementação futura, você pode adicionar roles e permissions

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Função utilitária para gerar tokens
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

  if (!config.jwt.secret || !config.jwt.refreshSecret) {
    throw new Error("JWT secrets not configured");
  }

  const accessToken = jwt.sign(accessTokenPayload, String(config.jwt.secret), {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    String(config.jwt.refreshSecret),
    { expiresIn: config.jwt.refreshExpiresIn },
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
  };
}

// Função para verificar refresh token
export function verifyRefreshToken(token: string): JWTPayload {
  if (!config.jwt.refreshSecret) {
    throw new Error("JWT refresh secret not configured");
  }
  return jwt.verify(token, String(config.jwt.refreshSecret)) as JWTPayload;
}

export default authMiddleware;
