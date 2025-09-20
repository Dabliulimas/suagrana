"use client";

import React, { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Componentes pesados com lazy loading
export const LazyFinancialDashboard = lazy(() =>
  import("@/components/dashboards/financial/financial-dashboard").then(
    module => ({ default: module.default })
  )
);

export const LazyAdvancedReportsDashboard = lazy(() =>
  import("@/components/dashboards/analytics/advanced-reports-dashboard").then(
    module => ({ default: module.default })
  )
);

export const LazyInvestmentPortfolio = lazy(() =>
  import("@/components/management/investments/investment-portfolio").then(
    module => ({ default: module.default })
  )
);

// LazyDataVisualization removido - componente não existe

export const LazyInvestmentDashboard = lazy(() =>
  import("@/components/investments/investment-dashboard").then(
    module => ({ default: module.InvestmentDashboard })
  )
);

export const LazyAdvancedAnalyticsDashboard = lazy(() =>
  import("@/components/dashboards/analytics/advanced-analytics-dashboard")
);

export const LazyFinancialAnalysisDashboard = lazy(() =>
  import("@/components/financial-analysis-dashboard")
);

export const LazySmartNotificationCenter = lazy(() =>
  import("@/components/smart-notification-center").then(
    module => ({ default: module.SmartNotificationCenter })
  )
);

// Componente wrapper com loading skeleton
interface LazyWrapperProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export function LazyWrapper({ 
  children, 
  height = "400px", 
  className = "" 
}: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className={`w-full space-y-4 p-4 ${className}`} style={{ height }}>
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Hook para lazy loading de dados
export function useLazyData<T>(
  fetchFunction: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFunction();
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}
