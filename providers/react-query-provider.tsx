/**
 * PROVIDER DO REACT QUERY OTIMIZADO PARA DADOS FINANCEIROS
 */

"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface ReactQueryProviderProps {
  children: ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados financeiros ficam frescos por 5 minutos
            staleTime: 5 * 60 * 1000, // 5 minutos
            // Cache mantido por 30 minutos
            gcTime: 30 * 60 * 1000, // 30 minutos
            // Retry mais agressivo para dados críticos
            retry: (failureCount, error: any) => {
              // Não retry em erros de autenticação
              if (error?.status === 401 || error?.status === 403) {
                return false;
              }
              // Máximo 3 tentativas para outros erros
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch quando a janela ganha foco (importante para dados financeiros)
            refetchOnWindowFocus: true,
            // Refetch quando reconecta à internet
            refetchOnReconnect: true,
            // Não refetch automaticamente quando monta
            refetchOnMount: true,
          },
          mutations: {
            // Retry para mutações críticas
            retry: (failureCount, error: any) => {
              // Não retry em erros de validação ou autenticação
              if (error?.status === 400 || error?.status === 401 || error?.status === 403 || error?.status === 422) {
                return false;
              }
              // Máximo 2 tentativas para outros erros
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools 
        initialIsOpen={false} 
        buttonPosition="bottom-left"
        position="left"
      />
    </QueryClientProvider>
  );
}
