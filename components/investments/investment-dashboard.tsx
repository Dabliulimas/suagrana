"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Settings,
  Filter,
  Download,
  AlertTriangle,
  DollarSign,
  Target,
  Calendar,
  Building2,
} from "lucide-react";
import { useInvestments } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import { InvestmentList } from "./investment-list";
import { InvestmentOperationModal } from "./investment-operation-modal";
import { InvestmentReports } from "./investment-reports";
import { InvestmentHistory } from "./investment-history";
import { DividendModal } from "./dividend-modal";
import { InvestmentSaleModal } from "./investment-sale-modal";
import { InvestmentIRReport } from "./investment-ir-report";

// Função para calcular valor atual
function calculateCurrentValue(investment) {
  if (!investment) return 0;
  const currentPrice = investment.currentPrice || investment.averagePrice || 0;
  const quantity = investment.totalQuantity || investment.quantity || 0;
  return currentPrice * quantity;
}

// Função para calcular distribuição de ativos
function calculateAssetDistribution(investments) {
  if (!Array.isArray(investments)) return [];

  const distribution = {};
  investments.forEach((inv) => {
    if (!inv || !inv.assetType) return;
    const type = inv.assetType;
    const value = calculateCurrentValue(inv);
    distribution[type] = (distribution[type] || 0) + value;
  });

  return Object.entries(distribution).map(([type, value]) => ({
    type,
    value,
    percentage: 0, // Será calculado depois
  }));
}

export function InvestmentDashboard() {
  const router = useRouter();
  const { investments, isLoading, error, refresh } = useInvestments();
  const { settings } = useSafeTheme();
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationType, setOperationType] = useState<"buy" | "sell">("buy");
  const [showFilters, setShowFilters] = useState(false);
  const [showBrokerManagement, setShowBrokerManagement] = useState(false);
  const [showDividendModal, setShowDividendModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("portfolio");

  const loading = isLoading || false;

  // Dados de investimentos agora vêm do banco via DataService
  const [localInvestments, setLocalInvestments] = useState([]);
  
  useEffect(() => {
    /**
     * @deprecated localStorage não é mais usado - dados ficam no banco
     */
    const loadInvestments = () => {
      console.log("loadInvestments foi removida - localStorage não é mais usado");
      // Dados agora vêm do banco via DataService
      setLocalInvestments([]);
    };
    
    loadInvestments();
    
    // localStorage removido - dados agora vêm do banco via DataService
  }, []);
  
  // Converter investimentos para formato esperado pelo componente
  const formattedInvestments = Array.isArray(localInvestments)
    ? localInvestments.filter(inv => inv.status === 'active' && (inv.quantity || 0) > 0).map((inv) => ({
        id: inv.id,
        identifier: inv.symbol || inv.name,
        name: inv.name,
        assetType: inv.type as "stock" | "fii" | "treasury" | "crypto" | "fund",
        quantity: Number(inv.quantity),
        averagePrice: Number(inv.purchasePrice),
        currentPrice: inv.currentPrice
          ? Number(inv.currentPrice)
          : Number(inv.purchasePrice),
        brokerId: inv.broker || "unknown",
        accountId: "conta-1",
        operation: "buy" as const,
        date: new Date(inv.purchaseDate),
        fees: Number(inv.fees || 0),
        notes: inv.notes || "",
        status: inv.status || "active",
        totalQuantity: Number(inv.quantity),
        totalInvested: Number(inv.quantity) * Number(inv.purchasePrice),
        profitLoss: (Number(inv.currentPrice || inv.purchasePrice) - Number(inv.purchasePrice)) * Number(inv.quantity),
        profitLossPercentage: ((Number(inv.currentPrice || inv.purchasePrice) - Number(inv.purchasePrice)) / Number(inv.purchasePrice)) * 100
      }))
    : [];

  // Verificações de segurança
  const safeInvestments = formattedInvestments;
  const safeActiveInvestments = safeInvestments.filter(
    (inv) => inv && inv.status === "active",
  );

  // Mock temporário para portfolioSummary
  const portfolioSummary = {
    currentValue: safeActiveInvestments.reduce((sum, inv) => {
      const currentPrice = inv.currentPrice || 0;
      const quantity = inv.quantity || 0;
      return sum + currentPrice * quantity;
    }, 0),
    totalInvested: safeActiveInvestments.reduce((sum, inv) => {
      const purchasePrice = inv.purchasePrice || 0;
      const quantity = inv.quantity || 0;
      return sum + purchasePrice * quantity;
    }, 0),
    totalGainLoss: 0,
    totalGainLossPercentage: 0,
  };
  portfolioSummary.totalGainLoss =
    portfolioSummary.currentValue - portfolioSummary.totalInvested;
  portfolioSummary.totalGainLossPercentage =
    portfolioSummary.totalInvested > 0
      ? (portfolioSummary.totalGainLoss / portfolioSummary.totalInvested) * 100
      : 0;

  // Mock temporário para brokers
  const brokers = [
    { id: "xp", name: "XP Investimentos", color: "#FF6B35" },
    { id: "nuinvest", name: "NuInvest", color: "#8A05BE" },
    { id: "clear", name: "Clear Corretora", color: "#00D4AA" },
    { id: "modal", name: "Modal Mais", color: "#1E3A8A" },
    { id: "btg", name: "BTG Pactual", color: "#FFD700" },
  ];

  // Calcular distribuições com verificações de segurança
  const assetDistribution = calculateAssetDistribution(safeActiveInvestments);
  const brokerDistribution = safeActiveInvestments.reduce(
    (acc, inv) => {
      if (!inv || !inv.brokerId) return acc;
      const broker = brokers.find((b) => b.id === inv.brokerId);
      const brokerName = broker?.name || "Desconhecida";
      const value = calculateCurrentValue(inv);
      acc[brokerName] = (acc[brokerName] || 0) + value;
      return acc;
    },
    {} as Record<string, number>,
  );

  const brokerChartData = Object.entries(brokerDistribution).map(
    ([name, value]) => ({
      name,
      value,
      percentage:
        portfolioSummary?.currentValue && portfolioSummary.currentValue > 0
          ? (value / portfolioSummary.currentValue) * 100
          : 0,
    }),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Erro ao carregar investimentos
          </h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua carteira de investimentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDividendModal(true)}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Dividendo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOperationType('buy');
              setShowOperationModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Comprar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaleModal(true)}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Vender
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(portfolioSummary.currentValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.totalGainLoss >= 0 ? "+" : ""}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(portfolioSummary.totalGainLoss)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investido
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(portfolioSummary.totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioSummary.totalGainLossPercentage.toFixed(2)}% de retorno
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos Ativos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeInvestments.filter((inv) => inv.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {assetDistribution?.length || 0} tipos diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretoras</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brokerChartData.length}</div>
            <p className="text-xs text-muted-foreground">
              Distribuídas entre corretoras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Carteira</TabsTrigger>
          <TabsTrigger value="dividends">Dividendos</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="ir-report">Relatório IR</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <InvestmentList investments={safeInvestments} />
        </TabsContent>

        <TabsContent value="dividends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dividendos Recebidos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ 0,00
                </div>
                <p className="text-xs text-muted-foreground">
                  Este ano
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dividend Yield</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  0,00%
                </div>
                <p className="text-xs text-muted-foreground">
                  Rendimento anual
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos Pagamentos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  0
                </div>
                <p className="text-xs text-muted-foreground">
                  Este mês
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Dividendos</CardTitle>
              <CardDescription>
                Acompanhe os dividendos recebidos dos seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum dividendo registrado</h3>
                <p className="text-muted-foreground mb-4">
                  Use o botão "Dividendo" para registrar os proventos recebidos
                </p>
                <Button onClick={() => setShowDividendModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Dividendo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribuição por Tipo de Ativo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>
                  Alocação da carteira por tipo de ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assetDistribution.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium capitalize">
                        {item.type.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Corretora */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Distribuição por Corretora
                </CardTitle>
                <CardDescription>
                  Alocação da carteira por corretora
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {brokerChartData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-16 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <InvestmentReports />
        </TabsContent>

        <TabsContent value="ir-report" className="space-y-4">
          <InvestmentIRReport />
        </TabsContent>

      </Tabs>

      {/* Modals */}
      <InvestmentOperationModal
        open={showOperationModal}
        onOpenChange={setShowOperationModal}
        operationType={operationType}
      />
      
      <DividendModal
        open={showDividendModal}
        onOpenChange={setShowDividendModal}
      />
      
      <InvestmentSaleModal
        open={showSaleModal}
        onOpenChange={setShowSaleModal}
      />
    </div>
  );
}
