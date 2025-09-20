// Financial Automation Engine
export interface AutomationRule {
  id: string;
  name: string;
  type: "transaction" | "budget" | "investment" | "bill";
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: Date;
  lastExecuted?: Date;
}

export interface AutomationCondition {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "between";
  value: any;
}

export interface AutomationAction {
  type: "categorize" | "tag" | "notify" | "transfer" | "invest";
  parameters: Record<string, any>;
}

class FinancialAutomationEngine {
  private rules: AutomationRule[] = [];

  addRule(rule: Omit<AutomationRule, "id" | "createdAt">): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    this.rules.push(newRule);
    return newRule;
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((rule) => rule.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): AutomationRule[] {
    return this.rules;
  }

  executeRules(data: any): void {
    // Execute automation rules
    console.log("Executing automation rules for:", data);
  }
}

export const automationEngine = new FinancialAutomationEngine();
export default automationEngine;
