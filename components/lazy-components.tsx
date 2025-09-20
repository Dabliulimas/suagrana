"use client";

import { useState, useEffect } from "react";
import { FinancialCharts } from "./financial-charts";

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Componente de gráficos financeiros com carregamento condicional
export const FinancialChartsWithSuspense = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingFallback />;
  }

  return <FinancialCharts />;
};
