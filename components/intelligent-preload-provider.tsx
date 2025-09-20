"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { logComponents } from "../lib/utils/logger";
import { usePathname } from "next/navigation";
import {
  intelligentPreloader,
  useIntelligentPreloader,
} from "../lib/intelligent-preloader";
import { assetUtils } from "../lib/asset-optimizer";

interface PreloadContextType {
  isPreloading: boolean;
  preloadedRoutes: string[];
  preloadStats: any;
  preloadForRoute: (route: string) => Promise<void>;
  forcePreloadComponents: (components: string[]) => Promise<void>;
  preloadCriticalAssets: () => Promise<void>;
}

const PreloadContext = createContext<PreloadContextType | null>(null);

interface IntelligentPreloadProviderProps {
  children: React.ReactNode;
  enableAutoPreload?: boolean;
  criticalRoutes?: string[];
  preloadOnHover?: boolean;
}

export function IntelligentPreloadProvider({
  children,
  enableAutoPreload = true,
  criticalRoutes = ["/dashboard", "/transactions", "/budget"],
  preloadOnHover = true,
}: IntelligentPreloadProviderProps) {
  const pathname = usePathname();
  const { preloadForRoute, forcePreload, isPreloading, stats } =
    useIntelligentPreloader();
  const [preloadedRoutes, setPreloadedRoutes] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize critical assets and routes on mount
  useEffect(() => {
    const initializePreloading = async () => {
      try {
        // Skip preloading in development to avoid 404 errors
        if (process.env.NODE_ENV === "development") {
          console.log("Skipping asset preloading in development mode");
          setIsInitialized(true);
          return;
        }

        // Preload critical assets first
        await assetUtils.preloadCriticalAssets();

        // Preload critical routes
        if (criticalRoutes.length > 0) {
          await Promise.allSettled(
            criticalRoutes.map((route) => preloadForRoute(route)),
          );
          setPreloadedRoutes((prev) => [
            ...new Set([...prev, ...criticalRoutes]),
          ]);
        }

        setIsInitialized(true);
      } catch (error) {
        console.warn("Failed to initialize preloading:", error);
        setIsInitialized(true);
      }
    };

    initializePreloading();
  }, [criticalRoutes, preloadForRoute]);

  // Auto-preload based on current route
  useEffect(() => {
    if (!enableAutoPreload || !isInitialized) return;

    const handleRouteChange = async () => {
      try {
        await preloadForRoute(pathname);
        setPreloadedRoutes((prev) =>
          prev.includes(pathname) ? prev : [...prev, pathname],
        );
      } catch (error) {
        console.warn("Failed to preload for route:", pathname, error);
      }
    };

    // Small delay to allow route to settle
    const timeoutId = setTimeout(handleRouteChange, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, enableAutoPreload, isInitialized, preloadForRoute]);

  // Setup hover preloading
  useEffect(() => {
    if (!preloadOnHover || typeof window === "undefined") return;

    const handleLinkHover = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (!link || !link.href) return;

      try {
        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;

        const route = url.pathname;
        if (!preloadedRoutes.includes(route)) {
          await preloadForRoute(route);
          setPreloadedRoutes((prev) => [...prev, route]);
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    };

    // Add hover listeners with debouncing
    let hoverTimeout: NodeJS.Timeout;
    const debouncedHover = (event: MouseEvent) => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => handleLinkHover(event), 150);
    };

    if (typeof document !== "undefined") {
      document.addEventListener("mouseover", debouncedHover);
      return () => {
        document.removeEventListener("mouseover", debouncedHover);
        clearTimeout(hoverTimeout);
      };
    }
  }, [preloadOnHover, preloadedRoutes, preloadForRoute]);

  // Setup intersection observer for preloading visible links
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (!link.href) return;

            try {
              const url = new URL(link.href);
              if (url.origin !== window.location.origin) return;

              const route = url.pathname;
              if (!preloadedRoutes.includes(route)) {
                // Preload with lower priority for visible links
                setTimeout(async () => {
                  await preloadForRoute(route);
                  setPreloadedRoutes((prev) => [...prev, route]);
                }, 1000);
              }
            } catch (error) {
              // Ignore invalid URLs
            }
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      },
    );

    // Observe all links
    const observeLinks = () => {
      if (typeof document === "undefined") return;
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach((link) => observer.observe(link));
    };

    // Initial observation
    observeLinks();

    // Re-observe when DOM changes
    const mutationObserver = new MutationObserver(() => {
      observeLinks();
    });

    if (typeof document !== "undefined") {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [preloadedRoutes, preloadForRoute]);

  const preloadCriticalAssets = useCallback(async () => {
    await assetUtils.preloadCriticalAssets();
  }, []);

  const forcePreloadComponents = useCallback(
    async (components: string[]) => {
      await forcePreload(components);
    },
    [forcePreload],
  );

  const contextValue: PreloadContextType = {
    isPreloading,
    preloadedRoutes,
    preloadStats: stats,
    preloadForRoute,
    forcePreloadComponents,
    preloadCriticalAssets,
  };

  return (
    <PreloadContext.Provider value={contextValue}>
      {children}
      {/* Preload status indicator (only in development) */}
      {process.env.NODE_ENV === "development" && <PreloadStatusIndicator />}
    </PreloadContext.Provider>
  );
}

// Hook to use preload context
export function usePreloadContext() {
  const context = useContext(PreloadContext);
  if (!context) {
    throw new Error(
      "usePreloadContext must be used within IntelligentPreloadProvider",
    );
  }
  return context;
}

// Development status indicator
function PreloadStatusIndicator() {
  const { isPreloading, preloadedRoutes, preloadStats } = usePreloadContext();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
          isPreloading
            ? "bg-blue-500 text-white animate-pulse"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {isPreloading ? "Preloading..." : `${preloadedRoutes.length} Preloaded`}
      </button>

      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 p-4 bg-white rounded-lg shadow-lg border max-w-sm">
          <h3 className="font-semibold text-sm mb-2">Preload Status</h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium">Preloaded Routes:</span>
              <div className="mt-1 max-h-20 overflow-y-auto">
                {preloadedRoutes.map((route) => (
                  <div key={route} className="text-gray-600">
                    {route}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="font-medium">Components:</span>
              <div className="text-gray-600">
                {preloadStats.preloadedComponents?.length || 0} loaded
              </div>
            </div>

            <div>
              <span className="font-medium">Queue:</span>
              <div className="text-gray-600">
                {preloadStats.queueLength || 0} pending
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HOC for components that need preloading
export function withIntelligentPreload<P extends object>(
  Component: React.ComponentType<P>,
  preloadConfig: {
    components?: string[];
    assets?: {
      scripts?: string[];
      styles?: string[];
      images?: string[];
      fonts?: string[];
    };
  },
) {
  return function PreloadedComponent(props: P) {
    const { forcePreloadComponents } = usePreloadContext();
    const [isPreloaded, setIsPreloaded] = useState(false);

    useEffect(() => {
      const preloadResources = async () => {
        try {
          // Preload components
          if (preloadConfig.components) {
            await forcePreloadComponents(preloadConfig.components);
          }

          // Preload assets
          if (preloadConfig.assets) {
            assetUtils.preloadRouteAssets("component", preloadConfig.assets);
          }

          setIsPreloaded(true);
        } catch (error) {
          console.warn("Failed to preload component resources:", error);
          setIsPreloaded(true);
        }
      };

      preloadResources();
    }, [forcePreloadComponents]);

    if (!isPreloaded) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for manual preloading control
export function useManualPreload() {
  const { preloadForRoute, forcePreloadComponents } = usePreloadContext();

  const preloadRoute = useCallback(
    async (route: string) => {
      await preloadForRoute(route);
    },
    [preloadForRoute],
  );

  const preloadComponents = useCallback(
    async (components: string[]) => {
      await forcePreloadComponents(components);
    },
    [forcePreloadComponents],
  );

  return {
    preloadRoute,
    preloadComponents,
  };
}

export default IntelligentPreloadProvider;
