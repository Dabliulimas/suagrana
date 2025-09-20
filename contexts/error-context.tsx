"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { toast } from "sonner";
import {
  ErrorHandler,
  InvestmentError,
  LogLevel,
} from "../lib/utils/error-handler";
import { logger, logComponents } from "../../lib/logger";

interface ErrorInfo {
  id: string;
  message: string;
  code: string;
  timestamp: Date;
  context?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
  page?: string;
  userId?: string;
}

interface ErrorContextType {
  errors: ErrorInfo[];
  reportError: (
    error: Error | InvestmentError,
    context?: Record<string, any>,
  ) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  getUnresolvedErrors: () => ErrorInfo[];
  getCriticalErrors: () => ErrorInfo[];
  exportErrorReport: () => string;
  isOnline: boolean;
  retryQueue: Array<{
    operation: () => Promise<any>;
    context?: Record<string, any>;
  }>;
  addToRetryQueue: (
    operation: () => Promise<any>,
    context?: Record<string, any>,
  ) => void;
  processRetryQueue: () => Promise<void>;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [retryQueue, setRetryQueue] = useState<
    Array<{ operation: () => Promise<any>; context?: Record<string, any> }>
  >([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info("Conexão restaurada", undefined, "ErrorProvider");
      toast.success("Conexão restaurada!");

      // Process retry queue when back online
      processRetryQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.warn("Conexão perdida", undefined, "ErrorProvider");
      toast.warning(
        "Conexão perdida. Algumas funcionalidades podem não funcionar.",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        "Unhandled promise rejection",
        event.reason,
        "ErrorProvider",
      );
      reportError(new Error(event.reason), { type: "unhandled_rejection" });
    };

    const handleError = (event: ErrorEvent) => {
      logger.error("Global error", event.error, "ErrorProvider");
      reportError(event.error, {
        type: "global_error",
        filename: event.filename,
        lineno: event.lineno,
      });
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  const reportError = useCallback(
    (error: Error | InvestmentError, context?: Record<string, any>) => {
      const errorInfo: ErrorInfo = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        code: error instanceof InvestmentError ? error.code : "UNKNOWN_ERROR",
        timestamp: new Date(),
        context: {
          ...context,
          stack: error.stack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        severity: getSeverity(error),
        resolved: false,
        page: window.location.pathname,
        userId: context?.userId || "anonymous",
      };

      setErrors((prev) => [errorInfo, ...prev.slice(0, 99)]); // Keep last 100 errors

      // Log to system logger
      logger.error(error.message, error, "ErrorProvider");

      // Handle error with existing error handler
      ErrorHandler.handle(error, context);

      // Send to external service in production
      if (process.env.NODE_ENV === "production") {
        sendToExternalService(errorInfo);
      }

      return errorInfo.id;
    },
    [],
  );

  const getSeverity = (
    error: Error | InvestmentError,
  ): "low" | "medium" | "high" | "critical" => {
    if (error instanceof InvestmentError) {
      switch (error.code) {
        case "VALIDATION_ERROR":
          return "low";
        case "CALCULATION_ERROR":
        case "DATA_ERROR":
          return "medium";
        case "NETWORK_ERROR":
        case "AUTH_ERROR":
          return "high";
        case "SYSTEM_ERROR":
        case "CRITICAL_ERROR":
          return "critical";
        default:
          return "medium";
      }
    }

    // Check error message for severity indicators
    const message = error.message.toLowerCase();
    if (message.includes("network") || message.includes("fetch")) return "high";
    if (message.includes("auth") || message.includes("permission"))
      return "high";
    if (message.includes("critical") || message.includes("fatal"))
      return "critical";

    return "medium";
  };

  const sendToExternalService = async (errorInfo: ErrorInfo) => {
    try {
      // In a real app, send to your error tracking service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      logComponents.error("Production Error Report:", errorInfo);

      // You could also send to your own API
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // })
    } catch (err) {
      logComponents.error("Failed to send error report:", err);
    }
  };

  const clearError = useCallback((id: string) => {
    setErrors((prev) =>
      prev.map((error) =>
        error.id === id ? { ...error, resolved: true } : error,
      ),
    );
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors((prev) => prev.map((error) => ({ ...error, resolved: true })));
  }, []);

  const getUnresolvedErrors = useCallback(() => {
    return errors.filter((error) => !error.resolved);
  }, [errors]);

  const getCriticalErrors = useCallback(() => {
    return errors.filter(
      (error) => error.severity === "critical" && !error.resolved,
    );
  }, [errors]);

  const exportErrorReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: errors.length,
      unresolvedErrors: getUnresolvedErrors().length,
      criticalErrors: getCriticalErrors().length,
      errors: errors.map((error) => ({
        ...error,
        timestamp: error.timestamp.toISOString(),
      })),
    };

    return JSON.stringify(report, null, 2);
  }, [errors, getUnresolvedErrors, getCriticalErrors]);

  const addToRetryQueue = useCallback(
    (operation: () => Promise<any>, context?: Record<string, any>) => {
      setRetryQueue((prev) => [...prev, { operation, context }]);
      logger.info(
        "Operação adicionada à fila de retry",
        context,
        "ErrorProvider",
      );
    },
    [],
  );

  const processRetryQueue = useCallback(async () => {
    if (retryQueue.length === 0) return;

    logger.info(
      `Processando ${retryQueue.length} operações da fila de retry`,
      undefined,
      "ErrorProvider",
    );

    const queue = [...retryQueue];
    setRetryQueue([]);

    for (const { operation, context } of queue) {
      try {
        await operation();
        logger.info(
          "Operação da fila executada com sucesso",
          context,
          "ErrorProvider",
        );
      } catch (error) {
        logger.error(
          "Falha ao executar operação da fila",
          error as Error,
          "ErrorProvider",
        );
        reportError(error as Error, { ...context, retryFailed: true });
      }
    }
  }, [retryQueue, reportError]);

  const value: ErrorContextType = {
    errors,
    reportError,
    clearError,
    clearAllErrors,
    getUnresolvedErrors,
    getCriticalErrors,
    exportErrorReport,
    isOnline,
    retryQueue,
    addToRetryQueue,
    processRetryQueue,
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useErrorContext must be used within an ErrorProvider");
  }
  return context;
}

// Hook for easy error reporting in components
export function useErrorReporting() {
  const { reportError, addToRetryQueue, isOnline } = useErrorContext();

  const reportAndRetry = useCallback(
    async (operation: () => Promise<any>, context?: Record<string, any>) => {
      try {
        return await operation();
      } catch (error) {
        if (!isOnline) {
          addToRetryQueue(operation, context);
          toast.info(
            "Operação adicionada à fila. Será executada quando a conexão for restaurada.",
          );
        } else {
          reportError(error as Error, context);
        }
        throw error;
      }
    },
    [reportError, addToRetryQueue, isOnline],
  );

  return {
    reportError,
    reportAndRetry,
    isOnline,
  };
}
