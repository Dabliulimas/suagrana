"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Shield,
  Target,
  Zap,
} from "lucide-react";
import { useFinancialData } from "../hooks/use-financial-data";
import { useIncomeSettings } from "../hooks/use-income-settings";
import { IncomeConfiguration } from "./income-configuration";

interface FinancialAnalysisDashboardProps {
  className?: string;
}

export function FinancialAnalysisDashboard({
  className,
}: FinancialAnalysisDashboardProps) {
  const { getTotalMonthlyIncome, getIncomeStatus } = useIncomeSettings();
  const { transactions, accounts, goals, isLoading } = useFinancialData();

  const [selectedPeriod, setSelectedPeriod] = useState<
    "3months" | "6months" | "12months"
  >("6months");
  const [analysisPeriod, setAnalysisPeriod] = useState<
    "present" | "next-month" | "next-quarter" | "next-year"
  >("present");

  const totalIncome = getTotalMonthlyIncome();
  const incomeStatus = getIncomeStatus();
  
  // Calcular dados reais das transações
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Transações do mês atual
  const currentMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });
  
  // Calcular totais do mês
  const monthlyIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const monthlyExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const netFlow = monthlyIncome - monthlyExpenses;
  
  // Gastos por categoria
  const expensesByCategory = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
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
  
  // Breakdown mensal (últimos 6 meses)
  const monthlyBreakdown = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
    });
    
    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const expenses = monthTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    monthlyBreakdown.push({
      month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      income,
      expenses,
      netFlow: income - expenses
    });
  }
  
  // Reserva de emergência (saldo total das contas)
  const currentReserve = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const monthsCovered = monthlyExpenses > 0 ? currentReserve / monthlyExpenses : 0;
  const recommendedAmount = monthlyExpenses * 6; // 6 meses de gastos
  
  // Score de saúde financeira
  let healthScore = 50;
  if (netFlow > 0) healthScore += 20;
  if (monthsCovered >= 3) healthScore += 15;
  if (monthsCovered >= 6) healthScore += 15;
  if (monthlyExpenses < monthlyIncome * 0.8) healthScore += 10;
  
  const cashFlowAnalysis = {
    totalIncome: monthlyIncome,
    totalExpenses: monthlyExpenses,
    netFlow,
    expensesByCategory,
    monthlyBreakdown,
  };
  
  const emergencyReserveAnalysis = {
    currentReserve,
    monthsCovered,
    recommendedAmount,
  };
  
  const predictions = {
    projectedBalance: netFlow * 6, // Projeção de 6 meses
    recommendations: [
      ...(netFlow < 0 ? ["Considere reduzir gastos ou aumentar receitas"] : []),
      ...(monthsCovered < 3 ? ["Priorize a formação de uma reserva de emergência"] : []),
      ...(expensesByCategory.length > 0 ? [`Revise seus gastos em ${expensesByCategory[0].category}`] : []),
    ],
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Score de Saúde Financeira */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Análise Financeira Futura
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select
                value={analysisPeriod}
                onValueChange={(
                  value:
                    | "present"
                    | "next-month"
                    | "next-quarter"
                    | "next-year",
                ) => setAnalysisPeriod(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Presente</SelectItem>
                  <SelectItem value="next-month">Próximo Mês</SelectItem>
                  <SelectItem value="next-quarter">
                    Próximo Trimestre
                  </SelectItem>
                  <SelectItem value="next-year">Próximo Ano</SelectItem>
                </SelectContent>
              </Select>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${getHealthScoreColor(healthScore)}`}
              >
                {getHealthScoreIcon(healthScore)}
                <span className="font-semibold">Score: {healthScore}/100</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Renda Mensal</p>
              <p className="text-xl font-bold text-blue-600">
                R$ {totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Entradas (30d)</p>
              <p className="text-xl font-bold text-green-600">
                R$ {(cashFlowAnalysis?.totalIncome || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-gray-600">Saídas (30d)</p>
              <p className="text-xl font-bold text-red-600">
                R$ {(cashFlowAnalysis?.totalExpenses || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-gray-600">Reserva Emergência</p>
              <p className="text-xl font-bold text-purple-600">
                R$ {(emergencyReserveAnalysis?.currentReserve || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Renda */}
      {incomeStatus.level === "error" && (
        <IncomeConfiguration showTrigger={true} />
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="emergency">Reserva</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saldo Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Situação Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Saldo do Mês:</span>
                    <span
                      className={`font-bold ${
                        (cashFlowAnalysis?.netFlow || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      R$ {(cashFlowAnalysis?.netFlow || 0).toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      Math.max(
                        0,
                        ((cashFlowAnalysis?.netFlow || 0) / totalIncome) * 100 +
                          50,
                      ),
                    )}
                    className="h-2"
                  />
                  <div className="text-sm text-gray-600">
                    {(cashFlowAnalysis?.netFlow || 0) >= 0
                      ? "Você está no azul este mês! 🎉"
                      : "Atenção: gastos superiores à renda este mês"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Principais Categorias de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Maiores Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(cashFlowAnalysis?.expensesByCategory || [])
                    .slice(0, 4)
                    .map((category, index) => (
                      <div
                        key={category.category}
                        className="flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0
                                ? "bg-red-500"
                                : index === 1
                                  ? "bg-orange-500"
                                  : index === 2
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                            }`}
                          ></div>
                          <span className="text-sm">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            R$ {category.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(
                              (category.amount /
                                (cashFlowAnalysis?.totalExpenses || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas e Recomendações */}
          <div className="space-y-4">
            {(cashFlowAnalysis?.netFlow || 0) < 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Atenção:</strong> Seus gastos estão R${" "}
                  {Math.abs(cashFlowAnalysis?.netFlow || 0).toFixed(2)} acima da
                  sua renda este mês.
                </AlertDescription>
              </Alert>
            )}

            {(emergencyReserveAnalysis?.monthsCovered || 0) < 3 && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reserva de Emergência:</strong> Recomendamos ter pelo
                  menos 3-6 meses de gastos guardados. Você tem{" "}
                  {(emergencyReserveAnalysis?.monthsCovered || 0).toFixed(1)}{" "}
                  meses cobertos.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Entradas vs Saídas (Últimos 6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(cashFlowAnalysis?.monthlyBreakdown || [])
                    .slice(-6)
                    .map((month, index) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{month.month}</span>
                          <span
                            className={
                              month.netFlow >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            R$ {month.netFlow.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div
                            className="bg-green-500 rounded-l"
                            style={{
                              width: `${(month.income / (month.income + month.expenses)) * 100}%`,
                            }}
                          ></div>
                          <div
                            className="bg-red-500 rounded-r"
                            style={{
                              width: `${(month.expenses / (month.income + month.expenses)) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(cashFlowAnalysis?.expensesByCategory || []).map(
                    (category, index) => (
                      <div key={category.category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{category.category}</span>
                          <span>R$ {category.amount.toFixed(2)}</span>
                        </div>
                        <Progress
                          value={
                            (category.amount /
                              (cashFlowAnalysis?.totalExpenses || 1)) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Análise da Reserva de Emergência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Reserva Atual</p>
                    <p className="text-2xl font-bold text-blue-600">
                      R${" "}
                      {(emergencyReserveAnalysis?.currentReserve || 0).toFixed(
                        2,
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Meses Cobertos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(emergencyReserveAnalysis?.monthsCovered || 0).toFixed(
                        1,
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Meta Recomendada</p>
                    <p className="text-2xl font-bold text-purple-600">
                      R${" "}
                      {(
                        emergencyReserveAnalysis?.recommendedAmount || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da Meta (6 meses)</span>
                    <span>
                      {(
                        ((emergencyReserveAnalysis?.currentReserve || 0) /
                          (emergencyReserveAnalysis?.recommendedAmount || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((emergencyReserveAnalysis?.currentReserve || 0) /
                        (emergencyReserveAnalysis?.recommendedAmount || 1)) *
                      100
                    }
                    className="h-3"
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {(emergencyReserveAnalysis?.monthsCovered || 0) >= 6
                      ? "Parabéns! Sua reserva de emergência está adequada."
                      : `Faltam R$ ${((emergencyReserveAnalysis?.recommendedAmount || 0) - (emergencyReserveAnalysis?.currentReserve || 0)).toFixed(2)} para atingir a meta de 6 meses.`}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedPeriod === "3months" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("3months")}
            >
              3 Meses
            </Button>
            <Button
              variant={selectedPeriod === "6months" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("6months")}
            >
              6 Meses
            </Button>
            <Button
              variant={selectedPeriod === "12months" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod("12months")}
            >
              12 Meses
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Previsões Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Projeção de Saldo</h4>
                  <div
                    className={`p-4 rounded-lg ${
                      (predictions?.projectedBalance || 0) >= 0
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <p className="text-sm text-gray-600">
                      Saldo Projetado ({selectedPeriod})
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        (predictions?.projectedBalance || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      R$ {(predictions?.projectedBalance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Recomendações</h4>
                  <div className="space-y-2">
                    {(predictions?.recommendations || []).map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-blue-50 rounded"
                      >
                        <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
