"use client";

import { useState, useEffect, useRef } from "react";
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
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Target,
  Wallet,
  Building,
  Plane,
  Filter,
  RefreshCw,
  FileText,
  Table,
} from "lucide-react";
import {
  storage,
  type Transaction,
  type Account,
  type Investment,
  type Goal,
  type Trip,
} from "../lib/storage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie,
} from "recharts";

// Cores para os gráficos
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

interface ReportData {
  transactions: Transaction[];
  accounts: Account[];
  investments: Investment[];
  goals: Goal[];
  trips: Trip[];
}

export function ProfessionalReports() {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [reportType, setReportType] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ReportData>({
    transactions: [],
    accounts: [],
    investments: [],
    goals: [],
    trips: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      setData({
        transactions: transactions || [],
        accounts: accounts || [],
        investments: storage.getInvestments() || [],
        goals: goals || [],
        trips: storage.getTrips() || [],
      });
    } catch (error) {
      logComponents.error("Error loading data for reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de filtro por período usando CustomDateFilter
  const getFilteredTransactions = () => {
    return filterByPeriod(
      data.transactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
      (transaction) => new Date(transaction.date),
    );
  };

  // Resumo financeiro
  const getFinancialSummary = () => {
    const filteredTransactions = getFilteredTransactions();

    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;

    const totalBalance = data.accounts.reduce(
      (sum, acc) => sum + acc.balance,
      0,
    );
    const totalInvestments = data.investments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );

    return {
      income,
      expenses,
      balance,
      totalBalance,
      totalInvestments,
      netWorth: totalBalance + totalInvestments,
    };
  };

  // Breakdown por categoria
  const getCategoryBreakdown = () => {
    const filteredTransactions = getFilteredTransactions();
    const categories: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] =
          (categories[t.category] || 0) + Math.abs(t.amount);
      });

    return Object.entries(categories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Dados para gráfico mensal
  const getMonthlyData = () => {
    const monthlyData: Record<
      string,
      { income: number; expenses: number; month: string }
    > = {};

    data.transactions.forEach((t) => {
      const month = t.date.slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, month };
      }

      if (t.type === "income") {
        monthlyData[month].income += t.amount;
      } else if (t.type === "expense") {
        monthlyData[month].expenses += Math.abs(t.amount);
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Últimos 12 meses
  };

  // Progresso das metas
  const getGoalsProgress = () => {
    return data.goals
      .map((goal) => ({
        ...goal,
        progress: (goal.current / goal.target) * 100,
      }))
      .sort((a, b) => b.progress - a.progress);
  };

  // Exportação para PDF
  const exportToPDF = async () => {
    setIsLoading(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(
        `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (error) {
      logComponents.error("Erro ao exportar PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportação para Excel
  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const ExcelJS = await import("exceljs");

      const summary = getFinancialSummary();
      const categoryBreakdown = getCategoryBreakdown();
      const monthlyData = getMonthlyData();
      const goalsProgress = getGoalsProgress();

      // Criar workbook
      const workbook = new ExcelJS.Workbook();

      // Aba 1: Resumo Financeiro
      const summaryWorksheet = workbook.addWorksheet("Resumo Financeiro");
      summaryWorksheet.addRow(["Métrica", "Valor"]);
      summaryWorksheet.addRow(["Receitas", summary.income]);
      summaryWorksheet.addRow(["Despesas", summary.expenses]);
      summaryWorksheet.addRow(["Saldo do Período", summary.balance]);
      summaryWorksheet.addRow(["Patrimônio Total", summary.totalBalance]);
      summaryWorksheet.addRow(["Investimentos", summary.totalInvestments]);
      summaryWorksheet.addRow(["Patrimônio Líquido", summary.netWorth]);

      // Aba 2: Gastos por Categoria
      const categoryWorksheet = workbook.addWorksheet("Gastos por Categoria");
      categoryWorksheet.addRow(["Categoria", "Valor", "Percentual"]);
      categoryBreakdown.forEach((item) => {
        categoryWorksheet.addRow([
          item.category,
          item.amount,
          `${((item.amount / summary.expenses) * 100).toFixed(1)}%`,
        ]);
      });

      // Aba 3: Evolução Mensal
      const monthlyWorksheet = workbook.addWorksheet("Evolução Mensal");
      monthlyWorksheet.addRow(["Mês", "Receitas", "Despesas", "Saldo"]);
      monthlyData.forEach((item) => {
        monthlyWorksheet.addRow([
          item.month,
          item.income,
          item.expenses,
          item.income - item.expenses,
        ]);
      });

      // Aba 4: Transações Detalhadas
      const transactionsWorksheet = workbook.addWorksheet("Transações");
      transactionsWorksheet.addRow([
        "Data",
        "Descrição",
        "Categoria",
        "Tipo",
        "Valor",
        "Conta",
      ]);
      getFilteredTransactions().forEach((t) => {
        transactionsWorksheet.addRow([
          t.date,
          t.description,
          t.category,
          t.type === "income" ? "Receita" : "Despesa",
          t.amount,
          t.account || "N/A",
        ]);
      });

      // Aba 5: Metas
      if (goalsProgress.length > 0) {
        const goalsWorksheet = workbook.addWorksheet("Metas");
        goalsWorksheet.addRow([
          "Meta",
          "Valor Alvo",
          "Valor Atual",
          "Progresso %",
          "Prazo",
        ]);
        goalsProgress.forEach((goal) => {
          goalsWorksheet.addRow([
            goal.name,
            goal.target,
            goal.current,
            `${goal.progress.toFixed(1)}%`,
            goal.deadline,
          ]);
        });
      }

      // Salvar arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download nativo sem file-saver
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logComponents.error("Erro ao exportar Excel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = getFinancialSummary();
  const categoryBreakdown = getCategoryBreakdown();
  const monthlyData = getMonthlyData();
  const goalsProgress = getGoalsProgress();

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header Profissional */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Financeiros</h1>
            <p className="text-blue-100">
              Análise completa e profissional das suas finanças
            </p>
            <p className="text-sm text-blue-200 mt-1">
              Gerado em {new Date().toLocaleDateString("pt-BR")} às{" "}
              {new Date().toLocaleTimeString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros de Data
            </Button>
            <Button variant="secondary" onClick={loadData} disabled={isLoading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <Button
              variant="secondary"
              onClick={exportToPDF}
              disabled={isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="secondary"
              onClick={exportToExcel}
              disabled={isLoading}
            >
              <Table className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros de Data */}
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

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
              <TrendingUp className="w-4 h-4" />
              Receitas do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {summary.income.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {
                getFilteredTransactions().filter((t) => t.type === "income")
                  .length
              }{" "}
              transações
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-700">
              <TrendingDown className="w-4 h-4" />
              Despesas do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {summary.expenses.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {
                getFilteredTransactions().filter((t) => t.type === "expense")
                  .length
              }{" "}
              transações
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
              <BarChart3 className="w-4 h-4" />
              Saldo do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {summary.balance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.balance >= 0 ? "Superávit" : "Déficit"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
              <DollarSign className="w-4 h-4" />
              Patrimônio Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R${" "}
              {summary.netWorth.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Ativos - Passivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="assets">Patrimônio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Receitas vs Despesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "",
                      ]}
                    />
                    <Bar dataKey="income" fill="#10B981" name="Receitas" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição do Patrimônio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Distribuição do Patrimônio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: "Contas",
                          value: Math.max(0, summary.totalBalance),
                        },
                        {
                          name: "Investimentos",
                          value: summary.totalInvestments,
                        },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {[
                        {
                          name: "Contas",
                          value: Math.max(0, summary.totalBalance),
                        },
                        {
                          name: "Investimentos",
                          value: summary.totalInvestments,
                        },
                      ]
                        .filter((item) => item.value > 0)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Contas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Total em Contas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  R${" "}
                  {summary.totalBalance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  {data.accounts.length} contas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-green-600" />
                  Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  R${" "}
                  {summary.totalInvestments.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  {data.investments.length} investimentos
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza das Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Gastos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryBreakdown.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ category, percent }) =>
                        `${category} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {categoryBreakdown.slice(0, 8).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                        "",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista Detalhada de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma despesa encontrada no período
                  </p>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {categoryBreakdown.map((item, index) => {
                      const percentage = (item.amount / summary.expenses) * 100;
                      return (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="font-medium">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold">
                                R${" "}
                                {item.amount.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendência de Gastos (Últimos 12 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
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
                    dataKey="income"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Receitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Despesas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Progresso das Metas Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goalsProgress.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma meta cadastrada
                </p>
              ) : (
                <div className="space-y-6">
                  {goalsProgress.map((goal) => (
                    <div
                      key={goal.id}
                      className="space-y-3 p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{goal.name}</h3>
                          <p className="text-sm text-gray-600">
                            {goal.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Prazo:{" "}
                            {goal.deadline
                              ? new Date(goal.deadline).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "Não definido"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            goal.progress >= 100
                              ? "default"
                              : goal.progress >= 75
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {goal.progress >= 100
                            ? "Concluída"
                            : goal.progress >= 75
                              ? "Quase lá"
                              : "Em andamento"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso: {goal.progress.toFixed(1)}%</span>
                          <span>
                            R${" "}
                            {goal.current.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            / R${" "}
                            {goal.target.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(goal.progress, 100)}
                          className="h-3"
                        />
                        <div className="text-xs text-gray-500">
                          Faltam R${" "}
                          {(goal.target - goal.current).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 },
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Contas Bancárias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.accounts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma conta cadastrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {account.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${account.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            R${" "}
                            {account.balance.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-gray-500">BRL</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Investimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Carteira de Investimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.investments.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum investimento cadastrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.investments.map((investment) => (
                      <div
                        key={investment.id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{investment.name}</p>
                          <p className="text-sm text-gray-500">
                            {investment.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            R${" "}
                            {investment.totalValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          {investment.ticker && (
                            <p className="text-xs text-gray-500">
                              {investment.ticker}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Viagens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Viagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.trips.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhuma viagem cadastrada
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.trips.map((trip) => {
                    const spentPercentage = (trip.spent / trip.budget) * 100;

                    return (
                      <div key={trip.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{trip.name}</h3>
                            <p className="text-sm text-gray-500">
                              {trip.destination}
                            </p>
                            <p className="text-xs text-gray-400">
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
                              trip.status === "completed"
                                ? "default"
                                : trip.status === "active"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {trip.status === "completed"
                              ? "Concluída"
                              : trip.status === "active"
                                ? "Ativa"
                                : "Planejada"}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Orçamento Usado</span>
                            <span>
                              R${" "}
                              {trip.spent.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              / R${" "}
                              {trip.budget.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(spentPercentage, 100)}
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>
                              Restante: R${" "}
                              {Math.max(
                                0,
                                trip.budget - trip.spent,
                              ).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span>
                              {trip.participants.length} participantes
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer do Relatório */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <p>Relatório gerado automaticamente pelo SuaGrana</p>
              <p>Dados atualizados em tempo real</p>
            </div>
            <div className="text-right">
              <p>
                Período:{" "}
                {period === "current-month"
                  ? "Mês Atual"
                  : period === "last-month"
                    ? "Mês Passado"
                    : period === "current-year"
                      ? "Ano Atual"
                      : period === "last-year"
                        ? "Ano Passado"
                        : period === "last-3-months"
                          ? "Últimos 3 Meses"
                          : period === "last-6-months"
                            ? "Últimos 6 Meses"
                            : "Todo Período"}
              </p>
              <p>Total de transações: {getFilteredTransactions().length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
