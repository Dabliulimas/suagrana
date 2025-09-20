import { useMemo, useCallback, useRef, useEffect, useState } from "react";

// Hook para memoização inteligente de dados financeiros
export function useFinancialMemo<T>(
  data: T[],
  computeFn: (data: T[]) => any,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    if (!data || data.length === 0) return null;
    return computeFn(data);
  }, [data, ...deps]);
}

// Hook para debounce de pesquisas/filtros
export function useDebounce<T>(value: T, delay: number): T {
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

// Hook para otimizar callbacks frequentes
export function useOptimizedCallback<T extends any[]>(
  callback: (...args: T) => void,
  deps: React.DependencyList
) {
  const callbackRef = useRef(callback);
  const argsRef = useRef<T>();

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: T) => {
    const isSameArgs = argsRef.current && 
      argsRef.current.length === args.length &&
      argsRef.current.every((arg, index) => arg === args[index]);

    if (!isSameArgs) {
      argsRef.current = args;
      callbackRef.current(...args);
    }
  }, deps);
}

// Hook para cache de dados com TTL
interface CacheOptions {
  ttl?: number; // Time to live em ms
  maxSize?: number;
}

export function useCache<K, V>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options; // 5 min default
  const cacheRef = useRef(new Map<K, { value: V; timestamp: number }>());

  const get = useCallback((key: K): V | null => {
    const cached = cacheRef.current.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > ttl) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.value;
  }, [ttl]);

  const set = useCallback((key: K, value: V) => {
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    cacheRef.current.set(key, {
      value,
      timestamp: Date.now()
    });
  }, [maxSize]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { get, set, clear };
}

// Hook para virtual scrolling em listas grandes
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
}
