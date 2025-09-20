"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";

interface ClientOnlyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnlyWrapper({
  children,
  fallback,
}: ClientOnlyWrapperProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      fallback || (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Carregando...</span>
            </div>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
}
