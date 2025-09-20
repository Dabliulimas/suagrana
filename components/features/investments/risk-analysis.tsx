"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  PieChart,
  Activity,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import { Investment, AssetType } from "../../../lib/types/investments";
import { formatCurrency, formatPercentage } from "../../../lib/utils";

interface RiskMetrics {
  portfolioValue: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta: number;
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  diversificationScore: number;
  concentrationRisk: number;
  liquidityRisk: number;
  riskScore: number; // 1-10 scale
}

interface AssetAllocation {
  assetType: AssetType;
  value: number;
  percentage: number;
  riskLevel: "low" | "medium" | "high";
  count: number;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  count: number;
}

interface RiskAlert {
  id: string;
  type:
    | "concentration"
    | "volatility"
    | "liquidity"
    | "correlation"
    | "drawdown";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  recommendation: string;
}

const ASSET_RISK_LEVELS: Record<AssetType, "low" | "medium" | "high"> = {
  stock: "high",
  reit: "medium",
  bond: "low",
  crypto: "high",
  commodity: "high",
  fund: "medium",
};

const SECTOR_MAPPING: Record<string, string> = {
  PETR4: "Petróleo e Gás",
  VALE3: "Mineração",
  ITUB4: "Bancos",
  BBDC4: "Bancos",
  ABEV3: "Bebidas",
  MGLU3: "Varejo",
  WEGE3: "Máquinas e Equipamentos",
  RENT3: "Aluguel de Carros",
  EGIE3: "Energia Elétrica",
  TAEE11: "Energia Elétrica",
};

export function RiskAnalysis() {
  const { state } = useInvestments();
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1M" | "3M" | "6M" | "1Y"
  >("6M");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calcular alocação por tipo de ativo
  const assetAllocation = useMemo(() => {
    const allocationMap = new Map<AssetType, AssetAllocation>();
    const totalValue = state.portfolioSummary.totalValue;

    state.investments
      .filter((inv) => inv.status === "active")
      .forEach((investment) => {
        const existing = allocationMap.get(investment.assetType);
        if (existing) {
          existing.value += investment.currentValue;
          existing.count += 1;
        } else {
          allocationMap.set(investment.assetType, {
            assetType: investment.assetType,
            value: investment.currentValue,
            percentage: 0,
            riskLevel: ASSET_RISK_LEVELS[investment.assetType],
            count: 1,
          });
        }
      });

    // Calcular percentuais
    allocationMap.forEach((allocation) => {
      allocation.percentage = (allocation.value / totalValue) * 100;
    });

    return Array.from(allocationMap.values()).sort((a, b) => b.value - a.value);
  }, [state.investments, state.portfolioSummary.totalValue]);

  // Calcular alocação por setor
  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, SectorAllocation>();
    const totalValue = state.portfolioSummary.totalValue;

    state.investments
      .filter((inv) => inv.status === "active")
      .forEach((investment) => {
        const sector = SECTOR_MAPPING[investment.identifier] || "Outros";
        const existing = sectorMap.get(sector);

        if (existing) {
          existing.value += investment.currentValue;
          existing.count += 1;
        } else {
          sectorMap.set(sector, {
            sector,
            value: investment.currentValue,
            percentage: (investment.currentValue / totalValue) * 100,
            count: 1,
          });
        }
      });

    // Recalcular percentuais
    sectorMap.forEach((allocation) => {
      allocation.percentage = (allocation.value / totalValue) * 100;
    });

    return Array.from(sectorMap.values()).sort((a, b) => b.value - a.value);
  }, [state.investments, state.portfolioSummary.totalValue]);

  // Calcular métricas de risco
  const riskMetrics = useMemo(() => {
    const portfolioValue = state.portfolioSummary.totalValue;
    const investments = state.investments.filter(
      (inv) => inv.status === "active",
    );

    if (investments.length === 0) {
      return {
        portfolioValue: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        beta: 1,
        var95: 0,
        var99: 0,
        diversificationScore: 0,
        concentrationRisk: 100,
        liquidityRisk: 0,
        riskScore: 5,
      };
    }

    // Calcular concentração (maior posição individual)
    const maxPosition = Math.max(
      ...investments.map((inv) => (inv.currentValue / portfolioValue) * 100),
    );
    const concentrationRisk = maxPosition;

    // Calcular score de diversificação baseado no número de ativos e distribuição
    const numAssets = investments.length;
    const herfindahlIndex = investments.reduce((sum, inv) => {
      const weight = inv.currentValue / portfolioValue;
      return sum + weight * weight;
    }, 0);
    const diversificationScore = Math.max(0, 100 - herfindahlIndex * 100);

    // Simular volatilidade baseada nos tipos de ativos
    const weightedVolatility = assetAllocation.reduce((sum, allocation) => {
      const baseVolatility =
        {
          stock: 25,
          reit: 20,
          bond: 5,
          crypto: 60,
          commodity: 30,
          fund: 15,
        }[allocation.assetType] || 20;

      return sum + (baseVolatility * allocation.percentage) / 100;
    }, 0);

    // Calcular risco de liquidez baseado nos tipos de ativos
    const liquidityRisk = assetAllocation.reduce((sum, allocation) => {
      const liquidityScore =
        {
          stock: 10,
          reit: 15,
          bond: 5,
          crypto: 20,
          commodity: 25,
          fund: 8,
        }[allocation.assetType] || 10;

      return sum + (liquidityScore * allocation.percentage) / 100;
    }, 0);

    // Simular outras métricas
    const volatility = weightedVolatility;
    const sharpeRatio = Math.max(
      0,
      (state.portfolioSummary.totalReturn - 10.5) / volatility,
    ); // Assumindo CDI ~10.5%
    const maxDrawdown = Math.min(volatility * 1.5, 50); // Estimativa baseada na volatilidade
    const beta = 0.8 + volatility / 50; // Beta estimado
    const var95 = portfolioValue * (volatility / 100) * 1.65; // VaR 95%
    const var99 = portfolioValue * (volatility / 100) * 2.33; // VaR 99%

    // Score de risco geral (1-10)
    const riskFactors = [
      Math.min(volatility / 5, 10), // Volatilidade
      Math.min(concentrationRisk / 10, 10), // Concentração
      Math.min(liquidityRisk / 5, 10), // Liquidez
      Math.max(0, 10 - diversificationScore / 10), // Diversificação (invertido)
    ];
    const riskScore =
      riskFactors.reduce((sum, factor) => sum + factor, 0) / riskFactors.length;

    return {
      portfolioValue,
      volatility,
      sharpeRatio,
      maxDrawdown,
      beta,
      var95,
      var99,
      diversificationScore,
      concentrationRisk,
      liquidityRisk,
      riskScore,
    };
  }, [state.investments, state.portfolioSummary, assetAllocation]);

  // Gerar alertas de risco
  const riskAlerts = useMemo(() => {
    const alerts: RiskAlert[] = [];

    // Alerta de concentração
    if (riskMetrics.concentrationRisk > 30) {
      alerts.push({
        id: "concentration",
        type: "concentration",
        severity: riskMetrics.concentrationRisk > 50 ? "high" : "medium",
        title: "Alta Concentração de Risco",
        description: `Sua maior posição representa ${formatPercentage(riskMetrics.concentrationRisk)}% do portfólio`,
        recommendation:
          "Considere diversificar reduzindo posições muito grandes",
      });
    }

    // Alerta de volatilidade
    if (riskMetrics.volatility > 30) {
      alerts.push({
        id: "volatility",
        type: "volatility",
        severity: riskMetrics.volatility > 40 ? "high" : "medium",
        title: "Alta Volatilidade",
        description: `Volatilidade estimada de ${formatPercentage(riskMetrics.volatility)}% ao ano`,
        recommendation:
          "Considere adicionar ativos mais conservadores ao portfólio",
      });
    }

    // Alerta de diversificação
    if (riskMetrics.diversificationScore < 50) {
      alerts.push({
        id: "diversification",
        type: "concentration",
        severity: riskMetrics.diversificationScore < 30 ? "high" : "medium",
        title: "Baixa Diversificação",
        description: `Score de diversificação: ${riskMetrics.diversificationScore.toFixed(0)}/100`,
        recommendation: "Adicione mais ativos de diferentes setores e classes",
      });
    }

    // Alerta de liquidez
    if (riskMetrics.liquidityRisk > 20) {
      alerts.push({
        id: "liquidity",
        type: "liquidity",
        severity: riskMetrics.liquidityRisk > 30 ? "high" : "medium",
        title: "Risco de Liquidez Elevado",
        description: `Score de risco de liquidez: ${riskMetrics.liquidityRisk.toFixed(1)}`,
        recommendation: "Mantenha uma reserva em ativos mais líquidos",
      });
    }

    // Alerta de setor
    const maxSectorAllocation = Math.max(
      ...sectorAllocation.map((s) => s.percentage),
    );
    if (maxSectorAllocation > 40) {
      alerts.push({
        id: "sector",
        type: "concentration",
        severity: maxSectorAllocation > 60 ? "high" : "medium",
        title: "Concentração Setorial",
        description: `${formatPercentage(maxSectorAllocation)}% concentrado em um setor`,
        recommendation: "Diversifique entre diferentes setores da economia",
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [riskMetrics, sectorAllocation]);

  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
        return "text-red-600 bg-red-100";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 3) return "text-green-600";
    if (score <= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "low":
        return "border-l-green-500 bg-green-50 dark:bg-green-900/20";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "high":
        return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análise de Risco</h2>
          <p className="text-muted-foreground">
            Avalie e gerencie os riscos do seu portfólio
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1M">1 Mês</option>
            <option value="3M">3 Meses</option>
            <option value="6M">6 Meses</option>
            <option value="1Y">1 Ano</option>
          </select>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Básico" : "Avançado"}
          </Button>
        </div>
      </div>

      {/* Score de Risco Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Score de Risco do Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className={`text-4xl font-bold ${getRiskScoreColor(riskMetrics.riskScore)}`}
              >
                {riskMetrics.riskScore.toFixed(1)}/10
              </div>
              <p className="text-muted-foreground">
                {riskMetrics.riskScore <= 3
                  ? "Risco Baixo"
                  : riskMetrics.riskScore <= 6
                    ? "Risco Moderado"
                    : "Risco Alto"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(riskMetrics.portfolioValue)}
              </div>
              <p className="text-muted-foreground">Valor do Portfólio</p>
            </div>
          </div>

          <Progress value={riskMetrics.riskScore * 10} className="h-3" />

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Conservador</span>
            <span>Moderado</span>
            <span>Agressivo</span>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Risco */}
      {riskAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Alertas de Risco ({riskAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <Badge
                      variant={
                        alert.severity === "high"
                          ? "destructive"
                          : alert.severity === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {alert.severity === "high"
                        ? "Alto"
                        : alert.severity === "medium"
                          ? "Médio"
                          : "Baixo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {alert.description}
                  </p>
                  <p className="text-sm font-medium">{alert.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="allocation">Alocação</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          {showAdvanced && <TabsTrigger value="advanced">Avançado</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Volatilidade
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(riskMetrics.volatility)}
                </div>
                <p className="text-xs text-muted-foreground">Anualizada</p>
                <Progress
                  value={Math.min(riskMetrics.volatility * 2, 100)}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Diversificação
                </CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {riskMetrics.diversificationScore.toFixed(0)}/100
                </div>
                <p className="text-xs text-muted-foreground">Score</p>
                <Progress
                  value={riskMetrics.diversificationScore}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Concentração
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(riskMetrics.concentrationRisk)}
                </div>
                <p className="text-xs text-muted-foreground">Maior posição</p>
                <Progress
                  value={riskMetrics.concentrationRisk}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alocação por Classe de Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assetAllocation.map((allocation) => (
                    <div key={allocation.assetType} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {allocation.assetType}
                          </span>
                          <Badge className={getRiskColor(allocation.riskLevel)}>
                            {allocation.riskLevel === "low"
                              ? "Baixo"
                              : allocation.riskLevel === "medium"
                                ? "Médio"
                                : "Alto"}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPercentage(allocation.percentage)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(allocation.value)}
                          </div>
                        </div>
                      </div>
                      <Progress value={allocation.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {allocation.count}{" "}
                        {allocation.count === 1 ? "ativo" : "ativos"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alocação por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectorAllocation.slice(0, 8).map((allocation) => (
                    <div key={allocation.sector} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{allocation.sector}</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPercentage(allocation.percentage)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(allocation.value)}
                          </div>
                        </div>
                      </div>
                      <Progress value={allocation.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {allocation.count}{" "}
                        {allocation.count === 1 ? "ativo" : "ativos"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Índice Sharpe:</span>
                    <span className="font-medium">
                      {riskMetrics.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span className="font-medium">
                      {riskMetrics.beta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drawdown Máximo:</span>
                    <span className="font-medium text-red-600">
                      {formatPercentage(riskMetrics.maxDrawdown)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatilidade:</span>
                    <span className="font-medium">
                      {formatPercentage(riskMetrics.volatility)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value at Risk (VaR)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>VaR 95% (1 dia):</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(riskMetrics.var95)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Perda máxima esperada em 95% dos casos
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>VaR 99% (1 dia):</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(riskMetrics.var99)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Perda máxima esperada em 99% dos casos
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Risco de Liquidez:</span>
                      <span className="font-medium">
                        {riskMetrics.liquidityRisk.toFixed(1)}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dificuldade para converter em dinheiro
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {showAdvanced && (
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise Avançada de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">
                      Matriz de Correlação (Simulada)
                    </h3>
                    <div className="text-sm text-muted-foreground mb-4">
                      Correlação entre diferentes classes de ativos no seu
                      portfólio
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="font-medium">Ações</div>
                      <div className="font-medium">REITs</div>
                      <div className="font-medium">Renda Fixa</div>
                      <div className="font-medium">Crypto</div>

                      <div className="bg-red-100 p-2 text-center rounded">
                        1.00
                      </div>
                      <div className="bg-yellow-100 p-2 text-center rounded">
                        0.65
                      </div>
                      <div className="bg-green-100 p-2 text-center rounded">
                        -0.15
                      </div>
                      <div className="bg-orange-100 p-2 text-center rounded">
                        0.25
                      </div>

                      <div className="bg-yellow-100 p-2 text-center rounded">
                        0.65
                      </div>
                      <div className="bg-red-100 p-2 text-center rounded">
                        1.00
                      </div>
                      <div className="bg-green-100 p-2 text-center rounded">
                        -0.05
                      </div>
                      <div className="bg-orange-100 p-2 text-center rounded">
                        0.15
                      </div>

                      <div className="bg-green-100 p-2 text-center rounded">
                        -0.15
                      </div>
                      <div className="bg-green-100 p-2 text-center rounded">
                        -0.05
                      </div>
                      <div className="bg-red-100 p-2 text-center rounded">
                        1.00
                      </div>
                      <div className="bg-yellow-100 p-2 text-center rounded">
                        0.10
                      </div>

                      <div className="bg-orange-100 p-2 text-center rounded">
                        0.25
                      </div>
                      <div className="bg-orange-100 p-2 text-center rounded">
                        0.15
                      </div>
                      <div className="bg-yellow-100 p-2 text-center rounded">
                        0.10
                      </div>
                      <div className="bg-red-100 p-2 text-center rounded">
                        1.00
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Cenários de Stress</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">
                          Crise Financeira (-30%)
                        </div>
                        <div className="text-red-600 font-medium">
                          Perda estimada:{" "}
                          {formatCurrency(riskMetrics.portfolioValue * 0.3)}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">
                          Recessão Moderada (-15%)
                        </div>
                        <div className="text-orange-600 font-medium">
                          Perda estimada:{" "}
                          {formatCurrency(riskMetrics.portfolioValue * 0.15)}
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-1">
                          Correção de Mercado (-10%)
                        </div>
                        <div className="text-yellow-600 font-medium">
                          Perda estimada:{" "}
                          {formatCurrency(riskMetrics.portfolioValue * 0.1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
