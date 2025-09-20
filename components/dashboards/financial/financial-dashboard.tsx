'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { 
  Plus, 
  TrendingDown, 
  TrendingUp,
  PieChart, 
  Activity,
  Calendar,
  Target,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useFinancialData } from '../../../hooks/use-financial-data';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const getProgressColor = (percentual: number) => {
  if (percentual <= 50) return 'bg-green-500';
  if (percentual <= 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getCategoryAlert = (percentual: number) => {
  if (percentual > 100) return 'text-red-600';
  if (percentual > 80) return 'text-yellow-600';
  return 'text-green-600';
};

export default function FinancialDashboard() {
  const { 
    transactions, 
    accounts, 
    goals, 
    investments, 
    isLoading, 
    refreshData 
  } = useFinancialData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loading = isLoading;

  // Calcular dados do mês atual
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = (transactions || []).filter(
    (t) => t.date && t.date.startsWith(currentMonth)
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === 'expense' || t.type === 'shared')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

  const monthlyBalance = totalIncome - totalExpenses;

  // Calcular patrimônio
  const totalBalance = (accounts || []).reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0
  );

  const totalInvestments = (investments || []).reduce(
    (sum, inv) => sum + Number(inv.currentValue || inv.amount || 0),
    0
  );

  const netWorth = totalBalance + totalInvestments;

  // Calcular métricas
  const incomeTransactionCount = currentMonthTransactions.filter(t => t.type === 'income').length;
  const expenseTransactionCount = currentMonthTransactions.filter(t => t.type === 'expense' || t.type === 'shared').length;
  const averageIncome = incomeTransactionCount > 0 ? totalIncome / incomeTransactionCount : 0;
  const averageExpense = expenseTransactionCount > 0 ? totalExpenses / expenseTransactionCount : 0;
  const savingsRate = totalIncome > 0 ? (monthlyBalance / totalIncome) * 100 : 0;

  // Metas ativas
  const activeGoals = (goals || []).filter(g => g.status === 'active');
  const completedGoals = (goals || []).filter(g => g.status === 'completed');
  const averageProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, goal) => {
        const progress = (Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100;
        return sum + Math.min(progress, 100);
      }, 0) / activeGoals.length
    : 0;

  // Calcular fluxo de caixa dos últimos 6 meses
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7);
    
    const monthTransactions = (transactions || []).filter(t => t.date && t.date.startsWith(monthStr));
    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const monthExpenses = monthTransactions
      .filter(t => t.type === 'expense' || t.type === 'shared')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    
    last6Months.push({
      mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
      receitas: monthIncome,
      despesas: monthExpenses,
      saldo: monthIncome - monthExpenses
    });
  }

  // Calcular orçamento por categoria
  const categoryBudget = [];
  const categories = [...new Set(currentMonthTransactions.map(t => t.category).filter(Boolean))];
  
  categories.forEach(category => {
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.category === category && (t.type === 'expense' || t.type === 'shared'))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    
    // Orçamento estimado baseado na média dos últimos meses (simplificado)
    const estimatedBudget = categoryExpenses * 1.2; // 20% de margem
    
    if (categoryExpenses > 0) {
      categoryBudget.push({
        categoria: category,
        gasto: categoryExpenses,
        orcado: estimatedBudget,
        percentual: (categoryExpenses / estimatedBudget) * 100
      });
    }
  });

  const refreshAllData = async () => {
    await refreshData();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Carregando...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão completa das suas finanças</p>
        </div>
        <Button onClick={refreshAllData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Patrimônio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
            <PieChart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(netWorth)}
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Contas ({totalBalance > 0 ? ((totalBalance / netWorth) * 100).toFixed(1) : 0}%)</span>
                <span>Investimentos ({totalInvestments > 0 ? ((totalInvestments / netWorth) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 flex">
                <div 
                  className="bg-blue-500 h-2 rounded-l-full" 
                  style={{ width: `${netWorth > 0 ? (totalBalance / netWorth) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-green-500 h-2 rounded-r-full" 
                  style={{ width: `${netWorth > 0 ? (totalInvestments / netWorth) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado do Mês</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyBalance >= 0 ? '+' : ''}{formatCurrency(monthlyBalance)}
            </div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-green-600">+{formatCurrency(totalIncome)}</span>
                <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="text-center">
                Taxa de Economia: {savingsRate.toFixed(1)}%
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, savingsRate))} 
                className="w-full h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {activeGoals.length}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {completedGoals.length} concluídas • {averageProgress.toFixed(1)}% progresso médio
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {incomeTransactionCount} transações • Média: {formatCurrency(averageIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenseTransactionCount} transações • Média: {formatCurrency(averageExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(monthlyBalance)} poupados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalInvestments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(investments || []).length} ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa dos Últimos 6 Meses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4">
              {last6Months.map((item, index) => {
                const maxValor = Math.max(...last6Months.map(m => Math.max(m.receitas, m.despesas)));
                return (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium mb-2">{item.mes}</div>
                    <div className="space-y-1">
                      <div 
                        className="bg-green-500 rounded-t"
                        style={{ 
                          height: `${(item.receitas / maxValor) * 100}px`,
                          minHeight: '4px'
                        }}
                      ></div>
                      <div 
                        className="bg-red-500 rounded-b"
                        style={{ 
                          height: `${(item.despesas / maxValor) * 100}px`,
                          minHeight: '4px'
                        }}
                      ></div>
                    </div>
                    <div className={`text-xs mt-1 ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.saldo >= 0 ? '+' : ''}{formatCurrency(item.saldo)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Receitas</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(last6Months.reduce((acc, item) => acc + item.receitas, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Despesas</div>
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(last6Months.reduce((acc, item) => acc + item.despesas, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Saldo Líquido</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(last6Months.reduce((acc, item) => acc + item.saldo, 0))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metas e Orçamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Financeiras
              <Badge variant="secondary">
                {completedGoals.length} de {(goals || []).length} concluídas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.slice(0, 6).map((goal) => {
                const progress = (Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100;
                const daysLeft = goal.deadline 
                  ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(Number(goal.currentAmount || 0))} de {formatCurrency(Number(goal.targetAmount || 0))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.min(progress, 100).toFixed(1)}%</div>
                        {daysLeft > 0 && (
                          <div className="text-xs text-muted-foreground">{daysLeft} dias</div>
                        )}
                      </div>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                );
              })}
              
              {activeGoals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma meta ativa encontrada</p>
                  <p className="text-sm">Crie suas primeiras metas financeiras!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orçamento por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Orçamento por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBudget.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.categoria}</span>
                    <span className={`text-sm font-medium ${getCategoryAlert(item.percentual)}`}>
                      {item.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(item.gasto)} gasto</span>
                    <span>{formatCurrency(item.orcado)} orçado</span>
                  </div>
                  <Progress 
                    value={Math.min(item.percentual, 100)} 
                    className={`h-2 ${getProgressColor(item.percentual)}`}
                  />
                </div>
              ))}
              
              {categoryBudget.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma categoria com gastos encontrada</p>
                  <p className="text-sm">Adicione transações para ver o orçamento por categoria</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
