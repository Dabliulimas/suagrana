"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Bell,
  TrendingUp,
  Target,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Zap,
  Brain,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { pushNotificationService } from "../lib/push-notification-service";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

interface NotificationRule {
  id: string;
  type:
    | "bill_reminder"
    | "goal_milestone"
    | "investment_alert"
    | "budget_warning"
    | "income_received"
    | "expense_spike";
  name: string;
  enabled: boolean;
  conditions: {
    amount?: number;
    percentage?: number;
    days?: number;
    category?: string;
    comparison?: "greater" | "less" | "equal";
  };
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    time: string;
    days?: number[];
  };
  message: {
    title: string;
    body: string;
  };
}

interface FinancialAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  read: boolean;
  data?: any;
}

export function IntelligentFinancialNotifications() {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    type: "bill_reminder",
    enabled: true,
    conditions: {},
    schedule: {
      frequency: "daily",
      time: "09:00",
    },
    message: {
      title: "",
      body: "",
    },
  });

  useEffect(() => {
    loadNotificationRules();
    loadFinancialAlerts();
    setupIntelligentMonitoring();
  }, []);

  const loadNotificationRules = () => {
    try {
      const saved = localStorage.getItem("financial-notification-rules");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (saved) {
        setRules(JSON.parse(saved));
      } else {
        // Set default rules
        const defaultRules: NotificationRule[] = [
          {
            id: "bill-reminder-default",
            type: "bill_reminder",
            name: "Lembrete de Contas",
            enabled: true,
            conditions: { days: 3 },
            schedule: { frequency: "daily", time: "09:00" },
            message: {
              title: "💳 Conta a Vencer",
              body: "Você tem contas vencendo em {days} dias",
            },
          },
          {
            id: "goal-milestone-default",
            type: "goal_milestone",
            name: "Marcos de Metas",
            enabled: true,
            conditions: { percentage: 25 },
            schedule: { frequency: "weekly", time: "10:00" },
            message: {
              title: "🎯 Meta Alcançada!",
              body: "Parabéns! Você atingiu {percentage}% da sua meta",
            },
          },
          {
            id: "budget-warning-default",
            type: "budget_warning",
            name: "Alerta de Orçamento",
            enabled: true,
            conditions: { percentage: 80 },
            schedule: { frequency: "daily", time: "18:00" },
            message: {
              title: "⚠️ Orçamento Excedendo",
              body: "Você já gastou {percentage}% do seu orçamento mensal",
            },
          },
        ];
        setRules(defaultRules);
        localStorage.setItem(
          "financial-notification-rules",
          JSON.stringify(defaultRules),
        );
      }
    } catch (error) {
      logComponents.error("Failed to load notification rules:", error);
    }
  };

  const loadFinancialAlerts = () => {
    try {
      const saved = localStorage.getItem("financial-alerts");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (saved) {
        const parsedAlerts = JSON.parse(saved).map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
        }));
        setAlerts(parsedAlerts);
      }
    } catch (error) {
      logComponents.error("Failed to load financial alerts:", error);
    }
  };

  const saveNotificationRules = (newRules: NotificationRule[]) => {
    try {
      localStorage.setItem(
        "financial-notification-rules",
        JSON.stringify(newRules),
      );
      setRules(newRules);
    } catch (error) {
      logComponents.error("Failed to save notification rules:", error);
    }
  };

  const setupIntelligentMonitoring = () => {
    // Monitor financial data changes and trigger intelligent notifications
    const checkFinancialConditions = () => {
      const transactions = transactions;
      const goals = goals;
      const budgets = storage.getBudgets();

      rules.forEach((rule) => {
        if (!rule.enabled) return;

        switch (rule.type) {
          case "budget_warning":
            checkBudgetWarnings(rule, transactions, budgets);
            break;
          case "goal_milestone":
            checkGoalMilestones(rule, goals);
            break;
          case "expense_spike":
            checkExpenseSpikes(rule, transactions);
            break;
        }
      });
    };

    // Check conditions every hour
    const interval = setInterval(checkFinancialConditions, 60 * 60 * 1000);

    // Initial check
    checkFinancialConditions();

    return () => clearInterval(interval);
  };

  const checkBudgetWarnings = (
    rule: NotificationRule,
    transactions: any[],
    budgets: any[],
  ) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyExpenses = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          t.type === "expense"
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    budgets.forEach((budget) => {
      const percentage = (monthlyExpenses / budget.amount) * 100;

      if (percentage >= (rule.conditions.percentage || 80)) {
        createFinancialAlert({
          type: "budget_warning",
          title: rule.message.title,
          message: rule.message.body.replace(
            "{percentage}",
            percentage.toFixed(0),
          ),
          severity:
            percentage >= 100
              ? "critical"
              : percentage >= 90
                ? "high"
                : "medium",
          data: { budget, percentage, expenses: monthlyExpenses },
        });
      }
    });
  };

  const checkGoalMilestones = (rule: NotificationRule, goals: any[]) => {
    goals.forEach((goal) => {
      const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
      const milestones = [25, 50, 75, 90, 100];

      milestones.forEach((milestone) => {
        if (
          progress >= milestone &&
          !goal.notifiedMilestones?.includes(milestone)
        ) {
          createFinancialAlert({
            type: "goal_milestone",
            title: rule.message.title,
            message: rule.message.body.replace(
              "{percentage}",
              milestone.toString(),
            ),
            severity: milestone === 100 ? "high" : "medium",
            data: { goal, milestone, progress },
          });

          // Mark milestone as notified
          goal.notifiedMilestones = goal.notifiedMilestones || [];
          goal.notifiedMilestones.push(milestone);
          storage.updateGoal(goal.id, goal);
        }
      });
    });
  };

  const checkExpenseSpikes = (rule: NotificationRule, transactions: any[]) => {
    const last7Days = transactions
      .filter((t) => {
        const date = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo && t.type === "expense";
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previous7Days = transactions
      .filter((t) => {
        const date = new Date(t.date);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= twoWeeksAgo && date < weekAgo && t.type === "expense";
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (previous7Days > 0) {
      const increase = ((last7Days - previous7Days) / previous7Days) * 100;

      if (increase >= (rule.conditions.percentage || 50)) {
        createFinancialAlert({
          type: "expense_spike",
          title: "📈 Aumento nos Gastos",
          message: `Seus gastos aumentaram ${increase.toFixed(0)}% esta semana`,
          severity: increase >= 100 ? "high" : "medium",
          data: { increase, current: last7Days, previous: previous7Days },
        });
      }
    }
  };

  const createFinancialAlert = (
    alertData: Omit<FinancialAlert, "id" | "timestamp" | "read">,
  ) => {
    const alert: FinancialAlert = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...alertData,
    };

    const updatedAlerts = [alert, ...alerts].slice(0, 50); // Keep only last 50 alerts
    setAlerts(updatedAlerts);

    try {
      localStorage.setItem("financial-alerts", JSON.stringify(updatedAlerts));
    } catch (error) {
      logComponents.error("Failed to save financial alert:", error);
    }

    // Send push notification
    if ("Notification" in window && Notification.permission === "granted") {
      pushNotificationService.showNotification({
        title: alert.title,
        body: alert.message,
        icon: "/icon-192.png",
        tag: `financial-alert-${alert.id}`,
        data: { type: alert.type, alertId: alert.id },
      });
    }
  };

  const createRule = () => {
    if (!newRule.name || !newRule.message?.title || !newRule.message?.body) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const rule: NotificationRule = {
      id: Date.now().toString(),
      name: newRule.name!,
      type: newRule.type!,
      enabled: newRule.enabled!,
      conditions: newRule.conditions!,
      schedule: newRule.schedule!,
      message: newRule.message!,
    };

    const updatedRules = [...rules, rule];
    saveNotificationRules(updatedRules);
    setShowCreateRule(false);
    setNewRule({
      type: "bill_reminder",
      enabled: true,
      conditions: {},
      schedule: { frequency: "daily", time: "09:00" },
      message: { title: "", body: "" },
    });
    toast.success("Regra de notificação criada!");
  };

  const toggleRule = (ruleId: string, enabled: boolean) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled } : rule,
    );
    saveNotificationRules(updatedRules);
    toast.success(`Regra ${enabled ? "ativada" : "desativada"}!`);
  };

  const deleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    saveNotificationRules(updatedRules);
    toast.success("Regra removida!");
  };

  const markAlertAsRead = (alertId: string) => {
    const updatedAlerts = alerts.map((alert) =>
      alert.id === alertId ? { ...alert, read: true } : alert,
    );
    setAlerts(updatedAlerts);
    localStorage.setItem("financial-alerts", JSON.stringify(updatedAlerts));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bill_reminder":
        return CreditCard;
      case "goal_milestone":
        return Target;
      case "investment_alert":
        return TrendingUp;
      case "budget_warning":
        return AlertTriangle;
      case "expense_spike":
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bill_reminder":
        return "Lembrete de Conta";
      case "goal_milestone":
        return "Marco de Meta";
      case "investment_alert":
        return "Alerta de Investimento";
      case "budget_warning":
        return "Aviso de Orçamento";
      case "expense_spike":
        return "Pico de Gastos";
      case "income_received":
        return "Receita Recebida";
      default:
        return "Notificação";
    }
  };

  const unreadAlertsCount = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Regras Ativas</span>
            </div>
            <p className="text-2xl font-bold">
              {rules.filter((r) => r.enabled).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600">Alertas Não Lidos</span>
            </div>
            <p className="text-2xl font-bold">{unreadAlertsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">IA Ativa</span>
            </div>
            <p className="text-2xl font-bold">✓</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Push Ativo</span>
            </div>
            <p className="text-2xl font-bold">
              {Notification.permission === "granted" ? "✓" : "✗"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Regras de Notificação</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alertas Financeiros
            {unreadAlertsCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 text-xs">
                {unreadAlertsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Regras de Notificação Inteligente
            </h3>
            <Button onClick={() => setShowCreateRule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => {
              const TypeIcon = getTypeIcon(rule.type);
              return (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-5 w-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-base">
                            {rule.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {getTypeLabel(rule.type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(enabled) =>
                            toggleRule(rule.id, enabled)
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rule.schedule.frequency} às {rule.schedule.time}
                        </span>
                        {rule.conditions.percentage && (
                          <span>{rule.conditions.percentage}%</span>
                        )}
                        {rule.conditions.days && (
                          <span>{rule.conditions.days} dias</span>
                        )}
                        {rule.conditions.amount && (
                          <span>R$ {rule.conditions.amount}</span>
                        )}
                      </div>
                      <div className="p-2 bg-gray-50 rounded text-sm">
                        <strong>{rule.message.title}</strong>
                        <br />
                        {rule.message.body}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create Rule Dialog */}
          {showCreateRule && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Nova Regra de Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      value={newRule.name || ""}
                      onChange={(e) =>
                        setNewRule({ ...newRule, name: e.target.value })
                      }
                      placeholder="Ex: Alerta de Meta 50%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-type">Tipo</Label>
                    <Select
                      value={newRule.type}
                      onValueChange={(value: any) =>
                        setNewRule({ ...newRule, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bill_reminder">
                          Lembrete de Conta
                        </SelectItem>
                        <SelectItem value="goal_milestone">
                          Marco de Meta
                        </SelectItem>
                        <SelectItem value="investment_alert">
                          Alerta de Investimento
                        </SelectItem>
                        <SelectItem value="budget_warning">
                          Aviso de Orçamento
                        </SelectItem>
                        <SelectItem value="expense_spike">
                          Pico de Gastos
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-frequency">Frequência</Label>
                    <Select
                      value={newRule.schedule?.frequency}
                      onValueChange={(value: any) =>
                        setNewRule({
                          ...newRule,
                          schedule: { ...newRule.schedule!, frequency: value },
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-time">Horário</Label>
                    <Input
                      id="rule-time"
                      type="time"
                      value={newRule.schedule?.time || "09:00"}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          schedule: {
                            ...newRule.schedule!,
                            time: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-percentage">Porcentagem (%)</Label>
                    <Input
                      id="rule-percentage"
                      type="number"
                      value={newRule.conditions?.percentage || ""}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          conditions: {
                            ...newRule.conditions!,
                            percentage: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      placeholder="Ex: 80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-title">Título da Notificação</Label>
                  <Input
                    id="rule-title"
                    value={newRule.message?.title || ""}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        message: { ...newRule.message!, title: e.target.value },
                      })
                    }
                    placeholder="Ex: 🎯 Meta Alcançada!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule-body">Mensagem</Label>
                  <Input
                    id="rule-body"
                    value={newRule.message?.body || ""}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        message: { ...newRule.message!, body: e.target.value },
                      })
                    }
                    placeholder="Ex: Parabéns! Você atingiu {percentage}% da sua meta"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createRule}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Criar Regra
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateRule(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Alertas Financeiros Recentes
            </h3>
            <Badge variant="outline">{alerts.length} alertas</Badge>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Nenhum alerta financeiro ainda
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Os alertas aparecerão aqui quando as condições forem
                    atendidas
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => {
                const TypeIcon = getTypeIcon(alert.type);
                return (
                  <Card
                    key={alert.id}
                    className={`cursor-pointer transition-all ${
                      alert.read ? "opacity-60" : "border-l-4 border-l-blue-500"
                    }`}
                    onClick={() => !alert.read && markAlertAsRead(alert.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <TypeIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getSeverityColor(alert.severity)}
                              >
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {alert.timestamp.toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {alert.message}
                          </p>
                          {alert.data && (
                            <div className="mt-2 text-xs text-gray-500">
                              {JSON.stringify(alert.data, null, 2).slice(
                                0,
                                100,
                              )}
                              ...
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
