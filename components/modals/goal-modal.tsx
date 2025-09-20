"use client";

import { useState } from "react";
import { logComponents } from "../../lib/logger";
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
import { Target, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function GoalModal({ isOpen, onClose, initialData }: GoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    target: initialData?.target || "",
    current: initialData?.current || "0",
    deadline: initialData?.deadline || "",
    priority: initialData?.priority || "medium",
    category: initialData?.category || "savings",
    monthlyContribution: initialData?.monthlyContribution || "",
  });

  const priorities = [
    { value: "high", label: "Alta Prioridade", color: "text-red-600" },
    { value: "medium", label: "Média Prioridade", color: "text-yellow-600" },
    { value: "low", label: "Baixa Prioridade", color: "text-green-600" },
  ];

  const categories = [
    { value: "savings", label: "Poupança" },
    { value: "emergency", label: "Reserva de Emergência" },
    { value: "investment", label: "Investimento" },
    { value: "purchase", label: "Compra" },
    { value: "travel", label: "Viagem" },
    { value: "education", label: "Educação" },
    { value: "retirement", label: "Aposentadoria" },
    { value: "other", label: "Outros" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento
  

      // Aqui você integraria com o sistema de dados real
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onClose();
      setFormData({
        name: "",
        description: "",
        target: "",
        current: "0",
        deadline: "",
        priority: "medium",
        category: "savings",
        monthlyContribution: "",
      });
    } catch (error) {
      logComponents.error("Erro ao criar meta:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const current = parseFloat(formData.current) || 0;
    const target = parseFloat(formData.target) || 0;
    return target > 0 ? (current / target) * 100 : 0;
  };

  const calculateMonthsToGoal = () => {
    const current = parseFloat(formData.current) || 0;
    const target = parseFloat(formData.target) || 0;
    const monthly = parseFloat(formData.monthlyContribution) || 0;

    if (monthly > 0 && target > current) {
      return Math.ceil((target - current) / monthly);
    }
    return null;
  };

  const progress = calculateProgress();
  const monthsToGoal = calculateMonthsToGoal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Nova Meta Financeira
          </DialogTitle>
          <DialogDescription>
            Defina uma nova meta financeira e acompanhe seu progresso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da Meta */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta</Label>
            <Input
              id="name"
              placeholder="Ex: Reserva de Emergência, Viagem para Europa"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva sua meta e motivação..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
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
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor Alvo */}
          <div className="space-y-2">
            <Label htmlFor="target">Valor Alvo (R$)</Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.target}
              onChange={(e) =>
                setFormData({ ...formData, target: e.target.value })
              }
              required
            />
          </div>

          {/* Valor Atual */}
          <div className="space-y-2">
            <Label htmlFor="current">Valor Atual (R$)</Label>
            <Input
              id="current"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.current}
              onChange={(e) =>
                setFormData({ ...formData, current: e.target.value })
              }
            />
          </div>

          {/* Progresso Visual */}
          {formData.target && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>R$ {parseFloat(formData.current || "0").toFixed(2)}</span>
                <span>R$ {parseFloat(formData.target || "0").toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Contribuição Mensal */}
          <div className="space-y-2">
            <Label htmlFor="monthlyContribution">
              Contribuição Mensal (R$)
            </Label>
            <Input
              id="monthlyContribution"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.monthlyContribution}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyContribution: e.target.value,
                })
              }
            />
          </div>

          {/* Estimativa de Tempo */}
          {monthsToGoal && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Estimativa: {monthsToGoal} meses para atingir a meta
                </span>
              </div>
            </div>
          )}

          {/* Prazo */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo (opcional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
