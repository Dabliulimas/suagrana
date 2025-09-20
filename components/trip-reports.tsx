"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  FileText,
  DollarSign,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  Download,
  AlertCircle,
  Target,
  CreditCard,
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
} from "lucide-react";
import { type Trip, type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface TripReportsProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

interface DailyExpense {
  date: string;
  amount: number;
  transactions: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

const CATEGORY_COLORS: Record<string, string> = {
  Transporte: "#0088FE",
  Hospedagem: "#00C49F",
  Alimentação: "#FFBB28",
  Entretenimento: "#FF8042",
  Compras: "#8884D8",
  Saúde: "#82CA9D",
  Outros: "#FFC658",
};

export function TripReports({ trip, onUpdate }: TripReportsProps) {
  const { transactions } = useTransactions();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  useEffect(() => {
    if (transactions.length >= 0) {
      loadExpenses();
    }
  }, [trip.id, transactions]);

  const loadExpenses = () => {
    setLoading(true);
    if (!transactions) return;
    const allTransactions = transactions;
    const tripExpenses = allTransactions.filter(
      (t) => t.tripId === trip.id && t.amount < 0,
    );
    setExpenses(tripExpenses);
    setLoading(false);
  };

  const getExpensesByCategory = (): ExpenseCategory[] => {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach((expense) => {
      const current = categoryMap.get(expense.category) || {
        amount: 0,
        count: 0,
      };
      categoryMap.set(expense.category, {
        amount: current.amount + Math.abs(expense.amount),
        count: current.count + 1,
      });
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.amount,
      0,
    );

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        color:
          CATEGORY_COLORS[name] ||
          COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getDailyExpenses = (): DailyExpense[] => {
    const dayMap = new Map<string, { amount: number; transactions: number }>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString("pt-BR");
      const current = dayMap.get(date) || { amount: 0, transactions: 0 };
      dayMap.set(date, {
        amount: current.amount + Math.abs(expense.amount),
        transactions: current.transactions + 1,
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        transactions: data.transactions,
      }))
      .sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime(),
      );
  };

  const getExpenseStats = () => {
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Math.abs(expense.amount),
      0,
    );
    const averageDaily =
      expenses.length > 0 ? totalExpenses / getDailyExpenses().length : 0;
    const budgetUsed = (totalExpenses / trip.budget) * 100;
    const remainingBudget = trip.budget - totalExpenses;

    return {
      totalExpenses,
      averageDaily,
      budgetUsed,
      remainingBudget,
      transactionCount: expenses.length,
    };
  };

  const generateDetailedReport = () => {
    const stats = getExpenseStats();
    const categories = getExpensesByCategory();
    const dailyExpenses = getDailyExpenses();

    const report = {
      trip: {
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        participants: trip.participants,
      },
      summary: stats,
      categories,
      dailyExpenses,
      transactions: expenses.map((expense) => ({
        date: new Date(expense.date).toLocaleDateString("pt-BR"),
        description: expense.description,
        category: expense.category,
        amount: Math.abs(expense.amount),
        paymentMethod: expense.account,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-viagem-${trip.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const stats = getExpenseStats();
  const categories = getExpensesByCategory();
  const dailyExpenses = getDailyExpenses();

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Gastos</h2>
          <p className="text-muted-foreground">
            Análise completa dos gastos da viagem
          </p>
        </div>
        <Button
          onClick={generateDetailedReport}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total Gasto
              </p>
              <p className="text-2xl font-bold text-red-600">
                R${" "}
                {stats.totalExpenses.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Orçamento Usado
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {stats.budgetUsed.toFixed(1)}%
                </p>
                <Progress
                  value={Math.min(stats.budgetUsed, 100)}
                  className="h-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Média Diária
              </p>
              <p className="text-2xl font-bold">
                R${" "}
                {stats.averageDaily.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Saldo Restante
              </p>
              <p
                className={`text-2xl font-bold ${
                  stats.remainingBudget >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R${" "}
                {stats.remainingBudget.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Orçamento */}
      {stats.budgetUsed >= 80 && (
        <Card
          className={`border-l-4 ${
            stats.budgetUsed >= 100
              ? "border-l-red-500 bg-red-50"
              : "border-l-yellow-500 bg-yellow-50"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`w-5 h-5 ${
                  stats.budgetUsed >= 100 ? "text-red-500" : "text-yellow-500"
                }`}
              />
              <p className="font-medium">
                {stats.budgetUsed >= 100
                  ? `Orçamento excedido em ${(stats.budgetUsed - 100).toFixed(1)}%`
                  : `Atenção: ${stats.budgetUsed.toFixed(1)}% do orçamento utilizado`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="analysis">Análise Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "Valor",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.count} transação
                            {category.count !== 1 ? "ões" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          R${" "}
                          {category.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dailyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value: number) => `R$ ${value}`} />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "Gastos",
                    ]}
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma transação encontrada para esta viagem.
                  </p>
                ) : (
                  expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(expense.date).toLocaleDateString("pt-BR")}
                            <Badge variant="outline">{expense.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          R${" "}
                          {Math.abs(expense.amount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {expense.account}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Controle de Orçamento</span>
                    <Badge
                      variant={
                        stats.budgetUsed <= 100 ? "default" : "destructive"
                      }
                    >
                      {stats.budgetUsed <= 100
                        ? "Dentro do orçamento"
                        : "Acima do orçamento"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequência de Gastos</span>
                    <span>
                      {(stats.transactionCount / dailyExpenses.length).toFixed(
                        1,
                      )}{" "}
                      transações/dia
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categoria Dominante</span>
                    <span>{categories[0]?.name || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.budgetUsed > 100 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700">
                          Orçamento Excedido
                        </p>
                        <p className="text-sm text-red-600">
                          Considere revisar os gastos futuros
                        </p>
                      </div>
                    </div>
                  )}
                  {categories[0] && categories[0].percentage > 50 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-700">
                          Concentração Alta
                        </p>
                        <p className="text-sm text-yellow-600">
                          {categories[0].percentage.toFixed(1)}% dos gastos em{" "}
                          {categories[0].name}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-700">
                        Controle Financeiro
                      </p>
                      <p className="text-sm text-blue-600">
                        Mantenha o registro detalhado de todas as despesas
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
