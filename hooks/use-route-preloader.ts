"use client";

import { useRouter } from "next/navigation";
import { logComponents } from "../lib/utils/logger";
import { useCallback, useEffect, useRef } from "react";

// Cache global para rotas pré-carregadas
const routeCache = new Set<string>();
const preloadQueue = new Set<string>();

interface UseRoutePreloaderOptions {
  debounceMs?: number;
  maxCacheSize?: number;
  priorityRoutes?: string[];
}

export function useRoutePreloader(options: UseRoutePreloaderOptions = {}) {
  const {
    debounceMs = 150,
    maxCacheSize = 20,
    priorityRoutes = ["/", "/transactions", "/investments"],
  } = options;

  const router = useRouter();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const preloadTimerRef = useRef<NodeJS.Timeout>();

  // Limpar cache se exceder o tamanho máximo
  const cleanupCache = useCallback(() => {
    if (routeCache.size > maxCacheSize) {
      const cacheArray = Array.from(routeCache);
      const toRemove = cacheArray.slice(0, cacheArray.length - maxCacheSize);
      toRemove.forEach((route) => routeCache.delete(route));
    }
  }, [maxCacheSize]);

  // Preload com debounce
  const debouncedPreload = useCallback(
    (href: string) => {
      if (routeCache.has(href) || preloadQueue.has(href)) return;

      preloadQueue.add(href);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (preloadQueue.has(href)) {
          try {
            router.prefetch(href);
            routeCache.add(href);
            preloadQueue.delete(href);
            cleanupCache();
          } catch (error) {
            console.warn(`Failed to prefetch route: ${href}`, error);
            preloadQueue.delete(href);
          }
        }
      }, debounceMs);
    },
    [router, debounceMs, cleanupCache],
  );

  // Preload imediato para rotas prioritárias
  const preloadPriority = useCallback(
    (href: string) => {
      if (routeCache.has(href)) return;

      try {
        router.prefetch(href);
        routeCache.add(href);
        cleanupCache();
      } catch (error) {
        console.warn(`Failed to prefetch priority route: ${href}`, error);
      }
    },
    [router, cleanupCache],
  );

  // Preload em lote com throttling
  const batchPreload = useCallback(
    (routes: string[]) => {
      const routesToPreload = routes.filter((route) => !routeCache.has(route));

      if (routesToPreload.length === 0) return;

      let index = 0;
      const preloadNext = () => {
        if (index < routesToPreload.length) {
          const route = routesToPreload[index];
          try {
            router.prefetch(route);
            routeCache.add(route);
          } catch (error) {
            console.warn(`Failed to batch prefetch route: ${route}`, error);
          }
          index++;

          if (index < routesToPreload.length) {
            preloadTimerRef.current = setTimeout(preloadNext, 50); // 50ms entre cada preload
          } else {
            cleanupCache();
          }
        }
      };

      preloadNext();
    },
    [router, cleanupCache],
  );

  // Preload de rotas adjacentes baseado na rota atual
  const preloadAdjacent = useCallback(
    (currentRoute: string, allRoutes: string[]) => {
      const currentIndex = allRoutes.findIndex(
        (route) => route === currentRoute,
      );
      if (currentIndex === -1) return;

      const adjacentRoutes = [
        allRoutes[currentIndex - 1],
        allRoutes[currentIndex + 1],
      ].filter(Boolean);

      adjacentRoutes.forEach((route) => debouncedPreload(route));
    },
    [debouncedPreload],
  );

  // Inicializar preload de rotas prioritárias
  useEffect(() => {
    const timer = setTimeout(() => {
      priorityRoutes.forEach((route) => preloadPriority(route));
    }, 100);

    return () => clearTimeout(timer);
  }, [priorityRoutes, preloadPriority]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
    };
  }, []);

  return {
    preload: debouncedPreload,
    preloadPriority,
    batchPreload,
    preloadAdjacent,
    getCacheSize: () => routeCache.size,
    clearCache: () => {
      routeCache.clear();
      preloadQueue.clear();
    },
    isCached: (href: string) => routeCache.has(href),
  };
}

export default useRoutePreloader;
