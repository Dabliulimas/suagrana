"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { toast } from "sonner";
import { type Account } from "../lib/data-layer/types";
import {
  validateRequiredString,
  validatePositiveNumber,
  sanitizeString,
  sanitizeNumber,
} from "../lib/validation";
import { useLogger } from "../lib/logger";
import { useAccounts } from "../contexts/unified-context";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

export function AddAccountModal({
  open,
  onClose,
  onAccountAdded,
}: AddAccountModalProps) {
  const { create } = useAccounts();
  const logger = useLogger("AddAccountModal");
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as Account["type"],
    balance: "",
    bank: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  // Using sonner toast

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        type: "checking",
        balance: "",
        bank: "",
        description: "",
      });
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    logger.info("Starting account creation", { formData });

    // Sanitize inputs
    const sanitizedName = sanitizeString(formData.name);
    const sanitizedBank = sanitizeString(formData.bank);
    const sanitizedDescription = sanitizeString(formData.description);
    const sanitizedBalance = sanitizeNumber(formData.balance);

    // Comprehensive validation
    if (!validateRequiredString(sanitizedName)) {
      toast.error("Nome da conta é obrigatório.");
      return;
    }

    if (!validatePositiveNumber(sanitizedBalance) && sanitizedBalance !== 0) {
      toast.error("Por favor, insira um valor válido para o saldo.");
      return;
    }

    // Additional business validation
    if (sanitizedName.length > 100) {
      toast.error("Nome da conta deve ter no máximo 100 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const generateId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return (
          Date.now().toString(36) + Math.random().toString(36).substring(2)
        );
      };

      const accountData = {
        name: sanitizedName,
        type: formData.type,
        balance: sanitizedBalance,
        bankName: sanitizedBank || undefined,
        description: sanitizedDescription || undefined,
        status: "active" as const,
      };

      logger.debug("Creating account", accountData);
      const createdAccount = await create(accountData);
      logger.info("Account created successfully", {
        accountId: createdAccount.id,
      });

      toast.success("Conta criada com sucesso.");

      // Reset form
      setFormData({
        name: "",
        type: "checking",
        balance: "",
        bank: "",
        description: "",
      });

      // Call callback to refresh parent component
      onAccountAdded();
      onClose();
    } catch (error) {
      logger.error("Error creating account", error);
      toast.error(
        `Erro ao criar conta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>
            Adicione uma nova conta bancária ao seu sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Conta Corrente Banco do Brasil"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Conta *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
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

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Inicial *</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => handleInputChange("balance", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Input
              id="bank"
              value={formData.bank}
              onChange={(e) => handleInputChange("bank", e.target.value)}
              placeholder="Ex: Banco do Brasil"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição opcional da conta"
              rows={3}
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
              {isLoading ? "Criando..." : "Criar Conta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
