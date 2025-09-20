"use client";

import { useState } from "react";
import { logComponents } from "../../../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

interface InvestmentExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioData: any[];
  dividendsData: any[];
  totalCurrentValue: number;
  totalInvested: number;
  totalReturn: number;
}

interface ExportOptions {
  format: "excel" | "pdf";
  includePositions: boolean;
  includeDividends: boolean;
  includePerformance: boolean;
  includeAllocation: boolean;
  includeTransactions: boolean;
  dateRange:
    | "all"
    | "ytd"
    | "last-12-months"
    | "last-6-months"
    | "last-3-months";
  groupBy: "none" | "type" | "sector" | "account";
}

const EXPORT_TEMPLATES = {
  complete: {
    name: "Relatório Completo",
    description: "Inclui todas as informações disponíveis",
    options: {
      includePositions: true,
      includeDividends: true,
      includePerformance: true,
      includeAllocation: true,
      includeTransactions: true,
    },
  },
  summary: {
    name: "Resumo Executivo",
    description: "Visão geral do portfólio e performance",
    options: {
      includePositions: true,
      includeDividends: false,
      includePerformance: true,
      includeAllocation: true,
      includeTransactions: false,
    },
  },
  dividends: {
    name: "Relatório de Dividendos",
    description: "Foco em proventos recebidos",
    options: {
      includePositions: false,
      includeDividends: true,
      includePerformance: false,
      includeAllocation: false,
      includeTransactions: false,
    },
  },
  tax: {
    name: "Relatório Fiscal",
    description: "Informações para declaração de IR",
    options: {
      includePositions: true,
      includeDividends: true,
      includePerformance: true,
      includeAllocation: false,
      includeTransactions: true,
    },
  },
};

export function InvestmentExport({
  open,
  onOpenChange,
  portfolioData,
  dividendsData,
  totalCurrentValue,
  totalInvested,
  totalReturn,
}: InvestmentExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "excel",
    includePositions: true,
    includeDividends: true,
    includePerformance: true,
    includeAllocation: true,
    includeTransactions: false,
    dateRange: "all",
    groupBy: "none",
  });
  const [isExporting, setIsExporting] = useState(false);

  const applyTemplate = (templateKey: keyof typeof EXPORT_TEMPLATES) => {
    const template = EXPORT_TEMPLATES[templateKey];
    setExportOptions((prev) => ({
      ...prev,
      ...template.options,
    }));
  };

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  const filterDataByDateRange = (data: any[], dateField: string = "date") => {
    if (exportOptions.dateRange === "all") return data;

    const now = new Date();
    let startDate: Date;

    switch (exportOptions.dateRange) {
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "last-12-months":
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
        );
        break;
      case "last-6-months":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate(),
        );
        break;
      case "last-3-months":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate(),
        );
        break;
      default:
        return data;
    }

    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  };

  const generateExcelData = () => {
    const workbook: any = { sheets: [] };

    // Resumo do Portfólio
    if (exportOptions.includePerformance) {
      const summaryData = [
        ["Resumo do Portfólio", ""],
        ["Data do Relatório", new Date().toLocaleDateString("pt-BR")],
        ["", ""],
        [
          "Valor Total Investido",
          `R$ ${totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Valor Atual do Portfólio",
          `R$ ${totalCurrentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Retorno Total",
          `R$ ${totalReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ],
        [
          "Retorno Percentual",
          `${((totalReturn / totalInvested) * 100).toFixed(2)}%`,
        ],
        ["Número de Posições", portfolioData.length.toString()],
      ];
      workbook.sheets.push({ name: "Resumo", data: summaryData });
    }

    // Posições
    if (exportOptions.includePositions) {
      const positionsHeaders = [
        "Ticker",
        "Nome",
        "Tipo",
        "Quantidade",
        "Preço Médio",
        "Preço Atual",
        "Valor Investido",
        "Valor Atual",
        "Retorno (R$)",
        "Retorno (%)",
        "Conta",
      ];

      const positionsData = [positionsHeaders];
      portfolioData.forEach((position) => {
        positionsData.push([
          position.ticker || "",
          position.name || "",
          position.type || "",
          position.quantity?.toString() || "0",
          `R$ ${(position.averagePrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `R$ ${(position.currentPrice || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `R$ ${(position.totalInvested || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `R$ ${(position.currentValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `R$ ${(position.totalReturn || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `${(position.returnPercent || 0).toFixed(2)}%`,
          position.account || "",
        ]);
      });

      workbook.sheets.push({ name: "Posições", data: positionsData });
    }

    // Dividendos
    if (exportOptions.includeDividends && dividendsData.length > 0) {
      const filteredDividends = filterDataByDateRange(
        dividendsData,
        "paymentDate",
      );
      const dividendsHeaders = [
        "Ticker",
        "Tipo",
        "Valor por Cota",
        "Quantidade",
        "Valor Total",
        "Data de Pagamento",
        "Data Ex-Dividendo",
      ];

      const dividendsDataFormatted = [dividendsHeaders];
      filteredDividends.forEach((dividend) => {
        dividendsDataFormatted.push([
          dividend.ticker || "",
          dividend.type || "",
          `R$ ${(dividend.valuePerShare || 0).toLocaleString("pt-BR", { minimumFractionDigits: 4 })}`,
          dividend.quantity?.toString() || "0",
          `R$ ${(dividend.totalValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          new Date(dividend.paymentDate).toLocaleDateString("pt-BR"),
          dividend.exDate
            ? new Date(dividend.exDate).toLocaleDateString("pt-BR")
            : "",
        ]);
      });

      workbook.sheets.push({
        name: "Dividendos",
        data: dividendsDataFormatted,
      });
    }

    // Alocação por Tipo
    if (exportOptions.includeAllocation) {
      const allocation: Record<string, { value: number; count: number }> = {};

      portfolioData.forEach((position) => {
        const type = position.type || "Outros";
        if (!allocation[type]) {
          allocation[type] = { value: 0, count: 0 };
        }
        allocation[type].value += position.currentValue || 0;
        allocation[type].count += 1;
      });

      const allocationHeaders = [
        "Tipo de Ativo",
        "Valor (R$)",
        "Percentual (%)",
        "Quantidade de Posições",
      ];
      const allocationData = [allocationHeaders];

      Object.entries(allocation).forEach(([type, data]) => {
        const percentage =
          totalCurrentValue > 0 ? (data.value / totalCurrentValue) * 100 : 0;
        allocationData.push([
          type,
          `R$ ${data.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `${percentage.toFixed(2)}%`,
          data.count.toString(),
        ]);
      });

      workbook.sheets.push({ name: "Alocação", data: allocationData });
    }

    return workbook;
  };

  const generatePDFData = () => {
    // Estrutura de dados para PDF
    return {
      title: "Relatório de Investimentos",
      date: new Date().toLocaleDateString("pt-BR"),
      summary: exportOptions.includePerformance
        ? {
            totalInvested,
            totalCurrentValue,
            totalReturn,
            returnPercent: (totalReturn / totalInvested) * 100,
            positionsCount: portfolioData.length,
          }
        : null,
      positions: exportOptions.includePositions ? portfolioData : null,
      dividends: exportOptions.includeDividends
        ? filterDataByDateRange(dividendsData, "paymentDate")
        : null,
      allocation: exportOptions.includeAllocation ? portfolioData : null,
    };
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportOptions.format === "excel") {
        const workbookData = generateExcelData();

        // Simular exportação Excel (em produção, usar biblioteca como xlsx)
        const jsonData = JSON.stringify(workbookData, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `investimentos-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Relatório Excel exportado com sucesso!");
      } else {
        const pdfData = generatePDFData();

        // Simular exportação PDF (em produção, usar biblioteca como jsPDF)
        const jsonData = JSON.stringify(pdfData, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `investimentos-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("Relatório PDF exportado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao exportar relatório");
      logComponents.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Relatório de Investimentos
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Modelos</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(EXPORT_TEMPLATES).map(([key, template]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    applyTemplate(key as keyof typeof EXPORT_TEMPLATES)
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(template.options).map(
                        ([option, enabled]) =>
                          enabled && (
                            <Badge
                              key={option}
                              variant="secondary"
                              className="text-xs"
                            >
                              {option === "includePositions" && "Posições"}
                              {option === "includeDividends" && "Dividendos"}
                              {option === "includePerformance" && "Performance"}
                              {option === "includeAllocation" && "Alocação"}
                              {option === "includeTransactions" && "Transações"}
                            </Badge>
                          ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Formato e Conteúdo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Formato do Arquivo</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value: "excel" | "pdf") =>
                        updateOption("format", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel (.xlsx)
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            PDF (.pdf)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Incluir no Relatório</Label>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="positions"
                        checked={exportOptions.includePositions}
                        onCheckedChange={(checked) =>
                          updateOption("includePositions", checked)
                        }
                      />
                      <Label
                        htmlFor="positions"
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Posições do Portfólio
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dividends"
                        checked={exportOptions.includeDividends}
                        onCheckedChange={(checked) =>
                          updateOption("includeDividends", checked)
                        }
                      />
                      <Label
                        htmlFor="dividends"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Histórico de Dividendos
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="performance"
                        checked={exportOptions.includePerformance}
                        onCheckedChange={(checked) =>
                          updateOption("includePerformance", checked)
                        }
                      />
                      <Label
                        htmlFor="performance"
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Análise de Performance
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allocation"
                        checked={exportOptions.includeAllocation}
                        onCheckedChange={(checked) =>
                          updateOption("includeAllocation", checked)
                        }
                      />
                      <Label
                        htmlFor="allocation"
                        className="flex items-center gap-2"
                      >
                        <PieChart className="w-4 h-4" />
                        Alocação de Ativos
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Filtros e Agrupamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Período dos Dados</Label>
                    <Select
                      value={exportOptions.dateRange}
                      onValueChange={(value) =>
                        updateOption("dateRange", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="ytd">Ano atual (YTD)</SelectItem>
                        <SelectItem value="last-12-months">
                          Últimos 12 meses
                        </SelectItem>
                        <SelectItem value="last-6-months">
                          Últimos 6 meses
                        </SelectItem>
                        <SelectItem value="last-3-months">
                          Últimos 3 meses
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Agrupar Por</Label>
                    <Select
                      value={exportOptions.groupBy}
                      onValueChange={(value) => updateOption("groupBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem agrupamento</SelectItem>
                        <SelectItem value="type">Tipo de ativo</SelectItem>
                        <SelectItem value="sector">Setor</SelectItem>
                        <SelectItem value="account">Conta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {exportOptions.format === "excel" ? (
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" />
                Arquivo Excel com múltiplas planilhas
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Relatório PDF formatado
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                "Exportando..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
