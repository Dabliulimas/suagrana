"use client";

import React, { useState, useMemo } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  FileText,
  Download,
  Calculator,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import {
  Investment,
  InvestmentOperation,
  DividendOperation,
} from "../../../lib/types/investments";
import { formatCurrency, formatPercentage, formatDate } from "../../../lib/utils";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TaxEvent {
  id: string;
  investmentId: string;
  identifier: string;
  type: "sale" | "dividend" | "jcp" | "bonus";
  date: Date;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  taxRate: number;
  description: string;
  month: number;
  year: number;
}

interface MonthlyTaxSummary {
  month: number;
  year: number;
  totalSales: number;
  totalGains: number;
  totalLosses: number;
  totalDividends: number;
  totalJCP: number;
  totalTaxes: number;
  exemptSales: number; // Vendas até R$ 20.000
  taxableSales: number;
  netResult: number;
}

interface YearlyTaxSummary {
  year: number;
  totalGains: number;
  totalLosses: number;
  totalDividends: number;
  totalJCP: number;
  totalTaxes: number;
  monthlyData: MonthlyTaxSummary[];
  carryForwardLosses: number;
}

const TAX_RATES = {
  dividend: 0, // Dividendos são isentos
  jcp: 0.15, // JCP tem 15% de IR na fonte
  dayTrade: 0.2, // Day trade: 20%
  swingTrade: 0.15, // Swing trade: 15%
  longTerm: 0.15, // Longo prazo: 15%
};

const MONTHLY_EXEMPTION = 20000; // R$ 20.000 de isenção mensal para vendas

export function TaxReporting() {
  const { state } = useInvestments();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Calcular eventos fiscais baseados nas operações
  const taxEvents = useMemo(() => {
    const events: TaxEvent[] = [];

    // Processar operações de venda
    state.investments.forEach((investment) => {
      (investment.operations || [])?.forEach((operation) => {
        if (operation.type === "sell") {
          const buyOperations =
            (investment.operations || [])
              ?.filter((op) => op.type === "buy" && op.date <= operation.date)
              .sort((a, b) => a.date.getTime() - b.date.getTime()) || [];

          let remainingQuantity = operation.quantity;
          let totalCost = 0;

          // FIFO - First In, First Out
          for (const buyOp of buyOperations) {
            if (remainingQuantity <= 0) break;

            const availableQuantity = Math.min(
              remainingQuantity,
              buyOp.quantity,
            );
            totalCost += availableQuantity * buyOp.price;
            remainingQuantity -= availableQuantity;
          }

          const saleValue = operation.quantity * operation.price;
          const gain = saleValue - totalCost - (operation.fees || 0);
          const taxRate = gain > 0 ? TAX_RATES.swingTrade : 0;
          const taxAmount = gain > 0 ? gain * taxRate : 0;

          events.push({
            id: `sale-${operation.id}`,
            investmentId: investment.id,
            identifier: investment.identifier,
            type: "sale",
            date: operation.date,
            grossAmount: saleValue,
            taxAmount,
            netAmount: saleValue - taxAmount,
            taxRate,
            description: `Venda de ${operation.quantity} ${investment.identifier}`,
            month: operation.date.getMonth() + 1,
            year: operation.date.getFullYear(),
          });
        }
      });

      // Processar dividendos
      investment.dividends?.forEach((dividend) => {
        const taxRate =
          dividend.type === "jcp" ? TAX_RATES.jcp : TAX_RATES.dividend;
        const taxAmount = dividend.amount * taxRate;

        events.push({
          id: `dividend-${dividend.id}`,
          investmentId: investment.id,
          identifier: investment.identifier,
          type: dividend.type as "dividend" | "jcp",
          date: dividend.paymentDate,
          grossAmount: dividend.amount,
          taxAmount,
          netAmount: dividend.amount - taxAmount,
          taxRate,
          description: `${dividend.type.toUpperCase()} - ${dividend.description}`,
          month: dividend.paymentDate.getMonth() + 1,
          year: dividend.paymentDate.getFullYear(),
        });
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [state.investments]);

  // Calcular resumo mensal
  const monthlyTaxSummary = useMemo(() => {
    const summaryMap = new Map<string, MonthlyTaxSummary>();

    taxEvents.forEach((event) => {
      const key = `${event.year}-${event.month}`;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          month: event.month,
          year: event.year,
          totalSales: 0,
          totalGains: 0,
          totalLosses: 0,
          totalDividends: 0,
          totalJCP: 0,
          totalTaxes: 0,
          exemptSales: 0,
          taxableSales: 0,
          netResult: 0,
        });
      }

      const summary = summaryMap.get(key)!;

      switch (event.type) {
        case "sale":
          summary.totalSales += event.grossAmount;
          const gain =
            event.grossAmount -
            (event.grossAmount - event.netAmount + event.taxAmount);
          if (gain > 0) {
            summary.totalGains += gain;
          } else {
            summary.totalLosses += Math.abs(gain);
          }

          // Aplicar isenção de R$ 20.000
          if (summary.totalSales <= MONTHLY_EXEMPTION) {
            summary.exemptSales += event.grossAmount;
          } else {
            const exemptPortion = Math.max(
              0,
              MONTHLY_EXEMPTION - (summary.totalSales - event.grossAmount),
            );
            summary.exemptSales += exemptPortion;
            summary.taxableSales += event.grossAmount - exemptPortion;
          }
          break;
        case "dividend":
          summary.totalDividends += event.grossAmount;
          break;
        case "jcp":
          summary.totalJCP += event.grossAmount;
          break;
      }

      summary.totalTaxes += event.taxAmount;
      summary.netResult =
        summary.totalGains -
        summary.totalLosses +
        summary.totalDividends +
        summary.totalJCP -
        summary.totalTaxes;
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [taxEvents]);

  // Calcular resumo anual
  const yearlyTaxSummary = useMemo(() => {
    const summaryMap = new Map<number, YearlyTaxSummary>();

    monthlyTaxSummary.forEach((monthly) => {
      if (!summaryMap.has(monthly.year)) {
        summaryMap.set(monthly.year, {
          year: monthly.year,
          totalGains: 0,
          totalLosses: 0,
          totalDividends: 0,
          totalJCP: 0,
          totalTaxes: 0,
          monthlyData: [],
          carryForwardLosses: 0,
        });
      }

      const yearly = summaryMap.get(monthly.year)!;
      yearly.totalGains += monthly.totalGains;
      yearly.totalLosses += monthly.totalLosses;
      yearly.totalDividends += monthly.totalDividends;
      yearly.totalJCP += monthly.totalJCP;
      yearly.totalTaxes += monthly.totalTaxes;
      yearly.monthlyData.push(monthly);
    });

    // Calcular prejuízos a compensar
    const sortedYears = Array.from(summaryMap.values()).sort(
      (a, b) => a.year - b.year,
    );
    let accumulatedLosses = 0;

    sortedYears.forEach((yearly) => {
      const netResult = yearly.totalGains - yearly.totalLosses;
      if (netResult < 0) {
        accumulatedLosses += Math.abs(netResult);
      } else if (accumulatedLosses > 0) {
        const compensated = Math.min(accumulatedLosses, netResult);
        accumulatedLosses -= compensated;
      }
      yearly.carryForwardLosses = accumulatedLosses;
    });

    return sortedYears.reverse();
  }, [monthlyTaxSummary]);

  const currentYearSummary = yearlyTaxSummary.find(
    (y) => y.year === selectedYear,
  );
  const currentMonthSummary = selectedMonth
    ? monthlyTaxSummary.find(
        (m) => m.year === selectedYear && m.month === selectedMonth,
      )
    : null;

  const handleExportTaxReport = async (
    type: "monthly" | "yearly",
    format: "excel" | "pdf",
  ) => {
    try {
      setLoading(true);

      const data =
        type === "monthly"
          ? currentMonthSummary
            ? [currentMonthSummary]
            : []
          : currentYearSummary
            ? [currentYearSummary]
            : [];

      if (data.length === 0) {
        toast.error("Nenhum dado disponível para exportar");
        return;
      }

      const filteredEvents = taxEvents.filter(
        (e) =>
          e.year === selectedYear &&
          (type === "yearly" || e.month === selectedMonth),
      );

      const period =
        type === "monthly"
          ? `${getMonthName(selectedMonth || 1)}_${selectedYear}`
          : selectedYear.toString();

      if (format === "excel") {
        await exportToExcel(data, filteredEvents, period, type);
      } else {
        await exportToPDF(data, filteredEvents, period, type);
      }

      toast.success(
        `Relatório ${type === "monthly" ? "mensal" : "anual"} exportado em ${format.toUpperCase()} com sucesso!`,
      );
    } catch (error) {
      logComponents.error("Erro ao exportar relatório:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async (
    data: any[],
    events: TaxEvent[],
    period: string,
    type: "monthly" | "yearly",
  ) => {
    const workbook = new ExcelJS.Workbook();

    // Planilha Principal - Resumo
    const summarySheet = workbook.addWorksheet("Resumo Fiscal");

    // Cabeçalho
    summarySheet.mergeCells("A1:H1");
    summarySheet.getCell("A1").value =
      "RELATÓRIO DE IMPOSTO DE RENDA - INVESTIMENTOS";
    summarySheet.getCell("A1").font = { bold: true, size: 16 };
    summarySheet.getCell("A1").alignment = { horizontal: "center" };

    summarySheet.mergeCells("A2:H2");
    summarySheet.getCell("A2").value =
      `Período: ${period} | Gerado em: ${formatDate(new Date())}`;
    summarySheet.getCell("A2").alignment = { horizontal: "center" };

    // Dados do contribuinte (placeholder)
    summarySheet.getCell("A4").value = "DADOS DO CONTRIBUINTE:";
    summarySheet.getCell("A4").font = { bold: true };
    summarySheet.getCell("A5").value =
      "Nome: _________________________________";
    summarySheet.getCell("A6").value = "CPF: ___________________";
    summarySheet.getCell("A7").value = "Ano-calendário: " + selectedYear;

    // Resumo dos ganhos e perdas
    let currentRow = 9;
    summarySheet.getCell(`A${currentRow}`).value =
      "RESUMO DE GANHOS E PERDAS DE CAPITAL";
    summarySheet.getCell(`A${currentRow}`).font = { bold: true };
    currentRow += 2;

    if (type === "yearly" && currentYearSummary) {
      const headers = ["Descrição", "Valor (R$)"];
      summarySheet.getRow(currentRow).values = headers;
      summarySheet.getRow(currentRow).font = { bold: true };
      currentRow++;

      const summaryData = [
        ["Ganhos de Capital", currentYearSummary.totalGains],
        ["Perdas de Capital", currentYearSummary.totalLosses],
        [
          "Resultado Líquido",
          currentYearSummary.totalGains - currentYearSummary.totalLosses,
        ],
        ["Dividendos Recebidos (Isentos)", currentYearSummary.totalDividends],
        ["JCP Recebidos", currentYearSummary.totalJCP],
        ["IR Retido na Fonte (JCP)", currentYearSummary.totalJCP * 0.15],
        [
          "IR Devido sobre Ganhos",
          Math.max(
            0,
            (currentYearSummary.totalGains - currentYearSummary.totalLosses) *
              0.15,
          ),
        ],
      ];

      summaryData.forEach(([desc, value]) => {
        summarySheet.getCell(`A${currentRow}`).value = desc;
        summarySheet.getCell(`B${currentRow}`).value =
          typeof value === "number" ? value : 0;
        summarySheet.getCell(`B${currentRow}`).numFmt = "#,##0.00";
        currentRow++;
      });
    }

    // Planilha de Operações Detalhadas
    const operationsSheet = workbook.addWorksheet("Operações Detalhadas");

    operationsSheet.getCell("A1").value =
      "DISCRIMINAÇÃO DAS OPERAÇÕES REALIZADAS";
    operationsSheet.getCell("A1").font = { bold: true, size: 14 };

    const operationHeaders = [
      "Data",
      "Tipo",
      "Ativo",
      "Quantidade",
      "Preço Unitário (R$)",
      "Valor Total (R$)",
      "Ganho/Perda (R$)",
      "IR Devido (R$)",
    ];

    operationsSheet.getRow(3).values = operationHeaders;
    operationsSheet.getRow(3).font = { bold: true };

    let opRow = 4;
    events
      .forEach((event) => {
        operationsSheet.getCell(`A${opRow}`).value = formatDate(event.date);
        operationsSheet.getCell(`B${opRow}`).value = event.type.toUpperCase();
        operationsSheet.getCell(`C${opRow}`).value = event.identifier;
        operationsSheet.getCell(`D${opRow}`).value = "-";
        operationsSheet.getCell(`E${opRow}`).value = "-";
        operationsSheet.getCell(`F${opRow}`).value = event.grossAmount;
        operationsSheet.getCell(`G${opRow}`).value =
          event.grossAmount - event.taxAmount;
        operationsSheet.getCell(`H${opRow}`).value = event.taxAmount[
          // Formatação de moeda
          ("F", "G", "H")
        ].forEach((col) => {
          operationsSheet.getCell(`${col}${opRow}`).numFmt = "#,##0.00";
        });

        opRow++;
      })

      [
        // Ajustar largura das colunas
        (summarySheet, operationsSheet)
      ].forEach((sheet) => {
        sheet.columns.forEach((column) => {
          column.width = 20;
        });
      });

    // Salvar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IR_Investimentos_${period}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async (
    data: any[],
    events: TaxEvent[],
    period: string,
    type: "monthly" | "yearly",
  ) => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE IMPOSTO DE RENDA - INVESTIMENTOS", 105, 20, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${period} | Gerado em: ${formatDate(new Date())}`,
      105,
      30,
      { align: "center" },
    );

    // Dados do contribuinte
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CONTRIBUINTE:", 20, 50);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Nome: _________________________________", 20, 60);
    doc.text("CPF: ___________________", 20, 70);
    doc.text(`Ano-calendário: ${selectedYear}`, 20, 80);

    // Resumo fiscal
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO DE GANHOS E PERDAS DE CAPITAL:", 20, 100);

    if (type === "yearly" && currentYearSummary) {
      const summaryData = [
        ["Ganhos de Capital", formatCurrency(currentYearSummary.totalGains)],
        ["Perdas de Capital", formatCurrency(currentYearSummary.totalLosses)],
        [
          "Resultado Líquido",
          formatCurrency(
            currentYearSummary.totalGains - currentYearSummary.totalLosses,
          ),
        ],
        [
          "Dividendos Recebidos (Isentos)",
          formatCurrency(currentYearSummary.totalDividends),
        ],
        ["JCP Recebidos", formatCurrency(currentYearSummary.totalJCP)],
        [
          "IR Retido na Fonte (JCP)",
          formatCurrency(currentYearSummary.totalJCP * 0.15),
        ],
        [
          "IR Devido sobre Ganhos",
          formatCurrency(
            Math.max(
              0,
              (currentYearSummary.totalGains - currentYearSummary.totalLosses) *
                0.15,
            ),
          ),
        ],
      ];

      // @ts-ignore
      doc.autoTable({
        startY: 110,
        head: [["Descrição", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 },
      });
    }

    // Nova página para operações detalhadas
    doc.addPage();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DISCRIMINAÇÃO DAS OPERAÇÕES REALIZADAS:", 20, 20);

    if (events.length > 0) {
      const operationsData = events.map((event) => [
        formatDate(event.date),
        event.type.toUpperCase(),
        event.identifier,
        formatCurrency(event.grossAmount),
        formatCurrency(event.grossAmount - event.taxAmount),
        formatCurrency(event.taxAmount),
      ]);

      // @ts-ignore
      doc.autoTable({
        startY: 30,
        head: [
          [
            "Data",
            "Tipo",
            "Ativo",
            "Valor Bruto",
            "Valor Líquido",
            "IR Retido",
          ],
        ],
        body: operationsData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
        },
      });
    }

    // Rodapé com informações importantes
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Este relatório foi gerado automaticamente. Consulte um contador para orientações específicas.",
        105,
        285,
        { align: "center" },
      );
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }

    // Salvar PDF
    doc.save(`IR_Investimentos_${period}.pdf`);
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[month - 1];
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-blue-100 text-blue-800";
      case "dividend":
        return "bg-green-100 text-green-800";
      case "jcp":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Venda";
      case "dividend":
        return "Dividendo";
      case "jcp":
        return "JCP";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Fiscais</h2>
          <p className="text-muted-foreground">
            Acompanhe suas obrigações fiscais e calcule impostos
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            {Array.from(new Set(taxEvents.map((e) => e.year)))
              .sort((a, b) => b - a)
              .map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportTaxReport("yearly", "excel")}
              disabled={loading}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={() => handleExportTaxReport("yearly", "pdf")}
              disabled={loading}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Resumo anual */}
      {currentYearSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ganhos Totais
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentYearSummary.totalGains)}
              </div>
              <p className="text-xs text-muted-foreground">Em {selectedYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prejuízos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(currentYearSummary.totalLosses)}
              </div>
              <p className="text-xs text-muted-foreground">
                A compensar:{" "}
                {formatCurrency(currentYearSummary.carryForwardLosses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dividendos</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(currentYearSummary.totalDividends)}
              </div>
              <p className="text-xs text-muted-foreground">
                JCP: {formatCurrency(currentYearSummary.totalJCP)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Impostos Pagos
              </CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(currentYearSummary.totalTaxes)}
              </div>
              <p className="text-xs text-muted-foreground">Retido na fonte</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Resumo Mensal</TabsTrigger>
          <TabsTrigger value="events">Eventos Fiscais</TabsTrigger>
          <TabsTrigger value="obligations">Obrigações</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Mensal - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyTaxSummary
                  .filter((m) => m.year === selectedYear)
                  .map((monthly) => (
                    <div
                      key={`${monthly.year}-${monthly.month}`}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">
                          {getMonthName(monthly.month)} {monthly.year}
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMonth(monthly.month);
                              handleExportTaxReport("monthly", "excel");
                            }}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Excel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMonth(monthly.month);
                              handleExportTaxReport("monthly", "pdf");
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">
                            Vendas Totais
                          </div>
                          <div className="font-medium">
                            {formatCurrency(monthly.totalSales)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Ganhos</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(monthly.totalGains)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Prejuízos</div>
                          <div className="font-medium text-red-600">
                            {formatCurrency(monthly.totalLosses)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Resultado Líquido
                          </div>
                          <div
                            className={`font-medium ${
                              monthly.netResult >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(monthly.netResult)}
                          </div>
                        </div>
                      </div>

                      {monthly.totalSales > MONTHLY_EXEMPTION && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Vendas acima da isenção mensal (R$ 20.000)
                            </span>
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            Vendas tributáveis:{" "}
                            {formatCurrency(monthly.taxableSales)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                {monthlyTaxSummary.filter((m) => m.year === selectedYear)
                  .length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>Nenhum evento fiscal em {selectedYear}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Fiscais - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxEvents
                  .filter((e) => e.year === selectedYear)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {event.date.getDate()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getMonthName(event.month).slice(0, 3)}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{event.identifier}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getEventTypeColor(event.type)}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(event.grossAmount)}
                          </div>
                          {event.taxAmount > 0 && (
                            <div className="text-sm text-red-600">
                              IR: {formatCurrency(event.taxAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {taxEvents.filter((e) => e.year === selectedYear).length ===
                  0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2" />
                    <p>Nenhum evento fiscal em {selectedYear}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obligations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações Fiscais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">
                    DARF - Imposto de Renda
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Prazo: Último dia útil do mês seguinte ao da operação
                  </p>

                  {currentYearSummary?.monthlyData.map((monthly) => {
                    const taxDue = Math.max(
                      0,
                      (monthly.totalGains - monthly.totalLosses) * 0.15,
                    );
                    if (taxDue === 0) return null;

                    return (
                      <div
                        key={`${monthly.year}-${monthly.month}`}
                        className="flex justify-between items-center py-2 border-b last:border-b-0"
                      >
                        <span>
                          {getMonthName(monthly.month)} {monthly.year}
                        </span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(taxDue)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">
                    Declaração de Imposto de Renda
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Prazo: 31 de maio do ano seguinte
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ganhos de capital:</span>
                      <span>
                        {formatCurrency(currentYearSummary?.totalGains || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prejuízos:</span>
                      <span>
                        {formatCurrency(currentYearSummary?.totalLosses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dividendos recebidos:</span>
                      <span>
                        {formatCurrency(
                          currentYearSummary?.totalDividends || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Imposto devido:</span>
                      <span className="text-red-600">
                        {formatCurrency(
                          Math.max(
                            0,
                            ((currentYearSummary?.totalGains || 0) -
                              (currentYearSummary?.totalLosses || 0)) *
                              0.15,
                          ),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold mb-2 text-blue-800">
                    Dicas Importantes
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Vendas até R$ 20.000/mês são isentas de IR</li>
                    <li>• Dividendos são isentos de IR para pessoa física</li>
                    <li>• JCP tem 15% de IR retido na fonte</li>
                    <li>• Prejuízos podem ser compensados indefinidamente</li>
                    <li>• Day trade tem alíquota de 20%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
