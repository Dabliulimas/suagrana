"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { type EmergencyReserve, type Account } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { useClientOnly } from "../hooks/use-client-only";
import { storage } from "../lib/storage/storage";
import { toast } from "sonner";
import {
  Shield,
  Target,
  Plus,
  Settings,
  TrendingUp,
  Calendar,
  Minus,
  ArrowRightLeft,
} from "lucide-react";

interface EmergencyReserveProps {
  onUpdate?: () => void;
}

export function EmergencyReserveComponent({ onUpdate }: EmergencyReserveProps) {
  const { accounts: unifiedAccounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [reserve, setReserve] = useState<EmergencyReserve | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [targetMonths, setTargetMonths] = useState("6");
  const [description, setDescription] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const isClient = useClientOnly();

  useEffect(() => {
    if (isClient) {
      loadReserve();
      loadAccounts();
    }
  }, [isClient]);

  const loadReserve = () => {
    const existingReserve = storage.getEmergencyReserve();
    setReserve(existingReserve);
  };

  const loadAccounts = () => {
    const existingAccounts = accounts;
    setAccounts(existingAccounts);
  };

  const handleSetupReserve = () => {
    const target = parseFloat(targetAmount);
    const monthly = parseFloat(monthlyGoal);
    const months = parseInt(targetMonths);

    if (isNaN(target) || target <= 0) {
      toast.error("Valor da meta deve ser maior que zero");
      return;
    }

    if (isNaN(monthly) || monthly <= 0) {
      toast.error("Meta mensal deve ser maior que zero");
      return;
    }

    if (isNaN(months) || months <= 0) {
      toast.error("Número de meses deve ser maior que zero");
      return;
    }

    try {
      const newReserve = storage.saveEmergencyReserve({
        targetAmount: target,
        currentAmount: 0,
        monthlyGoal: monthly,
        targetMonths: months,
        description:
          description || "Reserva de emergência para 6 meses de despesas",
        isActive: true,
      });

      setReserve(newReserve);
      setIsSetupOpen(false);
      setTargetAmount("");
      setMonthlyGoal("");
      setTargetMonths("6");
      setDescription("");
      toast.success("Reserva de emergência configurada com sucesso!");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao configurar reserva de emergência");
    }
  };

  const handleAddAmount = () => {
    const amount = parseFloat(addAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    try {
      const updated = storage.addToEmergencyReserve(amount);
      if (updated) {
        setReserve(updated);
        setIsAddOpen(false);
        setAddAmount("");
        toast.success(
          `R$ ${amount.toFixed(2)} adicionado à reserva de emergência!`,
        );
        onUpdate?.();
      }
    } catch (error) {
      toast.error("Erro ao adicionar valor à reserva");
    }
  };

  const handleWithdrawAmount = () => {
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    if (!reserve || amount > reserve.currentAmount) {
      toast.error("Valor não pode ser maior que o saldo disponível");
      return;
    }

    try {
      const updated = storage.updateEmergencyReserve({
        currentAmount: reserve.currentAmount - amount,
      });
      if (updated) {
        setReserve(updated);
        setIsWithdrawOpen(false);
        setWithdrawAmount("");
        toast.success(
          `R$ ${amount.toFixed(2)} retirado da reserva de emergência!`,
        );
        onUpdate?.();
      }
    } catch (error) {
      toast.error("Erro ao retirar valor da reserva");
    }
  };

  const handleTransferAmount = async () => {
    const amount = parseFloat(transferAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    if (!reserve || amount > reserve.currentAmount) {
      toast.error("Valor não pode ser maior que o saldo disponível");
      return;
    }

    if (!selectedAccount) {
      toast.error("Selecione uma conta de destino");
      return;
    }

    try {
      // Atualizar reserva de emergência
      const updatedReserve = storage.updateEmergencyReserve({
        currentAmount: reserve.currentAmount - amount,
      });

      // Atualizar conta de destino
      const targetAccount = accounts.find((acc) => acc.id === selectedAccount);
      if (targetAccount) {
        await updateAccount(selectedAccount, {
          balance: targetAccount.balance + amount,
        });
      }

      if (updatedReserve) {
        setReserve(updatedReserve);
        setIsTransferOpen(false);
        setTransferAmount("");
        setSelectedAccount("");
        loadAccounts(); // Recarregar contas para atualizar saldos
        toast.success(
          `R$ ${amount.toFixed(2)} transferido para ${targetAccount?.name}!`,
        );
        onUpdate?.();
      }
    } catch (error) {
      toast.error("Erro ao transferir valor");
    }
  };

  const handleEditReserve = () => {
    if (!reserve) return;

    setTargetAmount(reserve.targetAmount.toString());
    setMonthlyGoal(reserve.monthlyGoal.toString());
    setTargetMonths(reserve.targetMonths.toString());
    setDescription(reserve.description || "");
    setIsSetupOpen(true);
  };

  const handleUpdateReserve = () => {
    if (!reserve) return;

    const target = parseFloat(targetAmount);
    const monthly = parseFloat(monthlyGoal);
    const months = parseInt(targetMonths);

    if (isNaN(target) || target <= 0) {
      toast.error("Valor da meta deve ser maior que zero");
      return;
    }

    if (isNaN(monthly) || monthly <= 0) {
      toast.error("Meta mensal deve ser maior que zero");
      return;
    }

    try {
      const updated = storage.updateEmergencyReserve({
        targetAmount: target,
        monthlyGoal: monthly,
        targetMonths: months,
        description: description || reserve.description,
      });

      if (updated) {
        setReserve(updated);
        setIsSetupOpen(false);
        setTargetAmount("");
        setMonthlyGoal("");
        setTargetMonths("6");
        setDescription("");
        toast.success("Reserva de emergência atualizada com sucesso!");
        onUpdate?.();
      }
    } catch (error) {
      toast.error("Erro ao atualizar reserva de emergência");
    }
  };

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Reserva de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = reserve
    ? storage.getEmergencyReserveProgress()
    : { percentage: 0, monthsLeft: 0, isComplete: false };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Reserva de Emergência
          </div>
          {reserve && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEditReserve}>
                <Settings className="h-4 w-4" />
              </Button>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Retirar
                    </Button>
                  </DialogTrigger>
                  <Dialog
                    open={isTransferOpen}
                    onOpenChange={setIsTransferOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        Transferir
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar à Reserva</DialogTitle>
                        <DialogDescription>
                          Adicione um valor à sua reserva de emergência
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="add-amount">Valor (R$)</Label>
                          <Input
                            id="add-amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            value={addAmount}
                            onChange={(e) => setAddAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAddAmount}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Retirar da Reserva</DialogTitle>
                      <DialogDescription>
                        Retire um valor da sua reserva de emergência
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdraw-amount">Valor (R$)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={reserve?.currentAmount || 0}
                          placeholder="0,00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        {reserve && (
                          <p className="text-sm text-gray-500 mt-1">
                            Saldo disponível: R${" "}
                            {reserve.currentAmount.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsWithdrawOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleWithdrawAmount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Retirar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transferir para Conta</DialogTitle>
                    <DialogDescription>
                      Transfira um valor da reserva de emergência para uma conta
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transfer-amount">Valor (R$)</Label>
                      <Input
                        id="transfer-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={reserve?.currentAmount || 0}
                        placeholder="0,00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                      {reserve && (
                        <p className="text-sm text-gray-500 mt-1">
                          Saldo disponível: R${" "}
                          {reserve.currentAmount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="target-account">Conta de Destino</Label>
                      <Select
                        value={selectedAccount}
                        onValueChange={setSelectedAccount}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{account.name}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  R${" "}
                                  {account.balance.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsTransferOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleTransferAmount}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Transferir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          {reserve
            ? reserve.description
            : "Configure sua reserva de emergência"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!reserve ? (
          <div className="text-center py-6">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Configure sua reserva de emergência para ter segurança financeira
            </p>
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Target className="h-4 w-4 mr-2" />
                  Configurar Reserva
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurar Reserva de Emergência</DialogTitle>
                  <DialogDescription>
                    Defina sua meta de reserva de emergência baseada em seus
                    gastos mensais
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="target-months">Meses de cobertura</Label>
                    <Input
                      id="target-months"
                      type="number"
                      min="1"
                      max="12"
                      value={targetMonths}
                      onChange={(e) => setTargetMonths(e.target.value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Recomendado: 6 meses de despesas
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="target-amount">Meta total (R$)</Label>
                    <Input
                      id="target-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthly-goal">Meta mensal (R$)</Label>
                    <Input
                      id="monthly-goal"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={monthlyGoal}
                      onChange={(e) => setMonthlyGoal(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Reserva para emergências familiares"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsSetupOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSetupReserve}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Configurar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  R${" "}
                  {reserve.currentAmount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  de R${" "}
                  {reserve.targetAmount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={progress.isComplete ? "default" : "secondary"}
                  className="mb-1"
                >
                  {progress.percentage.toFixed(1)}%
                </Badge>
                {!progress.isComplete && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {progress.monthsLeft} meses restantes
                  </p>
                )}
              </div>
            </div>

            <Progress value={progress.percentage} className="h-3" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Meta mensal</p>
                <p className="font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  R${" "}
                  {reserve.monthlyGoal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Cobertura</p>
                <p className="font-semibold">{reserve.targetMonths} meses</p>
              </div>
            </div>

            {progress.isComplete && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Parabéns! Sua reserva de emergência está completa!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Você tem segurança financeira para {reserve.targetMonths}{" "}
                  meses de despesas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Setup/Edit Dialog */}
        <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reserve
                  ? "Editar Reserva de Emergência"
                  : "Configurar Reserva de Emergência"}
              </DialogTitle>
              <DialogDescription>
                {reserve
                  ? "Atualize as configurações da sua reserva"
                  : "Defina sua meta de reserva de emergência"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="target-months">Meses de cobertura</Label>
                <Input
                  id="target-months"
                  type="number"
                  min="1"
                  max="12"
                  value={targetMonths}
                  onChange={(e) => setTargetMonths(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="target-amount">Meta total (R$)</Label>
                <Input
                  id="target-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthly-goal">Meta mensal (R$)</Label>
                <Input
                  id="monthly-goal"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Reserva para emergências familiares"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSetupOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={reserve ? handleUpdateReserve : handleSetupReserve}
                className="bg-green-600 hover:bg-green-700"
              >
                {reserve ? "Atualizar" : "Configurar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
