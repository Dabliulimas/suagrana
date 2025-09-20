/**
 * Hooks financeiros consolidados
 * Ponto de exportação principal para todos os hooks relacionados a dados financeiros
 */

// Hook principal consolidado
export { useAccounts } from "./use-accounts-consolidated";

// Tipos e interfaces
export type {
  UseAccountsReturn,
  AccountFilters,
  AccountStats,
  HookOptions,
  UseFinancialHookReturn,
  HookError,
  HookErrorType,
} from "../hooks/types/financial-hooks";

// Re-exportações para compatibilidade com implementações existentes
export { useAccounts as useAccountsConsolidated } from "./use-accounts-consolidated";
