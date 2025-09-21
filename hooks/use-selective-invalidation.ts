import { useQueryClient } from '@tanstack/react-query';

/**
 * Sistema de invalidação seletiva por categoria de dados
 * Permite invalidar apenas queries específicas baseadas no tipo de operação
 */

export type DataCategory = 
  | 'transactions' 
  | 'accounts' 
  | 'goals' 
  | 'investments' 
  | 'reports' 
  | 'categories' 
  | 'budgets'
  | 'analytics';

export type InvalidationScope = 
  | 'specific' // Invalida apenas a query específica
  | 'related'  // Invalida queries relacionadas
  | 'cascade'  // Invalida em cascata (afeta outras categorias)
  | 'minimal'; // Invalidação mínima necessária

interface InvalidationConfig {
  category: DataCategory;
  scope: InvalidationScope;
  entityId?: string;
  relatedCategories?: DataCategory[];
  customQueries?: string[];
}

export function useSelectiveInvalidation() {
  const queryClient = useQueryClient();

  // Mapeamento de queries por categoria
  const queryMappings: Record<DataCategory, string[]> = {
    transactions: [
      'transactions',
      'recent-transactions',
      'transactions-summary',
      'transactions-by-category',
      'monthly-transactions',
      'transaction-trends',
    ],
    accounts: [
      'accounts',
      'accounts-summary',
      'account-balance',
      'total-balance',
      'account-transactions',
    ],
    goals: [
      'goals',
      'active-goals',
      'goals-progress',
      'goal-detail',
      'goals-summary',
    ],
    investments: [
      'investments',
      'investment-portfolio',
      'investment-performance',
      'dividends',
      'investment-summary',
    ],
    reports: [
      'financial-reports',
      'monthly-reports',
      'yearly-reports',
      'category-reports',
      'trend-analysis',
    ],
    categories: [
      'categories',
      'category-spending',
      'category-budgets',
      'category-trends',
    ],
    budgets: [
      'budgets',
      'budget-status',
      'budget-alerts',
      'monthly-budget',
    ],
    analytics: [
      'analytics',
      'spending-patterns',
      'income-analysis',
      'savings-rate',
      'financial-health',
    ],
  };

  // Mapeamento de dependências entre categorias
  const categoryDependencies: Record<DataCategory, DataCategory[]> = {
    transactions: ['accounts', 'categories', 'budgets', 'analytics'],
    accounts: ['analytics'],
    goals: ['analytics'],
    investments: ['analytics'],
    reports: [],
    categories: ['budgets', 'analytics'],
    budgets: ['analytics'],
    analytics: [],
  };

  const invalidateByCategory = (config: InvalidationConfig) => {
    const { category, scope, entityId, relatedCategories, customQueries } = config;
    
    // Queries da categoria principal
    const primaryQueries = queryMappings[category] || [];
    
    switch (scope) {
      case 'specific':
        // Invalida apenas queries específicas
        if (entityId) {
          primaryQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ 
              queryKey: [queryKey, entityId] 
            });
          });
        } else {
          primaryQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ 
              queryKey: [queryKey] 
            });
          });
        }
        break;

      case 'related':
        // Invalida queries da categoria e relacionadas
        primaryQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
        
        if (relatedCategories) {
          relatedCategories.forEach(relatedCategory => {
            const relatedQueries = queryMappings[relatedCategory] || [];
            relatedQueries.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            });
          });
        }
        break;

      case 'cascade':
        // Invalida em cascata baseado nas dependências
        primaryQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
        
        const dependencies = categoryDependencies[category] || [];
        dependencies.forEach(depCategory => {
          const depQueries = queryMappings[depCategory] || [];
          depQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          });
        });
        break;

      case 'minimal':
        // Invalidação mínima - apenas queries essenciais
        const essentialQueries = primaryQueries.slice(0, 2); // Primeiras 2 queries
        essentialQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
        break;
    }

    // Invalidar queries customizadas se especificadas
    if (customQueries) {
      customQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    }
  };

  // Funções de conveniência para cada categoria
  const invalidateTransactions = (scope: InvalidationScope = 'related', entityId?: string) => {
    invalidateByCategory({
      category: 'transactions',
      scope,
      entityId,
      relatedCategories: ['accounts', 'categories', 'budgets'],
    });
  };

  const invalidateAccounts = (scope: InvalidationScope = 'related', entityId?: string) => {
    invalidateByCategory({
      category: 'accounts',
      scope,
      entityId,
      relatedCategories: ['transactions'],
    });
  };

  const invalidateGoals = (scope: InvalidationScope = 'specific', entityId?: string) => {
    invalidateByCategory({
      category: 'goals',
      scope,
      entityId,
    });
  };

  const invalidateInvestments = (scope: InvalidationScope = 'specific', entityId?: string) => {
    invalidateByCategory({
      category: 'investments',
      scope,
      entityId,
    });
  };

  const invalidateReports = (scope: InvalidationScope = 'cascade') => {
    invalidateByCategory({
      category: 'reports',
      scope,
    });
  };

  const invalidateCategories = (scope: InvalidationScope = 'related') => {
    invalidateByCategory({
      category: 'categories',
      scope,
      relatedCategories: ['transactions', 'budgets'],
    });
  };

  const invalidateBudgets = (scope: InvalidationScope = 'related') => {
    invalidateByCategory({
      category: 'budgets',
      scope,
      relatedCategories: ['transactions', 'categories'],
    });
  };

  const invalidateAnalytics = (scope: InvalidationScope = 'minimal') => {
    invalidateByCategory({
      category: 'analytics',
      scope,
    });
  };

  // Função para invalidação inteligente baseada no contexto
  const smartInvalidate = (
    primaryCategory: DataCategory,
    operation: 'create' | 'update' | 'delete',
    entityId?: string
  ) => {
    switch (operation) {
      case 'create':
        // Criação afeta mais categorias
        invalidateByCategory({
          category: primaryCategory,
          scope: 'cascade',
          entityId,
        });
        break;

      case 'update':
        // Atualização afeta principalmente a categoria específica
        invalidateByCategory({
          category: primaryCategory,
          scope: 'related',
          entityId,
        });
        break;

      case 'delete':
        // Deleção pode afetar várias categorias
        invalidateByCategory({
          category: primaryCategory,
          scope: 'cascade',
          entityId,
        });
        break;
    }
  };

  // Função para invalidação em lote
  const batchInvalidate = (configs: InvalidationConfig[]) => {
    configs.forEach(config => invalidateByCategory(config));
  };

  return {
    // Função principal
    invalidateByCategory,
    
    // Funções por categoria
    invalidateTransactions,
    invalidateAccounts,
    invalidateGoals,
    invalidateInvestments,
    invalidateReports,
    invalidateCategories,
    invalidateBudgets,
    invalidateAnalytics,
    
    // Funções utilitárias
    smartInvalidate,
    batchInvalidate,
    
    // Metadados
    queryMappings,
    categoryDependencies,
  };
}