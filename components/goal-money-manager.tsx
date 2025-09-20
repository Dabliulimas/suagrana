"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Target, Plus, Minus, ArrowRightLeft, History } from "lucide-react";
import { type Goal, type Account } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { transactionManager } from "../lib/transaction-manager";
import { storage } from "../lib/storage/storage";
import { toast } from "sonner";

interface GoalMoneyManagerProps {
  goal: Goal;
  onClose: () => void;
  onUpdate: () => void;
}

interface GoalTransaction {
  id: string;
  type: "add" | "withdraw" | "transfer_in" | "transfer_out";
  amount: number;
  description: string;
  date: string;
  fromAccount?: string;
  toAccount?: string;
  fromGoal?: string;
  toGoal?: string;
}

export function GoalMoneyManager({
  goal,
  onClose,
  onUpdate,
}: GoalMoneyManagerProps) {
  const { accounts, update: updateAccount } = useAccounts();
  const { goals } = useGoals();
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [activeTab, setActiveTab] = useState("add");

  const [addData, setAddData] = useState({
    amount: "",
    fromAccount: "",
    description: "",
  });

  const [withdrawData, setWithdrawData] = useState({
    amount: "",
    toAccount: "",
    description: "",
  });

  const [transferData, setTransferData] = useState({
    amount: "",
    toGoal: "",
    description: "",
  });

  useEffect(() => {
    setLocalAccounts(accounts);
    setLocalGoals(goals.filter((g) => g.id !== goal.id));
    loadGoalTransactions();
  }, [goal.id, accounts, goals]);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const loadGoalTransactions = () => {
    console.log("loadGoalTransactions foi removida - localStorage não é mais usado");
    if (typeof window === "undefined") return;
    // Dados agora vêm do banco via DataService
    setTransactions([]);
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const saveGoalTransaction = (transaction: Omit<GoalTransaction, "id">) => {
    console.log("saveGoalTransaction foi removida - localStorage não é mais usado");
    const newTransaction: GoalTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    // localStorage removido - dados agora são salvos no banco via DataService
  };

  const handleAddMoney = async () => {
    try {
      const amount = Number.parseFloat(addData.amount);

      if (amount <= 0) {
        toast.error("Valor deve ser maior que zero");
        return;
      }

      const fromAccount = localAccounts.find((a) => a.id === addData.fromAccount);
      if (!fromAccount) {
        toast.error("Conta de origem não encontrada");
        return;
      }

      if (fromAccount.balance < amount) {
        toast.error("Saldo insuficiente na conta");
        return;
      }

      const result = await transactionManager.executeTransaction(
        [
          // Debit from account
          async () => {
            await updateAccount(fromAccount.id, {
              balance: fromAccount.balance - amount,
            });
            return true;
          },
          // Add to goal
          async () => {
            storage.updateGoal(goal.id, {
              current: goal.current + amount,
            });
            return true;
          },
          // Record transaction
          async () => {
            storage.saveTransaction({
              description: `Aplicação na meta: ${goal.name} - ${addData.description}`,
              amount: -amount,
              type: "expense",
              category: "Investimento em Meta",
              account: fromAccount.name,
              date: new Date().toISOString().split("T")[0],
              notes: `Meta: ${goal.name}`,
            });
            return true;
          },
        ],
        [
          // Rollback operations
          async () => {
            await updateAccount(fromAccount.id, {
              balance: fromAccount.balance,
            });
            return true;
          },
          async () => {
            storage.updateGoal(goal.id, { current: goal.current });
            return true;
          },
        ],
      );

      if (result.success) {
        saveGoalTransaction({
          type: "add",
          amount,
          description: addData.description,
          date: new Date().toISOString(),
          fromAccount: fromAccount.name,
        });

        toast.success("Dinheiro adicionado à meta com sucesso!");
        setAddData({ amount: "", fromAccount: "", description: "" });
        onUpdate();
        storage.checkGoalProgress(goal.id);
      } else {
        toast.error("Erro ao adicionar dinheiro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao processar operação");
    }
  };

  const handleWithdrawMoney = async () => {
    try {
      const amount = Number.parseFloat(withdrawData.amount);

      if (amount <= 0) {
        toast.error("Valor deve ser maior que zero");
        return;
      }

      if (goal.current < amount) {
        toast.error("Valor insuficiente na meta");
        return;
      }

      const toAccount = accounts.find((a) => a.id === withdrawData.toAccount);
      if (!toAccount) {
        toast.error("Conta de destino não encontrada");
        return;
      }

      const result = await transactionManager.executeTransaction(
        [
          // Remove from goal
          async () => {
            storage.updateGoal(goal.id, {
              current: goal.current - amount,
            });
            return true;
          },
          // Credit to account
          async () => {
            await updateAccount(toAccount.id, {
              balance: toAccount.balance + amount,
            });
            return true;
          },
          // Record transaction
          async () => {
            storage.saveTransaction({
              description: `Resgate da meta: ${goal.name} - ${withdrawData.description}`,
              amount: amount,
              type: "income",
              category: "Resgate de Meta",
              account: toAccount.name,
              date: new Date().toISOString().split("T")[0],
              notes: `Meta: ${goal.name}`,
            });
            return true;
          },
        ],
        [
          // Rollback operations
          async () => {
            storage.updateGoal(goal.id, { current: goal.current });
            return true;
          },
          async () => {
            await updateAccount(toAccount.id, { balance: toAccount.balance });
            return true;
          },
        ],
      );

      if (result.success) {
        saveGoalTransaction({
          type: "withdraw",
          amount,
          description: withdrawData.description,
          date: new Date().toISOString(),
          toAccount: toAccount.name,
        });

        toast.success("Dinheiro retirado da meta com sucesso!");
        setWithdrawData({ amount: "", toAccount: "", description: "" });
        onUpdate();
        storage.checkGoalProgress(goal.id);
      } else {
        toast.error("Erro ao retirar dinheiro: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao processar operação");
    }
  };

  const handleTransferBetweenGoals = async () => {
    try {
      const amount = Number.parseFloat(transferData.amount);

      if (amount <= 0) {
        toast.error("Valor deve ser maior que zero");
        return;
      }

      if (goal.current < amount) {
        toast.error("Valor insuficiente na meta de origem");
        return;
      }

      const toGoal = goals.find((g) => g.id === transferData.toGoal);
      if (!toGoal) {
        toast.error("Meta de destino não encontrada");
        return;
      }

      const result = await transactionManager.executeTransaction(
        [
          // Remove from source goal
          async () => {
            storage.updateGoal(goal.id, {
              current: goal.current - amount,
            });
            return true;
          },
          // Add to destination goal
          async () => {
            storage.updateGoal(toGoal.id, {
              current: toGoal.current + amount,
            });
            return true;
          },
        ],
        [
          // Rollback operations
          async () => {
            storage.updateGoal(goal.id, { current: goal.current });
            return true;
          },
          async () => {
            storage.updateGoal(toGoal.id, { current: toGoal.current });
            return true;
          },
        ],
      );

      if (result.success) {
        // Save transaction for both goals
        saveGoalTransaction({
          type: "transfer_out",
          amount,
          description: transferData.description,
          date: new Date().toISOString(),
          toGoal: toGoal.name,
        });

        // Save transaction for destination goal
        const destTransactions = JSON.parse(
          localStorage.getItem(`goal-transactions-${toGoal.id}`) || "[]",
        );
        if (typeof window === "undefined") return;
        if (typeof window === "undefined") return;
        destTransactions.push({
          id: Date.now().toString() + "_dest",
          type: "transfer_in",
          amount,
          description: transferData.description,
          date: new Date().toISOString(),
          fromGoal: goal.name,
        });
        localStorage.setItem(
          `goal-transactions-${toGoal.id}`,
          JSON.stringify(destTransactions),
        );

        toast.success("Transferência entre metas realizada com sucesso!");
        setTransferData({ amount: "", toGoal: "", description: "" });
        onUpdate();
        storage.checkGoalProgress(goal.id);
        storage.checkGoalProgress(toGoal.id);
      } else {
        toast.error("Erro na transferência: " + result.error);
      }
    } catch (error) {
      toast.error("Erro ao processar transferência");
    }
  };

  const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
  const remaining = goal.target - goal.current;

  const getTransactionIcon = (type: GoalTransaction["type"]) => {
    switch (type) {
      case "add":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "withdraw":
        return <Minus className="w-4 h-4 text-red-600" />;
      case "transfer_in":
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case "transfer_out":
        return <ArrowRightLeft className="w-4 h-4 text-orange-600" />;
    }
  };

  const getTransactionLabel = (type: GoalTransaction["type"]) => {
    switch (type) {
      case "add":
        return "Adição";
      case "withdraw":
        return "Retirada";
      case "transfer_in":
        return "Transferência Recebida";
      case "transfer_out":
        return "Transferência Enviada";
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Gerenciar Dinheiro - {goal.name}
          </DialogTitle>
        </DialogHeader>

        {/* Goal Summary */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Valor Atual</p>
                  <p className="text-2xl font-bold text-green-600">
                    R${" "}
                    {goal.current.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Meta</p>
                  <p className="text-lg font-semibold">
                    R${" "}
                    {goal.target.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Faltam: R${" "}
                  {remaining.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <Badge variant="outline">{goal.priority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add">Adicionar</TabsTrigger>
            <TabsTrigger value="withdraw">Retirar</TabsTrigger>
            <TabsTrigger value="transfer">Transferir</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Adicionar Dinheiro à Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fluxo Visual */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Conta de Origem</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>→</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Meta: {goal.name}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fromAccount">Conta de Origem *</Label>
                  <Select
                    value={addData.fromAccount}
                    onValueChange={(value) =>
                      setAddData({ ...addData, fromAccount: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(
                          (account) => account.id && account.id.trim() !== "",
                        )
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} - R$ {account.balance.toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    💰 O dinheiro será transferido desta conta para a meta
                  </p>
                </div>

                <div>
                  <Label htmlFor="addAmount">Valor *</Label>
                  <Input
                    id="addAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={addData.amount}
                    onChange={(e) =>
                      setAddData({ ...addData, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="addDescription">Descrição *</Label>
                  <Textarea
                    id="addDescription"
                    placeholder="Motivo da aplicação..."
                    value={addData.description}
                    onChange={(e) =>
                      setAddData({ ...addData, description: e.target.value })
                    }
                  />
                </div>

                <Button
                  onClick={handleAddMoney}
                  className="w-full"
                  disabled={
                    !addData.fromAccount ||
                    !addData.amount ||
                    !addData.description
                  }
                >
                  Adicionar à Meta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-red-600" />
                  Retirar Dinheiro da Meta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fluxo Visual */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Meta: {goal.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>→</span>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Conta de Destino</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="toAccount">Conta de Destino *</Label>
                  <Select
                    value={withdrawData.toAccount}
                    onValueChange={(value) =>
                      setWithdrawData({ ...withdrawData, toAccount: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter(
                          (account) => account.id && account.id.trim() !== "",
                        )
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} - R$ {account.balance.toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    💸 O dinheiro será transferido da meta para esta conta
                  </p>
                </div>

                <div>
                  <Label htmlFor="withdrawAmount">Valor *</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    max={goal.current}
                    value={withdrawData.amount}
                    onChange={(e) =>
                      setWithdrawData({
                        ...withdrawData,
                        amount: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {goal.current.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="withdrawDescription">Descrição *</Label>
                  <Textarea
                    id="withdrawDescription"
                    placeholder="Motivo da retirada..."
                    value={withdrawData.description}
                    onChange={(e) =>
                      setWithdrawData({
                        ...withdrawData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleWithdrawMoney}
                  className="w-full"
                  disabled={
                    !withdrawData.toAccount ||
                    !withdrawData.amount ||
                    !withdrawData.description
                  }
                >
                  Retirar da Meta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                  Transferir entre Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="toGoal">Meta de Destino *</Label>
                  <Select
                    value={transferData.toGoal}
                    onValueChange={(value) =>
                      setTransferData({ ...transferData, toGoal: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a meta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {goals
                        .filter((g) => g.id && g.id.trim() !== "")
                        .map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name} - R$ {g.current.toFixed(2)} / R${" "}
                            {g.target.toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transferAmount">Valor *</Label>
                  <Input
                    id="transferAmount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    max={goal.current}
                    value={transferData.amount}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        amount: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponível: R$ {goal.current.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="transferDescription">Descrição *</Label>
                  <Textarea
                    id="transferDescription"
                    placeholder="Motivo da transferência..."
                    value={transferData.description}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleTransferBetweenGoals}
                  className="w-full"
                  disabled={
                    !transferData.toGoal ||
                    !transferData.amount ||
                    !transferData.description
                  }
                >
                  Transferir entre Metas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma movimentação realizada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transactions
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <p className="font-medium">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(transaction.date).toLocaleDateString(
                                  "pt-BR",
                                )}{" "}
                                às{" "}
                                {new Date(transaction.date).toLocaleTimeString(
                                  "pt-BR",
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getTransactionLabel(transaction.type)}
                                {transaction.fromAccount &&
                                  ` • De: ${transaction.fromAccount}`}
                                {transaction.toAccount &&
                                  ` • Para: ${transaction.toAccount}`}
                                {transaction.fromGoal &&
                                  ` • De: ${transaction.fromGoal}`}
                                {transaction.toGoal &&
                                  ` • Para: ${transaction.toGoal}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                transaction.type === "add" ||
                                transaction.type === "transfer_in"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "add" ||
                              transaction.type === "transfer_in"
                                ? "+"
                                : "-"}
                              R$ {transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default GoalMoneyManager;
