"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";
import { useInvestments } from "../../../contexts/investments/investment-context";

interface DividendYieldMetricsProps {
  investmentId?: string; // Se fornecido, mostra métricas específicas do investimento
  className?: string;
}

export function DividendYieldMetrics({
  investmentId,
  className,
}: DividendYieldMetricsProps) {
  const { state } = useInvestments();

  // Se investmentId for fornecido, calcular métricas específicas
  if (investmentId) {
    const investment = state.investments.find((inv) => inv.id === investmentId);
    const dividendOps = state.dividendOperations.filter(
      (op) => op.investmentId === investmentId,
    );

    if (!investment) return null;

    const totalDividends = dividendOps.reduce(
      (sum, op) => sum + op.totalValue,
      0,
    );
    const currentYearDividends = dividendOps
      .filter(
        (op) => new Date(op.date).getFullYear() === new Date().getFullYear(),
      )
      .reduce((sum, op) => sum + op.totalValue, 0);

    const dividendYield =
      investment.totalValue > 0
        ? (totalDividends / investment.totalValue) * 100
        : 0;
    const currentYearYield =
      investment.totalValue > 0
        ? (currentYearDividends / investment.totalValue) * 100
        : 0;

    const lastDividend = dividendOps.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {totalDividends.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-600" />
              Dividend Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dividendYield.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sobre valor investido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Yield {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {currentYearYield.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Ano atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Último Dividendo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastDividend ? (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  R$ {lastDividend.price.toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(lastDividend.date).toLocaleDateString("pt-BR")}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">-</div>
                <p className="text-xs text-muted-foreground">
                  Nenhum dividendo
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Métricas gerais da carteira
  const { portfolioSummary } = state;
  const currentYear = new Date().getFullYear();

  // Calcular dividendos por tipo
  const dividendsByType = state.dividendOperations.reduce(
    (acc, op) => {
      const type = op.dividendType || "dividend";
      acc[type] = (acc[type] || 0) + op.totalValue;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calcular projeção anual baseada nos últimos 12 meses
  const last12Months = new Date();
  last12Months.setFullYear(last12Months.getFullYear() - 1);

  const last12MonthsDividends = state.dividendOperations
    .filter((op) => new Date(op.date) >= last12Months)
    .reduce((sum, op) => sum + op.totalValue, 0);

  const projectedAnnualYield =
    portfolioSummary.currentValue > 0
      ? (last12MonthsDividends / portfolioSummary.currentValue) * 100
      : 0;

  const typeLabels = {
    dividend: "Dividendos",
    jscp: "JCP",
    bonus: "Bonificações",
    split: "Desdobramentos",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {portfolioSummary.totalDividendsReceived.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Histórico completo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Renda Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R${" "}
              {portfolioSummary.monthlyDividendIncome.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-purple-600" />
              Yield Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {portfolioSummary.averageYield.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Da carteira</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Projeção Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {projectedAnnualYield.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por tipo de dividendo */}
      {Object.keys(dividendsByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(dividendsByType).map(([type, value]) => {
                const percentage =
                  portfolioSummary.totalDividendsReceived > 0
                    ? (value / portfolioSummary.totalDividendsReceived) * 100
                    : 0;

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {typeLabels[type as keyof typeof typeLabels] || type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          R${" "}
                          {value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top investimentos por yield */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Top Investimentos por Yield
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.investments
              .filter((inv) => (inv.dividendYield || 0) > 0)
              .sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0))
              .slice(0, 5)
              .map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{investment.symbol}</div>
                    <div className="text-sm text-muted-foreground">
                      R${" "}
                      {(investment.totalDividendsReceived || 0).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 },
                      )}{" "}
                      recebidos
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {(investment.dividendYield || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Yield</div>
                  </div>
                </div>
              ))}

            {state.investments.filter((inv) => (inv.dividendYield || 0) > 0)
              .length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum investimento com dividendos registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DividendYieldMetrics;
