"use client";

import { Suspense, ComponentType, ReactNode } from "react";
import { Skeleton } from "../ui/loading-skeleton";

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export function LazyWrapper({
  children,
  fallback,
  className,
}: LazyWrapperProps) {
  const defaultFallback = (
    <div className={className}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

// HOC for lazy loading components
export function withLazyLoading<T extends {}>(
  Component: ComponentType<T>,
  fallback?: ReactNode,
) {
  return function LazyComponent(props: T) {
    return (
      <LazyWrapper fallback={fallback}>
        <Component {...props} />
      </LazyWrapper>
    );
  };
}

// Specific lazy wrappers for common components
export function LazyDashboard({ children }: { children: ReactNode }) {
  return (
    <LazyWrapper
      fallback={
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex justify-between p-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {children}
    </LazyWrapper>
  );
}

export function LazyChart({ children }: { children: ReactNode }) {
  return (
    <LazyWrapper
      fallback={
        <div className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {children}
    </LazyWrapper>
  );
}

export function LazyTable({ children }: { children: ReactNode }) {
  return (
    <LazyWrapper
      fallback={
        <div className="space-y-2">
          <div className="flex gap-4 p-3 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex gap-4 p-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      }
    >
      {children}
    </LazyWrapper>
  );
}
