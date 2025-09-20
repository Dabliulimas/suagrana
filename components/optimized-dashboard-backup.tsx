"use client";

import { useState, useEffect, memo } from "react";
import { logComponents } from "../lib/logger";
import { ModernAppLayout } from "./modern-app-layout";
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
import {
  LazySimpleAnalytics,
  LazyInteractiveBudget,
} from "optimization/lazy-components";
import { type Trip } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { usePerformanceMonitor } from "../hooks/use-performance-monitor";

import { VirtualizedList } from "optimization/virtualized-list";
import { useGlobalModal } from "../contexts/ui/global-modal-context";
import { useSafeTheme } from "../hooks/use-safe-theme";
import {
  useTransactions,
  useAccounts,
  useGoals,
  useInvestments,
} from "../contexts/unified-context";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  CreditCard,
  Plane,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Plus,
  Eye,
  Calendar,
  Wallet,
  AlertTriangle,
} from "lucide-react";

export const OptimizedDashboard = memo(function OptimizedDashboard() {
  usePerformanceMonitor("OptimizedDashboard");
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

  // Usar sistema financeiro profissional
  // Usar hooks unificados para consistência com página de transações
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { goals, isLoading: goalsLoading } = useGoals();
  const { investments, isLoading: investmentsLoading } = useInvestments();

  // Estado de loading combinado
  const loading =
    transactionsLoading ||
    accountsLoading ||
    goalsLoading ||
    investmentsLoading;
  const error = null; // Simplificado por enquanto

  // Calcular métricas do mês atual
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = (transactions || []).filter(
    (t) => t.date && t.date.startsWith(currentMonth),
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

  const monthlyBalance = totalIncome - totalExpenses;
  const totalBalance = (accounts || []).reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0,
  );
  const totalInvestments = (investments || []).reduce(
    (sum, inv) => sum + Number(inv.currentValue || inv.amount || 0),
    0,
  );
  const netWorth = totalBalance + totalInvestments;

  const recentTransactions = (transactions || [])
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime(),
    )
    .slice(0, 20);

  const activeGoals = (goals || []).filter((g) => g.status === "active");
  const sharedExpenses = currentMonthTransactions.filter(
    (t) => t.type === "shared",
  );
  const totalSharedExpenses = sharedExpenses.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount || 0)),
    0,
  );

  // Contadores
  const transactionCount = currentMonthTransactions.length;
  const incomeTransactionCount = currentMonthTransactions.filter(
    (t) => t.type === "income",
  ).length;
  const expenseTransactionCount = currentMonthTransactions.filter(
    (t) => t.type === "expense" || t.type === "shared",
  ).length;

  // Função de refresh
  const fetchAllData = async () => {
    // Implementar refresh dos dados unificados se necessário
  };

  const clearError = () => {
    // Implementar limpeza de erro se necessário
  };

  // Trips ainda vem do storage antigo (temporário)
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = () => {
      try {
        const tripsData: any[] = [];
        setTrips(tripsData);
      } catch (error) {
        logComponents.error("Erro ao carregar trips:", error);
        setTrips([]);
      }
    };
    loadTrips();
  }, []);

  // Calcular métricas derivadas
  const activeTrips = trips.filter((t) => t.status === "active");

  useEffect(() => {
    // Marcar como carregado quando não estiver loading
    if (!loading) {
      setIsLoaded(true);
    }
  }, [loading]);

  // Tratamento de erro
  if (error) {
    return (
      <ModernAppLayout title="Dashboard" subtitle="Erro ao carregar dados">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">
                Erro ao carregar dados financeiros
              </p>
              <p className="text-sm mb-4">{error}</p>
              <Button onClick={fetchAllData}>Tentar Novamente</Button>
            </div>
          </CardContent>
        </Card>
      </ModernAppLayout>
    );
  }

  if (loading) {
    return (
      <ModernAppLayout
        title="Dashboard"
        subtitle="Carregando dados financeiros..."
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  if (error) {
    return (
      <ModernAppLayout title="Dashboard" subtitle="Erro ao carregar dados">
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-red-600">❌ Erro: {error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={fetchAllData} variant="default">
                    <Eye className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={clearError} variant="outline">
                    Limpar Erro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Patrimônio Líquido
              </CardTitle>
              <Wallet
                className={`h-4 w-4 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {netWorth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Contas + Investimentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo do Mês
              </CardTitle>
              <DollarSign
                className={`h-4 w-4 ${monthlyBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${monthlyBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                R${" "}
                {Math.abs(monthlyBalance).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {monthlyBalance >= 0 ? "Superávit" : "Déficit"} mensal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receitas (Mês)
              </CardTitle>
              <TrendingUp
                className={`h-4 w-4 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R${" "}
                {totalIncome.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {incomeTransactionCount} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Despesas (Mês)
              </CardTitle>
              <TrendingDown
                className={`h-4 w-4 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R${" "}
                {totalExpenses.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenseTransactionCount} transações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Accounts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accounts Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                    />
                    Contas Bancárias
                  </CardTitle>
                  <CardDescription>
                    Saldos atuais das suas contas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {accounts.length > 10 ? (
                      <VirtualizedList
                        items={accounts}
                        itemHeight={80}
                        height={320}
                        renderItem={(account: any) => (
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-500">
                                {account.bank}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                R${" "}
                                {Math.abs(account.balance).toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </p>
                              <Badge
                                variant={
                                  account.type === "credit"
                                    ? "destructive"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {account.type === "checking" && "Corrente"}
                                {account.type === "savings" && "Poupança"}
                                {account.type === "credit" && "Crédito"}
                                {account.type === "investment" &&
                                  "Investimento"}
                              </Badge>
                            </div>
                          </div>
                        )}
                        getItemKey={(account) => account.id}
                      />
                    ) : (
                      <>
                        {accounts.slice(0, 4).map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-500">
                                {account.bank}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                R${" "}
                                {Math.abs(account.balance).toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </p>
                              <Badge
                                variant={
                                  account.type === "credit"
                                    ? "destructive"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {account.type === "checking" && "Corrente"}
                                {account.type === "savings" && "Poupança"}
                                {account.type === "credit" && "Crédito"}
                                {account.type === "investment" &&
                                  "Investimento"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {accounts.length > 4 && (
                          <Button variant="ghost" className="w-full">
                            <Eye
                              className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                            />
                            Ver todas as contas ({accounts.length})
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>
                    Últimas movimentações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentTransactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhuma transação encontrada
                    </p>
                  ) : (
                    <>
                      {recentTransactions.slice(0, 10).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transaction.type === "income"
                                  ? "bg-green-100 text-green-600"
                                  : transaction.type === "shared"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? (
                                <ArrowUpRight
                                  className={`w-4 h-4 ${settings.colorfulIcons ? "" : "text-current"}`}
                                />
                              ) : transaction.type === "shared" ? (
                                <Users
                                  className={`w-4 h-4 ${settings.colorfulIcons ? "" : "text-current"}`}
                                />
                              ) : (
                                <ArrowDownRight
                                  className={`w-4 h-4 ${settings.colorfulIcons ? "" : "text-current"}`}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {transaction.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                            >
                              {transaction.type === "income" ? "+" : "-"}R${" "}
                              {Math.abs(transaction.amount).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 },
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {recentTransactions.length > 0 && (
                        <Button
                          variant="ghost"
                          className="w-full mt-4"
                          onClick={openTransactionsListModal}
                        >
                          <Eye
                            className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                          />
                          Ver Todas ({recentTransactions.length} transações)
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Shared Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-purple-600" : "text-muted-foreground"}`}
                    />
                    Despesas Compartilhadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Total do Mês</p>
                        <p className="text-sm text-gray-500">
                          {sharedExpenses.length} despesas
                        </p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        R${" "}
                        {totalSharedExpenses.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={openTransactionModal}
                      >
                        <Plus
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                        />
                        Nova Despesa Compartilhada
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push("/shared")}
                      >
                        <Eye
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                        />
                        Ver Todas
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Investments Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    Investimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Valor Total</p>
                        <p className="text-sm text-gray-500">
                          {investments.length} operações
                        </p>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        R${" "}
                        {totalInvestments.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={openInvestmentModal}
                      >
                        <Plus
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                        />
                        Novo Investimento
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push("/investments")}
                      >
                        <Eye
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                        />
                        Ver Todos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Trips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                    />
                    Viagens Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTrips.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">Nenhuma viagem ativa</p>
                      <Button variant="outline" onClick={openTripModal}>
                        <Plus
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                        />
                        Planejar Viagem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeTrips.map((trip) => {
                        const budgetUsed =
                          trip.budget > 0
                            ? (trip.spent / trip.budget) * 100
                            : 0;
                        return (
                          <div
                            key={trip.id}
                            className="space-y-3 p-3 border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{trip.name}</p>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin
                                    className={`w-3 h-3 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                                  />
                                  {trip.destination}
                                </p>
                              </div>
                              <Badge variant="default">Ativa</Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Orçamento usado</span>
                                <span>{budgetUsed.toFixed(1)}%</span>
                              </div>
                              <Progress value={budgetUsed} className="h-2" />
                            </div>
                          </div>
                        );
                      })}
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => router.push("/travel")}
                      >
                        <Eye
                          className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                        />
                        Ver Todas as Viagens
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <LazySimpleAnalytics />
          </TabsContent>

          <TabsContent value="budget">
            <LazyInteractiveBudget />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
                    />
                    Metas Financeiras
                  </CardTitle>
                  <CardDescription>
                    Acompanhe o progresso das suas metas
                  </CardDescription>
                </div>
                <Button onClick={openGoalModal}>
                  <Plus
                    className={`w-4 h-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                  />
                  Nova Meta
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeGoals.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma meta ativa
                  </p>
                ) : (
                  activeGoals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    const remaining = goal.target - goal.current;
                    return (
                      <div
                        key={goal.id}
                        className="space-y-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{goal.name}</h3>
                            <p className="text-sm text-gray-500">
                              {goal.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              goal.priority === "high"
                                ? "destructive"
                                : goal.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {goal.priority === "high" && "Alta Prioridade"}
                            {goal.priority === "medium" && "Média Prioridade"}
                            {goal.priority === "low" && "Baixa Prioridade"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={progress} className="h-3" />
                          <div className="flex justify-between text-sm">
                            <span>
                              R${" "}
                              {goal.current.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              de R${" "}
                              {goal.target.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="font-medium">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Faltam R${" "}
                            {remaining.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            para atingir a meta
                          </p>
                        </div>
                        {goal.targetDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar
                              className={`w-4 h-4 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                            />
                            Prazo:{" "}
                            {new Date(goal.targetDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernAppLayout>
  );
});
