/**
 * PROVIDER DO REACT QUERY UNIFICADO PARA DADOS FINANCEIROS
 * Sistema robusto de sincronização de dados com invalidação inteligente
 */

"use client";

import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { unifiedQueryClient } from "../lib/react-query/unified-query-client";

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={unifiedQueryClient}>
      {children}
      <ReactQueryDevtools 
        initialIsOpen={false} 
        buttonPosition="bottom-left"
        position="left"
      />
    </QueryClientProvider>
  );
}
