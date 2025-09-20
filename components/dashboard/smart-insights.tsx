"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Calendar,
  DollarSign,
  Target,
  ArrowRight,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTransactions, useAccounts } from "../../contexts/unified-context";

interface Insight {
  id: string;
  type: "warning" | "success" | "info" | "tip";
  icon: React.ReactNode;
  title: string;
  message: string;
  value?: string;
  change?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: "high" | "medium" | "low";
}

export function SmartInsights() {
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cálculos base
  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const lastMonth = useMemo(() => {
    const current = currentMonth;
    return new Date(current.getFullYear(), current.getMonth() - 1, 1);
  }, [currentMonth]);

  const thisMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonth;
    });
  }, [transactions, currentMonth]);

  const lastMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const nextMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);
      return transactionDate >= lastMonth && transactionDate < nextMonth;
    });
  }, [transactions, lastMonth]);

  const currentExpenses = useMemo(() => {
    return thisMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [thisMonthTransactions]);

  const lastMonthExpenses = useMemo(() => {
    return lastMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [lastMonthTransactions]);

  const currentIncome = useMemo(() => {
    return thisMonthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [thisMonthTransactions]);

  // Gerar insights inteligentes
  useEffect(() => {
    const generateInsights = () => {
      console.log('🔍 SmartInsights Debug:', {
        totalTransactions: transactions.length,
        thisMonthTransactions: thisMonthTransactions.length,
        currentExpenses,
        lastMonthExpenses,
        currentIncome,
        accounts: accounts.length
      });
      
      const newInsights: Insight[] = [];

      // Insight básico se há transações mas poucos dados
      if (transactions.length > 0 && transactions.length < 5) {
        newInsights.push({
          id: "getting-started",
          type: "info",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: "Bom início! 🚀",
          message: `Você já tem ${transactions.length} transação(ões) registrada(s). Continue adicionando para insights mais detalhados!`,
          priority: "medium",
          action: {
            label: "Adicionar mais",
            onClick: () => console.log("Open transaction form"),
          },
        });
      }

      // Insights sobre contas cadastradas
      if (accounts.length > 0) {
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        if (totalBalance > 0) {
          newInsights.push({
            id: "account-balance",
            type: "success",
            icon: <CheckCircle className="w-5 h-5 text-green-600" />,
            title: "Balanço das contas",
            message: `Você tem um saldo total de R$ ${totalBalance.toFixed(2)} em ${accounts.length} conta(s)`,
            value: `R$ ${totalBalance.toFixed(2)}`,
            priority: "high",
          });
        } else {
          newInsights.push({
            id: "setup-accounts",
            type: "info",
            icon: <Info className="w-5 h-5 text-blue-600" />,
            title: "Configure suas contas",
            message: `Você tem ${accounts.length} conta(s) cadastrada(s). Defina os saldos para um melhor controle!`,
            priority: "medium",
            action: {
              label: "Gerenciar contas",
              onClick: () => console.log("Navigate to accounts"),
            },
          });
        }
      }

      // Insights básicos sobre transações recentes
      if (thisMonthTransactions.length > 0) {
        const expenses = thisMonthTransactions.filter(t => t.type === "expense");
        const income = thisMonthTransactions.filter(t => t.type === "income");
        
        if (expenses.length > 0) {
          const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
          newInsights.push({
            id: "monthly-expenses",
            type: "info",
            icon: <DollarSign className="w-5 h-5 text-blue-600" />,
            title: "Gastos do mês",
            message: `Você gastou R$ ${totalExpenses.toFixed(2)} este mês em ${expenses.length} transação(ões)`,
            value: `R$ ${totalExpenses.toFixed(2)}`,
            priority: "medium",
          });
        }
        
        if (income.length > 0) {
          const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
          newInsights.push({
            id: "monthly-income",
            type: "success",
            icon: <TrendingUp className="w-5 h-5 text-green-600" />,
            title: "Receitas do mês",
            message: `Suas receitas somam R$ ${totalIncome.toFixed(2)} este mês`,
            value: `R$ ${totalIncome.toFixed(2)}`,
            priority: "medium",
          });
        }
      }

      // Dicas práticas para quem está começando
      if (transactions.length > 0 && transactions.length <= 10) {
        const tips = [
          {
            id: "tip-categorize",
            title: "Organize por categorias",
            message: "Usar categorias consistentes ajuda a identificar padrões de gasto e oportunidades de economia.",
            icon: <Target className="w-5 h-5 text-purple-600" />,
          },
          {
            id: "tip-regular",
            title: "Registre regularmente",
            message: "Anote suas transações diariamente para ter uma visão mais precisa das suas finanças.",
            icon: <Calendar className="w-5 h-5 text-purple-600" />,
          },
          {
            id: "tip-goals",
            title: "Defina metas",
            message: "Criar metas financeiras ajuda a manter o foco e a motivação para economizar.",
            icon: <Target className="w-5 h-5 text-purple-600" />,
          },
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        newInsights.push({
          id: randomTip.id,
          type: "tip",
          icon: randomTip.icon,
          title: `💡 ${randomTip.title}`,
          message: randomTip.message,
          priority: "low",
        });
      }

      // 1. Comparação de gastos mês atual vs anterior
      if (lastMonthExpenses > 0) {
        const expenseChange = ((currentExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
        
        if (expenseChange > 20) {
          newInsights.push({
            id: "expense-spike",
            type: "warning",
            icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
            title: "Gastos em alta",
            message: `Você gastou ${expenseChange.toFixed(1)}% mais que o mês passado`,
            value: `R$ ${(currentExpenses - lastMonthExpenses).toFixed(2)}`,
            change: expenseChange,
            priority: "high",
            action: {
              label: "Ver categorias",
              onClick: () => console.log("Navigate to categories"),
            },
          });
        } else if (expenseChange < -10) {
          newInsights.push({
            id: "expense-drop",
            type: "success",
            icon: <TrendingDown className="w-5 h-5 text-green-600" />,
            title: "Economia conseguida! 🎉",
            message: `Parabéns! Você economizou ${Math.abs(expenseChange).toFixed(1)}% este mês`,
            value: `R$ ${Math.abs(currentExpenses - lastMonthExpenses).toFixed(2)}`,
            change: expenseChange,
            priority: "high",
          });
        }
      }

      // 2. Análise de categorias com maior gasto
      const categoryExpenses = thisMonthTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const topCategory = Object.entries(categoryExpenses)
        .sort(([,a], [,b]) => b - a)[0];

      if (topCategory && currentExpenses > 0) {
        const percentage = (topCategory[1] / currentExpenses) * 100;
        if (percentage > 40) {
          newInsights.push({
            id: "category-dominance",
            type: "info",
            icon: <DollarSign className="w-5 h-5 text-blue-600" />,
            title: "Categoria em destaque",
            message: `${topCategory[0]} representa ${percentage.toFixed(1)}% dos seus gastos`,
            value: `R$ ${topCategory[1].toFixed(2)}`,
            priority: "medium",
          });
        }
      }

      // 3. Análise da relação receita vs gastos
      if (currentIncome > 0 && currentExpenses > 0) {
        const savingsRate = ((currentIncome - currentExpenses) / currentIncome) * 100;
        
        if (savingsRate > 20) {
          newInsights.push({
            id: "good-savings",
            type: "success",
            icon: <Target className="w-5 h-5 text-green-600" />,
            title: "Meta de poupança atingida!",
            message: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda`,
            value: `R$ ${(currentIncome - currentExpenses).toFixed(2)}`,
            priority: "high",
          });
        } else if (savingsRate < 5) {
          newInsights.push({
            id: "low-savings",
            type: "warning",
            icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
            title: "Poupança baixa",
            message: `Apenas ${savingsRate.toFixed(1)}% da renda está sendo poupada`,
            priority: "high",
            action: {
              label: "Criar meta",
              onClick: () => console.log("Navigate to goals"),
            },
          });
        }
      }

      // 4. Dicas personalizadas baseadas no padrão
      const recentDays = 7;
      const recentTransactions = thisMonthTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - recentDays);
        return transactionDate >= weekAgo;
      });

      if (recentTransactions.length === 0) {
        newInsights.push({
          id: "no-recent-activity",
          type: "info",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: "Sem atividade recente",
          message: "Que tal registrar suas transações dos últimos dias?",
          priority: "low",
          action: {
            label: "Adicionar transação",
            onClick: () => console.log("Open transaction form"),
          },
        });
      }

      // 5. Insight sobre dias da semana
      const weekdayExpenses = thisMonthTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          const weekday = new Date(t.date).getDay();
          const weekdayName = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][weekday];
          acc[weekdayName] = (acc[weekdayName] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const topWeekday = Object.entries(weekdayExpenses)
        .sort(([,a], [,b]) => b - a)[0];

      if (topWeekday && Object.keys(weekdayExpenses).length > 3) {
        newInsights.push({
          id: "weekday-pattern",
          type: "tip",
          icon: <Calendar className="w-5 h-5 text-purple-600" />,
          title: "Padrão semanal detectado",
          message: `Você tende a gastar mais às ${topWeekday[0]}s`,
          value: `R$ ${topWeekday[1].toFixed(2)}`,
          priority: "low",
        });
      }

      // Ordenar por prioridade
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      newInsights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setInsights(newInsights); // Manter todos os insights
    };

    // Sempre gerar insights se houver transações ou contas
    if (transactions.length > 0 || accounts.length > 0) {
      generateInsights();
    }
  }, [transactions, currentExpenses, lastMonthExpenses, currentIncome, thisMonthTransactions, lastMonthTransactions, accounts]);

  // Se não há insights e não há dados, mostrar mensagem padrão
  if (insights.length === 0 && transactions.length === 0 && accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Adicione mais transações para receber insights personalizados!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedInsights = isExpanded ? insights : insights.slice(0, 2);
  const hasMoreInsights = insights.length > 2;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Insights Inteligentes
            <Badge variant="secondary">
              {insights.length}
            </Badge>
          </CardTitle>
          {hasMoreInsights && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
              insight.type === "warning"
                ? "bg-orange-50 border-orange-200"
                : insight.type === "success"
                ? "bg-green-50 border-green-200"
                : insight.type === "tip"
                ? "bg-purple-50 border-purple-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {insight.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 leading-tight">
                    {insight.title}
                  </h4>
                  {insight.priority === "high" && (
                    <Badge variant="destructive" className="text-xs ml-2">
                      Alta
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                  {insight.message}
                </p>
                
                {insight.value && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-base">
                      {insight.value}
                    </span>
                    {insight.change !== undefined && (
                      <Badge
                        variant={insight.change > 0 ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {insight.change > 0 ? "+" : ""}{insight.change.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                )}
                
                {insight.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={insight.action.onClick}
                  >
                    {insight.action.label}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {hasMoreInsights && !isExpanded && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="text-xs text-gray-500 hover:text-gray-700 h-8"
            >
              Ver mais {insights.length - 2} insight(s)
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">
            💡 Insights atualizados automaticamente com base nas suas transações
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
