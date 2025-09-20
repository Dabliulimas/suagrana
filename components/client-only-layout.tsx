"use client";

import { useState, useEffect, ReactNode } from "react";

interface ClientOnlyLayoutProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnlyLayout({ children, fallback }: ClientOnlyLayoutProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback || null;
  }

  return <>{children}</>;
}