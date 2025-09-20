/**
 * Ponto de exportação principal para todos os hooks
 * Fornece acesso centralizado a todos os hooks da aplicação
 */

// Hooks financeiros
export * from "./financial";

// Tipos principais
export type {
  UseAccountsReturn,
  AccountFilters,
  AccountStats,
  HookOptions,
  UseFinancialHookReturn,
  HookError,
  HookErrorType,
} from "./types/financial-hooks";

// Aliases para compatibilidade com imports existentes
export { useAccounts } from "./financial/use-accounts-consolidated";

// Deprecation warnings para imports antigos (será removido em versões futuras)
/**
 * @deprecated Use import { useAccounts } from "../hooks' instead
 * This alias will be removed in a future version
 */
export { useAccounts as useAccountsLegacy } from "./financial/use-accounts-consolidated";
