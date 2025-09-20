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
import { Progress } from "./ui/progress";
import { DatePicker } from "./ui/date-picker";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  CheckCircle,
  Save,
  X,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { type Account } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { Installment } from "../types";

interface InstallmentsManagerProps {
  onUpdate?: () => void;
}

export function InstallmentsManager({ onUpdate }: InstallmentsManagerProps) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [cards, setCards] = useState<Account[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] =
    useState<Installment | null>(null);
  const [selectedCard, setSelectedCard] = useState("all");

  const [installmentForm, setInstallmentForm] = useState({
    cardId: "",
    description: "",
    totalAmount: "",
    installments: "",
    startDate: "",
    category: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load cards
    const accounts = accounts;
    const creditCards = accounts.filter((account) => account.type === "credit");
    setCards(creditCards);

    // Load installments from localStorage
    const savedInstallments = localStorage.getItem("installments");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedInstallments) {
      setInstallments(JSON.parse(savedInstallments));
    }
  };

  const saveInstallments = (newInstallments: Installment[]) => {
    localStorage.setItem("installments", JSON.stringify(newInstallments));
    setInstallments(newInstallments);
  };

  const calculateInstallmentDetails = (
    totalAmount: number,
    installments: number,
    startDate: string,
  ) => {
    const monthlyAmount = totalAmount / installments;
    const start = new Date(startDate);
    const end = new Date(
      start.getFullYear(),
      start.getMonth() + installments - 1,
      start.getDate(),
    );

    return {
      monthlyAmount,
      endDate: end.toISOString().split("T")[0],
    };
  };

  const handleSaveInstallment = () => {
    if (
      !installmentForm.cardId ||
      !installmentForm.description ||
      !installmentForm.totalAmount ||
      !installmentForm.installments ||
      !installmentForm.startDate
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const card = cards.find((c) => c.id === installmentForm.cardId);
    if (!card) {
      toast.error("Cartão não encontrado");
      return;
    }

    const totalAmount = parseFloat(installmentForm.totalAmount);
    const installmentsCount = parseInt(installmentForm.installments);
    const { monthlyAmount, endDate } = calculateInstallmentDetails(
      totalAmount,
      installmentsCount,
      installmentForm.startDate,
    );

    const installment: Installment = {
      id: editingInstallment?.id || Date.now().toString(),
      cardId: installmentForm.cardId,
      description: installmentForm.description,
      totalAmount,
      installments: installmentsCount,
      currentInstallment: editingInstallment?.currentInstallment || 1,
      monthlyAmount,
      startDate: installmentForm.startDate,
      endDate,
      remainingInstallments:
        editingInstallment?.remainingInstallments || installmentsCount,
      category: installmentForm.category,
      isActive: true,
      createdAt: editingInstallment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedInstallments: Installment[];
    if (editingInstallment) {
      updatedInstallments = installments.map((inst) =>
        inst.id === editingInstallment.id ? installment : inst,
      );
      toast.success("Parcelamento atualizado com sucesso!");
    } else {
      updatedInstallments = [...installments, installment];
      toast.success("Parcelamento adicionado com sucesso!");
    }

    saveInstallments(updatedInstallments);
    resetForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const handlePayInstallment = (installmentId: string) => {
    const updatedInstallments = installments.map((inst) => {
      if (inst.id === installmentId && inst.remainingInstallments > 0) {
        const newCurrent = inst.currentInstallment + 1;
        const newRemaining = inst.remainingInstallments - 1;

        return {
          ...inst,
          currentInstallment: newCurrent,
          remainingInstallments: newRemaining,
          isActive: newRemaining > 0,
          updatedAt: new Date().toISOString(),
        };
      }
      return inst;
    });

    saveInstallments(updatedInstallments);
    toast.success("Parcela paga com sucesso!");
    onUpdate?.();
  };

  const handleDeleteInstallment = (installmentId: string) => {
    const updatedInstallments = installments.filter(
      (inst) => inst.id !== installmentId,
    );
    saveInstallments(updatedInstallments);
    toast.success("Parcelamento removido com sucesso!");
    onUpdate?.();
  };

  const handleEditInstallment = (installment: Installment) => {
    setEditingInstallment(installment);
    setInstallmentForm({
      cardId: installment.cardId,
      description: installment.description,
      totalAmount: installment.totalAmount.toString(),
      installments: installment.installments.toString(),
      startDate: installment.startDate,
      category: installment.category,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setInstallmentForm({
      cardId: "",
      description: "",
      totalAmount: "",
      installments: "",
      startDate: "",
      category: "",
    });
    setEditingInstallment(null);
  };

  const getFilteredInstallments = () => {
    let filtered = installments;

    if (selectedCard && selectedCard !== "all") {
      filtered = filtered.filter((inst) => inst.cardId === selectedCard);
    }

    return filtered.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );
  };

  const getActiveInstallments = () => {
    return installments.filter((inst) => inst.isActive);
  };

  const getTotalMonthlyCommitment = () => {
    return getActiveInstallments().reduce(
      (sum, inst) => sum + inst.monthlyAmount,
      0,
    );
  };

  const getTotalRemainingAmount = () => {
    return getActiveInstallments().reduce(
      (sum, inst) => sum + inst.monthlyAmount * inst.remainingInstallments,
      0,
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredInstallments = getFilteredInstallments();
  const activeInstallments = getActiveInstallments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Parcelamentos
          </h3>
          <p className="text-sm text-gray-600">
            Gerencie compras parceladas e acompanhe o pagamento das parcelas
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
              Novo Parcelamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingInstallment
                  ? "Editar Parcelamento"
                  : "Novo Parcelamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="card">Cartão</Label>
                <Select
                  value={installmentForm.cardId}
                  onValueChange={(value) =>
                    setInstallmentForm((prev) => ({ ...prev, cardId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={installmentForm.description}
                  onChange={(e) =>
                    setInstallmentForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Notebook Dell"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={installmentForm.totalAmount}
                    onChange={(e) =>
                      setInstallmentForm((prev) => ({
                        ...prev,
                        totalAmount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    max="48"
                    value={installmentForm.installments}
                    onChange={(e) =>
                      setInstallmentForm((prev) => ({
                        ...prev,
                        installments: e.target.value,
                      }))
                    }
                    placeholder="12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startDate">Data da Primeira Parcela</Label>
                <DatePicker
                  id="startDate"
                  value={installmentForm.startDate}
                  onChange={(value) =>
                    setInstallmentForm((prev) => ({
                      ...prev,
                      startDate: value,
                    }))
                  }
                  placeholder="Selecionar data da primeira parcela"
                  minDate={new Date()}
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={installmentForm.category}
                  onValueChange={(value) =>
                    setInstallmentForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                    <SelectItem value="moveis">Móveis</SelectItem>
                    <SelectItem value="roupas">Roupas</SelectItem>
                    <SelectItem value="viagem">Viagem</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {installmentForm.totalAmount && installmentForm.installments && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Valor por parcela:</strong>{" "}
                    {formatCurrency(
                      parseFloat(installmentForm.totalAmount) /
                        parseInt(installmentForm.installments || "1"),
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveInstallment} className="flex-1">
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
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Parcelamentos Ativos
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {activeInstallments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Compromisso Mensal</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(getTotalMonthlyCommitment())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Total Restante</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(getTotalRemainingAmount())}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cartão</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cartões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Parcelamentos */}
      <div className="grid gap-4">
        {filteredInstallments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Nenhum parcelamento cadastrado
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInstallments.map((installment) => {
            const card = cards.find((c) => c.id === installment.cardId);
            const progress =
              ((installment.currentInstallment - 1) /
                installment.installments) *
              100;

            return (
              <Card
                key={installment.id}
                className={
                  !installment.isActive ? "bg-green-50 border-green-200" : ""
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {installment.description}
                          </h4>
                          {!installment.isActive && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-600"
                            >
                              Finalizado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {card?.name} • {installment.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(installment.monthlyAmount)}
                      </p>
                      <p className="text-xs text-gray-500">por mês</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>
                        Progresso: {installment.currentInstallment - 1}/
                        {installment.installments}
                      </span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium ml-2">
                          {formatCurrency(installment.totalAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Restante:</span>
                        <span className="font-medium ml-2">
                          {formatCurrency(
                            installment.monthlyAmount *
                              installment.remainingInstallments,
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Início:</span>
                        <span className="font-medium ml-2">
                          {new Date(installment.startDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fim:</span>
                        <span className="font-medium ml-2">
                          {new Date(installment.endDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {installment.isActive && (
                        <Button
                          size="sm"
                          onClick={() => handlePayInstallment(installment.id)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Pagar Parcela
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditInstallment(installment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteInstallment(installment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
}
