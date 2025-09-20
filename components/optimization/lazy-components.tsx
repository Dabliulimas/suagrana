"use client";

import dynamic from "next/dynamic";
import { logComponents } from "../lib/utils/logger";
import {
  DashboardSkeleton,
  CardSkeleton,
} from "../ui/loading-skeleton";

// Lazy load heavy dashboard components
export const LazySimpleAnalytics = dynamic(
  () =>
    import("@/components/simple-analytics").then((mod) => ({
      default: mod.SimpleAnalytics,
    })),
  {
    loading: () => (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    ),
    ssr: false,
  },
);

export const LazyInteractiveBudget = dynamic(
  () =>
    import("@/components/interactive-budget").then((mod) => ({
      default: mod.InteractiveBudget,
    })),
  {
    loading: () => (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    ),
    ssr: false,
  },
);

// Lazy load chart components (heavy with recharts)
export const LazyChartComponent = dynamic(
  () => import("recharts").then((mod) => mod),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-64 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

// Lazy load virtualized list for large datasets
export const LazyVirtualizedList = dynamic(
  () =>
    import("@/components/optimization/virtualized-list").then((mod) => ({
      default: mod.VirtualizedList,
    })),
  {
    loading: () => (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    ),
    ssr: false,
  },
);

// Lazy load contact manager (heavy component)
export const LazyContactManager = dynamic(
  () =>
    import("@/components/contact-manager").then((mod) => ({
      default: mod.ContactManager,
    })),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  },
);

// Lazy load shared expenses (complex calculations)
export const LazySharedExpenses = dynamic(
  () =>
    import("@/components/shared-expenses").then((mod) => ({
      default: mod.SharedExpenses,
    })),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  },
);

// Lazy load investment components (heavy with calculations)
export const LazyDividendModal = dynamic(
  () =>
    import("@/components/investments/dividend-modal").then((mod) => ({
      default: mod.DividendModal,
    })),
  {
    loading: () => <div className="p-4">Carregando...</div>,
    ssr: false,
  },
);

// Performance monitoring wrapper
export function withPerformanceMonitoring<T extends {}>(
  Component: React.ComponentType<T>,
  componentName: string,
) {
  return function PerformanceMonitoredComponent(props: T) {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        console.warn(
          `Slow component render: ${componentName} took ${renderTime.toFixed(2)}ms`,
        );
      }

      // Store performance data
      const perfData = JSON.parse(
        localStorage.getItem("component-performance") || "{}",
      );
      perfData[componentName] = {
        lastRenderTime: renderTime,
        averageRenderTime: perfData[componentName]
          ? (perfData[componentName].averageRenderTime + renderTime) / 2
          : renderTime,
        renderCount: (perfData[componentName]?.renderCount || 0) + 1,
      };
      localStorage.setItem("component-performance", JSON.stringify(perfData));
    });

    return <Component {...props} />;
  };
}

import React from "react";
