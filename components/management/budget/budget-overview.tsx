"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Progress } from "../../ui/progress";
import { PiggyBank, Target, AlertTriangle } from "lucide-react";
import { storage } from "../../../lib/storage";

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  color: string;
}

export function BudgetOverview() {
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = () => {
    try {
      // Get budget limits from localStorage
      const savedLimits = JSON.parse(
        localStorage.getItem("budgetLimits") || "[]",
      );
      if (typeof window === "undefined") return;

      // Get current month transactions
      const transactions = transactions;
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Calculate spending by category for current month
      const categorySpending: { [key: string]: number } = {};
      transactions
        .filter(
          (t) => t.type === "expense" && t.date.slice(0, 7) === currentMonth,
        )
        .forEach((t) => {
          categorySpending[t.category] =
            (categorySpending[t.category] || 0) + Math.abs(t.amount);
        });

      // Create budget categories from saved limits or use realistic defaults
      let categories: BudgetCategory[] = [];

      if (savedLimits.length > 0) {
        categories = savedLimits.map((limit: any, index: number) => ({
          name: limit.categoryId,
          budget: limit.monthlyLimit,
          spent: categorySpending[limit.categoryId] || 0,
          color: getColorClass(index),
        }));
      } else {
        // Create realistic categories based on actual spending
        const uniqueCategories = Object.keys(categorySpending);
        if (uniqueCategories.length > 0) {
          categories = uniqueCategories.map((category, index) => ({
            name: category,
            budget: Math.round(categorySpending[category] * 1.2), // 20% buffer
            spent: categorySpending[category],
            color: getColorClass(index),
          }));
        } else {
          // Fallback to default categories if no data
          categories = [
            {
              name: "Alimentação",
              budget: 600,
              spent: 0,
              color: "bg-blue-500",
            },
            {
              name: "Transporte",
              budget: 300,
              spent: 0,
              color: "bg-green-500",
            },
            { name: "Lazer", budget: 200, spent: 0, color: "bg-yellow-500" },
            { name: "Saúde", budget: 150, spent: 0, color: "bg-purple-500" },
          ];
        }
      }

      setBudgetCategories(categories);
    } catch (error) {
      logComponents.error("Error loading budget data:", error);
      // Fallback to default categories on error
      setBudgetCategories([
        { name: "Alimentação", budget: 600, spent: 0, color: "bg-blue-500" },
        { name: "Transporte", budget: 300, spent: 0, color: "bg-green-500" },
        { name: "Lazer", budget: 200, spent: 0, color: "bg-yellow-500" },
        { name: "Saúde", budget: 150, spent: 0, color: "bg-purple-500" },
      ]);
    }
  };

  const getColorClass = (index: number): string => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const totalBudget = budgetCategories.reduce(
    (sum, cat) => sum + cat.budget,
    0,
  );
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Orçamento Total
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
          <CardTitle>Orçamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetCategories.map((category) => {
              const percentage = (category.spent / category.budget) * 100;
              const isOverBudget = category.spent > category.budget;

              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
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
                        {category.budget.toLocaleString("pt-BR", {
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
                    <span>{percentage.toFixed(1)}% usado</span>
                    <span>
                      {isOverBudget
                        ? `R$ ${(category.spent - category.budget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} acima`
                        : `R$ ${(category.budget - category.spent).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} restante`}
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
