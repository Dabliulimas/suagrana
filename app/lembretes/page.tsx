"use client";

import { useState, useEffect } from "react";
import { ModernAppLayout } from "../../components/modern-app-layout";
import { BackButton } from "../../components/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Bell,
  Calendar,
  CreditCard,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  Repeat,
  TrendingUp,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "../../contexts/notification-context";

interface Reminder {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  priority: "low" | "medium" | "high";
  recurring: boolean;
  frequency?: "monthly" | "quarterly" | "yearly";
  status: "pending" | "paid" | "overdue";
  notifications: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  billingDate: string;
  frequency: "monthly" | "quarterly" | "yearly";
  category: string;
  status: "active" | "paused" | "cancelled";
  autoRenew: boolean;
  nextBilling: string;
  createdAt: string;
  updatedAt: string;
}

const REMINDER_CATEGORIES = [
  "Contas Básicas",
  "Cartão de Crédito",
  "Empréstimos",
  "Impostos",
  "Seguros",
  "Outros",
];

const SUBSCRIPTION_CATEGORIES = [
  "Streaming",
  "Software/Apps",
  "Jogos",
  "Música",
  "Academia",
  "Educação",
  "Produtividade",
  "Outros",
];

export default function RemindersAndSubscriptions() {
  const { addNotification } = useNotifications();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    amount: "",
    dueDate: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    recurring: false,
    frequency: "monthly" as "monthly" | "quarterly" | "yearly",
    notifications: true,
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: "",
    description: "",
    amount: "",
    billingDate: "",
    frequency: "monthly" as "monthly" | "quarterly" | "yearly",
    category: "",
    autoRenew: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Check overdue reminders whenever reminders change
  useEffect(() => {
    if (reminders.length > 0) {
      checkOverdueReminders();
    }
  }, [reminders, addNotification]);

  // Periodic check for reminders (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      if (reminders.length > 0) {
        checkOverdueReminders();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [reminders, addNotification]);

  const loadData = () => {
    try {
      const savedReminders = localStorage.getItem("reminders");
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }

      const savedSubscriptions = localStorage.getItem("subscriptions");
      if (savedSubscriptions) {
        setSubscriptions(JSON.parse(savedSubscriptions));
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const saveReminders = (newReminders: Reminder[]) => {
    localStorage.setItem("reminders", JSON.stringify(newReminders));
    setReminders(newReminders);
  };

  const saveSubscriptions = (newSubscriptions: Subscription[]) => {
    localStorage.setItem("subscriptions", JSON.stringify(newSubscriptions));
    setSubscriptions(newSubscriptions);
  };

  const checkOverdueReminders = () => {
    const today = new Date();
    const overdueReminders = reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return r.status === "pending" && dueDate < today;
    });

    // Marcar lembretes como vencidos
    if (overdueReminders.length > 0) {
      const updatedReminders = reminders.map(r => {
        const dueDate = new Date(r.dueDate);
        if (r.status === "pending" && dueDate < today) {
          return { ...r, status: "overdue" as const };
        }
        return r;
      });
      setReminders(updatedReminders);
      localStorage.setItem("reminders", JSON.stringify(updatedReminders));

      // Adicionar notificação usando o contexto
      addNotification({
        title: "Lembretes Vencidos",
        message: `Você tem ${overdueReminders.length} lembrete(s) vencido(s)`,
        type: "warning",
        category: "reminder"
      });
    }

    // Verificar lembretes que vencem em breve (próximos 3 dias)
    const upcomingReminders = reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return r.status === "pending" && dueDate >= today && dueDate <= threeDaysFromNow;
    });

    if (upcomingReminders.length > 0) {
      upcomingReminders.forEach(reminder => {
        const dueDate = new Date(reminder.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        addNotification({
          title: `Lembrete: ${reminder.title}`,
          message: `Vence ${daysUntil === 0 ? "hoje" : daysUntil === 1 ? "amanhã" : `em ${daysUntil} dias`} - R$ ${reminder.amount.toFixed(2)}`,
          type: "info",
          category: "reminder"
        });
      });
    }
  };

  const handleSaveReminder = () => {
    if (!reminderForm.title || !reminderForm.amount || !reminderForm.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const reminder: Reminder = {
      id: editingReminder?.id || Date.now().toString(),
      title: reminderForm.title,
      description: reminderForm.description,
      amount: parseFloat(reminderForm.amount),
      dueDate: reminderForm.dueDate,
      category: reminderForm.category,
      priority: reminderForm.priority,
      recurring: reminderForm.recurring,
      frequency: reminderForm.frequency,
      status: editingReminder?.status || "pending",
      notifications: reminderForm.notifications,
      createdAt: editingReminder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedReminders = editingReminder
      ? reminders.map(r => r.id === editingReminder.id ? reminder : r)
      : [...reminders, reminder];

    saveReminders(updatedReminders);
    resetReminderForm();
    setShowReminderModal(false);
    toast.success(editingReminder ? "Lembrete atualizado!" : "Lembrete criado!");
  };

  const handleSaveSubscription = () => {
    if (!subscriptionForm.name || !subscriptionForm.amount || !subscriptionForm.billingDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const subscription: Subscription = {
      id: editingSubscription?.id || Date.now().toString(),
      name: subscriptionForm.name,
      description: subscriptionForm.description,
      amount: parseFloat(subscriptionForm.amount),
      currency: "BRL",
      billingDate: subscriptionForm.billingDate,
      frequency: subscriptionForm.frequency,
      category: subscriptionForm.category,
      status: editingSubscription?.status || "active",
      autoRenew: subscriptionForm.autoRenew,
      nextBilling: calculateNextBilling(subscriptionForm.billingDate, subscriptionForm.frequency),
      createdAt: editingSubscription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedSubscriptions = editingSubscription
      ? subscriptions.map(s => s.id === editingSubscription.id ? subscription : s)
      : [...subscriptions, subscription];

    saveSubscriptions(updatedSubscriptions);
    resetSubscriptionForm();
    setShowSubscriptionModal(false);
    toast.success(editingSubscription ? "Assinatura atualizada!" : "Assinatura criada!");
  };

  const calculateNextBilling = (billingDate: string, frequency: string) => {
    const date = new Date(billingDate);
    switch (frequency) {
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const resetReminderForm = () => {
    setReminderForm({
      title: "",
      description: "",
      amount: "",
      dueDate: "",
      category: "",
      priority: "medium",
      recurring: false,
      frequency: "monthly",
      notifications: true,
    });
    setEditingReminder(null);
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      name: "",
      description: "",
      amount: "",
      billingDate: "",
      frequency: "monthly",
      category: "",
      autoRenew: true,
    });
    setEditingSubscription(null);
  };

  const editReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderForm({
      title: reminder.title,
      description: reminder.description,
      amount: reminder.amount.toString(),
      dueDate: reminder.dueDate,
      category: reminder.category,
      priority: reminder.priority,
      recurring: reminder.recurring,
      frequency: reminder.frequency || "monthly",
      notifications: reminder.notifications,
    });
    setShowReminderModal(true);
  };

  const editSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      name: subscription.name,
      description: subscription.description,
      amount: subscription.amount.toString(),
      billingDate: subscription.billingDate,
      frequency: subscription.frequency,
      category: subscription.category,
      autoRenew: subscription.autoRenew,
    });
    setShowSubscriptionModal(true);
  };

  const deleteReminder = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lembrete?")) {
      const updatedReminders = reminders.filter(r => r.id !== id);
      saveReminders(updatedReminders);
      toast.success("Lembrete excluído!");
    }
  };

  const deleteSubscription = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta assinatura?")) {
      const updatedSubscriptions = subscriptions.filter(s => s.id !== id);
      saveSubscriptions(updatedSubscriptions);
      toast.success("Assinatura excluída!");
    }
  };

  const markReminderAsPaid = (id: string) => {
    const updatedReminders = reminders.map(r => 
      r.id === id ? { ...r, status: "paid" as const, updatedAt: new Date().toISOString() } : r
    );
    saveReminders(updatedReminders);
    toast.success("Lembrete marcado como pago!");
  };

  const getSubscriptionStats = () => {
    const activeSubscriptions = subscriptions.filter(s => s.status === "active");
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      switch (sub.frequency) {
        case "monthly":
          return total + sub.amount;
        case "quarterly":
          return total + (sub.amount / 3);
        case "yearly":
          return total + (sub.amount / 12);
        default:
          return total;
      }
    }, 0);
    const yearlyTotal = monthlyTotal * 12;
    
    return {
      activeCount: activeSubscriptions.length,
      monthlyTotal,
      yearlyTotal,
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const stats = getSubscriptionStats();

  return (
    <ModernAppLayout
      title="Lembretes e Assinaturas"
      subtitle="Gerencie suas contas e acompanhe seus gastos recorrentes"
    >
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Lembretes e Assinaturas</h1>
              <p className="text-muted-foreground">
                Gerencie suas contas e acompanhe seus gastos recorrentes
              </p>
            </div>
          </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowReminderModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lembrete
          </Button>
          <Button onClick={() => setShowSubscriptionModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reminders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Lembretes
            {reminders.filter(r => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {reminders.filter(r => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            Assinaturas
            <Badge variant="secondary" className="ml-1">
              {stats.activeCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.filter(r => r.status === "pending").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reminders.filter(r => r.status === "overdue").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {reminders
                    .filter(r => r.status === "pending" && new Date(r.dueDate).getMonth() === new Date().getMonth())
                    .reduce((total, r) => total + r.amount, 0)
                    .toFixed(2)
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {reminders.map((reminder) => (
              <Card key={reminder.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{reminder.title}</h3>
                        <Badge className={getPriorityColor(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        <Badge className={getStatusColor(reminder.status)}>
                          {reminder.status}
                        </Badge>
                        {reminder.recurring && (
                          <Badge variant="outline">
                            <Repeat className="w-3 h-3 mr-1" />
                            {reminder.frequency}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reminder.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(reminder.dueDate).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {reminder.amount.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          {reminder.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {reminder.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => markReminderAsPaid(reminder.id)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editReminder(reminder)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gasto Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.monthlyTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gasto Anual</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.yearlyTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{subscription.name}</h3>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                        <Badge variant="outline">
                          {subscription.frequency}
                        </Badge>
                        {subscription.autoRenew && (
                          <Badge variant="secondary">Auto Renew</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {subscription.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {subscription.amount.toFixed(2)} / {subscription.frequency === "monthly" ? "mês" : subscription.frequency === "quarterly" ? "trimestre" : "ano"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Próximo: {new Date(subscription.nextBilling).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="text-muted-foreground">
                          {subscription.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editSubscription(subscription)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSubscription(subscription.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Lembrete */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? "Editar" : "Novo"} Lembrete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={reminderForm.title}
                onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                placeholder="Ex: Conta de luz"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={reminderForm.description}
                onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                placeholder="Detalhes adicionais..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={reminderForm.amount}
                  onChange={(e) => setReminderForm({ ...reminderForm, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={reminderForm.category} onValueChange={(value) => setReminderForm({ ...reminderForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={reminderForm.priority} onValueChange={(value: any) => setReminderForm({ ...reminderForm, priority: value })}>
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReminder}>
                {editingReminder ? "Atualizar" : "Criar"} Lembrete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Assinatura */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? "Editar" : "Nova"} Assinatura
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={subscriptionForm.name}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, name: e.target.value })}
                placeholder="Ex: Netflix, Spotify..."
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={subscriptionForm.description}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, description: e.target.value })}
                placeholder="Detalhes da assinatura..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={subscriptionForm.amount}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label htmlFor="billingDate">Data de Cobrança *</Label>
                <Input
                  id="billingDate"
                  type="date"
                  value={subscriptionForm.billingDate}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, billingDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={subscriptionForm.frequency} onValueChange={(value: any) => setSubscriptionForm({ ...subscriptionForm, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={subscriptionForm.category} onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSubscription}>
                {editingSubscription ? "Atualizar" : "Criar"} Assinatura
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ModernAppLayout>
  );
}
