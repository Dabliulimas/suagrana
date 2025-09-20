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
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  TargetIcon,
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  CheckCircleIcon,
  ClockIcon,
  Edit,
  Trash2,
} from "lucide-react";
import { type Goal } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { toast } from "sonner";

interface GoalsManagerProps {
  onUpdate: () => void;
}

export function GoalsManager({ onUpdate }: GoalsManagerProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [addValueAmount, setAddValueAmount] = useState("");
  const [showAddValueModal, setShowAddValueModal] = useState(false);

  useEffect(() => {
    setGoals(goals);
  }, []);

  const handleAddValue = () => {
    if (!selectedGoal) return;

    const amount = Number.parseFloat(addValueAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }

    const newCurrent = selectedGoal.current + amount;
    storage.updateGoal(selectedGoal.id, { current: newCurrent });

    setGoals(goals);
    setShowAddValueModal(false);
    setAddValueAmount("");
    setSelectedGoal(null);
    onUpdate();

    toast.success(
      `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} adicionado à meta!`,
    );
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      const updatedGoals = goals.filter((g) => g.id !== id);
      localStorage.setItem("sua-grana-goals", JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
      toast.success("Meta excluída com sucesso!");
      onUpdate();
    }
  };

  const completedGoals = goals.filter(
    (goal) => goal.current >= goal.target,
  ).length;
  const activeGoals = goals.filter((goal) => goal.current < goal.target).length;
  const totalGoalsValue = goals.reduce((sum, goal) => sum + goal.target, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current, 0);

  const getStatusColor = (goal: Goal) => {
    if (goal.current >= goal.target) return "bg-green-100 text-green-800";
    const daysUntilDeadline = goal.deadline
      ? Math.ceil(
          (new Date(goal.deadline).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;
    if (daysUntilDeadline && daysUntilDeadline < 0)
      return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <ClockIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeGoals}
            </div>
            <p className="text-xs text-muted-foreground">Em progresso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Metas Concluídas
            </CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedGoals}
            </div>
            <p className="text-xs text-muted-foreground">
              Objetivos alcançados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Economizado
            </CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalSaved.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Valor acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total das Metas
            </CardTitle>
            <TargetIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalGoalsValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Objetivo total</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Nenhuma meta cadastrada</p>
              <p className="text-sm text-gray-400 mt-2">
                Clique no botão "+" para criar sua primeira meta
              </p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            const daysUntilDeadline = goal.deadline
              ? Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : null;

            const status =
              goal.current >= goal.target
                ? "Concluída"
                : daysUntilDeadline && daysUntilDeadline < 0
                  ? "Atrasada"
                  : "Em Progresso";

            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(goal)}>{status}</Badge>
                      <Badge className={getPriorityColor(goal.priority)}>
                        {goal.priority === "high"
                          ? "Alta"
                          : goal.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Valor Atual</p>
                        <p className="font-semibold text-green-600">
                          R${" "}
                          {goal.current.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Alvo</p>
                        <p className="font-semibold">
                          R${" "}
                          {goal.target.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Faltam</p>
                        <p className="font-semibold text-red-600">
                          R${" "}
                          {Math.max(0, remaining).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-semibold">
                          {goal.deadline
                            ? daysUntilDeadline && daysUntilDeadline > 0
                              ? `${daysUntilDeadline} dias`
                              : daysUntilDeadline === 0
                                ? "Hoje"
                                : "Vencida"
                            : "Sem prazo"}
                        </p>
                      </div>
                    </div>

                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          Data limite:{" "}
                          {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowAddValueModal(true);
                        }}
                        disabled={goal.current >= goal.target}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Adicionar Valor
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Value Modal */}
      <Dialog open={showAddValueModal} onOpenChange={setShowAddValueModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Valor à Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                Meta: {selectedGoal?.name}
              </p>
              <p className="text-sm text-gray-600">
                Valor atual: R${" "}
                {selectedGoal?.current.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Valor a adicionar</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={addValueAmount}
                onChange={(e) => setAddValueAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAddValueModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddValue}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
