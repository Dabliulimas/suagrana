"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTransactions, useAccounts } from "../../contexts/unified-context";
import {
  X,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  Users,
  Plane,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { toast } from "sonner";
import { storage } from "../../lib/storage";
import { logComponents } from "../../lib/logger";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function TransactionModal({
  isOpen,
  onClose,
  initialData,
}: TransactionModalProps) {
  const { create: createTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // Carregar membros da família
  const loadFamilyMembers = () => {
    try {
      const saved = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      const allFamilyMembers = saved ? JSON.parse(saved) : [];
      setFamilyMembers(Array.isArray(allFamilyMembers) ? allFamilyMembers : []);
    } catch (error) {
      logComponents.error("Error loading family members:", error);
      setFamilyMembers([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFamilyMembers();
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    type: initialData?.type || "expense",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    accountId: initialData?.accountId || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
    isShared: false,
    selectedContacts: [] as string[],
    sharedPercentages: {} as Record<string, number>,
    tripId: "",
    isLinkedToTrip: false,
    isPaidBy: false,
    paidByPerson: "",
  });

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      type: "expense",
      amount: "",
      description: "",
      category: "",
      accountId: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      isShared: false,
      selectedContacts: [],
      sharedPercentages: {},
      tripId: "",
      isLinkedToTrip: false,
      isPaidBy: false,
      paidByPerson: "",
    });
    onClose();
  };

  const categories = {
    expense: [
      "Alimentação",
      "Transporte",
      "Moradia",
      "Saúde",
      "Educação",
      "Entretenimento",
      "Compras",
      "Serviços",
      "Outros",
    ],
    income: ["Salário", "Freelance", "Investimentos", "Vendas", "Outros"],
  };

  // Usar membros da família em vez de contatos hardcoded

  // Incluir viagens ativas e planejadas
  const allTrips = storage.getTrips() || [];
  const trips = allTrips.filter(trip => trip.status === 'active' || trip.status === 'planned');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Por favor, insira um valor válido");
        return;
      }

      const finalAmount = formData.type === "expense" ? -amount : amount;

      await createTransaction({
        description: formData.description,
        amount: finalAmount,
        type:
          formData.isShared && formData.type === "expense"
            ? "shared"
            : formData.type,
        category: formData.category,
        accountId: formData.accountId,
        date: formData.date,
        notes: formData.notes,
      });

      toast.success(
        `${formData.type === "income" ? "Receita" : "Despesa"} adicionada com sucesso!`,
      );
      handleClose();
    } catch (error) {
      logComponents.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Nova Transação
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova transação financeira ao seu controle
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={formData.type}
          onValueChange={(value) =>
            setFormData({ ...formData, type: value as any })
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Despesa
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  placeholder="Ex: Almoço no restaurante"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor (R$) *</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[formData.type as keyof typeof categories]?.map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="account">Conta *</Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          {account.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            {formData.type === "expense" && (
              <>
                {/* Compartilhar Despesa */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <Label htmlFor="isShared">Compartilhar Despesa</Label>
                      </div>
                      <Switch
                        id="isShared"
                        checked={formData.isShared}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isShared: checked })
                        }
                      />
                    </div>
                  </CardHeader>
                  {formData.isShared && (
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Selecionar Membros da Família</Label>
                        {familyMembers.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {familyMembers.map((member) => (
                              <div
                                key={member.id || member.name}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={member.id || member.name}
                                  checked={formData.selectedContacts.includes(
                                    member.name,
                                  )}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        selectedContacts: [
                                          ...formData.selectedContacts,
                                          member.name,
                                        ],
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selectedContacts:
                                          formData.selectedContacts.filter(
                                            (name) => name !== member.name,
                                          ),
                                      });
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={member.id || member.name}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <Avatar className="w-4 h-4">
                                    <AvatarFallback
                                      className="text-xs"
                                      style={{
                                        backgroundColor:
                                          member.color || "#3B82F6",
                                      }}
                                    >
                                      {member.name
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {member.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              Nenhum membro da família encontrado
                            </p>
                            <p className="text-xs">
                              Vá para a página Família para adicionar membros
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pago por */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="isPaidBy">Pago por</Label>
                        </div>
                        <Switch
                          id="isPaidBy"
                          checked={formData.isPaidBy}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isPaidBy: checked })
                          }
                        />
                      </div>

                      {formData.isPaidBy && (
                        <div>
                          <Label>Quem pagou?</Label>
                          <Select
                            value={formData.paidByPerson}
                            onValueChange={(value) =>
                              setFormData({ ...formData, paidByPerson: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione quem pagou" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Eu">Eu</SelectItem>
                              {familyMembers.map((member) => (
                                <SelectItem
                                  key={member.id || member.name}
                                  value={member.name}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-4 h-4">
                                      <AvatarFallback
                                        className="text-xs"
                                        style={{
                                          backgroundColor:
                                            member.color || "#3B82F6",
                                        }}
                                      >
                                        {member.name
                                          .split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {member.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {/* Vincular à Viagem */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-blue-600" />
                        <Label htmlFor="isLinkedToTrip">
                          Vincular à Viagem
                        </Label>
                      </div>
                      <Switch
                        id="isLinkedToTrip"
                        checked={formData.isLinkedToTrip}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isLinkedToTrip: checked })
                        }
                      />
                    </div>
                  </CardHeader>
                  {formData.isLinkedToTrip && (
                    <CardContent>
                      <Label htmlFor="tripId">Selecionar Viagem</Label>
                      <Select
                        value={formData.tripId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, tripId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma viagem" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.length > 0 ? (
                            trips.map((trip) => (
                              <SelectItem key={trip.id} value={trip.id}>
                                {trip.name} - {trip.destination}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-trips" disabled>
                              Nenhuma viagem ativa ou planejada
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  )}
                </Card>
              </>
            )}

            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Transação"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
