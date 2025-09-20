"use client";

import { resourceOptimizer, resourceUtils } from "./static-resource-optimizer";

import { logComponents } from "../logger";
interface AssetConfig {
  images: {
    quality: number;
    formats: string[];
    sizes: number[];
    lazyLoading: boolean;
    placeholder: "blur" | "empty";
  };
  fonts: {
    preload: string[];
    display: "swap" | "fallback" | "optional";
  };
  scripts: {
    defer: boolean;
    async: boolean;
    preload: string[];
  };
  styles: {
    critical: string[];
    preload: string[];
    media: Record<string, string>;
  };
}

const defaultConfig: AssetConfig = {
  images: {
    quality: 75,
    formats: ["webp", "avif", "jpg"],
    sizes: [320, 640, 768, 1024, 1280, 1920],
    lazyLoading: true,
    placeholder: "blur",
  },
  fonts: {
    preload: [], // Only preload fonts that actually exist
    display: "swap",
  },
  scripts: {
    defer: true,
    async: false,
    preload: [],
  },
  styles: {
    critical: [], // Only include critical CSS that exists
    preload: [], // Only preload styles that exist
    media: {},
  },
};

class AssetOptimizer {
  private config: AssetConfig;
  private criticalResourcesLoaded = false;
  private performanceObserver?: PerformanceObserver;
  private metrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
  };

  constructor(config: Partial<AssetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializePerformanceMonitoring();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if (typeof window === "undefined") return;

    // Monitor Core Web Vitals
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case "largest-contentful-paint":
            this.metrics.lcp = entry.startTime;
            break;
          case "first-input":
            this.metrics.fid = (entry as any).processingStart - entry.startTime;
            break;
          case "layout-shift":
            if (!(entry as any).hadRecentInput) {
              this.metrics.cls += (entry as any).value;
            }
            break;
          case "paint":
            if (entry.name === "first-contentful-paint") {
              this.metrics.fcp = entry.startTime;
            }
            break;
          case "navigation":
            this.metrics.ttfb = (entry as any).responseStart;
            break;
        }
      }
    });

    try {
      this.performanceObserver.observe({
        entryTypes: [
          "largest-contentful-paint",
          "first-input",
          "layout-shift",
          "paint",
          "navigation",
        ],
      });
    } catch (error) {
      console.warn("Performance monitoring not supported:", error);
    }
  }

  // Load critical resources first
  async loadCriticalResources(): Promise<void> {
    if (this.criticalResourcesLoaded) return;

    const criticalPromises: Promise<void>[] = [];

    // Load critical CSS
    this.config.styles.critical.forEach((url) => {
      criticalPromises.push(
        resourceOptimizer.loadCSS(url, { priority: "high" }),
      );
    });

    // Preload critical fonts
    this.config.fonts.preload.forEach((url) => {
      resourceOptimizer.preloadFont(url, { priority: "high" });
    });

    // Load critical scripts
    this.config.scripts.preload.forEach((url) => {
      criticalPromises.push(
        resourceOptimizer.loadScript(url, {
          priority: "high",
          async: this.config.scripts.async,
          defer: this.config.scripts.defer,
        }),
      );
    });

    try {
      await Promise.all(criticalPromises);
      this.criticalResourcesLoaded = true;
    } catch (error) {
      logComponents.error("Failed to load critical resources:", error);
    }
  }

  // Preload resources for a specific page
  preloadPageAssets(pageAssets: {
    images?: string[];
    scripts?: string[];
    styles?: string[];
    fonts?: string[];
  }): void {
    const { images = [], scripts = [], styles = [], fonts = [] } = pageAssets;

    // Only preload images if they exist
    if (images.length > 0) {
      images.forEach((url) => {
        resourceOptimizer.addToPreloadQueue(url, "image", {
          priority: "medium",
        });
      });
    }

    // Only preload scripts if they exist
    if (scripts.length > 0) {
      scripts.forEach((url) => {
        resourceOptimizer.addToPreloadQueue(url, "script", {
          priority: "medium",
          async: this.config.scripts.async,
          defer: this.config.scripts.defer,
        });
      });
    }

    // Only preload styles if they exist
    if (styles.length > 0) {
      styles.forEach((url) => {
        const media = this.config.styles.media[url];
        resourceOptimizer.addToPreloadQueue(url, "style", {
          priority: "medium",
          media,
        });
      });
    }

    // Only preload fonts if they exist
    if (fonts.length > 0) {
      fonts.forEach((url) => {
        resourceOptimizer.addToPreloadQueue(url, "font", {
          priority: "medium",
        });
      });
    }
  }

  // Generate responsive image srcset
  generateImageSrcSet(basePath: string, extension: string = "jpg"): string {
    return this.config.images.sizes
      .map((size) => `${basePath}-${size}w.${extension} ${size}w`)
      .join(", ");
  }

  // Generate optimized image URL
  getOptimizedImageUrl(
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    } = {},
  ): string {
    if (
      src.startsWith("data:") ||
      src.startsWith("blob:") ||
      src.startsWith("http")
    ) {
      return src;
    }

    const {
      width,
      height,
      quality = this.config.images.quality,
      format,
    } = options;

    const url = new URL(src, window.location.origin);

    if (width) url.searchParams.set("w", width.toString());
    if (height) url.searchParams.set("h", height.toString());
    if (quality !== this.config.images.quality) {
      url.searchParams.set("q", quality.toString());
    }
    if (format) url.searchParams.set("f", format);

    return url.toString();
  }

  // Preload images based on viewport and user behavior
  intelligentImagePreload(
    images: Array<{ src: string; priority: "high" | "medium" | "low" }>,
  ): void {
    // Sort by priority
    const sortedImages = images.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Preload high priority images immediately
    const highPriorityImages = sortedImages.filter(
      (img) => img.priority === "high",
    );
    highPriorityImages.forEach(({ src }) => {
      resourceOptimizer.addToPreloadQueue(src, "image", { priority: "high" });
    });

    // Preload medium priority images after a delay
    setTimeout(() => {
      const mediumPriorityImages = sortedImages.filter(
        (img) => img.priority === "medium",
      );
      mediumPriorityImages.forEach(({ src }) => {
        resourceOptimizer.addToPreloadQueue(src, "image", {
          priority: "medium",
        });
      });
    }, 1000);

    // Preload low priority images when idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const lowPriorityImages = sortedImages.filter(
          (img) => img.priority === "low",
        );
        lowPriorityImages.forEach(({ src }) => {
          resourceOptimizer.addToPreloadQueue(src, "image", {
            priority: "low",
          });
        });
      });
    }
  }

  // Get performance metrics
  getPerformanceMetrics() {
    const resourceStats = resourceUtils.getPerformanceReport();

    return {
      coreWebVitals: this.metrics,
      resources: resourceStats,
      recommendations: this.generateRecommendations(),
    };
  }

  // Handle resource loading errors gracefully
  private handleResourceError(src: string, type: string, error: Error): void {
    if (process.env.NODE_ENV === "development") {
      console.warn(`${type} not found (skipping): ${src}`);
    } else {
      logComponents.error("Failed to load ${type}: ${src}", error);
    }
  }

  // Generate performance recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = resourceUtils.getPerformanceReport();

    if (this.metrics.lcp > 2500) {
      recommendations.push(
        "LCP is slow. Consider optimizing images and critical resources.",
      );
    }

    if (this.metrics.fid > 100) {
      recommendations.push(
        "FID is high. Consider reducing JavaScript execution time.",
      );
    }

    if (this.metrics.cls > 0.1) {
      recommendations.push(
        "CLS is high. Ensure proper sizing for images and dynamic content.",
      );
    }

    if (stats.cacheHitRate < 70) {
      recommendations.push(
        "Low cache hit rate. Consider implementing better caching strategies.",
      );
    }

    if (stats.averageLoadTime > 500) {
      recommendations.push(
        "Average resource load time is high. Consider optimizing asset delivery.",
      );
    }

    return recommendations;
  }

  // Clean up resources
  cleanup(): void {
    this.performanceObserver?.disconnect();
    resourceOptimizer.clear();
  }

  // Get performance report
  getPerformanceReport(): {
    optimizedImages: number;
    loadedScripts: number;
    preloadedFonts: number;
    estimatedSavings: number;
    cacheHitRate: number;
    averageLoadTime: number;
    totalAssets: number;
  } {
    const totalAssets = 100; // Mock value for demonstration
    const optimizedImages = 50;
    const loadedScripts = 25;
    const preloadedFonts = 10;

    return {
      optimizedImages,
      loadedScripts,
      preloadedFonts,
      estimatedSavings: 1024 * 500, // 500KB savings
      cacheHitRate: 75,
      averageLoadTime: 300,
      totalAssets,
    };
  }
}

// Global asset optimizer instance
export const assetOptimizer = new AssetOptimizer();

// Utility functions for common asset optimization tasks
export const assetUtils = {
  // Preload critical assets for the application
  preloadCriticalAssets: async () => {
    await assetOptimizer.loadCriticalResources();
  },

  // Optimize image for display
  optimizeImage: (
    src: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    },
  ) => {
    return assetOptimizer.getOptimizedImageUrl(src, options);
  },

  // Generate responsive image attributes
  getResponsiveImageProps: (src: string, alt: string, sizes?: string) => {
    const basePath = src.replace(/\.[^/.]+$/, "");
    const extension = src.split(".").pop() || "jpg";

    return {
      src: assetOptimizer.getOptimizedImageUrl(src),
      srcSet: assetOptimizer.generateImageSrcSet(basePath, extension),
      sizes:
        sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
      alt,
      loading: "lazy" as const,
      decoding: "async" as const,
    };
  },

  // Preload assets for a specific route
  preloadRouteAssets: (
    route: string,
    assets: {
      images?: string[];
      scripts?: string[];
      styles?: string[];
      fonts?: string[];
    },
  ) => {
    // In development, skip asset preloading to avoid 404 errors
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Skipping asset preloading in development for route: ${route}`,
      );
      return;
    }

    console.log(`Preloading assets for route: ${route}`);
    assetOptimizer.preloadPageAssets(assets);
  },

  // Get performance report
  getPerformanceReport: () => {
    return assetOptimizer.getPerformanceMetrics();
  },
};

export default AssetOptimizer;
