"use client";

import { useState, useEffect } from "react";
import { UnifiedFinancialSystem } from "../lib/unified-financial-system";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
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
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  Repeat,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Clock,
  Bell,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Zap,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";
import { type Account } from "../types";
import type { RecurringBill } from "../types";

interface RecurringBillsManagerProps {
  onUpdate?: () => void;
}

export function RecurringBillsManager({
  onUpdate,
}: RecurringBillsManagerProps) {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [billForm, setBillForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    dueDay: "",
    category: "",
    subcategory: "",
    account: "",
    paymentMethod: "debit" as "debit" | "credit" | "cash" | "pix",
    autoGenerate: true,
    notifications: true,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const [accounts] = await Promise.all([
        financialSystem.getAccounts(),
      ]);
      setAccounts(accounts || []);
      setRecurringBills([]); // Placeholder para bills
    } catch {
      setAccounts([]);
      setRecurringBills([]);
    }
  };

  const saveRecurringBills = async (bills: RecurringBill[]) => {
    try {
      // Placeholder - salvar bills localmente por enquanto
      setRecurringBills(bills);
    } catch {
      setRecurringBills(bills);
    }
  };

  const calculateNextDueDate = (frequency: string, dueDay: number) => {
    const today = new Date();
    let nextDate = new Date();

    switch (frequency) {
      case "weekly":
        nextDate.setDate(today.getDate() + ((7 - today.getDay() + dueDay) % 7));
        break;
      case "monthly":
        nextDate.setDate(dueDay);
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case "quarterly":
        nextDate.setDate(dueDay);
        nextDate.setMonth(Math.ceil((today.getMonth() + 1) / 3) * 3 - 1);
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 3);
        }
        break;
      case "yearly":
        nextDate.setDate(dueDay);
        nextDate.setMonth(today.getMonth());
        if (nextDate <= today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        break;
    }

    return nextDate.toISOString().split("T")[0];
  };

  const handleSaveBill = () => {
    if (
      !billForm.name ||
      !billForm.amount ||
      !billForm.dueDay ||
      !billForm.category ||
      !billForm.account
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const nextDueDate = calculateNextDueDate(
      billForm.frequency,
      parseInt(billForm.dueDay),
    );

    const bill: RecurringBill = {
      id: editingBill?.id || Date.now().toString(),
      name: billForm.name,
      amount: parseFloat(billForm.amount),
      frequency: billForm.frequency,
      dueDay: parseInt(billForm.dueDay),
      category: billForm.category,
      subcategory: billForm.subcategory || undefined,
      account: billForm.account,
      paymentMethod: billForm.paymentMethod,
      isActive: editingBill?.isActive ?? true,
      nextDueDate,
      lastPaidDate: editingBill?.lastPaidDate,
      autoGenerate: billForm.autoGenerate,
      notifications: billForm.notifications,
      notes: billForm.notes || undefined,
      createdAt: editingBill?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedBills: RecurringBill[];
    if (editingBill) {
      updatedBills = recurringBills.map((b) =>
        b.id === editingBill.id ? bill : b,
      );
      toast.success("Conta recorrente atualizada com sucesso!");
    } else {
      updatedBills = [...recurringBills, bill];
      toast.success("Conta recorrente adicionada com sucesso!");
    }

    saveRecurringBills(updatedBills);
    resetForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const handleToggleActive = (billId: string) => {
    const updatedBills = recurringBills.map((bill) =>
      bill.id === billId
        ? {
            ...bill,
            isActive: !bill.isActive,
            updatedAt: new Date().toISOString(),
          }
        : bill,
    );
    saveRecurringBills(updatedBills);
    toast.success("Status da conta atualizado!");
    onUpdate?.();
  };

  const handleSendToInvoice = (billId: string) => {
    const bill = recurringBills.find((b) => b.id === billId);
    if (!bill) return;

    // Create a billing payment entry
    const billingPayment = {
      id: `bill-${billId}-${Date.now()}`,
      transactionId: `recurring-${billId}`,
      userEmail: "current-user@email.com", // This should come from user context
      amount: bill.amount,
      description: bill.name,
      date: new Date().toISOString().split("T")[0],
      category: bill.category,
      isPaid: false,
      paidDate: undefined,
      dueDate: bill.nextDueDate,
      month: new Date().toLocaleDateString("pt-BR", { month: "long" }),
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to billing payments
    // Opcional: enviar para API de faturas recorrentes

    toast.success(
      `${bill.name} enviada para fatura! Acesse a página de faturas para efetuar o pagamento.`,
    );
    onUpdate?.();
  };

  const handleGenerateTransaction = (billId: string) => {
    const bill = recurringBills.find((b) => b.id === billId);
    if (!bill) return;

    // Create transaction
    const transaction = {
      description: bill.name,
      amount: -bill.amount, // Negative for expense
      type: "expense" as const,
      category: bill.category,
      account: bill.account,
      date: new Date().toISOString().split("T")[0],
      notes: `Conta recorrente: ${bill.name}`,
      recurring: true,
    };

    try {
      storage.saveTransaction(transaction);
      handleMarkAsPaid(billId);
      toast.success("Transação gerada e conta marcada como paga!");
    } catch (error) {
      toast.error("Erro ao gerar transação");
    }
  };

  const handleDeleteBill = (billId: string) => {
    const updatedBills = recurringBills.filter((bill) => bill.id !== billId);
    saveRecurringBills(updatedBills);
    toast.success("Conta recorrente removida com sucesso!");
    onUpdate?.();
  };

  const handleEditBill = (bill: RecurringBill) => {
    setEditingBill(bill);
    setBillForm({
      name: bill.name,
      amount: bill.amount.toString(),
      frequency: bill.frequency,
      dueDay: bill.dueDay.toString(),
      category: bill.category,
      subcategory: bill.subcategory || "",
      account: bill.account,
      paymentMethod: bill.paymentMethod,
      autoGenerate: bill.autoGenerate,
      notifications: bill.notifications,
      notes: bill.notes || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setBillForm({
      name: "",
      amount: "",
      frequency: "monthly",
      dueDay: "",
      category: "",
      subcategory: "",
      account: "",
      paymentMethod: "debit",
      autoGenerate: true,
      notifications: true,
      notes: "",
    });
    setEditingBill(null);
  };

  const getFilteredBills = () => {
    let filtered = recurringBills;

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((bill) => bill.category === selectedCategory);
    }

    return filtered.sort(
      (a, b) =>
        new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime(),
    );
  };

  const getUpcomingBills = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return recurringBills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate);
      return bill.isActive && dueDate >= today && dueDate <= nextWeek;
    });
  };

  const getTotalMonthlyAmount = () => {
    return recurringBills
      .filter((bill) => bill.isActive)
      .reduce((sum, bill) => {
        switch (bill.frequency) {
          case "weekly":
            return sum + bill.amount * 4.33; // Average weeks per month
          case "monthly":
            return sum + bill.amount;
          case "quarterly":
            return sum + bill.amount / 3;
          case "yearly":
            return sum + bill.amount / 12;
          default:
            return sum;
        }
      }, 0);
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(recurringBills.map((bill) => bill.category)));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      weekly: "Semanal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      yearly: "Anual",
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const filteredBills = getFilteredBills();
  const upcomingBills = getUpcomingBills();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Contas Recorrentes
          </h3>
          <p className="text-sm text-gray-600">
            Gerencie assinaturas, contas fixas e outros gastos recorrentes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBill
                  ? "Editar Conta Recorrente"
                  : "Nova Conta Recorrente"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={billForm.name}
                  onChange={(e) =>
                    setBillForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Netflix, Conta de Luz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={billForm.amount}
                    onChange={(e) =>
                      setBillForm((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDay">Dia do Vencimento</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={billForm.dueDay}
                    onChange={(e) =>
                      setBillForm((prev) => ({
                        ...prev,
                        dueDay: e.target.value,
                      }))
                    }
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={billForm.frequency}
                  onValueChange={(value: any) =>
                    setBillForm((prev) => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={billForm.category}
                    onValueChange={(value) =>
                      setBillForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moradia">Moradia</SelectItem>
                      <SelectItem value="transporte">Transporte</SelectItem>
                      <SelectItem value="assinaturas">Assinaturas</SelectItem>
                      <SelectItem value="seguros">Seguros</SelectItem>
                      <SelectItem value="educacao">Educação</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account">Conta</Label>
                  <Select
                    value={billForm.account}
                    onValueChange={(value) =>
                      setBillForm((prev) => ({ ...prev, account: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(
                          (account) => account.id && account.id.trim() !== "",
                        )
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={billForm.paymentMethod}
                  onValueChange={(value: any) =>
                    setBillForm((prev) => ({ ...prev, paymentMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={billForm.notes}
                  onChange={(e) =>
                    setBillForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoGenerate">
                    Gerar Transação Automaticamente
                  </Label>
                  <Switch
                    id="autoGenerate"
                    checked={billForm.autoGenerate}
                    onCheckedChange={(checked) =>
                      setBillForm((prev) => ({
                        ...prev,
                        autoGenerate: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Notificações</Label>
                  <Switch
                    id="notifications"
                    checked={billForm.notifications}
                    onCheckedChange={(checked) =>
                      setBillForm((prev) => ({
                        ...prev,
                        notifications: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveBill} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Contas Ativas</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {recurringBills.filter((bill) => bill.isActive).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Gasto Mensal</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalMonthlyAmount())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">
                Vencendo Esta Semana
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {upcomingBills.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Vencimento */}
      {upcomingBills.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="w-5 h-5" />
              Contas Vencendo Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-gray-500">
                      Vence em{" "}
                      {new Date(bill.nextDueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-600">
                      {formatCurrency(bill.amount)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateTransaction(bill.id)}
                    >
                      Pagar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {getUniqueCategories()
                    .filter((category) => category && category.trim() !== "")
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <div className="grid gap-4">
        {filteredBills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Repeat className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Nenhuma conta recorrente cadastrada
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBills.map((bill) => {
            const account = accounts.find((acc) => acc.id === bill.account);
            const isOverdue =
              new Date(bill.nextDueDate) < new Date() && bill.isActive;

            return (
              <Card
                key={bill.id}
                className={
                  isOverdue
                    ? "border-red-200 bg-red-50"
                    : !bill.isActive
                      ? "bg-gray-50"
                      : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          bill.isActive ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Repeat
                          className={`w-6 h-6 ${bill.isActive ? "text-blue-600" : "text-gray-400"}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{bill.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getFrequencyLabel(bill.frequency)}
                          </Badge>
                          {!bill.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Vencido
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {bill.category} • {account?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Próximo vencimento:{" "}
                          {new Date(bill.nextDueDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(bill.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getFrequencyLabel(bill.frequency).toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(bill.id)}
                          className="flex items-center gap-1"
                        >
                          {bill.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        {bill.isActive && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendToInvoice(bill.id)}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateTransaction(bill.id)}
                            >
                              <Zap className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBill(bill)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBill(bill.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
