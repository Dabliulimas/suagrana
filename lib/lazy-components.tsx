import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Loading component padrão
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// Error boundary para componentes lazy
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 border border-red-200 rounded-md bg-red-50">
    <p className="text-red-800">Failed to load component: {error.message}</p>
  </div>
);

// Componentes pesados que devem ser carregados sob demanda

// Dashboard e Analytics
export const LazySimpleDashboard = dynamic(
  () => import("@/components/simple-dashboard"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const LazyOptimizedDashboard = dynamic(
  () => import("@/components/optimized-dashboard"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const LazySimpleAnalytics = dynamic(
  () => import("@/components/simple-analytics"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Budget components
export const LazyInteractiveBudget = dynamic(
  () => import("@/components/interactive-budget"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const LazySimpleBudget = dynamic(
  () => import("@/components/simple-budget"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Investment components
export const LazyDividendModal = dynamic(
  () => import("@/components/investments/dividend-modal"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Contact management
export const LazyContactManager = dynamic(
  () => import("@/components/contact-manager"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Shared expenses
export const LazySharedExpenses = dynamic(
  () => import("@/components/shared-expenses"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Test components (apenas em desenvolvimento)
export const LazyTestUnifiedIntegration = dynamic(
  () => import("@/components/test-unified-integration"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const LazyTestContactSync = dynamic(
  () => import("@/components/test-contact-sync"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

export const LazyDebugTransactionTest = dynamic(
  () => import("@/components/debug-transaction-test"),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
);

// Utility para criar componentes lazy com configurações customizadas
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    loading?: ComponentType;
    ssr?: boolean;
    suspense?: boolean;
  } = {},
) {
  return dynamic(importFn, {
    loading: options.loading || LoadingSpinner,
    ssr: options.ssr ?? true,
    suspense: options.suspense ?? false,
  });
}

// Hook para lazy loading condicional
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  condition: boolean = true,
) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!condition || Component) return;

    setLoading(true);
    setError(null);

    importFn()
      .then((module) => {
        setComponent(() => module.default);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err : new Error("Failed to load component"),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [condition, importFn, Component]);

  return { Component, loading, error };
}

// Componente wrapper para lazy loading com error boundary
export function LazyWrapper<T>({
  importFn,
  fallback,
  errorFallback,
  children,
  ...props
}: {
  importFn: () => Promise<{ default: ComponentType<T> }>;
  fallback?: ComponentType;
  errorFallback?: ComponentType<{ error: Error }>;
  children?: React.ReactNode;
} & T) {
  const { Component, loading, error } = useLazyComponent(importFn);

  if (loading) {
    return fallback ? <fallback /> : <LoadingSpinner />;
  }

  if (error) {
    const ErrorComponent = errorFallback || ErrorFallback;
    return <ErrorComponent error={error} />;
  }

  if (!Component) {
    return null;
  }

  return <Component {...(props as T)}>{children}</Component>;
}

import React, { useState, useEffect } from "react";
