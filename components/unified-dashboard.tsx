"use client";

import {
  useAccounts,
  useTransactions,
  useGoals,
} from "../contexts/unified-context";
import { ModernAppLayout } from "./modern-app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

export function UnifiedDashboard() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { goals, loading: goalsLoading } = useGoals();

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, acc) => sum + (acc.balance || 0),
      0,
    );

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = transactions.filter((t) =>
      t.date?.startsWith(currentMonth),
    );

    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthExpenses = monthTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const completedGoals = goals.filter((g) => g.status === "completed").length;
    const activeGoals = goals.filter((g) => g.status === "active").length;

    return {
      totalBalance,
      monthIncome,
      monthExpenses,
      monthBalance: monthIncome - monthExpenses,
      completedGoals,
      activeGoals,
      totalTransactions: monthTransactions.length,
      recentTransactions: transactions.slice(0, 5),
    };
  }, [accounts, transactions, goals]);

  const loading = accountsLoading || transactionsLoading || goalsLoading;

  if (loading) {
    return (
      <ModernAppLayout
        title="Dashboard"
        subtitle="Carregando seus dados financeiros..."
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="p-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R${" "}
                    {stats.totalBalance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {accounts.length} contas ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    Receitas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R${" "}
                    {stats.monthIncome.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    Despesas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    R${" "}
                    {stats.monthExpenses.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.completedGoals}/
                    {stats.activeGoals + stats.completedGoals}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    metas concluídas
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ 0,00</div>
                  <p className="text-xs text-muted-foreground">0 contas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    Receitas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ 0,00
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    Despesas do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">R$ 0,00</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0/0</div>
                  <p className="text-xs text-muted-foreground">
                    metas concluídas
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Resumo do Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Saldo do Mês</span>
                <span
                  className={`font-semibold ${stats && stats.monthBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  R${" "}
                  {stats
                    ? Math.abs(stats.monthBalance).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })
                    : "0,00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transações</span>
                <span>{stats ? stats.totalTransactions : 0}</span>
              </div>
              {!accounts.length && !transactions.length && (
                <div className="text-center text-muted-foreground">
                  Adicione contas e transações para ver seus dados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transações Recentes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/transactions">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction) => (
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
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}R${" "}
                        {Math.abs(transaction.amount || 0).toLocaleString(
                          "pt-BR",
                          { minimumFractionDigits: 2 },
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/transactions">Adicionar transação</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metas Financeiras */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Metas Financeiras</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/goals">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const progress = goal.targetAmount
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-4 w-4" />
                          <span className="font-medium">{goal.title}</span>
                        </div>
                        <Badge
                          variant={
                            goal.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {goal.status === "completed" ? "Concluída" : "Ativa"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>
                            R${" "}
                            {(goal.currentAmount || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span>
                            R${" "}
                            {(goal.targetAmount || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(progress, 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(progress)}% concluído
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma meta definida</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/goals">Criar meta</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
