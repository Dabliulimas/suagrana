"use client";

import React, { useState, useMemo } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  BarChart3,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import {
  Investment,
  AssetType,
  RebalancingSuggestion,
} from "../../../lib/types/investments";
import { formatCurrency, formatPercentage } from "../../../lib/utils";
import { toast } from "sonner";

interface AllocationTarget {
  assetType: AssetType;
  targetPercentage: number;
  currentPercentage: number;
  currentValue: number;
  targetValue: number;
  difference: number;
  status: "overweight" | "underweight" | "balanced";
}

interface RebalancingAnalysis {
  totalPortfolioValue: number;
  allocationTargets: AllocationTarget[];
  suggestions: RebalancingSuggestion[];
  rebalancingNeeded: boolean;
  estimatedCosts: number;
  riskScore: number;
}

const DEFAULT_TARGETS: Record<AssetType, number> = {
  stock: 60,
  reit: 20,
  bond: 15,
  crypto: 5,
};

export function PortfolioRebalancing() {
  const { state, rebalancePortfolio } = useInvestments();
  const [targets, setTargets] =
    useState<Record<AssetType, number>>(DEFAULT_TARGETS);
  const [tolerance, setTolerance] = useState(5); // 5% de tolerância
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const rebalancingAnalysis = useMemo((): RebalancingAnalysis => {
    try {
      const activeInvestments = state.investments.filter(
        (inv) => inv.status === "active",
      );
      const totalPortfolioValue = activeInvestments.reduce(
        (sum, inv) => sum + inv.currentValue,
        0,
      );

      if (totalPortfolioValue === 0) {
        return {
          totalPortfolioValue: 0,
          allocationTargets: [],
          suggestions: [],
          rebalancingNeeded: false,
          estimatedCosts: 0,
          riskScore: 0,
        };
      }

      // Calcular alocação atual por tipo de ativo
      const currentAllocation = new Map<AssetType, number>();
      activeInvestments.forEach((inv) => {
        const current = currentAllocation.get(inv.assetType) || 0;
        currentAllocation.set(inv.assetType, current + inv.currentValue);
      });

      // Criar targets de alocação
      const allocationTargets: AllocationTarget[] = Object.entries(targets).map(
        ([assetType, targetPercentage]) => {
          const currentValue =
            currentAllocation.get(assetType as AssetType) || 0;
          const currentPercentage = (currentValue / totalPortfolioValue) * 100;
          const targetValue = (targetPercentage / 100) * totalPortfolioValue;
          const difference = targetValue - currentValue;

          let status: "overweight" | "underweight" | "balanced" = "balanced";
          if (Math.abs(currentPercentage - targetPercentage) > tolerance) {
            status =
              currentPercentage > targetPercentage
                ? "overweight"
                : "underweight";
          }

          return {
            assetType: assetType as AssetType,
            targetPercentage,
            currentPercentage,
            currentValue,
            targetValue,
            difference,
            status,
          };
        },
      );

      // Verificar se rebalanceamento é necessário
      const rebalancingNeeded = allocationTargets.some(
        (target) => target.status !== "balanced",
      );

      // Gerar sugestões de rebalanceamento
      const suggestions = generateRebalancingSuggestions(
        activeInvestments,
        allocationTargets,
        totalPortfolioValue,
      );

      // Calcular custos estimados (taxa de corretagem simplificada)
      const estimatedCosts = suggestions.reduce((sum, suggestion) => {
        return sum + Math.abs(suggestion.suggestedAmount) * 0.005; // 0.5% de taxa
      }, 0);

      // Calcular score de risco (simplificado)
      const riskScore = calculateRiskScore(allocationTargets);

      return {
        totalPortfolioValue,
        allocationTargets,
        suggestions,
        rebalancingNeeded,
        estimatedCosts,
        riskScore,
      };
    } catch (error) {
      logComponents.error("Erro ao calcular análise de rebalanceamento:", error);
      toast.error("Erro ao calcular análise de rebalanceamento");
      return {
        totalPortfolioValue: 0,
        allocationTargets: [],
        suggestions: [],
        rebalancingNeeded: false,
        estimatedCosts: 0,
        riskScore: 0,
      };
    }
  }, [state.investments, targets, tolerance]);

  const handleRebalance = async () => {
    try {
      setLoading(true);

      if (!rebalancingAnalysis.rebalancingNeeded) {
        toast.info("Seu portfólio já está balanceado!");
        return;
      }

      // Executar rebalanceamento
      const result = await rebalancePortfolio(rebalancingAnalysis.suggestions);

      if (result.success) {
        toast.success("Rebalanceamento executado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao executar rebalanceamento");
      }
    } catch (error) {
      logComponents.error("Erro ao executar rebalanceamento:", error);
      toast.error("Erro ao executar rebalanceamento");
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = (assetType: AssetType, value: number) => {
    const newTargets = { ...targets, [assetType]: value };

    // Verificar se a soma é 100%
    const total = Object.values(newTargets).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      toast.error("A soma dos targets deve ser 100%");
      return;
    }

    setTargets(newTargets);
  };

  const getAssetTypeLabel = (assetType: AssetType): string => {
    const labels: Record<AssetType, string> = {
      stock: "Ações",
      reit: "FIIs",
      bond: "Renda Fixa",
      crypto: "Crypto",
    };
    return labels[assetType] || assetType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overweight":
        return "text-red-600 bg-red-50";
      case "underweight":
        return "text-orange-600 bg-orange-50";
      case "balanced":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rebalanceamento de Portfólio</h2>
          <p className="text-muted-foreground">
            Mantenha sua alocação de ativos alinhada com seus objetivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            onClick={handleRebalance}
            disabled={loading || !rebalancingAnalysis.rebalancingNeeded}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Rebalancear
          </Button>
        </div>
      </div>

      {/* Configurações */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Rebalanceamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tolerância (%)</label>
              <input
                type="number"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                min="1"
                max="20"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(targets).map(([assetType, value]) => (
                <div key={assetType}>
                  <label className="text-sm font-medium">
                    {getAssetTypeLabel(assetType as AssetType)} (%)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) =>
                      updateTarget(
                        assetType as AssetType,
                        Number(e.target.value),
                      )
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(rebalancingAnalysis.totalPortfolioValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                state.investments.filter((inv) => inv.status === "active")
                  .length
              }{" "}
              ativos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rebalancingAnalysis.rebalancingNeeded ? (
                <span className="text-orange-600">Desbalanceado</span>
              ) : (
                <span className="text-green-600">Balanceado</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tolerância: ±{tolerance}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo Estimado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(rebalancingAnalysis.estimatedCosts)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rebalancingAnalysis.suggestions.length} operações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Score de Risco
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getRiskColor(rebalancingAnalysis.riskScore)}`}
            >
              {rebalancingAnalysis.riskScore.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rebalancingAnalysis.riskScore < 30
                ? "Baixo"
                : rebalancingAnalysis.riskScore < 70
                  ? "Médio"
                  : "Alto"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com análises */}
      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocation">Alocação Atual</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="simulation">Simulação</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alocação por Tipo de Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rebalancingAnalysis.allocationTargets.map((target, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {getAssetTypeLabel(target.assetType)}
                        </span>
                        <Badge className={getStatusColor(target.status)}>
                          {target.status === "overweight"
                            ? "Sobrepeso"
                            : target.status === "underweight"
                              ? "Subpeso"
                              : "Balanceado"}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(target.currentValue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(target.currentPercentage)} /{" "}
                          {formatPercentage(target.targetPercentage)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress
                        value={target.currentPercentage}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Atual: {formatPercentage(target.currentPercentage)}
                        </span>
                        <span>
                          Meta: {formatPercentage(target.targetPercentage)}
                        </span>
                      </div>
                    </div>
                    {target.difference !== 0 && (
                      <div
                        className={`text-sm ${
                          target.difference > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {target.difference > 0 ? "Comprar" : "Vender"}:{" "}
                        {formatCurrency(Math.abs(target.difference))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões de Rebalanceamento</CardTitle>
            </CardHeader>
            <CardContent>
              {rebalancingAnalysis.suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <p>Seu portfólio está balanceado!</p>
                  <p className="text-sm">Nenhuma ação necessária no momento</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rebalancingAnalysis.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {suggestion.identifier}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getAssetTypeLabel(suggestion.assetType)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            suggestion.action === "buy"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {suggestion.action === "buy" ? "Comprar" : "Vender"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(Math.abs(suggestion.suggestedAmount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Prioridade: {suggestion.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulação Pós-Rebalanceamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">
                      Antes do Rebalanceamento
                    </h4>
                    <div className="space-y-2">
                      {rebalancingAnalysis.allocationTargets.map(
                        (target, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>{getAssetTypeLabel(target.assetType)}</span>
                            <span>
                              {formatPercentage(target.currentPercentage)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Após o Rebalanceamento</h4>
                    <div className="space-y-2">
                      {rebalancingAnalysis.allocationTargets.map(
                        (target, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>{getAssetTypeLabel(target.assetType)}</span>
                            <span className="text-green-600">
                              {formatPercentage(target.targetPercentage)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Custo Total Estimado:</span>
                    <span className="font-bold">
                      {formatCurrency(rebalancingAnalysis.estimatedCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">
                      Impacto no Score de Risco:
                    </span>
                    <span
                      className={`font-bold ${getRiskColor(rebalancingAnalysis.riskScore)}`}
                    >
                      {rebalancingAnalysis.riskScore.toFixed(0)} pontos
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Funções auxiliares
function generateRebalancingSuggestions(
  investments: Investment[],
  targets: AllocationTarget[],
  totalValue: number,
): RebalancingSuggestion[] {
  const suggestions: RebalancingSuggestion[] = [];

  targets.forEach((target) => {
    if (target.status === "balanced") return;

    const assetsOfType = investments.filter(
      (inv) => inv.assetType === target.assetType && inv.status === "active",
    );

    if (assetsOfType.length === 0) return;

    // Distribuir o ajuste entre os ativos do tipo
    const adjustmentPerAsset = target.difference / assetsOfType.length;

    assetsOfType.forEach((asset) => {
      if (Math.abs(adjustmentPerAsset) > totalValue * 0.01) {
        // Mínimo 1% do portfólio
        suggestions.push({
          investmentId: asset.id,
          identifier: asset.identifier,
          assetType: asset.assetType,
          action: adjustmentPerAsset > 0 ? "buy" : "sell",
          suggestedAmount: adjustmentPerAsset,
          currentAllocation: target.currentPercentage,
          targetAllocation: target.targetPercentage,
          priority:
            Math.abs(target.currentPercentage - target.targetPercentage) > 10
              ? "high"
              : "medium",
          reason: `Ajustar alocação de ${formatPercentage(target.currentPercentage)} para ${formatPercentage(target.targetPercentage)}`,
        });
      }
    });
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function calculateRiskScore(targets: AllocationTarget[]): number {
  // Score baseado no desvio das metas e concentração
  let score = 0;

  targets.forEach((target) => {
    // Penalizar desvios grandes
    const deviation = Math.abs(
      target.currentPercentage - target.targetPercentage,
    );
    score += deviation * 2;

    // Penalizar concentração excessiva
    if (target.currentPercentage > 50) {
      score += (target.currentPercentage - 50) * 1.5;
    }
  });

  return Math.min(100, score);
}
