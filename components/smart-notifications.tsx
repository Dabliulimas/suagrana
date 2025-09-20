"use client";

import { useState, useEffect } from "react";
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
import { Label } from "./ui/label";
import {
  Bell,
  BellRing,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Target,
  DollarSign,
  Calendar,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useTransactions, useGoals, useAccounts as useAccountsQuery } from "../contexts/unified-context";
import type { Notification, RecurringBill, BudgetLimit } from "../types";

interface SmartNotificationsProps {
  onUpdate?: () => void;
}

export function SmartNotifications({ onUpdate }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    billReminders: true,
    budgetAlerts: true,
    goalMilestones: true,
    investmentOpportunities: true,
    cashbackAlerts: true,
    unusualSpending: true,
    weeklyReports: true,
    monthlyReports: true,
  });
  const [filter, setFilter] = useState<"all" | "unread" | "high" | "critical">(
    "all",
  );

  // Use hooks to get real data
  const { data: transactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { data: accounts = [] } = useAccountsQuery();

  useEffect(() => {
    loadNotifications();
    generateSmartNotifications();
  }, []);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const loadNotifications = () => {
    console.log("loadNotifications foi removida - localStorage não é mais usado");
    setNotifications([]);
    // Configurações padrão sem localStorage
    setSettings({
      billReminders: true,
      budgetAlerts: true,
      goalMilestones: true,
      investmentOpportunities: true,
      cashbackAlerts: true,
      unusualSpending: true,
      weeklyReports: true,
      monthlyReports: true,
    });
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const saveNotifications = (newNotifications: Notification[]) => {
    console.log("saveNotifications foi removida - localStorage não é mais usado");
    setNotifications(newNotifications);
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const saveSettings = (newSettings: typeof settings) => {
    console.log("saveSettings foi removida - localStorage não é mais usado");
    setSettings(newSettings);
  };

  const generateSmartNotifications = () => {
    const newNotifications: Notification[] = [];

    // Check for upcoming bills
    if (settings.billReminders) {
      // DEPRECADO: localStorage não é mais usado - dados ficam no banco
      console.log("generateSmartNotifications: recurringBills removido do localStorage");
      const recurringBills: RecurringBill[] = [];
      if (typeof window === "undefined") return;
      const upcomingBills = recurringBills.filter((bill) => {
        const dueDate = new Date(bill.nextDueDate);
        const today = new Date();
        const daysDiff = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
        );
        return bill.isActive && daysDiff <= 3 && daysDiff >= 0;
      });

      upcomingBills.forEach((bill) => {
        const dueDate = new Date(bill.nextDueDate);
        const today = new Date();
        const daysDiff = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
        );

        newNotifications.push({
          id: `bill-${bill.id}`,
          type: "bill_due",
          title: `Conta vencendo ${daysDiff === 0 ? "hoje" : `em ${daysDiff} dia${daysDiff > 1 ? "s" : ""}`}`,
          message: `${bill.name} - R$ ${bill.amount.toFixed(2)}`,
          priority:
            daysDiff === 0 ? "critical" : daysDiff === 1 ? "high" : "medium",
          isRead: false,
          actionUrl: "/recurring-bills",
          actionLabel: "Ver Conta",
          createdAt: new Date().toISOString(),
        });
      });
    }

    // Check budget alerts
    if (settings.budgetAlerts) {
      // DEPRECADO: localStorage não é mais usado - dados ficam no banco
      console.log("generateSmartNotifications: budgetLimits removido do localStorage");
      const budgetLimits: BudgetLimit[] = [];
      if (typeof window === "undefined") return;
      const currentMonth = new Date().toISOString().slice(0, 7);

      budgetLimits.forEach((limit) => {
        if (!limit.isActive) return;

        const monthlySpending = transactions
          .filter((t) => {
            const transactionMonth = t.date.slice(0, 7);
            return (
              transactionMonth === currentMonth &&
              t.type === "expense" &&
              (limit.categoryId ? t.category === limit.categoryId : true)
            );
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const percentage = (monthlySpending / limit.monthlyLimit) * 100;

        if (percentage >= limit.alertThreshold) {
          const priority =
            percentage >= 100
              ? "critical"
              : percentage >= 90
                ? "high"
                : "medium";

          newNotifications.push({
            id: `budget-${limit.id}`,
            type: "budget_alert",
            title:
              percentage >= 100
                ? "Orçamento excedido!"
                : "Limite de orçamento atingido",
            message: `${percentage.toFixed(1)}% do orçamento usado (R$ ${monthlySpending.toFixed(2)} de R$ ${limit.monthlyLimit.toFixed(2)})`,
            priority,
            isRead: false,
            actionUrl: "/budgets",
            actionLabel: "Ver Orçamento",
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    // Check for goal milestones
    if (settings.goalMilestones) {
      goals.forEach((goal) => {
        const current =
          (goal as any).currentAmount ?? (goal as any).current ?? 0;
        const target = (goal as any).targetAmount ?? (goal as any).target ?? 0;
        const progress = target > 0 ? (current / target) * 100 : 0;
        const milestones = [25, 50, 75, 90, 100];

        milestones.forEach((milestone) => {
          if (progress >= milestone && progress < milestone + 5) {
            newNotifications.push({
              id: `goal-${goal.id}-${milestone}`,
              type: "goal_milestone",
              title:
                milestone === 100
                  ? "Meta alcançada! 🎉"
                  : `${milestone}% da meta atingida!`,
              message: `${goal.name}: R$ ${current.toFixed(2)} de R$ ${target.toFixed(2)}`,
              priority: milestone === 100 ? "high" : "medium",
              isRead: false,
              actionUrl: "/goals",
              actionLabel: "Ver Meta",
              createdAt: new Date().toISOString(),
            });
          }
        });
      });
    }

    // Check for unusual spending patterns
    if (settings.unusualSpending) {
      const last30Days = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo && t.type === "expense";
      });

      const categorySpending = last30Days.reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      // Compare with previous 30 days
      const previous30Days = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const sixtyDaysAgo = new Date();
        const thirtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return (
          transactionDate >= sixtyDaysAgo &&
          transactionDate < thirtyDaysAgo &&
          t.type === "expense"
        );
      });

      const previousCategorySpending = previous30Days.reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      Object.entries(categorySpending).forEach(([category, current]) => {
        const previous = previousCategorySpending[category] || 0;
        if (previous > 0) {
          const increase = ((current - previous) / previous) * 100;

          if (increase > 50) {
            // 50% increase
            newNotifications.push({
              id: `unusual-${category}`,
              type: "budget_alert",
              title: "Gasto incomum detectado",
              message: `Gastos em ${category} aumentaram ${increase.toFixed(1)}% nos últimos 30 dias`,
              priority: "medium",
              isRead: false,
              actionUrl: "/reports",
              actionLabel: "Ver Análise",
              createdAt: new Date().toISOString(),
            });
          }
        }
      });
    }

    // Check for investment opportunities
    if (settings.investmentOpportunities) {
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      const savingsAccounts = accounts.filter((acc) => acc.type === "savings");
      const savingsBalance = savingsAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0,
      );

      if (totalBalance > 10000 && savingsBalance / totalBalance < 0.2) {
        newNotifications.push({
          id: "investment-opportunity",
          type: "investment_opportunity",
          title: "Oportunidade de investimento",
          message: "Você tem saldo disponível que poderia estar rendendo mais",
          priority: "low",
          isRead: false,
          actionUrl: "/investments",
          actionLabel: "Ver Investimentos",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Remove duplicates and save
    const existingIds = notifications.map((n) => n.id);
    const uniqueNewNotifications = newNotifications.filter(
      (n) => !existingIds.includes(n.id),
    );

    if (uniqueNewNotifications.length > 0) {
      const updatedNotifications = [...notifications, ...uniqueNewNotifications]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 50); // Keep only last 50 notifications

      saveNotifications(updatedNotifications);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );
    saveNotifications(updatedNotifications);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      isRead: true,
    }));
    saveNotifications(updatedNotifications);
    toast.success("Todas as notificações marcadas como lidas");
  };

  const handleDeleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(
      (n) => n.id !== notificationId,
    );
    saveNotifications(updatedNotifications);
    toast.success("Notificação removida");
  };

  const handleClearAll = () => {
    saveNotifications([]);
    toast.success("Todas as notificações removidas");
  };

  const handleSettingChange = (
    setting: keyof typeof settings,
    value: boolean,
  ) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success("Configuração atualizada");
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case "unread":
        filtered = filtered.filter((n) => !n.isRead);
        break;
      case "high":
        filtered = filtered.filter((n) => n.priority === "high");
        break;
      case "critical":
        filtered = filtered.filter((n) => n.priority === "critical");
        break;
    }

    return filtered;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <Bell className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bill_due":
        return <Calendar className="w-4 h-4" />;
      case "budget_alert":
        return <DollarSign className="w-4 h-4" />;
      case "goal_milestone":
        return <Target className="w-4 h-4" />;
      case "investment_opportunity":
        return <TrendingUp className="w-4 h-4" />;
      case "cashback_available":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            Notificações Inteligentes
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            Alertas automáticos e insights sobre suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar Todas como Lidas
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Todas
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Não Lidas ({unreadCount})
        </Button>
        <Button
          variant={filter === "high" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("high")}
        >
          Alta Prioridade
        </Button>
        <Button
          variant={filter === "critical" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("critical")}
        >
          Críticas
        </Button>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="billReminders">Lembretes de Contas</Label>
              <Switch
                id="billReminders"
                checked={settings.billReminders}
                onCheckedChange={(checked) =>
                  handleSettingChange("billReminders", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="budgetAlerts">Alertas de Orçamento</Label>
              <Switch
                id="budgetAlerts"
                checked={settings.budgetAlerts}
                onCheckedChange={(checked) =>
                  handleSettingChange("budgetAlerts", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="goalMilestones">Marcos de Metas</Label>
              <Switch
                id="goalMilestones"
                checked={settings.goalMilestones}
                onCheckedChange={(checked) =>
                  handleSettingChange("goalMilestones", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="investmentOpportunities">
                Oportunidades de Investimento
              </Label>
              <Switch
                id="investmentOpportunities"
                checked={settings.investmentOpportunities}
                onCheckedChange={(checked) =>
                  handleSettingChange("investmentOpportunities", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="unusualSpending">Gastos Incomuns</Label>
              <Switch
                id="unusualSpending"
                checked={settings.unusualSpending}
                onCheckedChange={(checked) =>
                  handleSettingChange("unusualSpending", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weeklyReports">Relatórios Semanais</Label>
              <Switch
                id="weeklyReports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) =>
                  handleSettingChange("weeklyReports", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                {filter === "all"
                  ? "Nenhuma notificação"
                  : `Nenhuma notificação ${filter === "unread" ? "não lida" : filter}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${!notification.isRead ? "border-blue-200 bg-blue-50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(notification.priority)}
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${!notification.isRead ? "text-blue-900" : ""}`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p
                        className={`text-sm ${!notification.isRead ? "text-blue-700" : "text-gray-600"}`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.actionUrl && (
                      <Button size="sm" variant="outline">
                        {notification.actionLabel || "Ver"}
                      </Button>
                    )}
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
