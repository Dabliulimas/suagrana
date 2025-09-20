"use client";

import { ReactNode } from "react";
import { ThemeProviderWrapper } from "./theme-provider-wrapper";
import { UnifiedProvider } from "../contexts/unified-context";
import { GlobalModalProvider } from "../contexts/ui/global-modal-context";
import { NotificationProvider } from "../contexts/notification-context";
import { ReactQueryProvider } from "../providers/react-query-provider";
import { AuthProvider } from "../contexts/auth-context";
import { DevAuthSetup } from "./dev-auth-setup";
import { ErrorBoundary } from "react-error-boundary";
import "../utils/test-notifications";
import "../utils/clear-notifications";

interface ClientProvidersProps {
  children: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Algo deu errado!
        </h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ReactQueryProvider>
        <AuthProvider>
          <DevAuthSetup />
          <ThemeProviderWrapper>
            <NotificationProvider>
              <UnifiedProvider>
                <GlobalModalProvider>{children}</GlobalModalProvider>
              </UnifiedProvider>
            </NotificationProvider>
          </ThemeProviderWrapper>
        </AuthProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
}
