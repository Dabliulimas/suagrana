"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { DatePicker } from "../ui/date-picker";
import {
  DollarSign,
  Users,
  Tag as TagIcon,
  MapPin,
  Calendar,
  FileText,
  Zap,
  Plus,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAccounts, useTransactions } from "../../../contexts/unified-context";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from "../../../lib/utils/date-utils";
import type {
  Transaction,
  Category,
  Subcategory,
  Tag,
  FamilyMember,
  AutomationRule,
} from "../types";

interface EnhancedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Partial<Transaction>) => void;
  editingTransaction?: Transaction | null;
  tripId?: string;
}

export function EnhancedTransactionModal({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}: EnhancedTransactionModalProps) {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "",
    subcategory: "",
    account: "",
    date: getCurrentDateBR(),
    tags: [] as string[],
    familyMember: "",
    location: "",
    notes: "",
    recurring: false,
    recurringType: "indefinite" as "indefinite" | "specific",
    recurringFrequency: "monthly" as "weekly" | "monthly" | "yearly",
    recurringEndDate: "",
    recurringOccurrences: "",
    installments: "",
    currentInstallment: "1",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedCategory, setSuggestedCategory] = useState<string>("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (editingTransaction) {
        populateForm(editingTransaction);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingTransaction]);

  useEffect(() => {
    // Apply automation rules when description changes
    if (formData.description && !editingTransaction) {
      applyAutomationRules();
    }
  }, [formData.description]);

  const loadData = async () => {
    try {
      // Get real data from storage
      const { storage } = await import("@/lib/storage");

      // Load categories from storage
      const storedCategories = storage.getCategories();
      if (storedCategories.length > 0) {
        setCategories(storedCategories);
      } else {
        // Use default categories if none exist
        const defaultCategories = [
          {
            id: "1",
            name: "Alimentação",
            type: "expense" as const,
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
            type: "expense" as const,
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
      }

      // Load tags from storage
      const storedTags = storage.getTags();
      if (storedTags.length > 0) {
        setTags(storedTags);
      } else {
        // Use default tags if none exist
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
      }

      // Load family members from storage
      const storedFamilyMembers = storage.getFamilyMembers();
      setFamilyMembers(storedFamilyMembers);

      // Load automation rules from storage
      const storedRules = storage.getAutomationRules();
      if (storedRules.length > 0) {
        setAutomationRules(storedRules);
      } else {
        // Use default rules if none exist
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
              { type: "set_category", value: "Alimentação" },
              { type: "set_subcategory", value: "Supermercado" },
              { type: "add_tag", value: "Essencial" },
            ],
            isActive: true,
            priority: 1,
            createdAt: new Date().toISOString(),
            triggerCount: 15,
          },
          {
            id: "2",
            name: "Posto de Gasolina",
            description: "Categoriza automaticamente gastos com combustível",
            conditions: [
              {
                field: "description",
                operator: "contains",
                value: "posto",
                caseSensitive: false,
              },
            ],
            actions: [
              { type: "set_category", value: "Transporte" },
              { type: "set_subcategory", value: "Combustível" },
              { type: "add_tag", value: "Essencial" },
            ],
            isActive: true,
            priority: 2,
            createdAt: new Date().toISOString(),
            triggerCount: 8,
          },
          {
            id: "3",
            name: "Netflix e Streaming",
            description: "Categoriza automaticamente assinaturas de streaming",
            conditions: [
              {
                field: "description",
                operator: "contains",
                value: "netflix",
                caseSensitive: false,
              },
            ],
            actions: [
              { type: "set_category", value: "Lazer" },
              { type: "add_tag", value: "Lazer" },
              { type: "set_notes", value: "Assinatura mensal de streaming" },
            ],
            isActive: true,
            priority: 3,
            createdAt: new Date().toISOString(),
            triggerCount: 12,
          },
        ];
        setAutomationRules(defaultRules);
      }
    } catch (error) {
      logComponents.error("Error loading data:", error);
      // Fallback to empty arrays if storage fails
      setCategories([]);
      setTags([]);
      setFamilyMembers([]);
      setAutomationRules([]);
    }
  };

  const populateForm = (transaction: Transaction) => {
    setFormData({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      type: transaction.type === "income" ? "income" : "expense",
      category: transaction.category,
      subcategory: transaction.subcategory || "",
      account: transaction.account || "",
      date: convertISODateToBR(transaction.date),
      tags: transaction.tags || [],
      familyMember: transaction.familyMember || "",
      location: transaction.location || "",
      notes: transaction.notes || "",
      recurring: transaction.recurring || false,
      recurringType: (transaction as any).recurringType || "indefinite",
      recurringFrequency: (transaction as any).recurringFrequency || "monthly",
      recurringEndDate: (transaction as any).recurringEndDate || "",
      recurringOccurrences:
        (transaction as any).recurringOccurrences?.toString() || "",
      installments: transaction.installments?.toString() || "",
      currentInstallment: transaction.currentInstallment?.toString() || "1",
    });
    setSelectedTags(transaction.tags || []);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      type: "expense",
      category: "",
      subcategory: "",
      account: "",
      date: getCurrentDateBR(),
      tags: [],
      familyMember: "",
      location: "",
      notes: "",
      recurring: false,
      recurringType: "indefinite",
      recurringFrequency: "monthly",
      recurringEndDate: "",
      recurringOccurrences: "",
      installments: "",
      currentInstallment: "1",
    });
    setSelectedTags([]);
    setSuggestedCategory("");
    setSuggestedTags([]);
  };

  const applyAutomationRules = () => {
    if (!formData.description || formData.description.length < 3) return;

    const activeRules = automationRules.filter((rule) => rule.isActive);

    for (const rule of activeRules) {
      let allConditionsMet = true;

      for (const condition of rule.conditions) {
        let fieldValue = "";

        switch (condition.field) {
          case "description":
            fieldValue = formData.description.toLowerCase();
            break;
          case "amount":
            fieldValue = formData.amount;
            break;
          case "category":
            fieldValue = formData.category.toLowerCase();
            break;
          default:
            fieldValue = "";
        }

        const conditionValue = condition.value.toString().toLowerCase();

        switch (condition.operator) {
          case "contains":
            if (!fieldValue.includes(conditionValue)) {
              allConditionsMet = false;
            }
            break;
          case "equals":
            if (fieldValue !== conditionValue) {
              allConditionsMet = false;
            }
            break;
          case "starts_with":
            if (!fieldValue.startsWith(conditionValue)) {
              allConditionsMet = false;
            }
            break;
          case "ends_with":
            if (!fieldValue.endsWith(conditionValue)) {
              allConditionsMet = false;
            }
            break;
          case "greater_than":
            if (parseFloat(fieldValue) <= parseFloat(conditionValue)) {
              allConditionsMet = false;
            }
            break;
          case "less_than":
            if (parseFloat(fieldValue) >= parseFloat(conditionValue)) {
              allConditionsMet = false;
            }
            break;
        }

        if (!allConditionsMet) break;
      }

      if (allConditionsMet) {
        // Apply actions
        for (const action of rule.actions) {
          switch (action.type) {
            case "set_category":
              const category = categories.find(
                (cat) => cat.name.toLowerCase() === action.value.toLowerCase(),
              );
              if (category) {
                setSuggestedCategory(category.name);
                setFormData((prev) => ({ ...prev, category: category.name }));
              }
              break;
            case "set_subcategory":
              const subcategory = subcategories.find(
                (sub) => sub.name.toLowerCase() === action.value.toLowerCase(),
              );
              if (subcategory) {
                setFormData((prev) => ({
                  ...prev,
                  subcategory: subcategory.name,
                }));
              }
              break;
            case "add_tag":
              const tag = tags.find(
                (t) => t.name.toLowerCase() === action.value.toLowerCase(),
              );
              if (tag && !selectedTags.includes(tag.name)) {
                setSuggestedTags((prev) => [...prev, tag.name]);
                setSelectedTags((prev) => [...prev, tag.name]);
              }
              break;
            case "set_family_member":
              const member = familyMembers.find(
                (m) => m.name.toLowerCase() === action.value.toLowerCase(),
              );
              if (member) {
                setFormData((prev) => ({ ...prev, familyMember: member.name }));
              }
              break;
            case "set_notes":
              setFormData((prev) => ({ ...prev, notes: action.value }));
              break;
          }
        }
        break; // Apply only the first matching rule
      }
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      subcategory: "",
    }));

    const category = categories.find((cat) => cat.name === categoryName);
    if (category) {
      setSubcategories(category.subcategories);
    } else {
      setSubcategories([]);
    }
  };

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((t) => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const handleSave = () => {
    if (!formData.description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    if (!formData.category) {
      toast.error("Categoria é obrigatória");
      return;
    }

    if (!validateBRDate(formData.date)) {
      toast.error("Data inválida. Use o formato dd/mm/aaaa");
      return;
    }

    if (
      formData.recurringEndDate &&
      !validateBRDate(formData.recurringEndDate)
    ) {
      toast.error("Data de término inválida. Use o formato dd/mm/aaaa");
      return;
    }

    const transaction: Partial<Transaction> = {
      description: formData.description,
      amount:
        formData.type === "expense"
          ? -parseFloat(formData.amount)
          : parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      account: formData.account,
      date: convertBRDateToISO(formData.date),
      tags: selectedTags,
      familyMember: formData.familyMember || undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
      recurring: formData.recurring,
      installments: formData.installments
        ? parseInt(formData.installments)
        : undefined,
      currentInstallment: formData.currentInstallment
        ? parseInt(formData.currentInstallment)
        : undefined,
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(transaction);
    onClose();
    toast({
      title: "Sucesso",
      description: editingTransaction
        ? "Transação atualizada!"
        : "Transação adicionada!",
    });
  };

  const expenseCategories = categories.filter((cat) => cat.type === "expense");
  const incomeCategories = categories.filter((cat) => cat.type === "income");
  const availableCategories =
    formData.type === "expense" ? expenseCategories : incomeCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {editingTransaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="categorization">Categorização</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Automation suggestions */}
            {(suggestedCategory || suggestedTags.length > 0) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Sugestões Automáticas
                  </span>
                </div>
                {suggestedCategory && (
                  <p className="text-sm text-blue-700">
                    Categoria sugerida: <strong>{suggestedCategory}</strong>
                  </p>
                )}
                {suggestedTags.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-blue-700">
                      Tags sugeridas:
                    </span>
                    {suggestedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-blue-700 border-blue-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Ex: Compra no supermercado"
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "income" | "expense") =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                      category: "",
                      subcategory: "",
                    }))
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
              <div>
                <Label htmlFor="date">Data</Label>
                <DatePicker
                  id="date"
                  value={convertBRDateToISO(formData.date)}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      date: convertISODateToBR(value),
                    }))
                  }
                  placeholder="Selecionar data"
                  maxDate={new Date()}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="account">Conta</Label>
              <Select
                value={formData.account}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, account: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conta-corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                  <SelectItem value="cartao-credito">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="categorization" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategoria</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subcategory: value }))
                  }
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma subcategoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subcategory.color }}
                          />
                          {subcategory.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              {suggestedTags.length > 0 && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Tags Sugeridas
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map((tagName) => (
                      <Badge
                        key={tagName}
                        variant={
                          selectedTags.includes(tagName)
                            ? "default"
                            : "secondary"
                        }
                        className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200"
                        onClick={() => handleTagToggle(tagName)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {tagName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.name) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    style={
                      selectedTags.includes(tag.name)
                        ? { backgroundColor: tag.color }
                        : {}
                    }
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    <TagIcon className="w-3 h-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="family-member">Membro da Família</Label>
              <Select
                value={formData.familyMember}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, familyMember: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro da família" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        {member.name} ({member.relationship})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Ex: Shopping Center, Posto de Gasolina"
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, recurring: checked }))
                  }
                />
                <Label htmlFor="recurring">Transação recorrente</Label>
              </div>
            </div>

            {formData.recurring && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="recurring-frequency">Frequência</Label>
                  <Select
                    value={formData.recurringFrequency}
                    onValueChange={(value: "weekly" | "monthly" | "yearly") =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringFrequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duração</Label>
                  <Select
                    value={formData.recurringType}
                    onValueChange={(value: "indefinite" | "specific") =>
                      setFormData((prev) => ({ ...prev, recurringType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indefinite">Até cancelar</SelectItem>
                      <SelectItem value="specific">
                        Período específico
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurringType === "specific" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurring-end-date">
                        Data de término
                      </Label>
                      <Input
                        id="recurring-end-date"
                        type="text"
                        placeholder="dd/mm/aaaa"
                        value={formData.recurringEndDate}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            recurringEndDate: formatted,
                          }));
                        }}
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recurring-occurrences">
                        Ou número de ocorrências
                      </Label>
                      <Input
                        id="recurring-occurrences"
                        type="number"
                        min="1"
                        value={formData.recurringOccurrences}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            recurringOccurrences: e.target.value,
                          }))
                        }
                        placeholder="Ex: 12"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="installments">Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  value={formData.installments}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      installments: e.target.value,
                    }))
                  }
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="current-installment">Parcela Atual</Label>
                <Input
                  id="current-installment"
                  type="number"
                  min="1"
                  value={formData.currentInstallment}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentInstallment: e.target.value,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {editingTransaction ? "Atualizar" : "Salvar"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
