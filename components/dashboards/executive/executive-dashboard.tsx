"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { logComponents } from "../../../lib/logger";
import { UnifiedFinancialSystem } from "../../../lib/unified-financial-system";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Clock,
  Zap,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// storage removido
import { useSafeTheme } from "../../../hooks/use-safe-theme";
import type { FinancialKPI, RecurringBill } from "../types";
import {
  useOptimizedMemo,
  useOptimizedCallback,
  withPerformanceOptimization,
  financialCalculationOptimizer,
} from "../../../lib/performance-optimizer";

interface ExecutiveDashboardProps {
  onUpdate?: () => void;
}

const ExecutiveDashboard = memo(function ExecutiveDashboard({
  onUpdate,
}: ExecutiveDashboardProps) {
  const { settings } = useSafeTheme();
  const [kpis, setKpis] = useState<FinancialKPI[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const optimizedCalculateKPIs = useOptimizedCallback(
    () => {
      calculateKPIs();
    },
    [],
    300,
  );

  const optimizedGenerateAlerts = useOptimizedCallback(
    () => {
      generateAlerts();
    },
    [],
    300,
  );

  useEffect(() => {
    optimizedCalculateKPIs();
    optimizedGenerateAlerts();
  }, [optimizedCalculateKPIs, optimizedGenerateAlerts]);

  const calculateKPIs = useCallback(async () => {
    setIsLoading(true);
    try {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const [transactions, accounts, goals] = await Promise.all([
        financialSystem.getTransactions(),
        financialSystem.getAccounts(),
        financialSystem.getGoals(),
      ]);

      const billsData = { bills: [] }; // Placeholder para bills

      const [txData, accData, goalsData] = [
        { transactions },
        { accounts },
        { goals },
      ];

      const recurringBills = (billsData.bills || []) as RecurringBill[];

      // Current month data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const prevMonthStr = previousMonth.toISOString().slice(0, 7);

      const currentMonthTransactions = transactions.filter((t) =>
        t.date.startsWith(currentMonth),
      );
      const previousMonthTransactions = transactions.filter((t) =>
        t.date.startsWith(prevMonthStr),
      );

      // Calculate KPIs
      const newKpis: FinancialKPI[] = [];

      // 1. Net Worth
      const totalAssets = accounts.reduce(
        (sum, acc) => sum + Math.max(0, acc.balance),
        0,
      );
      const totalLiabilities = accounts.reduce(
        (sum, acc) => sum + Math.max(0, -acc.balance),
        0,
      );
      const netWorth = totalAssets - totalLiabilities;
      const prevNetWorth = netWorth * 0.95;

      newKpis.push({
        id: "net-worth",
        name: "Patrimônio Líquido",
        value: netWorth,
        previousValue: prevNetWorth,
        change: netWorth - prevNetWorth,
        changePercentage: ((netWorth - prevNetWorth) / prevNetWorth) * 100,
        trend:
          netWorth > prevNetWorth
            ? "up"
            : netWorth < prevNetWorth
              ? "down"
              : "stable",
        unit: "currency",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 2. Monthly Income
      const currentIncome = currentMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const previousIncome = previousMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      newKpis.push({
        id: "monthly-income",
        name: "Receita Mensal",
        value: currentIncome,
        previousValue: previousIncome,
        change: currentIncome - previousIncome,
        changePercentage:
          previousIncome > 0
            ? ((currentIncome - previousIncome) / previousIncome) * 100
            : 0,
        trend:
          currentIncome > previousIncome
            ? "up"
            : currentIncome < previousIncome
              ? "down"
              : "stable",
        unit: "currency",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 3. Monthly Expenses
      const currentExpenses = currentMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const previousExpenses = previousMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      newKpis.push({
        id: "monthly-expenses",
        name: "Despesas Mensais",
        value: currentExpenses,
        previousValue: previousExpenses,
        change: currentExpenses - previousExpenses,
        changePercentage:
          previousExpenses > 0
            ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
            : 0,
        trend:
          currentExpenses > previousExpenses
            ? "up"
            : currentExpenses < previousExpenses
              ? "down"
              : "stable",
        unit: "currency",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 4. Savings Rate
      const savingsRate =
        currentIncome > 0
          ? ((currentIncome - currentExpenses) / currentIncome) * 100
          : 0;
      const prevSavingsRate =
        previousIncome > 0
          ? ((previousIncome - previousExpenses) / previousIncome) * 100
          : 0;

      newKpis.push({
        id: "savings-rate",
        name: "Taxa de Poupança",
        value: savingsRate,
        previousValue: prevSavingsRate,
        change: savingsRate - prevSavingsRate,
        changePercentage:
          prevSavingsRate > 0
            ? ((savingsRate - prevSavingsRate) / prevSavingsRate) * 100
            : 0,
        trend:
          savingsRate > prevSavingsRate
            ? "up"
            : savingsRate < prevSavingsRate
              ? "down"
              : "stable",
        target: 20, // 20% target
        unit: "percentage",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 5. Emergency Fund Ratio
      const emergencyReserve = storage.getEmergencyReserve();
      const savingsAccounts = accounts.filter((acc) => acc.type === "savings");
      const savingsBalance = savingsAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0,
      );

      // Use dedicated emergency reserve if exists, otherwise fall back to savings accounts
      const emergencyFund = emergencyReserve
        ? emergencyReserve.currentAmount
        : savingsBalance;
      const monthlyExpenseAvg = (currentExpenses + previousExpenses) / 2;
      const emergencyFundMonths =
        monthlyExpenseAvg > 0 ? emergencyFund / monthlyExpenseAvg : 0;
      const targetMonths = emergencyReserve ? emergencyReserve.targetMonths : 6;

      newKpis.push({
        id: "emergency-fund",
        name: "Reserva de Emergência",
        value: emergencyFundMonths,
        previousValue: emergencyFundMonths * 0.9,
        change: emergencyFundMonths * 0.1,
        changePercentage: 10,
        trend: emergencyFundMonths >= targetMonths ? "up" : "down",
        target: targetMonths,
        unit: "number",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 6. Goal Achievement Rate
      const totalGoalProgress = goals.reduce((sum, goal) => {
        // compatível com tipos de metas de storage (current/target)
        const current =
          (goal as any).currentAmount ?? (goal as any).current ?? 0;
        const target = (goal as any).targetAmount ?? (goal as any).target ?? 0;
        const pct = target > 0 ? (current / target) * 100 : 0;
        return sum + pct;
      }, 0);
      const avgGoalProgress =
        goals.length > 0 ? totalGoalProgress / goals.length : 0;

      newKpis.push({
        id: "goal-achievement",
        name: "Progresso das Metas",
        value: avgGoalProgress,
        previousValue: avgGoalProgress * 0.95,
        change: avgGoalProgress * 0.05,
        changePercentage: 5,
        trend: "up",
        target: 100,
        unit: "percentage",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 7. Debt-to-Income Ratio
      const creditCards = accounts.filter((acc) => acc.type === "credit");
      const totalDebt = creditCards.reduce(
        (sum, acc) => sum + Math.abs(acc.balance),
        0,
      );
      const debtToIncomeRatio =
        currentIncome > 0 ? (totalDebt / currentIncome) * 100 : 0;

      newKpis.push({
        id: "debt-to-income",
        name: "Endividamento",
        value: debtToIncomeRatio,
        previousValue: debtToIncomeRatio * 1.1,
        change: debtToIncomeRatio * -0.1,
        changePercentage: -10,
        trend: "down",
        target: 30, // 30% max recommended
        unit: "percentage",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      // 8. Liquidity Ratio
      const liquidAccounts = accounts.filter(
        (acc) => acc.type === "checking" || acc.type === "savings",
      );
      const liquidAssets = liquidAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0,
      );
      const monthlyRecurringExpenses = recurringBills
        .filter((bill) => bill.isActive)
        .reduce((sum, bill) => {
          switch (bill.frequency) {
            case "weekly":
              return sum + bill.amount * 4.33;
            case "monthly":
              return sum + bill.amount;
            case "quarterly":
              return sum + bill.amount / 3;
            case "yearly":
              return sum + bill.amount / 12;
            default:
              return sum;
          }
        }, 0);

      const liquidityRatio =
        monthlyRecurringExpenses > 0
          ? liquidAssets / monthlyRecurringExpenses
          : 0;

      newKpis.push({
        id: "liquidity-ratio",
        name: "Liquidez",
        value: liquidityRatio,
        previousValue: liquidityRatio * 0.95,
        change: liquidityRatio * 0.05,
        changePercentage: 5,
        trend: "up",
        target: 3, // 3 months of expenses
        unit: "number",
        period: "monthly",
        updatedAt: new Date().toISOString(),
      });

      setKpis(newKpis);
    } catch (error) {
      logComponents.error("Error calculating KPIs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateAlerts = useCallback(() => {
    const newAlerts = [];

    // Check for critical KPIs
    kpis.forEach((kpi) => {
      if (kpi.target) {
        if (kpi.unit === "percentage" && kpi.value < kpi.target * 0.5) {
          newAlerts.push({
            type: "critical",
            title: `${kpi.name} Baixo`,
            message: `${kpi.value.toFixed(1)}% está abaixo da meta de ${kpi.target}%`,
            kpiId: kpi.id,
          });
        }
      }
    });

    // Check for negative trends
    const negativeKpis = kpis.filter(
      (kpi) => kpi.trend === "down" && kpi.changePercentage < -10,
    );
    if (negativeKpis.length > 0) {
      newAlerts.push({
        type: "warning",
        title: "Tendências Negativas",
        message: `${negativeKpis.length} indicadores em queda significativa`,
        kpiIds: negativeKpis.map((k) => k.id),
      });
    }

    setAlerts(newAlerts);
  }, []);

  const formatValue = (kpi: FinancialKPI) => {
    switch (kpi.unit) {
      case "currency":
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(kpi.value);
      case "percentage":
        return `${kpi.value.toFixed(1)}%`;
      case "number":
        return kpi.value.toFixed(1);
      default:
        return kpi.value.toString();
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return (
          <ArrowUp
            className={`w-4 h-4 ${settings.colorfulIcons ? "text-green-500" : "text-muted-foreground"}`}
          />
        );
      case "down":
        return (
          <ArrowDown
            className={`w-4 h-4 ${settings.colorfulIcons ? "text-red-500" : "text-muted-foreground"}`}
          />
        );
      default:
        return (
          <Minus
            className={`w-4 h-4 ${settings.colorfulIcons ? "text-gray-500" : "text-muted-foreground"}`}
          />
        );
    }
  };

  const getTrendColor = (trend: string, isGoodTrend: boolean = true) => {
    if (trend === "stable") return "text-gray-600";

    const isPositive =
      (trend === "up" && isGoodTrend) || (trend === "down" && !isGoodTrend);
    return isPositive ? "text-green-600" : "text-red-600";
  };

  const getKpiStatus = (kpi: FinancialKPI) => {
    if (!kpi.target) return "neutral";

    const percentage = (kpi.value / kpi.target) * 100;
    if (percentage >= 100) return "excellent";
    if (percentage >= 80) return "good";
    if (percentage >= 60) return "warning";
    return "critical";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800";
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800/20 dark:border-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3
              className={`w-5 h-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
            />
            Dashboard Executivo
          </h3>
          <p className="text-sm text-gray-600">
            Indicadores-chave de performance financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock
            className={`w-4 h-4 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
          />
          <span className="text-sm text-gray-500">
            Atualizado: {new Date().toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle
                className={`w-5 h-5 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
              />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white rounded border"
                >
                  <AlertTriangle
                    className={`w-4 h-4 ${settings.colorfulIcons ? "text-orange-500" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-medium text-orange-800">{alert.title}</p>
                    <p className="text-sm text-orange-600">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const status = getKpiStatus(kpi);
          const isGoodTrend = !["monthly-expenses", "debt-to-income"].includes(
            kpi.id,
          );

          return (
            <Card key={kpi.id} className={`border ${getStatusColor(status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {kpi.name}
                  </span>
                  {getTrendIcon(kpi.trend)}
                </div>

                <div className="mb-2">
                  <p className="text-2xl font-bold">{formatValue(kpi)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={getTrendColor(kpi.trend, isGoodTrend)}>
                      {kpi.changePercentage > 0 ? "+" : ""}
                      {kpi.changePercentage.toFixed(1)}%
                    </span>
                    <span className="text-gray-500">vs mês anterior</span>
                  </div>
                </div>

                {kpi.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>
                        Meta:{" "}
                        {kpi.unit === "currency"
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(kpi.target)
                          : kpi.unit === "percentage"
                            ? `${kpi.target}%`
                            : kpi.target.toString()}
                      </span>
                      <span>
                        {((kpi.value / kpi.target) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min((kpi.value / kpi.target) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target
                className={`w-5 h-5 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
              />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-5 h-5 ${settings.colorfulIcons ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  <span className="font-medium">Indicadores Positivos</span>
                </div>
                <Badge variant="default" className="bg-green-600">
                  {kpis.filter((k) => k.trend === "up").length}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-5 h-5 ${settings.colorfulIcons ? "text-orange-500" : "text-muted-foreground"}`}
                  />
                  <span className="font-medium">Indicadores em Atenção</span>
                </div>
                <Badge variant="secondary" className="bg-orange-600 text-white">
                  {kpis.filter((k) => k.trend === "down").length}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Eye
                    className={`w-5 h-5 ${settings.colorfulIcons ? "text-blue-500" : "text-muted-foreground"}`}
                  />
                  <span className="font-medium">Metas Atingidas</span>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  {kpis.filter((k) => k.target && k.value >= k.target).length}/
                  {kpis.filter((k) => k.target).length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap
                className={`w-5 h-5 ${settings.colorfulIcons ? "text-yellow-600" : "text-muted-foreground"}`}
              />
              Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.find((k) => k.id === "savings-rate" && k.value < 20) && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <TrendingUp
                    className={`w-5 h-5 ${settings.colorfulIcons ? "text-blue-500" : "text-muted-foreground"} mt-0.5`}
                  />
                  <div>
                    <p className="font-medium">Aumentar Taxa de Poupança</p>
                    <p className="text-sm text-gray-600">
                      Considere reduzir gastos não essenciais para atingir a
                      meta de 20%
                    </p>
                  </div>
                </div>
              )}

              {kpis.find((k) => k.id === "emergency-fund" && k.value < 6) && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Target
                    className={`w-5 h-5 mt-0.5 ${settings.colorfulIcons ? "text-green-500" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-medium">
                      Fortalecer Reserva de Emergência
                    </p>
                    <p className="text-sm text-gray-600">
                      Meta: 6 meses de despesas. Atual:{" "}
                      {kpis
                        .find((k) => k.id === "emergency-fund")
                        ?.value.toFixed(1)}{" "}
                      meses
                    </p>
                  </div>
                </div>
              )}

              {kpis.find((k) => k.id === "debt-to-income" && k.value > 30) && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <TrendingDown
                    className={`w-5 h-5 ${settings.colorfulIcons ? "text-red-500" : "text-muted-foreground"} mt-0.5`}
                  />
                  <div>
                    <p className="font-medium">Reduzir Endividamento</p>
                    <p className="text-sm text-gray-600">
                      Endividamento acima de 30%. Considere quitar dívidas de
                      maior juros
                    </p>
                  </div>
                </div>
              )}

              {alerts.length === 0 &&
                kpis.filter((k) => k.trend === "up").length >
                  kpis.filter((k) => k.trend === "down").length && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50">
                    <CheckCircle
                      className={`w-5 h-5 ${settings.colorfulIcons ? "text-green-500" : "text-muted-foreground"} mt-0.5`}
                    />
                    <div>
                      <p className="font-medium">Excelente Performance!</p>
                      <p className="text-sm text-gray-600">
                        Seus indicadores financeiros estão em boa direção.
                        Continue assim!
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export { ExecutiveDashboard };
export default withPerformanceOptimization(ExecutiveDashboard, {
  displayName: "ExecutiveDashboard",
  enableProfiling: process.env.NODE_ENV === "development",
});
