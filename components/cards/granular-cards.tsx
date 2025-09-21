"use client";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  PieChart, 
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Wallet,
  CreditCard
} from 'lucide-react';
import { useGranularCards } from '../../hooks/use-granular-cards';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Card de Saldo Total
export function TotalBalanceCard() {
  const { useTotalBalance } = useGranularCards();
  const { data, isLoading, error } = useTotalBalance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
          <PieChart className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
          <PieChart className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = data?.total || 0;
  const accounts = data?.accounts || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Patrimônio Total</CardTitle>
        <PieChart className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(totalBalance)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {accounts.length} conta(s) ativa(s)
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Resultado Mensal (Saldo do Mês)
export function MonthlyResultCard() {
  const { useMonthlyIncome } = useGranularCards();
  const { useMonthlyExpenses } = useGranularCards();
  
  const incomeQuery = useMonthlyIncome();
  const expensesQuery = useMonthlyExpenses();

  const isLoading = incomeQuery.isLoading || expensesQuery.isLoading;
  const error = incomeQuery.error || expensesQuery.error;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado do Mês</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado do Mês</CardTitle>
          <Activity className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const income = incomeQuery.data?.current || 0;
  const expenses = expensesQuery.data?.current || 0;
  const result = income - expenses;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Resultado do Mês</CardTitle>
        <Activity className={`h-4 w-4 ${result >= 0 ? 'text-green-600' : 'text-red-600'}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {result >= 0 ? '+' : ''}{formatCurrency(result)}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {result >= 0 ? 'Superávit' : 'Déficit'} mensal
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Metas Ativas
export function ActiveGoalsCard() {
  const { useGoalProgress } = useGranularCards();
  const { data, isLoading, error } = useGoalProgress();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
          <Target className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = data?.activeGoals || 0;
  const completedGoals = data?.completedGoals || 0;
  const averageProgress = data?.averageProgress || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
        <Target className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {activeGoals}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {completedGoals} concluídas • {averageProgress.toFixed(0)}% progresso médio
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Receitas do Mês
export function MonthlyIncomeCard() {
  const { useMonthlyIncome } = useGranularCards();
  const { data, isLoading, error } = useMonthlyIncome();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const current = data?.current || 0;
  const change = data?.change || 0;
  const changePercent = data?.changePercent || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
        <TrendingUp className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          +{formatCurrency(current)}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
          )}
          {Math.abs(changePercent).toFixed(1)}% vs mês anterior
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Despesas do Mês
export function MonthlyExpensesCard() {
  const { useMonthlyExpenses } = useGranularCards();
  const { data, isLoading, error } = useMonthlyExpenses();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const current = data?.current || 0;
  const change = data?.change || 0;
  const changePercent = data?.changePercent || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
        <TrendingDown className="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">
          -{formatCurrency(current)}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          {change <= 0 ? (
            <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
          ) : (
            <TrendingUp className="h-3 w-3 text-red-600 mr-1" />
          )}
          {Math.abs(changePercent).toFixed(1)}% vs mês anterior
        </div>
      </CardContent>
    </Card>
  );
}

// Card de Taxa de Poupança
export function SavingsRateCard() {
  const { useSavingsRate } = useGranularCards();
  const { data, isLoading, error } = useSavingsRate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
          <Activity className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const rate = data?.rate || 0;
  const savings = data?.savings || 0;

  const getColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
        <Activity className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getColor(rate)}`}>
          {rate.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {formatCurrency(savings)} poupados este mês
        </div>
        <Progress 
          value={Math.max(0, Math.min(100, rate))} 
          className="mt-2"
        />
      </CardContent>
    </Card>
  );
}

// Card de Progresso das Metas
export function GoalProgressCard() {
  const { useGoalProgress } = useGranularCards();
  const { data, isLoading, error } = useGoalProgress();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso das Metas</CardTitle>
          <Target className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso das Metas</CardTitle>
          <Target className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const totalGoals = data?.totalGoals || 0;
  const activeGoals = data?.activeGoals || 0;
  const overallProgress = data?.overallProgress || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Progresso das Metas</CardTitle>
        <Target className="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-purple-600">
          {overallProgress.toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {activeGoals} de {totalGoals} metas ativas
        </div>
        <Progress 
          value={Math.max(0, Math.min(100, overallProgress))} 
          className="mt-2"
        />
      </CardContent>
    </Card>
  );
}

// Card de Investimentos
export function InvestmentValueCard() {
  const { useInvestmentValue } = useGranularCards();
  const { data, isLoading, error } = useInvestmentValue();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
          <DollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Erro ao carregar dados</div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = data?.totalValue || 0;
  const returnPercent = data?.returnPercent || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
        <DollarSign className="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(totalValue)}
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          {returnPercent >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
          )}
          {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}% retorno
        </div>
      </CardContent>
    </Card>
  );
}