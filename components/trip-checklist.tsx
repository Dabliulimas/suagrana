"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
} from "../lib/utils/date-utils";
import { DatePicker } from "./ui/date-picker";

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  category: "before" | "packing" | "during" | "after";
  priority: "low" | "medium" | "high";
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
}

interface TripChecklistProps {
  trip: Trip;
  onUpdate: () => void;
}

export function TripChecklist({ trip, onUpdate }: TripChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    ChecklistItem["category"] | "all"
  >("all");
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "before" as ChecklistItem["category"],
    priority: "medium" as ChecklistItem["priority"],
    dueDate: "",
    assignedTo: "",
    notes: "",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadChecklist();
      initializeDefaultItems();
    }
  }, [trip.id, isMounted]);

  const loadChecklist = () => {
    const data = localStorage.getItem(`trip-checklist-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (data) {
      setChecklist(JSON.parse(data));
    }
  };

  const saveChecklist = (items: ChecklistItem[]) => {
    localStorage.setItem(`trip-checklist-${trip.id}`, JSON.stringify(items));
    setChecklist(items);
  };

  const initializeDefaultItems = () => {
    const existing = localStorage.getItem(`trip-checklist-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (!existing) {
      const defaultItems: ChecklistItem[] = [
        // Antes da viagem
        {
          id: "1",
          title: "Verificar validade do passaporte",
          category: "before",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Fazer seguro viagem",
          category: "before",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Reservar acomodação",
          category: "before",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          title: "Pesquisar sobre o destino",
          category: "before",
          priority: "medium",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        // Fazer as malas
        {
          id: "5",
          title: "Roupas adequadas ao clima",
          category: "packing",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "6",
          title: "Medicamentos pessoais",
          category: "packing",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "7",
          title: "Carregadores e adaptadores",
          category: "packing",
          priority: "medium",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        // Durante a viagem
        {
          id: "8",
          title: "Check-in no hotel",
          category: "during",
          priority: "high",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "9",
          title: "Visitar principais atrações",
          category: "during",
          priority: "medium",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        // Após a viagem
        {
          id: "10",
          title: "Organizar fotos e memórias",
          category: "after",
          priority: "low",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
      saveChecklist(defaultItems);
    }
  };

  const getCategoryName = (category: ChecklistItem["category"]) => {
    switch (category) {
      case "before":
        return "Antes da Viagem";
      case "packing":
        return "Fazer as Malas";
      case "during":
        return "Durante a Viagem";
      case "after":
        return "Após a Viagem";
    }
  };

  const getCategoryColor = (category: ChecklistItem["category"]) => {
    switch (category) {
      case "before":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "packing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "during":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "after":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    }
  };

  const getPriorityColor = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityIcon = (priority: ChecklistItem["priority"]) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="w-3 h-3" />;
      case "medium":
        return <Clock className="w-3 h-3" />;
      case "low":
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  const getFilteredItems = () => {
    if (selectedCategory === "all") return checklist;
    return checklist.filter((item) => item.category === selectedCategory);
  };

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter((item) => item.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    const byCategory = {
      before: checklist.filter((item) => item.category === "before"),
      packing: checklist.filter((item) => item.category === "packing"),
      during: checklist.filter((item) => item.category === "during"),
      after: checklist.filter((item) => item.category === "after"),
    };

    return {
      total,
      completed,
      percentage,
      byCategory: Object.entries(byCategory).map(([key, items]) => ({
        category: key as ChecklistItem["category"],
        total: items.length,
        completed: items.filter((item) => item.completed).length,
      })),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    // Validar e converter data se fornecida
    let dueDate = formData.dueDate;
    if (dueDate && dueDate.includes("/")) {
      if (!validateBRDate(dueDate)) {
        toast.error("Data limite inválida. Use o formato dd/mm/aaaa");
        return;
      }
      dueDate = convertBRDateToISO(dueDate);
    }

    const itemData: ChecklistItem = {
      id: editingItem?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      completed: editingItem?.completed || false,
      dueDate: dueDate,
      assignedTo: formData.assignedTo,
      notes: formData.notes,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedItems: ChecklistItem[];
    if (editingItem) {
      updatedItems = checklist.map((item) =>
        item.id === editingItem.id ? itemData : item,
      );
    } else {
      updatedItems = [...checklist, itemData];
    }

    saveChecklist(updatedItems);
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      category: "before",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      notes: "",
    });

    toast.success(
      editingItem ? "Item atualizado!" : "Item adicionado ao checklist!",
    );
  };

  const toggleComplete = (id: string) => {
    const updatedItems = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    saveChecklist(updatedItems);
    toast.success("Status atualizado!");
  };

  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      category: item.category,
      priority: item.priority,
      dueDate: item.dueDate ? convertISODateToBR(item.dueDate) : "",
      assignedTo: item.assignedTo || "",
      notes: item.notes || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const updatedItems = checklist.filter((item) => item.id !== id);
      saveChecklist(updatedItems);
      toast.success("Item excluído!");
    }
  };

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Checklist da Viagem
            </CardTitle>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-sm text-gray-600">
                {stats.completed}/{stats.total} concluídos
              </span>
            </div>
            <Progress value={stats.percentage} className="h-3" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {stats.byCategory.map(({ category, total, completed }) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {completed}/{total}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getCategoryName(category)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          size="sm"
        >
          Todos ({checklist.length})
        </Button>
        {(["before", "packing", "during", "after"] as const).map((category) => {
          const count = checklist.filter(
            (item) => item.category === category,
          ).length;
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {getCategoryName(category)} ({count})
            </Button>
          );
        })}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {getFilteredItems().length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum item encontrado</p>
            </CardContent>
          </Card>
        ) : (
          getFilteredItems().map((item) => (
            <Card
              key={item.id}
              className={`${item.completed ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" : "dark:bg-gray-800 dark:border-gray-700"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleComplete(item.id)}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-medium ${item.completed ? "line-through text-gray-500" : ""}`}
                        >
                          {item.title}
                        </h3>
                        <Badge className={getCategoryColor(item.category)}>
                          {getCategoryName(item.category)}
                        </Badge>
                        <Badge className={getPriorityColor(item.priority)}>
                          {getPriorityIcon(item.priority)}
                          <span className="ml-1 capitalize">
                            {item.priority}
                          </span>
                        </Badge>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {item.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.dueDate).toLocaleDateString("pt-BR")}
                          </div>
                        )}

                        {item.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.assignedTo}
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setShowAddModal(false);
            setEditingItem(null);
            setFormData({
              title: "",
              description: "",
              category: "before",
              priority: "medium",
              dueDate: "",
              assignedTo: "",
              notes: "",
            });
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Item" : "Adicionar Item ao Checklist"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Verificar passaporte"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detalhes sobre o item..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as ChecklistItem["category"],
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="before">Antes da Viagem</option>
                    <option value="packing">Fazer as Malas</option>
                    <option value="during">Durante a Viagem</option>
                    <option value="after">Após a Viagem</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as ChecklistItem["priority"],
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Data Limite</Label>
                  <DatePicker
                    value={formData.dueDate}
                    onChange={(value) => {
                      setFormData({ ...formData, dueDate: value || "" });
                    }}
                    placeholder="dd/mm/aaaa"
                    minDate={
                      trip.startDate
                        ? convertBRDateToISO(trip.startDate)
                        : undefined
                    }
                    maxDate={
                      trip.endDate
                        ? convertBRDateToISO(trip.endDate)
                        : undefined
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="assignedTo">Responsável</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    placeholder="Nome da pessoa"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
