"use client";

import React, { useState, useCallback } from "react";
import { logComponents } from "../lib/logger";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Download,
  Upload,
  FileText,
  Table,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";
import type { Transaction, Account, Goal, Investment } from "../types";

interface ImportExportSystemProps {
  className?: string;
}

type ExportFormat = "csv" | "excel" | "json";
type ImportFormat = "csv" | "ofx" | "json";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
  account?: string;
}

export function ImportExportSystem({ className }: ImportExportSystemProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [importFormat, setImportFormat] = useState<ImportFormat>("csv");
  const [previewData, setPreviewData] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Export functions
  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const exportToJSON = useCallback((data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // Handle export
  const handleExport = useCallback(
    async (dataType: "transactions" | "accounts" | "goals" | "investments") => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        let data: any[] = [];
        let filename = "";

        // Get data based on type
        switch (dataType) {
          case "transactions":
            data = transactions || [];
            filename = `transacoes-${new Date().toISOString().split("T")[0]}`;
            break;
          case "accounts":
            data = accounts || [];
            filename = `contas-${new Date().toISOString().split("T")[0]}`;
            break;
          case "goals":
            data = goals || [];
            filename = `metas-${new Date().toISOString().split("T")[0]}`;
            break;
          case "investments":
            data = storage.getInvestments() || [];
            filename = `investimentos-${new Date().toISOString().split("T")[0]}`;
            break;
        }

        // Simulate progress
        const progressSteps = [25, 50, 75, 100];
        for (const step of progressSteps) {
          setExportProgress(step);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Export based on format
        switch (exportFormat) {
          case "csv":
            exportToCSV(data, `${filename}.csv`);
            break;
          case "json":
            exportToJSON(data, `${filename}.json`);
            break;
          case "excel":
            // For now, export as CSV (Excel support would require additional library)
            exportToCSV(data, `${filename}.csv`);
            toast.info("Exportado como CSV (compatível com Excel)");
            break;
        }

        toast.success(`${dataType} exportado com sucesso!`);
      } catch (error) {
        logComponents.error("Erro ao exportar:", error);
        toast.error("Erro ao exportar dados");
      } finally {
        setIsExporting(false);
        setExportProgress(0);
      }
    },
    [exportFormat, exportToCSV, exportToJSON],
  );

  // Parse CSV content
  const parseCSV = useCallback((content: string): ParsedTransaction[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));
      if (values.length !== headers.length) continue;

      const transaction: any = {};
      headers.forEach((header, index) => {
        transaction[header] = values[index];
      });

      // Map common CSV headers to our format
      const parsed: ParsedTransaction = {
        date:
          transaction.date ||
          transaction.data ||
          transaction["data da transação"] ||
          new Date().toISOString().split("T")[0],
        description:
          transaction.description ||
          transaction.descrição ||
          transaction.descricao ||
          transaction.histórico ||
          transaction.historico ||
          "Transação importada",
        amount: Math.abs(
          parseFloat(
            transaction.amount ||
              transaction.valor ||
              transaction.quantia ||
              "0",
          ),
        ),
        type:
          parseFloat(transaction.amount || transaction.valor || "0") >= 0
            ? "income"
            : "expense",
        category: transaction.category || transaction.categoria || "Importado",
        account: transaction.account || transaction.conta || "Conta Importada",
      };

      if (parsed.amount > 0) {
        transactions.push(parsed);
      }
    }

    return transactions;
  }, []);

  // Parse OFX content (simplified)
  const parseOFX = useCallback((content: string): ParsedTransaction[] => {
    const transactions: ParsedTransaction[] = [];

    // Simple OFX parsing - look for transaction blocks
    const transactionBlocks =
      content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/g) || [];

    transactionBlocks.forEach((block) => {
      const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
      const amountMatch = block.match(/<TRNAMT>([\d.-]+)/);
      const memoMatch = block.match(/<MEMO>([^<]+)/);
      const nameMatch = block.match(/<NAME>([^<]+)/);

      if (dateMatch && amountMatch) {
        const date = dateMatch[1];
        const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
        const amount = parseFloat(amountMatch[1]);

        transactions.push({
          date: formattedDate,
          description: memoMatch?.[1] || nameMatch?.[1] || "Transação OFX",
          amount: Math.abs(amount),
          type: amount >= 0 ? "income" : "expense",
          category: "Importado OFX",
          account: "Conta OFX",
        });
      }
    });

    return transactions;
  }, []);

  // Handle file selection for import
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportFile(file);
      setIsImporting(true);
      setImportProgress(0);

      try {
        const content = await file.text();
        setImportProgress(50);

        let parsed: ParsedTransaction[] = [];

        switch (importFormat) {
          case "csv":
            parsed = parseCSV(content);
            break;
          case "ofx":
            parsed = parseOFX(content);
            break;
          case "json":
            const jsonData = JSON.parse(content);
            parsed = Array.isArray(jsonData) ? jsonData : [];
            break;
        }

        setImportProgress(100);
        setPreviewData(parsed);
        setShowPreview(true);

        toast.success(
          `${parsed.length} transações encontradas para importação`,
        );
      } catch (error) {
        logComponents.error("Erro ao processar arquivo:", error);
        toast.error("Erro ao processar arquivo: " + (error as Error).message);
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        event.target.value = "";
      }
    },
    [importFormat, parseCSV, parseOFX],
  );

  // Confirm import
  const handleConfirmImport = useCallback(() => {
    if (previewData.length === 0) return;

    try {
      const existingTransactions = transactions || [];
      const newTransactions = previewData.map((t) => ({
        id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      storage.setTransactions([...existingTransactions, ...newTransactions]);

      toast.success(
        `${newTransactions.length} transações importadas com sucesso!`,
      );
      setShowPreview(false);
      setPreviewData([]);
      setImportFile(null);
    } catch (error) {
      logComponents.error("Erro ao importar:", error);
      toast.error("Erro ao importar transações");
    }
  }, [previewData]);

  return (
    <div className={className}>
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Exportar</TabsTrigger>
          <TabsTrigger value="import">Importar</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Exportar Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Formato de Exportação</Label>
                <Select
                  value={exportFormat}
                  onValueChange={(value: ExportFormat) =>
                    setExportFormat(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        CSV (Excel compatível)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        JSON
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        Excel (CSV)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Exportando... {exportProgress}%
                  </p>
                </div>
              )}

              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleExport("transactions")}
                  disabled={isExporting}
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Transações
                </Button>
                <Button
                  onClick={() => handleExport("accounts")}
                  disabled={isExporting}
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Contas
                </Button>
                <Button
                  onClick={() => handleExport("goals")}
                  disabled={isExporting}
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Metas
                </Button>
                <Button
                  onClick={() => handleExport("investments")}
                  disabled={isExporting}
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Investimentos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importar Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Formato de Importação</Label>
                <Select
                  value={importFormat}
                  onValueChange={(value: ImportFormat) =>
                    setImportFormat(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="ofx">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        OFX (Banco)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        JSON
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {importFormat === "csv" &&
                      "Certifique-se de que o CSV contém colunas: data, descrição, valor"}
                    {importFormat === "ofx" &&
                      "Arquivo OFX exportado do seu banco"}
                    {importFormat === "json" &&
                      "Arquivo JSON com estrutura de transações"}
                  </AlertDescription>
                </Alert>

                {isImporting && (
                  <div className="space-y-2">
                    <Progress value={importProgress} className="w-full" />
                    <p className="text-sm text-gray-600">
                      Processando arquivo... {importProgress}%
                    </p>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept={
                      importFormat === "csv"
                        ? ".csv"
                        : importFormat === "ofx"
                          ? ".ofx"
                          : ".json"
                    }
                    onChange={handleFileSelect}
                    disabled={isImporting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isImporting
                      ? "Processando..."
                      : `Selecionar Arquivo ${importFormat.toUpperCase()}`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Prévia da Importação ({previewData.length} transações)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Data</th>
                      <th className="text-left p-2">Descrição</th>
                      <th className="text-left p-2">Valor</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((transaction, index) => (
                      <tr
                        key={`preview-${transaction.id || index}`}
                        className="border-b"
                      >
                        <td className="p-2">
                          {new Date(transaction.date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </td>
                        <td className="p-2">{transaction.description}</td>
                        <td className="p-2">
                          R$ {transaction.amount.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              transaction.type === "income"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.type === "income"
                              ? "Receita"
                              : "Despesa"}
                          </Badge>
                        </td>
                        <td className="p-2">{transaction.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    ... e mais {previewData.length - 50} transações
                  </p>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmImport}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Importação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
