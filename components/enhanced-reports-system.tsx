"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  FileText,
  Table,
  Image,
  Share2,
  Settings,
  Eye,
  Calendar,
  DollarSign,
  Target,
  Briefcase,
  CreditCard,
  Users,
  MapPin,
  Tag,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
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
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { toast } from "sonner";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";

interface ReportConfig {
  title: string;
  description: string;
  dateRange: string;
  customStartDate?: Date;
  customEndDate?: Date;
  categories: string[];
  accounts: string[];
  reportTypes: string[];
  visualizations: string[];
  includeCharts: boolean;
  includeTables: boolean;
  includeInsights: boolean;
  groupBy: "day" | "week" | "month" | "quarter" | "year";
  currency: string;
  language: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    transactionCount: number;
    averageTransaction: number;
    topCategory: string;
    savingsRate: number;
  };
  trends: ChartData[];
  categoryBreakdown: ChartData[];
  monthlyFlow: ChartData[];
  accountBalances: ChartData[];
  expensesByTag: ChartData[];
  incomeVsExpenses: ChartData[];
  budgetPerformance: ChartData[];
  goalProgress: ChartData[];
  investmentGrowth: ChartData[];
  cashFlowProjection: ChartData[];
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

const CHART_TYPES = [
  { id: "line", name: "Gráfico de Linha", icon: TrendingUp },
  { id: "area", name: "Gráfico de Área", icon: BarChart3 },
  { id: "bar", name: "Gráfico de Barras", icon: BarChart3 },
  { id: "pie", name: "Gráfico de Pizza", icon: PieChart },
  { id: "scatter", name: "Gráfico de Dispersão", icon: Target },
  { id: "radar", name: "Gráfico Radar", icon: Target },
  { id: "treemap", name: "Mapa de Árvore", icon: Target },
  { id: "funnel", name: "Gráfico Funil", icon: Target },
];

const EXPORT_FORMATS = [
  { id: "pdf", name: "PDF", icon: FileText, description: "Documento portátil" },
  { id: "excel", name: "Excel", icon: Table, description: "Planilha editável" },
  { id: "csv", name: "CSV", icon: Table, description: "Dados tabulares" },
  {
    id: "json",
    name: "JSON",
    icon: FileText,
    description: "Dados estruturados",
  },
  { id: "png", name: "PNG", icon: Image, description: "Imagem dos gráficos" },
  { id: "html", name: "HTML", icon: FileText, description: "Página web" },
];

export default function EnhancedReportsSystem() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    title: "Relatório Financeiro Personalizado",
    description: "Análise detalhada das finanças pessoais",
    dateRange: "current-month",
    categories: [],
    accounts: [],
    reportTypes: ["summary", "trends", "categories"],
    visualizations: ["line", "pie", "bar"],
    includeCharts: true,
    includeTables: true,
    includeInsights: true,
    groupBy: "month",
    currency: "BRL",
    language: "pt-BR",
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const availableCategories = [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Educação",
    "Entretenimento",
    "Compras",
    "Investimentos",
    "Poupança",
    "Outros",
  ];

  const availableAccounts = [
    "Conta Corrente",
    "Conta Poupança",
    "Cartão de Crédito",
    "Investimentos",
    "Dinheiro",
    "Outros",
  ];

  useEffect(() => {
    generateReport();
  }, [reportConfig.dateRange, reportConfig.categories, reportConfig.accounts]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Simular geração de dados do relatório
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Dados de exemplo removidos
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: string) => {
    if (!reportData) return;

    setIsExporting(true);
    try {
      switch (format) {
        case "pdf":
          await exportToPDF();
          break;
        case "excel":
          await exportToExcel();
          break;
        case "csv":
          await exportToCSV();
          break;
        case "json":
          await exportToJSON();
          break;
        case "png":
          await exportToPNG();
          break;
        case "html":
          await exportToHTML();
          break;
        default:
          toast.error("Formato não suportado");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text(reportConfig.title, 20, 30);
    pdf.setFontSize(12);
    pdf.text(reportConfig.description, 20, 45);
    pdf.text(`Período: ${reportConfig.dateRange}`, 20, 60);

    // Adicionar dados do resumo
    if (reportData) {
      pdf.text(
        `Receitas Totais: R$ ${reportData.summary.totalIncome.toLocaleString()}`,
        20,
        80,
      );
      pdf.text(
        `Despesas Totais: R$ ${reportData.summary.totalExpenses.toLocaleString()}`,
        20,
        95,
      );
      pdf.text(
        `Saldo Líquido: R$ ${reportData.summary.netBalance.toLocaleString()}`,
        20,
        110,
      );
      pdf.text(`Taxa de Poupança: ${reportData.summary.savingsRate}%`, 20, 125);
    }

    pdf.save(`${reportConfig.title.replace(/\s+/g, "_")}.pdf`);
    toast.success("Relatório PDF exportado com sucesso!");
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório Financeiro");

    // Cabeçalho
    worksheet.addRow([reportConfig.title]);
    worksheet.addRow([reportConfig.description]);
    worksheet.addRow([]);

    // Resumo
    if (reportData) {
      worksheet.addRow(["RESUMO FINANCEIRO"]);
      worksheet.addRow(["Receitas Totais", reportData.summary.totalIncome]);
      worksheet.addRow(["Despesas Totais", reportData.summary.totalExpenses]);
      worksheet.addRow(["Saldo Líquido", reportData.summary.netBalance]);
      worksheet.addRow([
        "Taxa de Poupança (%)",
        reportData.summary.savingsRate,
      ]);
      worksheet.addRow([]);

      // Breakdown por categoria
      worksheet.addRow(["GASTOS POR CATEGORIA"]);
      worksheet.addRow(["Categoria", "Valor"]);
      reportData.categoryBreakdown.forEach((item) => {
        worksheet.addRow([item.name, item.value]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.title.replace(/\s+/g, "_")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportToCSV = async () => {
    if (!reportData) return;

    let csvContent = `${reportConfig.title}\n${reportConfig.description}\n\n`;
    csvContent += "Categoria,Valor\n";
    reportData.categoryBreakdown.forEach((item) => {
      csvContent += `${item.name},${item.value}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.title.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado com sucesso!");
  };

  const exportToJSON = async () => {
    const exportData = {
      config: reportConfig,
      data: reportData,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.title.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório JSON exportado com sucesso!");
  };

  const exportToPNG = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.title.replace(/\s+/g, "_")}.png`;
    a.click();
    toast.success("Imagem do relatório exportada com sucesso!");
  };

  const exportToHTML = async () => {
    if (!reportRef.current) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportConfig.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportConfig.title}</h1>
          <p>${reportConfig.description}</p>
        </div>
        ${reportRef.current.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.title.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório HTML exportado com sucesso!");
  };

  const renderChart = (data: ChartData[], type: string, title: string) => {
    const chartProps = {
      width: 400,
      height: 300,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data}
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
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Tipo de gráfico não suportado</div>;
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Gerando relatório personalizado...</p>
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
            <BarChart3 className="w-8 h-8" />
            Sistema de Relatórios Avançados
          </h1>
          <p className="text-gray-600 mt-2">
            Crie relatórios personalizados com visualizações avançadas e
            exportação em múltiplos formatos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
          </Button>
          <Button onClick={generateReport} disabled={isGenerating}>
            <Eye className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Configuração do Relatório */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuração do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título do Relatório</Label>
                <Input
                  id="title"
                  value={reportConfig.title}
                  onChange={(e) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={reportConfig.description}
                  onChange={(e) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Período</Label>
                <Select
                  value={reportConfig.dateRange}
                  onValueChange={(value) =>
                    setReportConfig((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Mês Atual</SelectItem>
                    <SelectItem value="last-month">Mês Passado</SelectItem>
                    <SelectItem value="last-3-months">
                      Últimos 3 Meses
                    </SelectItem>
                    <SelectItem value="last-6-months">
                      Últimos 6 Meses
                    </SelectItem>
                    <SelectItem value="current-year">Ano Atual</SelectItem>
                    <SelectItem value="last-year">Ano Passado</SelectItem>
                    <SelectItem value="custom">
                      Período Personalizado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agrupar Por</Label>
                <Select
                  value={reportConfig.groupBy}
                  onValueChange={(value: any) =>
                    setReportConfig((prev) => ({ ...prev, groupBy: value }))
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
                <Label>Tipo de Gráfico</Label>
                <Select
                  value={selectedChartType}
                  onValueChange={setSelectedChartType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map((chart) => (
                      <SelectItem key={chart.id} value={chart.id}>
                        {chart.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Categorias (deixe vazio para incluir todas)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableCategories.map((category) => (
                    <Badge
                      key={category}
                      variant={
                        reportConfig.categories.includes(category)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setReportConfig((prev) => ({
                          ...prev,
                          categories: prev.categories.includes(category)
                            ? prev.categories.filter((c) => c !== category)
                            : [...prev.categories, category],
                        }));
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Contas (deixe vazio para incluir todas)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableAccounts.map((account) => (
                    <Badge
                      key={account}
                      variant={
                        reportConfig.accounts.includes(account)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setReportConfig((prev) => ({
                          ...prev,
                          accounts: prev.accounts.includes(account)
                            ? prev.accounts.filter((a) => a !== account)
                            : [...prev.accounts, account],
                        }));
                      }}
                    >
                      {account}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={reportConfig.includeCharts}
                  onCheckedChange={(checked) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      includeCharts: !!checked,
                    }))
                  }
                />
                <Label htmlFor="includeCharts">Incluir Gráficos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTables"
                  checked={reportConfig.includeTables}
                  onCheckedChange={(checked) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      includeTables: !!checked,
                    }))
                  }
                />
                <Label htmlFor="includeTables">Incluir Tabelas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInsights"
                  checked={reportConfig.includeInsights}
                  onCheckedChange={(checked) =>
                    setReportConfig((prev) => ({
                      ...prev,
                      includeInsights: !!checked,
                    }))
                  }
                />
                <Label htmlFor="includeInsights">Incluir Insights</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXPORT_FORMATS.map((format) => (
              <Button
                key={format.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => exportReport(format.id)}
                disabled={isExporting}
              >
                <format.icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium">{format.name}</div>
                  <div className="text-xs text-gray-500">
                    {format.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relatório Gerado */}
      {reportData && (
        <div ref={reportRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{reportConfig.title}</CardTitle>
              <p className="text-gray-600">{reportConfig.description}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {reportData.summary.totalIncome.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Receitas Totais</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    R$ {reportData.summary.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Despesas Totais</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {reportData.summary.netBalance.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Saldo Líquido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {reportData.summary.savingsRate}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Poupança</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="goals">Metas</TabsTrigger>
              <TabsTrigger value="projections">Projeções</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Fluxo de Caixa Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChart(
                      reportData.monthlyFlow,
                      selectedChartType,
                      "Fluxo de Caixa",
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChart(
                      reportData.categoryBreakdown,
                      "pie",
                      "Categorias",
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências Financeiras</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart(reportData.trends, "line", "Tendências")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gastos por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderChart(
                      reportData.categoryBreakdown,
                      "bar",
                      "Categorias",
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Performance do Orçamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.budgetPerformance.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              R$ {item.actual.toLocaleString()} / R${" "}
                              {item.budgeted.toLocaleString()}
                            </span>
                            <Badge
                              variant={
                                item.variance >= 0 ? "default" : "destructive"
                              }
                            >
                              {item.variance >= 0 ? "+" : ""}R${" "}
                              {item.variance.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso das Metas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.goalProgress.map((goal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{goal.name}</span>
                          <span className="text-sm text-gray-600">
                            R$ {goal.current.toLocaleString()} / R${" "}
                            {goal.target.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={goal.percentage} className="h-2" />
                        <div className="text-sm text-gray-600">
                          {goal.percentage.toFixed(1)}% concluído
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projeções de Fluxo de Caixa</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.cashFlowProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        stroke={COLORS[0]}
                        strokeWidth={2}
                        name="Projetado"
                      />
                      <Line
                        type="monotone"
                        dataKey="optimistic"
                        stroke={COLORS[2]}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        name="Otimista"
                      />
                      <Line
                        type="monotone"
                        dataKey="pessimistic"
                        stroke={COLORS[1]}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        name="Pessimista"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
