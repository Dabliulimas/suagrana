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
import { Separator } from "./ui/separator";
import { DatePicker } from "./ui/date-picker";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { type Account } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";

interface FutureInvoice {
  id: string;
  cardId: string;
  cardName: string;
  amount: number;
  dueDate: string;
  month: string; // YYYY-MM format
  description?: string;
  isPaid: boolean;
  isEstimated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FutureInvoicesManagerProps {
  onUpdate?: () => void;
}

export function FutureInvoicesManager({
  onUpdate,
}: FutureInvoicesManagerProps) {
  const [futureInvoices, setFutureInvoices] = useState<FutureInvoice[]>([]);
  const [cards, setCards] = useState<Account[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FutureInvoice | null>(
    null,
  );
  const [selectedCard, setSelectedCard] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    cardId: "",
    amount: "",
    dueDate: "",
    description: "",
    isEstimated: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load cards
    const accounts = accounts;
    const creditCards = accounts.filter((account) => account.type === "credit");
    setCards(creditCards);

    // Load future invoices from localStorage
    const savedInvoices = localStorage.getItem("futureInvoices");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedInvoices) {
      setFutureInvoices(JSON.parse(savedInvoices));
    }
  };

  const saveFutureInvoices = (invoices: FutureInvoice[]) => {
    localStorage.setItem("futureInvoices", JSON.stringify(invoices));
    setFutureInvoices(invoices);
  };

  const handleSaveInvoice = () => {
    if (!invoiceForm.cardId || !invoiceForm.amount || !invoiceForm.dueDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const card = cards.find((c) => c.id === invoiceForm.cardId);
    if (!card) {
      toast.error("Cartão não encontrado");
      return;
    }

    const dueDate = new Date(invoiceForm.dueDate);
    const month = dueDate.toISOString().slice(0, 7); // YYYY-MM

    const invoice: FutureInvoice = {
      id: editingInvoice?.id || Date.now().toString(),
      cardId: invoiceForm.cardId,
      cardName: card.name,
      amount: parseFloat(invoiceForm.amount),
      dueDate: invoiceForm.dueDate,
      month,
      description: invoiceForm.description,
      isPaid: editingInvoice?.isPaid || false,
      isEstimated: invoiceForm.isEstimated,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedInvoices: FutureInvoice[];
    if (editingInvoice) {
      updatedInvoices = futureInvoices.map((inv) =>
        inv.id === editingInvoice.id ? invoice : inv,
      );
      toast.success("Fatura atualizada com sucesso!");
    } else {
      updatedInvoices = [...futureInvoices, invoice];
      toast.success("Fatura futura adicionada com sucesso!");
    }

    saveFutureInvoices(updatedInvoices);
    resetForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updatedInvoices = futureInvoices.filter(
      (inv) => inv.id !== invoiceId,
    );
    saveFutureInvoices(updatedInvoices);
    toast.success("Fatura removida com sucesso!");
    onUpdate?.();
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    const updatedInvoices = futureInvoices.map((inv) =>
      inv.id === invoiceId
        ? { ...inv, isPaid: true, updatedAt: new Date().toISOString() }
        : inv,
    );
    saveFutureInvoices(updatedInvoices);
    toast.success("Fatura marcada como paga!");
    onUpdate?.();
  };

  const handleEditInvoice = (invoice: FutureInvoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      cardId: invoice.cardId,
      amount: invoice.amount.toString(),
      dueDate: invoice.dueDate,
      description: invoice.description || "",
      isEstimated: invoice.isEstimated,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setInvoiceForm({
      cardId: "",
      amount: "",
      dueDate: "",
      description: "",
      isEstimated: false,
    });
    setEditingInvoice(null);
  };

  const getFilteredInvoices = () => {
    let filtered = futureInvoices;

    if (selectedCard && selectedCard !== "all") {
      filtered = filtered.filter((inv) => inv.cardId === selectedCard);
    }

    // Aplicar filtro de período usando CustomDateFilter
    filtered = filterByPeriod(
      filtered,
      selectedPeriod,
      customStartDate,
      customEndDate,
      (invoice) => new Date(invoice.dueDate),
    );

    return filtered.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  };

  const getUniqueMonths = () => {
    const months = Array.from(new Set(futureInvoices.map((inv) => inv.month)));
    return months.sort().reverse();
  };

  const getUniqueYears = () => {
    const years = Array.from(
      new Set(futureInvoices.map((inv) => inv.month.split("-")[0])),
    );
    return years.sort().reverse();
  };

  const getTotalByMonth = (month: string) => {
    return futureInvoices
      .filter((inv) => inv.month === month && !inv.isPaid)
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getUpcomingInvoices = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return futureInvoices.filter((inv) => {
      const dueDate = new Date(inv.dueDate);
      return dueDate >= today && dueDate <= nextWeek && !inv.isPaid;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredInvoices = getFilteredInvoices();
  const upcomingInvoices = getUpcomingInvoices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Faturas Futuras
          </h3>
          <p className="text-sm text-gray-600">
            Gerencie faturas já conhecidas dos próximos meses
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
              Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? "Editar Fatura" : "Nova Fatura Futura"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="card">Cartão</Label>
                <Select
                  value={invoiceForm.cardId}
                  onValueChange={(value) =>
                    setInvoiceForm((prev) => ({ ...prev, cardId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards
                      .filter((card) => card.id && card.id.trim() !== "")
                      .map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Valor da Fatura (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <DatePicker
                  id="dueDate"
                  value={invoiceForm.dueDate}
                  onChange={(value) =>
                    setInvoiceForm((prev) => ({ ...prev, dueDate: value }))
                  }
                  placeholder="Selecionar data de vencimento"
                  minDate={new Date()}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={invoiceForm.description}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Fatura com compras de dezembro"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isEstimated"
                  checked={invoiceForm.isEstimated}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      isEstimated: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="isEstimated" className="text-sm">
                  Valor estimado (pode variar)
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveInvoice} className="flex-1">
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

      {/* Alertas de Vencimento */}
      {upcomingInvoices.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Faturas Vencendo Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium">{invoice.cardName}</p>
                    <p className="text-sm text-gray-500">
                      Vence em{" "}
                      {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      className="mt-1"
                    >
                      Marcar como Paga
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Cartão</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cartões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  {cards
                    .filter((card) => card.id && card.id.trim() !== "")
                    .map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filtros de Data</Label>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full justify-start"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Data */}
      {showFilters && (
        <CustomDateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
      )}

      {/* Lista de Faturas */}
      <div className="grid gap-4">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                {futureInvoices.length === 0
                  ? "Nenhuma fatura futura cadastrada"
                  : "Nenhuma fatura encontrada para os filtros selecionados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className={invoice.isPaid ? "bg-green-50 border-green-200" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{invoice.cardName}</h4>
                        {invoice.isEstimated && (
                          <Badge variant="outline" className="text-xs">
                            Estimado
                          </Badge>
                        )}
                        {invoice.isPaid && (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-600"
                          >
                            Pago
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Vence em{" "}
                        {new Date(invoice.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                      {invoice.description && (
                        <p className="text-xs text-gray-400">
                          {invoice.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${invoice.isPaid ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(invoice.month + "-01").toLocaleDateString(
                          "pt-BR",
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!invoice.isPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumo por Mês */}
      {getUniqueMonths().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getUniqueMonths()
                .slice(0, 6)
                .map((month) => {
                  const total = getTotalByMonth(month);
                  return (
                    <div
                      key={month}
                      className="text-center p-4 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-600">
                        {new Date(month + "-01").toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(total)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
