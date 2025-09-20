import { toast } from "sonner";

import { logComponents } from "../logger";
// Tipos de erro personalizados
export class InvestmentError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = "InvestmentError";
  }
}

export class ValidationError extends InvestmentError {
  constructor(message: string, field?: string, value?: any) {
    super(message, "VALIDATION_ERROR", { field, value });
    this.name = "ValidationError";
  }
}

export class CalculationError extends InvestmentError {
  constructor(message: string, operation?: string, data?: any) {
    super(message, "CALCULATION_ERROR", { operation, data });
    this.name = "CalculationError";
  }
}

export class DataError extends InvestmentError {
  constructor(message: string, source?: string, data?: any) {
    super(message, "DATA_ERROR", { source, data });
    this.name = "DataError";
  }
}

// Níveis de log
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Interface para entrada de log
interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

// Logger personalizado
class InvestmentLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private addLog(entry: LogEntry) {
    if (entry.level >= this.currentLevel) {
      this.logs.push(entry);

      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[${entry.level}] ${entry.message}`, entry.context);
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context,
    });
  }

  info(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context,
    });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      error,
      context,
    });
  }

  critical(message: string, error?: Error, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: LogLevel.CRITICAL,
      message,
      error,
      context,
    });
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instância global do logger
const logger = new InvestmentLogger();

// Handler de erro global
export class ErrorHandler {
  static handle(error: unknown, context?: Record<string, any>): void {
    let investmentError: InvestmentError;

    if (error instanceof InvestmentError) {
      investmentError = error;
    } else if (error instanceof Error) {
      investmentError = new InvestmentError(error.message, "UNKNOWN_ERROR", {
        originalError: error.name,
        ...context,
      });
    } else {
      investmentError = new InvestmentError(
        "Erro desconhecido",
        "UNKNOWN_ERROR",
        { error: String(error), ...context },
      );
    }

    logger.error(investmentError.message, error as Error, {
      code: investmentError.code,
      context: investmentError.context,
    });

    this.showUserError(investmentError);
    this.reportError(investmentError);
  }

  private static showUserError(error: InvestmentError): void {
    const userMessage = this.getUserFriendlyMessage(error);

    if (error.code === "VALIDATION_ERROR") {
      toast.error("Erro de Validação", {
        description: userMessage,
      });
    } else if (error.code === "CALCULATION_ERROR") {
      toast.error("Erro de Cálculo", {
        description: userMessage,
      });
    } else {
      toast.error("Erro", {
        description: userMessage,
      });
    }
  }

  private static getUserFriendlyMessage(error: InvestmentError): string {
    const friendlyMessages: Record<string, string> = {
      VALIDATION_ERROR: "Por favor, verifique os dados inseridos.",
      CALCULATION_ERROR: "Erro ao processar os cálculos. Tente novamente.",
      DATA_ERROR: "Erro ao acessar os dados. Verifique sua conexão.",
      UNKNOWN_ERROR: "Ocorreu um erro inesperado. Tente novamente.",
    };

    return friendlyMessages[error.code] || error.message;
  }

  private static reportError(error: InvestmentError): void {
    if (process.env.NODE_ENV === "production") {
      logComponents.error("Error reported:", error);
    }
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  static withSyncErrorHandling<T>(
    operation: () => T,
    context?: Record<string, any>,
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }
}

// Utilitários de validação
export class Validators {
  static validateNumber(
    value: any,
    fieldName: string,
    min?: number,
    max?: number,
  ): number {
    if (value === null || value === undefined || value === "") {
      throw new ValidationError(`${fieldName} é obrigatório`, fieldName, value);
    }

    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(
        `${fieldName} deve ser um número válido`,
        fieldName,
        value,
      );
    }

    if (min !== undefined && num < min) {
      throw new ValidationError(
        `${fieldName} deve ser maior ou igual a ${min}`,
        fieldName,
        value,
      );
    }

    if (max !== undefined && num > max) {
      throw new ValidationError(
        `${fieldName} deve ser menor ou igual a ${max}`,
        fieldName,
        value,
      );
    }

    return num;
  }

  static validatePositiveNumber(value: any, fieldName: string): number {
    return this.validateNumber(value, fieldName, 0.01);
  }

  static validateString(
    value: any,
    fieldName: string,
    minLength?: number,
    maxLength?: number,
  ): string {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} é obrigatório`, fieldName, value);
    }

    const str = String(value).trim();

    if (str === "") {
      throw new ValidationError(
        `${fieldName} não pode estar vazio`,
        fieldName,
        value,
      );
    }

    if (minLength !== undefined && str.length < minLength) {
      throw new ValidationError(
        `${fieldName} deve ter pelo menos ${minLength} caracteres`,
        fieldName,
        value,
      );
    }

    if (maxLength !== undefined && str.length > maxLength) {
      throw new ValidationError(
        `${fieldName} deve ter no máximo ${maxLength} caracteres`,
        fieldName,
        value,
      );
    }

    return str;
  }

  static validateDate(value: any, fieldName: string): Date {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} é obrigatório`, fieldName, value);
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) {
      throw new ValidationError(
        `${fieldName} deve ser uma data válida`,
        fieldName,
        value,
      );
    }

    return date;
  }

  static validateEmail(value: any, fieldName: string): string {
    const email = this.validateString(value, fieldName);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new ValidationError(
        `${fieldName} deve ser um email válido`,
        fieldName,
        value,
      );
    }

    return email;
  }

  static validateEnum<T>(
    value: any,
    enumObject: Record<string, T>,
    fieldName: string,
  ): T {
    const validValues = Object.values(enumObject);

    if (!validValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} deve ser um dos valores: ${validValues.join(", ")}`,
        fieldName,
        value,
      );
    }

    return value;
  }

  static validateArray<T>(
    value: any,
    fieldName: string,
    validator?: (item: any, index: number) => T,
  ): T[] {
    if (!Array.isArray(value)) {
      throw new ValidationError(
        `${fieldName} deve ser um array`,
        fieldName,
        value,
      );
    }

    if (validator) {
      return value.map((item, index) => {
        try {
          return validator(item, index);
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ValidationError(
              `${fieldName}[${index}]: ${error.message}`,
              `${fieldName}[${index}]`,
              item,
            );
          }
          throw error;
        }
      });
    }

    return value;
  }
}

// Utilitários para retry
export class RetryUtils {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
    context?: Record<string, any>,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.debug(`Tentativa ${attempt}/${maxAttempts}`, {
          ...context,
          attempt,
        });
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Tentativa ${attempt} falhou: ${lastError.message}`, {
          ...context,
          attempt,
          error: lastError.message,
        });

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * attempt),
          );
        }
      }
    }

    logger.error(
      `Todas as ${maxAttempts} tentativas falharam`,
      lastError!,
      context,
    );
    throw lastError!;
  }
}

// Monitor de performance
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static start(operationName: string): void {
    this.timers.set(operationName, performance.now());
    logger.debug(`Iniciando operação: ${operationName}`);
  }

  static end(operationName: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(operationName);

    if (!startTime) {
      logger.warn(`Timer não encontrado para operação: ${operationName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationName);

    logger.info(
      `Operação ${operationName} concluída em ${duration.toFixed(2)}ms`,
      {
        ...context,
        duration,
        operationName,
      },
    );

    if (duration > 5000) {
      logger.warn(
        `Operação lenta detectada: ${operationName} (${duration.toFixed(2)}ms)`,
        {
          ...context,
          duration,
          operationName,
        },
      );
    }

    return duration;
  }

  static async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<T> {
    this.start(operationName);
    try {
      const result = await operation();
      this.end(operationName, context);
      return result;
    } catch (error) {
      this.end(operationName, { ...context, error: true });
      throw error;
    }
  }
}

// Hook para React components
export const useErrorHandler = () => {
  return {
    handleError: ErrorHandler.handle,
    withErrorHandling: ErrorHandler.withErrorHandling,
    withSyncErrorHandling: ErrorHandler.withSyncErrorHandling,
    logger,
  };
};

// Exportações principais já feitas individualmente acima
