"use client";

import React, { useState, useCallback, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
import { assetOptimizer } from "./asset-optimizer";
import { globalCache } from "./intelligent-cache";

interface ComponentPreloadConfig {
  component: string;
  route: string;
  priority: "critical" | "high" | "medium" | "low";
  dependencies?: string[];
  conditions?: {
    userType?: string[];
    timeOfDay?: "morning" | "afternoon" | "evening" | "night";
    deviceType?: "mobile" | "tablet" | "desktop";
    connectionType?: "slow" | "fast";
  };
  assets?: {
    scripts?: string[];
    styles?: string[];
    images?: string[];
    fonts?: string[];
  };
}

interface UserBehaviorData {
  visitedRoutes: string[];
  timeSpentOnRoutes: Record<string, number>;
  navigationPatterns: Array<{ from: string; to: string; count: number }>;
  deviceInfo: {
    type: "mobile" | "tablet" | "desktop";
    connection: "slow" | "fast";
  };
  preferences: {
    preferredFeatures: string[];
    timeOfDayUsage: Record<string, number>;
  };
}

class IntelligentPreloader {
  private preloadConfigs: ComponentPreloadConfig[] = [];
  private userBehavior: UserBehaviorData;
  private preloadedComponents = new Set<string>();
  private preloadQueue: Array<{
    config: ComponentPreloadConfig;
    score: number;
  }> = [];
  private isProcessing = false;
  private performanceThresholds = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
  };

  constructor() {
    this.userBehavior = this.loadUserBehavior();
    this.initializeDefaultConfigs();
    this.startBehaviorTracking();
  }

  // Initialize default preload configurations
  private initializeDefaultConfigs(): void {
    // Only configure preloading for existing assets in development
    const isDevelopment = process.env.NODE_ENV === "development";

    this.preloadConfigs = [
      {
        component: "FinancialDashboard",
        route: "/dashboard",
        priority: "critical",
        assets: isDevelopment
          ? {}
          : {
              // Only include assets that actually exist in production
              scripts: [],
              styles: [],
              images: [],
            },
      },
      {
        component: "TransactionList",
        route: "/transactions",
        priority: "high",
        dependencies: ["VirtualizedList"],
        conditions: {
          userType: ["active", "premium"],
        },
        assets: isDevelopment
          ? {}
          : {
              scripts: [],
              styles: [],
            },
      },
      {
        component: "BudgetPlanner",
        route: "/budget",
        priority: "high",
        conditions: {
          timeOfDay: "evening",
        },
        assets: isDevelopment
          ? {}
          : {
              scripts: [],
              styles: [],
            },
      },
      {
        component: "InvestmentPortfolio",
        route: "/investments",
        priority: "medium",
        conditions: {
          deviceType: "desktop",
          connectionType: "fast",
        },
        assets: isDevelopment
          ? {}
          : {
              scripts: [],
              styles: [],
            },
      },
      {
        component: "GoalsTracker",
        route: "/goals",
        priority: "medium",
        assets: isDevelopment
          ? {}
          : {
              styles: [],
              images: [],
            },
      },
      {
        component: "ReportsAnalytics",
        route: "/reports",
        priority: "low",
        conditions: {
          userType: ["premium"],
          deviceType: "desktop",
        },
        assets: isDevelopment
          ? {}
          : {
              scripts: [],
              styles: [],
            },
      },
    ];
  }

  // Start tracking user behavior
  private startBehaviorTracking(): void {
    if (typeof window === "undefined") return;

    // Track route changes
    this.trackRouteChanges();

    // Track time spent on pages
    this.trackTimeSpent();

    // Track device and connection info
    this.updateDeviceInfo();

    // Save behavior data periodically
    setInterval(() => {
      this.saveUserBehavior();
    }, 30000); // Save every 30 seconds
  }

  // Track route navigation patterns
  private trackRouteChanges(): void {
    let currentRoute = window.location.pathname;
    let routeStartTime = Date.now();

    const handleRouteChange = () => {
      const newRoute = window.location.pathname;
      const timeSpent = Date.now() - routeStartTime;

      // Update time spent
      this.userBehavior.timeSpentOnRoutes[currentRoute] =
        (this.userBehavior.timeSpentOnRoutes[currentRoute] || 0) + timeSpent;

      // Update navigation patterns
      const pattern = this.userBehavior.navigationPatterns.find(
        (p) => p.from === currentRoute && p.to === newRoute,
      );

      if (pattern) {
        pattern.count++;
      } else {
        this.userBehavior.navigationPatterns.push({
          from: currentRoute,
          to: newRoute,
          count: 1,
        });
      }

      // Add to visited routes
      if (!this.userBehavior.visitedRoutes.includes(newRoute)) {
        this.userBehavior.visitedRoutes.push(newRoute);
      }

      currentRoute = newRoute;
      routeStartTime = Date.now();

      // Trigger intelligent preloading for new route
      this.analyzeAndPreload(newRoute);
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleRouteChange);

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };
  }

  // Track time spent on current page
  private trackTimeSpent(): void {
    let startTime = Date.now();

    const updateTimeSpent = () => {
      const currentRoute = window.location.pathname;
      const timeSpent = Date.now() - startTime;

      this.userBehavior.timeSpentOnRoutes[currentRoute] =
        (this.userBehavior.timeSpentOnRoutes[currentRoute] || 0) + timeSpent;

      startTime = Date.now();
    };

    // Update on visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        updateTimeSpent();
      } else {
        startTime = Date.now();
      }
    });

    // Update on beforeunload
    window.addEventListener("beforeunload", updateTimeSpent);
  }

  // Update device and connection information
  private updateDeviceInfo(): void {
    // Detect device type
    const width = window.innerWidth;
    let deviceType: "mobile" | "tablet" | "desktop";

    if (width < 768) {
      deviceType = "mobile";
    } else if (width < 1024) {
      deviceType = "tablet";
    } else {
      deviceType = "desktop";
    }

    // Detect connection speed
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    let connectionType: "slow" | "fast" = "fast";

    if (connection) {
      const effectiveType = connection.effectiveType;
      connectionType = ["slow-2g", "2g", "3g"].includes(effectiveType)
        ? "slow"
        : "fast";
    }

    this.userBehavior.deviceInfo = {
      type: deviceType,
      connection: connectionType,
    };
  }

  // Analyze current context and trigger intelligent preloading
  analyzeAndPreload(currentRoute: string): void {
    if (this.isProcessing) return;

    this.isProcessing = true;

    // Calculate preload scores for each component
    this.preloadQueue = this.preloadConfigs
      .filter((config) => !this.preloadedComponents.has(config.component))
      .map((config) => ({
        config,
        score: this.calculatePreloadScore(config, currentRoute),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Process preload queue
    this.processPreloadQueue();

    this.isProcessing = false;
  }

  // Calculate preload score based on various factors
  private calculatePreloadScore(
    config: ComponentPreloadConfig,
    currentRoute: string,
  ): number {
    let score = 0;

    // Base priority score
    const priorityScores = { critical: 100, high: 75, medium: 50, low: 25 };
    score += priorityScores[config.priority];

    // Navigation pattern score
    const navigationScore = this.getNavigationScore(currentRoute, config.route);
    score += navigationScore * 30;

    // Time spent score (if user spends more time on similar pages)
    const timeScore = this.getTimeSpentScore(config.route);
    score += timeScore * 20;

    // Condition matching score
    const conditionScore = this.getConditionScore(config.conditions);
    score += conditionScore * 25;

    // Performance impact score (reduce score if performance is poor)
    const performanceScore = this.getPerformanceScore();
    score *= performanceScore;

    return Math.max(0, score);
  }

  // Get navigation pattern score
  private getNavigationScore(
    currentRoute: string,
    targetRoute: string,
  ): number {
    const pattern = this.userBehavior.navigationPatterns.find(
      (p) => p.from === currentRoute && p.to === targetRoute,
    );

    if (!pattern) return 0;

    const totalNavigations = this.userBehavior.navigationPatterns
      .filter((p) => p.from === currentRoute)
      .reduce((sum, p) => sum + p.count, 0);

    return totalNavigations > 0 ? pattern.count / totalNavigations : 0;
  }

  // Get time spent score
  private getTimeSpentScore(route: string): number {
    const timeSpent = this.userBehavior.timeSpentOnRoutes[route] || 0;
    const totalTime = Object.values(this.userBehavior.timeSpentOnRoutes).reduce(
      (sum, time) => sum + time,
      0,
    );

    return totalTime > 0 ? timeSpent / totalTime : 0;
  }

  // Get condition matching score
  private getConditionScore(
    conditions?: ComponentPreloadConfig["conditions"],
  ): number {
    if (!conditions) return 1;

    let score = 1;

    // Device type matching
    if (
      conditions.deviceType &&
      conditions.deviceType !== this.userBehavior.deviceInfo.type
    ) {
      score *= 0.5;
    }

    // Connection type matching
    if (
      conditions.connectionType &&
      conditions.connectionType !== this.userBehavior.deviceInfo.connection
    ) {
      score *= 0.3;
    }

    // Time of day matching
    if (conditions.timeOfDay) {
      const currentHour = new Date().getHours();
      const timeOfDay = this.getTimeOfDay(currentHour);
      if (conditions.timeOfDay !== timeOfDay) {
        score *= 0.7;
      }
    }

    return score;
  }

  // Get performance score (reduce preloading if performance is poor)
  private getPerformanceScore(): number {
    const metrics = assetOptimizer.getPerformanceMetrics();
    const { lcp, fid, cls } = metrics.coreWebVitals;

    let score = 1;

    if (lcp > this.performanceThresholds.lcp) score *= 0.7;
    if (fid > this.performanceThresholds.fid) score *= 0.8;
    if (cls > this.performanceThresholds.cls) score *= 0.9;

    return score;
  }

  // Get time of day
  private getTimeOfDay(
    hour: number,
  ): "morning" | "afternoon" | "evening" | "night" {
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  }

  // Process the preload queue
  private async processPreloadQueue(): Promise<void> {
    const maxConcurrent =
      this.userBehavior.deviceInfo.connection === "slow" ? 2 : 4;
    const batch = this.preloadQueue.splice(0, maxConcurrent);

    await Promise.allSettled(
      batch.map(async ({ config }) => {
        try {
          await this.preloadComponent(config);
          this.preloadedComponents.add(config.component);
        } catch (error) {
          console.warn(
            `Failed to preload component ${config.component}:`,
            error,
          );
        }
      }),
    );

    // Continue processing if there are more items
    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processPreloadQueue(), 100);
    }
  }

  // Preload a specific component and its assets
  private async preloadComponent(
    config: ComponentPreloadConfig,
  ): Promise<void> {
    const { assets, dependencies } = config;

    // Preload dependencies first
    if (dependencies) {
      for (const dep of dependencies) {
        const depConfig = this.preloadConfigs.find((c) => c.component === dep);
        if (depConfig && !this.preloadedComponents.has(dep)) {
          await this.preloadComponent(depConfig);
          this.preloadedComponents.add(dep);
        }
      }
    }

    // Preload assets
    if (assets) {
      assetOptimizer.preloadPageAssets(assets);
    }

    // Cache component data if applicable
    await this.preloadComponentData(config);
  }

  // Preload component-specific data
  private async preloadComponentData(
    config: ComponentPreloadConfig,
  ): Promise<void> {
    const cacheKey = `component_data_${config.component}`;

    // Check if data is already cached
    if (globalCache.get(cacheKey)) {
      return;
    }

    // Preload data based on component type
    try {
      let data: any = null;

      switch (config.component) {
        case "TransactionList":
          // Preload recent transactions
          data = await this.fetchRecentTransactions();
          break;
        case "FinancialDashboard":
          // Preload dashboard summary
          data = await this.fetchDashboardSummary();
          break;
        case "BudgetPlanner":
          // Preload budget data
          data = await this.fetchBudgetData();
          break;
        // Add more cases as needed
      }

      if (data) {
        globalCache.set(cacheKey, data, { ttl: 300000 }); // Cache for 5 minutes
      }
    } catch (error) {
      console.warn(`Failed to preload data for ${config.component}:`, error);
    }
  }

  // Mock data fetching methods (replace with actual API calls)
  private async fetchRecentTransactions(): Promise<any> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve({ transactions: [] }), 100);
    });
  }

  private async fetchDashboardSummary(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ summary: {} }), 100);
    });
  }

  private async fetchBudgetData(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ budgets: [] }), 100);
    });
  }

  // Load user behavior from storage
  private loadUserBehavior(): UserBehaviorData {
    if (typeof window === "undefined") {
      return this.getDefaultUserBehavior();
    }

    try {
      const stored = localStorage.getItem("user_behavior_data");
      return stored ? JSON.parse(stored) : this.getDefaultUserBehavior();
    } catch {
      return this.getDefaultUserBehavior();
    }
  }

  // Save user behavior to storage
  private saveUserBehavior(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        "user_behavior_data",
        JSON.stringify(this.userBehavior),
      );
    } catch (error) {
      console.warn("Failed to save user behavior data:", error);
    }
  }

  // Get default user behavior data
  private getDefaultUserBehavior(): UserBehaviorData {
    return {
      visitedRoutes: [],
      timeSpentOnRoutes: {},
      navigationPatterns: [],
      deviceInfo: {
        type: "desktop",
        connection: "fast",
      },
      preferences: {
        preferredFeatures: [],
        timeOfDayUsage: {},
      },
    };
  }

  // Public methods
  addPreloadConfig(config: ComponentPreloadConfig): void {
    this.preloadConfigs.push(config);
  }

  getPreloadStats() {
    return {
      totalConfigs: this.preloadConfigs.length,
      preloadedComponents: Array.from(this.preloadedComponents),
      queueLength: this.preloadQueue.length,
      userBehavior: this.userBehavior,
    };
  }

  // Force preload specific components
  async forcePreload(componentNames: string[]): Promise<void> {
    const configs = this.preloadConfigs.filter(
      (c) =>
        componentNames.includes(c.component) &&
        !this.preloadedComponents.has(c.component),
    );

    await Promise.allSettled(
      configs.map(async (config) => {
        try {
          await this.preloadComponent(config);
          this.preloadedComponents.add(config.component);
        } catch (error) {
          console.warn(`Failed to force preload ${config.component}:`, error);
        }
      }),
    );
  }
}

// Global intelligent preloader instance
export const intelligentPreloader = new IntelligentPreloader();

// React hook for component preloading
export function useIntelligentPreloader() {
  const [isPreloading, setIsPreloading] = useState(false);

  const preloadForRoute = useCallback(async (route: string) => {
    setIsPreloading(true);
    try {
      intelligentPreloader.analyzeAndPreload(route);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  const forcePreload = useCallback(async (components: string[]) => {
    setIsPreloading(true);
    try {
      await intelligentPreloader.forcePreload(components);
    } finally {
      setIsPreloading(false);
    }
  }, []);

  return {
    preloadForRoute,
    forcePreload,
    isPreloading,
    stats: intelligentPreloader.getPreloadStats(),
  };
}

export default IntelligentPreloader;
