"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  PieChart,
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
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { Transaction, Account } from "../lib/storage";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#6B7280",
];

interface ChartData {
  name: string;
  value: number;
  color?: string;
  income?: number;
  expense?: number;
  balance?: number;
}

export function FinancialCharts() {
  // Usar os novos hooks otimizados
  const { data: transactionsData } = useTransactions();
  const { data: accountsData } = useAccounts();
  
  const transactions = transactionsData?.transactions || [];
  const accounts = accountsData?.accounts || [];
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedChart, setSelectedChart] = useState("overview");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Dados agora vêm do contexto financeiro
  }, []);

  const chartData = useMemo(() => {
    if (!isMounted) {
      return {
        monthlyTrends: [],
        categorySpending: [],
        accountBalances: [],
        incomeExpenseData: [],
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
      };
    }
    
    /**
     * @deprecated localStorage não é mais usado - dados ficam no banco
     */
    // Dados agora vêm do banco via DataService
    let workingTransactions = transactions || [];
    let workingAccounts = accounts || [];
    
    if (workingTransactions.length === 0 && typeof window !== 'undefined') {
      console.log('📊 FinancialCharts: localStorage removido - dados agora vêm do banco via DataService');
      // localStorage removido - dados agora vêm do banco via DataService
    }
    
    if (workingAccounts.length === 0 && typeof window !== 'undefined') {
      console.log('🏦 FinancialCharts: localStorage removido - dados agora vêm do banco via DataService');
      // localStorage removido - dados agora vêm do banco via DataService
    }

    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case "1month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case "6months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case "1year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const filteredTransactions = workingTransactions.filter(
      (t) => new Date(t.date) >= startDate,
    );

    // Monthly trends data
    const monthlyData: {
      [key: string]: { income: number; expense: number; balance: number };
    } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, balance: 0 };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += Math.abs(transaction.amount);
      }

      monthlyData[monthKey].balance =
        monthlyData[monthKey].income - monthlyData[monthKey].expense;
    });

    const monthlyTrends: ChartData[] = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: new Date(month + "-01").toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        income: data.income,
        expense: data.expense,
        balance: data.balance,
        value: data.balance,
      }));

    // Category spending data
    const categoryData: { [key: string]: number } = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category || "Outros";
        categoryData[category] =
          (categoryData[category] || 0) + Math.abs(transaction.amount);
      });

    const categorySpending: ChartData[] = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        color: COLORS[index % COLORS.length],
      }));

    // Account balances
    const accountBalances: ChartData[] = workingAccounts.map((account, index) => ({
      name: account.name,
      value: account.balance,
      color: COLORS[index % COLORS.length],
    }));

    // Income vs Expense comparison
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const incomeExpenseData: ChartData[] = [
      { name: "Receitas", value: totalIncome, color: "#10B981" },
      { name: "Despesas", value: totalExpense, color: "#EF4444" },
    ];

    return {
      monthlyTrends,
      categorySpending,
      accountBalances,
      incomeExpenseData,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }, [transactions, accounts, selectedPeriod, isMounted]);

  const exportData = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Período,Receitas,Despesas,Saldo\n" +
      chartData.monthlyTrends
        .map((row) => `${row.name},${row.income},${row.expense},${row.balance}`)
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analise-financeira.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Análise Financeira
          </h2>
          <p className="text-gray-600">
            Visualize seus dados financeiros com gráficos interativos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {chartData.totalIncome.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {chartData.totalExpense.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${chartData.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {chartData.netBalance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tendência Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      name === "income"
                        ? "Receitas"
                        : name === "expense"
                          ? "Despesas"
                          : "Saldo",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Receitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Saldo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Spending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Gastos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.categorySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={chartData.categorySpending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "Valor",
                    ]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma despesa encontrada para o período</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expense */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Receitas vs Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    "Valor",
                  ]}
                />
                <Bar dataKey="value">
                  {chartData.incomeExpenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Account Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Saldo por Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.accountBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.accountBalances}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "Saldo",
                    ]}
                  />
                  <Bar dataKey="value">
                    {chartData.accountBalances.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      {chartData.categorySpending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {chartData.categorySpending.map((category, index) => {
                const percentage =
                  (category.value / chartData.totalExpense) * 100;
                return (
                  <div
                    key={category.name}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{category.name}</p>
                      <p className="text-xs text-gray-500">
                        R${" "}
                        {category.value.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FinancialCharts;
