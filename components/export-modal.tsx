"use client";

import { useState } from "react";
import { logComponents } from "../lib/logger";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Download,
  FileText,
  Table,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { exportToCSV, exportToPDF } from "../lib/export-utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [dateRange, setDateRange] = useState("last-3-months");
  const [selectedData, setSelectedData] = useState({
    transactions: true,
    investments: true,
    budget: true,
    summary: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const dateRangeOptions = [
    { value: "last-month", label: "Ultimo mes" },
    { value: "last-3-months", label: "Ultimos 3 meses" },
    { value: "last-6-months", label: "Ultimos 6 meses" },
    { value: "last-year", label: "Ultimo ano" },
    { value: "current-year", label: "Ano atual" },
    { value: "all-time", label: "Todo o periodo" },
  ];

  const handleDataSelection = (
    dataType: keyof typeof selectedData,
    checked: boolean,
  ) => {
    setSelectedData((prev) => ({
      ...prev,
      [dataType]: checked,
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Get real data from UnifiedFinancialSystem
      const { UnifiedFinancialSystem } = await import("@/lib/unified-financial-system");
      const financialSystem = UnifiedFinancialSystem.getInstance();

      // Filter data by date range if specified
      const filterByDateRange = (items: any[]) => {
        if (!dateRange || dateRange === "all") return items;

        const now = new Date();
        let startDate: Date;

        switch (dateRange) {
          case "last-30-days":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "last-3-months":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
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
          case "current-year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            return items;
        }

        return items.filter((item) => {
          const itemDate = new Date(item.date || item.createdAt);
          return itemDate >= startDate && itemDate <= now;
        });
      };

      const allTransactions = await financialSystem.getTransactions();
      const allInvestments = await financialSystem.getInvestments();
      const allAccounts = await financialSystem.getAccounts();

      const filteredTransactions = filterByDateRange(allTransactions);
      const filteredInvestments = filterByDateRange(allInvestments);

      // Calculate budget data from transactions
      const calculateBudgetData = () => {
        const categorySpending: Record<string, number> = {};
        filteredTransactions.forEach((t) => {
          if (t.type === "expense") {
            categorySpending[t.category] =
              (categorySpending[t.category] || 0) + Math.abs(t.amount);
          }
        });

        return Object.entries(categorySpending).map(([category, spent]) => {
          const budgeted = spent * 1.2; // Estimate budget as 120% of spending
          return {
            category,
            budgeted: Math.round(budgeted),
            spent: Math.round(spent),
            remaining: Math.round(budgeted - spent),
          };
        });
      };

      // Calculate summary data
      const calculateSummary = () => {
        const totalBalance = allAccounts.reduce(
          (sum, acc) => sum + acc.balance,
          0,
        );
        const monthlyIncome = filteredTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const monthlyExpenses = filteredTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const investments = filteredInvestments.reduce(
          (sum, inv) => sum + inv.totalValue,
          0,
        );
        const savingsRate =
          monthlyIncome > 0
            ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
            : 0;

        return {
          totalBalance: Math.round(totalBalance * 100) / 100,
          monthlyIncome: Math.round(monthlyIncome * 100) / 100,
          monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
          investments: Math.round(investments * 100) / 100,
          savingsRate: Math.round(savingsRate * 100) / 100,
          period: dateRange,
        };
      };

      const exportData = {
        transactions: selectedData.transactions ? filteredTransactions : [],
        investments: selectedData.investments ? filteredInvestments : [],
        budget: selectedData.budget ? calculateBudgetData() : [],
        summary: selectedData.summary ? calculateSummary() : null,
      };

      if (exportFormat === "csv") {
        await exportToCSV(exportData, dateRange);
      } else {
        await exportToPDF(exportData, dateRange);
      }

      onClose();
    } catch (error) {
      logComponents.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const hasSelectedData = Object.values(selectedData).some(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Dados Financeiros
          </DialogTitle>
          <DialogDescription>
            Escolha o formato e os dados que deseja exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Formato de Exportação
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${exportFormat === "csv" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => setExportFormat("csv")}
              >
                <CardContent className="p-4 text-center">
                  <Table className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium">CSV</h3>
                  <p className="text-sm text-gray-600">
                    Planilha Excel/Google Sheets
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${exportFormat === "pdf" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                onClick={() => setExportFormat("pdf")}
              >
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <h3 className="font-medium">PDF</h3>
                  <p className="text-sm text-gray-600">Relatório formatado</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Período</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Dados para Exportar</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transactions"
                    checked={selectedData.transactions}
                    onCheckedChange={(checked) =>
                      handleDataSelection("transactions", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="transactions"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Transações
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="investments"
                    checked={selectedData.investments}
                    onCheckedChange={(checked) =>
                      handleDataSelection("investments", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="investments"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Investimentos
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="budget"
                    checked={selectedData.budget}
                    onCheckedChange={(checked) =>
                      handleDataSelection("budget", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="budget"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Table className="w-4 h-4 text-purple-600" />
                    Orçamento
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summary"
                    checked={selectedData.summary}
                    onCheckedChange={(checked) =>
                      handleDataSelection("summary", checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="summary"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-orange-600" />
                    Resumo
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          {hasSelectedData && (
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prévia da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Formato:</strong> {exportFormat.toUpperCase()}
                  </p>
                  <p>
                    <strong>Período:</strong>{" "}
                    {
                      dateRangeOptions.find((opt) => opt.value === dateRange)
                        ?.label
                    }
                  </p>
                  <p>
                    <strong>Dados inclusos:</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {selectedData.transactions && (
                      <li>Transações financeiras</li>
                    )}
                    {selectedData.investments && (
                      <li>Carteira de investimentos</li>
                    )}
                    {selectedData.budget && <li>Orçamento por categoria</li>}
                    {selectedData.summary && <li>Resumo financeiro</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={!hasSelectedData || isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
