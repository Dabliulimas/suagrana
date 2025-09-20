"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Progress } from "../../ui/progress";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  PiggyBank,
  TrendingUpIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  DollarSign,
  Shield,
  Zap,
} from "lucide-react";
import {
  performanceAnalyzer,
  type PerformanceMetrics,
  type TrendAnalysis,
  type CategoryAnalysis,
  type PredictiveInsights,
} from "../../../lib/financial/financial-performance-analyzer";

interface PerformanceDashboardProps {
  className?: string;
}

const FinancialPerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis | null>(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>(
    [],
  );
  const [predictions, setPredictions] = useState<PredictiveInsights | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "monthly" | "quarterly" | "yearly"
  >("monthly");

  useEffect(() => {
    loadPerformanceData();
  }, [selectedPeriod]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const [metricsData, trendsData, categoryData, predictionsData] =
        await Promise.all([
          performanceAnalyzer.analyzePerformance(),
          performanceAnalyzer.analyzeTrends(selectedPeriod),
          performanceAnalyzer.analyzeCategoryTrends(),
          performanceAnalyzer.generatePredictiveInsights(),
        ]);

      setMetrics(metricsData);
      setTrends(trendsData);
      setCategoryAnalysis(categoryData);
      setPredictions(predictionsData);
    } catch (error) {
      logComponents.error("Erro ao carregar dados de performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "high":
        return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20";
      case "critical":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
      case "improving":
      case "increasing":
        return (
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "down":
      case "declining":
      case "decreasing":
        return (
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      default:
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Não foi possível carregar os dados de performance. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Score de Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`text-4xl font-bold ${getScoreColor(metrics.overallScore)}`}
              >
                {metrics.overallScore}/100
              </div>
              <Badge className={getRiskColor(metrics.riskLevel)}>
                Risco:{" "}
                {metrics.riskLevel === "low"
                  ? "Baixo"
                  : metrics.riskLevel === "medium"
                    ? "Médio"
                    : metrics.riskLevel === "high"
                      ? "Alto"
                      : "Crítico"}
              </Badge>
            </div>
            <div className="text-right">
              <Progress value={metrics.overallScore} className="w-32 mb-2" />
              <p className="text-sm text-gray-600">
                {metrics.overallScore >= 80
                  ? "Excelente!"
                  : metrics.overallScore >= 60
                    ? "Bom"
                    : metrics.overallScore >= 40
                      ? "Regular"
                      : "Precisa melhorar"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(metrics.cashFlowHealth.score)}`}
                >
                  {metrics.cashFlowHealth.score}
                </div>
                <p className="text-xs text-gray-600">
                  Taxa: {formatPercentage(metrics.cashFlowHealth.savingsRate)}
                </p>
              </div>
              {getTrendIcon(metrics.cashFlowHealth.trend)}
            </div>
            <p className="text-sm mt-2">
              {formatCurrency(metrics.cashFlowHealth.monthlyFlow)}/mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(metrics.budgetEfficiency.score)}`}
                >
                  {metrics.budgetEfficiency.score}
                </div>
                <p className="text-xs text-gray-600">
                  Aderência:{" "}
                  {formatPercentage(metrics.budgetEfficiency.adherence)}
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
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
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(metrics.goalProgress.score)}`}
                >
                  {metrics.goalProgress.score}
                </div>
                <p className="text-xs text-gray-600">
                  {metrics.goalProgress.onTrackGoals}/
                  {metrics.goalProgress.totalGoals} no prazo
                </p>
              </div>
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4" />
              Investimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-2xl font-bold ${getScoreColor(metrics.investmentPerformance.score)}`}
                >
                  {metrics.investmentPerformance.score}
                </div>
                <p className="text-xs text-gray-600">
                  Retorno:{" "}
                  {formatPercentage(
                    metrics.investmentPerformance.returnPercentage,
                  )}
                </p>
              </div>
              <TrendingUpIcon className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(["weekly", "monthly", "quarterly", "yearly"] as const).map(
              (period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === "weekly"
                    ? "Semanal"
                    : period === "monthly"
                      ? "Mensal"
                      : period === "quarterly"
                        ? "Trimestral"
                        : "Anual"}
                </Button>
              ),
            )}
          </div>

          {trends && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Receitas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(trends.income.current)}
                    </span>
                    {getTrendIcon(trends.income.trend)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Anterior: {formatCurrency(trends.income.previous)}</p>
                    <p
                      className={
                        trends.income.change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {trends.income.change >= 0 ? "+" : ""}
                      {formatCurrency(trends.income.change)}(
                      {formatPercentage(trends.income.changePercentage)})
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Despesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(trends.expenses.current)}
                    </span>
                    {getTrendIcon(trends.expenses.trend)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Anterior: {formatCurrency(trends.expenses.previous)}</p>
                    <p
                      className={
                        trends.expenses.change <= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {trends.expenses.change >= 0 ? "+" : ""}
                      {formatCurrency(trends.expenses.change)}(
                      {formatPercentage(trends.expenses.changePercentage)})
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Poupança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(trends.savings.current)}
                    </span>
                    {getTrendIcon(trends.savings.trend)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Anterior: {formatCurrency(trends.savings.previous)}</p>
                    <p
                      className={
                        trends.savings.change >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {trends.savings.change >= 0 ? "+" : ""}
                      {formatCurrency(trends.savings.change)}(
                      {formatPercentage(trends.savings.changePercentage)})
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Patrimônio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {formatCurrency(trends.netWorth.current)}
                    </span>
                    {getTrendIcon(trends.netWorth.trend)}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Anterior: {formatCurrency(trends.netWorth.previous)}</p>
                    <p
                      className={
                        trends.netWorth.change >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {trends.netWorth.change >= 0 ? "+" : ""}
                      {formatCurrency(trends.netWorth.change)}(
                      {formatPercentage(trends.netWorth.changePercentage)})
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Categoria</CardTitle>
              <CardDescription>
                Acompanhe seus gastos por categoria e identifique padrões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryAnalysis.map((category, index) => (
                  <div
                    key={`performance-metric-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{category.category}</span>
                        {getTrendIcon(category.trend)}
                        <Badge variant="outline" className="text-xs">
                          {formatPercentage(category.percentageOfTotal)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>
                          Atual: {formatCurrency(category.currentMonth)}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Média: {formatCurrency(category.average3Months)}
                        </span>
                      </div>
                      {category.recommendation && (
                        <p className="text-xs text-orange-600 mt-1">
                          {category.recommendation}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          category.variance >= 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {category.variance >= 0 ? "+" : ""}
                        {formatCurrency(category.variance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Previsão de Gastos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Próximo mês</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          predictions.nextMonthExpenses.predicted,
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Confiança: {predictions.nextMonthExpenses.confidence}%
                      </p>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-medium">Fatores considerados:</p>
                      {predictions.nextMonthExpenses.factors.map(
                        (factor, i) => (
                          <p key={i} className="text-gray-600">
                            • {factor}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Projeção de Poupança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">1 mês:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          predictions.savingsProjection.nextMonth,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">3 meses:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          predictions.savingsProjection.next3Months,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">6 meses:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          predictions.savingsProjection.next6Months,
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Confiança: {predictions.savingsProjection.confidence}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Previsão de Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.goalCompletionDates.map((goal, index) => (
                      <div
                        key={`recommendation-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{goal.goalName}</p>
                          <p className="text-sm text-gray-600">
                            Progresso: {formatPercentage(goal.currentProgress)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Date(goal.predictedDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Confiança: {goal.confidence}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {predictions.budgetRisks.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Riscos Orçamentários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {predictions.budgetRisks.map((risk, index) => (
                        <Alert key={`alert-${index}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{risk.category}</p>
                                <p className="text-sm">{risk.description}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  {risk.suggestedAction}
                                </p>
                              </div>
                              <Badge className={getRiskColor(risk.riskLevel)}>
                                {risk.riskLevel === "high"
                                  ? "Alto"
                                  : risk.riskLevel === "medium"
                                    ? "Médio"
                                    : "Baixo"}
                              </Badge>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recomendações Personalizadas
              </CardTitle>
              <CardDescription>
                Sugestões baseadas na sua situação financeira atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recommendations.map((recommendation, index) => (
                  <Alert key={`warning-${index}`}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}

                {metrics.recommendations.length === 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Parabéns! Sua situação financeira está muito boa. Continue
                      assim!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metric Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Progress
                    value={metrics.cashFlowHealth.score}
                    className="flex-1"
                  />
                  <span
                    className={`font-bold ${getScoreColor(metrics.cashFlowHealth.score)}`}
                  >
                    {metrics.cashFlowHealth.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.cashFlowHealth.recommendation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Eficiência Orçamentária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Progress
                    value={metrics.budgetEfficiency.score}
                    className="flex-1"
                  />
                  <span
                    className={`font-bold ${getScoreColor(metrics.budgetEfficiency.score)}`}
                  >
                    {metrics.budgetEfficiency.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.budgetEfficiency.recommendation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso das Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Progress
                    value={metrics.goalProgress.score}
                    className="flex-1"
                  />
                  <span
                    className={`font-bold ${getScoreColor(metrics.goalProgress.score)}`}
                  >
                    {metrics.goalProgress.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.goalProgress.recommendation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Performance dos Investimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Progress
                    value={metrics.investmentPerformance.score}
                    className="flex-1"
                  />
                  <span
                    className={`font-bold ${getScoreColor(metrics.investmentPerformance.score)}`}
                  >
                    {metrics.investmentPerformance.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.investmentPerformance.recommendation}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadPerformanceData} disabled={loading}>
          {loading ? "Carregando..." : "Atualizar Análise"}
        </Button>
      </div>
    </div>
  );
};

export default FinancialPerformanceDashboard;
