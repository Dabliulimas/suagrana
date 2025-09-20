"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { DatePicker } from "../ui/date-picker";
import {
  Users,
  DollarSign,
  Calendar,
  Trash2,
  Plus,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { storage } from "../../../lib/storage";
import type { SharedDebt } from "../../../lib/storage/storage";
import { useSimpleFinancial } from "../../../contexts/simple-financial-context";
import { ContactManager } from "./contact-manager";

interface Participant {
  id: string;
  name: string;
  email?: string;
  amount: number;
  paid: boolean;
}

interface SharedExpense {
  id?: string;
  title: string;
  description?: string;
  totalAmount: number;
  date: string;
  category: string;
  participants: Participant[];
  paidBy: string;
  splitMethod: "equal" | "custom" | "percentage" | "debt";
  status: "pending" | "settled" | "partial";
  debtInfo?: {
    creditorId: string;
    creditorName: string;
    isDebtPayment: boolean;
  };
}

interface SharedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: SharedExpense) => void;
  expense?: SharedExpense;
}

export function SharedExpenseModal({
  isOpen,
  onClose,
  onSave,
  expense,
}: SharedExpenseModalProps) {
  const [formData, setFormData] = useState<SharedExpense>({
    title: "",
    description: "",
    totalAmount: 0,
    date: new Date().toISOString().split("T")[0],
    category: "",
    participants: [],
    paidBy: "",
    splitMethod: "equal",
    status: "pending",
  });

  const [newParticipant, setNewParticipant] = useState({ name: "", email: "" });
  const [showContactManager, setShowContactManager] = useState(false);

  // Use unified contact system
  const { state: simpleState } = useSimpleFinancial();
  const contacts = simpleState.contacts;

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        title: "",
        description: "",
        totalAmount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "",
        participants: [],
        paidBy: "",
        splitMethod: "equal",
        status: "pending",
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.title || !formData.totalAmount || formData.totalAmount <= 0) {
      toast.error("Título e valor total são obrigatórios");
      return;
    }

    // Validação específica para método de divisão 'debt'
    if (formData.splitMethod === "debt") {
      if (!formData.debtInfo?.creditor) {
        toast.error("Selecione o credor para o pagamento de dívida");
        return;
      }

      // Processar pagamento de dívida
      const currentUser = "Usuário Atual"; // TODO: Pegar do contexto de usuário
      const result = storage.processDebtPayment(
        formData.debtInfo.creditor,
        currentUser,
        formData.totalAmount,
        formData.title,
      );

      // Criar notificações baseadas no resultado
      if (result.paidDebts.length > 0) {
        const totalPaid = result.paidDebts.reduce(
          (sum, debt) => sum + (debt.originalAmount - debt.currentAmount),
          0,
        );
        toast.success(`Dívidas quitadas: R$ ${totalPaid.toFixed(2)}`);
      }

      if (result.newDebt) {
        toast.info(
          `Nova dívida criada: ${result.newDebt.creditor} deve R$ ${result.newDebt.currentAmount.toFixed(2)} para ${result.newDebt.debtor}`,
        );
      }

      if (result.remainingAmount === 0 && result.paidDebts.length === 0) {
        // Criar nova dívida se não havia dívidas anteriores
        storage.saveSharedDebt({
          creditor: formData.debtInfo.creditor,
          debtor: currentUser,
          originalAmount: formData.totalAmount,
          currentAmount: formData.totalAmount,
          description: formData.title,
          status: "active",
        });
        toast.success(
          `Dívida registrada: ${currentUser} deve R$ ${formData.totalAmount.toFixed(2)} para ${formData.debtInfo.creditor}`,
        );
      }
    } else {
      // Validação para outros métodos de divisão
      if (formData.participants.length === 0) {
        toast.error("Adicione pelo menos um participante");
        return;
      }

      if (formData.splitMethod === "custom") {
        const totalCustom = formData.participants.reduce(
          (sum, p) => sum + p.amount,
          0,
        );
        if (Math.abs(totalCustom - formData.totalAmount) > 0.01) {
          toast.error(
            "A soma dos valores personalizados deve ser igual ao valor total",
          );
          return;
        }
      }

      // Criar a despesa
      const expenseData: SharedExpense = {
        ...formData,
        id: expense?.id || `expense-${Date.now()}`,
      };

      onSave(expenseData);
      toast.success(expense ? "Despesa atualizada!" : "Despesa criada!");
    }

    onClose();
  };

  const handleInputChange = (field: keyof SharedExpense, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addParticipant = () => {
    if (!newParticipant.name) {
      toast.error("Nome do participante é obrigatório");
      return;
    }

    const participant: Participant = {
      id: Date.now().toString(),
      name: newParticipant.name,
      email: newParticipant.email,
      amount: 0,
      paid: false,
    };

    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, participant],
    }));

    setNewParticipant({ name: "", email: "" });
    calculateSplit();
  };

  const handleContactSelected = (contact: any) => {
    const participant: Participant = {
      id: Date.now().toString(),
      name: contact.name,
      email: contact.email,
      amount: 0,
      paid: false,
    };

    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, participant],
    }));

    setShowContactManager(false);
    calculateSplit();
  };

  const removeParticipant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
    }));
    calculateSplit();
  };

  const calculateSplit = () => {
    if (formData.splitMethod === "equal" && formData.participants.length > 0) {
      const amountPerPerson =
        formData.totalAmount / formData.participants.length;
      setFormData((prev) => ({
        ...prev,
        participants: prev.participants.map((p) => ({
          ...p,
          amount: amountPerPerson,
        })),
      }));
    }
  };

  const updateParticipantAmount = (id: string, amount: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === id ? { ...p, amount } : p,
      ),
    }));
  };

  const toggleParticipantPaid = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === id ? { ...p, paid: !p.paid } : p,
      ),
    }));
  };

  useEffect(() => {
    calculateSplit();
  }, [formData.totalAmount, formData.splitMethod]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {expense
              ? "Editar Despesa Compartilhada"
              : "Nova Despesa Compartilhada"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ex: Jantar no restaurante"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Valor Total *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    handleInputChange(
                      "totalAmount",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva a despesa..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <DatePicker
                id="date"
                value={formData.date}
                onChange={(value) => handleInputChange("date", value)}
                placeholder="Selecionar data"
                maxDate={new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="hospedagem">Hospedagem</SelectItem>
                  <SelectItem value="entretenimento">Entretenimento</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="splitMethod">Método de Divisão</Label>
              <Select
                value={formData.splitMethod}
                onValueChange={(value: "equal" | "custom" | "percentage") =>
                  handleInputChange("splitMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Igual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  <SelectItem value="percentage">Porcentagem</SelectItem>
                  <SelectItem value="debt">Pagamento de Dívida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção de Pagamento de Dívida */}
          {formData.splitMethod === "debt" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <Label className="text-blue-800 font-medium">
                  Pagamento de Dívida
                </Label>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="creditor">Para quem você deve *</Label>
                  <Select
                    value={formData.debtInfo?.creditorId || ""}
                    onValueChange={(value) => {
                      const creditor = contacts.find((c) => c.id === value);
                      handleInputChange("debtInfo", {
                        creditorId: value,
                        creditorName: creditor?.name || "",
                        isDebtPayment: true,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a pessoa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Como funciona:</strong> Este valor será
                    registrado como positivo para{" "}
                    {formData.debtInfo?.creditorName || "a pessoa selecionada"},
                    abatendo de dívidas existentes ou criando um crédito caso
                    não haja dívida prévia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Participantes - oculta para pagamento de dívidas */}
          {formData.splitMethod !== "debt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Participantes</Label>
                <Badge variant="secondary">
                  {formData.participants.length} participante(s)
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactManager(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Selecionar Contato
                </Button>
                <div className="flex gap-2 flex-1">
                  <Input
                    placeholder="Nome *"
                    value={newParticipant.name}
                    onChange={(e) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder="Email (opcional)"
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) =>
                      setNewParticipant((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                  <Button type="button" onClick={addParticipant}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {formData.participants.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 p-2 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{participant.name}</div>
                        {participant.email && (
                          <div className="text-sm text-muted-foreground">
                            {participant.email}
                          </div>
                        )}
                      </div>

                      {formData.splitMethod === "custom" && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={participant.amount}
                          onChange={(e) =>
                            updateParticipantAmount(
                              participant.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                          placeholder="0,00"
                        />
                      )}

                      <div className="text-sm font-medium">
                        R$ {participant.amount.toFixed(2)}
                      </div>

                      <Button
                        type="button"
                        variant={participant.paid ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleParticipantPaid(participant.id)}
                      >
                        {participant.paid ? "Pago" : "Pendente"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeParticipant(participant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {expense ? "Atualizar" : "Criar"} Despesa
            </Button>
          </div>
        </form>

        {/* Contact Manager Modal */}
        <ContactManager
          isOpen={showContactManager}
          onClose={() => setShowContactManager(false)}
          onContactSelected={handleContactSelected}
          selectionMode={true}
        />
      </DialogContent>
    </Dialog>
  );
}

export default SharedExpenseModal;
