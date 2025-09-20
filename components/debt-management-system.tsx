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
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DatePicker } from "./ui/date-picker";
import {
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Target,
  Phone,
  Mail,
  FileText,
  X,
  Clock,
  Percent,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";
import { IntelligentDebtDashboard } from "./intelligent-debt-dashboard";

interface Debt {
  id: string;
  creditor: string;
  originalAmount: number;
  currentAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  category: "credit_card" | "loan" | "financing" | "other";
  priority: "low" | "medium" | "high";
  status: "active" | "negotiating" | "paid" | "defaulted";
  description?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  negotiationHistory: NegotiationRecord[];
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

interface NegotiationRecord {
  id: string;
  date: string;
  type: "discount" | "installment" | "interest_reduction" | "payment_plan";
  description: string;
  originalAmount: number;
  negotiatedAmount?: number;
  installments?: number;
  newInterestRate?: number;
  status: "pending" | "accepted" | "rejected";
  contactPerson?: string;
  notes?: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  type: "minimum" | "extra" | "full";
  method: "cash" | "transfer" | "card" | "pix";
  notes?: string;
}

interface DebtManagementSystemProps {
  className?: string;
}

const categoryLabels = {
  credit_card: "Cartão de Crédito",
  loan: "Empréstimo",
  financing: "Financiamento",
  other: "Outros",
};

const statusColors = {
  active: "bg-blue-100 text-blue-800",
  negotiating: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  defaulted: "bg-red-100 text-red-800",
};

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export function DebtManagementSystem({ className }: DebtManagementSystemProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNegotiationForm, setShowNegotiationForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "negotiating" | "paid" | "defaulted"
  >("all");
  const [sortBy, setSortBy] = useState<
    "amount" | "interest" | "dueDate" | "priority"
  >("priority");

  const [debtFormData, setDebtFormData] = useState<Partial<Debt>>({
    creditor: "",
    originalAmount: 0,
    currentAmount: 0,
    interestRate: 0,
    minimumPayment: 0,
    dueDate: "",
    category: "credit_card",
    priority: "medium",
    status: "active",
    description: "",
    contactInfo: {
      phone: "",
      email: "",
      address: "",
    },
  });

  const [negotiationData, setNegotiationData] = useState<
    Partial<NegotiationRecord>
  >({
    type: "discount",
    description: "",
    originalAmount: 0,
    negotiatedAmount: 0,
    installments: 1,
    newInterestRate: 0,
    contactPerson: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState<Partial<PaymentRecord>>({
    amount: 0,
    type: "minimum",
    method: "pix",
    notes: "",
  });

  // Load debts on component mount
  useEffect(() => {
    const savedDebts = storage.getItem("debts") || [];
    setDebts(savedDebts);
  }, []);

  // Save debts to storage
  const saveDebts = useCallback((updatedDebts: Debt[]) => {
    storage.setItem("debts", updatedDebts);
    setDebts(updatedDebts);
  }, []);

  // Add or update debt
  const handleSaveDebt = useCallback(() => {
    if (
      !debtFormData.creditor ||
      !debtFormData.originalAmount ||
      !debtFormData.dueDate
    ) {
      toast.error(
        "Credor, valor original e data de vencimento são obrigatórios",
      );
      return;
    }

    const now = new Date().toISOString();
    const debt: Debt = {
      id:
        editingDebt?.id ||
        `debt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      creditor: debtFormData.creditor!,
      originalAmount: debtFormData.originalAmount!,
      currentAmount: debtFormData.currentAmount || debtFormData.originalAmount!,
      interestRate: debtFormData.interestRate || 0,
      minimumPayment: debtFormData.minimumPayment || 0,
      dueDate: debtFormData.dueDate!,
      category: (debtFormData.category as Debt["category"]) || "credit_card",
      priority: (debtFormData.priority as Debt["priority"]) || "medium",
      status: (debtFormData.status as Debt["status"]) || "active",
      description: debtFormData.description || "",
      contactInfo: debtFormData.contactInfo || {},
      negotiationHistory: editingDebt?.negotiationHistory || [],
      paymentHistory: editingDebt?.paymentHistory || [],
      createdAt: editingDebt?.createdAt || now,
      updatedAt: now,
    };

    const updatedDebts = editingDebt
      ? debts.map((d) => (d.id === editingDebt.id ? debt : d))
      : [...debts, debt];

    saveDebts(updatedDebts);
    setShowAddForm(false);
    setEditingDebt(null);
    resetDebtForm();
    toast.success(editingDebt ? "Dívida atualizada!" : "Dívida adicionada!");
  }, [debtFormData, editingDebt, debts, saveDebts]);

  // Reset debt form
  const resetDebtForm = useCallback(() => {
    setDebtFormData({
      creditor: "",
      originalAmount: 0,
      currentAmount: 0,
      interestRate: 0,
      minimumPayment: 0,
      dueDate: "",
      category: "credit_card",
      priority: "medium",
      status: "active",
      description: "",
      contactInfo: {
        phone: "",
        email: "",
        address: "",
      },
    });
  }, []);

  // Edit debt
  const handleEditDebt = useCallback((debt: Debt) => {
    setEditingDebt(debt);
    setDebtFormData({
      creditor: debt.creditor,
      originalAmount: debt.originalAmount,
      currentAmount: debt.currentAmount,
      interestRate: debt.interestRate,
      minimumPayment: debt.minimumPayment,
      dueDate: debt.dueDate,
      category: debt.category,
      priority: debt.priority,
      status: debt.status,
      description: debt.description,
      contactInfo: debt.contactInfo,
    });
    setShowAddForm(true);
  }, []);

  // Delete debt
  const handleDeleteDebt = useCallback(
    (id: string) => {
      const updatedDebts = debts.filter((d) => d.id !== id);
      saveDebts(updatedDebts);
      toast.success("Dívida excluída!");
    },
    [debts, saveDebts],
  );

  // Add negotiation record
  const handleAddNegotiation = useCallback(() => {
    if (!selectedDebt) {
      toast.error("Nenhuma dívida selecionada");
      return;
    }

    if (!negotiationData.description?.trim()) {
      toast.error("Descrição da negociação é obrigatória");
      return;
    }

    if (
      negotiationData.type === "discount" &&
      (!negotiationData.negotiatedAmount ||
        negotiationData.negotiatedAmount <= 0)
    ) {
      toast.error("Valor negociado deve ser maior que zero para desconto");
      return;
    }

    if (
      negotiationData.type === "installment" &&
      (!negotiationData.installments || negotiationData.installments < 1)
    ) {
      toast.error("Número de parcelas deve ser maior que zero");
      return;
    }

    const negotiation: NegotiationRecord = {
      id: `negotiation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      type: (negotiationData.type as NegotiationRecord["type"]) || "discount",
      description: negotiationData.description!,
      originalAmount:
        negotiationData.originalAmount || selectedDebt.currentAmount,
      negotiatedAmount: negotiationData.negotiatedAmount,
      installments: negotiationData.installments,
      newInterestRate: negotiationData.newInterestRate,
      status: "pending",
      contactPerson: negotiationData.contactPerson,
      notes: negotiationData.notes,
    };

    const updatedDebts = debts.map((debt) => {
      if (debt.id === selectedDebt.id) {
        return {
          ...debt,
          negotiationHistory: [...debt.negotiationHistory, negotiation],
          status: "negotiating" as Debt["status"],
          updatedAt: new Date().toISOString(),
        };
      }
      return debt;
    });

    saveDebts(updatedDebts);
    setShowNegotiationForm(false);
    setNegotiationData({
      type: "discount",
      description: "",
      originalAmount: 0,
      negotiatedAmount: 0,
      installments: 1,
      newInterestRate: 0,
      contactPerson: "",
      notes: "",
    });
    toast.success("Negociação registrada!");
  }, [selectedDebt, negotiationData, debts, saveDebts]);

  // Add payment record
  const handleAddPayment = useCallback(() => {
    if (!selectedDebt) {
      toast.error("Nenhuma dívida selecionada");
      return;
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error("Valor do pagamento deve ser maior que zero");
      return;
    }

    if (paymentData.amount > selectedDebt.currentAmount) {
      toast.error(
        `Valor do pagamento não pode ser maior que o saldo devedor (R$ ${selectedDebt.currentAmount.toFixed(2)})`,
      );
      return;
    }

    const payment: PaymentRecord = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      amount: paymentData.amount!,
      type: (paymentData.type as PaymentRecord["type"]) || "minimum",
      method: (paymentData.method as PaymentRecord["method"]) || "pix",
      notes: paymentData.notes,
    };

    const newCurrentAmount = Math.max(
      0,
      selectedDebt.currentAmount - payment.amount,
    );
    const newStatus = newCurrentAmount === 0 ? "paid" : selectedDebt.status;

    const updatedDebts = debts.map((debt) => {
      if (debt.id === selectedDebt.id) {
        return {
          ...debt,
          currentAmount: newCurrentAmount,
          status: newStatus,
          paymentHistory: [...debt.paymentHistory, payment],
          updatedAt: new Date().toISOString(),
        };
      }
      return debt;
    });

    saveDebts(updatedDebts);
    setShowPaymentForm(false);
    setPaymentData({
      amount: 0,
      type: "minimum",
      method: "pix",
      notes: "",
    });
    toast.success("Pagamento registrado!");
  }, [selectedDebt, paymentData, debts, saveDebts]);

  // Calculate debt statistics
  const debtStats = {
    totalDebts: debts.length,
    totalAmount: debts.reduce((sum, debt) => sum + debt.currentAmount, 0),
    activeDebts: debts.filter((d) => d.status === "active").length,
    negotiatingDebts: debts.filter((d) => d.status === "negotiating").length,
    paidDebts: debts.filter((d) => d.status === "paid").length,
    averageInterest:
      debts.length > 0
        ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length
        : 0,
    monthlyMinimum: debts
      .filter((d) => d.status === "active")
      .reduce((sum, debt) => sum + debt.minimumPayment, 0),
  };

  // Filter and sort debts
  const filteredDebts = debts
    .filter((debt) => filter === "all" || debt.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.currentAmount - a.currentAmount;
        case "interest":
          return b.interestRate - a.interestRate;
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  // Calculate debt payoff scenarios
  const calculatePayoffScenarios = useCallback((debt: Debt) => {
    const scenarios = [];

    // Minimum payment scenario
    if (debt.minimumPayment > 0 && debt.interestRate > 0) {
      const monthlyRate = debt.interestRate / 100 / 12;
      const months = Math.ceil(
        Math.log(1 + (debt.currentAmount * monthlyRate) / debt.minimumPayment) /
          Math.log(1 + monthlyRate),
      );
      const totalPaid = debt.minimumPayment * months;

      scenarios.push({
        name: "Pagamento Mínimo",
        months,
        totalPaid,
        totalInterest: totalPaid - debt.currentAmount,
      });
    }

    // Double payment scenario
    if (debt.minimumPayment > 0 && debt.interestRate > 0) {
      const doublePayment = debt.minimumPayment * 2;
      const monthlyRate = debt.interestRate / 100 / 12;
      const months = Math.ceil(
        Math.log(1 + (debt.currentAmount * monthlyRate) / doublePayment) /
          Math.log(1 + monthlyRate),
      );
      const totalPaid = doublePayment * months;

      scenarios.push({
        name: "Pagamento Dobrado",
        months,
        totalPaid,
        totalInterest: totalPaid - debt.currentAmount,
      });
    }

    return scenarios;
  }, []);

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="debts">Dívidas</TabsTrigger>
          <TabsTrigger value="negotiations">Negociações</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Intelligent Debt Dashboard */}
            <IntelligentDebtDashboard />
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total de Dívidas</p>
                      <p className="text-2xl font-bold">
                        {debtStats.totalDebts}
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Valor Total</p>
                      <p className="text-2xl font-bold text-red-600">
                        R$ {debtStats.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Juros Médio</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {debtStats.averageInterest.toFixed(1)}%
                      </p>
                    </div>
                    <Percent className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Mínimo Mensal</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        R$ {debtStats.monthlyMinimum.toFixed(2)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {debtStats.activeDebts}
                    </div>
                    <div className="text-sm text-gray-600">Ativas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {debtStats.negotiatingDebts}
                    </div>
                    <div className="text-sm text-gray-600">Negociando</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {debtStats.paidDebts}
                    </div>
                    <div className="text-sm text-gray-600">Pagas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {debts.filter((d) => d.status === "defaulted").length}
                    </div>
                    <div className="text-sm text-gray-600">Inadimplentes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => setShowAddForm(true)} className="h-20">
                    <div className="text-center">
                      <Plus className="w-6 h-6 mx-auto mb-2" />
                      <div>Nova Dívida</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20"
                    disabled={debts.length === 0}
                    onClick={() => {
                      if (debts.length > 0) {
                        setSelectedDebt(debts[0]);
                        setNegotiationData({
                          type: "discount",
                          description: "",
                          originalAmount: debts[0].currentAmount,
                          negotiatedAmount: 0,
                          installments: 1,
                          newInterestRate: 0,
                          contactPerson: "",
                          notes: "",
                        });
                        setShowNegotiationForm(true);
                      } else {
                        toast.error(
                          "Adicione pelo menos uma dívida para negociar",
                        );
                      }
                    }}
                  >
                    <div className="text-center">
                      <Phone className="w-6 h-6 mx-auto mb-2" />
                      <div>Negociar</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20"
                    disabled={debts.length === 0}
                    onClick={() => {
                      if (debts.length > 0) {
                        setSelectedDebt(debts[0]);
                        setPaymentData({
                          amount: debts[0].minimumPayment,
                          type: "minimum",
                          method: "pix",
                          notes: "",
                        });
                        setShowPaymentForm(true);
                      } else {
                        toast.error(
                          "Adicione pelo menos uma dívida para registrar pagamento",
                        );
                      }
                    }}
                  >
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 mx-auto mb-2" />
                      <div>Registrar Pagamento</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts">
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Dívida
                </Button>
              </div>

              <div className="flex gap-2">
                <Select
                  value={filter}
                  onValueChange={(value: any) => setFilter(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="negotiating">Negociando</SelectItem>
                    <SelectItem value="paid">Pagas</SelectItem>
                    <SelectItem value="defaulted">Inadimplentes</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Prioridade</SelectItem>
                    <SelectItem value="amount">Valor</SelectItem>
                    <SelectItem value="interest">Juros</SelectItem>
                    <SelectItem value="dueDate">Vencimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Debts List */}
            <div className="space-y-4">
              {filteredDebts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma dívida encontrada</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowAddForm(true)}
                    >
                      Adicionar Primeira Dívida
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredDebts.map((debt) => {
                  const payoffScenarios = calculatePayoffScenarios(debt);
                  const progressPercentage =
                    debt.originalAmount > 0
                      ? ((debt.originalAmount - debt.currentAmount) /
                          debt.originalAmount) *
                        100
                      : 0;

                  return (
                    <Card key={debt.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {debt.creditor}
                              </h3>
                              <Badge className={statusColors[debt.status]}>
                                {debt.status === "active"
                                  ? "Ativa"
                                  : debt.status === "negotiating"
                                    ? "Negociando"
                                    : debt.status === "paid"
                                      ? "Paga"
                                      : "Inadimplente"}
                              </Badge>
                              <Badge className={priorityColors[debt.priority]}>
                                {debt.priority === "high"
                                  ? "Alta"
                                  : debt.priority === "medium"
                                    ? "Média"
                                    : "Baixa"}
                              </Badge>
                            </div>

                            {debt.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {debt.description}
                              </p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">
                                  Valor Atual:
                                </span>
                                <div className="font-semibold text-red-600">
                                  R$ {debt.currentAmount.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Juros:</span>
                                <div className="font-semibold">
                                  {debt.interestRate}% a.m.
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Mínimo:</span>
                                <div className="font-semibold">
                                  R$ {debt.minimumPayment.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Vencimento:
                                </span>
                                <div className="font-semibold">
                                  {new Date(debt.dueDate).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progresso do Pagamento</span>
                                <span>{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress
                                value={progressPercentage}
                                className="h-2"
                              />
                            </div>

                            {/* Payoff Scenarios */}
                            {payoffScenarios.length > 0 && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-sm mb-2">
                                  Cenários de Quitação:
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  {payoffScenarios.map((scenario, index) => (
                                    <div
                                      key={`payment-${index}`}
                                      className="flex justify-between"
                                    >
                                      <span>{scenario.name}:</span>
                                      <span>
                                        {scenario.months} meses (R${" "}
                                        {scenario.totalPaid.toFixed(2)})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              title="Registrar Pagamento"
                              onClick={() => {
                                setSelectedDebt(debt);
                                setPaymentData({
                                  ...paymentData,
                                  amount: debt.minimumPayment,
                                });
                                setShowPaymentForm(true);
                              }}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              title="Negociar Dívida"
                              onClick={() => {
                                setSelectedDebt(debt);
                                setNegotiationData({
                                  type: "discount",
                                  description: "",
                                  originalAmount: debt.currentAmount,
                                  negotiatedAmount: 0,
                                  installments: 1,
                                  newInterestRate: 0,
                                  contactPerson: "",
                                  notes: "",
                                });
                                setShowNegotiationForm(true);
                              }}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDebt(debt)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDebt(debt.id)}
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

        {/* Negotiations Tab */}
        <TabsContent value="negotiations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Negociações</CardTitle>
              </CardHeader>
              <CardContent>
                {debts.some((debt) => debt.negotiationHistory.length > 0) ? (
                  <div className="space-y-4">
                    {debts.map(
                      (debt) =>
                        debt.negotiationHistory.length > 0 && (
                          <div key={debt.id} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-3">
                              {debt.creditor}
                            </h4>
                            <div className="space-y-2">
                              {debt.negotiationHistory.map((negotiation) => (
                                <div
                                  key={negotiation.id}
                                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {negotiation.description}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {new Date(
                                        negotiation.date,
                                      ).toLocaleDateString("pt-BR")}{" "}
                                      -
                                      {negotiation.type === "discount"
                                        ? "Desconto"
                                        : negotiation.type === "installment"
                                          ? "Parcelamento"
                                          : negotiation.type ===
                                              "interest_reduction"
                                            ? "Redução de Juros"
                                            : "Plano de Pagamento"}
                                    </div>
                                  </div>
                                  <Badge
                                    className={
                                      negotiation.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : negotiation.status === "rejected"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {negotiation.status === "accepted"
                                      ? "Aceita"
                                      : negotiation.status === "rejected"
                                        ? "Rejeitada"
                                        : "Pendente"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Nenhuma negociação registrada
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Dívidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Distribuição por Categoria
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(categoryLabels).map(([key, label]) => {
                        const categoryDebts = debts.filter(
                          (d) => d.category === key,
                        );
                        const categoryAmount = categoryDebts.reduce(
                          (sum, d) => sum + d.currentAmount,
                          0,
                        );
                        const percentage =
                          debtStats.totalAmount > 0
                            ? (categoryAmount / debtStats.totalAmount) * 100
                            : 0;

                        return (
                          <div
                            key={key}
                            className="flex justify-between items-center"
                          >
                            <span>{label}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Estratégias de Pagamento
                    </h4>
                    <div className="space-y-3">
                      <Alert>
                        <TrendingDown className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Avalanche:</strong> Pague primeiro as dívidas
                          com maior taxa de juros para economizar mais dinheiro.
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Target className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Bola de Neve:</strong> Pague primeiro as
                          menores dívidas para ganhar momentum psicológico.
                        </AlertDescription>
                      </Alert>

                      <Alert>
                        <Calculator className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Negociação:</strong> Entre em contato com
                          credores para tentar descontos ou melhores condições.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Debt Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingDebt ? "Editar Dívida" : "Nova Dívida"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDebt(null);
                    resetDebtForm();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credor *</Label>
                  <Input
                    value={debtFormData.creditor || ""}
                    onChange={(e) =>
                      setDebtFormData({
                        ...debtFormData,
                        creditor: e.target.value,
                      })
                    }
                    placeholder="Nome do credor"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={debtFormData.category}
                    onValueChange={(value: any) =>
                      setDebtFormData({ ...debtFormData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">
                        Cartão de Crédito
                      </SelectItem>
                      <SelectItem value="loan">Empréstimo</SelectItem>
                      <SelectItem value="financing">Financiamento</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor Original *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtFormData.originalAmount || ""}
                    onChange={(e) =>
                      setDebtFormData({
                        ...debtFormData,
                        originalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Atual</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtFormData.currentAmount || ""}
                    onChange={(e) =>
                      setDebtFormData({
                        ...debtFormData,
                        currentAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Juros (% a.m.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtFormData.interestRate || ""}
                    onChange={(e) =>
                      setDebtFormData({
                        ...debtFormData,
                        interestRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pagamento Mínimo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtFormData.minimumPayment || ""}
                    onChange={(e) =>
                      setDebtFormData({
                        ...debtFormData,
                        minimumPayment: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Vencimento *</Label>
                  <DatePicker
                    value={debtFormData.dueDate || ""}
                    onChange={(value) =>
                      setDebtFormData({ ...debtFormData, dueDate: value })
                    }
                    placeholder="Selecionar data de vencimento"
                    minDate={new Date()}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={debtFormData.priority}
                    onValueChange={(value: any) =>
                      setDebtFormData({ ...debtFormData, priority: value })
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
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={debtFormData.description || ""}
                  onChange={(e) =>
                    setDebtFormData({
                      ...debtFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detalhes adicionais sobre a dívida..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Informações de Contato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={debtFormData.contactInfo?.phone || ""}
                      onChange={(e) =>
                        setDebtFormData({
                          ...debtFormData,
                          contactInfo: {
                            ...debtFormData.contactInfo,
                            phone: e.target.value,
                          },
                        })
                      }
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={debtFormData.contactInfo?.email || ""}
                      onChange={(e) =>
                        setDebtFormData({
                          ...debtFormData,
                          contactInfo: {
                            ...debtFormData.contactInfo,
                            email: e.target.value,
                          },
                        })
                      }
                      placeholder="contato@credor.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDebt(null);
                    resetDebtForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveDebt}>
                  {editingDebt ? "Atualizar" : "Adicionar"} Dívida
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiationForm && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nova Negociação - {selectedDebt.creditor}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNegotiationForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Negociação</Label>
                <Select
                  value={negotiationData.type}
                  onValueChange={(value: any) =>
                    setNegotiationData({ ...negotiationData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="installment">Parcelamento</SelectItem>
                    <SelectItem value="interest_reduction">
                      Redução de Juros
                    </SelectItem>
                    <SelectItem value="payment_plan">
                      Plano de Pagamento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Textarea
                  value={negotiationData.description || ""}
                  onChange={(e) =>
                    setNegotiationData({
                      ...negotiationData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descreva os detalhes da negociação..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Original</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={
                      negotiationData.originalAmount ||
                      selectedDebt.currentAmount
                    }
                    onChange={(e) =>
                      setNegotiationData({
                        ...negotiationData,
                        originalAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor Negociado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={negotiationData.negotiatedAmount || ""}
                    onChange={(e) =>
                      setNegotiationData({
                        ...negotiationData,
                        negotiatedAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {negotiationData.type === "installment" && (
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    value={negotiationData.installments || 1}
                    onChange={(e) =>
                      setNegotiationData({
                        ...negotiationData,
                        installments: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                  />
                </div>
              )}

              {negotiationData.type === "interest_reduction" && (
                <div className="space-y-2">
                  <Label>Nova Taxa de Juros (% a.m.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={negotiationData.newInterestRate || ""}
                    onChange={(e) =>
                      setNegotiationData({
                        ...negotiationData,
                        newInterestRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Pessoa de Contato</Label>
                <Input
                  value={negotiationData.contactPerson || ""}
                  onChange={(e) =>
                    setNegotiationData({
                      ...negotiationData,
                      contactPerson: e.target.value,
                    })
                  }
                  placeholder="Nome do atendente"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={negotiationData.notes || ""}
                  onChange={(e) =>
                    setNegotiationData({
                      ...negotiationData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNegotiationForm(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddNegotiation}>
                  Registrar Negociação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Registrar Pagamento - {selectedDebt.creditor}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Saldo Atual:</div>
                <div className="text-2xl font-bold text-red-600">
                  R$ {selectedDebt.currentAmount.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor do Pagamento *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentData.amount || ""}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Pagamento</Label>
                  <Select
                    value={paymentData.type}
                    onValueChange={(value: any) =>
                      setPaymentData({ ...paymentData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimum">Mínimo</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                      <SelectItem value="full">Quitação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select
                    value={paymentData.method}
                    onValueChange={(value: any) =>
                      setPaymentData({ ...paymentData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={paymentData.notes || ""}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                  placeholder="Observações sobre o pagamento..."
                  rows={2}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentForm(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddPayment}>Registrar Pagamento</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
