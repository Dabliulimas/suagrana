"use client";

import { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  color: string;
}

interface BudgetEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: BudgetCategory[]) => void;
  initialCategories: BudgetCategory[];
}

export function BudgetEditor({
  isOpen,
  onClose,
  onSave,
  initialCategories,
}: BudgetEditorProps) {
  const [categories, setCategories] =
    useState<BudgetCategory[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", budgeted: 0 });

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const colors = [
    "bg-blue-500",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  const handleAddCategory = () => {
    if (!newCategory.name.trim() || newCategory.budgeted <= 0) {
      toast.error("Preencha o nome e valor da categoria");
      return;
    }

    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name.trim(),
      budgeted: newCategory.budgeted,
      color: colors[categories.length % colors.length],
    };

    setCategories([...categories, category]);
    setNewCategory({ name: "", budgeted: 0 });
    toast.success("Categoria adicionada!");
  };

  const handleUpdateCategory = (
    id: string,
    updates: Partial<BudgetCategory>,
  ) => {
    setCategories(
      categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
    );
    setEditingId(null);
    toast.success("Categoria atualizada!");
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    toast.success("Categoria removida!");
  };

  const handleSave = () => {
    onSave(categories);
    onClose();
    toast.success("Orçamento salvo com sucesso!");
  };

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgeted, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Orçamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  R${" "}
                  {totalBudget.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-500">Total orçado por mês</p>
              </div>
            </CardContent>
          </Card>

          {/* Adicionar Nova Categoria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Categoria</Label>
                  <Input
                    placeholder="Ex: Alimentação"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Valor Orçado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newCategory.budgeted || ""}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        budgeted: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Categoria
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Categorias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorias do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma categoria adicionada ainda
                </p>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${category.color}`}
                      />
                      {editingId === category.id ? (
                        <div className="flex gap-2">
                          <Input
                            className="w-32"
                            defaultValue={category.name}
                            onBlur={(e) =>
                              handleUpdateCategory(category.id, {
                                name: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateCategory(category.id, {
                                  name: e.currentTarget.value,
                                });
                              }
                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-medium">{category.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {editingId === category.id ? (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            defaultValue={category.budgeted}
                            onBlur={(e) =>
                              handleUpdateCategory(category.id, {
                                budgeted:
                                  Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdateCategory(category.id, {
                                  budgeted:
                                    Number.parseFloat(e.currentTarget.value) ||
                                    0,
                                });
                              }
                              if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold">
                            R${" "}
                            {category.budgeted.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(category.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Orçamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
