"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  History,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Calendar,
  Building2,
  Coins,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useInvestments } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import {
  InvestmentOperation,
  AssetType,
  OperationType,
} from "../../lib/types/investments";
import {
  formatCurrency,
  formatPercentage,
} from "../../lib/utils/investment-calculations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvestmentHistoryProps {
  className?: string;
}

type SortField =
  | "date"
  | "ticker"
  | "type"
  | "quantity"
  | "unitPrice"
  | "totalValue"
  | "result";
type SortDirection = "asc" | "desc";

export function InvestmentHistory({ className }: InvestmentHistoryProps) {
  const { state } = useInvestments();
  const { settings } = useSafeTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<OperationType | "all">("all");
  const [filterAssetType, setFilterAssetType] = useState<AssetType | "all">(
    "all",
  );
  const [filterBroker, setFilterBroker] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Obter todas as operações de todos os investimentos
  const allOperations = useMemo(() => {
    const operations: (InvestmentOperation & {
      investmentTicker: string;
      investmentName: string;
      assetType: AssetType;
      brokerName: string;
      brokerColor: string;
    })[] = [];

    state.investments.forEach((investment) => {
      const brokerName = "Corretora";

      investment.operations.forEach((operation) => {
        operations.push({
          ...operation,
          investmentTicker: investment.identifier,
          investmentName: investment.name,
          assetType: investment.assetType,
          brokerName: broker?.name || "Corretora não encontrada",
          brokerColor: broker?.color || "#666666",
        });
      });
    });

    return operations;
  }, [state.investments]);

  // Filtrar e ordenar operações
  const filteredAndSortedOperations = useMemo(() => {
    let filtered = allOperations.filter((operation) => {
      const matchesSearch =
        operation.investmentTicker
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        operation.investmentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        operation.brokerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" || operation.operationType === filterType;
      const matchesAssetType =
        filterAssetType === "all" || operation.assetType === filterAssetType;
      const matchesBroker =
        filterBroker === "all" || operation.brokerId === filterBroker;

      return matchesSearch && matchesType && matchesAssetType && matchesBroker;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case "ticker":
          aValue = a.investmentTicker;
          bValue = b.investmentTicker;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "unitPrice":
          aValue = a.unitPrice;
          bValue = b.unitPrice;
          break;
        case "totalValue":
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case "result":
          aValue = a.result || 0;
          bValue = b.result || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    allOperations,
    searchTerm,
    filterType,
    filterAssetType,
    filterBroker,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const getOperationTypeColor = (type: OperationType) => {
    return type === "buy" ? "text-green-600" : "text-red-600";
  };

  const getOperationTypeIcon = (type: OperationType) => {
    return type === "buy" ? TrendingUp : TrendingDown;
  };

  const getAssetTypeLabel = (type: AssetType) => {
    const labels = {
      stock: "Ação",
      fii: "FII",
      etf: "ETF",
      crypto: "Cripto",
      fixed_income: "Renda Fixa",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Ativo",
      "Nome",
      "Tipo Ativo",
      "Operação",
      "Quantidade",
      "Preço Unitário",
      "Valor Total",
      "Taxas",
      "Valor Líquido",
      "Resultado",
      "Corretora",
      "Conta",
      "Observações",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAndSortedOperations.map((op) =>
        [
          format(new Date(op.date), "dd/MM/yyyy"),
          op.investmentTicker,
          `"${op.investmentName}"`,
          getAssetTypeLabel(op.assetType),
          op.type === "buy" ? "Compra" : "Venda",
          op.quantity.toString().replace(".", ","),
          op.unitPrice.toString().replace(".", ","),
          op.totalValue.toString().replace(".", ","),
          op.fees.toString().replace(".", ","),
          op.netValue.toString().replace(".", ","),
          (op.result || 0).toString().replace(".", ","),
          `"${op.brokerName}"`,
          op.accountId,
          `"${op.notes || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `historico-investimentos-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estatísticas resumidas
  const stats = useMemo(() => {
    const totalOperations = filteredAndSortedOperations.length;
    const buyOperations = filteredAndSortedOperations.filter(
      (op) => op.type === "buy",
    ).length;
    const sellOperations = filteredAndSortedOperations.filter(
      (op) => op.type === "sell",
    ).length;
    const totalInvested = filteredAndSortedOperations
      .filter((op) => op.type === "buy")
      .reduce((sum, op) => sum + op.totalValue, 0);
    const totalReceived = filteredAndSortedOperations
      .filter((op) => op.type === "sell")
      .reduce((sum, op) => sum + op.netValue, 0);
    const totalResult = filteredAndSortedOperations.reduce(
      (sum, op) => sum + (op.result || 0),
      0,
    );

    return {
      totalOperations,
      buyOperations,
      sellOperations,
      totalInvested,
      totalReceived,
      totalResult,
    };
  }, [filteredAndSortedOperations]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History
                className={`h-5 w-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
              />
              <CardTitle>Histórico de Operações</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter
                  className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
                />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredAndSortedOperations.length === 0}
              >
                <Download
                  className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalOperations}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.buyOperations}
              </div>
              <div className="text-sm text-muted-foreground">Compras</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.sellOperations}
              </div>
              <div className="text-sm text-muted-foreground">Vendas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalInvested)}
              </div>
              <div className="text-sm text-muted-foreground">Investido</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalReceived)}
              </div>
              <div className="text-sm text-muted-foreground">Recebido</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  stats.totalResult >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(stats.totalResult)}
              </div>
              <div className="text-sm text-muted-foreground">Resultado</div>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-5">
                  <div>
                    <Input
                      placeholder="Buscar ativo ou corretora..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select
                    value={filterType}
                    onValueChange={(value: any) => setFilterType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Operação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="buy">Compra</SelectItem>
                      <SelectItem value="sell">Venda</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterAssetType}
                    onValueChange={(value: any) => setFilterAssetType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Ativo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="stock">Ações</SelectItem>
                      <SelectItem value="fii">FII</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="crypto">Cripto</SelectItem>
                      <SelectItem value="fixed_income">Renda Fixa</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBroker} onValueChange={setFilterBroker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Corretora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {[
                        "XP Investimentos",
                        "NuInvest",
                        "Clear Corretora",
                        "Modal Mais",
                        "BTG Pactual",
                      ].map((broker) => (
                        <SelectItem key={broker} value={broker}>
                          {broker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setFilterAssetType("all");
                      setFilterBroker("all");
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar
                        className={`h-4 w-4 ${settings.colorfulIcons ? "text-purple-600" : "text-muted-foreground"}`}
                      />
                      Data {getSortIcon("date")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("ticker")}
                  >
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      Ativo {getSortIcon("ticker")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("type")}
                  >
                    Operação {getSortIcon("type")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("quantity")}
                  >
                    Qtd {getSortIcon("quantity")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("unitPrice")}
                  >
                    Preço Unit. {getSortIcon("unitPrice")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("totalValue")}
                  >
                    Valor Total {getSortIcon("totalValue")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("result")}
                  >
                    Resultado {getSortIcon("result")}
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Building2
                        className={cn(
                          "h-4 w-4",
                          settings.colorfulIcons
                            ? "text-orange-600"
                            : "text-muted-foreground",
                        )}
                      />
                      Corretora
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedOperations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhuma operação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedOperations.map((operation) => {
                    const OperationIcon = getOperationTypeIcon(operation.type);

                    return (
                      <TableRow key={operation.id}>
                        <TableCell>
                          {format(new Date(operation.date), "dd/MM/yy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {operation.investmentTicker}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getAssetTypeLabel(operation.assetType)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-2 ${getOperationTypeColor(operation.type)}`}
                          >
                            <OperationIcon className="h-4 w-4" />
                            <Badge
                              variant={
                                operation.type === "buy"
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {operation.type === "buy" ? "Compra" : "Venda"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {operation.quantity.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(operation.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(operation.totalValue)}
                            </div>
                            {operation.fees > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Taxas: {formatCurrency(operation.fees)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {operation.result !== undefined && (
                            <div
                              className={`font-medium ${
                                operation.result >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(operation.result)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: operation.brokerColor }}
                            />
                            <span className="text-sm">
                              {operation.brokerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
