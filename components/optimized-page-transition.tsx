"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logComponents } from "../lib/logger";

// Hook para debounce otimizado
export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para monitoramento de performance de renderização
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(0);

  // Incrementa contador a cada render
  renderCountRef.current += 1;

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Atualiza apenas se mudou significativamente
      if (Math.abs(renderTime - lastRenderTimeRef.current) > 1) {
        lastRenderTimeRef.current = renderTime;
        setLastRenderTime(renderTime);
      }

      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === "development" && renderTime > 16) {
        logComponents.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (${renderCountRef.current} renders)`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    isSlowRender: lastRenderTimeRef.current > 16,
  };
}

// Configurações de animação otimizadas
const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const childVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

interface OptimizedPageTransitionProps {
  children: React.ReactNode;
  className?: string;
  enableStagger?: boolean;
  customVariants?: any;
  loading?: boolean;
  error?: string | null;
}

// Componente de transição de página otimizado
export function OptimizedPageTransition({
  children,
  className = "",
  enableStagger = true,
  customVariants,
  loading = false,
  error = null,
}: OptimizedPageTransitionProps) {
  const variants = customVariants || pageTransitionVariants;

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center justify-center min-h-[200px] ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center min-h-[200px] text-center p-6 ${className}`}
      >
        <div className="text-red-500 mb-2">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Voltar ao Início
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page-content"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {enableStagger ? (
          <motion.div variants={childVariants}>{children}</motion.div>
        ) : (
          children
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para otimização de re-renders
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T {
  return useCallback(callback, deps);
}

// Hook para memoização otimizada
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  return useMemo(factory, deps);
}

// Componente para lazy loading otimizado
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
}

export function LazyComponent({
  children,
  fallback = <div className="animate-pulse bg-muted h-20 rounded"></div>,
  threshold = 0.1,
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return <div ref={setRef}>{isVisible ? children : fallback}</div>;
}

export default OptimizedPageTransition;
