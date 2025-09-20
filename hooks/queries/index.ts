"use client";

// Hooks de dados principais
export * from "./use-transactions";
// export * from './use-accounts' // Removido - usando implementação consolidada
export * from "./use-investments";
export * from "./use-goals";
export * from "./use-trips";
export * from "./use-financial-calculations";

// Re-exportar tipos do React Query para conveniência
export type {
  UseQueryResult,
  UseMutationResult,
  QueryKey,
  MutationKey,
} from "@tanstack/react-query";

// Re-exportar hooks principais do React Query
export {
  useQuery,
  useMutation,
  useQueryClient,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";
