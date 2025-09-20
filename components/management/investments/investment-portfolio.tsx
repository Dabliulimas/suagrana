"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { logComponents } from "../lib/utils/logger";
import { useInvestments } from "../../../contexts/unified-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
  Download,
} from "lucide-react";
import {
  storage,
  type Investment,
  type Dividend,
  type InvestmentPosition,
} from "../../../lib/storage";
import { toast } from "../../../hooks/use-toast";
import { InvestmentModal } from "./investment-modal";
import { DividendManager } from "./dividend-manager";
import { PortfolioRebalancing } from "./portfolio-rebalancing";
import { InvestmentExport } from "./investment-export";
import { DuplicateConsolidation } from "./duplicate-consolidation";

interface InvestmentPortfolioProps {
  onUpdate?: () => void;
}

export function InvestmentPortfolio({ onUpdate }: InvestmentPortfolioProps) {
  const {
    investments: investmentsData,
    create: createInvestment,
    update: updateInvestment,
    delete: deleteInvestment,
  } = useInvestments();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showDividendManager, setShowDividendManager] = useState(false);
  const [showRebalancingModal, setShowRebalancingModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null,
  );
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [selectedInvestmentOperations, setSelectedInvestmentOperations] =
    useState<Investment[]>([]);

  useEffect(() => {
    setInvestments(investmentsData || []);
    setDividends([]);
  }, [investmentsData]);

  // Memoizar agrupamento de investimentos para evitar recálculos
  const groupedInvestments = useMemo(() => {
    if (!Array.isArray(investments)) {
      console.warn("Investments is not an array:", investments);
      return {};
    }

    return investments.reduce(
      (acc, inv) => {
        // Validate investment object
        if (!inv || typeof inv !== "object") {
          console.warn("Invalid investment object:", inv);
          return acc;
        }

        if (!inv.name || typeof inv.name !== "string") {
          console.warn("Investment missing name:", inv);
          return acc;
        }

        if (
          typeof inv.quantity !== "number" ||
          typeof inv.totalValue !== "number"
        ) {
          console.warn("Investment has invalid numeric values:", inv);
          return acc;
        }

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

        if (inv.operation === "buy") {
          acc[key].totalQuantity += inv.quantity;
          acc[key].totalInvested += inv.totalValue;
        } else {
          acc[key].totalQuantity -= inv.quantity;
          acc[key].totalInvested -= inv.totalValue;
        }

        return acc;
      },
      {} as Record<string, any>,
    );
  }, [investments]);

  const portfolioData = useMemo(
    () =>
      Object.values(groupedInvestments).filter(
        (inv: any) => inv.totalQuantity > 0,
      ),
    [groupedInvestments],
  );

  // Memoizar cálculos de totais e valores atuais
  const portfolioCalculations = useMemo(() => {
    const totalInvested = portfolioData.reduce(
      (sum: number, inv: any) => sum + inv.totalInvested,
      0,
    );

    const portfolioWithCurrentValues = portfolioData.map((inv: any) => {
      // Usar apenas dados reais - preço médio como preço atual até ter cotação real
      const averagePrice = inv.totalInvested / inv.totalQuantity;
      const currentPrice = averagePrice; // Sem dados fictícios - usar preço médio
      const currentValue = inv.totalQuantity * currentPrice;
      const returnValue = 0; // Sem retorno fictício - apenas quando houver dados reais
      const returnPercent = 0; // Sem percentual fictício
      const allocation =
        totalInvested > 0 ? (inv.totalInvested / totalInvested) * 100 : 0;

      return {
        ...inv,
        currentPrice,
        currentValue,
        returnValue,
        returnPercent,
        allocation,
        averagePrice,
      };
    });

    const totalCurrentValue = portfolioWithCurrentValues.reduce(
      (sum, inv) => sum + inv.currentValue,
      0,
    );
    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnPercent =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return {
      totalInvested,
      portfolioWithCurrentValues,
      totalCurrentValue,
      totalReturn,
      totalReturnPercent,
    };
  }, [portfolioData]);

  const {
    totalInvested,
    portfolioWithCurrentValues,
    totalCurrentValue,
    totalReturn,
    totalReturnPercent,
  } = portfolioCalculations;

  const handleEdit = useCallback((investment: Investment) => {
    setEditingInvestment(investment);
    setShowInvestmentModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("Tem certeza que deseja excluir este investimento?")) {
        try {
          await deleteInvestment(id);
          toast.success("Investimento excluído com sucesso!");
          if (onUpdate) onUpdate();
        } catch (error) {
          toast.error("Erro ao excluir investimento");
        }
      }
    },
    [actions, onUpdate],
  );

  const handleViewOperations = useCallback((operations: Investment[]) => {
    setSelectedInvestmentOperations(operations);
    setShowOperationsModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowInvestmentModal(false);
    setEditingInvestment(null);
    // Os dados serão atualizados automaticamente via useEffect quando o state mudar
    if (onUpdate) onUpdate();
  }, [onUpdate]);

  // Calculate dividend totals
  const totalDividendsReceived = dividends.reduce(
    (sum, div) => sum + div.totalAmount,
    0,
  );
  const currentYearDividends = dividends
    .filter(
      (div) => new Date(div.payDate).getFullYear() === new Date().getFullYear(),
    )
    .reduce((sum, div) => sum + div.totalAmount, 0);

  // Sector analysis
  const sectorAnalysis = useMemo(() => {
    const sectors: Record<
      string,
      { invested: number; current: number; count: number }
    > = {};

    portfolioWithCurrentValues.forEach((inv: any) => {
      const sector = inv.sector || "Outros";
      if (!sectors[sector]) {
        sectors[sector] = { invested: 0, current: 0, count: 0 };
      }
      sectors[sector].invested += inv.totalInvested;
      sectors[sector].current += inv.currentValue;
      sectors[sector].count += 1;
    });

    return Object.entries(sectors)
      .map(([sector, data]) => ({
        sector,
        ...data,
        allocation:
          totalCurrentValue > 0 ? (data.current / totalCurrentValue) * 100 : 0,
        return: data.current - data.invested,
        returnPercent:
          data.invested > 0
            ? ((data.current - data.invested) / data.invested) * 100
            : 0,
      }))
      .sort((a, b) => b.current - a.current);
  }, [portfolioWithCurrentValues, totalCurrentValue]);

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger value="positions" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Posições
        </TabsTrigger>
        <TabsTrigger value="dividends" className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Dividendos
        </TabsTrigger>
        <TabsTrigger value="analysis" className="flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Análise
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Investido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {totalInvested.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R${" "}
                {totalCurrentValue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Rentabilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold flex items-center ${totalReturnPercent >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {totalReturnPercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 mr-1" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-1" />
                )}
                {totalReturnPercent >= 0 ? "+" : ""}
                {totalReturnPercent.toFixed(2)}%
              </div>
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
                className={`text-2xl font-bold ${totalReturn >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {totalReturn >= 0 ? "+" : ""}R${" "}
                {totalReturn.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Dividendos (Ano)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R${" "}
                {currentYearDividends.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRebalancingModal(true)}
          >
            <Target className="w-4 h-4 mr-2" />
            Rebalanceamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowConsolidationModal(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Consolidar Duplicatas
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDividendManager(true)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Gerenciar Dividendos
          </Button>
          <Button
            onClick={() => setShowInvestmentModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Investimento
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="positions" className="space-y-6">
        {/* Investment Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Posições em Carteira</CardTitle>
            <CardDescription>
              Seus ativos e performance detalhada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {portfolioWithCurrentValues.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum investimento encontrado
                </p>
              ) : (
                portfolioWithCurrentValues.map((investment, index) => (
                  <div
                    key={`allocation-${index}`}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {investment.ticker
                            ? `${investment.ticker} - ${investment.name}`
                            : investment.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">
                            {investment.type === "stock"
                              ? "Ações"
                              : investment.type === "fii"
                                ? "FII"
                                : investment.type === "treasury"
                                  ? "Tesouro"
                                  : investment.type === "cdb"
                                    ? "CDB"
                                    : investment.type === "crypto"
                                      ? "Cripto"
                                      : "Fundo"}
                          </Badge>
                          {investment.sector && (
                            <Badge variant="secondary">
                              {investment.sector}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          R${" "}
                          {investment.currentValue.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={`text-sm flex items-center justify-end ${investment.returnPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {investment.returnPercent >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {investment.returnPercent >= 0 ? "+" : ""}
                          {investment.returnPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Valor Investido</p>
                        <p className="font-medium">
                          R$ {investment.totalInvested.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantidade</p>
                        <p className="font-medium">
                          {investment.totalQuantity.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preço Médio</p>
                        <p className="font-medium">
                          R$ {investment.averagePrice.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Preço Atual</p>
                        <p className="font-medium">
                          R$ {investment.currentPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Alocação na carteira</span>
                        <span>{investment.allocation.toFixed(1)}%</span>
                      </div>
                      <Progress value={investment.allocation} className="h-2" />
                    </div>

                    <div className="flex justify-end mt-4 space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewOperations(investment.operations)
                        }
                      >
                        Ver Histórico
                      </Button>
                      <Button variant="outline" size="sm">
                        Comprar Mais
                      </Button>
                      <Button variant="outline" size="sm">
                        Vender
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dividends" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R${" "}
                {totalDividendsReceived.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Todos os períodos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Recebido em {new Date().getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R${" "}
                {currentYearDividends.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Ano atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Yield sobre Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {totalCurrentValue > 0
                  ? ((currentYearDividends / totalCurrentValue) * 100).toFixed(
                      2,
                    )
                  : "0.00"}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado no valor atual
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Dividendos Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            {dividends.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum dividendo registrado
              </p>
            ) : (
              <div className="space-y-4">
                {dividends
                  .sort(
                    (a, b) =>
                      new Date(b.payDate).getTime() -
                      new Date(a.payDate).getTime(),
                  )
                  .slice(0, 10)
                  .map((dividend) => (
                    <div
                      key={dividend.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{dividend.ticker}</p>
                        <p className="text-sm text-gray-500">
                          {dividend.quantity} cotas × R${" "}
                          {dividend.amount.toFixed(4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          R${" "}
                          {dividend.totalAmount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(dividend.payDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analysis" className="space-y-6">
        {/* Sector Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análise por Setor</CardTitle>
            <CardDescription>
              Diversificação da carteira por setores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sectorAnalysis.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum dado de setor disponível
              </p>
            ) : (
              <div className="space-y-4">
                {sectorAnalysis.map((sector) => (
                  <div key={sector.sector} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{sector.sector}</p>
                        <p className="text-sm text-gray-500">
                          {sector.count} ativo(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R${" "}
                          {sector.current.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={`text-sm ${sector.returnPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {sector.returnPercent >= 0 ? "+" : ""}
                          {sector.returnPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Alocação</span>
                        <span>{sector.allocation.toFixed(1)}%</span>
                      </div>
                      <Progress value={sector.allocation} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Investment List */}
      <Card>
        <CardHeader>
          <CardTitle>Carteira de Investimentos</CardTitle>
          <CardDescription>Seus ativos e performance detalhada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {portfolioWithCurrentValues.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum investimento encontrado
              </p>
            ) : (
              portfolioWithCurrentValues.map((investment, index) => (
                <div
                  key={`performance-${index}`}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {investment.ticker
                          ? `${investment.ticker} - ${investment.name}`
                          : investment.name}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {investment.type === "stock"
                          ? "Ações"
                          : investment.type === "fii"
                            ? "FII"
                            : investment.type === "treasury"
                              ? "Tesouro"
                              : investment.type === "cdb"
                                ? "CDB"
                                : "Cripto"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        R${" "}
                        {investment.currentValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={`text-sm flex items-center justify-end ${investment.returnPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {investment.returnPercent >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {investment.returnPercent >= 0 ? "+" : ""}
                        {investment.returnPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Valor Investido</p>
                      <p className="font-medium">
                        R$ {investment.totalInvested.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantidade</p>
                      <p className="font-medium">
                        {investment.totalQuantity.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Preço Médio</p>
                      <p className="font-medium">
                        R$ {investment.averagePrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Preço Atual</p>
                      <p className="font-medium">
                        R$ {investment.currentPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Alocação na carteira</span>
                      <span>{investment.allocation.toFixed(1)}%</span>
                    </div>
                    <Progress value={investment.allocation} className="h-2" />
                  </div>

                  <div className="flex justify-end mt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleViewOperations(investment.operations)
                      }
                    >
                      Ver Histórico
                    </Button>
                    <Button variant="outline" size="sm">
                      Comprar Mais
                    </Button>
                    <Button variant="outline" size="sm">
                      Vender
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Operations List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Operações</CardTitle>
          <CardDescription>
            Histórico completo de compras e vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma operação encontrada
              </p>
            ) : (
              investments.map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        investment.operation === "buy"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {investment.operation === "buy" ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {investment.ticker
                            ? `${investment.ticker} - ${investment.name}`
                            : investment.name}
                        </p>
                        <Badge
                          variant={
                            investment.operation === "buy"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {investment.operation === "buy" ? "Compra" : "Venda"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{investment.quantity} unidades</span>
                        <span>•</span>
                        <span>R$ {investment.price.toFixed(2)} cada</span>
                        <span>•</span>
                        <span>
                          {new Date(investment.date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        <span>•</span>
                        <span>{investment.account}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p
                        className={`font-semibold text-lg ${
                          investment.operation === "buy"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {investment.operation === "buy" ? "-" : "+"}R${" "}
                        {investment.totalValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {investment.fees > 0 && (
                        <p className="text-xs text-gray-500">
                          Taxas: R$ {investment.fees.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(investment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(investment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Operations List - moved to overview tab */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Operações</CardTitle>
          <CardDescription>
            Histórico completo de compras e vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma operação encontrada
              </p>
            ) : (
              investments.slice(0, 10).map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        investment.operation === "buy"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {investment.operation === "buy" ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {investment.ticker
                            ? `${investment.ticker} - ${investment.name}`
                            : investment.name}
                        </p>
                        <Badge
                          variant={
                            investment.operation === "buy"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {investment.operation === "buy" ? "Compra" : "Venda"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{investment.quantity} unidades</span>
                        <span>•</span>
                        <span>R$ {investment.price.toFixed(2)} cada</span>
                        <span>•</span>
                        <span>
                          {new Date(investment.date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        <span>•</span>
                        <span>{investment.account}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p
                        className={`font-semibold text-lg ${
                          investment.operation === "buy"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {investment.operation === "buy" ? "-" : "+"}R${" "}
                        {investment.totalValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      {investment.fees > 0 && (
                        <p className="text-xs text-gray-500">
                          Taxas: R$ {investment.fees.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(investment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(investment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Investment Modal */}
      {showInvestmentModal && (
        <InvestmentModal
          onClose={handleModalClose}
          onSave={handleModalClose}
          investment={editingInvestment || undefined}
        />
      )}

      {/* Dividend Manager */}
      {showDividendManager && (
        <DividendManager investments={investments} onUpdate={loadInvestments} />
      )}

      {/* Operations History Modal */}
      <Dialog open={showOperationsModal} onOpenChange={setShowOperationsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Operações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInvestmentOperations.map((operation) => (
              <div key={operation.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge
                      variant={
                        operation.operation === "buy"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {operation.operation === "buy" ? "Compra" : "Venda"}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(operation.date).toLocaleDateString("pt-BR")}
                    </p>
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
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Quantidade</p>
                    <p className="font-medium">{operation.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Preço</p>
                    <p className="font-medium">
                      R$ {operation.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Conta</p>
                    <p className="font-medium">{operation.account}</p>
                  </div>
                </div>
                {operation.fees > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Taxas: R$ {operation.fees.toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <PortfolioRebalancing
        open={showRebalancingModal}
        onOpenChange={setShowRebalancingModal}
        portfolioData={portfolioData}
        totalCurrentValue={totalCurrentValue}
      />

      <InvestmentExport
        open={showExportModal}
        onOpenChange={setShowExportModal}
        portfolioData={portfolioData}
        dividendsData={dividends}
        totalCurrentValue={totalCurrentValue}
        totalInvested={totalInvested}
        totalReturn={totalReturn}
      />

      <DuplicateConsolidation
        open={showConsolidationModal}
        onOpenChange={setShowConsolidationModal}
        onConsolidationComplete={() => {
          setShowConsolidationModal(false);
          if (onUpdate) onUpdate();
        }}
      />
    </Tabs>
  );
}
