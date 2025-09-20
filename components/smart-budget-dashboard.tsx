"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Settings,
  Plus,
  Edit,
  Trash2,
  Brain,
  Zap,
  Target,
  DollarSign,
  PieChart,
  BarChart3,
  Lightbulb,
  Bell,
  X,
} from "lucide-react";
import { toast } from "sonner";
import smartBudgetEngine, {
  type SmartBudgetCategory,
  type BudgetAlert,
  type AutoCategorizationRule,
  type BudgetInsight,
  type SmartBudgetConfig,
} from "../lib/financial/smart-budget-engine";
import {
  useOptimizedMemo,
  useOptimizedCallback,
  withPerformanceOptimization,
  financialCalculationOptimizer,
} from "../lib/performance-optimizer";

const SmartBudgetDashboard = memo(function SmartBudgetDashboard() {
  const [categories, setCategories] = useState<SmartBudgetCategory[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [rules, setRules] = useState<AutoCategorizationRule[]>([]);
  const [insights, setInsights] = useState<BudgetInsight[]>([]);
  const [config, setConfig] = useState<SmartBudgetConfig>({
    autoAdjustEnabled: true,
    alertFrequency: "realtime",
    learningEnabled: true,
    predictiveAnalysis: true,
    anomalyDetection: true,
    smartRecommendations: true,
  });
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<SmartBudgetCategory | null>(null);
  const [editingRule, setEditingRule] = useState<AutoCategorizationRule | null>(
    null,
  );

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    budgeted: 0,
    color: "#3b82f6",
    autoAdjust: true,
    alertThreshold: 80,
    priority: "important" as "essential" | "important" | "optional",
    tags: [] as string[],
    spendingPattern: "consistent" as "consistent" | "variable" | "seasonal",
  });

  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    conditions: [
      {
        field: "description" as
          | "description"
          | "amount"
          | "merchant"
          | "account",
        operator: "contains" as
          | "contains"
          | "equals"
          | "greater_than"
          | "less_than"
          | "starts_with"
          | "ends_with",
        value: "",
        caseSensitive: false,
      },
    ],
    actions: [
      {
        type: "set_category" as
          | "set_category"
          | "set_subcategory"
          | "add_tag"
          | "set_priority",
        value: "",
      },
    ],
    confidence: 80,
    enabled: true,
    priority: 1,
  });

  const optimizedLoadData = useOptimizedCallback(
    () => {
      loadData();
    },
    [],
    300,
  );

  useEffect(() => {
    optimizedLoadData();
  }, [optimizedLoadData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [
        categoriesData,
        alertsData,
        rulesData,
        insightsData,
        configData,
        summaryData,
      ] = await Promise.all([
        smartBudgetEngine.getCategories(),
        smartBudgetEngine.getAlerts(),
        smartBudgetEngine.getRules(),
        smartBudgetEngine.getInsights(),
        smartBudgetEngine.getConfig(),
        smartBudgetEngine.getBudgetSummary(),
      ]);

      setCategories(categoriesData);
      setAlerts(alertsData);
      setRules(rulesData);
      setInsights(insightsData);
      setConfig(configData);
      setBudgetSummary(summaryData);
    } catch (error) {
      logComponents.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do orçamento inteligente");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAddCategory = async () => {
    try {
      await smartBudgetEngine.addCategory({
        ...categoryForm,
        averageMonthlySpending: 0,
      });
      await loadData();
      setShowCategoryDialog(false);
      resetCategoryForm();
      toast.success("Categoria adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar categoria");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      await smartBudgetEngine.updateCategory(editingCategory.id, categoryForm);
      await loadData();
      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast.success("Categoria atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar categoria");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await smartBudgetEngine.deleteCategory(id);
      await loadData();
      toast.success("Categoria removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover categoria");
    }
  };

  const handleAddRule = async () => {
    try {
      await smartBudgetEngine.addRule(ruleForm);
      await loadData();
      setShowRuleDialog(false);
      resetRuleForm();
      toast.success("Regra adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar regra");
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;

    try {
      await smartBudgetEngine.updateRule(editingRule.id, ruleForm);
      await loadData();
      setShowRuleDialog(false);
      setEditingRule(null);
      resetRuleForm();
      toast.success("Regra atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar regra");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await smartBudgetEngine.deleteRule(id);
      await loadData();
      toast.success("Regra removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover regra");
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await smartBudgetEngine.acknowledgeAlert(id);
      await loadData();
    } catch (error) {
      toast.error("Erro ao marcar alerta como lido");
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await smartBudgetEngine.updateConfig(config);
      setShowConfigDialog(false);
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar configurações");
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      budgeted: 0,
      color: "#3b82f6",
      autoAdjust: true,
      alertThreshold: 80,
      priority: "important",
      tags: [],
      spendingPattern: "consistent",
    });
  };

  const resetRuleForm = () => {
    setRuleForm({
      name: "",
      description: "",
      conditions: [
        {
          field: "description",
          operator: "contains",
          value: "",
          caseSensitive: false,
        },
      ],
      actions: [
        {
          type: "set_category",
          value: "",
        },
      ],
      confidence: 80,
      enabled: true,
      priority: 1,
    });
  };

  const openEditCategory = (category: SmartBudgetCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      budgeted: category.budgeted,
      color: category.color,
      autoAdjust: category.autoAdjust,
      alertThreshold: category.alertThreshold,
      priority: category.priority,
      tags: category.tags,
      spendingPattern: category.spendingPattern,
    });
    setShowCategoryDialog(true);
  };

  const openEditRule = (rule: AutoCategorizationRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description,
      conditions: rule.conditions,
      actions: rule.actions,
      confidence: rule.confidence,
      enabled: rule.enabled,
      priority: rule.priority,
    });
    setShowRuleDialog(true);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="h-4 w-4" />;
      case "anomaly":
        return <AlertTriangle className="h-4 w-4" />;
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />;
      case "recommendation":
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orçamento Inteligente</h1>
          <p className="text-gray-600">
            Sistema avançado de controle orçamentário com IA
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurações do Sistema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ajuste Automático</Label>
                  <Switch
                    checked={config.autoAdjustEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, autoAdjustEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Aprendizado de Máquina</Label>
                  <Switch
                    checked={config.learningEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, learningEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Análise Preditiva</Label>
                  <Switch
                    checked={config.predictiveAnalysis}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, predictiveAnalysis: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Detecção de Anomalias</Label>
                  <Switch
                    checked={config.anomalyDetection}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, anomalyDetection: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Recomendações Inteligentes</Label>
                  <Switch
                    checked={config.smartRecommendations}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, smartRecommendations: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência de Alertas</Label>
                  <Select
                    value={config.alertFrequency}
                    onValueChange={(value: any) =>
                      setConfig({ ...config, alertFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Tempo Real</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateConfig} className="w-full">
                  Salvar Configurações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {budgetSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orçado</p>
                  <p className="text-2xl font-bold text-green-600">
                    R${" "}
                    {budgetSummary.totalBudgeted.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gasto</p>
                  <p className="text-2xl font-bold text-red-600">
                    R${" "}
                    {budgetSummary.totalSpent.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilização</p>
                  <p className="text-2xl font-bold">
                    {budgetSummary.utilizationPercentage.toFixed(1)}%
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alertas Ativos</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {budgetSummary.activeAlerts}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categorias de Orçamento</h2>
            <Dialog
              open={showCategoryDialog}
              onOpenChange={setShowCategoryDialog}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetCategoryForm();
                    setEditingCategory(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Editar" : "Nova"} Categoria
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div>
                    <Label>Orçamento Mensal</Label>
                    <Input
                      type="number"
                      value={categoryForm.budgeted}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          budgeted: Number(e.target.value),
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          color: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Limite de Alerta (%)</Label>
                    <Input
                      type="number"
                      value={categoryForm.alertThreshold}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          alertThreshold: Number(e.target.value),
                        })
                      }
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select
                      value={categoryForm.priority}
                      onValueChange={(value: any) =>
                        setCategoryForm({ ...categoryForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essential">Essencial</SelectItem>
                        <SelectItem value="important">Importante</SelectItem>
                        <SelectItem value="optional">Opcional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ajuste Automático</Label>
                    <Switch
                      checked={categoryForm.autoAdjust}
                      onCheckedChange={(checked) =>
                        setCategoryForm({
                          ...categoryForm,
                          autoAdjust: checked,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={
                      editingCategory ? handleUpdateCategory : handleAddCategory
                    }
                    className="w-full"
                  >
                    {editingCategory ? "Atualizar" : "Adicionar"} Categoria
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => {
              const percentage =
                category.budgeted > 0
                  ? (category.spent / category.budgeted) * 100
                  : 0;
              const isOverBudget = percentage > 100;
              const isWarning = percentage >= category.alertThreshold;

              return (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                category.priority === "essential"
                                  ? "destructive"
                                  : category.priority === "important"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {category.priority === "essential"
                                ? "Essencial"
                                : category.priority === "important"
                                  ? "Importante"
                                  : "Opcional"}
                            </Badge>
                            {category.autoAdjust && (
                              <Badge variant="outline">
                                <Zap className="h-3 w-3 mr-1" />
                                Auto-ajuste
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Gasto: R${" "}
                          {category.spent.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span>
                          Orçado: R${" "}
                          {category.budgeted.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={`h-2 ${isOverBudget ? "bg-red-100" : isWarning ? "bg-yellow-100" : "bg-green-100"}`}
                      />
                      <div className="flex justify-between text-sm">
                        <span
                          className={
                            isOverBudget
                              ? "text-red-600"
                              : isWarning
                                ? "text-yellow-600"
                                : "text-green-600"
                          }
                        >
                          {percentage.toFixed(1)}% utilizado
                        </span>
                        <span
                          className={
                            percentage > 100 ? "text-red-600" : "text-gray-600"
                          }
                        >
                          {percentage > 100 ? "Excedido em " : "Restante: "}R${" "}
                          {Math.abs(
                            category.budgeted - category.spent,
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <h2 className="text-xl font-semibold">Alertas do Sistema</h2>
          <div className="space-y-3">
            {alerts
              .filter((alert) => !alert.acknowledged)
              .map((alert) => (
                <Alert
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.type === "critical"
                      ? "border-l-red-500 bg-red-50"
                      : alert.type === "warning"
                        ? "border-l-yellow-500 bg-yellow-50"
                        : alert.type === "success"
                          ? "border-l-green-500 bg-green-50"
                          : "border-l-blue-500 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <AlertDescription className="mt-1">
                          {alert.message}
                        </AlertDescription>
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Ação sugerida:</strong>{" "}
                          {alert.suggestedAction}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              ))}
            {alerts.filter((alert) => !alert.acknowledged).length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum alerta ativo. Seu orçamento está sob controle!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Regras de Categorização Automática
            </h2>
            <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetRuleForm();
                    setEditingRule(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? "Editar" : "Nova"} Regra de Automação
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Regra</Label>
                    <Input
                      value={ruleForm.name}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, name: e.target.value })
                      }
                      placeholder="Nome da regra"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={ruleForm.description}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descreva o que esta regra faz"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Confiança (%)</Label>
                      <Input
                        type="number"
                        value={ruleForm.confidence}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            confidence: Number(e.target.value),
                          })
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <Input
                        type="number"
                        value={ruleForm.priority}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            priority: Number(e.target.value),
                          })
                        }
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Regra Ativa</Label>
                    <Switch
                      checked={ruleForm.enabled}
                      onCheckedChange={(checked) =>
                        setRuleForm({ ...ruleForm, enabled: checked })
                      }
                    />
                  </div>
                  <Button
                    onClick={editingRule ? handleUpdateRule : handleAddRule}
                    className="w-full"
                  >
                    {editingRule ? "Atualizar" : "Adicionar"} Regra
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-gray-600">
                        {rule.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Ativa" : "Inativa"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Confiança: {rule.confidence}%</span>
                    <span>Prioridade: {rule.priority}</span>
                    <span>Usos: {rule.usageCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <h2 className="text-xl font-semibold">Insights Inteligentes</h2>
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge
                          variant={
                            insight.impact === "positive"
                              ? "default"
                              : insight.impact === "negative"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {insight.impact === "positive"
                            ? "Positivo"
                            : insight.impact === "negative"
                              ? "Negativo"
                              : "Neutro"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {insight.description}
                      </p>
                      {insight.actionable &&
                        insight.suggestedActions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Ações sugeridas:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {insight.suggestedActions.map((action, index) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                        <span>Confiança: {insight.confidence}%</span>
                        <span>
                          {new Date(insight.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {insights.length === 0 && (
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  Nenhum insight disponível no momento. O sistema está
                  analisando seus dados para gerar recomendações personalizadas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export { SmartBudgetDashboard };
export default withPerformanceOptimization(SmartBudgetDashboard, {
  displayName: "SmartBudgetDashboard",
  enableProfiling: process.env.NODE_ENV === "development",
});
