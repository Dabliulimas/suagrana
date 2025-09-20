import { useEffect } from "react";
import { logComponents } from "../lib/utils/logger";

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 16) {
          // More than one frame (60fps)
          console.warn(
            `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`,
          );
        }
      };
    }
  });
}
