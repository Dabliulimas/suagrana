// Hooks unificados para gerenciamento de dados com invalidação robusta
// Este sistema resolve problemas de sincronização de cache e dados

// Hooks de transações
export {
  useUnifiedTransactions,
  useUnifiedTransaction,
  useUnifiedRecentTransactions,
  useUnifiedTransactionStats,
  useUnifiedCreateTransaction,
  useUnifiedUpdateTransaction,
  useUnifiedDeleteTransaction,
  useUnifiedTransactionsByCategory,
  type Transaction,
  type CreateTransactionData,
  type TransactionFilters,
} from "./use-unified-transactions";

// Hooks de contas
export {
  useUnifiedAccounts,
  useUnifiedAccount,
  useUnifiedAccountsSummary,
  useUnifiedActiveAccounts,
  useUnifiedTotalBalance,
  useUnifiedCreateAccount,
  useUnifiedUpdateAccount,
  useUnifiedDeleteAccount,
  useUnifiedTransferBetweenAccounts,
  type Account,
  type CreateAccountData,
  type AccountFilters,
} from "./use-unified-accounts";

// Hooks de relatórios e dashboard
export {
  useUnifiedDashboard,
  useUnifiedMonthlyReport,
  useUnifiedYearlyReport,
  useUnifiedCategoryReport,
  useUnifiedQuickStats,
  useUnifiedRefreshReports,
  type ReportFilters,
  type DashboardData,
} from "./use-unified-reports";

// Sistema de query client unificado
export {
  unifiedQueryClient,
  unifiedQueryKeys,
  unifiedInvalidation,
} from "../../lib/react-query/unified-query-client";

// Hook de sincronização global
export {
  useGlobalSync,
} from "./use-global-sync";

// Guia de migração:
// 1. Substitua os hooks antigos pelos hooks unificados
// 2. Use o unifiedQueryClient em vez do queryClient padrão
// 3. Os hooks unificados incluem invalidação automática robusta
// 4. Todos os dados são sincronizados automaticamente entre componentes

// Exemplo de uso:
/*
// Antes:
import { useTransactions, useCreateTransaction } from "../hooks/use-transactions";

// Depois:
import { useUnifiedTransactions, useUnifiedCreateTransaction } from "../hooks/unified";

// O comportamento é o mesmo, mas com sincronização robusta
const { data: transactions } = useUnifiedTransactions();
const createTransaction = useUnifiedCreateTransaction();
*/