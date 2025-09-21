"use client";

import React, {
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { logComponents } from "../lib/logger";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useIntersectionObserver } from "../hooks/use-intersection-observer";
import { useDebounce } from "../hooks/use-debounce";
import { cn } from "../lib/utils";
import { assetUtils } from "../lib/asset-optimizer";

// Cache de componentes para evitar re-renderizações desnecessárias
const componentCache = new Map<
  string,
  React.ComponentType<Record<string, unknown>>
>();

// HOC para cache de componentes
export function withComponentCache<T extends object>(
  Component: React.ComponentType<T>,
  cacheKey: string,
): React.ComponentType<T> {
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!;
  }

  const CachedComponent = memo(Component);
  componentCache.set(cacheKey, CachedComponent);
  return CachedComponent;
}

// Enhanced Optimized Image Component with asset optimization integration
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  sizes?: string;
  onLoad?: () => void;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    className,
    priority = false,
    placeholder = "blur",
    sizes,
    onLoad,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);

    // Get optimized image props using asset utils
    const imageProps = useMemo(() => {
      if (priority || !sizes) {
        return {
          src: assetUtils.optimizeImage(src, { width, height }),
          srcSet: undefined,
        };
      }
      return assetUtils.getResponsiveImageProps(src, alt, sizes);
    }, [src, alt, width, height, priority, sizes]);

    useIntersectionObserver(imgRef, {
      onIntersect: () => setIsInView(true),
      threshold: 0.1,
      rootMargin: "50px",
    });

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    return (
      <div
        ref={imgRef}
        className={cn("relative overflow-hidden", className)}
        style={{ width, height }}
      >
        {placeholder === "blur" && !isLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        {isInView && (
          <img
            {...imageProps}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={handleLoad}
            loading={priority ? "eager" : "lazy"}
          />
        )}
      </div>
    );
  },
);
OptimizedImage.displayName = "OptimizedImage";

// Hook para otimização de listas grandes
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5,
) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length,
    );

    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length, visibleEnd + overscan);

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollElementRef,
    visibleRange,
  };
}

// VirtualizedList removido - usar @/components/optimization/virtualized-list

// Hook para otimização de filtros
export function useOptimizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  debounceMs: number = 300,
) {
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const debouncedFilter = useDebounce(filterFn, debounceMs);

  useEffect(() => {
    const filtered = items.filter(debouncedFilter);
    setFilteredItems(filtered);
  }, [items, debouncedFilter]);

  return filteredItems;
}

// Componente de skeleton otimizado
interface OptimizedSkeletonProps {
  count?: number;
  height?: number;
  className?: string;
  variant?: "card" | "list" | "table" | "chart";
}

export const OptimizedSkeleton = memo<OptimizedSkeletonProps>(
  ({ count = 3, height = 60, className, variant = "list" }) => {
    const skeletons = useMemo(() => {
      return Array.from({ length: count }, (_, i) => {
        switch (variant) {
          case "card":
            return (
              <Card key={i} className={className}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            );
          case "table":
            return (
              <div key={i} className={`flex gap-4 p-4 ${className}`}>
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            );
          case "chart":
            return (
              <div key={i} className={`space-y-4 ${className}`}>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-40 w-full" />
              </div>
            );
          default:
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 ${className}`}
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            );
        }
      });
    }, [count, height, className, variant]);

    return <div className="space-y-2">{skeletons}</div>;
  },
);
OptimizedSkeleton.displayName = "OptimizedSkeleton";

// Hook para monitoramento de performance
export function usePerformanceOptimization(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;
        if (renderTime > 16) {
          // Mais de 16ms pode causar jank
          console.warn(
            `${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`,
          );
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    logPerformance: useCallback(
      (operation: string, time: number) => {
        if (time > 100) {
          console.warn(
            `${componentName} ${operation} took ${time.toFixed(2)}ms`,
          );
        }
      },
      [componentName],
    ),
  };
}

// Componente de erro boundary otimizado
interface OptimizedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class OptimizedErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>,
  OptimizedErrorBoundaryState
> {
  constructor(
    props: React.PropsWithChildren<{
      fallback?: React.ComponentType<{ error: Error }>;
    }>,
  ) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): OptimizedErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logComponents.error("OptimizedErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="text-red-600">Erro no Componente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Ocorreu um erro inesperado. Tente novamente.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para preload de recursos
export function useResourcePreloader() {
  const preloadedResources = useRef(new Set<string>());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const img = new Image();
    img.src = src;
    preloadedResources.current.add(src);
  }, []);

  const preloadComponent = useCallback(async (importFn: () => Promise<any>) => {
    try {
      await importFn();
    } catch (error) {
      console.warn("Failed to preload component:", error);
    }
  }, []);

  return { preloadImage, preloadComponent };
}

// Enhanced Image with additional asset optimization features
export const EnhancedOptimizedImage = memo<
  OptimizedImageProps & {
    quality?: number;
    format?: "webp" | "avif" | "auto";
  }
>(({ quality, format = "auto", ...props }) => {
  const enhancedSrc = useMemo(() => {
    return assetUtils.optimizeImage(props.src, {
      width: props.width,
      height: props.height,
      quality,
      format,
    });
  }, [props.src, props.width, props.height, quality, format]);

  return <OptimizedImage {...props} src={enhancedSrc} />;
});
EnhancedOptimizedImage.displayName = "EnhancedOptimizedImage";

const PerformanceOptimizations = {
  OptimizedImage,
  EnhancedOptimizedImage,
  OptimizedSkeleton,
  OptimizedErrorBoundary,
  withComponentCache,
  useOptimizedFilter,
  usePerformanceOptimization,
  useResourcePreloader,
};

export default PerformanceOptimizations;
