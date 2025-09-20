"use client";

import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw, Home, Bug, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InvestmentError } from "../lib/error-handler";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: any) => void;
}

// Detectar tipos de erro comuns
function getErrorType(error: Error) {
  const message = error.message.toLowerCase();
  
  if (message.includes("chunkloaderror") || message.includes("loading chunk")) {
    return "chunk";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "network";
  }
  if (message.includes("out of memory") || message.includes("maximum call stack")) {
    return "memory";
  }
  return "unknown";
}

function ModernErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const router = useRouter();
  const errorType = getErrorType(error);

  const handleGoHome = () => {
    router.push("/");
    resetErrorBoundary();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleReportError = async () => {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        type: errorType,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        storage: {
          localStorage: Object.keys(localStorage).length,
          sessionStorage: Object.keys(sessionStorage).length,
        }
      };
      
      // Salvar localmente para debug
      localStorage.setItem('last-error-report', JSON.stringify(errorReport));
      
      // Criar download do relatório
      const blob = new Blob([JSON.stringify(errorReport, null, 2)], { 
        type: "application/json" 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Relatório de erro baixado com sucesso!");
    } catch (reportError) {
      toast.error("Erro ao gerar relatório");
      console.error("Failed to report error:", reportError);
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case "chunk":
        return "Há uma nova versão disponível. Recarregue a página para continuar.";
      case "network":
        return "Problema de conexão detectado. Verifique sua internet e tente novamente.";
      case "memory":
        return "O sistema está com pouca memória. Tente fechar outras abas e recarregar.";
      default:
        return "Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.";
    }
  };

  const getIcon = () => {
    switch (errorType) {
      case "network":
        return <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <Card className="max-w-md w-full shadow-lg border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">
            Oops! Algo deu errado
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <details className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer">
                Detalhes técnicos (apenas em desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                Tipo: {errorType}
                {"\n"}Mensagem: {error.message}
                {error.stack && `\n\nStack: ${error.stack.slice(0, 500)}...`}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {errorType === "chunk" ? (
              <Button onClick={handleReload} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
            ) : (
              <Button onClick={resetErrorBoundary} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
            
            <Button 
              onClick={handleReportError}
              variant="ghost"
              size="sm"
              className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Bug className="w-4 h-4 mr-2" />
              Baixar Relatório de Erro
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Se o problema persistir, contate o suporte:
              <br />
              <a 
                href="mailto:suporte@suagrana.app" 
                className="text-primary hover:underline"
              >
                suporte@suagrana.app
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleReportError = () => {
    if (
      error &&
      typeof window !== "undefined" &&
      (window as any).__errorContext
    ) {
      const errorContext = (window as any).__errorContext;
      const report = errorContext.exportErrorReport();

      // Create a downloadable error report
      const blob = new Blob([report], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `error-report-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">
            Oops! Algo deu errado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e esta
            trabalhando para resolver o problema.
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details className="bg-gray-50 p-3 rounded text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="whitespace-pre-wrap text-red-600 text-xs overflow-auto max-h-32">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={handleReload} className="w-full">
              Recarregar Página
            </Button>
            <Button
              variant="ghost"
              onClick={handleReportError}
              className="w-full"
            >
              <Bug className="w-4 h-4 mr-2" />
              Baixar Relatório de Erro
            </Button>
            <Button variant="ghost" onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Error Boundary with Context Integration
export function ErrorBoundaryWithContext({
  children,
  fallback,
}: ErrorBoundaryProps) {
  return (
    <ErrorContextProvider>
      <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
    </ErrorContextProvider>
  );
}

// Hook for functional components with error context integration
export function useErrorHandler() {
  const errorContext = React.useContext(ErrorContext);

  return React.useCallback(
    (error: Error, errorInfo?: React.ErrorInfo) => {
      logComponents.error("Error handled by hook:", error, errorInfo);

      const investmentError =
        error instanceof InvestmentError
          ? error
          : new InvestmentError(error.message, "COMPONENT_ERROR", {
              originalError: error,
              errorInfo,
              component: "useErrorHandler",
            });

      if (errorContext) {
        errorContext.reportError(investmentError, {
          severity: "high",
          context: { errorInfo },
        });
      }
    },
    [errorContext],
  );
}

// Componente principal usando react-error-boundary
export function ErrorBoundary({ 
  children, 
  fallback: Fallback = ModernErrorFallback,
  onError
}: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: any) => {
    // Log do erro
    logComponents.error("Error Boundary caught an error:", error, errorInfo);
    
    // Criar InvestmentError com informações do React
    const investmentError =
      error instanceof InvestmentError
        ? error
        : new InvestmentError(error.message, "REACT_ERROR_BOUNDARY", {
            originalError: error,
            componentStack: errorInfo.componentStack,
            errorInfo,
          });
    
    // Reportar para contexto de erro se disponível
    if (typeof window !== "undefined" && (window as any).__errorContext) {
      (window as any).__errorContext.reportError(investmentError, {
        severity: "critical",
        context: {
          component: "ErrorBoundary",
          errorInfo,
        },
      });
    }
    
    // Callback personalizado
    onError?.(error, errorInfo);
    
    // Enviar para serviço de monitoramento em produção
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      // Sentry.captureException(error, { contexts: { errorBoundary: errorInfo } });
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback}
      onError={handleError}
      onReset={() => {
        // Limpar estado ou fazer outras ações de reset
        if (typeof window !== "undefined") {
          // Limpar dados corrompidos do localStorage se necessário
          try {
            const corruptedKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith('sua-grana-') && key.includes('corrupted')) {
                corruptedKeys.push(key);
              }
            }
            corruptedKeys.forEach(key => localStorage.removeItem(key));
          } catch {
            // Ignore localStorage errors
          }
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Hook para usar em componentes para reportar erros programaticamente
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    logComponents.error("Manual error report:", error, errorInfo);
    
    const investmentError =
      error instanceof InvestmentError
        ? error
        : new InvestmentError(error.message, "COMPONENT_ERROR", {
            originalError: error,
            errorInfo,
            component: "useErrorHandler",
          });
    
    if (typeof window !== "undefined" && (window as any).__errorContext) {
      (window as any).__errorContext.reportError(investmentError, {
        severity: "high",
        context: { errorInfo },
      });
    }
    
    // Enviar para serviço de monitoramento em produção
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }, []);
}

// Componente para áreas específicas que precisam de tratamento especial
export function FeatureErrorBoundary({ 
  children, 
  feature 
}: { 
  children: React.ReactNode;
  feature: string;
}) {
  const FeatureFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="w-5 h-5" />
          Erro em {feature}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Ocorreu um erro nesta funcionalidade. Outras partes do sistema continuam funcionando.
        </p>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={FeatureFallback}
      onError={(error, errorInfo) => {
        logComponents.error(`Error in ${feature}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Legacy components mantidos para compatibilidade
const ErrorContext = React.createContext<any>(null);
const ErrorContextProvider = ({ children }: { children: React.ReactNode }) => {
  try {
    const { ErrorProvider } = require("@/contexts/error-context");
    return <ErrorProvider>{children}</ErrorProvider>;
  } catch {
    return <>{children}</>;
  }
};
