"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Lightbulb,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTransactions, useAccounts, useGoals } from "../../../contexts/unified-context";
import { useState, useMemo } from "react";
import { Skeleton } from "../../ui/skeleton";
import { toast } from 'sonner';

const AdvancedAnalyticsDashboard = memo(function AdvancedAnalyticsDashboard() {
  const [period, setPeriod] = useState("6months");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { transactions = [] } = useTransactions();
  const { accounts = [] } = useAccounts();
  const { goals = [] } = useGoals();
  
  const isLoading = false; // Dados sempre carregados do contexto
  
  // Processar dados baseado no período selecionado
  const data = useMemo(() => {
    if (transactions.length === 0) return null;
    
    const today = new Date();
    const periodMonths = {
      "3months": 3,
      "6months": 6,
      "12months": 12,
      "24months": 24
    }[period] || 6;
    
    const startDate = new Date(today.getFullYear(), today.getMonth() - periodMonths, 1);
    
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startDate;
    });
    
    // Calcular métricas
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const totalExpenses = periodTransactions
      .filter(t => t.type === 'expense' || t.type === 'shared')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const averageMonthlyIncome = totalIncome / periodMonths;
    
    // Gastos por categoria
    const expensesByCategory = periodTransactions
      .filter(t => (t.type === 'expense' || t.type === 'shared') && 
                   (categoryFilter === 'all' || t.category === categoryFilter))
      .reduce((acc, t) => {
        const existing = acc.find(item => item.category === t.category);
        if (existing) {
          existing.amount += Math.abs(t.amount);
        } else {
          acc.push({ category: t.category, amount: Math.abs(t.amount) });
        }
        return acc;
      }, [] as { category: string; amount: number }[])
      .sort((a, b) => b.amount - a.amount);
    
    // Tendência mensal
    const monthlyTrend = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthTransactions = periodTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && 
               tDate.getFullYear() === date.getFullYear();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      const expenses = monthTransactions
        .filter(t => t.type === 'expense' || t.type === 'shared')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      monthlyTrend.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: income,
        despesas: expenses,
        saldo: income - expenses
      });
    }
    
    // Gerar insights
    const insights = [];
    const avgExpense = totalExpenses / periodMonths;
    const currentMonthExpenses = monthlyTrend[monthlyTrend.length - 1]?.despesas || 0;
    
    if (currentMonthExpenses > avgExpense * 1.2) {
      insights.push({
        type: 'warning',
        title: 'Gastos Acima da Média',
        description: `Este mês você gastou ${((currentMonthExpenses / avgExpense - 1) * 100).toFixed(1)}% acima da média`,
      });
    } else if (currentMonthExpenses < avgExpense * 0.8) {
      insights.push({
        type: 'positive',
        title: 'Ótimo Controle de Gastos',
        description: `Você economizou ${((avgExpense - currentMonthExpenses) / avgExpense * 100).toFixed(1)}% em relação à média`,
      });
    }
    
    if (expensesByCategory.length > 0) {
      const topCategory = expensesByCategory[0];
      const percentage = (topCategory.amount / totalExpenses) * 100;
      if (percentage > 40) {
        insights.push({
          type: 'warning',
          title: 'Concentração de Gastos',
          description: `${percentage.toFixed(1)}% dos seus gastos são em ${topCategory.category}`,
        });
      }
    }
    
    // Calcular progresso das metas
    const goalProgress = goals.map(goal => ({
      name: goal.name,
      current: goal.currentAmount || 0,
      target: goal.targetAmount || 1,
      percentage: goal.targetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
      daysRemaining: goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined
    }));
    
    // Performance de investimentos (dados simulados baseados no período)
    const investmentPerformance = monthlyTrend.map((month, index) => ({
      month: month.month,
      invested: 1000 + (index * 200), // Simulado
      currentValue: 1000 + (index * 220) + Math.random() * 100 // Simulado
    }));
    
    // Adicionar percentages às categorias
    const expensesByCategoryWithPercentage = expensesByCategory.map(cat => ({
      ...cat,
      percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0
    }));

    return {
      summary: {
        totalReceitas: totalIncome,
        totalDespesas: totalExpenses,
        saldoLiquido: totalIncome - totalExpenses,
        saldoAtual: totalBalance,
        receitaMediaMensal: averageMonthlyIncome,
        gastoMedioMensal: totalExpenses / periodMonths
      },
      expensesByCategory: expensesByCategoryWithPercentage,
      monthlyTrend,
      insights,
      goalProgress,
      investmentPerformance
    };
  }, [transactions, accounts, goals, period, categoryFilter]);
  
  const exportAnalytics = (format: 'csv') => {
    if (!data) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    
    try {
      const csvContent = generateAnalyticsCSV(data);
      downloadFile(csvContent, `analytics-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };
  
  const generateAnalyticsCSV = (data: any) => {
    const headers = ['Mês', 'Receitas', 'Despesas', 'Saldo'];
    const rows = data.monthlyTrend.map((item: any) => [
      item.month,
      `R$ ${item.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${item.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };
  
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };
  
  const error = null;

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Erro ao carregar dados de analytics</p>
            </div>
            <p className="text-sm text-red-500 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="h-5 w-5" />
              <p>Nenhum dado disponível para análise</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "negative":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Financeiro
          </h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada dos seus dados financeiros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
              <SelectItem value="12months">12 meses</SelectItem>
              <SelectItem value="24months">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="Alimentação">Alimentação</SelectItem>
              <SelectItem value="Transporte">Transporte</SelectItem>
              <SelectItem value="Moradia">Moradia</SelectItem>
              <SelectItem value="Saúde">Saúde</SelectItem>
              <SelectItem value="Educação">Educação</SelectItem>
              <SelectItem value="Lazer">Lazer</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportAnalytics('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R${" "}
              {data.summary.saldoAtual.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Todas as contas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {data.summary.receitaMediaMensal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Gastos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {data.summary.gastoMedioMensal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Poupança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.totalReceitas > 0 ? ((data.summary.saldoLiquido / data.summary.totalReceitas) * 100).toFixed(1) : '0.0'}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Mês atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Receitas vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "",
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                    <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução do Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                      name="Saldo"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Gastos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, amount }) =>
                        `${category}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {data.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "Valor",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.expensesByCategory.slice(0, 6).map((category, index) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                        />
                        <span className="text-sm font-medium">
                          {category.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">
                          R${" "}
                          {category.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Progresso das Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.goalProgress.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma meta cadastrada
                  </p>
                ) : (
                  data.goalProgress.map((goal, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-sm text-gray-500">
                          {goal.daysRemaining !== undefined &&
                          goal.daysRemaining > 0
                            ? `${goal.daysRemaining} dias restantes`
                            : goal.daysRemaining !== undefined &&
                                goal.daysRemaining <= 0
                              ? "Prazo vencido"
                              : "Sem prazo definido"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          R${" "}
                          {goal.current.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span>
                          R${" "}
                          {goal.target.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            goal.percentage >= 100
                              ? "bg-green-500"
                              : goal.percentage >= 75
                                ? "bg-blue-500"
                                : goal.percentage >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(goal.percentage, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-right text-sm font-medium">
                        {goal.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance dos Investimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.investmentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="invested"
                    stroke="#3B82F6"
                    name="Investido"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentValue"
                    stroke="#10B981"
                    name="Valor Atual"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Insights Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge className={getInsightBadgeColor(insight.type)}>
                          {insight.type === "positive"
                            ? "Positivo"
                            : insight.type === "warning"
                              ? "Atenção"
                              : insight.type === "negative"
                                ? "Negativo"
                                : "Info"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <p className="text-lg font-bold mt-2">
                          {insight.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

AdvancedAnalyticsDashboard.displayName = "AdvancedAnalyticsDashboard";

export default AdvancedAnalyticsDashboard;
