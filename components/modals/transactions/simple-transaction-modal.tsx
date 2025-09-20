"use client";

import React, { useState } from "react";
import { logComponents } from "../../../lib/logger";
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
import { useTransactions } from "../../../contexts/unified-context";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  getCurrentDateBR,
} from "../../../lib/utils/date-utils";
import { toast } from "sonner";

interface SimpleTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleTransactionModal({
  open,
  onOpenChange,
}: SimpleTransactionModalProps) {
  const { create } = useTransactions();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    account: "Dinheiro",
    date: getCurrentDateBR(),
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
  

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: formData.date || new Date().toISOString().split("T")[0],
        type: formData.type as "income" | "expense",
        category: formData.category || "Outros",
      };

      await create(transactionData);



      // Resetar formulário
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        date: "",
      });

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      logComponents.error("❌ Erro ao salvar transação:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Ex: Almoço, Salário..."
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
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "income" | "expense") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria *</Label>
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
                  {categories[formData.type].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data *</Label>
              <DatePicker
                id="date"
                value={convertBRDateToISO(formData.date)}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    date: convertISODateToBR(value),
                  }))
                }
                placeholder="Selecionar data"
                maxDate={new Date()}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observações opcionais..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleTransactionModal;
