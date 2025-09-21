import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

export interface TenantContext {
  tenantId: string;
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user) {
      throw new AuthenticationError("Usuário não autenticado");
    }

    // Extrair tenantId do header
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      logger.error("TenantId não fornecido no header x-tenant-id", {
        userId: req.user.id,
        headers: req.headers
      });
      throw new AuthenticationError("TenantId é obrigatório no header x-tenant-id");
    }

    // Verificar se o tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      logger.error("Tenant não encontrado", {
        tenantId,
        userId: req.user.id
      });
      throw new AuthorizationError("Tenant não encontrado");
    }

    // Verificar se o usuário tem acesso ao tenant
    const userTenant = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: req.user.id,
          tenantId: tenantId
        }
      }
    });

    if (!userTenant) {
      logger.error("Usuário não tem acesso ao tenant", {
        tenantId,
        userId: req.user.id
      });
      throw new AuthorizationError("Acesso negado ao tenant");
    }

    // Adicionar contexto do tenant ao request
    req.tenant = {
      tenantId: tenantId,
      userId: req.user.id
    };

    logger.info("Contexto do tenant estabelecido", {
      tenantId,
      userId: req.user.id
    });

    next();
  } catch (error) {
    logger.error("Erro no middleware de tenant", {
      error: error instanceof Error ? error.message : error,
      userId: req.user?.id,
      headers: req.headers
    });
    next(error);
  }
};

export default tenantMiddleware;