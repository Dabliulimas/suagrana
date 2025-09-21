"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";

const ModernAppLayout = dynamic(
  () => import("@/components/modern-app-layout").then(mod => ({ default: mod.ModernAppLayout })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen w-full bg-background">
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-1 flex flex-col min-w-0 w-full ml-64">
          <div className="h-16 bg-card border-b border-border" />
          <main className="flex-1 w-full overflow-auto p-6">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
);

import {
  OptimizedPageTransition,
  useRenderPerformance,
} from "@/components/optimized-page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewTransactionButton } from "@/components/new-transaction-button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Target,
  BarChart3,
  PieChart,
  Lightbulb,
  Eye,
  Filter,
} from "lucide-react";
import { storage } from "@/lib/storage";
import { RecurringPatternsSuggestions } from "@/components/ui/recurring-patterns-suggestions";
// Substituindo pelo novo hook otimizado
import { 
  useTransactions, 
  useTransactionStats, 
  useRecentTransactions 
} from "@/hooks/use-optimized-transactions";

import { UnifiedTransactionList } from "@/components/unified-transaction-list";

function TransactionsPageContent() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any>({});
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const { renderCount } = useRenderPerformance("TransactionsPage");

  // Usar os novos hooks otimizados do React Query
  const { 
    data: transactionsData, 
    isLoading, 
    error,
    refetch: refreshTransactions 
  } = useTransactions();

  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useTransactionStats();

  const { 
    data: recentTransactions, 
    isLoading: isLoadingRecent 
  } = useRecentTransactions(10);

  // Extrair transações dos dados
  const transactions = transactionsData?.transactions || [];

  const handleUpdate = async () => {
    await refreshTransactions();
  };

  // Usar dados do React Query para estatísticas
  const calculatedStats = useMemo(() => {
    if (!statsData) return null;

    return {
      currentIncome: statsData.income,
      currentExpenses: statsData.expenses,
      currentBalance: statsData.balance,
      transactionCount: statsData.transactionCount,
      averageTransaction: statsData.averageTransaction,
      savingsRate: statsData.income > 0 ? ((statsData.income - statsData.expenses) / statsData.income) * 100 : 0,
    };
  }, [statsData]);

  // Calcular insights baseados nos dados do React Query
  const calculateInsights = useMemo(() => {
    if (!calculatedStats || !statsData) return [];

    const newInsights = [];

    // Insight sobre saldo positivo
    if (calculatedStats.currentBalance > 0) {
      newInsights.push({
        type: "positive",
        title: "Saldo positivo",
        description: `Você tem um saldo positivo de R$ ${calculatedStats.currentBalance.toFixed(2)}`,
        icon: TrendingUp,
      });
    }

    // Insight sobre taxa de poupança
    if (calculatedStats.savingsRate > 20) {
      newInsights.push({
        type: "positive",
        title: "Boa taxa de poupança",
        description: `Você está poupando ${calculatedStats.savingsRate.toFixed(1)}% da sua renda`,
        icon: Target,
      });
    } else if (calculatedStats.savingsRate < 10 && calculatedStats.savingsRate > 0) {
      newInsights.push({
        type: "warning",
        title: "Taxa de poupança baixa",
        description: `Considere aumentar sua taxa de poupança (atual: ${calculatedStats.savingsRate.toFixed(1)}%)`,
        icon: Target,
      });
    }

    // Insight sobre categorias
    if (statsData.byCategory && Object.keys(statsData.byCategory).length > 0) {
      const topCategory = Object.entries(statsData.byCategory)
        .sort(([,a], [,b]) => (b as any).total - (a as any).total)[0];
      
      if (topCategory) {
        const [categoryName, categoryData] = topCategory;
        const percentage = calculatedStats.currentExpenses > 0 
          ? ((categoryData as any).total / calculatedStats.currentExpenses) * 100 
          : 0;
        
        if (percentage > 30) {
          newInsights.push({
            type: "info",
            title: "Categoria principal",
            description: `${categoryName} representa ${percentage.toFixed(1)}% dos seus gastos`,
            icon: PieChart,
          });
        }
      }
    }

    // Insight sobre economia
    if (calculatedStats.savingsRate > 20) {
      newInsights.push({
        type: "positive",
        title: "Excelente economia",
        description: `Taxa de economia de ${calculatedStats.savingsRate.toFixed(1)}% está acima da média`,
        icon: Target,
      });
    }

    return newInsights;
  }, [calculatedStats, statsData]);

  // Atualizar insights quando calculados
  useEffect(() => {
    setInsights(calculateInsights);
  }, [calculateInsights]);

  // Atualizar stats mensais quando dados estão disponíveis
  useEffect(() => {
    if (calculatedStats) {
      setMonthlyStats(calculatedStats);
    }
  }, [calculatedStats]);

  // Atualizar estatísticas de categoria
  useEffect(() => {
    if (statsData?.byCategory) {
      const categoryArray = Object.entries(statsData.byCategory)
        .map(([category, data]) => ({ 
          category, 
          amount: (data as any).total,
          count: (data as any).count,
          type: 'mixed' // Como não temos tipo específico no novo formato
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      setCategoryStats(categoryArray);
    }
  }, [statsData]);



  // Memoizar conteúdo estático
  const pageHeader = useMemo(
    () => (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
            <p className="text-muted-foreground">
              Gerencie suas receitas, despesas e gastos compartilhados
            </p>
          </div>
        </div>
      </div>
    ),
    [],
  );

  return (
    <ModernAppLayout
      title="Transações"
      subtitle="Gerencie todas as suas transações financeiras"
    >
      <OptimizedPageTransition>
        <div className="p-4 md:p-6 space-y-6">
          {pageHeader}

          {/* Insights e Análises */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Insights Inteligentes
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    <Eye className="h-4 w-4" />
                    {showAnalytics ? "Ocultar" : "Ver"} Análises
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            insight.type === "positive"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                              : insight.type === "info"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sugestões de Padrões Recorrentes */}
          {(
            <RecurringPatternsSuggestions
              onCreateRecurring={(pattern) => {
                // TODO: Implementar criação de transação recorrente
                console.log("Criar transação recorrente para:", pattern);
              }}
            />
          )}

          {/* Análises Avançadas */}
          {showAnalytics && categoryStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryStats.map((category, index) => {
                    const percentage =
                      monthlyStats.currentExpenses > 0
                        ? (category.amount / monthlyStats.currentExpenses) * 100
                        : 0;
                    return (
                      <div
                        key={category.category}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0
                                ? "bg-red-500"
                                : index === 1
                                  ? "bg-orange-500"
                                  : index === 2
                                    ? "bg-yellow-500"
                                    : index === 3
                                      ? "bg-green-500"
                                      : "bg-blue-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">
                                {category.category}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {category.count} transações
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">
                            R${" "}
                            {category.amount.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Transações */}
          {(
            <UnifiedTransactionList onUpdate={handleUpdate} />
          )}
        </div>
      </OptimizedPageTransition>
    </ModernAppLayout>
  );
}

// Export como dynamic component para evitar hydration mismatch
const TransactionsPage = dynamic(
  () => Promise.resolve(TransactionsPageContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen w-full bg-background">
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </nav>
        </div>
        <div className="flex-1 flex flex-col min-w-0 w-full ml-64">
          <div className="h-16 bg-card border-b border-border" />
          <main className="flex-1 w-full overflow-auto p-6">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
);

export default TransactionsPage;
