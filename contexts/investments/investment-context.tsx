/**
 * CONTEXTO DE INVESTIMENTOS SIMPLIFICADO
 */

"use client";

import { createContext, useContext, ReactNode } from "react";

interface InvestmentContextType {
  // Placeholder para funcionalidades de investimento
}

const InvestmentContext = createContext<InvestmentContextType>({});

export function InvestmentProvider({ children }: { children: ReactNode }) {
  return (
    <InvestmentContext.Provider value={{}}>
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestment() {
  return useContext(InvestmentContext);
}
