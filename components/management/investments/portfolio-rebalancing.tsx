"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useInvestments } from "../../../contexts/unified-context";

interface PortfolioRebalancingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RebalancingTarget {
  type: string;
  currentAllocation: number;
  targetAllocation: number;
  currentValue: number;
  targetValue: number;
  difference: number;
  action: "buy" | "sell" | "hold";
}

interface RebalancingSuggestion {
  asset: string;
  ticker?: string;
  currentValue: number;
  targetValue: number;
  difference: number;
  action: "buy" | "sell" | "hold";
  priority: "high" | "medium" | "low";
  reason: string;
}

const DEFAULT_TARGETS = {
  stock: 60,
  fii: 20,
  treasury: 15,
  crypto: 5,
};

const TYPE_LABELS = {
  stock: "Ações",
  fii: "Fundos Imobiliários",
  treasury: "Tesouro Direto",
  crypto: "Criptomoedas",
  cdb: "CDB/Renda Fixa",
  fund: "Fundos de Investimento",
};

export function PortfolioRebalancing({
  open,
  onOpenChange,
}: PortfolioRebalancingProps) {
  const { investments, isLoading } = useInvestments();
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [customTargets, setCustomTargets] = useState<Record<string, number>>(
    {},
  );
  const [rebalanceAmount, setRebalanceAmount] = useState(0);

  const portfolioData = investments;
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalValue || 0), 0);

  // Calcular alocação atual por tipo
  const currentAllocation = useMemo(() => {
    const allocation: Record<
      string,
      { value: number; percentage: number; assets: any[] }
    > = {};

    portfolioData.forEach((asset) => {
      const type = asset.assetType || "other";
      if (!allocation[type]) {
        allocation[type] = { value: 0, percentage: 0, assets: [] };
      }
      allocation[type].value += asset.currentValue;
      allocation[type].assets.push(asset);
    });

    // Calcular percentuais
    Object.keys(allocation).forEach((type) => {
      allocation[type].percentage =
        totalCurrentValue > 0
          ? (allocation[type].value / totalCurrentValue) * 100
          : 0;
    });

    return allocation;
  }, [portfolioData, totalCurrentValue]);

  // Calcular sugestões de rebalanceamento usando o contexto
  const rebalancingAnalysis = useMemo(() => {
    const activeTargets = { ...targets, ...customTargets };
    const targetAllocations: Record<string, number> = {};

    // Converter targets por tipo para targets por símbolo
    Object.entries(activeTargets).forEach(([type, percentage]) => {
      const assetsOfType = portfolioData.filter(
        (asset) => asset.assetType === type,
      );
      if (assetsOfType.length > 0) {
        // Distribuir igualmente entre ativos do mesmo tipo
        const percentagePerAsset = percentage / assetsOfType.length;
        assetsOfType.forEach((asset) => {
          targetAllocations[asset.symbol] = percentagePerAsset;
        });
      }
    });

    // Calcular rebalanceamento simples
    // const contextTargets = calculateRebalancing(targetAllocations);

    // Converter para o formato esperado pelo componente
    const analysis: RebalancingTarget[] = [];
    const totalTarget = rebalanceAmount || totalCurrentValue;

    Object.entries(activeTargets).forEach(([type, targetPercentage]) => {
      const current = currentAllocation[type] || { value: 0, percentage: 0 };
      const targetValue = (targetPercentage / 100) * totalTarget;
      const difference = targetValue - current.value;

      analysis.push({
        type,
        currentAllocation: current.percentage,
        targetAllocation: targetPercentage,
        currentValue: current.value,
        targetValue,
        difference,
        action:
          Math.abs(difference) < totalTarget * 0.02
            ? "hold"
            : difference > 0
              ? "buy"
              : "sell",
      });
    });

    return analysis.sort(
      (a, b) => Math.abs(b.difference) - Math.abs(a.difference),
    );
  }, [
    currentAllocation,
    targets,
    customTargets,
    totalCurrentValue,
    rebalanceAmount,
    portfolioData,
  ]);

  // Gerar sugestões específicas por ativo usando o contexto
  const assetSuggestions = useMemo(() => {
    const activeTargets = { ...targets, ...customTargets };
    
    // Gerar sugestões simples baseado nos dados disponíveis
    const suggestions: RebalancingSuggestion[] = portfolioData.map((investment) => {
      const currentValue = investment.currentValue || investment.totalValue || 0;
      const assetType = investment.assetType || 'other';
      const targetPercentage = activeTargets[assetType] || 0;
      const targetValue = (targetPercentage / 100) * totalCurrentValue;
      const difference = targetValue - currentValue;
      
      return {
        asset: investment.symbol || investment.name || 'Unknown',
        ticker: investment.symbol || 'N/A',
        currentValue,
        targetValue,
        difference,
        action: Math.abs(difference) < totalCurrentValue * 0.02 ? "hold" : difference > 0 ? "buy" : "sell",
        priority: Math.abs(difference) > totalCurrentValue * 0.1 ? "high" : Math.abs(difference) > totalCurrentValue * 0.05 ? "medium" : "low",
        reason: `Diferenca de ${Math.abs(difference / totalCurrentValue * 100).toFixed(1)}% da carteira total`
      };
    });

    return suggestions;
  }, [
    currentAllocation,
    totalCurrentValue,
    portfolioData,
    targets,
    customTargets
  ]);

  const handleTargetChange = (type: string, value: number) => {
    setCustomTargets((prev) => ({ ...prev, [type]: value }));
  };

  const resetTargets = () => {
    setCustomTargets({});
    setRebalanceAmount(0);
  };

  const exportRebalancingPlan = () => {
    const plan = {
      date: new Date().toISOString(),
      currentPortfolio: currentAllocation,
      targets: { ...targets, ...customTargets },
      suggestions: assetSuggestions,
      totalValue: totalCurrentValue,
      rebalanceAmount: rebalanceAmount || totalCurrentValue,
    };

    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plano-rebalanceamento-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Plano de rebalanceamento exportado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Rebalanceamento de Portfólio
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Análise Atual</TabsTrigger>
            <TabsTrigger value="targets">Metas de Alocação</TabsTrigger>
            <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alocação Atual vs Meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rebalancingAnalysis.map((target) => {
                  const isBalanced =
                    Math.abs(
                      target.currentAllocation - target.targetAllocation,
                    ) < 2;
                  return (
                    <div key={target.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {TYPE_LABELS[
                            target.type as keyof typeof TYPE_LABELS
                          ] || target.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={isBalanced ? "default" : "secondary"}>
                            {target.currentAllocation.toFixed(1)}% →{" "}
                            {target.targetAllocation}%
                          </Badge>
                          {isBalanced ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            Atual
                          </div>
                          <Progress
                            value={target.currentAllocation}
                            className="h-2"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Meta</div>
                          <Progress
                            value={target.targetAllocation}
                            className="h-2 bg-blue-100"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Diferença:
                        <span
                          className={
                            target.difference >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {target.difference >= 0 ? "+" : ""}R${" "}
                          {target.difference.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Metas de Alocação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rebalance-amount">
                      Valor para Rebalanceamento (opcional)
                    </Label>
                    <Input
                      id="rebalance-amount"
                      type="number"
                      value={rebalanceAmount}
                      onChange={(e) =>
                        setRebalanceAmount(Number(e.target.value))
                      }
                      placeholder={`Atual: R$ ${totalCurrentValue.toLocaleString("pt-BR")}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(TYPE_LABELS).map(([type, label]) => {
                    const currentTarget =
                      customTargets[type] ??
                      targets[type as keyof typeof targets] ??
                      0;
                    return (
                      <div key={type}>
                        <Label htmlFor={`target-${type}`}>{label} (%)</Label>
                        <Input
                          id={`target-${type}`}
                          type="number"
                          min="0"
                          max="100"
                          value={currentTarget}
                          onChange={(e) =>
                            handleTargetChange(type, Number(e.target.value))
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetTargets}>
                    Restaurar Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Sugestões de Rebalanceamento
              </h3>
              <Button variant="outline" onClick={exportRebalancingPlan}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Plano
              </Button>
            </div>

            {assetSuggestions.length === 0 ? (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Seu portfólio está bem balanceado! Não há necessidade de
                  rebalanceamento no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {assetSuggestions.map((suggestion, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {suggestion.ticker
                                ? `${suggestion.ticker} - ${suggestion.asset}`
                                : suggestion.asset}
                            </h4>
                            <Badge
                              variant={
                                suggestion.action === "buy"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {suggestion.action === "buy"
                                ? "Comprar"
                                : "Vender"}
                            </Badge>
                            <Badge
                              variant={
                                suggestion.priority === "high"
                                  ? "destructive"
                                  : suggestion.priority === "medium"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {suggestion.priority === "high"
                                ? "Alta"
                                : suggestion.priority === "medium"
                                  ? "Média"
                                  : "Baixa"}{" "}
                              Prioridade
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.reason}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              Valor atual: R${" "}
                              {suggestion.currentValue.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span
                              className={
                                suggestion.difference >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {suggestion.action === "buy"
                                ? "Investir"
                                : "Reduzir"}
                              : R${" "}
                              {Math.abs(suggestion.difference).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {suggestion.action === "buy" ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
