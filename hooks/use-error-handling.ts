"use client";

import { useCallback, useRef } from "react";
import { logComponents } from "../lib/utils/logger";
import { useErrorContext } from "../../contexts/error-context";
import { ErrorHandler, InvestmentError } from "../lib/error-handler";
import { toast } from "sonner";

interface UseErrorHandlingOptions {
  showToast?: boolean;
  context?: Record<string, any>;
  severity?: "low" | "medium" | "high" | "critical";
  retryable?: boolean;
}

interface RetryableOperation<T> {
  operation: () => Promise<T>;
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const { reportError, isOnline } = useErrorContext();
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const {
    showToast = true,
    context = {},
    severity = "medium",
    retryable = false,
  } = options;

  // Função principal para lidar com erros
  const handleError = useCallback(
    (
      error: Error | InvestmentError,
      additionalContext?: Record<string, any>,
    ) => {
      const errorToReport =
        error instanceof InvestmentError
          ? error
          : new InvestmentError(error.message, "UNKNOWN_ERROR", {
              originalError: error,
              ...context,
              ...additionalContext,
            });

      // Reportar erro usando o contexto global
      reportError(errorToReport, {
        severity,
        retryable,
        ...context,
        ...additionalContext,
      });

      // Mostrar toast se habilitado
      if (showToast) {
        const message = errorToReport.userMessage || errorToReport.message;

        switch (severity) {
          case "critical":
            toast.error(`Erro crítico: ${message}`, {
              duration: 10000,
              action: {
                label: "Reportar",
                onClick: () => {
                  // Aqui poderia abrir um modal de report ou enviar para suporte
                  console.log("Reportando erro crítico:", errorToReport);
                },
              },
            });
            break;
          case "high":
            toast.error(message, { duration: 6000 });
            break;
          case "medium":
            toast.warning(message, { duration: 4000 });
            break;
          case "low":
            toast.info(message, { duration: 2000 });
            break;
        }
      }

      return errorToReport;
    },
    [reportError, showToast, context, severity, retryable],
  );

  // Wrapper para operações assíncronas com tratamento de erro
  const withErrorHandling = useCallback(
    <T>(
      operation: () => Promise<T>,
      errorContext?: Record<string, any>,
    ): Promise<T> => {
      return ErrorHandler.withErrorHandling(operation, {
        ...context,
        ...errorContext,
      });
    },
    [context],
  );

  // Wrapper para operações síncronas com tratamento de erro
  const withSyncErrorHandling = useCallback(
    <T>(operation: () => T, errorContext?: Record<string, any>): T | null => {
      try {
        return ErrorHandler.withSyncErrorHandling(operation, {
          ...context,
          ...errorContext,
        });
      } catch (error) {
        handleError(error as Error, errorContext);
        return null;
      }
    },
    [context, handleError],
  );

  // Função para operações com retry automático
  const withRetry = useCallback(
    async <T>({
      operation,
      maxRetries = 3,
      retryDelay = 1000,
      onRetry,
      onMaxRetriesReached,
    }: RetryableOperation<T>): Promise<T> => {
      const operationId = Math.random().toString(36).substr(2, 9);
      let lastError: Error;

      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
          const result = await operation();
          // Limpar contador de retry em caso de sucesso
          retryCountRef.current.delete(operationId);
          return result;
        } catch (error) {
          lastError = error as Error;
          retryCountRef.current.set(operationId, attempt);

          // Se não é a última tentativa, fazer retry
          if (attempt <= maxRetries) {
            onRetry?.(attempt, lastError);

            // Delay progressivo: aumenta o delay a cada tentativa
            const currentDelay = retryDelay * Math.pow(1.5, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            continue;
          }

          // Última tentativa falhou
          onMaxRetriesReached?.(lastError);
          break;
        }
      }

      // Reportar erro final
      const finalError = new InvestmentError(
        `Operação falhou após ${maxRetries} tentativas: ${lastError.message}`,
        "MAX_RETRIES_EXCEEDED",
        {
          originalError: lastError,
          maxRetries,
          attempts: maxRetries + 1,
          ...context,
        },
      );

      handleError(finalError);
      throw finalError;
    },
    [context, handleError],
  );

  // Função para operações que dependem de conectividade
  const withNetworkHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      fallback?: () => T | Promise<T>,
    ): Promise<T> => {
      if (!isOnline) {
        if (fallback) {
          try {
            return await fallback();
          } catch (error) {
            const offlineError = new InvestmentError(
              "Operação não disponível offline e fallback falhou",
              "OFFLINE_FALLBACK_FAILED",
              { originalError: error, ...context },
            );
            handleError(offlineError);
            throw offlineError;
          }
        } else {
          const offlineError = new InvestmentError(
            "Esta operação requer conexão com a internet",
            "OFFLINE_ERROR",
            context,
          );
          handleError(offlineError);
          throw offlineError;
        }
      }

      return withErrorHandling(operation);
    },
    [isOnline, context, handleError, withErrorHandling],
  );

  // Função para validação com tratamento de erro
  const validateAndHandle = useCallback(
    <T>(
      value: T,
      validator: (value: T) => boolean | string,
      errorMessage?: string,
    ): T => {
      try {
        const result = validator(value);

        if (result === false) {
          throw new InvestmentError(
            errorMessage || "Valor inválido",
            "VALIDATION_ERROR",
            { value, ...context },
          );
        }

        if (typeof result === "string") {
          throw new InvestmentError(result, "VALIDATION_ERROR", {
            value,
            ...context,
          });
        }

        return value;
      } catch (error) {
        handleError(error as Error, { value });
        throw error;
      }
    },
    [context, handleError],
  );

  // Função para logging de performance com tratamento de erro
  const measurePerformance = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string,
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await withErrorHandling(operation, { operationName });
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log performance se demorar mais que 2 segundos
        if (duration > 2000) {
          console.warn(
            `Operação lenta detectada: ${operationName} levou ${duration.toFixed(2)}ms`,
          );
        }

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        handleError(error as Error, {
          operationName,
          duration: duration.toFixed(2) + "ms",
        });

        throw error;
      }
    },
    [withErrorHandling, handleError],
  );

  return {
    handleError,
    withErrorHandling,
    withSyncErrorHandling,
    withRetry,
    withNetworkHandling,
    validateAndHandle,
    measurePerformance,
    isOnline,
  };
}

// Hook específico para formulários
export function useFormErrorHandling() {
  const { handleError, validateAndHandle } = useErrorHandling({
    severity: "medium",
    showToast: true,
    context: { component: "form" },
  });

  const validateField = useCallback(
    (
      fieldName: string,
      value: any,
      rules: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        custom?: (value: any) => boolean | string;
      },
    ) => {
      try {
        if (rules.required && (!value || value.toString().trim() === "")) {
          throw new InvestmentError(
            `Campo ${fieldName} é obrigatório`,
            "REQUIRED_FIELD",
            { fieldName, value },
          );
        }

        if (
          value &&
          rules.minLength &&
          value.toString().length < rules.minLength
        ) {
          throw new InvestmentError(
            `Campo ${fieldName} deve ter pelo menos ${rules.minLength} caracteres`,
            "MIN_LENGTH",
            { fieldName, value, minLength: rules.minLength },
          );
        }

        if (
          value &&
          rules.maxLength &&
          value.toString().length > rules.maxLength
        ) {
          throw new InvestmentError(
            `Campo ${fieldName} deve ter no máximo ${rules.maxLength} caracteres`,
            "MAX_LENGTH",
            { fieldName, value, maxLength: rules.maxLength },
          );
        }

        if (value && rules.pattern && !rules.pattern.test(value.toString())) {
          throw new InvestmentError(
            `Campo ${fieldName} tem formato inválido`,
            "INVALID_FORMAT",
            { fieldName, value, pattern: rules.pattern.toString() },
          );
        }

        if (rules.custom) {
          return validateAndHandle(
            value,
            rules.custom,
            `Campo ${fieldName} é inválido`,
          );
        }

        return value;
      } catch (error) {
        handleError(error as Error, { fieldName });
        throw error;
      }
    },
    [handleError, validateAndHandle],
  );

  return {
    handleError,
    validateField,
  };
}
