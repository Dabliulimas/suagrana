"use client";

import React, { useState, useEffect } from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Plus, Minus, DollarSign } from "lucide-react";
import { storage, type Account } from "../../../lib/storage";
import { toast } from "sonner";

interface AccountBalanceManagerProps {
  account: Account;
  onClose: () => void;
  onUpdate: () => void;
}

export function AccountBalanceManager({
  account,
  onClose,
  onUpdate,
}: AccountBalanceManagerProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const categories = [
    "Ajuste de Saldo",
    "Depósito",
    "Saque",
    "Transferência",
    "Juros",
    "Tarifas",
    "Correção",
    "Outros",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number.parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    const adjustmentAmount = operation === "add" ? value : -value;

    // Update account balance
    await updateAccount(account.id, {
      balance: account.balance + adjustmentAmount,
    });

    // Create transaction record
    storage.saveTransaction({
      description:
        description ||
        `${operation === "add" ? "Depósito" : "Saque"} - ${account.name}`,
      amount: adjustmentAmount,
      type: operation === "add" ? "income" : "expense",
      category: category || "Ajuste de Saldo",
      account: account.name,
      date: new Date().toISOString().split("T")[0],
      notes: `Ajuste manual de saldo da conta ${account.name}`,
    });

    toast.success(
      `${operation === "add" ? "Depósito" : "Saque"} realizado com sucesso!`,
    );
    onUpdate();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Gerenciar Saldo - {account.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Saldo Atual</p>
          <p className="text-2xl font-bold">
            R${" "}
            {account.balance.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Operação</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={operation === "add" ? "default" : "outline"}
                onClick={() => setOperation("add")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
              <Button
                type="button"
                variant={operation === "remove" ? "default" : "outline"}
                onClick={() => setOperation("remove")}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                Retirar
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder={`${operation === "add" ? "Depósito" : "Saque"} em ${account.name}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {amount && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Novo saldo após operação:</p>
              <p className="text-lg font-bold text-blue-900">
                R${" "}
                {(
                  account.balance +
                  (operation === "add"
                    ? Number.parseFloat(amount)
                    : -Number.parseFloat(amount))
                ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className={
                operation === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {operation === "add" ? "Adicionar" : "Retirar"} Valor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
