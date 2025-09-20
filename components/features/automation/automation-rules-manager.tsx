"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
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
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  HelpCircle,
  TestTube,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { AutomationRule, RuleCondition, RuleAction } from "../types";

interface AutomationRulesManagerProps {
  onUpdate?: () => void;
}

export function AutomationRulesManager({
  onUpdate,
}: AutomationRulesManagerProps) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    priority: 1,
    conditions: [] as RuleCondition[],
    actions: [] as RuleAction[],
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = () => {
    try {
      const savedRules = localStorage.getItem("automationRules");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
        // Default rules
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
              { type: "add_tag", value: "Essencial" },
            ],
            isActive: true,
            priority: 1,
            createdAt: new Date().toISOString(),
            triggerCount: 25,
          },
        ];
        setRules(defaultRules);
        localStorage.setItem("automationRules", JSON.stringify(defaultRules));
      }
    } catch (error) {
      logComponents.error("Error loading automation rules:", error);
      setRules([]);
    }
  };

  const handleSaveRule = () => {
    if (!ruleForm.name.trim()) {
      toast.error("Nome da regra é obrigatório");
      return;
    }

    if (ruleForm.conditions.length === 0) {
      toast.error("Adicione pelo menos uma condição");
      return;
    }

    if (ruleForm.actions.length === 0) {
      toast.error("Adicione pelo menos uma ação");
      return;
    }

    const newRule: AutomationRule = {
      id: editingRule?.id || Date.now().toString(),
      name: ruleForm.name,
      description: ruleForm.description,
      conditions: ruleForm.conditions,
      actions: ruleForm.actions,
      isActive: true,
      priority: ruleForm.priority,
      createdAt: editingRule?.createdAt || new Date().toISOString(),
      triggerCount: editingRule?.triggerCount || 0,
    };

    let updatedRules: AutomationRule[];
    if (editingRule) {
      updatedRules = rules.map((rule) =>
        rule.id === editingRule.id ? newRule : rule,
      );
      toast.success("Regra atualizada com sucesso!");
    } else {
      updatedRules = [...rules, newRule];
      toast.success("Regra criada com sucesso!");
    }

    // Save to localStorage
    localStorage.setItem("automationRules", JSON.stringify(updatedRules));
    setRules(updatedRules);

    resetForm();
    setIsDialogOpen(false);
    onUpdate?.();
  };

  const resetForm = () => {
    setRuleForm({
      name: "",
      description: "",
      priority: 1,
      conditions: [],
      actions: [],
    });
    setEditingRule(null);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      priority: rule.priority,
      conditions: rule.conditions,
      actions: rule.actions,
    });
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, isActive } : rule,
    );
    localStorage.setItem("automationRules", JSON.stringify(updatedRules));
    setRules(updatedRules);
    toast.success(`Regra ${isActive ? "ativada" : "desativada"} com sucesso!`);
    onUpdate?.();
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    localStorage.setItem("automationRules", JSON.stringify(updatedRules));
    setRules(updatedRules);
    toast.success("Regra excluída com sucesso!");
    onUpdate?.();
  };

  const testAutomationRules = () => {
    const testTransactions = [
      {
        description: "Compra no supermercado Extra",
        amount: "150.00",
        category: "",
      },
      {
        description: "Pagamento de conta de luz",
        amount: "89.50",
        category: "",
      },
      { description: "Salário mensal", amount: "3500.00", category: "" },
      { description: "Uber para o trabalho", amount: "25.00", category: "" },
    ];

    let results: string[] = [];
    const activeRules = rules.filter((rule) => rule.isActive);

    testTransactions.forEach((transaction, index) => {
      let appliedRules: string[] = [];

      activeRules.forEach((rule) => {
        let allConditionsMet = true;

        rule.conditions.forEach((condition) => {
          let fieldValue = "";

          switch (condition.field) {
            case "description":
              fieldValue = transaction.description.toLowerCase();
              break;
            case "amount":
              fieldValue = transaction.amount;
              break;
            case "category":
              fieldValue = transaction.category.toLowerCase();
              break;
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
          }
        });

        if (allConditionsMet) {
          appliedRules.push(rule.name);
        }
      });

      results.push(
        `Transação ${index + 1}: "${transaction.description}" - Regras aplicadas: ${appliedRules.length > 0 ? appliedRules.join(", ") : "Nenhuma"}`,
      );
    });

    setTestResult(results.join("\n"));
    toast.success("Teste de automação executado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Regras de Automação
          </h3>
          <p className="text-sm text-gray-600">
            Configure regras para categorizar transações automaticamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Como Funciona
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={testAutomationRules}
            disabled={rules.length === 0}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Testar Regras
          </Button>
        </div>
      </div>

      {/* Explanation Card */}
      {showExplanation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <Info className="w-5 h-5" />
              Como Funcionam as Regras de Automação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">
                📋 O que são Regras de Automação?
              </h4>
              <p>
                As regras de automação permitem categorizar e organizar suas
                transações automaticamente com base em condições que você
                define. Quando uma nova transação é adicionada, o sistema
                verifica se ela atende às condições de alguma regra ativa.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">⚙️ Como Criar uma Regra:</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  <strong>Nome e Descrição:</strong> Identifique sua regra com
                  um nome claro
                </li>
                <li>
                  <strong>Condições:</strong> Defina quando a regra deve ser
                  aplicada (ex: descrição contém "supermercado")
                </li>
                <li>
                  <strong>Ações:</strong> Escolha o que acontece quando a
                  condição é atendida (ex: definir categoria como "Alimentação")
                </li>
                <li>
                  <strong>Prioridade:</strong> Regras com prioridade maior
                  (número menor) são executadas primeiro
                </li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎯 Exemplos Práticos:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>Supermercado:</strong> Se descrição contém
                  "supermercado" → Categoria: "Alimentação", Tag: "Essencial"
                </li>
                <li>
                  <strong>Transporte:</strong> Se descrição contém "uber" ou
                  "taxi" → Categoria: "Transporte"
                </li>
                <li>
                  <strong>Salário:</strong> Se descrição contém "salário" e
                  valor &gt; R$ 1000 → Categoria: "Renda"
                </li>
              </ul>
            </div>

            <div className="bg-blue-100 p-3 rounded-lg">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Dica Pro:
              </h4>
              <p>
                Use o botão "Testar Regras" para verificar como suas regras
                funcionariam com transações de exemplo. Isso ajuda a validar se
                as condições estão corretas antes de ativar a regra.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResult && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <TestTube className="w-5 h-5" />
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setTestResult(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar Resultado
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regra" : "Nova Regra de Automação"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Nome da Regra</Label>
                <Input
                  id="rule-name"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Supermercado Automático"
                />
              </div>
              <div>
                <Label htmlFor="rule-description">Descrição</Label>
                <Textarea
                  id="rule-description"
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Descreva o que esta regra faz..."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="rule-priority">Prioridade</Label>
                <Input
                  id="rule-priority"
                  type="number"
                  min="1"
                  max="10"
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm((prev) => ({
                      ...prev,
                      priority: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Condições</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newCondition: RuleCondition = {
                      field: "description",
                      operator: "contains",
                      value: "",
                    };
                    setRuleForm((prev) => ({
                      ...prev,
                      conditions: [...prev.conditions, newCondition],
                    }));
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Condição
                </Button>
              </div>
              {ruleForm.conditions.map((condition, index) => (
                <div
                  key={`condition-${index}`}
                  className="grid grid-cols-3 gap-2 p-3 border rounded-lg"
                >
                  <Select
                    value={condition.field}
                    onValueChange={(value: any) => {
                      const newConditions = [...ruleForm.conditions];
                      newConditions[index].field = value;
                      setRuleForm((prev) => ({
                        ...prev,
                        conditions: newConditions,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="description">Descrição</SelectItem>
                      <SelectItem value="amount">Valor</SelectItem>
                      <SelectItem value="category">Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value: any) => {
                      const newConditions = [...ruleForm.conditions];
                      newConditions[index].operator = value;
                      setRuleForm((prev) => ({
                        ...prev,
                        conditions: newConditions,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contém</SelectItem>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="starts_with">Inicia com</SelectItem>
                      <SelectItem value="ends_with">Termina com</SelectItem>
                      <SelectItem value="greater_than">Maior que</SelectItem>
                      <SelectItem value="less_than">Menor que</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input
                      value={condition.value}
                      onChange={(e) => {
                        const newConditions = [...ruleForm.conditions];
                        newConditions[index].value = e.target.value;
                        setRuleForm((prev) => ({
                          ...prev,
                          conditions: newConditions,
                        }));
                      }}
                      placeholder="Valor"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newConditions = ruleForm.conditions.filter(
                          (_, i) => i !== index,
                        );
                        setRuleForm((prev) => ({
                          ...prev,
                          conditions: newConditions,
                        }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Ações</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newAction: RuleAction = {
                      type: "set_category",
                      value: "",
                    };
                    setRuleForm((prev) => ({
                      ...prev,
                      actions: [...prev.actions, newAction],
                    }));
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Ação
                </Button>
              </div>
              {ruleForm.actions.map((action, index) => (
                <div
                  key={`action-${index}`}
                  className="grid grid-cols-2 gap-2 p-3 border rounded-lg"
                >
                  <Select
                    value={action.type}
                    onValueChange={(value: any) => {
                      const newActions = [...ruleForm.actions];
                      newActions[index]// // // .type // Campo removido // Campo removido // Campo removido = value;
                      setRuleForm((prev) => ({ ...prev, actions: newActions }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set_category">
                        Definir Categoria
                      </SelectItem>
                      <SelectItem value="set_subcategory">
                        Definir Subcategoria
                      </SelectItem>
                      <SelectItem value="add_tag">Adicionar Tag</SelectItem>
                      <SelectItem value="set_family_member">
                        Definir Membro da Família
                      </SelectItem>
                      <SelectItem value="set_notes">
                        Definir Observações
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input
                      value={action.value}
                      onChange={(e) => {
                        const newActions = [...ruleForm.actions];
                        newActions[index].value = e.target.value;
                        setRuleForm((prev) => ({
                          ...prev,
                          actions: newActions,
                        }));
                      }}
                      placeholder="Valor"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newActions = ruleForm.actions.filter(
                          (_, i) => i !== index,
                        );
                        setRuleForm((prev) => ({
                          ...prev,
                          actions: newActions,
                        }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveRule} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Salvar Regra
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${rule.isActive ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-gray-500">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rule.triggerCount} execuções</Badge>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(checked) =>
                      handleToggleRule(rule.id, checked)
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AutomationRulesManager;
