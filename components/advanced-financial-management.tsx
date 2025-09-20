"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
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
} from "./ui/alert-dialog";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Tag as TagIcon,
  Users,
  Target,
  Zap,
  AlertTriangle,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  Search,
  Save,
  X,
  CheckCircle,
  Clock,
  DollarSign,
  Palette,
  Lightbulb,
  Shield,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import type {
  Category,
  Subcategory,
  Tag,
  FamilyMember,
  AutomationRule,
  BudgetLimit,
  BudgetAlert,
  RuleCondition,
  RuleAction,
} from "../types";

interface AdvancedFinancialManagementProps {
  onUpdate?: () => void;
}

export function AdvancedFinancialManagement({
  onUpdate,
}: AdvancedFinancialManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [activeTab, setActiveTab] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#3B82F6",
    icon: "DollarSign",
    monthlyLimit: "",
    description: "",
  });

  // Subcategory form state
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    categoryId: "",
    color: "#6B7280",
    icon: "Tag",
    monthlyLimit: "",
    description: "",
  });

  // Tag form state
  const [tagForm, setTagForm] = useState({
    name: "",
    color: "#10B981",
    description: "",
  });

  // Family member form state
  const [familyMemberForm, setFamilyMemberForm] = useState({
    name: "",
    relationship: "",
    color: "#8B5CF6",
    avatar: "",
  });

  // Automation rule form state
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    conditions: [] as RuleCondition[],
    actions: [] as RuleAction[],
    priority: 1,
  });

  // Budget limit form state
  const [budgetForm, setBudgetForm] = useState({
    categoryId: "",
    subcategoryId: "",
    familyMemberId: "",
    tagId: "",
    monthlyLimit: "",
    alertThreshold: "80",
    notifications: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // Load categories
      const savedCategories = localStorage.getItem("categories");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        // Default categories
        const defaultCategories: Category[] = [
          {
            id: "1",
            name: "Alimentação",
            type: "expense",
            color: "#EF4444",
            icon: "Utensils",
            subcategories: [
              {
                id: "1-1",
                name: "Supermercado",
                categoryId: "1",
                color: "#F87171",
                icon: "ShoppingCart",
                monthlyLimit: 800,
                description: "",
                isActive: true,
              },
              {
                id: "1-2",
                name: "Restaurantes",
                categoryId: "1",
                color: "#FCA5A5",
                icon: "Coffee",
                monthlyLimit: 400,
                description: "",
                isActive: true,
              },
            ],
            monthlyLimit: 1200,
            description: "Gastos com alimentação e bebidas",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Transporte",
            type: "expense",
            color: "#3B82F6",
            icon: "Car",
            subcategories: [
              {
                id: "2-1",
                name: "Combustível",
                categoryId: "2",
                color: "#60A5FA",
                icon: "Fuel",
                monthlyLimit: 300,
                description: "",
                isActive: true,
              },
              {
                id: "2-2",
                name: "Transporte Público",
                categoryId: "2",
                color: "#93C5FD",
                icon: "Bus",
                monthlyLimit: 150,
                description: "",
                isActive: true,
              },
            ],
            monthlyLimit: 500,
            description: "Gastos com locomoção",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];
        setCategories(defaultCategories);
        localStorage.setItem("categories", JSON.stringify(defaultCategories));
      }

      // Load tags
      const savedTags = localStorage.getItem("tags");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedTags) {
        setTags(JSON.parse(savedTags));
      } else {
        const defaultTags = [
          {
            id: "1",
            name: "Essencial",
            color: "#EF4444",
            description: "Gastos essenciais e prioritários",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Lazer",
            color: "#10B981",
            description: "Gastos com entretenimento",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Trabalho",
            color: "#3B82F6",
            description: "Gastos relacionados ao trabalho",
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];
        setTags(defaultTags);
        localStorage.setItem("tags", JSON.stringify(defaultTags));
      }

      // Load family members
      const savedMembers = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedMembers) {
        setFamilyMembers(JSON.parse(savedMembers));
      } else {
        setFamilyMembers([]);
      }

      // Load automation rules
      const savedRules = localStorage.getItem("automationRules");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedRules) {
        setAutomationRules(JSON.parse(savedRules));
      } else {
        const defaultRules: AutomationRule[] = [
          {
            id: "1",
            name: "Supermercado Automático",
            description: "Categoriza automaticamente compras em supermercados",
            conditions: [
              {
                field: "description",
                operator: "contains",
                value: "supermercado",
                caseSensitive: false,
              },
            ],
            actions: [
              { type: "set_category", value: "1" },
              { type: "set_subcategory", value: "1-1" },
              { type: "add_tag", value: "1" },
            ],
            isActive: true,
            priority: 1,
            createdAt: new Date().toISOString(),
            triggerCount: 15,
          },
        ];
        setAutomationRules(defaultRules);
        localStorage.setItem("automationRules", JSON.stringify(defaultRules));
      }

      // Load budget limits
      const savedBudgets = localStorage.getItem("budgetLimits");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedBudgets) {
        setBudgetLimits(JSON.parse(savedBudgets));
      } else {
        const defaultBudgets = [
          {
            id: "1",
            categoryId: "1",
            monthlyLimit: 1200,
            currentSpent: 850,
            alertThreshold: 80,
            isActive: true,
            notifications: true,
            createdAt: new Date().toISOString(),
            month: new Date().toISOString().slice(0, 7),
          },
        ];
        setBudgetLimits(defaultBudgets);
        localStorage.setItem("budgetLimits", JSON.stringify(defaultBudgets));
      }

      // Load budget alerts
      const savedAlerts = localStorage.getItem("budgetAlerts");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedAlerts) {
        setBudgetAlerts(JSON.parse(savedAlerts));
      } else {
        const defaultAlerts: BudgetAlert[] = [
          {
            id: "1",
            budgetLimitId: "1",
            type: "warning",
            message: "Você já gastou 70% do orçamento de Alimentação este mês",
            percentage: 70,
            amount: 850,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setBudgetAlerts(defaultAlerts);
        localStorage.setItem("budgetAlerts", JSON.stringify(defaultAlerts));
      }
    } catch (error) {
      logComponents.error("Error loading advanced financial data:", error);
      setCategories([]);
      setTags([]);
      setFamilyMembers([]);
      setAutomationRules([]);
      setBudgetLimits([]);
      setBudgetAlerts([]);
    }
  };

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    const newCategory: Category = {
      id: editingItem?.id || Date.now().toString(),
      name: categoryForm.name,
      type: categoryForm.type,
      color: categoryForm.color,
      icon: categoryForm.icon,
      subcategories: editingItem?.subcategories || [],
      monthlyLimit: categoryForm.monthlyLimit
        ? parseFloat(categoryForm.monthlyLimit)
        : undefined,
      description: categoryForm.description,
      isActive: true,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedCategories: Category[];
    if (editingItem) {
      updatedCategories = categories.map((cat) =>
        cat.id === editingItem.id ? newCategory : cat,
      );
      toast.success("Categoria atualizada com sucesso!");
    } else {
      updatedCategories = [...categories, newCategory];
      toast.success("Categoria criada com sucesso!");
    }

    // Save to localStorage
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
    setCategories(updatedCategories);

    resetCategoryForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const handleSaveTag = () => {
    if (!tagForm.name.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }

    const newTag: Tag = {
      id: editingItem?.id || Date.now().toString(),
      name: tagForm.name,
      color: tagForm.color,
      description: tagForm.description,
      isActive: true,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedTags: Tag[];
    if (editingItem) {
      updatedTags = tags.map((tag) =>
        tag.id === editingItem.id ? newTag : tag,
      );
      toast.success("Tag atualizada com sucesso!");
    } else {
      updatedTags = [...tags, newTag];
      toast.success("Tag criada com sucesso!");
    }

    // Save to localStorage
    localStorage.setItem("tags", JSON.stringify(updatedTags));
    setTags(updatedTags);

    resetTagForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const handleSaveFamilyMember = () => {
    if (!familyMemberForm.name.trim()) {
      toast.error("Nome do membro da família é obrigatório");
      return;
    }

    const newMember: FamilyMember = {
      id: editingItem?.id || Date.now().toString(),
      name: familyMemberForm.name,
      relationship: familyMemberForm.relationship,
      color: familyMemberForm.color,
      avatar: familyMemberForm.avatar,
      isActive: true,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedMembers: FamilyMember[];
    if (editingItem) {
      updatedMembers = familyMembers.map((member) =>
        member.id === editingItem.id ? newMember : member,
      );
      toast.success("Membro da família atualizado com sucesso!");
    } else {
      updatedMembers = [...familyMembers, newMember];
      toast.success("Membro da família adicionado com sucesso!");
    }

    // Save to localStorage
    localStorage.setItem("familyMembers", JSON.stringify(updatedMembers));
    setFamilyMembers(updatedMembers);

    resetFamilyMemberForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      type: "expense",
      color: "#3B82F6",
      icon: "DollarSign",
      monthlyLimit: "",
      description: "",
    });
    setEditingItem(null);
  };

  const resetTagForm = () => {
    setTagForm({
      name: "",
      color: "#10B981",
      description: "",
    });
    setEditingItem(null);
  };

  const resetFamilyMemberForm = () => {
    setFamilyMemberForm({
      name: "",
      relationship: "",
      color: "#8B5CF6",
      avatar: "",
    });
    setEditingItem(null);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      monthlyLimit: category.monthlyLimit?.toString() || "",
      description: category.description || "",
    });
    setEditingItem(category);
    setIsDialogOpen(true);
  };

  const handleEditTag = (tag: Tag) => {
    setTagForm({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
    setEditingItem(tag);
    setIsDialogOpen(true);
  };

  const handleEditFamilyMember = (member: FamilyMember) => {
    setFamilyMemberForm({
      name: member.name,
      relationship: member.relationship,
      color: member.color,
      avatar: member.avatar || "",
    });
    setEditingItem(member);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    const updatedCategories = categories.filter((cat) => cat.id !== id);
    localStorage.setItem("categories", JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
    toast.success("Categoria removida com sucesso!");
    onUpdate?.();
  };

  const handleDeleteTag = (id: string) => {
    const updatedTags = tags.filter((tag) => tag.id !== id);
    localStorage.setItem("tags", JSON.stringify(updatedTags));
    setTags(updatedTags);
    toast.success("Tag removida com sucesso!");
    onUpdate?.();
  };

  const handleDeleteFamilyMember = (id: string) => {
    const updatedMembers = familyMembers.filter((member) => member.id !== id);
    localStorage.setItem("familyMembers", JSON.stringify(updatedMembers));
    setFamilyMembers(updatedMembers);
    toast.success("Membro da família removido com sucesso!");
    onUpdate?.();
  };

  const handleCreateBudgetLimit = () => {
    if (categories.length === 0) {
      toast.error(
        "Crie pelo menos uma categoria antes de definir limites de orçamento",
      );
      return;
    }

    const newBudgetLimit: BudgetLimit = {
      id: Date.now().toString(),
      categoryId: categories[0].id,
      monthlyLimit: 1000,
      currentSpent: 0,
      alertThreshold: 80,
      isActive: true,
      notifications: true,
      createdAt: new Date().toISOString(),
      month: new Date().toISOString().slice(0, 7),
    };

    const updatedBudgets = [...budgetLimits, newBudgetLimit];
    localStorage.setItem("budgetLimits", JSON.stringify(updatedBudgets));
    setBudgetLimits(updatedBudgets);
    toast.success(
      "Novo limite de orçamento criado! Edite os valores conforme necessário.",
    );
    onUpdate?.();
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredFamilyMembers = familyMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Gestão Pro
          </h2>
          <p className="text-gray-600">
            Configure categorias, tags, membros da família, regras automáticas e
            limites de orçamento
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Família
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Orçamentos
          </TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Categorias e Subcategorias
            </h3>
            <Dialog
              open={isDialogOpen && activeTab === "categories"}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetCategoryForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar Categoria" : "Nova Categoria"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Nome</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Alimentação"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-type">Tipo</Label>
                    <Select
                      value={categoryForm.type}
                      onValueChange={(value: "income" | "expense") =>
                        setCategoryForm((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-color">Cor</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={categoryForm.color}
                          onChange={(e) =>
                            setCategoryForm((prev) => ({
                              ...prev,
                              color: e.target.value,
                            }))
                          }
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category-limit">Limite Mensal (R$)</Label>
                      <Input
                        id="category-limit"
                        type="number"
                        value={categoryForm.monthlyLimit}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            monthlyLimit: e.target.value,
                          }))
                        }
                        placeholder="1000.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category-description">Descrição</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descrição da categoria..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveCategory} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {category.type === "expense" ? "Despesa" : "Receita"}
                          {category.monthlyLimit &&
                            ` • Limite: R$ ${(category.monthlyLimit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a categoria "
                              {category.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {category.subcategories.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">
                        Subcategorias
                      </h4>
                      <div className="grid gap-2">
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span className="text-sm">{sub.name}</span>
                              {sub.monthlyLimit && (
                                <Badge variant="outline" className="text-xs">
                                  R${" "}
                                  {(sub.monthlyLimit || 0).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tags</h3>
            <Dialog
              open={isDialogOpen && activeTab === "tags"}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetTagForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tag
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar Tag" : "Nova Tag"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Nome</Label>
                    <Input
                      id="tag-name"
                      value={tagForm.name}
                      onChange={(e) =>
                        setTagForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: Essencial"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-color">Cor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="tag-color"
                        type="color"
                        value={tagForm.color}
                        onChange={(e) =>
                          setTagForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={tagForm.color}
                        onChange={(e) =>
                          setTagForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        placeholder="#10B981"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tag-description">Descrição</Label>
                    <Textarea
                      id="tag-description"
                      value={tagForm.description}
                      onChange={(e) =>
                        setTagForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descrição da tag..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveTag} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag) => (
              <Card key={tag.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <h4 className="font-medium">{tag.name}</h4>
                        {tag.description && (
                          <p className="text-sm text-gray-500">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTag(tag)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a tag "{tag.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTag(tag.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Family Members Tab */}
        <TabsContent value="family" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Membros da Família</h3>
            <Dialog
              open={isDialogOpen && activeTab === "family"}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetFamilyMemberForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Membro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar Membro" : "Novo Membro da Família"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member-name">Nome</Label>
                    <Input
                      id="member-name"
                      value={familyMemberForm.name}
                      onChange={(e) =>
                        setFamilyMemberForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Ex: João"
                    />
                  </div>
                  <div>
                    <Label htmlFor="member-relationship">Parentesco</Label>
                    <Select
                      value={familyMemberForm.relationship}
                      onValueChange={(value) =>
                        setFamilyMemberForm((prev) => ({
                          ...prev,
                          relationship: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parentesco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pai">Pai</SelectItem>
                        <SelectItem value="Mãe">Mãe</SelectItem>
                        <SelectItem value="Filho">Filho</SelectItem>
                        <SelectItem value="Filha">Filha</SelectItem>
                        <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                        <SelectItem value="Irmão">Irmão</SelectItem>
                        <SelectItem value="Irmã">Irmã</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="member-color">Cor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="member-color"
                        type="color"
                        value={familyMemberForm.color}
                        onChange={(e) =>
                          setFamilyMemberForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        className="w-12 h-10 p-1 border rounded"
                      />
                      <Input
                        value={familyMemberForm.color}
                        onChange={(e) =>
                          setFamilyMemberForm((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }))
                        }
                        placeholder="#8B5CF6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveFamilyMember} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFamilyMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-500">
                          {member.relationship}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditFamilyMember(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{member.name}" da
                              família?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDeleteFamilyMember(member.id)
                              }
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Regras de Automação</h3>
            <Button
              onClick={() => {
                setActiveTab("rules");
                // Redirect to automation rules manager or open modal
                toast.info(
                  "Use a aba 'Regras' no menu principal para gerenciar regras de automação",
                );
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="grid gap-4">
            {automationRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${rule.isActive ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {rule.triggerCount} execuções
                      </Badge>
                      <Switch checked={rule.isActive} />
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Condições
                      </h4>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div
                            key={`condition-${index}`}
                            className="text-sm bg-blue-50 p-2 rounded"
                          >
                            Se <strong>{condition.field}</strong>{" "}
                            {condition.operator} "
                            <strong>{condition.value}</strong>"
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Ações
                      </h4>
                      <div className="space-y-1">
                        {rule.actions.map((action, index) => (
                          <div
                            key={`action-${index}`}
                            className="text-sm bg-green-50 p-2 rounded"
                          >
                            {action.type === "set_category" &&
                              "Definir categoria"}
                            {action.type === "set_subcategory" &&
                              "Definir subcategoria"}
                            {action.type === "add_tag" && "Adicionar tag"}
                            {action.type === "set_family_member" &&
                              "Definir membro da família"}
                            : <strong>{action.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Budget Limits Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Limites de Orçamento</h3>
            <Button onClick={() => handleCreateBudgetLimit()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Limite
            </Button>
          </div>

          {/* Budget Alerts */}
          {budgetAlerts.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Bell className="w-5 h-5" />
                  Alertas de Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {budgetAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            alert.type === "exceeded"
                              ? "text-red-500"
                              : alert.type === "warning"
                                ? "text-orange-500"
                                : "text-yellow-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          alert.type === "exceeded"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {alert.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {budgetLimits.map((limit) => {
              const category = categories.find(
                (cat) => cat.id === limit.categoryId,
              );
              const percentage =
                (limit.currentSpent / limit.monthlyLimit) * 100;
              const isOverBudget = percentage > 100;
              const isNearLimit = percentage > limit.alertThreshold;

              return (
                <Card
                  key={limit.id}
                  className={
                    isOverBudget
                      ? "border-red-200"
                      : isNearLimit
                        ? "border-orange-200"
                        : ""
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: category?.color || "#6B7280",
                          }}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {category?.name || "Categoria"}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {new Date(limit.month + "-01").toLocaleDateString(
                              "pt-BR",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${isOverBudget ? "text-red-600" : isNearLimit ? "text-orange-600" : "text-green-600"}`}
                        >
                          R${" "}
                          {limit.currentSpent.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          de R${" "}
                          {limit.monthlyLimit.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverBudget
                              ? "bg-red-500"
                              : isNearLimit
                                ? "bg-orange-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span
                          className={
                            isOverBudget
                              ? "text-red-600"
                              : isNearLimit
                                ? "text-orange-600"
                                : "text-green-600"
                          }
                        >
                          {percentage.toFixed(1)}% utilizado
                        </span>
                        <span className="text-gray-500">
                          Restam R${" "}
                          {Math.max(
                            0,
                            limit.monthlyLimit - limit.currentSpent,
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {isOverBudget && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Orçamento excedido em R${" "}
                          {(
                            limit.currentSpent - limit.monthlyLimit
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
