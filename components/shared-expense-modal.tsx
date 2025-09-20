"use client";

import React, { useState, useEffect } from "react";
import { UnifiedFinancialSystem } from "../lib/unified-financial-system";
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
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { DatePicker } from "./ui/date-picker";
import { Users, X, Plus } from "lucide-react";
// storage removido
import { toast } from "sonner";

interface SharedExpenseModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function SharedExpenseModal({
  onClose,
  onSave,
}: SharedExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    account: "",
    date: new Date().toISOString().split("T")[0],
    splitType: "equal",
    participants: [] as string[],
    newParticipant: "",
    newParticipantName: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Membros da família pré-cadastrados
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const financialSystem = UnifiedFinancialSystem.getInstance();
    const contacts = await financialSystem.getContacts();
        setFamilyMembers(contacts || []);
      } catch {
        setFamilyMembers([]);
      }
    })();
  }, []);

  const categories = [
    "Alimentação",
    "Transporte",
    "Hospedagem",
    "Entretenimento",
    "Compras",
    "Serviços",
    "Outros",
  ];

  const accounts = [
    "Conta Corrente",
    "Poupança",
    "Carteira",
    "Cartão Nubank",
    "Cartão Itaú",
  ];

  const addParticipant = (identifier: string, name?: string) => {
    // Se é um ID existente, adiciona diretamente
    const existingMember = familyMembers.find((m) => m.id === identifier);
    if (existingMember && !formData.participants.includes(identifier)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, identifier],
      });
      return;
    }

    // Se é um novo participante (email/nome), cria um novo membro
    if (identifier && name && !formData.participants.includes(identifier)) {
      const newMember = {
        id: Date.now().toString(),
        name: name,
        email: identifier.includes("@") ? identifier : "",
        relationship: "Outro",
        color: "#3B82F6",
      };
      const updatedMembers = [...familyMembers, newMember];
      setFamilyMembers(updatedMembers);

      // Adiciona o ID do novo membro aos participantes
      setFormData({
        ...formData,
        participants: [...formData.participants, newMember.id],
        newParticipant: "",
        newParticipantName: "",
      });
    }
  };

  const removeParticipant = (identifier: string) => {
    setFormData({
      ...formData,
      participants: formData.participants.filter((p) => p !== identifier),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const amount = Number.parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Por favor, insira um valor válido");
        return;
      }

      if (formData.participants.length === 0) {
        toast.error("Adicione pelo menos um participante");
        return;
      }

      const totalParticipants = formData.participants.length + 1; // +1 para o usuário atual
      const myShare =
        formData.splitType === "equal" ? amount / totalParticipants : amount;

      const payload = {
        description: formData.description,
        amount: -amount,
        type: "shared",
        category: formData.category,
        accountId: formData.account,
        date: formData.date,
        notes: formData.notes,
        sharedWith: formData.participants,
        myShare: -myShare,
      };

      const financialSystem = UnifiedFinancialSystem.getInstance();
    await financialSystem.createTransaction(payload);

      toast.success("Despesa compartilhada criada com sucesso!");
      toast.info(
        `Participantes serão notificados: ${formData.participants.join(", ")}`,
      );

      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar despesa compartilhada");
    } finally {
      setIsLoading(false);
    }
  };

  const totalParticipants = formData.participants.length + 1;
  const amountPerPerson = formData.amount
    ? (Number.parseFloat(formData.amount) / totalParticipants).toFixed(2)
    : "0.00";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Nova Despesa Compartilhada
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Informações da Despesa
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor Total *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Data *</Label>
                <DatePicker
                  id="date"
                  value={formData.date}
                  onChange={(value) =>
                    setFormData({ ...formData, date: value })
                  }
                  placeholder="Selecionar data"
                  maxDate={new Date()}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Ex: Jantar no restaurante, Uber para o aeroporto..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category && category.trim() !== "")
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account">Pago com *</Label>
                <Select
                  value={formData.account}
                  onValueChange={(value) =>
                    setFormData({ ...formData, account: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Participantes
            </h3>

            {/* Membros da Família */}
            <div>
              <Label>Membros da Família</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {familyMembers.map((member) => {
                  return (
                    <Button
                      key={member.id}
                      type="button"
                      variant={
                        formData.participants.includes(member.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        formData.participants.includes(member.id)
                          ? removeParticipant(member.id)
                          : addParticipant(member.id, member.name)
                      }
                    >
                      {member.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Adicionar Novo Participante */}
            <div>
              <Label>Adicionar Novo Participante</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  placeholder="Nome"
                  value={formData.newParticipantName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      newParticipantName: e.target.value,
                    })
                  }
                />
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.newParticipant}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        newParticipant: e.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addParticipant(
                        formData.newParticipant,
                        formData.newParticipantName,
                      )
                    }
                    disabled={
                      !formData.newParticipant || !formData.newParticipantName
                    }
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Participantes Selecionados */}
            {formData.participants.length > 0 && (
              <div>
                <Label>Participantes Selecionados</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Você</Badge>
                  {formData.participants.map((participantId) => {
                    const member = familyMembers.find(
                      (m) => m.id === participantId,
                    );
                    return (
                      <Badge
                        key={participantId}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {member?.name || participantId}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeParticipant(participantId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Divisão */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Como Dividir
            </h3>
            <RadioGroup
              value={formData.splitType}
              onValueChange={(value) =>
                setFormData({ ...formData, splitType: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="equal" id="equal" />
                <Label htmlFor="equal">Dividir igualmente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage">Por porcentagem</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amount" id="amount" />
                <Label htmlFor="amount">Por valor específico</Label>
              </div>
            </RadioGroup>

            {/* Preview da Divisão */}
            {formData.amount &&
              totalParticipants > 1 &&
              formData.splitType === "equal" && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">
                    Divisão Igual
                  </p>
                  <p className="text-sm text-purple-600">
                    R$ {amountPerPerson} por pessoa ({totalParticipants}{" "}
                    participantes)
                  </p>
                </div>
              )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a despesa..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={formData.participants.length === 0 || isLoading}
            >
              {isLoading ? "Criando..." : "Criar Despesa Compartilhada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
