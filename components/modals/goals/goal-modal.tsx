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
import { Calendar, Target, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useGoals } from "../../../contexts/unified-context";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from "../../../lib/utils/date-utils";
import { DatePicker } from "../ui/date-picker";

interface Goal {
  id?: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  priority: "low" | "medium" | "high";
}

interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}

export function GoalModal({ open, onOpenChange, goal }: GoalModalProps) {
  const { create, update } = useGoals();
  const [formData, setFormData] = useState<Goal>({
    name: "",
    description: "",
    target: 0,
    current: 0,
    deadline: "",
    category: "",
    priority: "medium",
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    } else {
      setFormData({
        name: "",
        description: "",
        target: 0,
        current: 0,
        deadline: getCurrentDateBR(),
        category: "",
        priority: "medium",
      });
    }
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.target || !formData.deadline) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validação de data
    if (!validateBRDate(formData.deadline)) {
      toast.error("Por favor, insira uma data válida no formato dd/mm/aaaa");
      return;
    }

    try {
      if (goal) {
        await actions.updateGoal(goal.id!, {
          name: formData.name,
          description: formData.description,
          target: formData.target,
          current: formData.current,
          deadline: convertBRDateToISO(formData.deadline),
          category: formData.category,
        });
      } else {
        await actions.addGoal({
          name: formData.name,
          description: formData.description,
          target: formData.target,
          current: formData.current,
          deadline: convertBRDateToISO(formData.deadline),
          category: formData.category,
        });
      }
      onOpenChange(false);
      toast.success(
        goal ? "Meta atualizada com sucesso!" : "Meta criada com sucesso!",
      );
    } catch (error) {
      toast.error("Erro ao salvar meta");
    }
  };

  const handleInputChange = (field: keyof Goal, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goal ? "Editar Meta" : "Nova Meta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Comprar um carro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva sua meta..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Valor Meta *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.target}
                  onChange={(e) =>
                    handleInputChange("target", parseFloat(e.target.value) || 0)
                  }
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Valor Atual</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.current}
                  onChange={(e) =>
                    handleInputChange(
                      "current",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Data Meta *</Label>
            <DatePicker
              value={formData.deadline}
              onChange={(value) => {
                handleInputChange("deadline", value || "");
              }}
              placeholder="dd/mm/aaaa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="veiculo">Veículo</SelectItem>
                  <SelectItem value="viagem">Viagem</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="emergencia">Emergência</SelectItem>
                  <SelectItem value="investimento">Investimento</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  handleInputChange("priority", value)
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">{goal ? "Atualizar" : "Criar"} Meta</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GoalModal;
