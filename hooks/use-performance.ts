"use client";

import { useState } from "react";
import { logComponents } from "../lib/utils/logger";

import type React from "react";

import { useCallback, useMemo, useRef } from "react";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay],
  );
}

export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  return useMemo(factory, deps);
}

// DEPRECATED: Use dataService directly instead of localStorage
// This hook is kept for backward compatibility but should be migrated
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  console.warn(`DEPRECATED: useLocalStorage(${key}) - Use dataService.getUserSettings() instead`);
  
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(
    (value: T) => {
      console.warn(`DEPRECATED: Setting localStorage key "${key}" - Use dataService.saveUserSettings() instead`);
      setStoredValue(value);
    },
    [key],
  );

  return [storedValue, setValue];
}
