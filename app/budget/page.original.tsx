"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  AlertTriangle,
  CheckCircle,
  Target,
  Calculator,
  Calendar,
  BarChart3,
  Award,
  Activity,
  Brain,
  Settings,
  Eye,
  Lightbulb,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTransactions, useAccounts } from "@/contexts/unified-context";
import { BackButton } from "@/components/back-button";
import { useClientOnly } from "@/hooks/use-client-only";


export default function BudgetPage() {
  const isClient = useClientOnly();
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
  );
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("monthly");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    budgeted: 0,
    color: "#3b82f6",
  });
  const [stats, setStats] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    remainingBudget: 0,
    categoriesCount: 0,
    overBudgetCategories: 0,
    savingsRate: 0,
  });
  const [showInsights, setShowInsights] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Usar hooks reais
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const isLoading = false; // Contexto unificado sempre carregado
  const error = null; // Sem erro para dados do localStorage
  
  // Carregar limites de orçamento do localStorage
  const [budgetLimits, setBudgetLimits] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  useEffect(() => {
    const savedLimits = JSON.parse(localStorage.getItem('budgetLimits') || '[]');
    setBudgetLimits(savedLimits);
  }, [refreshTrigger]);

  // Calcular gastos por categoria do mês atual
  const currentMonthStr = `${selectedYear}-${selectedMonth}`;
  const currentMonthTransactions = transactions.filter(
    (t) => t.type === "expense" && t.date.slice(0, 7) === currentMonthStr,
  );

  const categorySpending: { [key: string]: number } = {};
  currentMonthTransactions.forEach((t) => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
  });

  // Criar estrutura de dados com budgetLimits
  const processedBudgetData = {
    categories: budgetLimits.map((cat: any) => ({
      ...cat,
      spent: categorySpending[cat.name] || 0,
      budgeted: cat.budgeted || cat.budget || 0,
    })),
    totalBudgeted: budgetLimits.reduce((sum: number, cat: any) => sum + (cat.budgeted || cat.budget || 0), 0),
    totalSpent: Object.values(categorySpending).reduce((sum: number, spent: number) => sum + spent, 0),
  };

  // Funções de compatibilidade
  const updateBudgetCategory = async (id: string, data: any) => {
    // Implementar atualização via localStorage para compatibilidade
    const savedLimits = JSON.parse(localStorage.getItem("budgetLimits") || "[]");
    const updatedLimits = savedLimits.map((limit: any) => 
      limit.id === id ? { ...limit, ...data } : limit
    );
    localStorage.setItem("budgetLimits", JSON.stringify(updatedLimits));
    refreshData();
  };

  const addBudgetCategory = async (data: any) => {
    const savedLimits = JSON.parse(localStorage.getItem("budgetLimits") || "[]");
    const newLimit = {
      id: Date.now().toString(),
      ...data,
      month: currentMonthStr,
      createdAt: new Date().toISOString(),
    };
    savedLimits.push(newLimit);
    localStorage.setItem("budgetLimits", JSON.stringify(savedLimits));
    refreshData();
  };

  const deleteBudgetCategory = async (id: string) => {
    const savedLimits = JSON.parse(localStorage.getItem("budgetLimits") || "[]");
    const filteredLimits = savedLimits.filter((limit: any) => limit.id !== id);
    localStorage.setItem("budgetLimits", JSON.stringify(filteredLimits));
    refreshData();
  };

  // Usar dados processados
  const finalBudgetData = processedBudgetData;

  // Generate intelligent insights
  const generateInsights = (budgetData: any) => {
    if (!budgetData || !budgetData.categories) return [];

    const insights = [];
    const categories = budgetData.categories;

    // Check for overspending
    const overspentCategories = categories.filter(
      (cat: any) => cat.spent > cat.budgeted,
    );
    if (overspentCategories.length > 0) {
      insights.push({
        type: "warning",
        title: "Categorias Acima do Orçamento",
        description: `${overspentCategories.length} categoria(s) ultrapassaram o limite`,
        action: "Revisar gastos",
        priority: "high",
      });
    }

    // Check for underutilized budget
    const underutilizedCategories = categories.filter(
      (cat: any) => cat.spent < cat.budgeted * 0.5,
    );
    if (underutilizedCategories.length > 0) {
      insights.push({
        type: "opportunity",
        title: "Orçamento Subutilizado",
        description: `${underutilizedCategories.length} categoria(s) com baixa utilização`,
        action: "Redistribuir orçamento",
        priority: "medium",
      });
    }

    // Check savings rate
    const savingsRate =
      budgetData.totalBudgeted > 0
        ? ((budgetData.totalBudgeted - budgetData.totalSpent) /
            budgetData.totalBudgeted) *
          100
        : 0;
    if (savingsRate > 20) {
      insights.push({
        type: "achievement",
        title: "Excelente Taxa de Economia",
        description: `Você economizou ${savingsRate.toFixed(1)}% do seu orçamento`,
        action: "Considere investir",
        priority: "low",
      });
    }

    return insights;
  };

  // Load historical data for comparisons
  const loadHistoricalData = () => {
    const historical = [];
    const currentDate = new Date();

    for (let i = 1; i <= 6; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      const budgetKey = `sua-grana-budget-${year}-${month}`;
      const savedBudget = localStorage.getItem(budgetKey);
      if (typeof window === "undefined") return;

      if (savedBudget) {
        const categories = JSON.parse(savedBudget);
        const totalBudgeted = categories.reduce(
          (sum: number, cat: any) => sum + cat.budgeted,
          0,
        );
        const totalSpent = categories.reduce(
          (sum: number, cat: any) => sum + (cat.spent || 0),
          0,
        );

        historical.push({
          month: `${year}-${month}`,
          monthName: date.toLocaleDateString("pt-BR", {
            month: "short",
            year: "numeric",
          }),
          totalBudgeted,
          totalSpent,
          savingsRate:
            totalBudgeted > 0
              ? ((totalBudgeted - totalSpent) / totalBudgeted) * 100
              : 0,
        });
      }
    }

    setHistoricalData(historical.reverse());
  };

  // Calculate statistics
  useEffect(() => {
    if (finalBudgetData) {
      const totalBudgeted = finalBudgetData.totalBudgeted || 0;
      const totalSpent = finalBudgetData.totalSpent || 0;
      const remainingBudget = totalBudgeted - totalSpent;
      const categoriesCount = finalBudgetData.categories?.length || 0;
      const overBudgetCategories =
        finalBudgetData.categories?.filter((cat) => cat.spent > cat.budgeted)
          ?.length || 0;
      const savingsRate =
        totalBudgeted > 0
          ? ((totalBudgeted - totalSpent) / totalBudgeted) * 100
          : 0;

      setStats({
        totalBudgeted,
        totalSpent,
        remainingBudget,
        categoriesCount,
        overBudgetCategories,
        savingsRate,
      });

      setInsights(generateInsights(finalBudgetData));
    }
  }, [finalBudgetData]);

  // Load historical data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  // Generate years for selector (current year ± 2)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Generate months
  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  // Create current budget from hook data
  const currentBudget = finalBudgetData
      ? {
          month: selectedMonth,
          year: parseInt(selectedYear),
          categories: finalBudgetData.categories,
          totalBudgeted: finalBudgetData.totalBudgeted,
          totalSpent: finalBudgetData.totalSpent,
        }
      : null;

  const handleAddCategory = async () => {
    if (!newCategory.name || newCategory.budgeted <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    try {
      await addBudgetCategory({
        name: newCategory.name,
        budgeted: newCategory.budgeted,
        color: newCategory.color,
      });

      setNewCategory({ name: "", budgeted: 0, color: "#3b82f6" });
      setIsAddCategoryOpen(false);
      toast.success("Categoria adicionada ao orçamento");
    } catch {
      toast.error("Erro ao adicionar categoria");
    }
  };

  const handleUpdateCategory = async (
    categoryId: string,
    updates: any,
  ) => {
    try {
      await updateBudgetCategory(categoryId, updates);
      toast.success("Categoria atualizada");
    } catch {
      toast.error("Erro ao atualizar categoria");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteBudgetCategory(categoryId);
      toast.success("Categoria removida");
    } catch {
      toast.error("Erro ao remover categoria");
    }
  };


  const getStatusIcon = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100)
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (percentage >= 80)
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <ModernAppLayout
      title="Orçamento"
      subtitle="Planeje e controle seus gastos mensais"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Orçamento
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus orçamentos mensais e acompanhe o desempenho anual
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog
              open={isAddCategoryOpen}
              onOpenChange={setIsAddCategoryOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Nova Categoria de Orçamento
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="category-name"
                      className="text-sm font-medium"
                    >
                      Nome da Categoria
                    </Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      placeholder="Ex: Alimentação, Transporte, Lazer..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="category-budget"
                      className="text-sm font-medium"
                    >
                      Orçamento Mensal
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="category-budget"
                        type="number"
                        value={newCategory.budgeted}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            budgeted: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0,00"
                        className="pl-10"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Cor da Categoria
                    </Label>
                    <div className="grid grid-cols-8 gap-2 mt-2">
                      {[
                        "#3b82f6",
                        "#ef4444",
                        "#10b981",
                        "#f59e0b",
                        "#8b5cf6",
                        "#ec4899",
                        "#06b6d4",
                        "#84cc16",
                        "#f97316",
                        "#6366f1",
                        "#14b8a6",
                        "#eab308",
                        "#d946ef",
                        "#f43f5e",
                        "#0ea5e9",
                        "#22c55e",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newCategory.color === color
                              ? "border-gray-800 scale-110"
                              : "border-gray-200 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() =>
                            setNewCategory({ ...newCategory, color })
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-3">
                      <Label
                        htmlFor="custom-color"
                        className="text-xs text-muted-foreground"
                      >
                        Ou escolha uma cor personalizada:
                      </Label>
                      <Input
                        id="custom-color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) =>
                          setNewCategory({
                            ...newCategory,
                            color: e.target.value,
                          })
                        }
                        className="w-full h-10 mt-1"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-xs text-muted-foreground mb-2">
                      Prévia:
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: newCategory.color }}
                      />
                      <span className="font-medium">
                        {newCategory.name || "Nome da categoria"}
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        R${" "}
                        {newCategory.budgeted.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddCategoryOpen(false);
                        setNewCategory({
                          name: "",
                          budgeted: 0,
                          color: "#3b82f6",
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAddCategory}
                      disabled={!newCategory.name || newCategory.budgeted <= 0}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Categoria
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        {!isLoading && !error && isClient && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Orçamento Total
                    </p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {stats.totalBudgeted.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Gasto
                    </p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {stats.totalSpent.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Restante
                    </p>
                    <p
                      className={`text-2xl font-bold ${stats.remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      R${" "}
                      {stats.remainingBudget.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  {stats.remainingBudget >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Categorias
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.categoriesCount}
                    </p>
                    {stats.overBudgetCategories > 0 && (
                      <p className="text-sm text-red-600">
                        {stats.overBudgetCategories} acima do orçamento
                      </p>
                    )}
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Erro ao carregar dados do orçamento</p>
                <Button onClick={refreshData} className="mt-2">
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Tabs */}
        {!isLoading && !error && isClient && (
          <Tabs
            value={viewMode}
            onValueChange={(value) =>
              setViewMode(value as "monthly" | "annual")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Visão Mensal
              </TabsTrigger>
              <TabsTrigger value="annual" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visão Anual
              </TabsTrigger>
            </TabsList>

            {/* Monthly View */}
            <TabsContent value="monthly" className="space-y-6">
              {currentBudget ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Orçado
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          R${" "}
                          {currentBudget.totalBudgeted.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Gasto
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          R${" "}
                          {currentBudget.totalSpent.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Restante
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${
                            currentBudget.totalBudgeted -
                              currentBudget.totalSpent >=
                            0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R${" "}
                          {(
                            currentBudget.totalBudgeted -
                            currentBudget.totalSpent
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          % Utilizado
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(
                            (currentBudget.totalSpent /
                              currentBudget.totalBudgeted) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Financial Goals Section */}
                  <Card className="p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-semibold">Metas Financeiras</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Meta de Economia Mensal</span>
                          <span className="font-medium">30%</span>
                        </div>
                        <Progress
                          value={
                            stats.totalBudgeted > 0
                              ? Math.min(
                                  ((stats.totalBudgeted - stats.totalSpent) /
                                    stats.totalBudgeted) *
                                    100,
                                  100,
                                )
                              : 0
                          }
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          R${" "}
                          {(
                            stats.totalBudgeted - stats.totalSpent
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          economizados
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Controle de Gastos</span>
                          <span className="font-medium">
                            {stats.totalBudgeted > 0
                              ? (
                                  (stats.totalSpent / stats.totalBudgeted) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            stats.totalBudgeted > 0
                              ? Math.min(
                                  (stats.totalSpent / stats.totalBudgeted) *
                                    100,
                                  100,
                                )
                              : 0
                          }
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {stats.totalSpent <= stats.totalBudgeted
                            ? "Dentro do orçamento"
                            : "Acima do orçamento"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso do Mês</span>
                          <span className="font-medium">
                            {Math.round(
                              (new Date().getDate() /
                                new Date(
                                  new Date().getFullYear(),
                                  new Date().getMonth() + 1,
                                  0,
                                ).getDate()) *
                                100,
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (new Date().getDate() /
                              new Date(
                                new Date().getFullYear(),
                                new Date().getMonth() + 1,
                                0,
                              ).getDate()) *
                            100
                          }
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          Dia {new Date().getDate()} de{" "}
                          {new Date(
                            new Date().getFullYear(),
                            new Date().getMonth() + 1,
                            0,
                          ).getDate()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">
                          Status Geral
                        </span>
                      </div>
                      <Badge
                        variant={
                          stats.totalSpent > stats.totalBudgeted
                            ? "destructive"
                            : "default"
                        }
                        className="w-full justify-center"
                      >
                        {stats.totalSpent > stats.totalBudgeted
                          ? "Atenção"
                          : "Saudável"}
                      </Badge>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Eficiência</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {stats.totalBudgeted > 0
                          ? (
                              ((stats.totalBudgeted - stats.totalSpent) /
                                stats.totalBudgeted) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                      <p className="text-xs text-muted-foreground">
                        de economia
                      </p>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Insights</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full p-0 h-auto"
                        onClick={() => setShowInsights(!showInsights)}
                      >
                        <span className="text-xs">
                          {showInsights ? "Ocultar" : "Ver Dicas"}
                        </span>
                      </Button>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">
                          Configurações
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full p-0 h-auto"
                      >
                        <span className="text-xs">Personalizar</span>
                      </Button>
                    </Card>
                  </div>

                  {/* Insights and Analytics Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Intelligent Insights */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">
                            Insights Inteligentes
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowInsights(!showInsights)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {showInsights && insights.length > 0 ? (
                          <div className="space-y-3">
                            {insights.slice(0, 3).map((insight, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg border"
                              >
                                <div className="mt-1">
                                  {insight.type === "warning" && (
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  )}
                                  {insight.type === "opportunity" && (
                                    <Lightbulb className="h-4 w-4 text-blue-500" />
                                  )}
                                  {insight.type === "achievement" && (
                                    <Award className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">
                                    {insight.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {insight.description}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="mt-2 text-xs"
                                  >
                                    {insight.action}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {insights.length === 0
                                ? "Nenhum insight disponível"
                                : "Clique no olho para ver insights"}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Historical Comparison */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-lg">
                            Comparação Histórica
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAnalytics(!showAnalytics)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {showAnalytics && historicalData.length > 0 ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                              <span>Mês</span>
                              <span>Orçado</span>
                              <span>Economia</span>
                            </div>
                            {historicalData.slice(-4).map((data, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-3 gap-2 text-sm"
                              >
                                <span className="font-medium">
                                  {data.monthName}
                                </span>
                                <span>
                                  R${" "}
                                  {data.totalBudgeted.toLocaleString("pt-BR")}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={
                                      data.savingsRate > 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {data.savingsRate.toFixed(1)}%
                                  </span>
                                  {data.savingsRate > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {historicalData.length === 0
                                ? "Sem dados históricos"
                                : "Clique no gráfico para ver análises"}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visual Analytics Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Budget Distribution Chart */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">
                          Distribuição do Orçamento
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {currentBudget.categories
                          .slice(0, 5)
                          .map((category) => {
                            const percentage =
                              currentBudget.totalBudgeted > 0
                                ? (category.budgeted /
                                    currentBudget.totalBudgeted) *
                                  100
                                : 0;
                            return (
                              <div key={category.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor: category.color,
                                      }}
                                    />
                                    <span>{category.name}</span>
                                  </div>
                                  <span className="font-medium">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all duration-300"
                                    style={{
                                      backgroundColor: category.color,
                                      width: `${percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </Card>

                    {/* Spending Trends */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">Tendências de Gastos</h3>
                      </div>
                      <div className="space-y-4">
                        {historicalData.slice(0, 3).map((month, index) => {
                          const savingsRate =
                            month.totalBudgeted > 0
                              ? ((month.totalBudgeted - month.totalSpent) /
                                  month.totalBudgeted) *
                                100
                              : 0;
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{month.monthName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Economia: {savingsRate.toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  +R${" "}
                                  {(
                                    month.totalBudgeted - month.totalSpent
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  de R${" "}
                                  {month.totalBudgeted.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Categories */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Categorias do Orçamento
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {currentBudget.categories.length} categorias
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAnalytics(!showAnalytics)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          {showAnalytics ? "Ocultar" : "Análises"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setIsAddCategoryOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Nova
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentBudget.categories.map((category) => {
                          const percentage =
                            (category.spent / category.budgeted) * 100;
                          const remaining = category.budgeted - category.spent;

                          return (
                            <div
                              key={category.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                  />
                                  <div>
                                    <h4 className="font-medium">
                                      {category.name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getStatusIcon(
                                        category.spent,
                                        category.budgeted,
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {percentage >= 100
                                          ? "Limite excedido"
                                          : percentage >= 80
                                            ? "Próximo ao limite"
                                            : "Dentro do orçamento"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      percentage >= 100
                                        ? "destructive"
                                        : percentage >= 80
                                          ? "secondary"
                                          : "default"
                                    }
                                  >
                                    {percentage.toFixed(1)}%
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setNewCategory({
                                          name: category.name,
                                          budgeted: category.budgeted,
                                          color: category.color,
                                        });
                                        setIsAddCategoryOpen(true);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteCategory(category.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <Progress
                                value={Math.min(percentage, 100)}
                                className="mb-3"
                              />

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-2 bg-blue-50 rounded">
                                  <p className="text-muted-foreground text-xs">
                                    Orçado
                                  </p>
                                  <p className="font-bold text-blue-600">
                                    R${" "}
                                    {category.budgeted.toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-red-50 rounded">
                                  <p className="text-muted-foreground text-xs">
                                    Gasto
                                  </p>
                                  <p className="font-bold text-red-600">
                                    R${" "}
                                    {category.spent.toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded">
                                  <p className="text-muted-foreground text-xs">
                                    Restante
                                  </p>
                                  <p
                                    className={`font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    R${" "}
                                    {Math.abs(remaining).toLocaleString(
                                      "pt-BR",
                                      { minimumFractionDigits: 2 },
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  Atualizado em tempo real
                                </div>
                                <div className="flex gap-1">
                                  {percentage >= 90 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-orange-50 text-orange-600"
                                    >
                                      <AlertTriangle className="h-2 w-2 mr-1" />
                                      Atenção
                                    </Badge>
                                  )}
                                  {remaining > category.budgeted * 0.5 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-600"
                                    >
                                      <CheckCircle className="h-2 w-2 mr-1" />
                                      Saudável
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Nenhum orçamento encontrado para{" "}
                      {months.find((m) => m.value === selectedMonth)?.label} de{" "}
                      {selectedYear}
                    </p>
                    <Button onClick={() => setIsAddCategoryOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Orçamento
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Annual View */}
            <TabsContent value="annual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Anual - {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {months.map((month) => {
                      // For annual view, we would need to load each month's data
                      // For now, show placeholder data or current month data
                      const monthBudget = {
                        budgeted: currentBudget?.totalBudgeted || 2000,
                        spent: currentBudget?.totalSpent || 0,
                      };
                      const percentage =
                        monthBudget.budgeted > 0
                          ? (monthBudget.spent / monthBudget.budgeted) * 100
                          : 0;

                      return (
                        <Card
                          key={month.value}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedMonth(month.value);
                            setViewMode("monthly");
                          }}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              {month.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>
                                  Orçado: R$ {monthBudget.budgeted.toFixed(0)}
                                </span>
                                <span>
                                  Gasto: R$ {monthBudget.spent.toFixed(0)}
                                </span>
                              </div>
                              <Progress value={Math.min(percentage, 100)} />
                              <div className="text-center">
                                <Badge
                                  variant={
                                    percentage >= 100
                                      ? "destructive"
                                      : percentage >= 80
                                        ? "secondary"
                                        : "default"
                                  }
                                >
                                  {percentage.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ModernAppLayout>
  );
}
