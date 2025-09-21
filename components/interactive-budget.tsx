"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  PiggyBank,
  Target,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// Substituindo pelos novos hooks otimizados
import { useTransactions } from "../hooks/use-optimized-transactions";

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
}

interface BudgetLimit {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  currentSpent: number;
  alertThreshold: number;
  isActive: boolean;
  notifications: boolean;
  createdAt: string;
  month: string;
}

export function InteractiveBudget() {
  const router = useRouter();
  
  // Usar os novos hooks otimizados
  const { data: transactionsData } = useTransactions();
  const transactions = transactionsData?.transactions || [];
  
  // TODO: Implementar hooks para budgetData, loading

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: 0,
    color: "#3B82F6",
  });
  const [editValues, setEditValues] = useState<{
    [key: string]: { name: string; budget: number; color: string };
  }>({});

  const predefinedCategories = [
    { name: "Alimentação", color: "#3B82F6" },
    { name: "Transporte", color: "#10B981" },
    { name: "Lazer", color: "#F59E0B" },
    { name: "Saúde", color: "#8B5CF6" },
    { name: "Educação", color: "#EF4444" },
    { name: "Moradia", color: "#06B6D4" },
    { name: "Vestuário", color: "#EC4899" },
    { name: "Outros", color: "#6B7280" },
  ];

  const predefinedColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
    "#EC4899",
    "#6B7280",
    "#F97316",
    "#84CC16",
  ];

  useEffect(() => {
    loadBudgetData();
  }, [budgetData, transactions]);

  const loadBudgetData = () => {
    try {
      if (!transactions || !budgetData) return;

      // Get current month/year for synchronization with budget page
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      const currentMonthStr = now.toISOString().slice(0, 7);

      // Load budget limits from localStorage (legacy format)
      const savedLimits = JSON.parse(
        localStorage.getItem("budgetLimits") || "[]",
      ) as BudgetLimit[];
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      setBudgetLimits(savedLimits);

      // Calculate spending from transactions using hook data
      const categorySpending: { [key: string]: number } = {};
      transactions
        .filter(
          (t) => t.type === "expense" && t.date.slice(0, 7) === currentMonthStr,
        )
        .forEach((t) => {
          categorySpending[t.category] =
            (categorySpending[t.category] || 0) + Math.abs(t.amount);
        });

      let categories: BudgetCategory[] = [];

      // Use budget data from hook if available
      if (budgetData && budgetData.length > 0) {
        categories = budgetData.map((cat: any) => ({
          id: cat.id || Date.now().toString(),
          name: cat.name,
          budget: cat.budgeted || cat.budget || 0,
          spent: categorySpending[cat.name] || 0,
          color:
            cat.color ||
            predefinedCategories.find((p) => p.name === cat.name)?.color ||
            predefinedColors[0],
        }));
      } else {
        // Create budget categories from limits (legacy)
        categories = savedLimits.map((limit) => {
          const spent = categorySpending[limit.categoryId] || 0;
          const predefined = predefinedCategories.find(
            (p) => p.name === limit.categoryId,
          );

          return {
            id: limit.id,
            name: limit.categoryId,
            budget: limit.monthlyLimit,
            spent,
            color:
              predefined?.color ||
              predefinedColors[
                Math.floor(Math.random() * predefinedColors.length)
              ],
          };
        });
      }

      // Add default categories if none exist
      if (categories.length === 0) {
        // Calculate realistic budgets based on last 3 months of spending
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentTransactions = transactions.filter(
          (t) => t.type === "expense" && new Date(t.date) >= threeMonthsAgo,
        );

        if (recentTransactions.length > 0) {
          const categoryTotals: { [key: string]: number[] } = {};

          recentTransactions.forEach((t) => {
            if (!categoryTotals[t.category]) {
              categoryTotals[t.category] = [];
            }
            categoryTotals[t.category].push(Math.abs(t.amount));
          });

          categories = Object.entries(categoryTotals).map(
            ([categoryName, amounts], index) => {
              const monthlyAverage =
                amounts.reduce((sum, amount) => sum + amount, 0) / 3;
              const suggestedBudget = Math.ceil(monthlyAverage * 1.2); // 20% buffer
              const predefined = predefinedCategories.find(
                (p) => p.name === categoryName,
              );

              return {
                id: Date.now().toString() + index,
                name: categoryName,
                budget: suggestedBudget,
                spent: categorySpending[categoryName] || 0,
                color:
                  predefined?.color ||
                  predefinedColors[index % predefinedColors.length],
              };
            },
          );
        } else {
          // Fallback to predefined categories with default budgets
          categories = predefinedCategories.slice(0, 4).map((cat, index) => ({
            id: Date.now().toString() + index,
            name: cat.name,
            budget: 500,
            spent: categorySpending[cat.name] || 0,
            color: cat.color,
          }));
        }
      }

      setBudgetCategories(categories);
    } catch (error) {
      logComponents.error("Error loading budget data:", error);
      toast.error("Erro ao carregar dados do orçamento");
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name || newCategory.budget <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      budget: newCategory.budget,
      spent: 0,
      color: newCategory.color,
    };

    const limit: BudgetLimit = {
      id: category.id,
      categoryId: category.name,
      monthlyLimit: category.budget,
      currentSpent: 0,
      alertThreshold: 80,
      isActive: true,
      notifications: true,
      createdAt: new Date().toISOString(),
      month: new Date().toISOString().slice(0, 7),
    };

    const updatedCategories = [...budgetCategories, category];
    const updatedLimits = [...budgetLimits, limit];

    setBudgetCategories(updatedCategories);
    setBudgetLimits(updatedLimits);

    // Save to both formats for synchronization
    localStorage.setItem("budgetLimits", JSON.stringify(updatedLimits));

    // Save to budget page format
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
    const budgetPageKey = `sua-grana-budget-${currentYear}-${currentMonth}`;

    const budgetPageData = updatedCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      budgeted: cat.budget,
      spent: cat.spent,
      color: cat.color,
    }));
    localStorage.setItem(budgetPageKey, JSON.stringify(budgetPageData));

    setNewCategory({ name: "", budget: 0, color: "#3B82F6" });
    setIsAddingCategory(false);
    toast.success("Categoria adicionada com sucesso!");
  };

  const handleEditCategory = (categoryId: string) => {
    const category = budgetCategories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditValues({
        ...editValues,
        [categoryId]: {
          name: category.name,
          budget: category.budget,
          color: category.color,
        },
      });
      setEditingCategory(categoryId);
    }
  };

  const handleSaveEdit = (categoryId: string) => {
    const editValue = editValues[categoryId];
    if (!editValue || !editValue.name || editValue.budget <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    const updatedCategories = budgetCategories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            name: editValue.name,
            budget: editValue.budget,
            color: editValue.color,
          }
        : cat,
    );

    const updatedLimits = budgetLimits.map((limit) =>
      limit.id === categoryId
        ? {
            ...limit,
            categoryId: editValue.name,
            monthlyLimit: editValue.budget,
          }
        : limit,
    );

    setBudgetCategories(updatedCategories);
    setBudgetLimits(updatedLimits);

    // Save to both formats for synchronization
    localStorage.setItem("budgetLimits", JSON.stringify(updatedLimits));

    // Save to budget page format
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
    const budgetPageKey = `sua-grana-budget-${currentYear}-${currentMonth}`;

    const budgetPageData = updatedCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      budgeted: cat.budget,
      spent: cat.spent,
      color: cat.color,
    }));
    localStorage.setItem(budgetPageKey, JSON.stringify(budgetPageData));

    setEditingCategory(null);
    setEditValues({});
    toast.success("Categoria atualizada com sucesso!");
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = budgetCategories.filter(
      (cat) => cat.id !== categoryId,
    );
    const updatedLimits = budgetLimits.filter(
      (limit) => limit.id !== categoryId,
    );

    setBudgetCategories(updatedCategories);
    setBudgetLimits(updatedLimits);

    // Save to both formats for synchronization
    localStorage.setItem("budgetLimits", JSON.stringify(updatedLimits));

    // Save to budget page format
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
    const budgetPageKey = `sua-grana-budget-${currentYear}-${currentMonth}`;

    const budgetPageData = updatedCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      budgeted: cat.budget,
      spent: cat.spent,
      color: cat.color,
    }));
    localStorage.setItem(budgetPageKey, JSON.stringify(budgetPageData));

    toast.success("Categoria removida com sucesso!");
  };

  const totalBudget = budgetCategories.reduce(
    (sum, cat) => sum + cat.budget,
    0,
  );
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const remaining = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dados carregados automaticamente via React Query

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Orçamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
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
              <AlertTriangle className="w-4 h-4" />
              Total Gasto
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
              <PiggyBank className="w-4 h-4" />
              Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget by Category */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Orçamento por Categoria
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/budget")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Detalhes
              </Button>
              <Dialog
                open={isAddingCategory}
                onOpenChange={setIsAddingCategory}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Categoria</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Nome da Categoria</Label>
                      <Select
                        value={newCategory.name}
                        onValueChange={(value) =>
                          setNewCategory({ ...newCategory, name: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedCategories.map((cat) => (
                            <SelectItem key={cat.name} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category-budget">
                        Orçamento Mensal (R$)
                      </Label>
                      <Input
                        id="category-budget"
                        type="number"
                        value={newCategory.budget}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            budget: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-color">Cor</Label>
                      <div className="flex gap-2 mt-2">
                        {predefinedColors.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${newCategory.color === color ? "border-gray-800" : "border-gray-300"}`}
                            style={{ backgroundColor: color }}
                            onClick={() =>
                              setNewCategory({ ...newCategory, color })
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCategory} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingCategory(false)}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetCategories.map((category) => {
              const percentage =
                category.budget > 0
                  ? (category.spent / category.budget) * 100
                  : 0;
              const isOverBudget = percentage > 100;
              const isEditing = editingCategory === category.id;

              return (
                <div key={category.id} className="space-y-3">
                  {isEditing ? (
                    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`edit-name-${category.id}`}>
                            Nome
                          </Label>
                          <Input
                            id={`edit-name-${category.id}`}
                            value={editValues[category.id]?.name || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [category.id]: {
                                  ...editValues[category.id],
                                  name: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-budget-${category.id}`}>
                            Orçamento
                          </Label>
                          <Input
                            id={`edit-budget-${category.id}`}
                            type="number"
                            value={editValues[category.id]?.budget || 0}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [category.id]: {
                                  ...editValues[category.id],
                                  budget: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`edit-color-${category.id}`}>Cor</Label>
                        <div className="flex gap-2 mt-2">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full border-2 ${
                                editValues[category.id]?.color === color
                                  ? "border-gray-800"
                                  : "border-gray-300"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() =>
                                setEditValues({
                                  ...editValues,
                                  [category.id]: {
                                    ...editValues[category.id],
                                    color,
                                  },
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(category.id)}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCategory(null)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs">
                              Acima do orçamento
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          R${" "}
                          {category.spent.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          de R${" "}
                          {category.budget.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-2"
                        />
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {budgetCategories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria de orçamento configurada</p>
                <p className="text-sm">
                  Clique em "Nova Categoria" para começar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
