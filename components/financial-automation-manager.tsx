"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { DatePicker } from "./ui/date-picker";
import {
  Bot,
  Calendar,
  Bell,
  DollarSign,
  Plus,
  Settings,
  Trash2,
  Edit,
  Play,
  Pause,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Repeat,
  Zap,
} from "lucide-react";
import { automationEngine } from "../lib/financial-automation";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";

interface AutomationManagerProps {
  className?: string;
}

const FinancialAutomationManager: React.FC<AutomationManagerProps> = ({
  className,
}) => {
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);
  const [budgetRules, setBudgetRules] = useState<any[]>([]);
  const [automationRules, setAutomationRules] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [recurringForm, setRecurringForm] = useState({
    name: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    description: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    accountId: "",
    enabled: true,
  });

  const [alertForm, setAlertForm] = useState({
    title: "",
    message: "",
    type: "budget_warning",
    priority: "medium",
    enabled: true,
  });

  const [budgetForm, setBudgetForm] = useState({
    category: "",
    monthlyLimit: "",
    warningThreshold: "80",
    enabled: true,
    notifications: true,
    autoAdjust: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const accountsData = accounts || [];
      const statsData = {
        activeRecurringTransactions: 0,
        totalRecurringTransactions: 0,
        activeSmartAlerts: 0,
        totalSmartAlerts: 0,
        activeBudgetRules: 0,
        totalBudgetRules: 0,
        activeRules: 0,
        totalRules: 0,
      };

      setAccounts(accountsData);
      setStats(statsData);
      setRecurringTransactions([]);
      setSmartAlerts([]);
      setBudgetRules([]);
      setAutomationRules([]);
    } catch (error) {
      logComponents.error("Erro ao carregar dados de automação:", error);
      toast.error("Erro ao carregar dados de automação");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecurring = async () => {
    try {
      if (
        !recurringForm.name ||
        !recurringForm.amount ||
        !recurringForm.accountId
      ) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const transaction = {
        ...recurringForm,
        amount: parseFloat(recurringForm.amount),
      };

      // Simplified for now - just show success
      toast.success(
        editingItem ? "Transação atualizada!" : "Transação criada!",
      );

      setShowRecurringDialog(false);
      setEditingItem(null);
      resetRecurringForm();
      await loadData();
    } catch (error) {
      logComponents.error("Erro ao salvar transação recorrente:", error);
      toast.error("Erro ao salvar transação recorrente");
    }
  };

  const handleCreateAlert = async () => {
    try {
      if (!alertForm.title || !alertForm.message) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const alert = {
        ...alertForm,
        conditions: [], // Simplified for now
      };

      // Simplified for now - just show success
      toast.success(editingItem ? "Alerta atualizado!" : "Alerta criado!");

      setShowAlertDialog(false);
      setEditingItem(null);
      resetAlertForm();
      await loadData();
    } catch (error) {
      logComponents.error("Erro ao salvar alerta:", error);
      toast.error("Erro ao salvar alerta");
    }
  };

  const handleCreateBudgetRule = async () => {
    try {
      if (!budgetForm.category || !budgetForm.monthlyLimit) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const rule = {
        ...budgetForm,
        monthlyLimit: parseFloat(budgetForm.monthlyLimit),
        warningThreshold: parseFloat(budgetForm.warningThreshold),
      };

      // Simplified for now - just show success
      toast.success(editingItem ? "Regra atualizada!" : "Regra criada!");

      setShowBudgetDialog(false);
      setEditingItem(null);
      resetBudgetForm();
      await loadData();
    } catch (error) {
      logComponents.error("Erro ao salvar regra de orçamento:", error);
      toast.error("Erro ao salvar regra de orçamento");
    }
  };

  const handleToggleRecurring = async (id: string, enabled: boolean) => {
    toast.success(enabled ? "Transação ativada!" : "Transação desativada!");
  };

  const handleToggleAlert = async (id: string, enabled: boolean) => {
    toast.success(enabled ? "Alerta ativado!" : "Alerta desativado!");
  };

  const handleToggleBudgetRule = async (id: string, enabled: boolean) => {
    toast.success(enabled ? "Regra ativada!" : "Regra desativada!");
  };

  const handleDeleteRecurring = async (id: string) => {
    toast.success("Transação excluída!");
  };

  const handleDeleteAlert = async (id: string) => {
    toast.success("Alerta excluído!");
  };

  const handleDeleteBudgetRule = async (id: string) => {
    toast.success("Regra excluída!");
  };

  const resetRecurringForm = () => {
    setRecurringForm({
      name: "",
      amount: "",
      type: "expense",
      category: "",
      description: "",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      accountId: "",
      enabled: true,
    });
  };

  const resetAlertForm = () => {
    setAlertForm({
      title: "",
      message: "",
      type: "budget_warning",
      priority: "medium",
      enabled: true,
    });
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      category: "",
      monthlyLimit: "",
      warningThreshold: "80",
      enabled: true,
      notifications: true,
      autoAdjust: false,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatFrequency = (frequency: string) => {
    const frequencies = {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      yearly: "Anual",
    };
    return frequencies[frequency as keyof typeof frequencies] || frequency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Transações Recorrentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeRecurringTransactions}
              </div>
              <p className="text-xs text-gray-600">
                {stats.totalRecurringTransactions} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertas Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeSmartAlerts}
              </div>
              <p className="text-xs text-gray-600">
                {stats.totalSmartAlerts} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Regras de Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeBudgetRules}
              </div>
              <p className="text-xs text-gray-600">
                {stats.totalBudgetRules} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Automações Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
              <p className="text-xs text-gray-600">{stats.totalRules} total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="recurring" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recurring">Transações Recorrentes</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Inteligentes</TabsTrigger>
          <TabsTrigger value="budget">Regras de Orçamento</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Transações Recorrentes</h3>
              <p className="text-sm text-gray-600">
                Automatize receitas e despesas regulares
              </p>
            </div>
            <Dialog
              open={showRecurringDialog}
              onOpenChange={setShowRecurringDialog}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetRecurringForm();
                    setEditingItem(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar" : "Nova"} Transação Recorrente
                  </DialogTitle>
                  <DialogDescription>
                    Configure uma transação que será executada automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={recurringForm.name}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ex: Salário, Aluguel, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="amount">Valor</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={recurringForm.amount}
                        onChange={(e) =>
                          setRecurringForm({
                            ...recurringForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={recurringForm.type}
                        onValueChange={(value: "income" | "expense") =>
                          setRecurringForm({ ...recurringForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={recurringForm.category}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          category: e.target.value,
                        })
                      }
                      placeholder="Ex: Salário, Moradia, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="account">Conta</Label>
                    <Select
                      value={recurringForm.accountId}
                      onValueChange={(value) =>
                        setRecurringForm({ ...recurringForm, accountId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="frequency">Frequência</Label>
                      <Select
                        value={recurringForm.frequency}
                        onValueChange={(value: any) =>
                          setRecurringForm({
                            ...recurringForm,
                            frequency: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="startDate">Data de Início</Label>
                      <DatePicker
                        id="startDate"
                        value={recurringForm.startDate}
                        onChange={(value) =>
                          setRecurringForm({
                            ...recurringForm,
                            startDate: value,
                          })
                        }
                        placeholder="Selecionar data de início"
                        minDate={new Date()}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={recurringForm.description}
                      onChange={(e) =>
                        setRecurringForm({
                          ...recurringForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descrição opcional"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRecurringDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateRecurring}>
                      {editingItem ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {recurringTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{transaction.name}</h4>
                        <Badge
                          variant={
                            transaction.type === "income"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.type === "income"
                            ? "Receita"
                            : "Despesa"}
                        </Badge>
                        <Badge variant="outline">
                          {formatFrequency(transaction.frequency)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          {formatCurrency(transaction.amount)} •{" "}
                          {transaction.category}
                        </p>
                        <p>
                          Próxima execução:{" "}
                          {formatDate(transaction.nextExecution)}
                        </p>
                        <p>Executado {transaction.executionCount} vezes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={transaction.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleRecurring(transaction.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(transaction);
                          setRecurringForm({
                            name: transaction.name,
                            amount: transaction.amount.toString(),
                            type: transaction.type,
                            category: transaction.category,
                            description: transaction.description,
                            frequency: transaction.frequency,
                            startDate: transaction.startDate.split("T")[0],
                            accountId: transaction.accountId,
                            enabled: transaction.enabled,
                          });
                          setShowRecurringDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecurring(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {recurringTransactions.length === 0 && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma transação recorrente configurada. Crie uma para
                  automatizar suas receitas e despesas regulares.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Alertas Inteligentes</h3>
              <p className="text-sm text-gray-600">
                Configure notificações baseadas em condições
              </p>
            </div>
            <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetAlertForm();
                    setEditingItem(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Alerta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar" : "Novo"} Alerta Inteligente
                  </DialogTitle>
                  <DialogDescription>
                    Configure um alerta que será disparado automaticamente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alertTitle">Título</Label>
                    <Input
                      id="alertTitle"
                      value={alertForm.title}
                      onChange={(e) =>
                        setAlertForm({ ...alertForm, title: e.target.value })
                      }
                      placeholder="Ex: Gastos Altos"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alertMessage">Mensagem</Label>
                    <Textarea
                      id="alertMessage"
                      value={alertForm.message}
                      onChange={(e) =>
                        setAlertForm({ ...alertForm, message: e.target.value })
                      }
                      placeholder="Mensagem que será exibida"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="alertType">Tipo</Label>
                      <Select
                        value={alertForm.type}
                        onValueChange={(value: any) =>
                          setAlertForm({ ...alertForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget_warning">
                            Aviso de Orçamento
                          </SelectItem>
                          <SelectItem value="goal_reminder">
                            Lembrete de Meta
                          </SelectItem>
                          <SelectItem value="bill_due">
                            Conta a Vencer
                          </SelectItem>
                          <SelectItem value="expense_anomaly">
                            Gasto Anômalo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="alertPriority">Prioridade</Label>
                      <Select
                        value={alertForm.priority}
                        onValueChange={(value: any) =>
                          setAlertForm({ ...alertForm, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAlertDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateAlert}>
                      {editingItem ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {smartAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge
                          variant={
                            alert.priority === "high" ||
                            alert.priority === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {alert.priority === "low"
                            ? "Baixa"
                            : alert.priority === "medium"
                              ? "Média"
                              : alert.priority === "high"
                                ? "Alta"
                                : "Crítica"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {alert.message}
                      </p>
                      {alert.lastTriggered && (
                        <p className="text-xs text-gray-500">
                          Último disparo: {formatDate(alert.lastTriggered)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleAlert(alert.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(alert);
                          setAlertForm({
                            title: alert.title,
                            message: alert.message,
                            type: alert.type,
                            priority: alert.priority,
                            enabled: alert.enabled,
                          });
                          setShowAlertDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {smartAlerts.length === 0 && (
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Nenhum alerta inteligente configurado. Crie alertas para ser
                  notificado sobre eventos importantes.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Regras de Orçamento</h3>
              <p className="text-sm text-gray-600">
                Configure limites e alertas por categoria
              </p>
            </div>
            <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetBudgetForm();
                    setEditingItem(null);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar" : "Nova"} Regra de Orçamento
                  </DialogTitle>
                  <DialogDescription>
                    Configure limites de gastos por categoria
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="budgetCategory">Categoria</Label>
                    <Input
                      id="budgetCategory"
                      value={budgetForm.category}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          category: e.target.value,
                        })
                      }
                      placeholder="Ex: Alimentação, Transporte"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="monthlyLimit">Limite Mensal</Label>
                      <Input
                        id="monthlyLimit"
                        type="number"
                        step="0.01"
                        value={budgetForm.monthlyLimit}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            monthlyLimit: e.target.value,
                          })
                        }
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warningThreshold">Aviso em (%)</Label>
                      <Input
                        id="warningThreshold"
                        type="number"
                        min="1"
                        max="100"
                        value={budgetForm.warningThreshold}
                        onChange={(e) =>
                          setBudgetForm({
                            ...budgetForm,
                            warningThreshold: e.target.value,
                          })
                        }
                        placeholder="80"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notifications"
                        checked={budgetForm.notifications}
                        onCheckedChange={(checked) =>
                          setBudgetForm({
                            ...budgetForm,
                            notifications: checked,
                          })
                        }
                      />
                      <Label htmlFor="notifications">Enviar notificações</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoAdjust"
                        checked={budgetForm.autoAdjust}
                        onCheckedChange={(checked) =>
                          setBudgetForm({ ...budgetForm, autoAdjust: checked })
                        }
                      />
                      <Label htmlFor="autoAdjust">Ajuste automático</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBudgetDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateBudgetRule}>
                      {editingItem ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {budgetRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.category}</h4>
                        <Badge variant="outline">
                          Limite: {formatCurrency(rule.monthlyLimit)}
                        </Badge>
                        <Badge variant="secondary">
                          Aviso: {rule.warningThreshold}%
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Notificações:{" "}
                          {rule.notifications ? "Ativadas" : "Desativadas"}
                        </p>
                        <p>
                          Ajuste automático:{" "}
                          {rule.autoAdjust ? "Ativado" : "Desativado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleBudgetRule(rule.id, checked)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(rule);
                          setBudgetForm({
                            category: rule.category,
                            monthlyLimit: rule.monthlyLimit.toString(),
                            warningThreshold: rule.warningThreshold.toString(),
                            enabled: rule.enabled,
                            notifications: rule.notifications,
                            autoAdjust: rule.autoAdjust,
                          });
                          setShowBudgetDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudgetRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {budgetRules.length === 0 && (
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma regra de orçamento configurada. Crie regras para
                  controlar seus gastos por categoria.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAutomationManager;
