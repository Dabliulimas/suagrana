"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useAccounts } from "../../../contexts/unified-context";
import { toast } from "sonner";

interface SimpleAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleAccountModal({
  open,
  onOpenChange,
}: SimpleAccountModalProps) {
  const { create } = useAccounts();
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as "checking" | "savings" | "credit" | "investment",
    balance: "",
    bank: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome da conta é obrigatório");
      return;
    }

    const balance = parseFloat(formData.balance) || 0;

    setIsLoading(true);

    try {
      await create({
        name: formData.name.trim(),
        type: formData.type,
        balance: balance,
        bank: formData.bank.trim() || undefined,
        description: formData.description.trim() || undefined,
      });

      toast.success("Conta criada com sucesso!");

      setFormData({
        name: "",
        type: "checking",
        balance: "",
        bank: "",
        description: "",
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta bancária ao seu sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Conta *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Ex: Conta Corrente Banco do Brasil"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Conta *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balance">Saldo Inicial *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, balance: e.target.value }))
              }
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="bank">Banco</Label>
            <Input
              id="bank"
              value={formData.bank}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bank: e.target.value }))
              }
              placeholder="Ex: Banco do Brasil"
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
              placeholder="Descrição opcional da conta"
              rows={3}
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
              {isLoading ? "Criando..." : "Criar Conta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SimpleAccountModal;
