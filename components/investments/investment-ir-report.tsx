"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { DatePicker } from "../ui/date-picker";
import { Badge } from "../ui/badge";

interface IRReportProps {
  className?: string;
}

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: string;
  broker?: string;
  status: string;
  fees?: number;
}

interface Dividend {
  id: string;
  investmentId: string;
  investmentSymbol: string;
  dividendType: "dividend" | "jscp" | "bonus";
  amount: number;
  valuePerShare: number;
  paymentDate: string;
  exDividendDate?: string;
  notes?: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes?: string;
}

interface Sale {
  id: string;
  investmentId: string;
  investmentSymbol: string;
  investmentType: string;
  quantity: number;
  salePrice: number;
  grossAmount: number;
  netAmount: number;
  fees: number;
  averagePrice: number;
  costBasis: number;
  grossProfit: number;
  netProfit: number;
  profitPercentage: number;
  taxRate: number;
  taxDue: number;
  exemptionApplies: boolean;
  saleDate: string;
  notes?: string;
}

interface MonthlyTaxCalculation {
  month: string;
  totalSales: number;
  exemptSales: number;
  taxableSales: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  taxDue: number;
  exemptionApplied: number;
  exemptionLimit: number;
}

export function InvestmentIRReport({ className }: IRReportProps) {
  const [startDate, setStartDate] = useState<Date>(startOfYear(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfYear(new Date()));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState<"year" | "custom">("year");

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   * Dados agora vêm do banco via DataService
   */
  const investments = useMemo(() => {
    console.log("Carregamento de investimentos para IR - localStorage removido, dados agora vêm do banco via DataService");
    // TODO: Implementar carregamento via DataService
    // return DataService.getInvestments();
    return [];
  }, []);

  const dividends = useMemo(() => {
    console.log("Carregamento de dividendos para IR - localStorage removido, dados agora vêm do banco via DataService");
    // TODO: Implementar carregamento via DataService
    // return DataService.getDividends();
    return [];
  }, []);

  const transactions = useMemo(() => {
    console.log("Carregamento de transações para IR - localStorage removido, dados agora vêm do banco via DataService");
    // TODO: Implementar carregamento via DataService
    // return DataService.getTransactions();
    return [];
  }, []);

  const sales = useMemo(() => {
    console.log("Carregamento de vendas para IR - localStorage removido, dados agora vêm do banco via DataService");
    // TODO: Implementar carregamento via DataService
    // return DataService.getSales();
    return [];
  }, []);

  // Definir intervalo de datas baseado no filtro
  const dateInterval = useMemo(() => {
    if (filterType === "year") {
      return {
        start: startOfYear(new Date(parseInt(selectedYear), 0, 1)),
        end: endOfYear(new Date(parseInt(selectedYear), 0, 1))
      };
    }
    return { start: startDate, end: endDate };
  }, [filterType, selectedYear, startDate, endDate]);

  // Filtrar dados pelo período selecionado
  const filteredData = useMemo(() => {
    const filteredInvestments = investments.filter((inv) => {
      if (!inv.purchaseDate) return false;
      try {
        const purchaseDate = parseISO(inv.purchaseDate);
        return isWithinInterval(purchaseDate, dateInterval);
      } catch (error) {
        console.warn('Invalid purchaseDate format:', inv.purchaseDate);
        return false;
      }
    });

    const filteredDividends = dividends.filter((div) => {
      if (!div.paymentDate) return false;
      try {
        const paymentDate = parseISO(div.paymentDate);
        return isWithinInterval(paymentDate, dateInterval);
      } catch (error) {
        console.warn('Invalid paymentDate format:', div.paymentDate);
        return false;
      }
    });

    const filteredTransactions = transactions.filter((txn) => {
      if (!txn.date) return false;
      try {
        const txnDate = parseISO(txn.date);
        return isWithinInterval(txnDate, dateInterval) && 
               txn.category.toLowerCase().includes('dividend');
      } catch (error) {
        console.warn('Invalid transaction date format:', txn.date);
        return false;
      }
    });

    const filteredSales = sales.filter((sale) => {
      if (!sale.saleDate) return false;
      try {
        const saleDate = parseISO(sale.saleDate);
        return isWithinInterval(saleDate, dateInterval);
      } catch (error) {
        console.warn('Invalid saleDate format:', sale.saleDate);
        return false;
      }
    });

    return {
      investments: filteredInvestments,
      dividends: filteredDividends,
      transactions: filteredTransactions,
      sales: filteredSales
    };
  }, [investments, dividends, transactions, dateInterval]);

  // Calcular relatórios por categoria
  const reportData = useMemo(() => {
    const { investments: invs, dividends: divs, sales: vendas } = filteredData;

    // Ações
    const acoes = invs.filter(inv => inv.type === 'stock' || inv.type === 'acao');
    const totalAcoes = acoes.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    const resultadoAcoes = acoes.reduce((sum, inv) => {
      const currentPrice = inv.currentPrice || inv.purchasePrice;
      return sum + ((currentPrice - inv.purchasePrice) * inv.quantity);
    }, 0);

    // FIIs
    const fiis = invs.filter(inv => inv.type === 'fii');
    const totalFiis = fiis.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
    const resultadoFiis = fiis.reduce((sum, inv) => {
      const currentPrice = inv.currentPrice || inv.purchasePrice;
      return sum + ((currentPrice - inv.purchasePrice) * inv.quantity);
    }, 0);

    // Dividendos por tipo
    const dividendosComuns = divs.filter(div => div.dividendType === 'dividend');
    const jscp = divs.filter(div => div.dividendType === 'jscp');
    const bonificacoes = divs.filter(div => div.dividendType === 'bonus');

    const totalDividendos = dividendosComuns.reduce((sum, div) => sum + div.amount, 0);
    const totalJSCP = jscp.reduce((sum, div) => sum + div.amount, 0);
    const totalBonificacoes = bonificacoes.reduce((sum, div) => sum + div.amount, 0);

    // Vendas por tipo
    const vendasAcoes = vendas.filter(sale => sale.investmentType === 'stock' || sale.investmentType === 'acao');
    const vendasFiis = vendas.filter(sale => sale.investmentType === 'fii');
    const vendasEtfs = vendas.filter(sale => sale.investmentType === 'etf');
    const vendasOutros = vendas.filter(sale => !['stock', 'acao', 'fii', 'etf'].includes(sale.investmentType));

    // Totais de vendas
    const totalVendasBruto = vendas.reduce((sum, sale) => sum + sale.grossAmount, 0);
    const totalVendasLiquido = vendas.reduce((sum, sale) => sum + sale.netAmount, 0);
    const totalLucros = vendas.filter(sale => sale.netProfit > 0).reduce((sum, sale) => sum + sale.netProfit, 0);
    const totalPrejuizos = vendas.filter(sale => sale.netProfit < 0).reduce((sum, sale) => sum + Math.abs(sale.netProfit), 0);
    const resultadoLiquido = totalLucros - totalPrejuizos;

    // Apuração mensal para regra de isenção R$ 20.000
    const apuracaoMensal = new Map<string, {
      month: string;
      totalSales: number;
      exemptSales: number;
      taxableSales: number;
      totalProfit: number;
      totalLoss: number;
      netResult: number;
      taxDue: number;
      exemptionApplied: number;
    }>();

    // Processar vendas mês a mês
    vendas.forEach(sale => {
      if (!sale.saleDate) return;
      try {
        const monthKey = format(parseISO(sale.saleDate), 'yyyy-MM');
        const monthLabel = format(parseISO(sale.saleDate), 'MMM/yy', { locale: ptBR });
      
      const existing = apuracaoMensal.get(monthKey) || {
        month: monthLabel,
        totalSales: 0,
        exemptSales: 0,
        taxableSales: 0,
        totalProfit: 0,
        totalLoss: 0,
        netResult: 0,
        taxDue: 0,
        exemptionApplied: 0
      };

      existing.totalSales += sale.netAmount;
      
      // Aplicar regra de isenção para ações e ETFs
      if (sale.exemptionApplies && existing.totalSales <= 20000) {
        existing.exemptSales += sale.netAmount;
        existing.exemptionApplied += sale.netProfit > 0 ? sale.taxDue : 0;
      } else {
        existing.taxableSales += sale.netAmount;
        if (sale.netProfit > 0) {
          existing.taxDue += sale.taxDue;
        }
      }
      
      if (sale.netProfit > 0) {
        existing.totalProfit += sale.netProfit;
      } else {
        existing.totalLoss += Math.abs(sale.netProfit);
      }
      
        existing.netResult = existing.totalProfit - existing.totalLoss;
        apuracaoMensal.set(monthKey, existing);
      } catch (error) {
        console.warn('Error processing sale date:', sale.saleDate, error);
      }
    });

    const calculosIR = {
      totalVendasBruto,
      totalVendasLiquido,
      totalLucros,
      totalPrejuizos,
      resultadoLiquido,
      totalIRDevido: Array.from(apuracaoMensal.values()).reduce((sum, calc) => sum + calc.taxDue, 0),
      totalIsencaoAplicada: Array.from(apuracaoMensal.values()).reduce((sum, calc) => sum + calc.exemptionApplied, 0),
      apuracaoMensal: Array.from(apuracaoMensal.values()).sort((a, b) => a.month.localeCompare(b.month))
    };

    // Operações por mês
    const operacoesPorMes = new Map<string, {
      compras: number;
      vendas: number;
      dividendos: number;
      mes: string;
    }>();

    invs.forEach(inv => {
      if (!inv.purchaseDate) return;
      try {
        const monthKey = format(parseISO(inv.purchaseDate), 'yyyy-MM');
        const monthLabel = format(parseISO(inv.purchaseDate), 'MMM/yy', { locale: ptBR });
        const existing = operacoesPorMes.get(monthKey) || { compras: 0, vendas: 0, dividendos: 0, mes: monthLabel };
        existing.compras += inv.quantity * inv.purchasePrice;
        operacoesPorMes.set(monthKey, existing);
      } catch (error) {
        console.warn('Error processing investment purchase date:', inv.purchaseDate, error);
      }
    });

    divs.forEach(div => {
      if (!div.paymentDate) return;
      try {
        const monthKey = format(parseISO(div.paymentDate), 'yyyy-MM');
        const monthLabel = format(parseISO(div.paymentDate), 'MMM/yy', { locale: ptBR });
        const existing = operacoesPorMes.get(monthKey) || { compras: 0, vendas: 0, dividendos: 0, mes: monthLabel };
        existing.dividendos += div.amount;
        operacoesPorMes.set(monthKey, existing);
      } catch (error) {
        console.warn('Error processing dividend payment date:', div.paymentDate, error);
      }
    });

    return {
      acoes: {
        quantidade: acoes.length,
        valorInvestido: totalAcoes,
        resultado: resultadoAcoes,
        rendimento: totalAcoes > 0 ? (resultadoAcoes / totalAcoes) * 100 : 0
      },
      fiis: {
        quantidade: fiis.length,
        valorInvestido: totalFiis,
        resultado: resultadoFiis,
        rendimento: totalFiis > 0 ? (resultadoFiis / totalFiis) * 100 : 0
      },
      rendimentos: {
        dividendos: totalDividendos,
        jscp: totalJSCP,
        bonificacoes: totalBonificacoes,
        total: totalDividendos + totalJSCP + totalBonificacoes
      },
      vendas: {
        total: vendas.length,
        acoes: vendasAcoes.length,
        fiis: vendasFiis.length,
        etfs: vendasEtfs.length,
        outros: vendasOutros.length
      },
      imposto: calculosIR,
      operacoesMensais: Array.from(operacoesPorMes.values()).sort((a, b) => a.mes.localeCompare(b.mes))
    };
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dateRange = filterType === "year" ? 
        `Ano Base: ${selectedYear}` : 
        `Período: ${format(dateInterval.start, 'dd/MM/yyyy')} - ${format(dateInterval.end, 'dd/MM/yyyy')}`;

      // Cabeçalho
      doc.setFontSize(18);
      doc.text('RELATÓRIO PARA IMPOSTO DE RENDA', 20, 20);
      doc.setFontSize(12);
      doc.text(dateRange, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);

      let yPos = 60;

      // Resumo Geral
      doc.setFontSize(14);
      doc.text('RESUMO GERAL', 20, yPos);
      yPos += 15;

      const resumoData = [
        ['Categoria', 'Valor Investido', 'Resultado', 'Rendimento'],
        ['Ações', formatCurrency(reportData.acoes.valorInvestido), 
         formatCurrency(reportData.acoes.resultado), 
         formatPercentage(reportData.acoes.rendimento)],
        ['FIIs', formatCurrency(reportData.fiis.valorInvestido), 
         formatCurrency(reportData.fiis.resultado), 
         formatPercentage(reportData.fiis.rendimento)],
      ];

      autoTable(doc, {
        head: [resumoData[0]],
        body: resumoData.slice(1),
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 10 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Rendimentos
      doc.setFontSize(14);
      doc.text('RENDIMENTOS RECEBIDOS', 20, yPos);
      yPos += 15;

      const rendimentosData = [
        ['Tipo', 'Valor', 'Tributação'],
        ['Dividendos', formatCurrency(reportData.rendimentos.dividendos), 'Isento'],
        ['JCP', formatCurrency(reportData.rendimentos.jscp), 'Tributável (15%)'],
        ['Bonificações', formatCurrency(reportData.rendimentos.bonificacoes), 'Isento'],
        ['TOTAL', formatCurrency(reportData.rendimentos.total), '-'],
      ];

      autoTable(doc, {
        head: [rendimentosData[0]],
        body: rendimentosData.slice(1),
        startY: yPos,
        theme: 'grid',
        styles: { fontSize: 10 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Investimentos Detalhados
      if (filteredData.investments.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('INVESTIMENTOS REALIZADOS', 20, yPos);
        yPos += 15;

        const investimentosData = filteredData.investments.map(inv => [
          inv.symbol || inv.name,
          inv.type.toUpperCase(),
          inv.quantity.toString(),
          formatCurrency(inv.purchasePrice),
          format(parseISO(inv.purchaseDate), 'dd/MM/yyyy'),
          inv.broker || 'N/A'
        ]);

        autoTable(doc, {
          head: [['Ativo', 'Tipo', 'Qtd', 'Preço', 'Data', 'Corretora']],
          body: investimentosData,
          startY: yPos,
          theme: 'grid',
          styles: { fontSize: 8 },
        });
      }

      // Salvar PDF
      const fileName = `relatorio-ir-${filterType === 'year' ? selectedYear : format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório em PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const dateRange = filterType === "year" ? selectedYear : `${format(dateInterval.start, 'dd/MM/yyyy')} - ${format(dateInterval.end, 'dd/MM/yyyy')}`;
      
      // Planilha Resumo
      const resumoSheet = workbook.addWorksheet('Resumo IR');
      
      resumoSheet.addRow(['RELATÓRIO PARA IMPOSTO DE RENDA']);
      resumoSheet.addRow([`Período: ${dateRange}`]);
      resumoSheet.addRow([`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]);
      resumoSheet.addRow([]);
      
      resumoSheet.addRow(['RESUMO POR CATEGORIA']);
      resumoSheet.addRow(['Categoria', 'Quantidade de Ativos', 'Valor Investido', 'Resultado', 'Rendimento %']);
      resumoSheet.addRow(['Ações', reportData.acoes.quantidade, reportData.acoes.valorInvestido, reportData.acoes.resultado, reportData.acoes.rendimento]);
      resumoSheet.addRow(['FIIs', reportData.fiis.quantidade, reportData.fiis.valorInvestido, reportData.fiis.resultado, reportData.fiis.rendimento]);
      resumoSheet.addRow([]);
      
      resumoSheet.addRow(['RENDIMENTOS RECEBIDOS']);
      resumoSheet.addRow(['Tipo', 'Valor', 'Tributação']);
      resumoSheet.addRow(['Dividendos', reportData.rendimentos.dividendos, 'Isento']);
      resumoSheet.addRow(['JCP', reportData.rendimentos.jscp, 'Tributável (15%)']);
      resumoSheet.addRow(['Bonificações', reportData.rendimentos.bonificacoes, 'Isento']);
      resumoSheet.addRow(['TOTAL', reportData.rendimentos.total, '-']);

      // Planilha Investimentos
      if (filteredData.investments.length > 0) {
        const investSheet = workbook.addWorksheet('Investimentos');
        
        investSheet.addRow(['INVESTIMENTOS REALIZADOS NO PERÍODO']);
        investSheet.addRow([]);
        investSheet.addRow(['Ativo', 'Tipo', 'Quantidade', 'Preço Médio', 'Data Compra', 'Valor Total', 'Corretora', 'Taxa']);
        
        filteredData.investments.forEach(inv => {
          investSheet.addRow([
            inv.symbol || inv.name,
            inv.type.toUpperCase(),
            inv.quantity,
            inv.purchasePrice,
            format(parseISO(inv.purchaseDate), 'dd/MM/yyyy'),
            inv.quantity * inv.purchasePrice,
            inv.broker || 'N/A',
            inv.fees || 0
          ]);
        });
      }

      // Planilha Dividendos
      if (filteredData.dividends.length > 0) {
        const divSheet = workbook.addWorksheet('Dividendos');
        
        divSheet.addRow(['DIVIDENDOS RECEBIDOS NO PERÍODO']);
        divSheet.addRow([]);
        divSheet.addRow(['Ativo', 'Tipo', 'Valor Total', 'Valor por Cota', 'Data Pagamento', 'Data Ex-Dividendo']);
        
        filteredData.dividends.forEach(div => {
          divSheet.addRow([
            div.investmentSymbol,
            div.dividendType === 'dividend' ? 'Dividendo' : div.dividendType === 'jscp' ? 'JCP' : 'Bonificação',
            div.amount,
            div.valuePerShare,
            format(parseISO(div.paymentDate), 'dd/MM/yyyy'),
            div.exDividendDate ? format(parseISO(div.exDividendDate), 'dd/MM/yyyy') : 'N/A'
          ]);
        });
      }

      // Planilha Evolução Mensal
      if (reportData.operacoesMensais.length > 0) {
        const evolSheet = workbook.addWorksheet('Evolução Mensal');
        
        evolSheet.addRow(['EVOLUÇÃO MENSAL']);
        evolSheet.addRow([]);
        evolSheet.addRow(['Mês', 'Compras', 'Vendas', 'Dividendos Recebidos']);
        
        reportData.operacoesMensais.forEach(op => {
          evolSheet.addRow([op.mes, op.compras, op.vendas, op.dividendos]);
        });
      }

      // Estilização
      workbook.eachSheet((worksheet) => {
        worksheet.getRow(1).font = { bold: true, size: 14 };
        worksheet.columns.forEach(column => {
          column.width = 18;
        });
      });

      // Gerar e baixar arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-ir-${filterType === 'year' ? selectedYear : format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório em Excel');
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <CardTitle>Relatório para Imposto de Renda</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato do Relatório</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros de Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros de Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="year"
                    checked={filterType === "year"}
                    onChange={() => setFilterType("year")}
                  />
                  <Label htmlFor="year">Ano Fiscal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom"
                    checked={filterType === "custom"}
                    onChange={() => setFilterType("custom")}
                  />
                  <Label htmlFor="custom">Período Personalizado</Label>
                </div>
              </div>

              {filterType === "year" ? (
                <div className="flex items-center gap-4">
                  <Label htmlFor="year-select">Ano:</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div>
                    <Label>Data Inicial:</Label>
                    <DatePicker
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </div>
                  <div>
                    <Label>Data Final:</Label>
                    <DatePicker
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ações</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.acoes.valorInvestido)}</p>
                    <p className={`text-sm ${reportData.acoes.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.acoes.resultado)} ({formatPercentage(reportData.acoes.rendimento)})
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">FIIs</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.fiis.valorInvestido)}</p>
                    <p className={`text-sm ${reportData.fiis.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(reportData.fiis.resultado)} ({formatPercentage(reportData.fiis.rendimento)})
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rendimentos</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.rendimentos.total)}</p>
                    <p className="text-sm text-muted-foreground">
                      Dividendos + JCP + Bonificações
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento por Tabs */}
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="resumo">Resumo IR</TabsTrigger>
              <TabsTrigger value="vendas">Vendas</TabsTrigger>
              <TabsTrigger value="apuracao">Apuração</TabsTrigger>
              <TabsTrigger value="rendimentos">Rendimentos</TabsTrigger>
              <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
              <TabsTrigger value="orientacoes">Orientações</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Resumo de Vendas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {reportData.vendas.total}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Vendas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(reportData.imposto.totalVendasLiquido)}
                        </div>
                        <div className="text-sm text-muted-foreground">Valor Total</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lucros:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(reportData.imposto.totalLucros)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prejuízos:</span>
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(reportData.imposto.totalPrejuizos)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Resultado Líquido:</span>
                        <span className={reportData.imposto.resultadoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(reportData.imposto.resultadoLiquido)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo de IR */}
                <Card>
                  <CardHeader>
                    <CardTitle>Imposto de Renda Devido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {formatCurrency(reportData.imposto.totalIRDevido)}
                      </div>
                      <div className="text-sm text-muted-foreground">IR Total a Pagar</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Isenção Aplicada:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(reportData.imposto.totalIsencaoAplicada)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>IR s/ Isenção:</span>
                        <span className="text-gray-600">
                          {formatCurrency(reportData.imposto.totalIRDevido + reportData.imposto.totalIsencaoAplicada)}
                        </span>
                      </div>
                    </div>

                    {reportData.imposto.totalIRDevido > 0 && (
                      <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                        <div className="text-sm">
                          <p className="font-medium text-orange-800">Atenção!</p>
                          <p className="text-orange-700">
                            Você possui IR a pagar. Recolha através do DARF até o último dia útil do mês seguinte à venda.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vendas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Todas as Vendas do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredData.sales.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma venda realizada no período selecionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredData.sales.map((sale) => (
                        <div key={sale.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{sale.investmentSymbol}</h4>
                              <Badge variant="outline">{sale.investmentType.toUpperCase()}</Badge>
                              {sale.netProfit >= 0 ? (
                                <Badge className="bg-green-100 text-green-800">Lucro</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">Prejuízo</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{sale.quantity} cotas × {formatCurrency(sale.salePrice)}</span>
                              <span>{format(parseISO(sale.saleDate), 'dd/MM/yyyy')}</span>
                              {sale.exemptionApplies && (
                                <Badge variant="outline" className="text-xs">Sujeito à Isenção</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(sale.netAmount)}
                            </div>
                            <div className={`text-sm ${sale.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {sale.netProfit >= 0 ? '+' : ''}{formatCurrency(sale.netProfit)}
                            </div>
                            {sale.netProfit > 0 && sale.taxDue > 0 && (
                              <div className="text-xs text-orange-600">
                                IR: {formatCurrency(sale.taxDue)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apuracao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Apuração Mensal de IR</CardTitle>
                  <CardDescription>
                    Aplicação da regra de isenção de R$ 20.000/mês para ações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reportData.imposto.apuracaoMensal.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma venda realizada no período selecionado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reportData.imposto.apuracaoMensal.map((calc, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">{calc.month}</h4>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Total Vendido: {formatCurrency(calc.totalSales)}
                              </div>
                              {calc.totalSales <= 20000 && calc.exemptSales > 0 && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Isento</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Vendas Isentas:</span>
                              <div className="font-medium text-green-600">
                                {formatCurrency(calc.exemptSales)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Vendas Tributáveis:</span>
                              <div className="font-medium text-red-600">
                                {formatCurrency(calc.taxableSales)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">IR Devido:</span>
                              <div className="font-medium text-orange-600">
                                {formatCurrency(calc.taxDue)}
                              </div>
                            </div>
                          </div>

                          {calc.netResult !== 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between text-sm">
                                <span>Resultado do Mês:</span>
                                <span className={`font-medium ${calc.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(calc.netResult)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rendimentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimentos Recebidos no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">Dividendos</p>
                        <p className="text-sm text-muted-foreground">Isentos de Imposto de Renda</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(reportData.rendimentos.dividendos)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">JCP</p>
                        <p className="text-sm text-muted-foreground">Tributação de 15% na fonte</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-orange-600">
                          {formatCurrency(reportData.rendimentos.jscp)}
                        </p>
                        <p className="text-sm text-red-600">
                          IR: {formatCurrency(reportData.rendimentos.jscp * 0.15)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">Bonificações</p>
                        <p className="text-sm text-muted-foreground">Isentos de Imposto de Renda</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(reportData.rendimentos.bonificacoes)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="investimentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investimentos Realizados no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredData.investments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum investimento realizado no período selecionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredData.investments.map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{inv.symbol || inv.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {inv.type.toUpperCase()} • {inv.quantity} cotas • {format(parseISO(inv.purchaseDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(inv.quantity * inv.purchasePrice)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(inv.purchasePrice)}/cota
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evolucao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  {reportData.operacoesMensais.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma operação realizada no período selecionado
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {reportData.operacoesMensais.map((op) => (
                        <div key={op.mes} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{op.mes}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm">
                              <span className="text-red-600">Compras: {formatCurrency(op.compras)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-green-600">Dividendos: {formatCurrency(op.dividendos)}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orientacoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Orientações para Imposto de Renda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-800">Dividendos</h4>
                    <p className="text-sm text-blue-700">
                      Os dividendos são isentos de Imposto de Renda na pessoa física. 
                      Devem ser informados na ficha "Rendimentos Isentos e Não Tributáveis", linha 09.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-medium text-orange-800">JCP (Juros sobre Capital Próprio)</h4>
                    <p className="text-sm text-orange-700">
                      Os JCP são tributados com 15% de IR retido na fonte. 
                      Devem ser informados na ficha "Rendimentos Sujeitos à Tributação Exclusiva/Definitiva".
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-medium text-green-800">Bonificações</h4>
                    <p className="text-sm text-green-700">
                      As bonificações são isentas de IR, mas reduzem o preço médio das ações.
                      Devem ser informadas na ficha "Rendimentos Isentos e Não Tributáveis".
                    </p>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <h4 className="font-medium text-red-800">Vendas de Ações</h4>
                    <p className="text-sm text-red-700">
                      Vendas até R$ 20.000/mês são isentas de IR. 
                      Acima disso, incide 15% sobre o ganho de capital.
                      Prejuízos podem ser compensados em operações futuras.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
