"use client";

import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { Loader2, TrendingUp } from "lucide-react";

interface OptimizedLoadingProps {
  isLoading?: boolean;
  message?: string;
  className?: string;
  variant?: "default" | "minimal" | "skeleton";
  delay?: number; // Delay antes de mostrar o loading
}

export function OptimizedLoading({
  isLoading = true,
  message = "Carregando...",
  className,
  variant = "default",
  delay = 200, // 200ms delay para evitar flicker
}: OptimizedLoadingProps) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  if (!showLoading) {
    return null;
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center justify-center p-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4",
        "min-h-[200px] text-center",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <div className="relative bg-primary rounded-full p-3">
          <TrendingUp className="h-6 w-6 text-primary-foreground animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">{message}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Otimizando sua experiência financeira...
        </p>
      </div>
    </div>
  );
}

// Componente de loading para páginas inteiras
export function PageLoading({
  message = "Carregando página...",
}: {
  message?: string;
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <OptimizedLoading message={message} variant="default" delay={0} />
    </div>
  );
}

// Componente de loading para cards/seções
export function SectionLoading({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <OptimizedLoading variant="skeleton" delay={100} />
    </div>
  );
}

// Hook para gerenciar estados de loading com debounce
export function useOptimizedLoading(initialState = false, debounceMs = 300) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [debouncedLoading, setDebouncedLoading] = useState(initialState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLoading(isLoading);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [isLoading, debounceMs]);

  return {
    isLoading,
    debouncedLoading,
    setLoading: setIsLoading,
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
  };
}

export default OptimizedLoading;
