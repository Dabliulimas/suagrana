"use client";

import * as React from "react";
import { logComponents } from "../logger";
import {
  storage,
  type Transaction,
  type Account,
  type Goal,
  type Investment,
} from "../storage";
// import { notificationManager } from '@/components/financial-notification-system'
import { toast } from "sonner";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: "transaction" | "goal" | "budget" | "investment" | "alert";
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface AutomationCondition {
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "not_equals";
  value: string | number;
  logicalOperator?: "AND" | "OR";
}

export interface AutomationAction {
  type:
    | "create_transaction"
    | "update_goal"
    | "send_notification"
    | "create_alert"
    | "transfer_funds";
  parameters: Record<string, any>;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  accountId: string;
  enabled: boolean;
  nextExecution: string;
  lastExecution?: string;
  executionCount: number;
}

export interface SmartAlert {
  id: string;
  title: string;
  message: string;
  type:
    | "budget_warning"
    | "goal_reminder"
    | "bill_due"
    | "investment_opportunity"
    | "expense_anomaly";
  priority: "low" | "medium" | "high" | "critical";
  conditions: AutomationCondition[];
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface BudgetRule {
  id: string;
  category: string;
  monthlyLimit: number;
  warningThreshold: number; // percentage (e.g., 80 for 80%)
  enabled: boolean;
  notifications: boolean;
  autoAdjust: boolean;
}

class FinancialAutomationEngine {
  private rules: AutomationRule[] = [];
  private recurringTransactions: RecurringTransaction[] = [];
  private smartAlerts: SmartAlert[] = [];
  private budgetRules: BudgetRule[] = [];
  private isRunning = false;

  async initialize() {
    await this.loadAutomationData();
    this.startAutomationEngine();
  }

  private async loadAutomationData() {
    try {
      const data = localStorage.getItem("financial-automation");
      if (data) {
        const parsed = JSON.parse(data);
        this.rules = parsed.rules || [];
        this.recurringTransactions = parsed.recurringTransactions || [];
        this.smartAlerts = parsed.smartAlerts || [];
        this.budgetRules = parsed.budgetRules || [];
      }
    } catch (error) {
      logComponents.error("Erro ao carregar dados de automacao:", error);
    }
  }

  private async saveAutomationData() {
    try {
      const data = {
        rules: this.rules,
        recurringTransactions: this.recurringTransactions,
        smartAlerts: this.smartAlerts,
        budgetRules: this.budgetRules,
      };
      localStorage.setItem("financial-automation", JSON.stringify(data));
    } catch (error) {
      logComponents.error("Erro ao salvar dados de automacao:", error);
    }
  }

  private startAutomationEngine() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Check every minute for automation triggers
    setInterval(() => {
      this.processAutomations();
    }, 60000);

    // Initial check
    this.processAutomations();
  }

  private async processAutomations() {
    try {
      await this.processRecurringTransactions();
      await this.processSmartAlerts();
      await this.processBudgetRules();
      await this.processAutomationRules();
    } catch (error) {
      logComponents.error("Erro no processamento de automacoes:", error);
    }
  }

  // Recurring Transactions
  async addRecurringTransaction(
    transaction: Omit<
      RecurringTransaction,
      "id" | "executionCount" | "nextExecution"
    >,
  ) {
    const newTransaction: RecurringTransaction = {
      ...transaction,
      id: `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionCount: 0,
      nextExecution: this.calculateNextExecution(
        transaction.startDate,
        transaction.frequency,
      ),
    };

    this.recurringTransactions.push(newTransaction);
    await this.saveAutomationData();

    toast.success(
      `Transacao recorrente "${newTransaction.name}" criada com sucesso!`,
    );
    return newTransaction;
  }

  async updateRecurringTransaction(
    id: string,
    updates: Partial<RecurringTransaction>,
  ) {
    const index = this.recurringTransactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transacao recorrente nao encontrada");

    this.recurringTransactions[index] = {
      ...this.recurringTransactions[index],
      ...updates,
    };

    // Recalculate next execution if frequency or start date changed
    if (updates.frequency || updates.startDate) {
      this.recurringTransactions[index].nextExecution =
        this.calculateNextExecution(
          this.recurringTransactions[index].startDate,
          this.recurringTransactions[index].frequency,
        );
    }

    await this.saveAutomationData();
    toast.success("Transacao recorrente atualizada!");
  }

  async deleteRecurringTransaction(id: string) {
    this.recurringTransactions = this.recurringTransactions.filter(
      (t) => t.id !== id,
    );
    await this.saveAutomationData();
    toast.success("Transacao recorrente removida!");
  }

  getRecurringTransactions(): RecurringTransaction[] {
    return [...this.recurringTransactions];
  }

  private async processRecurringTransactions() {
    const now = new Date();

    for (const recurring of this.recurringTransactions) {
      if (!recurring.enabled) continue;

      const nextExecution = new Date(recurring.nextExecution);
      if (now >= nextExecution) {
        await this.executeRecurringTransaction(recurring);
      }
    }
  }

  private async executeRecurringTransaction(recurring: RecurringTransaction) {
    try {
      // Create the transaction
      const transaction = {
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        description: `${recurring.description} (Automatico)`,
        date: new Date().toISOString(),
        account: recurring.accountId,
      };

      await storage.saveTransaction(transaction);

      // Update recurring transaction
      recurring.executionCount++;
      recurring.lastExecution = new Date().toISOString();
      recurring.nextExecution = this.calculateNextExecution(
        recurring.nextExecution,
        recurring.frequency,
      );

      await this.saveAutomationData();

      // Send notification
      // notificationManager.addNotification({
      //   id: `recurring_${Date.now()}`,
      //   title: 'Transacao Automatica Executada',
      //   message: `${recurring.name}: ${recurring.type === 'income' ? '+' : '-'}R$ ${recurring.amount.toFixed(2)}`,
      //   type: 'transaction_added',
      //   timestamp: new Date().toISOString(),
      //   read: false
      // })

      toast.success(`Transacao automatica executada: ${recurring.name}`);
    } catch (error) {
      logComponents.error("Erro ao executar transacao recorrente:", error);
      toast.error(`Erro ao executar transacao automatica: ${recurring.name}`);
    }
  }

  private calculateNextExecution(
    currentDate: string,
    frequency: string,
  ): string {
    const date = new Date(currentDate);

    switch (frequency) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 7);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date.toISOString();
  }

  // Smart Alerts
  async addSmartAlert(alert: Omit<SmartAlert, "id" | "createdAt">) {
    const newAlert: SmartAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    this.smartAlerts.push(newAlert);
    await this.saveAutomationData();

    toast.success(`Alerta inteligente "${newAlert.title}" criado!`);
    return newAlert;
  }

  async updateSmartAlert(id: string, updates: Partial<SmartAlert>) {
    const index = this.smartAlerts.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Alerta nao encontrado");

    this.smartAlerts[index] = { ...this.smartAlerts[index], ...updates };
    await this.saveAutomationData();
    toast.success("Alerta atualizado!");
  }

  async deleteSmartAlert(id: string) {
    this.smartAlerts = this.smartAlerts.filter((a) => a.id !== id);
    await this.saveAutomationData();
    toast.success("Alerta removido!");
  }

  getSmartAlerts(): SmartAlert[] {
    return [...this.smartAlerts];
  }

  private async processSmartAlerts() {
    const transactions = await transactions;
    const accounts = await accounts;
    const goals = await goals;

    for (const alert of this.smartAlerts) {
      if (!alert.enabled) continue;

      const shouldTrigger = await this.evaluateAlertConditions(alert, {
        transactions,
        accounts,
        goals,
      });

      if (shouldTrigger) {
        await this.triggerSmartAlert(alert);
      }
    }
  }

  private async evaluateAlertConditions(
    alert: SmartAlert,
    data: any,
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In a real implementation, this would be more sophisticated

    for (const condition of alert.conditions) {
      // Example: Check if monthly expenses exceed a threshold
      if (
        condition.field === "monthly_expenses" &&
        condition.operator === "greater_than"
      ) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyExpenses = data.transactions
          .filter(
            (t: Transaction) =>
              (t.type === "expense" || t.type === "shared") &&
              new Date(t.date) >= monthStart,
          )
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        if (monthlyExpenses > Number(condition.value)) {
          return true;
        }
      }

      // Add more condition types as needed
    }

    return false;
  }

  private async triggerSmartAlert(alert: SmartAlert) {
    // Prevent spam - only trigger once per day
    if (alert.lastTriggered) {
      const lastTrigger = new Date(alert.lastTriggered);
      const now = new Date();
      const hoursSinceLastTrigger =
        (now.getTime() - lastTrigger.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastTrigger < 24) {
        return;
      }
    }

    alert.lastTriggered = new Date().toISOString();
    await this.saveAutomationData();

    // Send notification
    // notificationManager.addNotification({
    //   id: `smart_alert_${Date.now()}`,
    //   title: alert.title,
    //   message: alert.message,
    //   type: 'alert',
    //   category: 'automation',
    //   timestamp: new Date().toISOString(),
    //   read: false,
    //   priority: alert.priority
    // })

    if (alert.priority === "high" || alert.priority === "critical") {
      toast.error(alert.message, { duration: 10000 });
    } else {
      toast.info(alert.message);
    }
  }

  // Budget Rules
  async addBudgetRule(rule: Omit<BudgetRule, "id">) {
    const newRule: BudgetRule = {
      ...rule,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.budgetRules.push(newRule);
    await this.saveAutomationData();

    toast.success(`Regra de orcamento para "${newRule.category}" criada!`);
    return newRule;
  }

  async updateBudgetRule(id: string, updates: Partial<BudgetRule>) {
    const index = this.budgetRules.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Regra de orcamento nao encontrada");

    this.budgetRules[index] = { ...this.budgetRules[index], ...updates };
    await this.saveAutomationData();
    toast.success("Regra de orcamento atualizada!");
  }

  async deleteBudgetRule(id: string) {
    this.budgetRules = this.budgetRules.filter((r) => r.id !== id);
    await this.saveAutomationData();
    toast.success("Regra de orcamento removida!");
  }

  getBudgetRules(): BudgetRule[] {
    return [...this.budgetRules];
  }

  private async processBudgetRules() {
    const transactions = await transactions;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const rule of this.budgetRules) {
      if (!rule.enabled) continue;

      const monthlySpending = transactions
        .filter(
          (t) =>
            (t.type === "expense" || t.type === "shared") &&
            t.category === rule.category &&
            new Date(t.date) >= monthStart,
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const spendingPercentage = (monthlySpending / rule.monthlyLimit) * 100;

      if (spendingPercentage >= rule.warningThreshold && rule.notifications) {
        await this.triggerBudgetWarning(
          rule,
          monthlySpending,
          spendingPercentage,
        );
      }
    }
  }

  private async triggerBudgetWarning(
    rule: BudgetRule,
    spent: number,
    percentage: number,
  ) {
    const message = `Atencao: Voce ja gastou R$ ${spent.toFixed(2)} (${percentage.toFixed(1)}%) do orcamento de R$ ${rule.monthlyLimit.toFixed(2)} em ${rule.category} este mes.`;

    // notificationManager.addNotification({
    //   id: `budget_warning_${Date.now()}`,
    //   title: 'Alerta de Orcamento',
    //   message,
    //   type: 'budget_exceeded',
    //   category: 'budget',
    //   timestamp: new Date().toISOString(),
    //   read: false,
    //   priority: percentage >= 100 ? 'high' : 'medium'
    // })

    if (percentage >= 100) {
      toast.error(`Orcamento de ${rule.category} excedido!`, {
        duration: 10000,
      });
    } else {
      toast.warning(message);
    }
  }

  // Automation Rules
  async addAutomationRule(
    rule: Omit<AutomationRule, "id" | "createdAt" | "triggerCount">,
  ) {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };

    this.rules.push(newRule);
    await this.saveAutomationData();

    toast.success(`Regra de automacao "${newRule.name}" criada!`);
    return newRule;
  }

  async updateAutomationRule(id: string, updates: Partial<AutomationRule>) {
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Regra de automacao nao encontrada");

    this.rules[index] = { ...this.rules[index], ...updates };
    await this.saveAutomationData();
    toast.success("Regra de automacao atualizada!");
  }

  async deleteAutomationRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
    await this.saveAutomationData();
    toast.success("Regra de automacao removida!");
  }

  getAutomationRules(): AutomationRule[] {
    return [...this.rules];
  }

  private async processAutomationRules() {
    // This would implement custom automation rule processing
    // For now, we'll keep it simple
  }

  // Utility methods
  async getAutomationStats() {
    return {
      totalRules: this.rules.length,
      activeRules: this.rules.filter((r) => r.enabled).length,
      totalRecurringTransactions: this.recurringTransactions.length,
      activeRecurringTransactions: this.recurringTransactions.filter(
        (t) => t.enabled,
      ).length,
      totalSmartAlerts: this.smartAlerts.length,
      activeSmartAlerts: this.smartAlerts.filter((a) => a.enabled).length,
      totalBudgetRules: this.budgetRules.length,
      activeBudgetRules: this.budgetRules.filter((r) => r.enabled).length,
    };
  }

  async createDefaultAutomations() {
    // Create some default automation rules for new users

    // Default budget alert for high spending
    await this.addSmartAlert({
      title: "Gastos Altos Detectados",
      message:
        "Seus gastos mensais estao acima da media. Considere revisar seu orcamento.",
      type: "budget_warning",
      priority: "medium",
      conditions: [
        {
          field: "monthly_expenses",
          operator: "greater_than",
          value: 3000,
        },
      ],
      enabled: true,
    });

    // Default goal reminder
    await this.addSmartAlert({
      title: "Lembrete de Meta",
      message:
        "Nao se esqueca de contribuir para suas metas financeiras este mes!",
      type: "goal_reminder",
      priority: "low",
      conditions: [],
      enabled: true,
    });
  }
}

export const automationEngine = new FinancialAutomationEngine();
export default automationEngine;

// Initialize automation engine when module loads
if (typeof window !== "undefined") {
  automationEngine.initialize().catch(console.error);
}
