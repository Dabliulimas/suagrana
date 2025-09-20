"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { PiggyBank, TrendingUp, AlertTriangle, Eye } from "lucide-react";
import { useBudgetSummary } from "../../../hooks/financial/use-budget-data";
import Link from "next/link";

export function BudgetSummaryCard() {
  const { summary, isLoading } = useBudgetSummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <PiggyBank className="w-5 h-5" />
            Resumo do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <PiggyBank className="w-5 h-5" />
            Resumo do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <PiggyBank className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Nenhum orçamento configurado</p>
            <Link href="/budget">
              <Button size="sm">Configurar Orçamento</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const utilizationPercentage = summary.utilizationPercentage;
  const isOverBudget = utilizationPercentage > 100;
  const isNearLimit =
    utilizationPercentage > 80 && utilizationPercentage <= 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <PiggyBank className="w-5 h-5" />
          Resumo do Orçamento
        </CardTitle>
        <Link href="/budget">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            Ver Detalhes
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Orçamento Total</p>
            <p className="text-2xl font-bold">
              R${" "}
              {summary.totalBudgeted.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Acima do Limite
                </Badge>
              ) : isNearLimit ? (
                <Badge
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-800"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Próximo ao Limite
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800"
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Dentro do Orçamento
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {utilizationPercentage.toFixed(1)}% utilizado
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress
            value={Math.min(utilizationPercentage, 100)}
            className={`h-3 ${isOverBudget ? "bg-red-100" : isNearLimit ? "bg-orange-100" : "bg-green-100"}`}
          />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Gasto: R${" "}
              {summary.totalSpent.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`font-medium ${
                summary.remaining >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.remaining >= 0 ? "Restante" : "Excesso"}: R${" "}
              {Math.abs(summary.remaining).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-lg font-semibold">{summary.categoriesCount}</p>
            <p className="text-xs text-gray-600">Categorias</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600">
              {summary.overBudgetCategories}
            </p>
            <p className="text-xs text-gray-600">Acima do Limite</p>
          </div>
        </div>

        {summary.overBudgetCategories > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">
                {summary.overBudgetCategories} categoria
                {summary.overBudgetCategories > 1 ? "s" : ""}
                {summary.overBudgetCategories > 1 ? "estão" : "está"} acima do
                orçamento
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
