"use client";

import React, { useState, useEffect, memo } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Percent,
  Award,
  Zap,
  Brain,
  Eye,
  Download,
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
import smartBudgetEngine from "../lib/financial/smart-budget-engine";
import {
  useOptimizedMemo,
  useOptimizedCallback,
  withPerformanceOptimization,
  usePerformanceOptimization,
  financialCalculationOptimizer,
} from "../lib/performance-optimizer";

interface PerformanceMetrics {
  accuracy: number;
  efficiency: number;
  savings: number;
  goalAchievement: number;
  categoryOptimization: number;
  predictiveAccuracy: number;
}

interface BudgetTrend {
  month: string;
  planned: number;
  actual: number;
  variance: number;
  efficiency: number;
}

interface CategoryPerformance {
  name: string;
  budgeted: number;
  spent: number;
  variance: number;
  trend: "up" | "down" | "stable";
  score: number;
  color: string;
}

interface PredictionAccuracy {
  category: string;
  predicted: number;
  actual: number;
  accuracy: number;
  confidence: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const BudgetPerformanceAnalyzer = memo(() => {
  // Monitor de performance
  usePerformanceOptimization("BudgetPerformanceAnalyzer");

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    accuracy: 0,
    efficiency: 0,
    savings: 0,
    goalAchievement: 0,
    categoryOptimization: 0,
    predictiveAccuracy: 0,
  });
  const [trends, setTrends] = useState<BudgetTrend[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<
    CategoryPerformance[]
  >([]);
  const [predictions, setPredictions] = useState<PredictionAccuracy[]>([]);
  const [timeRange, setTimeRange] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);

  // Carregamento otimizado de dados com cache
  const loadPerformanceData = useOptimizedCallback(
    async () => {
      try {
        setIsLoading(true);

        // Usar otimizador de cálculos financeiros
        // Carregar dados reais de relatórios
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth() -
            (timeRange === "12months"
              ? 11
              : timeRange === "24months"
                ? 23
                : timeRange === "6months"
                  ? 5
                  : 2),
          1,
        );
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const [cashFlowRes, categoryRes] = await Promise.all([
          fetch(
            `/api/reports/cash-flow?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
          ),
          fetch(
            `/api/reports/category-spending?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`,
          ),
        ]);
        if (!cashFlowRes.ok || !categoryRes.ok)
          throw new Error("Falha ao carregar relatórios");
        const cashFlow = await cashFlowRes.json();
        const categoryData = await categoryRes.json();

        setMetrics({
          accuracy: 0,
          efficiency: 0,
          savings: 0,
          goalAchievement: 0,
          categoryOptimization: 0,
          predictiveAccuracy: 0,
        });
        setTrends(
          (cashFlow.monthly || []).map((m: any) => ({
            month: m.month,
            planned: m.income || 0,
            actual: m.expenses || 0,
            variance: (m.income || 0) - (m.expenses || 0),
            efficiency: m.income
              ? Math.min(
                  100,
                  Math.max(0, ((m.income - m.expenses) / m.income) * 100),
                )
              : 0,
          })),
        );
        setCategoryPerformance(
          (categoryData.items || []).map((c: any, idx: number) => ({
            name: c.category || c.name || "Outros",
            budgeted: c.budgeted || 0,
            spent: Math.abs(c.amount || 0),
            variance: (c.budgeted || 0) - Math.abs(c.amount || 0),
            trend: "stable",
            score: 0,
            color: COLORS[idx % COLORS.length],
          })),
        );
        setPredictions([]);
      } catch (error) {
        logComponents.error("Erro ao carregar dados de performance:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [timeRange],
    300,
  ); // Debounce de 300ms

  // Funções memoizadas para evitar recálculos
  const getMetricColor = useOptimizedMemo((value: number) => {
    if (value >= 90) return "text-green-600";
    if (value >= 75) return "text-yellow-600";
    return "text-red-600";
  }, []);

  const getMetricBadgeColor = useOptimizedMemo((value: number) => {
    if (value >= 90) return "default";
    if (value >= 75) return "secondary";
    return "destructive";
  }, []);

  const getTrendIcon = useOptimizedMemo((trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case "stable":
        return <Target className="h-4 w-4 text-blue-500" />;
    }
  }, []);

  const exportReport = useOptimizedCallback(
    () => {
      // Implementar exportação de relatório
      console.log("Exportando relatório de performance...");
    },
    [],
    500,
  ); // Debounce de 500ms

  // Effect otimizado para carregamento de dados
  useEffect(() => {
    loadPerformanceData();
  }, [timeRange, loadPerformanceData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análise de Performance</h1>
          <p className="text-gray-600">
            Métricas avançadas do sistema de orçamento inteligente
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Último ano</SelectItem>
              <SelectItem value="24months">Últimos 2 anos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-blue-600" />
              <Badge variant={getMetricBadgeColor(metrics.accuracy)}>
                {metrics.accuracy.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm font-medium">Precisão</p>
            <p className="text-xs text-gray-600">Orçamento vs Real</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <Badge variant={getMetricBadgeColor(metrics.efficiency)}>
                {metrics.efficiency.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm font-medium">Eficiência</p>
            <p className="text-xs text-gray-600">Uso do orçamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <Badge variant="default">{metrics.savings.toFixed(1)}%</Badge>
            </div>
            <p className="text-sm font-medium">Economia</p>
            <p className="text-xs text-gray-600">Vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-5 w-5 text-purple-600" />
              <Badge variant={getMetricBadgeColor(metrics.goalAchievement)}>
                {metrics.goalAchievement.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm font-medium">Metas</p>
            <p className="text-xs text-gray-600">Alcance de objetivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <Badge
                variant={getMetricBadgeColor(metrics.categoryOptimization)}
              >
                {metrics.categoryOptimization.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm font-medium">Otimização</p>
            <p className="text-xs text-gray-600">Categorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <Badge variant={getMetricBadgeColor(metrics.predictiveAccuracy)}>
                {metrics.predictiveAccuracy.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-sm font-medium">Predição IA</p>
            <p className="text-xs text-gray-600">Precisão do modelo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="categories">
            Performance por Categoria
          </TabsTrigger>
          <TabsTrigger value="predictions">Precisão das Previsões</TabsTrigger>
          <TabsTrigger value="optimization">Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: any) => [
                        `R$ ${value.toLocaleString("pt-BR")}`,
                        "",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="planned"
                      stroke="#8884d8"
                      name="Planejado"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#82ca9d"
                      name="Real"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, "Eficiência"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#0088FE"
                      fill="#0088FE"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryPerformance.map((category) => {
                    const utilizationPercentage =
                      (category.spent / category.budgeted) * 100;

                    return (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                            {getTrendIcon(category.trend)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getMetricBadgeColor(category.score)}
                            >
                              {category.score}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              R$ {category.spent.toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={Math.min(utilizationPercentage, 100)}
                          className={`h-2 ${
                            utilizationPercentage > 100
                              ? "bg-red-100"
                              : utilizationPercentage > 90
                                ? "bg-yellow-100"
                                : "bg-green-100"
                          }`}
                        />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>
                            {utilizationPercentage.toFixed(1)}% utilizado
                          </span>
                          <span>
                            {category.variance > 0 ? "+" : ""}R${" "}
                            {category.variance.toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="spent"
                    >
                      {categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `R$ ${value.toLocaleString("pt-BR")}`,
                        "Gasto",
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Precisão das Previsões de IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.map((prediction) => (
                  <div
                    key={prediction.category}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{prediction.category}</h4>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getMetricBadgeColor(prediction.accuracy)}
                        >
                          {prediction.accuracy.toFixed(1)}% precisão
                        </Badge>
                        <Badge variant="outline">
                          {prediction.confidence}% confiança
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Previsto</p>
                        <p className="font-medium">
                          R$ {prediction.predicted.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Real</p>
                        <p className="font-medium">
                          R$ {prediction.actual.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Diferença</p>
                        <p
                          className={`font-medium ${
                            Math.abs(prediction.predicted - prediction.actual) <
                            50
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R${" "}
                          {Math.abs(
                            prediction.predicted - prediction.actual,
                          ).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <Progress
                      value={prediction.accuracy}
                      className="mt-3 h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Oportunidades de Otimização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-l-green-500 bg-green-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">
                          Categoria Alimentação
                        </h4>
                        <p className="text-green-700 text-sm mt-1">
                          Excelente controle! Você está economizando R$ 50 por
                          mês nesta categoria.
                        </p>
                        <p className="text-green-600 text-xs mt-2">
                          <strong>Sugestão:</strong> Considere realocar parte
                          desta economia para investimentos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">
                          Categoria Lazer
                        </h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          Gastos 20% acima do orçado. Tendência de alta nos
                          últimos 3 meses.
                        </p>
                        <p className="text-yellow-600 text-xs mt-2">
                          <strong>Sugestão:</strong> Revisar orçamento ou
                          implementar controles mais rígidos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">
                          Otimização Automática
                        </h4>
                        <p className="text-blue-700 text-sm mt-1">
                          A IA identificou padrões sazonais em suas compras.
                          Ajuste automático sugerido para dezembro.
                        </p>
                        <p className="text-blue-600 text-xs mt-2">
                          <strong>Ação:</strong> Aumentar orçamento de presentes
                          em 30% e reduzir lazer em 15%.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-l-purple-500 bg-purple-50 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-800">
                          Meta de Economia
                        </h4>
                        <p className="text-purple-700 text-sm mt-1">
                          Com os ajustes sugeridos, você pode aumentar sua taxa
                          de economia de 15% para 22%.
                        </p>
                        <p className="text-purple-600 text-xs mt-2">
                          <strong>Impacto:</strong> R$ 350 adicionais por mês
                          para seus objetivos financeiros.
                        </p>
                      </div>
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
});

BudgetPerformanceAnalyzer.displayName = "BudgetPerformanceAnalyzer";

export default withPerformanceOptimization(BudgetPerformanceAnalyzer, {
  displayName: "BudgetPerformanceAnalyzer",
  enableProfiling: process.env.NODE_ENV === "development",
});
