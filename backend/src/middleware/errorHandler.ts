import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
// import { logger } from '@/utils/logger';
import { config } from "@/config/config";

// Interface para erros customizados
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

// Classe para erros de aplicação
export class ApplicationError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros específicos
export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = "Token de autenticação inválido ou expirado") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = "Acesso negado") {
    super(message, 403, "AUTHORIZATION_ERROR");
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string = "Recurso") {
    super(`${resource} não encontrado`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class RateLimitError extends ApplicationError {
  constructor(
    message: string = "Muitas requisições. Tente novamente mais tarde.",
  ) {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

// Função para tratar erros do Prisma
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): AppError {
  switch (error.code) {
    case "P2002":
      // Violação de constraint única
      const field = error.meta?.target as string[];
      return new ConflictError(
        `Já existe um registro com este ${field?.[0] || "valor"}. Verifique os dados e tente novamente.`,
      );

    case "P2025":
      // Registro não encontrado
      return new NotFoundError("Registro");

    case "P2003":
      // Violação de chave estrangeira
      return new ValidationError(
        "Referência inválida. Verifique se todos os dados relacionados existem.",
      );

    case "P2014":
      // Violação de relação obrigatória
      return new ValidationError("Dados obrigatórios estão faltando.");

    case "P2021":
      // Tabela não existe
      return new ApplicationError(
        "Erro interno do banco de dados",
        500,
        "DATABASE_ERROR",
      );

    case "P2022":
      // Coluna não existe
      return new ApplicationError(
        "Erro interno do banco de dados",
        500,
        "DATABASE_ERROR",
      );

    default:
      console.error("Erro não mapeado do Prisma:", {
        code: error.code,
        message: error.message,
        meta: error.meta,
        stack: error.stack,
      });
      return new ApplicationError(
        `Erro interno do banco de dados: ${error.message}`,
        500,
        "DATABASE_ERROR",
      );
  }
}

// Função para tratar erros de validação do Joi
function handleJoiError(error: any): ValidationError {
  const message =
    error.details?.map((detail: any) => detail.message)?.join(", ") ||
    "Dados inválidos";

  return new ValidationError(message);
}

// Função para tratar erros de JWT
function handleJWTError(error: any): AuthenticationError {
  if (error.name === "TokenExpiredError") {
    return new AuthenticationError("Token expirado. Faça login novamente.");
  }

  if (error.name === "JsonWebTokenError") {
    return new AuthenticationError("Token inválido.");
  }

  return new AuthenticationError();
}

// Middleware principal de tratamento de erros
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let appError: AppError;

  // Identificar tipo de erro e converter para AppError
  if (error instanceof ApplicationError) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error.name === "ValidationError" && "details" in error) {
    appError = handleJoiError(error);
  } else if (
    error.name === "TokenExpiredError" ||
    error.name === "JsonWebTokenError"
  ) {
    appError = handleJWTError(error);
  } else {
    // Erro não identificado
    appError = new ApplicationError(
      config.server.nodeEnv === "production"
        ? "Erro interno do servidor"
        : error.message,
      500,
      "INTERNAL_ERROR",
      false,
    );
  }

  // Log do erro
  const errorLog = {
    message: appError.message,
    statusCode: appError.statusCode,
    code: appError.code,
    stack: appError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  };

  if (appError.statusCode && appError.statusCode >= 500) {
    console.error("Server Error", errorLog);
  } else {
    console.warn("Client Error", errorLog);
  }

  // Resposta para o cliente
  const response: any = {
    success: false,
    message: appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
  };

  // Incluir stack trace apenas em desenvolvimento
  if (config.server.nodeEnv === "development" && appError.stack) {
    response.stack = appError.stack;
  }

  // Incluir detalhes adicionais para erros de validação
  if (appError instanceof ValidationError && "details" in error) {
    response.details = error.details;
  }

  res.status(appError.statusCode || 500).json(response);
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para tratar rotas não encontradas
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const error = new NotFoundError(`Rota ${req.originalUrl}`);
  next(error);
};

export default errorHandler;
