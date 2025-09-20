"use client";

import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { DatePicker } from "../ui/date-picker";
import { DollarSign, Users, Plus, Plane, AlertCircle } from "lucide-react";
import type { Contact, Trip } from "../types";
import { toast } from "sonner";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from "../../../lib/utils/date-utils";
import { FamilySelector } from "../../features/family/family-selector";

interface TransactionModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    account: "",
    date: getCurrentDateBR(),
    notes: "",
    isShared: false,
    selectedContacts: [] as string[],
    sharedPercentages: {} as Record<string, number>,
    tripId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then((r) =>
        r.ok ? r.json().then((j) => j.contacts || []) : [],
      ),
      fetch("/api/trips").then((r) =>
        r.ok ? r.json().then((j) => j.trips || []) : [],
      ),
      fetch("/api/accounts").then((r) =>
        r.ok ? r.json().then((j) => j.accounts || []) : [],
      ),
    ])
      .then(([contactsData, tripsData, accountsData]) => {
        setContacts(contactsData);
        setTrips(tripsData);
        setAccounts(accountsData);
      })
      .catch(() => {
        setContacts([]);
        setTrips([]);
        setAccounts([]);
      });
  }, []);

  const categories = {
    income: ["Salário", "Freelance", "Investimentos", "Vendas", "Outros"],
    expense: [
      "Alimentação",
      "Transporte",
      "Moradia",
      "Saúde",
      "Educação",
      "Lazer",
      "Compras",
      "Outros",
    ],
  };

  const selectedContactsData = contacts.filter((c) =>
    formData.selectedContacts.includes(c.id),
  );

  // Inicializar percentuais quando contatos são selecionados
  useEffect(() => {
    if (formData.isShared && formData.selectedContacts.length > 0) {
      const newPercentages = { ...formData.sharedPercentages };

      // For shared expenses, default to equal split
      const totalParticipants = formData.selectedContacts.length + 1; // +1 for user
      const defaultPercentage =
        totalParticipants === 2 ? 50 : Math.floor(100 / totalParticipants);

      // Set default percentage for new contacts
      formData.selectedContacts.forEach((contactId) => {
        if (!newPercentages[contactId]) {
          newPercentages[contactId] = defaultPercentage;
        }
      });

      // Set user percentage
      if (!newPercentages["user"]) {
        newPercentages["user"] = defaultPercentage;
      }

      setFormData((prev) => ({ ...prev, sharedPercentages: newPercentages }));
    }
  }, [formData.selectedContacts, formData.isShared]);

  const handleContactSelectionChange = (contactIds: string[]) => {
    setFormData((prev) => ({ ...prev, selectedContacts: contactIds }));
  };

  const handlePercentageChange = (contactId: string, percentage: number) => {
    setFormData((prev) => ({
      ...prev,
      sharedPercentages: {
        ...prev.sharedPercentages,
        [contactId]: percentage,
      },
    }));
  };

  const getTotalPercentage = () => {
    return Object.values(formData.sharedPercentages).reduce(
      (sum, percentage) => sum + percentage,
      0,
    );
  };

  const getMyAmount = () => {
    const amount = Number.parseFloat(formData.amount) || 0;
    if (!formData.isShared) return amount;

    const myPercentage = formData.sharedPercentages["user"] || 0;
    return (amount * myPercentage) / 100;
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

      if (formData.isShared) {
        if (formData.selectedContacts.length === 0) {
          toast.error("Selecione pelo menos um contato para compartilhar");
          return;
        }

        const totalPercentage = getTotalPercentage();
        if (Math.abs(totalPercentage - 100) > 0.01) {
          toast.error(
            `A soma dos percentuais deve ser 100%. Atual: ${totalPercentage.toFixed(1)}%`,
          );
          return;
        }
      }

      // Converter tipo para formato do backend
      const backendType = formData.type === "income" ? "INCOME" : "EXPENSE";
      
      const payload = {
        description: formData.description,
        amount: amount, // Sempre positivo no backend
        type: backendType,
        category: formData.category,
        accountId: formData.account,
        date: convertBRDateToISO(formData.date),
        tags: [], // Array vazio por enquanto
        metadata: {
          notes: formData.notes,
          ...(formData.isShared && {
            sharedWith: formData.selectedContacts,
            sharedPercentages: formData.sharedPercentages,
          }),
          ...(formData.tripId && { tripId: formData.tripId }),
        },
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Erro ao criar transação" }));
        throw new Error(error || `HTTP ${res.status}`);
      }

      toast.success(
        formData.isShared
          ? "Despesa compartilhada criada com sucesso!"
          : "Transação adicionada com sucesso!",
      );

      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar transação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Nova Transação
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transação */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={formData.type === "income" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, type: "income" })}
                className="h-12"
              >
                💰 Receita
              </Button>
              <Button
                type="button"
                variant={formData.type === "expense" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className="h-12"
              >
                💸 Despesa
              </Button>
            </div>

            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  placeholder="Ex: Almoço no restaurante, Salário..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor *</Label>
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
                    value={convertBRDateToISO(formData.date)}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        date: convertISODateToBR(value),
                      })
                    }
                    placeholder="Selecionar data"
                    maxDate={new Date()}
                    required
                  />
                </div>
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
                      {categories[formData.type]
                        .filter(
                          (category) => category && category.trim() !== "",
                        )
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="account">Conta *</Label>
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
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vincular à Viagem */}
            {trips.length > 0 && formData.type === "expense" && (
              <div>
                <Label htmlFor="trip">Vincular à Viagem</Label>
                <Select
                  value={formData.tripId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tripId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma viagem (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4" />
                          {trip.name} - {trip.destination}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Compartilhamento */}
            {formData.type === "expense" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shared">Despesa Compartilhada</Label>
                  <Switch
                    id="shared"
                    checked={formData.isShared}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isShared: checked,
                        selectedContacts: checked
                          ? formData.selectedContacts
                          : [],
                        sharedPercentages: checked
                          ? formData.sharedPercentages
                          : {},
                      })
                    }
                  />
                </div>

                {formData.isShared && (
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Participantes
                        </h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowContactManager(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Gerenciar
                        </Button>
                      </div>

                      {/* Lista de Participantes */}
                      <div className="space-y-3">
                        {/* Usuário */}
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>EU</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">Você</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.sharedPercentages["user"] || 0}
                              onChange={(e) =>
                                handlePercentageChange(
                                  "user",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-20 text-center"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>

                        {/* Contatos Selecionados */}
                        {selectedContactsData.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {contact.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">
                                  {contact.name}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {contact.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={
                                  formData.sharedPercentages[contact.id] || 0
                                }
                                onChange={(e) =>
                                  handlePercentageChange(
                                    contact.id,
                                    Number.parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="w-20 text-center"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {formData.selectedContacts.length === 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const contactId = formData.selectedContacts[0];
                            setFormData((prev) => ({
                              ...prev,
                              sharedPercentages: {
                                user: 50,
                                [contactId]: 50,
                              },
                            }));
                          }}
                          className="w-full"
                        >
                          Dividir 50/50
                        </Button>
                      )}

                      {/* Resumo da Divisão */}
                      {formData.amount &&
                        formData.selectedContacts.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Total dos percentuais:
                                </span>
                                <Badge
                                  variant={
                                    getTotalPercentage() === 100
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {getTotalPercentage().toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">
                                  Sua parte:
                                </span>
                                <span className="font-medium text-blue-600">
                                  R$ {getMyAmount().toFixed(2)}
                                </span>
                              </div>
                              {getTotalPercentage() !== 100 && (
                                <div className="flex items-center gap-2 text-sm text-amber-600">
                                  <AlertCircle className="w-4 h-4" />
                                  Ajuste os percentuais para totalizar 100%
                                </div>
                              )}
                            </div>
                          </>
                        )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre a transação..."
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Transação"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {showContactManager && (
        <FamilySelector
          open={showContactManager}
          onOpenChange={setShowContactManager}
          selectedMembers={formData.selectedContacts}
          onSelectionChange={handleContactSelectionChange}
          onFamilyMemberCreated={async () => {
            try {
              const res = await fetch("/api/contacts");
              const data = res.ok ? await res.json() : { contacts: [] };
              setContacts(data.contacts || []);
            } catch {
              setContacts([]);
            }
          }}
        />
      )}
    </>
  );
}
