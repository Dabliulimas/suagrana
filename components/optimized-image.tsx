"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { logComponents } from "../lib/utils/logger";
import { cn } from "../lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

interface ImageState {
  isLoaded: boolean;
  isError: boolean;
  isInView: boolean;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = "blur",
  blurDataURL,
  sizes,
  quality = 75,
  onLoad,
  onError,
  lazy = true,
}: OptimizedImageProps) {
  const [state, setState] = useState<ImageState>({
    isLoaded: false,
    isError: false,
    isInView: false,
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) {
      setState((prev) => ({ ...prev, isInView: true }));
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState((prev) => ({ ...prev, isInView: true }));
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, priority]);

  // Generate optimized src with quality and format
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.startsWith("data:") || originalSrc.startsWith("blob:")) {
      return originalSrc;
    }

    // For external URLs, return as-is
    if (originalSrc.startsWith("http")) {
      return originalSrc;
    }

    // For local images, we could add query parameters for optimization
    const url = new URL(originalSrc, window.location.origin);
    url.searchParams.set("q", quality.toString());

    if (width) url.searchParams.set("w", width.toString());
    if (height) url.searchParams.set("h", height.toString());

    return url.toString();
  };

  const handleLoad = () => {
    setState((prev) => ({ ...prev, isLoaded: true }));
    onLoad?.();
  };

  const handleError = () => {
    setState((prev) => ({ ...prev, isError: true }));
    onError?.();
  };

  const shouldShowPlaceholder =
    !state.isLoaded && !state.isError && placeholder === "blur";
  const shouldLoad = state.isInView || priority;

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {shouldShowPlaceholder && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(10px)",
            transform: "scale(1.1)",
          }}
        />
      )}

      {/* Error state */}
      {state.isError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm text-center">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
            Falha ao carregar
          </div>
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && !state.isError && (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            state.isLoaded ? "opacity-100" : "opacity-0",
            "w-full h-full object-cover",
          )}
        />
      )}
    </div>
  );
});

export default OptimizedImage;

// Hook for preloading images
export function useImagePreloader() {
  const preloadedImages = useRef(new Set<string>());

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const preloadImages = async (srcs: string[]) => {
    try {
      await Promise.all(srcs.map(preloadImage));
    } catch (error) {
      console.warn("Failed to preload some images:", error);
    }
  };

  return { preloadImage, preloadImages };
}

// Component for critical images that should load immediately
export const CriticalImage = memo(function CriticalImage(
  props: OptimizedImageProps,
) {
  return <OptimizedImage {...props} priority={true} lazy={false} />;
});

// Component for background images with lazy loading
export const BackgroundImage = memo(function BackgroundImage({
  src,
  alt,
  className,
  children,
  ...props
}: OptimizedImageProps & { children?: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isInView, src]);

  return (
    <div
      ref={ref}
      className={cn("relative transition-all duration-500", className)}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      {...props}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
      {children}
    </div>
  );
});
