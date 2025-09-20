"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../../lib/logger";
import { memoryOptimizer } from "../lib/memory-optimizer";

export function useCachedStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    try {
      setIsLoading(true);

      // Try to get from cache first
      const cached = memoryOptimizer.get(key);
      if (cached !== null) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // If not in cache, get from localStorage
      const stored = localStorage.getItem(key);
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
        // Cache it for future use
        memoryOptimizer.set(key, parsed, 5); // 5 minutes TTL
      } else {
        setData(defaultValue);
      }
    } catch (error) {
      logComponents.error("Error loading data for key ${key}:", error);
      setData(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  const saveData = useCallback(
    (newData: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(newData));
        memoryOptimizer.set(key, newData, 5);
        setData(newData);
      } catch (error) {
        logComponents.error("Error saving data for key ${key}:", error);
      }
    },
    [key],
  );

  const clearData = useCallback(() => {
    try {
      // DEPRECADO: localStorage será removido em favor do dataService
      console.warn(`DEPRECATED: use-cached-storage clearData(${key}) - Use dataService instead`);
      localStorage.removeItem(key);
      memoryOptimizer.remove(key);
      setData(defaultValue);
    } catch (error) {
      logComponents.error("Error clearing data for key ${key}:", error);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    setData: saveData,
    clearData,
    isLoading,
    reload: loadData,
  };
}
