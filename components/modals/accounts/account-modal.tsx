"use client";

import React, { useState, useEffect } from "react";
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
import { storage, type Account } from "../../../lib/storage";
import { toast } from "sonner";
import {
  CreditCard,
  Building2,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface AccountModalProps {
  onClose: () => void;
  onSave: () => void;
  account?: Account;
}

export function AccountModal({ onClose, onSave, account }: AccountModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as Account["type"],
    bank: "",
    balance: 0,
    creditLimit: 0,
    interestRate: 0,
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        bank: account.bank || "",
        balance: account.balance,
        creditLimit: account.creditLimit || 0,
        interestRate: account.interestRate || 0,
        description: account.description || "",
      });
    }
  }, [account]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.type) {
      newErrors.type = "Tipo é obrigatório";
    }

    if (formData.type === "credit" && formData.creditLimit <= 0) {
      newErrors.creditLimit = "Limite de crédito deve ser maior que zero";
    }

    if (formData.interestRate < 0 || formData.interestRate > 100) {
      newErrors.interestRate = "Taxa de juros deve estar entre 0 e 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const accountData: Omit<Account, "id" | "createdAt" | "updatedAt"> = {
        name: formData.name.trim(),
        type: formData.type,
        bank: formData.bank.trim() || undefined,
        balance: formData.balance,
        creditLimit:
          formData.type === "credit" ? formData.creditLimit : undefined,
        interestRate:
          formData.interestRate > 0 ? formData.interestRate : undefined,
        description: formData.description.trim() || undefined,
      };

      if (account) {
        await updateAccount(account.id, accountData);
        toast.success("Conta atualizada com sucesso!");
      } else {
        storage.saveAccount(accountData);
        toast.success("Conta criada com sucesso!");
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar conta");
      logComponents.error("Error saving account:", error);
    }
  };

  const getAccountIcon = (type: Account["type"]) => {
    switch (type) {
      case "checking":
        return <Building2 className="w-5 h-5" />;
      case "savings":
        return <PiggyBank className="w-5 h-5" />;
      case "credit":
        return <CreditCard className="w-5 h-5" />;
      case "investment":
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getAccountTypeName = (type: Account["type"]) => {
    switch (type) {
      case "checking":
        return "Conta Corrente";
      case "savings":
        return "Poupança";
      case "credit":
        return "Cartão de Crédito";
      case "investment":
        return "Investimento";
      default:
        return "Carteira";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getAccountIcon(formData.type)}
            {account ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Conta Corrente Banco do Brasil"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conta *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Account["type"]) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Conta Corrente
                    </div>
                  </SelectItem>
                  <SelectItem value="savings">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="w-4 h-4" />
                      Poupança
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cartão de Crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="investment">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Investimento
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Banco/Instituição</Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) =>
                  setFormData({ ...formData, bank: e.target.value })
                }
                placeholder="Ex: Banco do Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">
                {formData.type === "credit"
                  ? "Fatura Atual (R$)"
                  : "Saldo Inicial (R$)"}
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    balance: Number.parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          {formData.type === "credit" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de Crédito (R$) *</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0,00"
                  className={errors.creditLimit ? "border-red-500" : ""}
                />
                {errors.creditLimit && (
                  <p className="text-sm text-red-500">{errors.creditLimit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      interestRate: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0,00"
                  className={errors.interestRate ? "border-red-500" : ""}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-500">{errors.interestRate}</p>
                )}
              </div>
            </div>
          )}

          {(formData.type === "savings" || formData.type === "investment") && (
            <div className="space-y-2">
              <Label htmlFor="interestRate">Taxa de Rendimento (% a.a.)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: Number.parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
                className={errors.interestRate ? "border-red-500" : ""}
              />
              {errors.interestRate && (
                <p className="text-sm text-red-500">{errors.interestRate}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Informações adicionais sobre a conta..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {account ? "Atualizar" : "Criar"} Conta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
