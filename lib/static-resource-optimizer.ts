"use client";

import { useEffect, useRef, useState } from "react";

import { logComponents } from "../logger";
interface ResourceLoadOptions {
  priority?: "high" | "medium" | "low";
  preload?: boolean;
  defer?: boolean;
  async?: boolean;
  crossOrigin?: "anonymous" | "use-credentials";
  integrity?: string;
  media?: string;
}

interface LoadedResource {
  url: string;
  type: "script" | "style" | "font" | "image";
  loadTime: number;
  size?: number;
  cached: boolean;
}

class StaticResourceOptimizer {
  private loadedResources = new Map<string, LoadedResource>();
  private loadingPromises = new Map<string, Promise<void>>();
  private preloadQueue: Array<{
    url: string;
    type: string;
    options: ResourceLoadOptions;
  }> = [];
  private isProcessingQueue = false;

  // Load CSS with optimization
  async loadCSS(url: string, options: ResourceLoadOptions = {}): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const startTime = performance.now();
      const link = document.createElement("link");

      link.rel = options.preload ? "preload" : "stylesheet";
      link.href = url;

      if (options.preload) {
        link.as = "style";
        link.onload = () => {
          // Convert preload to stylesheet
          link.rel = "stylesheet";
          this.recordResource(url, "style", startTime);
          resolve();
        };
      } else {
        link.onload = () => {
          this.recordResource(url, "style", startTime);
          resolve();
        };
      }

      link.onerror = () => {
        // Silently handle missing CSS files in development
        if (process.env.NODE_ENV === "development") {
          console.warn(`CSS file not found (skipping): ${url}`);
          resolve(); // Don't reject, just resolve silently
        } else {
          reject(new Error(`Failed to load CSS: ${url}`));
        }
      };

      if (options.media) link.media = options.media;
      if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
      if (options.integrity) link.integrity = options.integrity;

      document.head.appendChild(link);
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // Load JavaScript with optimization
  async loadScript(
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const startTime = performance.now();
      const script = document.createElement("script");

      script.src = url;
      script.async = options.async ?? true;
      script.defer = options.defer ?? false;

      script.onload = () => {
        this.recordResource(url, "script", startTime);
        resolve();
      };

      script.onerror = () => {
        // Silently handle missing JS files in development
        if (process.env.NODE_ENV === "development") {
          console.warn(`JavaScript file not found (skipping): ${url}`);
          resolve(); // Don't reject, just resolve silently
        } else {
          reject(new Error(`Failed to load script: ${url}`));
        }
      };

      if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
      if (options.integrity) script.integrity = options.integrity;

      document.head.appendChild(script);
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // Preload fonts
  preloadFont(url: string, options: ResourceLoadOptions = {}): void {
    if (this.loadedResources.has(url)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";

    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;

    document.head.appendChild(link);
    this.recordResource(url, "font", performance.now());
  }

  // Intelligent resource preloading based on priority
  addToPreloadQueue(
    url: string,
    type: "script" | "style" | "font" | "image",
    options: ResourceLoadOptions = {},
  ): void {
    this.preloadQueue.push({ url, type, options });
    this.processPreloadQueue();
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isProcessingQueue || this.preloadQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.options.priority || "medium"] || 2) -
        (priorityOrder[a.options.priority || "medium"] || 2)
      );
    });

    // Process in batches to avoid overwhelming the browser
    const batchSize = 3;
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, batchSize);

      await Promise.allSettled(
        batch.map(async ({ url, type, options }) => {
          try {
            switch (type) {
              case "script":
                await this.loadScript(url, { ...options, preload: true });
                break;
              case "style":
                await this.loadCSS(url, { ...options, preload: true });
                break;
              case "font":
                this.preloadFont(url, options);
                break;
              case "image":
                await this.preloadImage(url);
                break;
            }
          } catch (error) {
            console.warn(`Failed to preload ${type}: ${url}`, error);
          }
        }),
      );

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.isProcessingQueue = false;
  }

  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const startTime = performance.now();

      img.onload = () => {
        this.recordResource(url, "image", startTime);
        resolve();
      };

      img.onerror = () => {
        // Silently handle missing images in development
        if (process.env.NODE_ENV === "development") {
          console.warn(`Image not found (skipping): ${url}`);
          resolve(); // Don't reject, just resolve silently
        } else {
          reject(new Error(`Failed to preload image: ${url}`));
        }
      };
      img.src = url;
    });
  }

  private recordResource(
    url: string,
    type: "script" | "style" | "font" | "image",
    startTime: number,
  ): void {
    const loadTime = performance.now() - startTime;
    const cached = loadTime < 50; // Assume cached if loaded very quickly

    this.loadedResources.set(url, {
      url,
      type,
      loadTime,
      cached,
    });

    this.loadingPromises.delete(url);
  }

  // Get performance statistics
  getPerformanceStats() {
    const resources = Array.from(this.loadedResources.values());
    const totalResources = resources.length;
    const cachedResources = resources.filter((r) => r.cached).length;
    const averageLoadTime =
      resources.reduce((sum, r) => sum + r.loadTime, 0) / totalResources || 0;

    const byType = resources.reduce(
      (acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalResources,
      cachedResources,
      cacheHitRate:
        totalResources > 0 ? (cachedResources / totalResources) * 100 : 0,
      averageLoadTime,
      resourcesByType: byType,
      loadedResources: resources,
    };
  }

  // Clear loaded resources (useful for testing or cleanup)
  clear(): void {
    this.loadedResources.clear();
    this.loadingPromises.clear();
    this.preloadQueue = [];
  }
}

// Global instance
export const resourceOptimizer = new StaticResourceOptimizer();

// React hook for loading resources
export function useResourceLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedResources = useRef(new Set<string>());

  const loadResource = async (
    url: string,
    type: "script" | "style" | "font" | "image",
    options?: ResourceLoadOptions,
  ) => {
    if (loadedResources.current.has(url)) return;

    setIsLoading(true);
    setError(null);

    try {
      switch (type) {
        case "script":
          await resourceOptimizer.loadScript(url, options);
          break;
        case "style":
          await resourceOptimizer.loadCSS(url, options);
          break;
        case "font":
          resourceOptimizer.preloadFont(url, options);
          break;
        case "image":
          await resourceOptimizer.preloadImage(url);
          break;
      }

      loadedResources.current.add(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resource");
    } finally {
      setIsLoading(false);
    }
  };

  const preloadResources = (
    resources: Array<{
      url: string;
      type: "script" | "style" | "font" | "image";
      options?: ResourceLoadOptions;
    }>,
  ) => {
    resources.forEach(({ url, type, options }) => {
      resourceOptimizer.addToPreloadQueue(url, type, options);
    });
  };

  return {
    loadResource,
    preloadResources,
    isLoading,
    error,
  };
}

// Hook for critical resource loading
export function useCriticalResources(
  resources: Array<{ url: string; type: "script" | "style" | "font" }>,
) {
  const [isReady, setIsReady] = useState(false);
  const { loadResource } = useResourceLoader();

  useEffect(() => {
    const loadCriticalResources = async () => {
      try {
        await Promise.all(
          resources.map(({ url, type }) =>
            loadResource(url, type, { priority: "high" }),
          ),
        );
        setIsReady(true);
      } catch (error) {
        logComponents.error("Failed to load critical resources:", error);
      }
    };

    loadCriticalResources();
  }, [resources, loadResource]);

  return isReady;
}

// Utility functions
export const resourceUtils = {
  // Check if resource is already loaded
  isResourceLoaded: (url: string): boolean => {
    return resourceOptimizer["loadedResources"].has(url);
  },

  // Get resource load time
  getResourceLoadTime: (url: string): number | null => {
    const resource = resourceOptimizer["loadedResources"].get(url);
    return resource?.loadTime || null;
  },

  // Preload critical resources for a page
  preloadPageResources: (
    pageResources: Record<
      string,
      Array<{ url: string; type: "script" | "style" | "font" | "image" }>
    >,
  ) => {
    Object.entries(pageResources).forEach(([priority, resources]) => {
      resources.forEach(({ url, type }) => {
        resourceOptimizer.addToPreloadQueue(url, type, {
          priority: priority as "high" | "medium" | "low",
        });
      });
    });
  },

  // Get performance report
  getPerformanceReport: () => resourceOptimizer.getPerformanceStats(),
};

export default StaticResourceOptimizer;
