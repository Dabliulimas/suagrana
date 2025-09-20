"use client";

import { storage, type Transaction } from "../storage";
import { logComponents } from "../logger";
import { toast } from "sonner";

export interface SmartBudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
  autoAdjust: boolean;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  priority: "essential" | "important" | "optional";
  tags: string[];
  lastUpdated: string;
  spendingPattern: "consistent" | "variable" | "seasonal";
  averageMonthlySpending: number;
}

export interface BudgetAlert {
  id: string;
  type: "warning" | "critical" | "info" | "success";
  category: string;
  title: string;
  message: string;
  threshold: number;
  currentPercentage: number;
  suggestedAction: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  acknowledged: boolean;
}

export interface AutoCategorizationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    field: "description" | "amount" | "merchant" | "account";
    operator:
      | "contains"
      | "equals"
      | "greater_than"
      | "less_than"
      | "starts_with"
      | "ends_with";
    value: string | number;
    caseSensitive?: boolean;
  }[];
  actions: {
    type: "set_category" | "set_subcategory" | "add_tag" | "set_priority";
    value: string;
  }[];
  confidence: number; // 0-100
  enabled: boolean;
  priority: number;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface BudgetInsight {
  id: string;
  type: "trend" | "anomaly" | "opportunity" | "recommendation";
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: string;
}

export interface SmartBudgetConfig {
  autoAdjustEnabled: boolean;
  alertFrequency: "realtime" | "daily" | "weekly";
  learningEnabled: boolean;
  predictiveAnalysis: boolean;
  anomalyDetection: boolean;
  smartRecommendations: boolean;
}

class SmartBudgetEngine {
  private categories: SmartBudgetCategory[] = [];
  private alerts: BudgetAlert[] = [];
  private rules: AutoCategorizationRule[] = [];
  private insights: BudgetInsight[] = [];
  private config: SmartBudgetConfig = {
    autoAdjustEnabled: true,
    alertFrequency: "realtime",
    learningEnabled: true,
    predictiveAnalysis: true,
    anomalyDetection: true,
    smartRecommendations: true,
  };

  async initialize() {
    await this.loadData();
    await this.createDefaultRules();
    this.startRealTimeMonitoring();
  }

  private async loadData() {
    try {
      // DEPRECADO: localStorage será removido em favor do dataService
      console.warn('SmartBudgetEngine: localStorage está deprecado, migre para dataService');
      
      const savedCategories = localStorage.getItem("smart-budget-categories");
      if (savedCategories) {
        this.categories = JSON.parse(savedCategories);
      }

      const savedAlerts = localStorage.getItem("smart-budget-alerts");
      if (savedAlerts) {
        this.alerts = JSON.parse(savedAlerts);
      }

      const savedRules = localStorage.getItem("auto-categorization-rules");
      if (savedRules) {
        this.rules = JSON.parse(savedRules);
      } else {
        await this.createDefaultRules();
      }

      const savedConfig = localStorage.getItem("smart-budget-config");
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      logComponents.error("Erro ao carregar dados do orçamento inteligente:", error);
    }
  }

  private async saveData() {
    try {
      // DEPRECADO: localStorage será removido em favor do dataService
      console.warn('SmartBudgetEngine: localStorage está deprecado, migre para dataService');
      
      localStorage.setItem(
        "smart-budget-categories",
        JSON.stringify(this.categories),
      );
      localStorage.setItem("smart-budget-alerts", JSON.stringify(this.alerts));
      localStorage.setItem(
        "auto-categorization-rules",
        JSON.stringify(this.rules),
      );
      localStorage.setItem("smart-budget-config", JSON.stringify(this.config));
    } catch (error) {
      logComponents.error("Erro ao salvar dados do orçamento inteligente:", error);
    }
  }

  // Auto-categorization methods
  async categorizeTransaction(transaction: Transaction): Promise<{
    category?: string;
    subcategory?: string;
    tags: string[];
    confidence: number;
    rule?: AutoCategorizationRule;
  }> {
    const results = {
      category: undefined as string | undefined,
      subcategory: undefined as string | undefined,
      tags: [] as string[],
      confidence: 0,
      rule: undefined as AutoCategorizationRule | undefined,
    };

    // Sort rules by priority (lower number = higher priority)
    const sortedRules = this.rules
      .filter((rule) => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, transaction)) {
        // Apply rule actions
        rule.actions.forEach((action) => {
          switch (action.type) {
            case "set_category":
              results.category = action.value;
              break;
            case "set_subcategory":
              results.subcategory = action.value;
              break;
            case "add_tag":
              if (!results.tags.includes(action.value)) {
                results.tags.push(action.value);
              }
              break;
          }
        });

        results.confidence = rule.confidence;
        results.rule = rule;

        // Update rule usage statistics
        rule.lastUsed = new Date().toISOString();
        rule.usageCount++;
        await this.saveData();

        break; // Use first matching rule
      }
    }

    // If no rule matched, try machine learning approach
    if (results.confidence === 0 && this.config.learningEnabled) {
      const mlResult = await this.mlCategorization(transaction);
      if (mlResult.confidence > 70) {
        results.category = mlResult.category;
        results.confidence = mlResult.confidence;
      }
    }

    return results;
  }

  private evaluateRule(
    rule: AutoCategorizationRule,
    transaction: Transaction,
  ): boolean {
    return rule.conditions.every((condition) => {
      let fieldValue: string | number;

      switch (condition.field) {
        case "description":
          fieldValue = transaction.description || "";
          break;
        case "amount":
          fieldValue = Math.abs(transaction.amount);
          break;
        case "merchant":
          fieldValue = transaction.merchant || transaction.description || "";
          break;
        case "account":
          fieldValue = transaction.accountId || "";
          break;
        default:
          return false;
      }

      return this.evaluateCondition(fieldValue, condition);
    });
  }

  private evaluateCondition(
    fieldValue: string | number,
    condition: any,
  ): boolean {
    const { operator, value, caseSensitive = false } = condition;

    if (typeof fieldValue === "string" && typeof value === "string") {
      const field = caseSensitive ? fieldValue : fieldValue.toLowerCase();
      const val = caseSensitive ? value : value.toLowerCase();

      switch (operator) {
        case "contains":
          return field.includes(val);
        case "equals":
          return field === val;
        case "starts_with":
          return field.startsWith(val);
        case "ends_with":
          return field.endsWith(val);
        default:
          return false;
      }
    }

    if (typeof fieldValue === "number" && typeof value === "number") {
      switch (operator) {
        case "equals":
          return fieldValue === value;
        case "greater_than":
          return fieldValue > value;
        case "less_than":
          return fieldValue < value;
        default:
          return false;
      }
    }

    return false;
  }

  private async mlCategorization(transaction: Transaction): Promise<{
    category: string;
    confidence: number;
  }> {
    // Simple ML-like categorization based on historical data
    const transactions = transactions;
    const categoryFrequency: Record<string, number> = {};
    const descriptionWords = (transaction.description || "")
      .toLowerCase()
      .split(/\s+/);

    // Analyze historical transactions for similar descriptions
    transactions.forEach((t) => {
      if (t.category && t.description) {
        const similarity = this.calculateSimilarity(
          transaction.description || "",
          t.description,
        );

        if (similarity > 0.6) {
          categoryFrequency[t.category] =
            (categoryFrequency[t.category] || 0) + similarity;
        }
      }
    });

    // Find most likely category
    const bestMatch = Object.entries(categoryFrequency).sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (bestMatch && bestMatch[1] > 0.7) {
      return {
        category: bestMatch[0],
        confidence: Math.min(bestMatch[1] * 100, 95),
      };
    }

    return { category: "Outros", confidence: 30 };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter((word) =>
      words2.some((w2) => w2.includes(word) || word.includes(w2)),
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Real-time budget monitoring
  private startRealTimeMonitoring() {
    if (this.config.alertFrequency !== "realtime") return;

    // Monitor every 30 seconds for new transactions
    setInterval(() => {
      this.checkBudgetStatus();
    }, 30000);
  }

  async checkBudgetStatus() {
    const transactions = transactions;
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyTransactions = transactions.filter(
      (t) => t.date.slice(0, 7) === currentMonth && t.type === "expense",
    );

    // Update spending for each category
    const categorySpending: Record<string, number> = {};
    monthlyTransactions.forEach((t) => {
      categorySpending[t.category] =
        (categorySpending[t.category] || 0) + Math.abs(t.amount);
    });

    // Check each category for alerts
    this.categories.forEach((category) => {
      const spent = categorySpending[category.name] || 0;
      const percentage =
        category.budgeted > 0 ? (spent / category.budgeted) * 100 : 0;

      category.spent = spent;

      // Generate alerts based on thresholds
      if (
        percentage >= category.alertThreshold &&
        !this.hasRecentAlert(category.name, "warning")
      ) {
        this.createAlert({
          type: percentage >= 100 ? "critical" : "warning",
          category: category.name,
          title: `Orçamento ${percentage >= 100 ? "Excedido" : "Próximo do Limite"}`,
          message: `Você gastou ${percentage.toFixed(1)}% do orçamento de ${category.name} (R$ ${spent.toFixed(2)} de R$ ${category.budgeted.toFixed(2)})`,
          threshold: category.alertThreshold,
          currentPercentage: percentage,
          suggestedAction: this.getSuggestedAction(category, percentage),
          priority: percentage >= 100 ? "high" : "medium",
        });
      }

      // Auto-adjust budget if enabled
      if (this.config.autoAdjustEnabled && category.autoAdjust) {
        this.autoAdjustBudget(category, spent);
      }
    });

    await this.saveData();

    // Generate insights
    if (this.config.smartRecommendations) {
      await this.generateInsights(monthlyTransactions);
    }
  }

  private hasRecentAlert(category: string, type: string): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    return this.alerts.some(
      (alert) =>
        alert.category === category &&
        alert.type === type &&
        alert.createdAt > oneHourAgo &&
        !alert.acknowledged,
    );
  }

  private createAlert(
    alertData: Omit<BudgetAlert, "id" | "createdAt" | "acknowledged">,
  ) {
    const alert: BudgetAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Show toast notification
    if (alert.type === "critical") {
      toast.error(alert.title, { description: alert.message });
    } else if (alert.type === "warning") {
      toast.warning(alert.title, { description: alert.message });
    } else {
      toast.info(alert.title, { description: alert.message });
    }
  }

  private getSuggestedAction(
    category: SmartBudgetCategory,
    percentage: number,
  ): string {
    if (percentage >= 100) {
      return `Revise seus gastos em ${category.name} ou aumente o orçamento para o próximo mês`;
    } else if (percentage >= 80) {
      return `Monitore de perto os gastos em ${category.name} pelo resto do mês`;
    } else {
      return `Continue acompanhando os gastos em ${category.name}`;
    }
  }

  private autoAdjustBudget(
    category: SmartBudgetCategory,
    currentSpending: number,
  ) {
    const transactions = transactions;
    const last3Months = this.getLast3MonthsSpending(
      transactions,
      category.name,
    );

    if (last3Months.length >= 2) {
      const avgSpending =
        last3Months.reduce((sum, amount) => sum + amount, 0) /
        last3Months.length;
      const suggestedBudget = Math.ceil(avgSpending * 1.1); // 10% buffer

      if (
        Math.abs(suggestedBudget - category.budgeted) >
        category.budgeted * 0.2
      ) {
        category.budgeted = suggestedBudget;
        category.lastUpdated = new Date().toISOString();

        this.createAlert({
          type: "info",
          category: category.name,
          title: "Orçamento Ajustado Automaticamente",
          message: `O orçamento de ${category.name} foi ajustado para R$ ${suggestedBudget.toFixed(2)} baseado no seu histórico de gastos`,
          threshold: 0,
          currentPercentage: 0,
          suggestedAction: "Revise o novo orçamento se necessário",
          priority: "low",
        });
      }
    }
  }

  private getLast3MonthsSpending(
    transactions: Transaction[],
    category: string,
  ): number[] {
    const monthlySpending: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense" && t.category === category)
      .forEach((t) => {
        const month = t.date.slice(0, 7);
        monthlySpending[month] =
          (monthlySpending[month] || 0) + Math.abs(t.amount);
      });

    return Object.values(monthlySpending).slice(-3);
  }

  private async generateInsights(transactions: Transaction[]) {
    // Clear old insights
    this.insights = this.insights.filter((insight) => {
      const oneWeekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return insight.createdAt > oneWeekAgo;
    });

    // Analyze spending patterns
    const categorySpending = this.getCategorySpending(transactions);
    const totalSpending = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Find categories with unusual spending
    Object.entries(categorySpending).forEach(([category, amount]) => {
      const categoryBudget = this.categories.find((c) => c.name === category);
      if (categoryBudget) {
        const percentage = (amount / categoryBudget.budgeted) * 100;

        if (percentage < 50) {
          this.insights.push({
            id: `insight_${Date.now()}_${category}`,
            type: "opportunity",
            title: `Orçamento Subutilizado: ${category}`,
            description: `Você usou apenas ${percentage.toFixed(1)}% do orçamento de ${category}. Considere realocar parte deste valor.`,
            impact: "positive",
            confidence: 85,
            actionable: true,
            suggestedActions: [
              `Transferir R$ ${((categoryBudget.budgeted - amount) * 0.5).toFixed(2)} para poupança`,
              `Realocar parte do orçamento para outras categorias`,
              `Reduzir o orçamento de ${category} no próximo mês`,
            ],
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // Detect spending trends
    const last3Months = this.getLast3MonthsTrends(transactions);
    if (last3Months.length >= 3) {
      const trend = this.calculateTrend(last3Months);
      if (Math.abs(trend) > 0.1) {
        this.insights.push({
          id: `trend_${Date.now()}`,
          type: "trend",
          title: `Tendência de Gastos ${trend > 0 ? "Crescente" : "Decrescente"}`,
          description: `Seus gastos ${trend > 0 ? "aumentaram" : "diminuíram"} ${Math.abs(trend * 100).toFixed(1)}% nos últimos 3 meses.`,
          impact: trend > 0 ? "negative" : "positive",
          confidence: 90,
          actionable: true,
          suggestedActions:
            trend > 0
              ? [
                  "Revisar categorias com maior crescimento",
                  "Estabelecer metas de redução de gastos",
                  "Considerar cortar gastos não essenciais",
                ]
              : [
                  "Parabéns! Continue mantendo o controle",
                  "Considere aumentar investimentos",
                  "Revisar se todas as necessidades estão sendo atendidas",
                ],
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  private getCategorySpending(
    transactions: Transaction[],
  ): Record<string, number> {
    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        spending[t.category] = (spending[t.category] || 0) + Math.abs(t.amount);
      });
    return spending;
  }

  private getLast3MonthsTrends(transactions: Transaction[]): number[] {
    const monthlyTotals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const month = t.date.slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(t.amount);
      });

    return Object.values(monthlyTotals).slice(-3);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    return first > 0 ? (last - first) / first : 0;
  }

  private async createDefaultRules() {
    if (this.rules.length > 0) return;

    const defaultRules: AutoCategorizationRule[] = [
      {
        id: "rule_supermarket",
        name: "Supermercados",
        description: "Categoriza automaticamente compras em supermercados",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "supermercado",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "mercado",
            caseSensitive: false,
          },
        ],
        actions: [
          { type: "set_category", value: "Alimentação" },
          { type: "add_tag", value: "Essencial" },
        ],
        confidence: 90,
        enabled: true,
        priority: 1,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "rule_gas_station",
        name: "Postos de Combustível",
        description: "Categoriza automaticamente gastos com combustível",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "posto",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "combustível",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "gasolina",
            caseSensitive: false,
          },
        ],
        actions: [
          { type: "set_category", value: "Transporte" },
          { type: "add_tag", value: "Essencial" },
        ],
        confidence: 95,
        enabled: true,
        priority: 2,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "rule_pharmacy",
        name: "Farmácias",
        description: "Categoriza automaticamente gastos em farmácias",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "farmácia",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "drogaria",
            caseSensitive: false,
          },
        ],
        actions: [
          { type: "set_category", value: "Saúde" },
          { type: "add_tag", value: "Essencial" },
        ],
        confidence: 90,
        enabled: true,
        priority: 3,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "rule_streaming",
        name: "Serviços de Streaming",
        description: "Categoriza automaticamente assinaturas de streaming",
        conditions: [
          {
            field: "description",
            operator: "contains",
            value: "netflix",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "spotify",
            caseSensitive: false,
          },
          {
            field: "description",
            operator: "contains",
            value: "amazon prime",
            caseSensitive: false,
          },
        ],
        actions: [
          { type: "set_category", value: "Lazer" },
          { type: "add_tag", value: "Assinatura" },
        ],
        confidence: 95,
        enabled: true,
        priority: 4,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
    ];

    this.rules = defaultRules;
    await this.saveData();
  }

  // Public API methods
  async addCategory(
    category: Omit<SmartBudgetCategory, "id" | "spent" | "lastUpdated">,
  ): Promise<SmartBudgetCategory> {
    const newCategory: SmartBudgetCategory = {
      ...category,
      id: `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      spent: 0,
      lastUpdated: new Date().toISOString(),
    };

    this.categories.push(newCategory);
    await this.saveData();
    return newCategory;
  }

  async updateCategory(
    id: string,
    updates: Partial<SmartBudgetCategory>,
  ): Promise<void> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.categories[index] = {
        ...this.categories[index],
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      await this.saveData();
    }
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories = this.categories.filter((c) => c.id !== id);
    await this.saveData();
  }

  async addRule(
    rule: Omit<AutoCategorizationRule, "id" | "createdAt" | "usageCount">,
  ): Promise<AutoCategorizationRule> {
    const newRule: AutoCategorizationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    this.rules.push(newRule);
    await this.saveData();
    return newRule;
  }

  async updateRule(
    id: string,
    updates: Partial<AutoCategorizationRule>,
  ): Promise<void> {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      await this.saveData();
    }
  }

  async deleteRule(id: string): Promise<void> {
    this.rules = this.rules.filter((r) => r.id !== id);
    await this.saveData();
  }

  async acknowledgeAlert(id: string): Promise<void> {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      await this.saveData();
    }
  }

  async updateConfig(config: Partial<SmartBudgetConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.saveData();
  }

  // Getters
  getCategories(): SmartBudgetCategory[] {
    return [...this.categories];
  }

  getAlerts(): BudgetAlert[] {
    return [...this.alerts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getRules(): AutoCategorizationRule[] {
    return [...this.rules];
  }

  getInsights(): BudgetInsight[] {
    return [...this.insights].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getConfig(): SmartBudgetConfig {
    return { ...this.config };
  }

  async getBudgetSummary() {
    const totalBudgeted = this.categories.reduce(
      (sum, cat) => sum + cat.budgeted,
      0,
    );
    const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalBudgeted - totalSpent;
    const utilizationPercentage =
      totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    const overBudgetCategories = this.categories.filter(
      (cat) => cat.spent > cat.budgeted,
    );
    const warningCategories = this.categories.filter((cat) => {
      const percentage =
        cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0;
      return percentage >= cat.alertThreshold && percentage < 100;
    });

    return {
      totalBudgeted,
      totalSpent,
      remaining,
      utilizationPercentage,
      categoriesCount: this.categories.length,
      overBudgetCategories: overBudgetCategories.length,
      warningCategories: warningCategories.length,
      activeAlerts: this.alerts.filter((a) => !a.acknowledged).length,
      insights: this.insights.length,
    };
  }
}

export const smartBudgetEngine = new SmartBudgetEngine();
export default smartBudgetEngine;

// Initialize when module loads
if (typeof window !== "undefined") {
  smartBudgetEngine.initialize().catch(console.error);
}
