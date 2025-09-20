"use client";

import { NextRequest, NextResponse } from "next/server";
import {
  InvestmentError,
  ErrorHandler,
  InvestmentLogger,
} from "./error-handler";
import { z } from "zod";

// Schema para validação de requests de API
const ApiRequestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  url: z.string(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

// Interface para configuração do middleware
interface ErrorMiddlewareConfig {
  enableLogging?: boolean;
  enableValidation?: boolean;
  enableRateLimit?: boolean;
  enableSanitization?: boolean;
  customErrorHandler?: (error: Error, request: NextRequest) => NextResponse;
}

// Classe principal do middleware de erro
export class ErrorMiddleware {
  private static instance: ErrorMiddleware;
  private config: ErrorMiddlewareConfig;
  private logger: InvestmentLogger;
  private requestCount: Map<string, { count: number; resetTime: number }> =
    new Map();

  private constructor(config: ErrorMiddlewareConfig = {}) {
    this.config = {
      enableLogging: true,
      enableValidation: true,
      enableRateLimit: true,
      enableSanitization: true,
      ...config,
    };
    this.logger = new InvestmentLogger();
  }

  static getInstance(config?: ErrorMiddlewareConfig): ErrorMiddleware {
    if (!ErrorMiddleware.instance) {
      ErrorMiddleware.instance = new ErrorMiddleware(config);
    }
    return ErrorMiddleware.instance;
  }

  // Middleware principal para interceptar requests
  async handleRequest(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Log da requisição
      if (this.config.enableLogging) {
        this.logger.info("API Request", {
          requestId,
          method: request.method,
          url: request.url,
          userAgent: request.headers.get("user-agent"),
          ip: this.getClientIP(request),
        });
      }

      // Validação de rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResult = this.checkRateLimit(request);
        if (!rateLimitResult.allowed) {
          throw new InvestmentError(
            "Muitas requisições. Tente novamente em alguns minutos.",
            "RATE_LIMIT_EXCEEDED",
            {
              requestId,
              ip: this.getClientIP(request),
              resetTime: rateLimitResult.resetTime,
            },
          );
        }
      }

      // Validação do request
      if (this.config.enableValidation) {
        await this.validateRequest(request);
      }

      // Sanitização do request
      if (this.config.enableSanitization) {
        request = await this.sanitizeRequest(request);
      }

      // Executar o handler principal
      const response = await handler(request);

      // Log de sucesso
      if (this.config.enableLogging) {
        const duration = Date.now() - startTime;
        this.logger.info("API Response", {
          requestId,
          status: response.status,
          duration: `${duration}ms`,
        });
      }

      return response;
    } catch (error) {
      return this.handleError(error as Error, request, requestId, startTime);
    }
  }

  // Tratamento centralizado de erros
  private async handleError(
    error: Error,
    request: NextRequest,
    requestId: string,
    startTime: number,
  ): Promise<NextResponse> {
    const duration = Date.now() - startTime;

    // Converter para InvestmentError se necessário
    const investmentError =
      error instanceof InvestmentError
        ? error
        : new InvestmentError(error.message, "API_ERROR", {
            originalError: error,
            requestId,
            method: request.method,
            url: request.url,
            duration: `${duration}ms`,
            ip: this.getClientIP(request),
          });

    // Log do erro
    if (this.config.enableLogging) {
      this.logger.error("API Error", {
        requestId,
        error: investmentError.message,
        code: investmentError.code,
        stack: investmentError.stack,
        context: investmentError.context,
      });
    }

    // Usar handler customizado se disponível
    if (this.config.customErrorHandler) {
      return this.config.customErrorHandler(investmentError, request);
    }

    // Resposta padrão baseada no tipo de erro
    return this.createErrorResponse(investmentError, requestId);
  }

  // Criar resposta de erro padronizada
  private createErrorResponse(
    error: InvestmentError,
    requestId: string,
  ): NextResponse {
    const isDevelopment = process.env.NODE_ENV === "development";

    let statusCode = 500;
    let errorResponse: any = {
      success: false,
      error: {
        message: error.userMessage || "Erro interno do servidor",
        code: error.code,
        requestId,
      },
    };

    // Determinar status code baseado no tipo de erro
    switch (error.code) {
      case "VALIDATION_ERROR":
        statusCode = 400;
        break;
      case "UNAUTHORIZED":
        statusCode = 401;
        break;
      case "FORBIDDEN":
        statusCode = 403;
        break;
      case "NOT_FOUND":
        statusCode = 404;
        break;
      case "RATE_LIMIT_EXCEEDED":
        statusCode = 429;
        errorResponse.error.retryAfter = error.context?.resetTime;
        break;
      case "VALIDATION_ERROR":
        statusCode = 422;
        break;
      default:
        statusCode = 500;
    }

    // Adicionar detalhes em desenvolvimento
    if (isDevelopment) {
      errorResponse.error.details = {
        originalMessage: error.message,
        stack: error.stack,
        context: error.context,
      };
    }

    return NextResponse.json(errorResponse, { status: statusCode });
  }

  // Validação de request
  private async validateRequest(request: NextRequest): Promise<void> {
    try {
      // Validação básica do método HTTP
      const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
      if (!validMethods.includes(request.method)) {
        throw new InvestmentError(
          `Método HTTP ${request.method} não permitido`,
          "INVALID_METHOD",
        );
      }

      // Validação de Content-Type para requests com body
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentType = request.headers.get("content-type");
        if (
          contentType &&
          !contentType.includes("application/json") &&
          !contentType.includes("multipart/form-data")
        ) {
          throw new InvestmentError(
            "Content-Type deve ser application/json ou multipart/form-data",
            "INVALID_CONTENT_TYPE",
          );
        }
      }

      // Validação de tamanho do body
      if (request.body) {
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
          // 10MB
          throw new InvestmentError(
            "Tamanho do request muito grande (máximo 10MB)",
            "REQUEST_TOO_LARGE",
          );
        }
      }
    } catch (error) {
      if (error instanceof InvestmentError) {
        throw error;
      }
      throw new InvestmentError(
        "Erro na validação do request",
        "VALIDATION_ERROR",
        { originalError: error },
      );
    }
  }

  // Sanitização de request
  private async sanitizeRequest(request: NextRequest): Promise<NextRequest> {
    // Implementar sanitização de headers e body se necessário
    // Por enquanto, retorna o request original
    return request;
  }

  // Rate limiting simples
  private checkRateLimit(request: NextRequest): {
    allowed: boolean;
    resetTime?: number;
  } {
    const ip = this.getClientIP(request);
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const maxRequests = 100; // máximo de requests por janela

    const key = `${ip}:${Math.floor(now / windowMs)}`;
    const current = this.requestCount.get(key);

    if (!current) {
      this.requestCount.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, resetTime: current.resetTime };
    }

    current.count++;
    return { allowed: true };
  }

  // Obter IP do cliente
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIP) {
      return realIP;
    }

    return "unknown";
  }

  // Gerar ID único para request
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Limpar cache de rate limiting periodicamente
  private cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, data] of this.requestCount.entries()) {
      if (data.resetTime < now) {
        this.requestCount.delete(key);
      }
    }
  }
}

// Função helper para criar middleware
export function createErrorMiddleware(config?: ErrorMiddlewareConfig) {
  const middleware = ErrorMiddleware.getInstance(config);

  return {
    handle: (handler: (req: NextRequest) => Promise<NextResponse>) => {
      return async (request: NextRequest) => {
        return middleware.handleRequest(request, handler);
      };
    },

    // Wrapper para API routes do Next.js
    withErrorHandling: (handler: any) => {
      return async (req: NextRequest, context?: any) => {
        try {
          return await middleware.handleRequest(req, async () => {
            return await handler(req, context);
          });
        } catch (error) {
          return middleware["handleError"](
            error as Error,
            req,
            middleware["generateRequestId"](),
            Date.now(),
          );
        }
      };
    },
  };
}

// Export do middleware padrão
export const errorMiddleware = createErrorMiddleware();
