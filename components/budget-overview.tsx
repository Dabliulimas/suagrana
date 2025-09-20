"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  PiggyBank,
  Target,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useBudgetData } from "../hooks/financial/use-budget-data";

export function BudgetOverview() {
  const { budgetData, isLoading } = useBudgetData();

  if (isLoading || !budgetData) {
    return <div>Carregando dados do orcamento...</div>;
  }

  const totalBudget = budgetData.totalBudgeted;
  const totalSpent = budgetData.totalSpent;
  const remaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Orcamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalBudget.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {Math.abs(remaining).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orcamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetData.categories.map((category) => {
              const percentage = (category.spent / category.budgeted) * 100;
              const isOverBudget = category.spent > category.budgeted;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {isOverBudget && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Acima
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${isOverBudget ? "text-red-600" : "text-gray-900"}`}
                      >
                        R${" "}
                        {category.spent.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        / R${" "}
                        {category.budgeted.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-2 ${isOverBudget ? "bg-red-100" : ""}`}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {percentage > 80 ? (
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      )}
                      <span>{percentage.toFixed(1)}% usado</span>
                    </div>
                    <span>
                      {isOverBudget
                        ? `R$ ${(category.spent - category.budgeted).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} acima`
                        : `R$ ${(category.budgeted - category.spent).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} restante`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
