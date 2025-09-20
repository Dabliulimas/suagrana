"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useRouter } from "next/navigation";

export interface FinancialNotification {
  id: string;
  type: "success" | "warning" | "info" | "error" | "achievement";
  category:
    | "transaction"
    | "goal"
    | "budget"
    | "investment"
    | "reminder"
    | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  action?: {
    label: string;
    href?: string;
    callback?: () => void;
  };
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  priority: "low" | "medium" | "high" | "urgent";
}

interface NotificationSystemProps {
  className?: string;
  maxVisible?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const getNotificationIcon = (type: FinancialNotification["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-600" />;
    case "achievement":
      return <Target className="h-4 w-4 text-purple-600" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getCategoryIcon = (category: FinancialNotification["category"]) => {
  switch (category) {
    case "transaction":
      return <DollarSign className="h-3 w-3" />;
    case "goal":
      return <Target className="h-3 w-3" />;
    case "budget":
      return <TrendingUp className="h-3 w-3" />;
    case "investment":
      return <TrendingUp className="h-3 w-3" />;
    case "reminder":
      return <Calendar className="h-3 w-3" />;
    case "system":
      return <Settings className="h-3 w-3" />;
    default:
      return <Info className="h-3 w-3" />;
  }
};

const getNotificationStyle = (type: FinancialNotification["type"]) => {
  switch (type) {
    case "success":
      return "border-l-4 border-l-green-500 bg-green-50";
    case "warning":
      return "border-l-4 border-l-yellow-500 bg-yellow-50";
    case "error":
      return "border-l-4 border-l-red-500 bg-red-50";
    case "info":
      return "border-l-4 border-l-blue-500 bg-blue-50";
    case "achievement":
      return "border-l-4 border-l-purple-500 bg-purple-50";
    default:
      return "border-l-4 border-l-gray-500 bg-gray-50";
  }
};

const getPriorityBadge = (priority: FinancialNotification["priority"]) => {
  switch (priority) {
    case "urgent":
      return (
        <Badge variant="destructive" className="text-xs">
          Urgente
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-orange-100 text-orange-800"
        >
          Alta
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="text-xs">
          Média
        </Badge>
      );
    case "low":
      return (
        <Badge variant="outline" className="text-xs text-gray-600">
          Baixa
        </Badge>
      );
    default:
      return null;
  }
};

class NotificationManager {
  private notifications: FinancialNotification[] = [];
  private listeners: ((notifications: FinancialNotification[]) => void)[] = [];
  private nextId = 1;

  subscribe(listener: (notifications: FinancialNotification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.notifications]));
  }

  add(notification: Omit<FinancialNotification, "id" | "timestamp" | "read">) {
    const newNotification: FinancialNotification = {
      ...notification,
      id: `notification-${this.nextId++}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(newNotification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notify();

    // Auto-hide if specified
    if (newNotification.autoHide) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.hideAfter || 5000);
    }

    return newNotification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      this.notify();
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getNotifications(): FinancialNotification[] {
    return [...this.notifications];
  }

  // Predefined notification types
  notifyTransactionAdded(amount: number, type: "income" | "expense") {
    this.add({
      type: "success",
      category: "transaction",
      title: "Transação Adicionada",
      message: `${type === "income" ? "Receita" : "Despesa"} de R$ ${amount.toFixed(2)} foi registrada com sucesso.`,
      priority: "low",
      autoHide: true,
      hideAfter: 3000,
    });
  }

  notifyTransactionDeleted() {
    this.add({
      type: "info",
      category: "transaction",
      title: "Transação Removida",
      message: "A transação foi removida com sucesso.",
      priority: "low",
      autoHide: true,
      hideAfter: 3000,
    });
  }

  notifyGoalAchieved(goalName: string) {
    this.add({
      type: "achievement",
      category: "goal",
      title: "🎉 Meta Alcançada!",
      message: `Parabéns! Você alcançou sua meta: ${goalName}`,
      priority: "high",
      actionable: true,
      action: {
        label: "Ver Metas",
        href: "/goals",
      },
    });
  }

  notifyBudgetExceeded(category: string, amount: number, limit: number) {
    this.add({
      type: "warning",
      category: "budget",
      title: "Orçamento Excedido",
      message: `Você gastou R$ ${amount.toFixed(2)} em ${category}, ultrapassando o limite de R$ ${limit.toFixed(2)}.`,
      priority: "high",
      actionable: true,
      action: {
        label: "Revisar Orçamento",
        href: "/budget",
      },
    });
  }

  notifyInvestmentGain(amount: number, percentage: number) {
    this.add({
      type: "success",
      category: "investment",
      title: "Ganho nos Investimentos",
      message: `Seus investimentos tiveram um ganho de R$ ${amount.toFixed(2)} (${percentage.toFixed(2)}%).`,
      priority: "medium",
      actionable: true,
      action: {
        label: "Ver Portfolio",
        href: "/investments",
      },
    });
  }

  notifyBillReminder(billName: string, amount: number, dueDate: string) {
    this.add({
      type: "warning",
      category: "reminder",
      title: "Lembrete de Conta",
      message: `A conta "${billName}" de R$ ${amount.toFixed(2)} vence em ${dueDate}.`,
      priority: "high",
      actionable: true,
      action: {
        label: "Ver Contas",
        href: "/bills-reminders",
      },
    });
  }

  notifySystemUpdate(version: string) {
    this.add({
      type: "info",
      category: "system",
      title: "Sistema Atualizado",
      message: `O sistema foi atualizado para a versão ${version}. Confira as novidades!`,
      priority: "low",
      actionable: true,
      action: {
        label: "Ver Novidades",
        href: "/settings/about",
      },
    });
  }
}

export const notificationManager = new NotificationManager();

export function FinancialNotificationSystem({
  className,
  maxVisible = 5,
  position = "top-right",
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<FinancialNotification[]>(
    [],
  );
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleNotificationAction = useCallback(
    (notification: FinancialNotification) => {
      if (notification.action?.href) {
        router.push(notification.action.href);
      } else if (notification.action?.callback) {
        notification.action.callback();
      }
      notificationManager.markAsRead(notification.id);
    },
    [router],
  );

  const handleDismiss = useCallback((id: string) => {
    notificationManager.remove(id);
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    notificationManager.markAsRead(id);
  }, []);

  const visibleNotifications = notifications
    .filter((n) => !n.read || n.priority === "urgent")
    .slice(0, maxVisible);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  if (!isVisible || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 max-w-sm space-y-2",
        positionClasses[position],
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">Notificações</span>
          {notifications.filter((n) => !n.read).length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notifications.filter((n) => !n.read).length}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          {isVisible ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      </div>

      <ScrollArea className="max-h-96">
        <div className="space-y-2">
          {visibleNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-all duration-300 hover:shadow-md cursor-pointer",
                getNotificationStyle(notification.type),
                !notification.read && "ring-2 ring-primary/20",
              )}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(notification.category)}
                          {getPriorityBadge(notification.priority)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        {notification.actionable && notification.action && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationAction(notification);
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {notifications.length > maxVisible && (
        <Card className="bg-muted/50">
          <CardContent className="p-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/notifications")}
            >
              Ver todas as {notifications.length} notificações
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for easy notification usage
export function useNotifications() {
  const [notifications, setNotifications] = useState<FinancialNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n) => !n.read).length);
    });
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    add: notificationManager.add.bind(notificationManager),
    remove: notificationManager.remove.bind(notificationManager),
    markAsRead: notificationManager.markAsRead.bind(notificationManager),
    markAllAsRead: notificationManager.markAllAsRead.bind(notificationManager),
    clear: notificationManager.clear.bind(notificationManager),
    // Convenience methods
    notifyTransactionAdded:
      notificationManager.notifyTransactionAdded.bind(notificationManager),
    notifyTransactionDeleted:
      notificationManager.notifyTransactionDeleted.bind(notificationManager),
    notifyGoalAchieved:
      notificationManager.notifyGoalAchieved.bind(notificationManager),
    notifyBudgetExceeded:
      notificationManager.notifyBudgetExceeded.bind(notificationManager),
    notifyInvestmentGain:
      notificationManager.notifyInvestmentGain.bind(notificationManager),
    notifyBillReminder:
      notificationManager.notifyBillReminder.bind(notificationManager),
    notifySystemUpdate:
      notificationManager.notifySystemUpdate.bind(notificationManager),
  };
}
