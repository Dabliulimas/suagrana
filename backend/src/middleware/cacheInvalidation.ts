import { Request, Response, NextFunction } from "express";
import { cacheService } from "@/services/cacheService";
import { reportService } from "@/services/reportService";
import { logger } from "@/utils/logger";

/**
 * Interface para configuração de invalidação de cache
 */
interface CacheInvalidationConfig {
  tags?: string[];
  patterns?: string[];
  userSpecific?: boolean;
  reportTypes?: ("dashboard" | "transactions" | "investments" | "goals")[];
}

/**
 * Middleware para invalidação automática de cache
 */
export function cacheInvalidationMiddleware(config: CacheInvalidationConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Armazenar configuração para uso após a resposta
    res.locals.cacheInvalidationConfig = config;

    // Hook para invalidar cache após resposta bem-sucedida
    const originalSend = res.send;
    res.send = function (data: any) {
      // Chamar o método original primeiro
      const result = originalSend.call(this, data);

      // Invalidar cache apenas se a resposta foi bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await invalidateCache(req, config);
          } catch (error) {
            logger.error("Cache invalidation failed", { error, config });
          }
        });
      }

      return result;
    };

    next();
  };
}

/**
 * Função para invalidar cache baseado na configuração
 */
async function invalidateCache(
  req: Request,
  config: CacheInvalidationConfig,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId && config.userSpecific) {
    logger.warn("Cache invalidation skipped: no user ID found");
    return;
  }

  // Invalidar por tags
  if (config.tags && config.tags.length > 0) {
    const tags =
      config.userSpecific && userId
        ? config.tags.map((tag) =>
            tag.includes("user:") ? tag : `user:${userId}:${tag}`,
          )
        : config.tags;

    await cacheService.invalidateByTags(tags);
    logger.debug("Cache invalidated by tags", { tags, userId });
  }

  // Invalidar por padrões
  if (config.patterns && config.patterns.length > 0) {
    for (const pattern of config.patterns) {
      const finalPattern =
        config.userSpecific && userId
          ? pattern.replace("{userId}", userId)
          : pattern;

      await cacheService.invalidateByPattern(finalPattern);
      logger.debug("Cache invalidated by pattern", {
        pattern: finalPattern,
        userId,
      });
    }
  }

  // Invalidar relatórios específicos
  if (config.reportTypes && config.reportTypes.length > 0 && userId) {
    for (const reportType of config.reportTypes) {
      await reportService.invalidateReportsByType(userId, reportType);
    }
    logger.debug("Reports cache invalidated", {
      reportTypes: config.reportTypes,
      userId,
    });
  }
}

/**
 * Middleware pré-configurado para invalidação de cache de transações
 */
export const invalidateTransactionCache = cacheInvalidationMiddleware({
  tags: ["transactions", "dashboard"],
  userSpecific: true,
  reportTypes: ["dashboard", "transactions"],
});

/**
 * Middleware pré-configurado para invalidação de cache de contas
 */
export const invalidateAccountCache = cacheInvalidationMiddleware({
  tags: ["accounts", "dashboard"],
  userSpecific: true,
  reportTypes: ["dashboard"],
});

/**
 * Middleware pré-configurado para invalidação de cache de investimentos
 */
export const invalidateInvestmentCache = cacheInvalidationMiddleware({
  tags: ["investments", "dashboard"],
  userSpecific: true,
  reportTypes: ["dashboard", "investments"],
});

/**
 * Middleware pré-configurado para invalidação de cache de metas
 */
export const invalidateGoalCache = cacheInvalidationMiddleware({
  tags: ["goals", "dashboard"],
  userSpecific: true,
  reportTypes: ["dashboard", "goals"],
});

/**
 * Middleware pré-configurado para invalidação completa de cache do usuário
 */
export const invalidateUserCache = cacheInvalidationMiddleware({
  patterns: ["*:user:{userId}:*"],
  userSpecific: true,
});

/**
 * Decorator para invalidação automática de cache em métodos de serviço
 */
export function InvalidateCache(config: CacheInvalidationConfig) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        // Executar método original
        const result = await method.apply(this, args);

        // Invalidar cache após sucesso
        setImmediate(async () => {
          try {
            // Extrair userId do primeiro argumento (convenção dos serviços)
            const userId = args[0];

            if (config.tags && config.tags.length > 0) {
              const tags =
                config.userSpecific && userId
                  ? config.tags.map((tag) =>
                      tag.includes("user:") ? tag : `user:${userId}:${tag}`,
                    )
                  : config.tags;

              await cacheService.invalidateByTags(tags);
            }

            if (config.patterns && config.patterns.length > 0) {
              for (const pattern of config.patterns) {
                const finalPattern =
                  config.userSpecific && userId
                    ? pattern.replace("{userId}", userId)
                    : pattern;

                await cacheService.invalidateByPattern(finalPattern);
              }
            }

            if (config.reportTypes && config.reportTypes.length > 0 && userId) {
              for (const reportType of config.reportTypes) {
                await reportService.invalidateReportsByType(userId, reportType);
              }
            }
          } catch (error) {
            logger.error("Cache invalidation failed in decorator", {
              error,
              config,
            });
          }
        });

        return result;
      } catch (error) {
        // Re-throw original error
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Middleware para adicionar headers de cache
 */
export function cacheHeadersMiddleware(
  maxAge: number = 300, // 5 minutos por padrão
  isPrivate: boolean = true,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET") {
      const cacheControl = isPrivate
        ? `private, max-age=${maxAge}`
        : `public, max-age=${maxAge}`;

      res.set({
        "Cache-Control": cacheControl,
        ETag: `"${Date.now()}"`,
        "Last-Modified": new Date().toUTCString(),
      });
    }

    next();
  };
}

/**
 * Middleware para verificar cache condicional (ETag/If-Modified-Since)
 */
export function conditionalCacheMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.get("If-None-Match");
    const ifModifiedSince = req.get("If-Modified-Since");

    // Verificar ETag
    if (ifNoneMatch) {
      const etag = res.get("ETag");
      if (etag && ifNoneMatch === etag) {
        return res.status(304).end();
      }
    }

    // Verificar Last-Modified
    if (ifModifiedSince) {
      const lastModified = res.get("Last-Modified");
      if (lastModified) {
        const ifModifiedSinceDate = new Date(ifModifiedSince);
        const lastModifiedDate = new Date(lastModified);

        if (lastModifiedDate <= ifModifiedSinceDate) {
          return res.status(304).end();
        }
      }
    }

    next();
  };
}

export default {
  cacheInvalidationMiddleware,
  invalidateTransactionCache,
  invalidateAccountCache,
  invalidateInvestmentCache,
  invalidateGoalCache,
  invalidateUserCache,
  InvalidateCache,
  cacheHeadersMiddleware,
  conditionalCacheMiddleware,
};
