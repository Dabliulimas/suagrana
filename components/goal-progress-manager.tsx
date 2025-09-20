"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Plus, Minus, Target, TrendingUp } from "lucide-react";
import { type Goal } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";

interface GoalProgressManagerProps {
  goal: Goal;
  onClose: () => void;
  onUpdate: () => void;
}

export function GoalProgressManager({
  goal,
  onClose,
  onUpdate,
}: GoalProgressManagerProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = Number.parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    const adjustmentAmount = operation === "add" ? value : -value;
    const newCurrent = Math.max(0, goal.current + adjustmentAmount);

    // Don't allow going over the target
    if (newCurrent > goal.target) {
      toast.error("O valor não pode exceder a meta");
      return;
    }

    // Update goal
    storage.updateGoal(goal.id, {
      current: newCurrent,
    });

    // Create transaction record
    storage.saveTransaction({
      description:
        description ||
        `${operation === "add" ? "Depósito" : "Retirada"} - Meta: ${goal.name}`,
      amount: adjustmentAmount,
      type: operation === "add" ? "income" : "expense",
      category: "Metas",
      account: "Meta Financeira",
      date: new Date().toISOString().split("T")[0],
      notes: `Ajuste na meta: ${goal.name}`,
    });

    const isCompleted = newCurrent >= goal.target;
    if (isCompleted && goal.current < goal.target) {
      toast.success("🎉 Parabéns! Meta concluída!");
    } else {
      toast.success(
        `${operation === "add" ? "Valor adicionado" : "Valor retirado"} com sucesso!`,
      );
    }

    onUpdate();
    onClose();
  };

  const newValue = amount
    ? goal.current +
      (operation === "add"
        ? Number.parseFloat(amount)
        : -Number.parseFloat(amount))
    : goal.current;
  const newProgress = (newValue / goal.target) * 100;
  const remaining = Math.max(0, goal.target - newValue);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Gerenciar Meta - {goal.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Progress */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progresso Atual</span>
              <span className="text-sm font-medium">
                {((goal.current / goal.target) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={(goal.current / goal.target) * 100}
              className="h-3 mb-3"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Valor Atual</p>
                <p className="font-semibold text-green-600">
                  R${" "}
                  {goal.current.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Meta</p>
                <p className="font-semibold">
                  R${" "}
                  {goal.target.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
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
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder={`${operation === "add" ? "Depósito" : "Retirada"} para meta ${goal.name}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {amount && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Novo Progresso</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{Math.min(newProgress, 100).toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.min(newProgress, 100)}
                    className="h-2"
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Novo Valor</p>
                      <p className="font-medium">
                        R${" "}
                        {Math.max(0, newValue).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Restante</p>
                      <p className="font-medium">
                        R${" "}
                        {remaining.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                  {newProgress >= 100 && (
                    <div className="p-2 bg-green-100 rounded text-center">
                      <p className="text-green-800 font-medium">
                        🎉 Meta Concluída!
                      </p>
                    </div>
                  )}
                </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
