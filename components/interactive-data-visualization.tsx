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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  Filter,
  Download,
  Settings,
  Eye,
  Maximize2,
  RefreshCw,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Zap,
  Users,
  Globe,
  Layers,
  Grid3X3,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
  ComposedChart,
} from "recharts";
import { toast } from "sonner";

interface DataPoint {
  name: string;
  value: number;
  category?: string;
  date?: string;
  [key: string]: any;
}

interface ChartConfig {
  type:
    | "line"
    | "area"
    | "bar"
    | "pie"
    | "scatter"
    | "radar"
    | "treemap"
    | "funnel"
    | "composed";
  title: string;
  dataKey: string;
  color: string;
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  animated: boolean;
  stacked?: boolean;
  smooth?: boolean;
  fill?: boolean;
}

interface FilterConfig {
  dateRange: { start: string; end: string };
  categories: string[];
  valueRange: { min: number; max: number };
  groupBy: "day" | "week" | "month" | "quarter" | "year";
  aggregation: "sum" | "avg" | "count" | "min" | "max";
}

const CHART_COLORS = [
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
  "#F43F5E",
  "#06B6D4",
  "#8B5A2B",
  "#7C3AED",
  "#DC2626",
];

const SAMPLE_DATA = [
  {
    name: "Jan",
    receitas: 4500,
    despesas: 3200,
    poupanca: 1300,
    categoria: "Mensal",
    date: "2024-01",
  },
  {
    name: "Fev",
    receitas: 4800,
    despesas: 3400,
    poupanca: 1400,
    categoria: "Mensal",
    date: "2024-02",
  },
  {
    name: "Mar",
    receitas: 4200,
    despesas: 3800,
    poupanca: 400,
    categoria: "Mensal",
    date: "2024-03",
  },
  {
    name: "Abr",
    receitas: 5100,
    despesas: 3600,
    poupanca: 1500,
    categoria: "Mensal",
    date: "2024-04",
  },
  {
    name: "Mai",
    receitas: 4900,
    despesas: 3300,
    poupanca: 1600,
    categoria: "Mensal",
    date: "2024-05",
  },
  {
    name: "Jun",
    receitas: 5300,
    despesas: 3700,
    poupanca: 1600,
    categoria: "Mensal",
    date: "2024-06",
  },
];

const CATEGORY_DATA = [
  { name: "Alimentação", value: 1200, color: CHART_COLORS[0] },
  { name: "Transporte", value: 800, color: CHART_COLORS[1] },
  { name: "Moradia", value: 1500, color: CHART_COLORS[2] },
  { name: "Saúde", value: 400, color: CHART_COLORS[3] },
  { name: "Entretenimento", value: 600, color: CHART_COLORS[4] },
  { name: "Educação", value: 300, color: CHART_COLORS[5] },
  { name: "Outros", value: 200, color: CHART_COLORS[6] },
];

const INVESTMENT_DATA = [
  { name: "Ações", rentabilidade: 12.5, risco: 8, valor: 15000 },
  { name: "Fundos", rentabilidade: 8.2, risco: 5, valor: 25000 },
  { name: "Renda Fixa", rentabilidade: 6.1, risco: 2, valor: 30000 },
  { name: "Cripto", rentabilidade: 25.8, risco: 10, valor: 5000 },
  { name: "Imóveis", rentabilidade: 9.3, risco: 4, valor: 80000 },
];

export default function InteractiveDataVisualization() {
  const [selectedChart, setSelectedChart] = useState<ChartConfig>({
    type: "line",
    title: "Fluxo Financeiro Mensal",
    dataKey: "receitas",
    color: CHART_COLORS[0],
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animated: true,
    smooth: true,
  });

  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: { start: "2024-01", end: "2024-06" },
    categories: [],
    valueRange: { min: 0, max: 10000 },
    groupBy: "month",
    aggregation: "sum",
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState([30]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simular atualização de dados
        toast.success("Dados atualizados automaticamente");
      }, refreshInterval[0] * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const renderChart = () => {
    const commonProps = {
      data: SAMPLE_DATA,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (selectedChart.type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {selectedChart.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            {selectedChart.showTooltip && <Tooltip />}
            {selectedChart.showLegend && <Legend />}
            <Line
              type={selectedChart.smooth ? "monotone" : "linear"}
              dataKey="receitas"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[0] }}
              animationDuration={selectedChart.animated ? 1000 : 0}
            />
            <Line
              type={selectedChart.smooth ? "monotone" : "linear"}
              dataKey="despesas"
              stroke={CHART_COLORS[1]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[1] }}
              animationDuration={selectedChart.animated ? 1000 : 0}
            />
            <Line
              type={selectedChart.smooth ? "monotone" : "linear"}
              dataKey="poupanca"
              stroke={CHART_COLORS[2]}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS[2] }}
              animationDuration={selectedChart.animated ? 1000 : 0}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {selectedChart.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            {selectedChart.showTooltip && <Tooltip />}
            {selectedChart.showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="receitas"
              stackId="1"
              stroke={CHART_COLORS[0]}
              fill={CHART_COLORS[0]}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stackId="1"
              stroke={CHART_COLORS[1]}
              fill={CHART_COLORS[1]}
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {selectedChart.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            {selectedChart.showTooltip && <Tooltip />}
            {selectedChart.showLegend && <Legend />}
            <Bar dataKey="receitas" fill={CHART_COLORS[0]} />
            <Bar dataKey="despesas" fill={CHART_COLORS[1]} />
            <Bar dataKey="poupanca" fill={CHART_COLORS[2]} />
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={CATEGORY_DATA}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {CATEGORY_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {selectedChart.showTooltip && <Tooltip />}
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart {...commonProps} data={INVESTMENT_DATA}>
            {selectedChart.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="risco" name="Risco" />
            <YAxis dataKey="rentabilidade" name="Rentabilidade" />
            {selectedChart.showTooltip && (
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            )}
            <Scatter
              name="Investimentos"
              data={INVESTMENT_DATA}
              fill={CHART_COLORS[0]}
            />
          </ScatterChart>
        );

      case "radar":
        return (
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            data={[
              { subject: "Receitas", A: 120, B: 110, fullMark: 150 },
              { subject: "Despesas", A: 98, B: 130, fullMark: 150 },
              { subject: "Poupança", A: 86, B: 130, fullMark: 150 },
              { subject: "Investimentos", A: 99, B: 100, fullMark: 150 },
              { subject: "Metas", A: 85, B: 90, fullMark: 150 },
              { subject: "Planejamento", A: 65, B: 85, fullMark: 150 },
            ]}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 150]} />
            <Radar
              name="Atual"
              dataKey="A"
              stroke={CHART_COLORS[0]}
              fill={CHART_COLORS[0]}
              fillOpacity={0.6}
            />
            <Radar
              name="Meta"
              dataKey="B"
              stroke={CHART_COLORS[1]}
              fill={CHART_COLORS[1]}
              fillOpacity={0.6}
            />
            {selectedChart.showLegend && <Legend />}
          </RadarChart>
        );

      case "treemap":
        return (
          <Treemap
            data={CATEGORY_DATA}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill={CHART_COLORS[0]}
          />
        );

      case "composed":
        return (
          <ComposedChart {...commonProps}>
            {selectedChart.showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="name" />
            <YAxis />
            {selectedChart.showTooltip && <Tooltip />}
            {selectedChart.showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="receitas"
              fill={CHART_COLORS[0]}
              stroke={CHART_COLORS[0]}
              fillOpacity={0.3}
            />
            <Bar dataKey="despesas" barSize={20} fill={CHART_COLORS[1]} />
            <Line
              type="monotone"
              dataKey="poupanca"
              stroke={CHART_COLORS[2]}
              strokeWidth={3}
            />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  const exportChart = (format: "png" | "svg" | "pdf") => {
    // Implementação simplificada de exportação
    const chartData = {
      config: selectedChart,
      data: SAMPLE_DATA,
      filters,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chartData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chart-${format}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Gráfico exportado como ${format.toUpperCase()}!`);
  };

  return (
    <div
      className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-white p-6 overflow-auto" : ""}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Visualização Interativa de Dados
          </h1>
          <p className="text-gray-600 mt-2">
            Crie visualizações personalizadas e explore seus dados financeiros
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            {isFullscreen ? "Sair" : "Tela Cheia"}
          </Button>
          <Select
            onValueChange={(value) =>
              exportChart(value as "png" | "svg" | "pdf")
            }
          >
            <SelectTrigger className="w-32">
              <Download className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configurações do Gráfico */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Gráfico</Label>
                <Select
                  value={selectedChart.type}
                  onValueChange={(value) =>
                    setSelectedChart({ ...selectedChart, type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Linha</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="pie">Pizza</SelectItem>
                    <SelectItem value="scatter">Dispersão</SelectItem>
                    <SelectItem value="radar">Radar</SelectItem>
                    <SelectItem value="treemap">Treemap</SelectItem>
                    <SelectItem value="composed">Composto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título do Gráfico</Label>
                <Input
                  value={selectedChart.title}
                  onChange={(e) =>
                    setSelectedChart({
                      ...selectedChart,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mostrar Grade</Label>
                  <Switch
                    checked={selectedChart.showGrid}
                    onCheckedChange={(checked) =>
                      setSelectedChart({ ...selectedChart, showGrid: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mostrar Legenda</Label>
                  <Switch
                    checked={selectedChart.showLegend}
                    onCheckedChange={(checked) =>
                      setSelectedChart({
                        ...selectedChart,
                        showLegend: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Animação</Label>
                  <Switch
                    checked={selectedChart.animated}
                    onCheckedChange={(checked) =>
                      setSelectedChart({ ...selectedChart, animated: checked })
                    }
                  />
                </div>
                {selectedChart.type === "line" && (
                  <div className="flex items-center justify-between">
                    <Label>Linha Suave</Label>
                    <Switch
                      checked={selectedChart.smooth}
                      onCheckedChange={(checked) =>
                        setSelectedChart({ ...selectedChart, smooth: checked })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Auto-refresh</Label>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
                {autoRefresh && (
                  <div>
                    <Label>Intervalo (segundos): {refreshInterval[0]}</Label>
                    <Slider
                      value={refreshInterval}
                      onValueChange={setRefreshInterval}
                      max={300}
                      min={10}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          {showFilters && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="month"
                      value={filters.dateRange.start}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            start: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      type="month"
                      value={filters.dateRange.end}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateRange: {
                            ...filters.dateRange,
                            end: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Agrupar por</Label>
                  <Select
                    value={filters.groupBy}
                    onValueChange={(value) =>
                      setFilters({ ...filters, groupBy: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Agregação</Label>
                  <Select
                    value={filters.aggregation}
                    onValueChange={(value) =>
                      setFilters({ ...filters, aggregation: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sum">Soma</SelectItem>
                      <SelectItem value="avg">Média</SelectItem>
                      <SelectItem value="count">Contagem</SelectItem>
                      <SelectItem value="min">Mínimo</SelectItem>
                      <SelectItem value="max">Máximo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área do Gráfico */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{selectedChart.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {selectedChart.type.charAt(0).toUpperCase() +
                      selectedChart.type.slice(1)}
                  </Badge>
                  {autoRefresh && (
                    <Badge variant="default" className="animate-pulse">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Auto
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Pontos</p>
                    <p className="text-2xl font-bold">{SAMPLE_DATA.length}</p>
                  </div>
                  <Grid3X3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Média Receitas</p>
                    <p className="text-2xl font-bold">R$ 4.8k</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Variação</p>
                    <p className="text-2xl font-bold">+12.5%</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Última Atualização</p>
                    <p className="text-sm font-medium">Agora</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
