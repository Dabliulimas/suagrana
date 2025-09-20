"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { type Trip } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts, useInvestments } from "../contexts/unified-context";
import { usePerformanceMonitor } from "../hooks/use-performance-monitor";
import { useGlobalModal } from "../contexts/ui/global-modal-context";
import { useSafeTheme } from "../hooks/use-safe-theme";
import { storage } from "../lib/storage";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from "lucide-react";

export function IntegratedDashboard() {
  // Performance monitoring
  usePerformanceMonitor("IntegratedDashboard");
  const {
    openTransactionModal,
    openInvestmentModal,
    openGoalModal,
    openTripModal,
    openTransactionsListModal,
  } = useGlobalModal();
  const { settings } = useSafeTheme();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Usar hooks unificados
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { investments, isLoading: investmentsLoading } = useInvestments();

  const [selectedMonth, setSelectedMonth] = useState("");

  const [showValues, setShowValues] = useState(true);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);

  // Definir mês atual após hidratação
  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      setSelectedMonth(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      );
    }
  }, []);

  // Carregar viagens ativas
  useEffect(() => {
    const trips = storage.getActiveTrips();
    setActiveTrips(trips);
    setIsLoaded(true);
  }, []);

  // Gerar array de meses de forma estável
  const monthOptions = useMemo(() => {
    if (!selectedMonth) return [];

    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      return {
        value,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });
  }, [selectedMonth]);

  // Filtrar transações do mês selecionado
  const monthTransactions = transactions.filter((t) => {
    const transactionMonth = t.date.slice(0, 7);
    return transactionMonth === selectedMonth;
  });

  // Calcular métricas financeiras
  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Calcular saldo total das contas
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );

  // Calcular valor total dos investimentos
  const totalInvestments = investments.reduce((sum, inv) => {
    return sum + (inv.currentValue || inv.totalInvested);
  }, 0);

  // Calcular progresso das metas
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  // Análise de gastos por categoria
  const expensesByCategory = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const topCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Função para formatar valores
  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ •••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para obter cor baseada no valor
  const getValueColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (
    transactionsLoading ||
    accountsLoading ||
    goalsLoading ||
    investmentsLoading
  ) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Financeiro
          </h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
          >
            {showValues ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showValues ? "Ocultar" : "Mostrar"}
          </Button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button onClick={() => openTransactionModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthTransactions.filter((t) => t.type === "income").length}{" "}
              transação(ões)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthTransactions.filter((t) => t.type === "expense").length}{" "}
              transação(ões)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Mês</CardTitle>
            <DollarSign className={`h-4 w-4 ${getValueColor(netBalance)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getValueColor(netBalance)}`}>
              {formatCurrency(netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? "Superávit" : "Déficit"} mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com conteúdo detalhado */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="investments">Investimentos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="trips">Viagens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gastos por categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Principais Categorias de Gastos</CardTitle>
                <CardDescription>
                  Top 5 categorias do mês selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topCategories.length > 0 ? (
                  topCategories.map(([category, amount]) => {
                    const percentage = (amount / totalExpenses) * 100;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span className="font-medium">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">
                          {percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum gasto registrado neste mês
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Transações recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas movimentações do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}

                  {monthTransactions.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma transação neste mês
                    </p>
                  )}

                  {monthTransactions.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openTransactionsListModal()}
                    >
                      Ver todas as transações ({monthTransactions.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfólio de Investimentos</CardTitle>
              <CardDescription>Resumo dos seus investimentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <PiggyBank className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Valor Total Investido</p>
                      <p className="text-sm text-muted-foreground">
                        {investments.length} investimento(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalInvestments)}
                    </p>
                  </div>
                </div>

                {investments.length > 0 ? (
                  <div className="space-y-2">
                    {investments.slice(0, 3).map((investment) => (
                      <div
                        key={investment.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{investment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {investment.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              investment.currentValue ||
                                investment.totalInvested,
                            )}
                          </p>
                          {investment.currentValue && (
                            <p
                              className={`text-xs ${
                                investment.currentValue >
                                investment.totalInvested
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {investment.currentValue >
                              investment.totalInvested
                                ? "+"
                                : ""}
                              {formatCurrency(
                                investment.currentValue -
                                  investment.totalInvested,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {investments.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/investments")}
                      >
                        Ver todos os investimentos ({investments.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhum investimento cadastrado
                    </p>
                    <Button onClick={() => openInvestmentModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Investimento
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metas Financeiras</CardTitle>
              <CardDescription>
                Acompanhe o progresso das suas metas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Estatísticas das metas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {activeGoals.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Metas Ativas
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {completedGoals.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Metas Concluídas
                    </p>
                  </div>
                </div>

                {/* Lista de metas ativas */}
                {activeGoals.length > 0 ? (
                  <div className="space-y-3">
                    {activeGoals.slice(0, 3).map((goal) => {
                      const progress =
                        (goal.currentAmount / goal.targetAmount) * 100;
                      return (
                        <div
                          key={goal.id}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Target className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{goal.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Meta: {formatCurrency(goal.targetAmount)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                progress >= 100 ? "default" : "secondary"
                              }
                            >
                              {progress.toFixed(0)}%
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{formatCurrency(goal.currentAmount)}</span>
                            </div>
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                            />
                          </div>

                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Prazo:{" "}
                              {new Date(goal.deadline).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {activeGoals.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push("/goals")}
                      >
                        Ver todas as metas ({activeGoals.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Nenhuma meta ativa
                    </p>
                    <Button onClick={() => openGoalModal()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Meta
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Viagens Ativas</CardTitle>
              <CardDescription>
                Acompanhe os gastos das suas viagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTrips.length > 0 ? (
                <div className="space-y-4">
                  {activeTrips.map((trip) => {
                    const tripTransactions = transactions.filter(
                      (t) => t.tripId === trip.id,
                    );
                    const tripExpenses = tripTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((sum, t) => sum + t.amount, 0);
                    const budgetUsed =
                      trip.budget > 0 ? (tripExpenses / trip.budget) * 100 : 0;

                    return (
                      <div
                        key={trip.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{trip.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {trip.destination} •{" "}
                              {new Date(trip.startDate).toLocaleDateString(
                                "pt-BR",
                              )}{" "}
                              -{" "}
                              {new Date(trip.endDate).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                          <Badge
                            variant={
                              trip.status === "active" ? "default" : "secondary"
                            }
                          >
                            {trip.status === "active" ? "Ativa" : "Finalizada"}
                          </Badge>
                        </div>

                        {trip.budget > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Orçamento usado</span>
                              <span>
                                {formatCurrency(tripExpenses)} /{" "}
                                {formatCurrency(trip.budget)}
                              </span>
                            </div>
                            <Progress
                              value={Math.min(budgetUsed, 100)}
                              className={`h-2 ${budgetUsed > 100 ? "bg-red-100" : ""}`}
                            />
                            <p
                              className={`text-xs text-right ${
                                budgetUsed > 100
                                  ? "text-red-600"
                                  : budgetUsed > 80
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {budgetUsed.toFixed(1)}% do orçamento
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-sm text-muted-foreground">
                            {tripTransactions.length} transação(ões)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/trips/${trip.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma viagem ativa
                  </p>
                  <Button onClick={() => openTripModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Planejar Viagem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
