"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Alert, AlertDescription } from "../../ui/alert";
import { Checkbox } from "../../ui/checkbox";
import { Separator } from "../../ui/separator";
import {
  Merge,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { storage, type Investment } from "../../../lib/storage";
import { toast } from "sonner";

interface DuplicateConsolidationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsolidationComplete?: () => void;
}

interface DuplicateGroup {
  ticker: string;
  investments: Investment[];
  totalQuantity: number;
  totalValue: number;
  averagePrice: number;
  totalFees: number;
  firstPurchase: string;
  lastPurchase: string;
}

export function DuplicateConsolidation({
  open,
  onOpenChange,
  onConsolidationComplete,
}: DuplicateConsolidationProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<Set<string>>(
    new Set(),
  );
  const [isConsolidating, setIsConsolidating] = useState(false);

  useEffect(() => {
    if (open) {
      loadDuplicates();
    }
  }, [open]);

  const loadDuplicates = () => {
    const duplicateTickers = storage.getDuplicateTickers();
    const investments = storage.getInvestments();

    const groups: DuplicateGroup[] = duplicateTickers.map((ticker) => {
      const tickerInvestments = investments.filter(
        (inv) => inv.ticker === ticker && inv.operation === "buy",
      );

      const totalQuantity = tickerInvestments.reduce(
        (sum, inv) => sum + inv.quantity,
        0,
      );
      const totalValue = tickerInvestments.reduce(
        (sum, inv) => sum + inv.totalValue,
        0,
      );
      const totalFees = tickerInvestments.reduce(
        (sum, inv) => sum + inv.fees,
        0,
      );
      const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

      const dates = tickerInvestments
        .map((inv) => new Date(inv.date))
        .sort((a, b) => a.getTime() - b.getTime());
      const firstPurchase = dates[0]?.toISOString().split("T")[0] || "";
      const lastPurchase =
        dates[dates.length - 1]?.toISOString().split("T")[0] || "";

      return {
        ticker,
        investments: tickerInvestments,
        totalQuantity,
        totalValue,
        averagePrice,
        totalFees,
        firstPurchase,
        lastPurchase,
      };
    });

    setDuplicateGroups(groups);
    // Auto-select all by default
    setSelectedTickers(new Set(duplicateTickers));
  };

  const toggleTickerSelection = (ticker: string) => {
    const newSelected = new Set(selectedTickers);
    if (newSelected.has(ticker)) {
      newSelected.delete(ticker);
    } else {
      newSelected.add(ticker);
    }
    setSelectedTickers(newSelected);
  };

  const selectAll = () => {
    setSelectedTickers(new Set(duplicateGroups.map((group) => group.ticker)));
  };

  const selectNone = () => {
    setSelectedTickers(new Set());
  };

  const handleConsolidation = async () => {
    if (selectedTickers.size === 0) {
      toast.error("Selecione pelo menos um ticker para consolidar");
      return;
    }

    setIsConsolidating(true);

    try {
      let consolidatedCount = 0;

      for (const ticker of selectedTickers) {
        const success = storage.manuallyConsolidateInvestments(ticker);
        if (success) {
          consolidatedCount++;
        }
      }

      if (consolidatedCount > 0) {
        toast.success(
          `${consolidatedCount} ticker(s) consolidado(s) com sucesso!`,
        );
        onConsolidationComplete?.();
        loadDuplicates(); // Reload to show updated state
      } else {
        toast.error("Nenhuma consolidação foi necessária");
      }
    } catch (error) {
      logComponents.error("Erro na consolidação:", error);
      toast.error("Erro ao consolidar investimentos");
    } finally {
      setIsConsolidating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Consolidação de Investimentos Duplicados
          </DialogTitle>
        </DialogHeader>

        {duplicateGroups.length === 0 ? (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Não foram encontrados investimentos duplicados para consolidar.
              Todos os seus tickers estão organizados!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Atenção:</strong> A consolidação irá combinar todas as
                compras do mesmo ticker em uma única posição, calculando
                automaticamente o preço médio. Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {duplicateGroups.length} ticker(s) com duplicatas encontrado(s)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Desmarcar Todos
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {duplicateGroups.map((group) => (
                <Card
                  key={group.ticker}
                  className={`transition-all ${
                    selectedTickers.has(group.ticker)
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTickers.has(group.ticker)}
                          onCheckedChange={() =>
                            toggleTickerSelection(group.ticker)
                          }
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {group.ticker}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {group.investments.length} operações
                            </Badge>
                            <Badge variant="outline">
                              {group.investments[0]?.type || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(group.totalValue)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {group.totalQuantity} cotas
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Resumo da Consolidação */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Preço Médio
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(group.averagePrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Total Investido
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(group.totalValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Primeira Compra
                        </div>
                        <div className="font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(group.firstPurchase)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          Última Compra
                        </div>
                        <div className="font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(group.lastPurchase)}
                        </div>
                      </div>
                    </div>

                    {/* Operações Individuais */}
                    <div>
                      <div className="text-sm font-medium mb-2">
                        Operações que serão consolidadas:
                      </div>
                      <div className="space-y-2">
                        {group.investments.map((investment, index) => (
                          <div
                            key={investment.id}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <span>{formatDate(investment.date)}</span>
                              <span className="text-gray-500">•</span>
                              <span>{investment.quantity} cotas</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(investment.price)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: {formatCurrency(investment.totalValue)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedTickers.size > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {selectedTickers.size} ticker(s) selecionado(s) para
                consolidação
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {duplicateGroups.length > 0 && (
              <Button
                onClick={handleConsolidation}
                disabled={selectedTickers.size === 0 || isConsolidating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConsolidating ? (
                  "Consolidando..."
                ) : (
                  <>
                    <Merge className="w-4 h-4 mr-2" />
                    Consolidar Selecionados
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
