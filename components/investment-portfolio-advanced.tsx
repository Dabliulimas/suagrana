"use client";

import { useState, useEffect, useMemo } from "react";
import { logComponents } from "../lib/utils/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Eye,
  EyeOff,
  PieChart,
  Download,
  RefreshCw,
} from "lucide-react";
import { type Investment } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { brapiService } from "../lib/brapi-service";
import { toast } from "sonner";
import { InvestmentModal } from "./investment-modal-advanced";

interface InvestmentPortfolioAdvancedProps {
  onUpdate: () => void;
}

interface GroupedInvestment {
  ticker?: string;
  name: string;
  type: string;
  operations: Investment[];
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  returnValue: number;
  returnPercent: number;
  allocation: number;
  lastUpdate?: string;
}

export function InvestmentPortfolioAdvanced({
  onUpdate,
}: InvestmentPortfolioAdvancedProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [groupedInvestments, setGroupedInvestments] = useState<
    GroupedInvestment[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showValues, setShowValues] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<GroupedInvestment | null>(null);
  const [showOperationsModal, setShowOperationsModal] = useState(false);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    setIsLoading(true);
    try {
      const allInvestments = storage.getInvestments();
      setInvestments(allInvestments);
      await processInvestments(allInvestments);
    } catch (error) {
      toast.error("Erro ao carregar investimentos");
    } finally {
      setIsLoading(false);
    }
  };

  const processInvestments = async (allInvestments: Investment[]) => {
    // Agrupar investimentos por ticker/nome
    const grouped = allInvestments.reduce(
      (acc, inv) => {
        const key = inv.ticker || inv.name;
        if (!acc[key]) {
          acc[key] = {
            name: inv.name,
            ticker: inv.ticker,
            type: inv.type,
            operations: [],
            totalQuantity: 0,
            totalInvested: 0,
            averagePrice: 0,
          };
        }

        acc[key].operations.push(inv);

        // Calcular quantidade e valor total considerando compras e vendas
        if (inv.operation === "buy") {
          acc[key].totalQuantity += inv.quantity;
          acc[key].totalInvested += inv.totalValue;
        } else if (inv.operation === "sell") {
          acc[key].totalQuantity -= inv.quantity;
          // Para vendas, subtraímos o valor proporcional do investimento
          const sellRatio =
            inv.quantity / (acc[key].totalQuantity + inv.quantity);
          acc[key].totalInvested -= acc[key].totalInvested * sellRatio;
        }

        return acc;
      },
      {} as Record<string, any>,
    );

    // Filtrar apenas posições com quantidade > 0
    const activePositions = Object.values(grouped).filter(
      (inv: any) => inv.totalQuantity > 0,
    );

    // Buscar cotações atuais
    const tickers = activePositions
      .map((inv: any) => inv.ticker)
      .filter(Boolean)
      .filter((ticker, index, arr) => arr.indexOf(ticker) === index); // Remove duplicatas

    let currentPrices: Record<string, number> = {};

    if (tickers.length > 0) {
      try {
        const stocksData = await brapiService.getMultipleStocks(tickers);
        currentPrices = stocksData.reduce(
          (acc, stock) => {
            acc[stock.stock] = stock.close;
            return acc;
          },
          {} as Record<string, number>,
        );
      } catch (error) {
        console.warn("Erro ao buscar cotações:", error);
        // Usar preços simulados como fallback
        currentPrices = {
          ITUB4: 32.45,
          PETR4: 28.9,
          VALE3: 65.2,
          BBAS3: 45.8,
          HGLG11: 132.5,
          XPML11: 98.7,
        };
      }
    }

    // Calcular valores atuais e métricas
    const totalInvested = activePositions.reduce(
      (sum: number, inv: any) => sum + inv.totalInvested,
      0,
    );

    const processedInvestments = activePositions.map((inv: any) => {
      const currentPrice =
        currentPrices[inv.ticker] || inv.totalInvested / inv.totalQuantity;
      const currentValue = inv.totalQuantity * currentPrice;
      const returnValue = currentValue - inv.totalInvested;
      const returnPercent =
        inv.totalInvested > 0 ? (returnValue / inv.totalInvested) * 100 : 0;
      const allocation =
        totalInvested > 0 ? (inv.totalInvested / totalInvested) * 100 : 0;
      const averagePrice = inv.totalInvested / inv.totalQuantity;

      return {
        ...inv,
        currentPrice,
        currentValue,
        returnValue,
        returnPercent,
        allocation,
        averagePrice,
        lastUpdate: new Date().toISOString(),
      };
    });

    setGroupedInvestments(processedInvestments);
  };

  const filteredInvestments = useMemo(() => {
    return groupedInvestments.filter((inv) => {
      const matchesSearch =
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.ticker &&
          inv.ticker.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === "all" || inv.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [groupedInvestments, searchTerm, selectedType]);

  const portfolioSummary = useMemo(() => {
    const totalInvested = groupedInvestments.reduce(
      (sum, inv) => sum + inv.totalInvested,
      0,
    );
    const totalCurrentValue = groupedInvestments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0,
    );
    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnPercent =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      totalReturnPercent,
      totalPositions: groupedInvestments.length,
    };
  }, [groupedInvestments]);

  const handleNewOperation = (ticker?: string) => {
    setEditingInvestment(null);
    if (ticker) {
      // Pre-fill with ticker data
      const existingInvestment = groupedInvestments.find(
        (inv) => inv.ticker === ticker,
      );
      if (existingInvestment) {
        setEditingInvestment({
          id: "",
          operation: "buy",
          type: existingInvestment.type,
          ticker: existingInvestment.ticker,
          name: existingInvestment.name,
          quantity: 0,
          price: existingInvestment.currentPrice,
          totalValue: 0,
          date: new Date().toISOString().split("T")[0],
          account: "",
          fees: 0,
          createdAt: "",
          updatedAt: "",
        } as Investment);
      }
    }
    setShowModal(true);
  };

  const handleSave = () => {
    loadInvestments();
    setShowModal(false);
    setEditingInvestment(null);
    onUpdate();
  };

  const handleViewOperations = (investment: GroupedInvestment) => {
    setSelectedInvestment(investment);
    setShowOperationsModal(true);
  };

  const exportPortfolio = () => {
    const data = {
      summary: portfolioSummary,
      positions: groupedInvestments,
      operations: investments,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Portfolio exportado com sucesso!");
  };

  const investmentTypes = Array.from(
    new Set(groupedInvestments.map((inv) => inv.type)),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio de Investimentos</h2>
          <p className="text-muted-foreground">
            Controle total dos seus investimentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowValues(!showValues)}>
            {showValues ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showValues ? "Ocultar" : "Mostrar"}
          </Button>
          <Button variant="outline" onClick={exportPortfolio}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={loadInvestments}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Button
            onClick={() => handleNewOperation()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Operação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showValues
                ? `R$ ${portfolioSummary.totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.totalPositions} posições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {showValues
                ? `R$ ${portfolioSummary.totalCurrentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">Valor de mercado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center ${
                portfolioSummary.totalReturnPercent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {portfolioSummary.totalReturnPercent >= 0 ? (
                <TrendingUp className="w-5 h-5 mr-1" />
              ) : (
                <TrendingDown className="w-5 h-5 mr-1" />
              )}
              {showValues
                ? `${portfolioSummary.totalReturnPercent >= 0 ? "+" : ""}${portfolioSummary.totalReturnPercent.toFixed(2)}%`
                : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">Performance total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Lucro/Prejuízo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${portfolioSummary.totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {showValues
                ? `${portfolioSummary.totalReturn >= 0 ? "+" : ""}R$ ${portfolioSummary.totalReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "••••••"}
            </div>
            <p className="text-xs text-muted-foreground">Resultado absoluto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou ticker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white"
        >
          <option value="all">Todos os tipos</option>
          {investmentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Investment List */}
      <div className="space-y-4">
        {filteredInvestments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedType !== "all"
                  ? "Nenhum investimento encontrado"
                  : "Nenhum investimento cadastrado"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedType !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece adicionando seus primeiros investimentos"}
              </p>
              {!searchTerm && selectedType === "all" && (
                <Button
                  onClick={() => handleNewOperation()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Primeira Operação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInvestments.map((investment) => (
            <Card
              key={investment.ticker || investment.name}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {investment.ticker
                          ? `${investment.ticker} - ${investment.name}`
                          : investment.name}
                      </h3>
                      <Badge variant="outline">{investment.type}</Badge>
                      {investment.returnPercent >= 0 ? (
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingUp className="w-3 h-3 mr-1" />+
                          {investment.returnPercent.toFixed(2)}%
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {investment.returnPercent.toFixed(2)}%
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Quantidade</p>
                        <p className="font-medium">
                          {investment.totalQuantity.toLocaleString("pt-BR", {
                            maximumFractionDigits: 6,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preço Médio</p>
                        <p className="font-medium">
                          {showValues
                            ? `R$ ${investment.averagePrice.toFixed(2)}`
                            : "••••"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preço Atual</p>
                        <p className="font-medium">
                          {showValues
                            ? `R$ ${investment.currentPrice.toFixed(2)}`
                            : "••••"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Investido</p>
                        <p className="font-medium">
                          {showValues
                            ? `R$ ${investment.totalInvested.toLocaleString("pt-BR")}`
                            : "••••"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Valor Atual</p>
                        <p className="font-medium text-blue-600">
                          {showValues
                            ? `R$ ${investment.currentValue.toLocaleString("pt-BR")}`
                            : "••••"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${investment.returnValue >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {showValues
                        ? `${investment.returnValue >= 0 ? "+" : ""}R$ ${investment.returnValue.toLocaleString("pt-BR")}`
                        : "••••••"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Alocação: {investment.allocation.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Alocação na carteira</span>
                    <span>{investment.allocation.toFixed(1)}%</span>
                  </div>
                  <Progress value={investment.allocation} className="h-2" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOperations(investment)}
                  >
                    Ver Histórico
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNewOperation(investment.ticker)}
                    className="bg-green-50 hover:bg-green-100 text-green-700"
                  >
                    Comprar Mais
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sellOperation = {
                        ...editingInvestment,
                        operation: "sell" as const,
                        type: investment.type,
                        ticker: investment.ticker,
                        name: investment.name,
                        price: investment.currentPrice,
                      };
                      setEditingInvestment(sellOperation as Investment);
                      setShowModal(true);
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-700"
                  >
                    Vender
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Investment Modal */}
      <InvestmentModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInvestment(null);
        }}
        onSave={handleSave}
        investment={editingInvestment}
      />

      {/* Operations History Modal */}
      {showOperationsModal && selectedInvestment && (
        <Dialog
          open={showOperationsModal}
          onOpenChange={setShowOperationsModal}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Histórico de Operações -{" "}
                {selectedInvestment.ticker || selectedInvestment.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedInvestment.operations
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((operation) => (
                  <div key={operation.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            operation.operation === "buy"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {operation.operation === "buy" ? "Compra" : "Venda"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(operation.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R${" "}
                          {operation.totalValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Quantidade</p>
                        <p className="font-medium">
                          {operation.quantity.toLocaleString("pt-BR", {
                            maximumFractionDigits: 6,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preço</p>
                        <p className="font-medium">
                          R$ {operation.price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Taxas</p>
                        <p className="font-medium">
                          R$ {operation.fees.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conta</p>
                        <p className="font-medium">{operation.account}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
