"use client";

import { useState, useEffect } from "react";
import { useFinancialData } from "../hooks/use-financial-data";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Plus, Eye } from "lucide-react";

interface BudgetItem {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export function SimpleBudget() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const { currentMonthTransactions, loading } = useFinancialData();

  useEffect(() => {
    // Calcular orçamento baseado nas transações atuais
    const expenseTransactions = currentMonthTransactions.filter(
      (t) => t.type === "expense",
    );

    // Agrupar por categoria
    const categorySpending = expenseTransactions.reduce(
      (acc, transaction) => {
        const category = transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Orçamentos padrão
    const defaultBudgets = {
      Alimentação: 500,
      Transporte: 500,
      Lazer: 500,
      Saúde: 500,
      Utilidades: 300,
      Compras: 400,
      Educação: 200,
    };

    // Combinar gastos reais com orçamentos
    const budgetData = Object.entries(defaultBudgets).map(
      ([category, budget]) => ({
        category,
        budget,
        spent: categorySpending[category] || 0,
        remaining: budget - (categorySpending[category] || 0),
        percentage: ((categorySpending[category] || 0) / budget) * 100,
      }),
    );

    setBudgets(budgetData);
  }, [currentMonthTransactions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orçamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Orçamento por Categoria</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.category}</span>
                <span className="text-sm text-muted-foreground">
                  R${" "}
                  {item.spent.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  de R${" "}
                  {item.budget.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <Progress
                value={Math.min(item.percentage, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.percentage.toFixed(1)}% usado</span>
                <span
                  className={
                    item.remaining >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {item.remaining >= 0 ? "Restam" : "Excedeu"} R${" "}
                  {Math.abs(item.remaining).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
