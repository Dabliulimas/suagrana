"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DatePicker } from "./ui/date-picker";
import {
  Bell,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Home,
  Car,
  Smartphone,
  Zap,
  X,
  Settings,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";
import { SmartNotifications } from "./smart-notifications";

// Simple storage utility
const storage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return [];
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },
  setItem: (key: string, value: any) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
};

interface Reminder {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  dueDate: string;
  category: "bill" | "payment" | "investment" | "goal" | "other";
  priority: "low" | "medium" | "high";
  recurring: boolean;
  recurringType?: "daily" | "weekly" | "monthly" | "yearly";
  isCompleted: boolean;
  notificationEnabled: boolean;
  notificationDays: number; // Days before due date to notify
  createdAt: string;
  updatedAt: string;
}

interface ReminderSystemProps {
  className?: string;
}

const categoryIcons = {
  bill: Zap,
  payment: CreditCard,
  investment: DollarSign,
  goal: CheckCircle,
  other: Bell,
};

const categoryLabels = {
  bill: "Conta",
  payment: "Pagamento",
  investment: "Investimento",
  goal: "Meta",
  other: "Outro",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function ReminderSystem({ className }: ReminderSystemProps) {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: "",
    description: "",
    amount: 0,
    dueDate: "",
    category: "bill",
    priority: "medium",
    recurring: false,
    recurringType: "monthly",
    notificationEnabled: true,
    notificationDays: 3,
  });
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "overdue"
  >("all");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // Load reminders on component mount
  useEffect(() => {
    const savedReminders = storage.getItem("reminders") || [];
    setReminders(savedReminders);

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Save reminders to storage
  const saveReminders = useCallback((updatedReminders: Reminder[]) => {
    storage.setItem("reminders", updatedReminders);
    setReminders(updatedReminders);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Notificações ativadas!");
      } else {
        toast.error("Permissão de notificação negada");
      }
    }
  }, []);

  // Check for due reminders and send notifications
  const checkDueReminders = useCallback(() => {
    if (notificationPermission !== "granted") return;

    const today = new Date();
    const upcomingReminders = reminders.filter((reminder) => {
      if (reminder.isCompleted || !reminder.notificationEnabled) return false;

      const dueDate = new Date(reminder.dueDate);
      const daysDiff = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      return daysDiff <= reminder.notificationDays && daysDiff >= 0;
    });

    upcomingReminders.forEach((reminder) => {
      const dueDate = new Date(reminder.dueDate);
      const daysDiff = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let message = "";
      if (daysDiff === 0) {
        message = `${reminder.title} vence hoje!`;
      } else if (daysDiff === 1) {
        message = `${reminder.title} vence amanhã!`;
      } else {
        message = `${reminder.title} vence em ${daysDiff} dias`;
      }

      new Notification("Lembrete Financeiro", {
        body: message,
        icon: "/favicon.ico",
        tag: reminder.id,
      });
    });
  }, [reminders, notificationPermission]);

  // Check reminders periodically
  useEffect(() => {
    const interval = setInterval(checkDueReminders, 60000); // Check every minute
    checkDueReminders(); // Check immediately
    return () => clearInterval(interval);
  }, [checkDueReminders]);

  // Add or update reminder
  const handleSaveReminder = useCallback(() => {
    if (!formData.title || !formData.dueDate) {
      toast.error("Título e data de vencimento são obrigatórios");
      return;
    }

    const now = new Date().toISOString();
    const reminder: Reminder = {
      id:
        editingReminder?.id ||
        `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title!,
      description: formData.description || "",
      amount: formData.amount || 0,
      dueDate: formData.dueDate!,
      category: (formData.category as Reminder["category"]) || "bill",
      priority: (formData.priority as Reminder["priority"]) || "medium",
      recurring: formData.recurring || false,
      recurringType: formData.recurringType,
      isCompleted: false,
      notificationEnabled: formData.notificationEnabled ?? true,
      notificationDays: formData.notificationDays || 3,
      createdAt: editingReminder?.createdAt || now,
      updatedAt: now,
    };

    const updatedReminders = editingReminder
      ? reminders.map((r) => (r.id === editingReminder.id ? reminder : r))
      : [...reminders, reminder];

    saveReminders(updatedReminders);

    // Handle recurring reminders
    if (reminder.recurring && reminder.recurringType) {
      createRecurringReminder(reminder);
    }

    setShowAddForm(false);
    setEditingReminder(null);
    setFormData({
      title: "",
      description: "",
      amount: 0,
      dueDate: "",
      category: "bill",
      priority: "medium",
      recurring: false,
      recurringType: "monthly",
      notificationEnabled: true,
      notificationDays: 3,
    });

    toast.success(
      editingReminder ? "Lembrete atualizado!" : "Lembrete criado!",
    );
  }, [formData, editingReminder, reminders, saveReminders]);

  // Create recurring reminder
  const createRecurringReminder = useCallback(
    (baseReminder: Reminder) => {
      if (!baseReminder.recurring || !baseReminder.recurringType) return;

      const nextDueDate = new Date(baseReminder.dueDate);

      switch (baseReminder.recurringType) {
        case "daily":
          nextDueDate.setDate(nextDueDate.getDate() + 1);
          break;
        case "weekly":
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          break;
        case "monthly":
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          break;
        case "yearly":
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          break;
      }

      const nextReminder: Reminder = {
        ...baseReminder,
        id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dueDate: nextDueDate.toISOString().split("T")[0],
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedReminders = [...reminders, nextReminder];
      saveReminders(updatedReminders);
    },
    [reminders, saveReminders],
  );

  // Mark reminder as completed
  const handleCompleteReminder = useCallback(
    (id: string) => {
      const updatedReminders = reminders.map((reminder) => {
        if (reminder.id === id) {
          const completed = {
            ...reminder,
            isCompleted: !reminder.isCompleted,
            updatedAt: new Date().toISOString(),
          };

          // Create next recurring reminder if completing
          if (
            !reminder.isCompleted &&
            completed.isCompleted &&
            reminder.recurring
          ) {
            setTimeout(() => createRecurringReminder(reminder), 100);
          }

          return completed;
        }
        return reminder;
      });

      saveReminders(updatedReminders);
      toast.success("Status do lembrete atualizado!");
    },
    [reminders, saveReminders, createRecurringReminder],
  );

  // Delete reminder
  const handleDeleteReminder = useCallback(
    (id: string) => {
      const updatedReminders = reminders.filter((r) => r.id !== id);
      saveReminders(updatedReminders);
      toast.success("Lembrete excluído!");
    },
    [reminders, saveReminders],
  );

  // Edit reminder
  const handleEditReminder = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      amount: reminder.amount,
      dueDate: reminder.dueDate,
      category: reminder.category,
      priority: reminder.priority,
      recurring: reminder.recurring,
      recurringType: reminder.recurringType,
      notificationEnabled: reminder.notificationEnabled,
      notificationDays: reminder.notificationDays,
    });
    setShowAddForm(true);
  }, []);

  // Filter reminders
  const filteredReminders = reminders
    .filter((reminder) => {
      const today = new Date();
      const dueDate = new Date(reminder.dueDate);
      const isOverdue = dueDate < today && !reminder.isCompleted;

      switch (filter) {
        case "pending":
          return !reminder.isCompleted;
        case "completed":
          return reminder.isCompleted;
        case "overdue":
          return isOverdue;
        default:
          return true;
      }
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  // Get reminder stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter((r) => !r.isCompleted).length,
    completed: reminders.filter((r) => r.isCompleted).length,
    overdue: reminders.filter((r) => {
      const today = new Date();
      const dueDate = new Date(r.dueDate);
      return dueDate < today && !r.isCompleted;
    }).length,
  };

  return (
    <div className={className}>
      <Tabs defaultValue="reminders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reminders">Lembretes Personalizados</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Reminders Tab */}
        <TabsContent value="reminders">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Bell className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats.pending}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Concluídos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.completed}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Atrasados</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.overdue}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Lembrete
                </Button>

                <Select
                  value={filter}
                  onValueChange={(value: any) => setFilter(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                    <SelectItem value="overdue">Atrasados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Smart Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alertas Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SmartNotifications />
              </CardContent>
            </Card>

            {/* Reminders List */}
            <div className="space-y-4">
              {filteredReminders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum lembrete encontrado</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowAddForm(true)}
                    >
                      Criar Primeiro Lembrete
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredReminders.map((reminder) => {
                  const IconComponent = categoryIcons[reminder.category];
                  const today = new Date();
                  const dueDate = new Date(reminder.dueDate);
                  const isOverdue = dueDate < today && !reminder.isCompleted;
                  const daysDiff = Math.ceil(
                    (dueDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );

                  return (
                    <Card
                      key={reminder.id}
                      className={`${isOverdue ? "border-red-200 bg-red-50" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`p-2 rounded-lg ${reminder.isCompleted ? "bg-green-100" : "bg-gray-100"}`}
                            >
                              <IconComponent
                                className={`w-5 h-5 ${reminder.isCompleted ? "text-green-600" : "text-gray-600"}`}
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`font-semibold ${reminder.isCompleted ? "line-through text-gray-500" : ""}`}
                                >
                                  {reminder.title}
                                </h3>
                                <Badge
                                  className={priorityColors[reminder.priority]}
                                >
                                  {reminder.priority}
                                </Badge>
                                {reminder.recurring && (
                                  <Badge variant="outline">Recorrente</Badge>
                                )}
                              </div>

                              {reminder.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {reminder.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(
                                    reminder.dueDate,
                                  ).toLocaleDateString("pt-BR")}
                                  {isOverdue && (
                                    <span className="text-red-600 font-medium ml-1">
                                      (Atrasado)
                                    </span>
                                  )}
                                  {!reminder.isCompleted &&
                                    !isOverdue &&
                                    daysDiff >= 0 && (
                                      <span className="text-blue-600 ml-1">
                                        (
                                        {daysDiff === 0
                                          ? "Hoje"
                                          : daysDiff === 1
                                            ? "Amanhã"
                                            : `${daysDiff} dias`}
                                        )
                                      </span>
                                    )}
                                </div>

                                {reminder.amount && reminder.amount > 0 && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    R$ {reminder.amount.toFixed(2)}
                                  </div>
                                )}

                                <Badge variant="outline">
                                  {categoryLabels[reminder.category]}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCompleteReminder(reminder.id)
                              }
                            >
                              <CheckCircle
                                className={`w-4 h-4 ${reminder.isCompleted ? "text-green-600" : "text-gray-400"}`}
                              />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReminder(reminder)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReminder(reminder.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  Status das notificações:{" "}
                  <strong>
                    {notificationPermission === "granted"
                      ? "Ativadas"
                      : "Desativadas"}
                  </strong>
                </AlertDescription>
              </Alert>

              {notificationPermission !== "granted" && (
                <Button onClick={requestNotificationPermission}>
                  <Bell className="w-4 h-4 mr-2" />
                  Ativar Notificações
                </Button>
              )}

              <div className="space-y-4">
                <h4 className="font-semibold">
                  Configurações Padrão para Novos Lembretes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria Padrão</Label>
                    <Select defaultValue="bill">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bill">Conta</SelectItem>
                        <SelectItem value="payment">Pagamento</SelectItem>
                        <SelectItem value="investment">Investimento</SelectItem>
                        <SelectItem value="goal">Meta</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade Padrão</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de Antecedência</Label>
                    <Input type="number" defaultValue={3} min={0} max={30} />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <Label>Notificações Ativadas por Padrão</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingReminder ? "Editar Lembrete" : "Novo Lembrete"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingReminder(null);
                    setFormData({
                      title: "",
                      description: "",
                      amount: 0,
                      dueDate: "",
                      category: "bill",
                      priority: "medium",
                      recurring: false,
                      recurringType: "monthly",
                      notificationEnabled: true,
                      notificationDays: 3,
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ex: Conta de luz"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <DatePicker
                    value={formData.dueDate || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, dueDate: value })
                    }
                    placeholder="Selecionar data de vencimento"
                    minDate={new Date()}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bill">Conta</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="goal">Meta</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notificar com antecedência (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.notificationDays || 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notificationDays: parseInt(e.target.value) || 3,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalhes adicionais sobre o lembrete..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.notificationEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notificationEnabled: checked })
                  }
                />
                <Label>Ativar notificações</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.recurring || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, recurring: checked })
                  }
                />
                <Label>Lembrete recorrente</Label>
              </div>

              {formData.recurring && (
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.recurringType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, recurringType: value })
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
              )}

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingReminder(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveReminder}>
                  {editingReminder ? "Atualizar" : "Criar"} Lembrete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
