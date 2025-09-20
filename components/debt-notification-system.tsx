"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  Calendar,
  DollarSign,
  X,
  CheckCircle,
  Info,
} from "lucide-react";
import { useDebtAnalysis } from "../hooks/use-debt-analysis";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";

interface DebtNotification {
  id: string;
  type: "alert" | "warning" | "info" | "success";
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  category: "overdue" | "cash_flow" | "interest" | "opportunity" | "reminder";
  debtId?: string;
  actionable: boolean;
  dismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface DebtNotificationSystemProps {
  className?: string;
}

const notificationIcons = {
  alert: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const notificationColors = {
  alert: "border-red-200 bg-red-50",
  warning: "border-yellow-200 bg-yellow-50",
  info: "border-blue-200 bg-blue-50",
  success: "border-green-200 bg-green-50",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export function DebtNotificationSystem({
  className,
}: DebtNotificationSystemProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [notifications, setNotifications] = useState<DebtNotification[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);
  const { analysis, alerts, suggestions } = useDebtAnalysis();

  // Load notifications from storage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = storage.getItem("debt-notifications");
        if (stored) {
          const parsedNotifications = JSON.parse(stored) as DebtNotification[];
          // Filter out expired notifications
          const validNotifications = parsedNotifications.filter(
            (notification) => {
              if (!notification.expiresAt) return true;
              return new Date(notification.expiresAt) > new Date();
            },
          );
          setNotifications(validNotifications);
        }
      } catch (error) {
        logComponents.error("Error loading notifications:", error);
      }
    };

    loadNotifications();
  }, []);

  // Generate notifications from debt analysis
  useEffect(() => {
    if (!analysis || !alerts) return;

    const newNotifications: DebtNotification[] = [];

    // Convert alerts to notifications
    alerts.forEach((alert) => {
      const notification: DebtNotification = {
        id: `alert-${alert.type}-${Date.now()}-${Math.random()}`,
        type:
          alert.severity === "high"
            ? "alert"
            : alert.severity === "medium"
              ? "warning"
              : "info",
        title: getAlertTitle(alert.type),
        message: alert.message,
        priority: alert.severity,
        category: getAlertCategory(alert.type),
        debtId: alert.debtId,
        actionable: true,
        dismissed: false,
        createdAt: new Date().toISOString(),
        expiresAt: getExpirationDate(alert.type),
      };
      newNotifications.push(notification);
    });

    // Convert suggestions to notifications
    suggestions.forEach((suggestion) => {
      const notification: DebtNotification = {
        id: `suggestion-${suggestion.type}-${Date.now()}-${Math.random()}`,
        type: "info",
        title: getSuggestionTitle(suggestion.type),
        message: suggestion.description,
        priority: suggestion.priority,
        category: "opportunity",
        debtId: suggestion.debtId,
        actionable: true,
        dismissed: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      newNotifications.push(notification);
    });

    // Merge with existing notifications (avoid duplicates)
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const uniqueNew = newNotifications.filter((n) => !existingIds.has(n.id));
      const updated = [...prev, ...uniqueNew];

      // Save to storage
      try {
        storage.setItem("debt-notifications", JSON.stringify(updated));
      } catch (error) {
        logComponents.error("Error saving notifications:", error);
      }

      return updated;
    });
  }, [analysis, alerts, suggestions]);

  const getAlertTitle = (type: string): string => {
    switch (type) {
      case "overdue_payment":
        return "Pagamento em Atraso";
      case "high_interest":
        return "Juros Elevados";
      case "cash_flow_risk":
        return "Risco de Fluxo de Caixa";
      case "debt_to_income_high":
        return "Endividamento Alto";
      case "minimum_payment_trap":
        return "Armadilha do Pagamento Mínimo";
      default:
        return "Alerta de Dívida";
    }
  };

  const getSuggestionTitle = (type: string): string => {
    switch (type) {
      case "extra_payment":
        return "Oportunidade de Pagamento Extra";
      case "debt_avalanche":
        return "Estratégia Avalanche";
      case "debt_snowball":
        return "Estratégia Bola de Neve";
      case "negotiation":
        return "Oportunidade de Negociação";
      case "consolidation":
        return "Consolidação de Dívidas";
      default:
        return "Sugestão Financeira";
    }
  };

  const getAlertCategory = (type: string): DebtNotification["category"] => {
    if (type.includes("overdue")) return "overdue";
    if (type.includes("cash_flow")) return "cash_flow";
    if (type.includes("interest")) return "interest";
    return "reminder";
  };

  const getExpirationDate = (type: string): string => {
    const now = new Date();
    switch (type) {
      case "overdue_payment":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day
      case "cash_flow_risk":
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n,
      );

      try {
        storage.setItem("debt-notifications", JSON.stringify(updated));
      } catch (error) {
        logComponents.error("Error saving notifications:", error);
      }

      return updated;
    });

    toast.success("Notificação dispensada");
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, dismissed: true }));

      try {
        storage.setItem("debt-notifications", JSON.stringify(updated));
      } catch (error) {
        logComponents.error("Error saving notifications:", error);
      }

      return updated;
    });

    toast.success("Todas as notificações foram dispensadas");
  };

  const activeNotifications = notifications.filter((n) => !n.dismissed);
  const dismissedNotifications = notifications.filter((n) => n.dismissed);
  const displayNotifications = showDismissed
    ? notifications
    : activeNotifications;

  const highPriorityCount = activeNotifications.filter(
    (n) => n.priority === "high",
  ).length;
  const mediumPriorityCount = activeNotifications.filter(
    (n) => n.priority === "medium",
  ).length;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Alertas e Notificações</CardTitle>
              {activeNotifications.length > 0 && (
                <Badge variant="destructive">
                  {activeNotifications.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDismissed(!showDismissed)}
              >
                {showDismissed ? "Ocultar Dispensadas" : "Mostrar Dispensadas"}
              </Button>
              {activeNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllNotifications}
                >
                  Dispensar Todas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          {activeNotifications.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                {highPriorityCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{highPriorityCount} alta prioridade</span>
                  </div>
                )}
                {mediumPriorityCount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{mediumPriorityCount} média prioridade</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3">
            {displayNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma notificação no momento</p>
                <p className="text-sm">
                  Você será notificado sobre alertas importantes de dívidas
                </p>
              </div>
            ) : (
              displayNotifications
                .sort((a, b) => {
                  // Sort by priority first, then by date
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return (
                      priorityOrder[b.priority] - priorityOrder[a.priority]
                    );
                  }
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                })
                .map((notification) => {
                  const IconComponent = notificationIcons[notification.type];

                  return (
                    <Alert
                      key={notification.id}
                      className={`${notificationColors[notification.type]} ${notification.dismissed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <IconComponent className="w-5 h-5 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">
                                {notification.title}
                              </h4>
                              <Badge
                                variant="outline"
                                className={
                                  priorityColors[notification.priority]
                                }
                              >
                                {notification.priority === "high"
                                  ? "Alta"
                                  : notification.priority === "medium"
                                    ? "Média"
                                    : "Baixa"}
                              </Badge>
                              {notification.dismissed && (
                                <Badge variant="secondary">Dispensada</Badge>
                              )}
                            </div>
                            <AlertDescription className="text-sm">
                              {notification.message}
                            </AlertDescription>
                            <div className="text-xs text-gray-500 mt-2">
                              {new Date(notification.createdAt).toLocaleString(
                                "pt-BR",
                              )}
                            </div>
                          </div>
                        </div>
                        {!notification.dismissed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Alert>
                  );
                })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
