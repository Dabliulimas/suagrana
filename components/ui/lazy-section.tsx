"use client";

import React, { useState, useEffect, useRef, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: "high" | "medium" | "low";
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function LazySection({
  children,
  fallback = null,
  priority = "medium",
  delay = 0,
  threshold = 0.1,
  rootMargin = "50px",
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Immediate render for high priority
    if (priority === "high") {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [priority, threshold, rootMargin]);

  useEffect(() => {
    if (isVisible) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShouldRender(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    }
  }, [isVisible, delay]);

  // For high priority, render immediately
  if (priority === "high") {
    return <div ref={elementRef}>{children}</div>;
  }

  return <div ref={elementRef}>{shouldRender ? children : fallback}</div>;
}

export default LazySection;
