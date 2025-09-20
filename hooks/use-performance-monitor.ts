/**
 * HOOK DE MONITORAMENTO DE PERFORMANCE SIMPLIFICADO
 */

"use client";

import { useEffect } from "react";
import { logComponents } from "../lib/utils/logger";

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 100) {
        console.warn(
          `${componentName} renderizou em ${renderTime.toFixed(2)}ms (lento)`,
        );
      } else {
        console.log(
          `${componentName} renderizou em ${renderTime.toFixed(2)}ms`,
        );
      }
    };
  }, [componentName]);
}
