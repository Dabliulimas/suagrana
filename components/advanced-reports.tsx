"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  PieChart,
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
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";

export function AdvancedReports() {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [reportType, setReportType] = useState("overview");
  const [data, setData] = useState<{
    transactions: Transaction[];
    accounts: Account[];
    investments: Investment[];
    goals: Goal[];
    trips: Trip[];
  }>({
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
    try {
      setData({
        transactions: storage.getTransactions() || [],
        accounts: storage.getAccounts() || [],
        investments: storage.getInvestments() || [],
        goals: storage.getGoals() || [],
        trips: storage.getTrips() || [],
      });
    } catch (error) {
      logComponents.error("Error loading data for reports:", error);
    }
  };

  const getFilteredTransactions = () => {
    return filterByPeriod(
      data.transactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
    );
  };

  const getFinancialSummary = () => {
    const filteredTransactions = getFilteredTransactions();

    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;

    const totalBalance = data.accounts.reduce((sum, acc) => {
      if (acc.type === "credit") {
        return sum + Math.min(0, acc.balance);
      }
      return sum + acc.balance;
    }, 0);

    return { income, expenses, balance, totalBalance };
  };

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

  const getInvestmentSummary = () => {
    const totalInvested = data.investments
      .filter((inv) => inv.operation === "buy")
      .reduce((sum, inv) => sum + inv.totalValue, 0);

    const totalSold = data.investments
      .filter((inv) => inv.operation === "sell")
      .reduce((sum, inv) => sum + inv.totalValue, 0);

    return { totalInvested, totalSold, netInvested: totalInvested - totalSold };
  };

  const getGoalsProgress = () => {
    return data.goals
      .map((goal) => ({
        ...goal,
        progress: (goal.current / goal.target) * 100,
      }))
      .sort((a, b) => b.progress - a.progress);
  };

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      reportType,
      generatedAt: new Date().toISOString(),
      summary: getFinancialSummary(),
      categoryBreakdown: getCategoryBreakdown(),
      investmentSummary: getInvestmentSummary(),
      goalsProgress: getGoalsProgress(),
      rawData: data,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = getFinancialSummary();
  const categoryBreakdown = getCategoryBreakdown();
  const investmentSummary = getInvestmentSummary();
  const goalsProgress = getGoalsProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Avançados</h2>
          <p className="text-muted-foreground">
            Análises detalhadas das suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros de Data
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
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

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {summary.income.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {summary.expenses.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Saldo do Mês
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              Patrimônio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R${" "}
              {summary.totalBalance.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Gastos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma despesa encontrada no período
            </p>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.slice(0, 8).map((item, index) => {
                const percentage = (item.amount / summary.expenses) * 100;
                return (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.category}</span>
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

      {/* Investment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Investido</p>
              <p className="text-xl font-bold text-blue-600">
                R${" "}
                {investmentSummary.totalInvested.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Vendido</p>
              <p className="text-xl font-bold text-green-600">
                R${" "}
                {investmentSummary.totalSold.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Posição Líquida</p>
              <p className="text-xl font-bold text-purple-600">
                R${" "}
                {investmentSummary.netInvested.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso das Metas</CardTitle>
        </CardHeader>
        <CardContent>
          {goalsProgress.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma meta cadastrada
            </p>
          ) : (
            <div className="space-y-4">
              {goalsProgress.slice(0, 5).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{goal.name}</span>
                      <Badge
                        variant={
                          goal.priority === "high"
                            ? "destructive"
                            : goal.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="ml-2"
                      >
                        {goal.priority === "high"
                          ? "Alta"
                          : goal.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">
                        R${" "}
                        {goal.current.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        / R${" "}
                        {goal.target.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({goal.progress.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(goal.progress, 100)}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
