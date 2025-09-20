"use client";

import React, { useState } from "react";
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
import { DatePicker } from "../ui/date-picker";
import { Calendar, Target, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useGoals } from "../../../contexts/unified-context";

interface SimpleGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleGoalModal({ open, onOpenChange }: SimpleGoalModalProps) {
  const { create } = useGoals();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target: 0,
    current: 0,
    deadline: "",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.target || !formData.deadline) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await actions.addGoal({
        name: formData.name,
        description: formData.description,
        target: formData.target,
        current: formData.current,
        deadline: formData.deadline,
        category: formData.category,
      });

      onOpenChange(false);
      toast.success("Meta criada com sucesso!");

      setFormData({
        name: "",
        description: "",
        target: 0,
        current: 0,
        deadline: "",
        category: "",
      });
    } catch (error) {
      toast.error("Erro ao salvar meta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nova Meta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Comprar um carro"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Descreva sua meta..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
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
                    setFormData((prev) => ({
                      ...prev,
                      target: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
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
                    setFormData((prev) => ({
                      ...prev,
                      current: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Data Meta *</Label>
            <DatePicker
              id="deadline"
              value={formData.deadline}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, deadline: value }))
              }
              placeholder="Selecionar data meta"
              minDate={new Date()}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar Meta</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleGoalModal;
