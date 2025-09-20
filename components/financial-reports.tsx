"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";

export function FinancialReports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [selectedReport, setSelectedReport] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setTransactions(transactions);
  }, []);

  // Filtrar transações por período usando CustomDateFilter
  const getFilteredTransactions = () => {
    return filterByPeriod(
      transactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
      (transaction) => new Date(transaction.date),
    );
  };

  const filteredTransactions = getFilteredTransactions();

  // Dados para gráfico de linha (evolução mensal)
  const getMonthlyData = () => {
    const monthlyData: Record<
      string,
      { month: string; income: number; expenses: number; balance: number }
    > = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthLabel,
          income: 0,
          expenses: 0,
          balance: 0,
        };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount);
      }
    });

    return Object.values(monthlyData)
      .map((data) => ({
        ...data,
        balance: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  // Dados para gráfico de pizza (categorias)
  const getCategoryData = () => {
    const categoryData: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .forEach((transaction) => {
        categoryData[transaction.category] =
          (categoryData[transaction.category] || 0) +
          Math.abs(transaction.amount);
      });

    return Object.entries(categoryData)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Dados para gráfico de barras (contas)
  const getAccountData = () => {
    const accountData: Record<
      string,
      { account: string; income: number; expenses: number }
    > = {};

    filteredTransactions.forEach((transaction) => {
      if (!accountData[transaction.account]) {
        accountData[transaction.account] = {
          account: transaction.account,
          income: 0,
          expenses: 0,
        };
      }

      if (transaction.type === "income") {
        accountData[transaction.account].income += transaction.amount;
      } else {
        accountData[transaction.account].expenses += Math.abs(
          transaction.amount,
        );
      }
    });

    return Object.values(accountData);
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const accountData = getAccountData();

  // Estatísticas gerais
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;
  const avgMonthlyIncome =
    monthlyData.length > 0 ? totalIncome / monthlyData.length : 0;
  const avgMonthlyExpenses =
    monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0;

  const handleExportReportJSON = () => {
    const reportData = {
      period: selectedPeriod,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        avgMonthlyIncome,
        avgMonthlyExpenses,
      },
      monthlyData,
      categoryData,
      accountData,
      transactions: filteredTransactions,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // Aba de Transações
      const txWorksheet = workbook.addWorksheet("Transacoes");
      if (filteredTransactions.length > 0) {
        const headers = Object.keys(filteredTransactions[0]);
        txWorksheet.addRow(headers);
        filteredTransactions.forEach((tx) => {
          txWorksheet.addRow(Object.values(tx));
        });
      }

      // Aba Mensal
      const monthlyWorksheet = workbook.addWorksheet("Mensal");
      if (monthlyData.length > 0) {
        const headers = Object.keys(monthlyData[0]);
        monthlyWorksheet.addRow(headers);
        monthlyData.forEach((data) => {
          monthlyWorksheet.addRow(Object.values(data));
        });
      }

      // Aba Categorias
      const categoryWorksheet = workbook.addWorksheet("Categorias");
      if (categoryData.length > 0) {
        const headers = Object.keys(categoryData[0]);
        categoryWorksheet.addRow(headers);
        categoryData.forEach((data) => {
          categoryWorksheet.addRow(Object.values(data));
        });
      }

      // Aba Contas
      const accountWorksheet = workbook.addWorksheet("Contas");
      if (accountData.length > 0) {
        const headers = Object.keys(accountData[0]);
        accountWorksheet.addRow(headers);
        accountData.forEach((data) => {
          accountWorksheet.addRow(Object.values(data));
        });
      }

      const fileName = `relatorio-financeiro-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Exportado para Excel");
    } catch (error) {
      logComponents.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar para Excel");
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatório Financeiro", 14, 16);
    doc.setFontSize(10);
    doc.text(`Período: ${selectedPeriod}`, 14, 22);

    // Resumo
    (doc as any).autoTable({
      head: [["Métrica", "Valor"]],
      body: [
        [
          "Receitas Totais",
          `R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Despesas Totais",
          `R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Saldo Líquido",
          `R$ ${netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Média Mensal Receita",
          `R$ ${avgMonthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Média Mensal Despesa",
          `R$ ${avgMonthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
      ],
      startY: 28,
      styles: { fontSize: 8 },
    });

    // Tabela de transações reduzida
    const txBody = filteredTransactions
      .slice(0, 100)
      .map((t) => [
        new Date(t.date).toLocaleDateString("pt-BR"),
        t.type,
        t.category,
        t.account,
        t.description,
        (t.amount >= 0 ? "+" : "-") +
          `R$ ${Math.abs(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]);
    (doc as any).autoTable({
      head: [["Data", "Tipo", "Categoria", "Conta", "Descrição", "Valor"]],
      body: txBody,
      styles: { fontSize: 7 },
      margin: { top: 10 },
    });

    const fileName = `relatorio-financeiro-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("Exportado para PDF");
  };

  const COLORS = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#6B7280",
    "#14B8A6",
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Filtros de Data
                </Button>

                <Select
                  value={selectedReport}
                  onValueChange={setSelectedReport}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Visão Geral</SelectItem>
                    <SelectItem value="categories">Por Categoria</SelectItem>
                    <SelectItem value="accounts">Por Conta</SelectItem>
                    <SelectItem value="trends">Tendências</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showFilters && (
              <CustomDateFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
              />
            )}

            <div className="flex gap-2">
              <Button onClick={handleExportReportJSON} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button onClick={handleExportExcel} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receitas Totais
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {totalIncome.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média mensal: R${" "}
              {avgMonthlyIncome.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas Totais
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {totalExpenses.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Média mensal: R${" "}
              {avgMonthlyExpenses.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {netBalance >= 0 ? "+" : ""}R${" "}
              {netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? "Superávit" : "Déficit"} no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              No período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {selectedReport === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>Receitas vs Despesas por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    name="Receitas"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    name="Despesas"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3B82F6"
                    name="Saldo"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
              <CardDescription>Despesas por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) =>
                      `${category} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedReport === "accounts" && (
        <Card>
          <CardHeader>
            <CardTitle>Movimentação por Conta</CardTitle>
            <CardDescription>
              Receitas e despesas por conta/cartão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={accountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="account" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  ]}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Receitas" />
                <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Details */}
      {selectedReport === "categories" && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
            <CardDescription>
              Análise detalhada dos gastos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, index) => {
                const percentage =
                  totalExpenses > 0
                    ? (category.amount / totalExpenses) * 100
                    : 0;
                return (
                  <div
                    key={category.category}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-gray-500">
                          {percentage.toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        R${" "}
                        {category.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {
                          filteredTransactions.filter(
                            (t) => t.category === category.category,
                          ).length
                        }{" "}
                        transações
                      </Badge>
                    </div>
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
