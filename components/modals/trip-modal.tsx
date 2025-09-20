"use client";

import { useState } from "react";
import { logComponents } from "../../lib/logger";
import { useTrips } from "../../contexts/unified-context";
import { toast } from "sonner";
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
import { Progress } from "../ui/progress";
import { Plane, MapPin, Calendar, DollarSign, Users } from "lucide-react";

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function TripModal({ isOpen, onClose, initialData }: TripModalProps) {
  const [loading, setLoading] = useState(false);
  const { create: createTrip, update: updateTrip } = useTrips();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    destination: initialData?.destination || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    budget: initialData?.budget || "",
    spent: initialData?.spent || "0",
    currency: initialData?.currency || "BRL",
    travelers: initialData?.travelers || "1",
    status: initialData?.status || "planejamento",
    notes: initialData?.notes || "",
    categories: initialData?.categories || {
      accommodation: "",
      transport: "",
      food: "",
      activities: "",
      shopping: "",
      other: "",
    },
  });

  const statuses = [
    { value: "planejamento", label: "Planejamento", color: "text-blue-600" },
    { value: "andamento", label: "Em Andamento", color: "text-green-600" },
    { value: "finalizada", label: "Finalizada", color: "text-gray-600" },
    { value: "cancelada", label: "Cancelada", color: "text-red-600" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar dados da viagem
      const tripData = {
        name: formData.name,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: parseFloat(formData.budget) || 0,
        spent: parseFloat(formData.spent) || 0,
        currency: formData.currency,
        travelers: parseInt(formData.travelers) || 1,
        status: formData.status,
        notes: formData.notes,
        categories: formData.categories
      };

      // Salvar viagem usando o contexto unificado
      if (initialData?.id) {
        await updateTrip(initialData.id, tripData);
        toast.success('Viagem atualizada com sucesso!');
      } else {
        await createTrip(tripData);
        toast.success('Viagem criada com sucesso!');
      }

      onClose();
      setFormData({
        name: "",
        destination: "",
        startDate: "",
        endDate: "",
        budget: "",
        spent: "0",
        currency: "BRL",
        travelers: "1",
        status: "planejamento",
        notes: "",
        categories: {
          accommodation: "",
          transport: "",
          food: "",
          activities: "",
          shopping: "",
          other: "",
        },
      });
    } catch (error) {
      logComponents.error("Erro ao criar viagem:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBudgetUsed = () => {
    const budget = parseFloat(formData.budget) || 0;
    const spent = parseFloat(formData.spent) || 0;
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const budgetUsed = calculateBudgetUsed();
  const tripDays = calculateDays();
  const dailyBudget = formData.budget
    ? parseFloat(formData.budget) / Math.max(tripDays, 1)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            Nova Viagem
          </DialogTitle>
          <DialogDescription>
            Planeje uma nova viagem e controle seus gastos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Viagem</Label>
            <Input
              id="name"
              placeholder="Ex: Férias em Paris, Viagem de Negócios SP"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Destino */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              placeholder="Ex: Paris, França"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              required
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Informações da Viagem */}
          {tripDays > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Duração: {tripDays} dias</span>
                </div>
                {dailyBudget > 0 && (
                  <span>Orçamento diário: R$ {dailyBudget.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}

          {/* Moeda da Viagem */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moeda da Viagem</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData({ ...formData, currency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">🇧🇷 Real (BRL)</SelectItem>
                <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                <SelectItem value="GBP">🇬🇧 Libra (GBP)</SelectItem>
                <SelectItem value="JPY">🇯🇵 Iene (JPY)</SelectItem>
                <SelectItem value="CAD">🇨🇦 Dólar Canadense (CAD)</SelectItem>
                <SelectItem value="AUD">🇦🇺 Dólar Australiano (AUD)</SelectItem>
                <SelectItem value="CHF">🇨🇭 Franco Suíço (CHF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orçamento e Gastos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento Total ({formData.currency})</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spent">Gasto Atual ({formData.currency})</Label>
              <Input
                id="spent"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.spent}
                onChange={(e) =>
                  setFormData({ ...formData, spent: e.target.value })
                }
              />
            </div>
          </div>

          {/* Progresso do Orçamento */}
          {formData.budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Orçamento Usado</span>
                <span
                  className={`font-medium ${budgetUsed > 100 ? "text-red-600" : "text-green-600"}`}
                >
                  {budgetUsed.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>R$ {parseFloat(formData.spent || "0").toFixed(2)}</span>
                <span>R$ {parseFloat(formData.budget || "0").toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Número de Viajantes */}
          <div className="space-y-2">
            <Label htmlFor="travelers">Número de Viajantes</Label>
            <Input
              id="travelers"
              type="number"
              min="1"
              value={formData.travelers}
              onChange={(e) =>
                setFormData({ ...formData, travelers: e.target.value })
              }
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status da Viagem</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <span className={status.color}>{status.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orçamento por Categoria */}
          <div className="space-y-3">
            <Label>Orçamento por Categoria (opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="accommodation" className="text-xs">
                  Hospedagem
                </Label>
                <Input
                  id="accommodation"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.accommodation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        accommodation: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="transport" className="text-xs">
                  Transporte
                </Label>
                <Input
                  id="transport"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.transport}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        transport: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="food" className="text-xs">
                  Alimentação
                </Label>
                <Input
                  id="food"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.food}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        food: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="activities" className="text-xs">
                  Atividades
                </Label>
                <Input
                  id="activities"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.categories.activities}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categories: {
                        ...formData.categories,
                        activities: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Roteiro, lembretes, informações importantes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Viagem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
