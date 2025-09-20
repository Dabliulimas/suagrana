"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  Activity,
  DollarSign,
  Calendar,
  Users,
  Lightbulb,
  Shield,
  Award,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Filter,
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
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { toast } from "sonner";

interface MLInsight {
  id: string;
  type: "prediction" | "anomaly" | "pattern" | "recommendation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  category: string;
  actionable: boolean;
  data?: any;
}

interface PredictiveModel {
  name: string;
  accuracy: number;
  lastTrained: Date;
  predictions: {
    nextMonth: {
      income: number;
      expenses: number;
      savings: number;
      confidence: number;
    };
    trends: {
      direction: "up" | "down" | "stable";
      magnitude: number;
      probability: number;
    };
    risks: {
      cashFlow: number;
      overspending: number;
      goalMiss: number;
    };
  };
}

interface AnalyticsMetrics {
  dataQuality: number;
  modelPerformance: number;
  predictionAccuracy: number;
  anomalyDetection: number;
  patternRecognition: number;
  userEngagement: number;
}

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

export default function MLAnalyticsDashboard() {
  const [insights, setInsights] = useState<MLInsight[]>([]);
  const [predictiveModel, setPredictiveModel] =
    useState<PredictiveModel | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState("3months");
  const [selectedModel, setSelectedModel] = useState("ensemble");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAnalyticsData();

    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, selectedModel, autoRefresh]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reports/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(Array.isArray(data.items) ? data.items : []);
      } else {
        setInsights([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <TrendingUp className="w-5 h-5" />;
      case "anomaly":
        return <AlertTriangle className="w-5 h-5" />;
      case "pattern":
        return <Activity className="w-5 h-5" />;
      case "recommendation":
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string, impact: string) => {
    if (type === "anomaly") return "destructive";
    if (impact === "high") return "default";
    if (impact === "medium") return "secondary";
    return "outline";
  };

  const exportAnalytics = () => {
    const analyticsData = {
      insights,
      predictiveModel,
      metrics,
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      model: selectedModel,
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório de analytics exportado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Processando dados com IA...</p>
          <p className="text-sm text-gray-500 mt-1">
            Analisando padrões e gerando insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Analytics Avançado com IA
          </h1>
          <p className="text-gray-600 mt-2">
            Insights preditivos, detecção de anomalias e recomendações
            personalizadas
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-50 border-green-200" : ""}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto-refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas do Sistema */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualidade dos Dados</p>
                  <p className="text-2xl font-bold">{metrics.dataQuality}%</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <Progress value={metrics.dataQuality} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Performance do Modelo</p>
                  <p className="text-2xl font-bold">
                    {metrics.modelPerformance}%
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <Progress value={metrics.modelPerformance} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Precisão Preditiva</p>
                  <p className="text-2xl font-bold">
                    {metrics.predictionAccuracy}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <Progress value={metrics.predictionAccuracy} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Detecção de Anomalias</p>
                  <p className="text-2xl font-bold">
                    {metrics.anomalyDetection}%
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <Progress value={metrics.anomalyDetection} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Reconhecimento de Padrões
                  </p>
                  <p className="text-2xl font-bold">
                    {metrics.patternRecognition}%
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <Progress value={metrics.patternRecognition} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engajamento</p>
                  <p className="text-2xl font-bold">
                    {metrics.userEngagement}%
                  </p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <Progress value={metrics.userEngagement} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getInsightColor(insight.type, insight.impact)}
                      >
                        {insight.confidence}% confiança
                      </Badge>
                      <Badge variant="outline">
                        {insight.impact === "high"
                          ? "Alto"
                          : insight.impact === "medium"
                            ? "Médio"
                            : "Baixo"}{" "}
                        impacto
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{insight.description}</p>

                  {insight.data && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-2">Dados Detalhados:</h4>
                      <div className="text-sm space-y-1">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">
                              {key.replace("_", " ")}:
                            </span>
                            <span className="font-medium">
                              {typeof value === "number" && key.includes("R$")
                                ? `R$ ${value.toLocaleString()}`
                                : typeof value === "number" && key.includes("%")
                                  ? `${value}%`
                                  : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.actionable && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aplicar Sugestão
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictiveModel && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Previsões para Próximo Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Receitas Previstas:</span>
                      <span className="font-bold text-green-600">
                        R${" "}
                        {predictiveModel.predictions.nextMonth.income.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Despesas Previstas:</span>
                      <span className="font-bold text-red-600">
                        R${" "}
                        {predictiveModel.predictions.nextMonth.expenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Poupança Prevista:</span>
                      <span className="font-bold text-blue-600">
                        R${" "}
                        {predictiveModel.predictions.nextMonth.savings.toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span>Confiança da Previsão:</span>
                        <Badge variant="default">
                          {predictiveModel.predictions.nextMonth.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Análise de Riscos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Risco de Fluxo de Caixa:</span>
                        <span className="font-bold">
                          {predictiveModel.predictions.risks.cashFlow}%
                        </span>
                      </div>
                      <Progress
                        value={predictiveModel.predictions.risks.cashFlow}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Risco de Gastos Excessivos:</span>
                        <span className="font-bold">
                          {predictiveModel.predictions.risks.overspending}%
                        </span>
                      </div>
                      <Progress
                        value={predictiveModel.predictions.risks.overspending}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Risco de Não Atingir Metas:</span>
                        <span className="font-bold">
                          {predictiveModel.predictions.risks.goalMiss}%
                        </span>
                      </div>
                      <Progress
                        value={predictiveModel.predictions.risks.goalMiss}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Tendências Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        {predictiveModel.predictions.trends.direction ===
                        "up" ? (
                          <TrendingUp className="w-8 h-8 text-green-600" />
                        ) : predictiveModel.predictions.trends.direction ===
                          "down" ? (
                          <TrendingDown className="w-8 h-8 text-red-600" />
                        ) : (
                          <Activity className="w-8 h-8 text-gray-600" />
                        )}
                      </div>
                      <p className="font-medium">Direção da Tendência</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {predictiveModel.predictions.trends.direction === "up"
                          ? "Crescimento"
                          : predictiveModel.predictions.trends.direction ===
                              "down"
                            ? "Declínio"
                            : "Estável"}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {predictiveModel.predictions.trends.magnitude}%
                      </div>
                      <p className="font-medium">Magnitude</p>
                      <p className="text-sm text-gray-600">
                        Intensidade da mudança
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {predictiveModel.predictions.trends.probability}%
                      </div>
                      <p className="font-medium">Probabilidade</p>
                      <p className="text-sm text-gray-600">
                        Confiança na tendência
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {predictiveModel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Informações do Modelo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nome do Modelo</p>
                    <p className="font-medium">{predictiveModel.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Precisão Geral</p>
                    <p className="font-medium">{predictiveModel.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Último Treinamento</p>
                    <p className="font-medium">
                      {predictiveModel.lastTrained.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Configurações do Modelo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Algoritmo Principal
                      </label>
                      <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ensemble">
                            Ensemble (Random Forest + XGBoost)
                          </SelectItem>
                          <SelectItem value="neural">
                            Rede Neural Profunda
                          </SelectItem>
                          <SelectItem value="linear">
                            Regressão Linear Avançada
                          </SelectItem>
                          <SelectItem value="svm">
                            Support Vector Machine
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retreinar Modelo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { time: "00:00", accuracy: 84, predictions: 12 },
                      { time: "04:00", accuracy: 86, predictions: 8 },
                      { time: "08:00", accuracy: 88, predictions: 15 },
                      { time: "12:00", accuracy: 85, predictions: 22 },
                      { time: "16:00", accuracy: 87, predictions: 18 },
                      { time: "20:00", accuracy: 89, predictions: 14 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke={COLORS[0]}
                      name="Precisão (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="predictions"
                      stroke={COLORS[1]}
                      name="Previsões/hora"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Previsões", value: 35, color: COLORS[0] },
                        { name: "Anomalias", value: 25, color: COLORS[1] },
                        { name: "Padrões", value: 20, color: COLORS[2] },
                        { name: "Recomendações", value: 20, color: COLORS[3] },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: "Previsões", value: 35, color: COLORS[0] },
                        { name: "Anomalias", value: 25, color: COLORS[1] },
                        { name: "Padrões", value: 20, color: COLORS[2] },
                        { name: "Recomendações", value: 20, color: COLORS[3] },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
