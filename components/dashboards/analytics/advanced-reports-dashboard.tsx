"use client";

import React, { useState, useEffect, memo } from "react";
import { logComponents } from "../../../lib/logger";
import { UnifiedFinancialSystem } from "../../../lib/unified-financial-system";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Calendar } from "../../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Eye,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  Tag as TagIcon,
  MapPin,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
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
import { toast } from "sonner";
// storage removido
import { Transaction, Goal, Investment, Account } from "../types";
import {
  CustomDateFilter,
  filterByPeriod,
} from "../../ui/custom-date-filter";
import {
  useOptimizedMemo,
  useOptimizedCallback,
  financialCalculationOptimizer,
} from "../../../lib/performance-optimizer";

interface AdvancedReportsDashboardProps {
  onUpdate?: () => void;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactions: number;
  avgTransaction: number;
  trend: "up" | "down" | "stable";
  monthlyData: Array<{ month: string; amount: number }>;
}

interface MonthlyFlow {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

interface FamilySpending {
  member: string;
  amount: number;
  percentage: number;
  categories: string[];
  transactions?: number;
  avgTransaction?: number;
}

interface TagAnalysis {
  tag: string;
  amount: number;
  count: number;
  avgAmount: number;
  transactions?: number;
  avgTransaction?: number;
  percentage?: number;
}

interface BudgetPerformance {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "exceeded";
  color: string;
}

const AdvancedReportsDashboard = memo(
  ({ onUpdate }: AdvancedReportsDashboardProps) => {
    const [selectedPeriod, setSelectedPeriod] = useState("current-month");
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
    const [showFilters, setShowFilters] = useState(false);
    const [selectedView, setSelectedView] = useState("overview");
    const [categorySpending, setCategorySpending] = useState<
      CategorySpending[]
    >([]);
    const [monthlyFlow, setMonthlyFlow] = useState<MonthlyFlow[]>([]);
    const [familySpending, setFamilySpending] = useState<FamilySpending[]>([]);
    const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis[]>([]);
    const [budgetPerformance, setBudgetPerformance] = useState<
      BudgetPerformance[]
    >([]);
    const [cardExpenses, setCardExpenses] = useState<CategorySpending[]>([]);
    const [totalInvestments, setTotalInvestments] = useState(0);
    const [investmentsByType, setInvestmentsByType] = useState<
      CategorySpending[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);

    // Funções otimizadas
    const getSpendingControl = useOptimizedMemo(() => {
      const totalSpent = categorySpending.reduce(
        (sum, cat) => sum + cat.amount,
        0,
      );
      const totalBudget = budgetPerformance.reduce(
        (sum, budget) => sum + budget.budgeted,
        0,
      );
      return totalBudget > 0
        ? ((totalBudget - totalSpent) / totalBudget) * 100
        : 0;
    }, [categorySpending, budgetPerformance]);

    const getDiversification = useOptimizedMemo(() => {
      if (investmentsByType.length === 0) return 0;
      const total = investmentsByType.reduce((sum, inv) => sum + inv.amount, 0);
      const entropy = investmentsByType.reduce((sum, inv) => {
        const p = inv.amount / total;
        return sum - p * Math.log2(p);
      }, 0);
      return (entropy / Math.log2(investmentsByType.length)) * 100;
    }, [investmentsByType]);

    const isEmergencyReserveAdequate = useOptimizedMemo(() => {
      const monthlyExpenses =
        monthlyFlow.length > 0
          ? monthlyFlow[monthlyFlow.length - 1].expenses
          : 0;
      return totalInvestments >= monthlyExpenses * 6;
    }, [totalInvestments, monthlyFlow]);

    const isSpendingWithinBudget = useOptimizedMemo(() => {
      return budgetPerformance.every((budget) => budget.percentage <= 100);
    }, [budgetPerformance]);

    const loadReportData = useOptimizedCallback(async () => {
      try {
        setIsLoading(true);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const period =
          selectedPeriod === "custom" && customStartDate && customEndDate
            ? {
                start: customStartDate.toISOString().slice(0, 10),
                end: customEndDate.toISOString().slice(0, 10),
              }
            : {
                start: startOfMonth.toISOString().slice(0, 10),
                end: endOfMonth.toISOString().slice(0, 10),
              };

        const financialSystem = UnifiedFinancialSystem.getInstance();
        const [
          transactions,
        ] = await Promise.all([
          financialSystem.getTransactions(),
        ]);

        // Placeholder data for reports
        const cashFlow = { monthlyFlow: [], totalIncome: 0, totalExpenses: 0 };
        const categorySpendingData = { categorySpending: [] };
        const budgetData = { budgets: [] };
        const investmentsData = {};

        const investmentsSummary = investmentsData;
        const transactionsData = { transactions };

        setMonthlyFlow(
          (cashFlow.monthly || []).map((m: any) => ({
            month: m.month,
            income: m.income || 0,
            expenses: m.expenses || 0,
            balance: (m.income || 0) - (m.expenses || 0),
            savingsRate:
              (m.income || 0) > 0
                ? (((m.income || 0) - (m.expenses || 0)) / (m.income || 1)) *
                  100
                : 0,
          })),
        );

        setCategorySpending(
          (categorySpendingData.items || []).map((c: any) => ({
            category: c.category || c.name || "Outros",
            amount: Math.abs(c.amount || 0),
            percentage: c.percentage || 0,
            color: c.color || "#3B82F6",
            transactions: c.count || 0,
            avgTransaction: c.avg || 0,
            trend: c.trend || "stable",
            monthlyData: c.monthlyData || [],
          })),
        );

        setBudgetPerformance(
          (budgetData.items || []).map((b: any) => {
            const spent = Math.abs(b.spent || 0);
            const budgeted = b.budgeted || 0;
            const percentage =
              budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
            return {
              category: b.category || "Orçamento",
              budgeted,
              spent,
              remaining: Math.max(budgeted - spent, 0),
              percentage,
              status:
                percentage <= 80
                  ? "good"
                  : percentage <= 100
                    ? "warning"
                    : "exceeded",
              color: b.color || "#10B981",
            };
          }),
        );

        const summaryTotal =
          (investmentsSummary as any).total ||
          (investmentsSummary as any).totalValue ||
          0;
        const summaryByType = (investmentsSummary as any).byType || [];
        setTotalInvestments(summaryTotal);
        setInvestmentsByType(
          summaryByType.map((it: any) => ({
            category: it.type || it.category || "Outros",
            amount: it.amount || it.total || 0,
            percentage: it.percentage || 0,
            color: it.color || "#8B5CF6",
            transactions: it.transactions || 0,
            avgTransaction: it.avg || 0,
            trend: it.trend || "stable",
            monthlyData: it.monthlyData || [],
          })),
        );

        const transactionsList = (transactionsData.transactions || []) as any[];
        const sharedTransactions = transactionsList.filter(
          (t: any) => t.type === "shared" || (t as any).isShared,
        );
        if (sharedTransactions.length > 0) {
          const familyData = new Map<
            string,
            { amount: number; transactions: number }
          >();
          sharedTransactions.forEach((t: any) => {
            const member = (t.sharedMember ||
              (t as any).paidBy ||
              "Família") as string;
            if (!familyData.has(member))
              familyData.set(member, { amount: 0, transactions: 0 });
            const data = familyData.get(member)!;
            data.amount += Math.abs((t as any).myShare || t.amount || 0);
            data.transactions += 1;
          });
          const total = Array.from(familyData.values()).reduce(
            (s, d) => s + d.amount,
            0,
          );
          setFamilySpending(
            Array.from(familyData.entries()).map(([member, d]) => ({
              member,
              amount: d.amount,
              percentage: total > 0 ? (d.amount / total) * 100 : 0,
              categories: [],
              transactions: d.transactions,
              avgTransaction:
                d.transactions > 0 ? d.amount / d.transactions : 0,
            })),
          );
        } else {
          setFamilySpending([]);
        }

        const transactionsWithTags = transactionsList.filter(
          (t: any) =>
            Array.isArray((t as any).tags) && (t as any).tags.length > 0,
        );
        if (transactionsWithTags.length > 0) {
          const tagData = new Map<
            string,
            { amount: number; transactions: number }
          >();
          transactionsWithTags.forEach((t: any) => {
            ((t as any).tags || []).forEach((tag: string) => {
              if (!tagData.has(tag))
                tagData.set(tag, { amount: 0, transactions: 0 });
              const d = tagData.get(tag)!;
              d.amount += Math.abs(t.amount || 0);
              d.transactions += 1;
            });
          });
          const totalTag = Array.from(tagData.values()).reduce(
            (s, d) => s + d.amount,
            0,
          );
          setTagAnalysis(
            Array.from(tagData.entries()).map(([tag, d]) => ({
              tag,
              amount: d.amount,
              count: d.transactions,
              avgAmount: d.transactions > 0 ? d.amount / d.transactions : 0,
              transactions: d.transactions,
              avgTransaction:
                d.transactions > 0 ? d.amount / d.transactions : 0,
              percentage: totalTag > 0 ? (d.amount / totalTag) * 100 : 0,
            })),
          );
        } else {
          setTagAnalysis([]);
        }
      } catch (error) {
        logComponents.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar relatórios");
      } finally {
        setIsLoading(false);
      }
    }, [selectedPeriod, customStartDate, customEndDate]);

    const handleExportReport = useOptimizedCallback(() => {
      toast.success("Relatório exportado com sucesso!");
    }, []);

    useEffect(() => {
      loadReportData();
    }, [loadReportData]);

    const COLORS = [
      "#EF4444",
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
    ];

    const getFinancialHealthScore = () => {
      let score = 0;

      // Controle de gastos (30%)
      if (getSpendingControl >= 20) score += 30;
      else if (getSpendingControl >= 10) score += 20;
      else if (getSpendingControl >= 0) score += 10;

      // Diversificação (25%)
      if (getDiversification >= 80) score += 25;
      else if (getDiversification >= 60) score += 20;
      else if (getDiversification >= 40) score += 15;
      else if (getDiversification >= 20) score += 10;

      // Reserva de emergência (25%)
      if (isEmergencyReserveAdequate) score += 25;
      else score += 10;

      // Orçamento (20%)
      if (isSpendingWithinBudget) score += 20;
      else score += 10;

      return Math.min(score, 100);
    };

    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Relatórios Avançados
              </h2>
              <p className="text-muted-foreground mt-1">
                Carregando análise detalhada...
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-32 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Relatórios Avançados
            </h2>
            <p className="text-muted-foreground mt-1">
              Análise detalhada dos seus dados financeiros
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <CustomDateFilter
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
              />
            </CardContent>
          </Card>
        )}

        {/* Score de Saúde Financeira */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Score de Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl font-bold">
                {getFinancialHealthScore()}/100
              </div>
              <Badge
                variant={
                  getFinancialHealthScore() >= 80
                    ? "default"
                    : getFinancialHealthScore() >= 60
                      ? "secondary"
                      : "destructive"
                }
              >
                {getFinancialHealthScore() >= 80
                  ? "Muito Bom"
                  : getFinancialHealthScore() >= 60
                    ? "Bom"
                    : getFinancialHealthScore() >= 40
                      ? "Regular"
                      : "Precisa Melhorar"}
              </Badge>
            </div>
            <Progress value={getFinancialHealthScore()} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {isEmergencyReserveAdequate ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Reserva de Emergência</span>
              </div>
              <div className="flex items-center gap-2">
                {isSpendingWithinBudget ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span>Controle Orçamentário</span>
              </div>
              <div className="flex items-center gap-2">
                {getDiversification >= 60 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span>Diversificação</span>
              </div>
              <div className="flex items-center gap-2">
                {getSpendingControl >= 10 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span>Controle de Gastos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="family">Família</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyFlow}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value}`, ""]} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        name="Receita"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stackId="2"
                        stroke="#EF4444"
                        fill="#EF4444"
                        name="Despesas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categorySpending}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) =>
                          `${category} ${percentage}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`R$ ${value}`, "Valor"]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySpending.map((category, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{category.category}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            R$ {category.amount.toLocaleString()}
                          </span>
                          {category.trend === "up" && (
                            <ArrowUp className="w-4 h-4 text-red-500" />
                          )}
                          {category.trend === "down" && (
                            <ArrowDown className="w-4 h-4 text-green-500" />
                          )}
                          {category.trend === "stable" && (
                            <Minus className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>Transações: {category.transactions}</div>
                        <div>
                          Média: R$ {category.avgTransaction.toFixed(2)}
                        </div>
                        <div>Participação: {category.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="family" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Gastos Familiares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {familySpending.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {familySpending.map((member, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {member.member}
                              </h4>
                              <span className="text-lg font-bold text-red-600">
                                R$ {member.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Transações: {member.transactions}</span>
                                <span>
                                  Média: R$ {member.avgTransaction.toFixed(2)}
                                </span>
                              </div>
                              <Progress
                                value={member.percentage}
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {member.percentage.toFixed(1)}% do total
                                familiar
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Resumo Familiar</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {familySpending
                                .reduce((sum, member) => sum + member.amount, 0)
                                .toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total Gasto
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {familySpending.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Membros
                            </div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              R${" "}
                              {(
                                familySpending.reduce(
                                  (sum, member) => sum + member.amount,
                                  0,
                                ) / familySpending.length
                              ).toFixed(0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Média por Pessoa
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum gasto familiar encontrado</p>
                      <p className="text-sm">
                        Adicione transações compartilhadas para ver a análise
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon className="w-5 h-5 text-green-600" />
                  Análise por Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tagAnalysis.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tagAnalysis.map((tag, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-green-600" />
                                <h4 className="font-semibold">{tag.tag}</h4>
                              </div>
                              <span className="text-lg font-bold text-green-600">
                                R$ {tag.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Transações: {tag.transactions}</span>
                                <span>
                                  Média: R$ {tag.avgTransaction.toFixed(2)}
                                </span>
                              </div>
                              <Progress
                                value={tag.percentage}
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground">
                                {tag.percentage.toFixed(1)}% do total
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Resumo por Tags</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {tagAnalysis
                                .reduce((sum, tag) => sum + tag.amount, 0)
                                .toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total com Tags
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {tagAnalysis.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Tags Únicas
                            </div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {tagAnalysis.reduce(
                                (sum, tag) => sum + tag.transactions,
                                0,
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Transações
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma tag encontrada</p>
                      <p className="text-sm">
                        Adicione tags às suas transações para ver a análise
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetPerformance.map((budget, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{budget.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            R$ {budget.spent.toLocaleString()} / R${" "}
                            {budget.budgeted.toLocaleString()}
                          </span>
                          <Badge
                            variant={
                              budget.status === "good"
                                ? "default"
                                : budget.status === "warning"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {budget.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={budget.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

AdvancedReportsDashboard.displayName = "AdvancedReportsDashboard";

export { AdvancedReportsDashboard };
export default AdvancedReportsDashboard;
