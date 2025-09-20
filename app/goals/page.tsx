"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import { type Goal } from "@/lib/types";
import { useGoals } from "@/contexts/unified-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Banknote,
  Target,
  TrendingUp,
  Calendar,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  ShoppingBag,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModernAppLayout } from "@/components/modern-app-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useClientOnly } from "@/hooks/use-client-only";
import { BackButton } from "@/components/back-button";

import { GoalMoneyManager } from "@/components/goal-money-manager";

const GoalsPage = () => {
  // Todos os hooks devem ser chamados no topo do componente, sempre na mesma ordem
  const {
    goals = [],
    isLoading: goalsLoading,
    refresh: refreshGoals,
    create: createGoal,
    update: updateGoal,
    delete: deleteGoal,
  } = useGoals();
  const isClient = useClientOnly();
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("");
  const [newGoalPriority, setNewGoalPriority] = useState("medium");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showMoneyManager, setShowMoneyManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    averageProgress: 0,
    activeGoals: 0,
  });

  // Funções auxiliares que são usadas nos hooks
  const getGoalStatus = (goal: Goal) => {
    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    if (progress >= 100) return "completed";
    if (progress >= 50) return "in_progress";
    return "not_started";
  };

  // Todos os hooks useEffect e useMemo devem estar aqui
  // O contexto financeiro gerencia automaticamente o carregamento das metas

  // Calculate statistics
  useEffect(() => {
    if (goals.length > 0) {
      const totalGoals = goals.length;
      const completedGoals = goals.filter((goal) => {
        const progress =
          goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
        return progress >= 100;
      }).length;
      const totalTargetAmount = goals.reduce(
        (sum, goal) => sum + goal.target,
        0,
      );
      const totalSavedAmount = goals.reduce(
        (sum, goal) => sum + goal.current,
        0,
      );
      const averageProgress =
        totalTargetAmount > 0
          ? (totalSavedAmount / totalTargetAmount) * 100
          : 0;
      const activeGoals = goals.filter((goal) => {
        const progress =
          goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
        return progress < 100;
      }).length;

      setStats({
        totalGoals,
        completedGoals,
        totalTargetAmount,
        totalSavedAmount,
        averageProgress,
        activeGoals,
      });
    }
  }, [goals]);

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals.filter((goal) => {
      const matchesSearch = goal.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || goal.category === filterCategory;
      const status = getGoalStatus(goal);
      const matchesStatus = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "target":
          return b.target - a.target;
        case "progress":
          const progressA = a.target > 0 ? (a.current / a.target) * 100 : 0;
          const progressB = b.target > 0 ? (b.current / b.target) * 100 : 0;
          return progressB - progressA;
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [goals, searchTerm, filterCategory, filterStatus, sortBy]);

  const goalStats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(
      (goal) => getGoalStatus(goal) === "completed",
    ).length;
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.current, 0);
    const averageProgress =
      totalGoals > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return {
      totalGoals,
      completedGoals,
      totalTarget,
      totalCurrent,
      averageProgress: Math.min(averageProgress, 100),
    };
  }, [goals]);

  // Early return após todos os hooks serem definidos
  if (!isClient) {
    return (
      <ModernAppLayout
        title="Metas Financeiras"
        subtitle="Defina e acompanhe seus objetivos financeiros"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados financeiros...</p>
          </div>
        </div>
      </ModernAppLayout>
    );
  }

  const categories = [
    { value: "casa", label: "Casa", icon: Home },
    { value: "veiculo", label: "Veiculo", icon: Car },
    { value: "viagem", label: "Viagem", icon: Plane },
    { value: "educacao", label: "Educacao", icon: GraduationCap },
    { value: "saude", label: "Saude", icon: Heart },
    { value: "compras", label: "Compras", icon: ShoppingBag },
    { value: "carreira", label: "Carreira", icon: Briefcase },
    { value: "outros", label: "Outros", icon: Target },
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.icon : Target;
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : "Outros";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baixa";
      default:
        return "Media";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in_progress":
        return Clock;
      case "not_started":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-yellow-600";
      case "not_started":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalName || !newGoalTarget || !newGoalCategory) {
      toast.error("Por favor, preencha todos os campos obrigatorios");
      return;
    }

    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      toast.error("O valor da meta deve ser um numero positivo");
      return;
    }

    try {
      const newGoalData = {
        name: newGoalName,
        target,
        current: 0,
        category: newGoalCategory,
        priority: newGoalPriority as "high" | "medium" | "low",
        deadline: newGoalDeadline || undefined,
        description: newGoalDescription || undefined,
      };

      await createGoal(newGoalData);
      setNewGoalName("");
      setNewGoalTarget("");
      setNewGoalCategory("");
      setNewGoalPriority("medium");
      setNewGoalDeadline("");
      setNewGoalDescription("");
      setShowCreateDialog(false);
      toast.success("Meta criada com sucesso!");
    } catch (error) {
      logComponents.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast.success("Meta excluida com sucesso.");
    } catch (error) {
      logComponents.error("Failed to delete goal:", error);
      toast.error("Falha ao excluir meta. Tente novamente.");
    }
  };

  return (
    <ModernAppLayout
      title="Metas Financeiras"
      subtitle="Defina e acompanhe seus objetivos financeiros"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Metas Financeiras
              </h1>
              <p className="text-muted-foreground">
                Defina e acompanhe suas metas financeiras com controle avancado
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Defina uma nova meta financeira com detalhes completos
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalName">Nome da Meta *</Label>
                    <Input
                      id="goalName"
                      placeholder="Ex: Viagem para Europa"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalTarget">Valor da Meta (R$) *</Label>
                    <Input
                      id="goalTarget"
                      type="number"
                      placeholder="10000"
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={newGoalCategory}
                      onValueChange={setNewGoalCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={newGoalPriority}
                      onValueChange={setNewGoalPriority}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalDeadline">Prazo (opcional)</Label>
                  <Input
                    id="goalDeadline"
                    type="date"
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goalDescription">Descricao (opcional)</Label>
                  <Textarea
                    id="goalDescription"
                    placeholder="Descreva sua meta e motivacao..."
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateGoal}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Meta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        {isClient ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total de Metas
                    </p>
                    <p className="text-2xl font-bold">{stats.totalGoals}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.completedGoals} concluídas
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Valor Objetivo
                    </p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {stats.totalTargetAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <Banknote className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Poupado
                    </p>
                    <p className="text-2xl font-bold">
                      R${" "}
                      {stats.totalSavedAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Progress
                      value={stats.averageProgress}
                      className="mt-2 w-20"
                    />
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Progresso Médio
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.averageProgress.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats.activeGoals} ativas
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-16">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-16">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-16">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-16">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome da meta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="not_started">Nao iniciado</SelectItem>
                    <SelectItem value="in_progress">Em progresso</SelectItem>
                    <SelectItem value="completed">Concluido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="target">Valor</SelectItem>
                    <SelectItem value="progress">Progresso</SelectItem>
                    <SelectItem value="deadline">Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Metas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedGoals.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma meta encontrada
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {goals.length === 0
                    ? "Comece criando sua primeira meta financeira"
                    : "Tente ajustar os filtros para encontrar suas metas"}
                </p>
                {goals.length === 0 ? (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar primeira meta
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedGoals.map((goal) => {
              const progress =
                goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
              const status = getGoalStatus(goal);
              const StatusIcon = getStatusIcon(status);
              const CategoryIcon = getCategoryIcon(goal.category || "outros");

              return (
                <Card
                  key={goal.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={getPriorityColor(
                                goal.priority || "medium",
                              )}
                              className="text-xs"
                            >
                              {getPriorityLabel(goal.priority || "medium")}
                            </Badge>
                            <span className="text-xs">
                              {getCategoryLabel(goal.category || "outros")}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedGoal(goal);
                              setShowMoneyManager(true);
                            }}
                          >
                            <Banknote className="mr-2 h-4 w-4" />
                            Gerenciar Dinheiro
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir Meta
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a meta "
                                  {goal.name}"? Esta acao nao pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGoal(goal.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          <StatusIcon
                            className={`h-4 w-4 ${getStatusColor(status)}`}
                          />
                          <span>Progresso</span>
                        </div>
                        <span className="font-medium">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {goal.current.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        <span>
                          {goal.target.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Botoes de Acao Visiveis */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowMoneyManager(true);
                        }}
                      >
                        <Banknote className="mr-1 h-3 w-3" />
                        Gerenciar $
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingGoal(goal)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>

                    {goal.description && (
                      <p className="text-sm text-muted-foreground">
                        {goal.description}
                      </p>
                    )}

                    {goal.deadline && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Prazo:{" "}
                          {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Restante:</span>
                      <span
                        className={`font-medium ${
                          goal.current >= goal.target
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {Math.max(0, goal.target - goal.current).toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "BRL",
                          },
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialog de Edicao de Meta */}
        {editingGoal && (
          <Dialog
            open={!!editingGoal}
            onOpenChange={() => setEditingGoal(null)}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Meta</DialogTitle>
                <DialogDescription>
                  Modifique os detalhes da sua meta financeira
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editGoalName">Nome da Meta *</Label>
                    <Input
                      id="editGoalName"
                      placeholder="Ex: Viagem para Europa"
                      value={editingGoal.name}
                      onChange={(e) =>
                        setEditingGoal({ ...editingGoal, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editGoalTarget">Valor da Meta (R$) *</Label>
                    <Input
                      id="editGoalTarget"
                      type="number"
                      placeholder="10000"
                      value={editingGoal.target.toString()}
                      onChange={(e) =>
                        setEditingGoal({
                          ...editingGoal,
                          target: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select
                      value={editingGoal.category}
                      onValueChange={(value) =>
                        setEditingGoal({ ...editingGoal, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={editingGoal.priority || "medium"}
                      onValueChange={(value) =>
                        setEditingGoal({
                          ...editingGoal,
                          priority: value as "high" | "medium" | "low",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGoalDeadline">Prazo (opcional)</Label>
                  <Input
                    id="editGoalDeadline"
                    type="date"
                    value={editingGoal.deadline || ""}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        deadline: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGoalDescription">
                    Descricao (opcional)
                  </Label>
                  <Textarea
                    id="editGoalDescription"
                    placeholder="Descreva sua meta e motivacao..."
                    value={editingGoal.description || ""}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        description: e.target.value || undefined,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingGoal(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await updateGoal(editingGoal.id, editingGoal);
                      setEditingGoal(null);
                    } catch (error) {
                      logComponents.error("Erro ao atualizar meta:", error);
                      toast.error("Erro ao atualizar meta");
                    }
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Salvar Alteracoes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Componente de Gerenciamento de Dinheiro */}
        {showMoneyManager && selectedGoal && (
          <GoalMoneyManager
            goal={selectedGoal}
            onClose={() => {
              setShowMoneyManager(false);
              setSelectedGoal(null);
            }}
            onUpdate={() => {
              // Goals will refresh automatically
            }}
          />
        )}
      </div>
    </ModernAppLayout>
  );
};

export default GoalsPage;
