"use client";

// Sistema de storage simples e funcional
export interface SimpleTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "shared";
  category: string;
  account: string;
  date: string;
  notes?: string;
  sharedWith?: string[];
  createdAt: string;
}

export interface SimpleAccount {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  createdAt: string;
}

export interface SimpleGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  createdAt: string;
}

export interface SimpleContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

class SimpleStorage {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  // TRANSACTIONS
  getTransactions(): SimpleTransaction[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem("simple-transactions");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveTransaction(
    transaction: Omit<SimpleTransaction, "id" | "createdAt">,
  ): SimpleTransaction {
    if (!this.isClient()) return transaction as SimpleTransaction;

    const transactions = this.getTransactions();
    const newTransaction: SimpleTransaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    localStorage.setItem("simple-transactions", JSON.stringify(transactions));

    // Atualizar saldo da conta
    this.updateAccountBalance(
      transaction.account,
      transaction.type === "income" ? transaction.amount : -transaction.amount,
    );

    return newTransaction;
  }

  deleteTransaction(id: string): void {
    if (!this.isClient()) return;

    const transactions = this.getTransactions();
    const transaction = transactions.find((t) => t.id === id);

    if (transaction) {
      // Reverter saldo da conta
      this.updateAccountBalance(
        transaction.account,
        transaction.type === "income"
          ? -transaction.amount
          : transaction.amount,
      );

      // Remover transação
      const filtered = transactions.filter((t) => t.id !== id);
      localStorage.setItem("simple-transactions", JSON.stringify(filtered));
    }
  }

  // ACCOUNTS
  getAccounts(): SimpleAccount[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem("simple-accounts");
      const accounts = data ? JSON.parse(data) : [];

      // Se não há contas, criar contas padrão
      if (accounts.length === 0) {
        const defaultAccounts = [
          {
            id: this.generateId(),
            name: "Conta Corrente",
            type: "checking",
            balance: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: this.generateId(),
            name: "Poupança",
            type: "savings",
            balance: 0,
            createdAt: new Date().toISOString(),
          },
          {
            id: this.generateId(),
            name: "Cartão de Crédito",
            type: "credit",
            balance: 0,
            createdAt: new Date().toISOString(),
          },
        ];
        localStorage.setItem(
          "simple-accounts",
          JSON.stringify(defaultAccounts),
        );
        return defaultAccounts;
      }

      return accounts;
    } catch {
      return [];
    }
  }

  saveAccount(account: Omit<SimpleAccount, "id" | "createdAt">): SimpleAccount {
    if (!this.isClient()) return account as SimpleAccount;

    const accounts = this.getAccounts();
    const newAccount: SimpleAccount = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem("simple-accounts", JSON.stringify(accounts));
    return newAccount;
  }

  updateAccountBalance(accountName: string, amount: number): void {
    if (!this.isClient()) return;

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.name === accountName);

    if (account) {
      account.balance += amount;
      localStorage.setItem("simple-accounts", JSON.stringify(accounts));
    }
  }

  // GOALS
  /** @deprecated Use dataService instead */
  getGoals(): SimpleGoal[] {
    console.warn('DEPRECATED: getGoals() - Use dataService instead');
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem("simple-goals");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /** @deprecated Use dataService instead */
  saveGoal(goal: Omit<SimpleGoal, "id" | "createdAt">): SimpleGoal {
    console.warn('DEPRECATED: saveGoal() - Use dataService instead');
    if (!this.isClient()) return goal as SimpleGoal;

    const goals = this.getGoals();
    const newGoal: SimpleGoal = {
      ...goal,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    goals.push(newGoal);
    localStorage.setItem("simple-goals", JSON.stringify(goals));
    return newGoal;
  }

  updateGoal(id: string, updates: Partial<SimpleGoal>): void {
    if (!this.isClient()) return;

    const goals = this.getGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      localStorage.setItem("simple-goals", JSON.stringify(goals));
    }
  }

  // CATEGORIES
  getCategories(): string[] {
    return [
      "Alimentação",
      "Transporte",
      "Moradia",
      "Saúde",
      "Educação",
      "Lazer",
      "Compras",
      "Serviços",
      "Investimentos",
      "Outros",
    ];
  }

  // STATISTICS
  getMonthlyStats(month?: string): {
    income: number;
    expenses: number;
    balance: number;
  } {
    const transactions = this.getTransactions();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(targetMonth),
    );

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }

  getTotalBalance(): number {
    const accounts = this.getAccounts();
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  }

  // CONTACTS
  getContacts(): SimpleContact[] {
    if (!this.isClient()) return [];
    try {
      // First try to get from simple storage
      const simpleData = localStorage.getItem("simple-contacts");
      if (simpleData) {
        return JSON.parse(simpleData);
      }

      // If not found, try to migrate from main storage
      const mainData = localStorage.getItem("sua-grana-contacts");
      if (mainData) {
        const mainContacts = JSON.parse(mainData);
        // Convert to simple format and save
        const simpleContacts = mainContacts.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          createdAt: contact.createdAt,
        }));
        localStorage.setItem("simple-contacts", JSON.stringify(simpleContacts));
        return simpleContacts;
      }

      // Also try to migrate from familyMembers format
      const familyData = localStorage.getItem("familyMembers");
      if (familyData) {
        const familyMembers = JSON.parse(familyData);
        const simpleContacts = familyMembers.map((member: any) => ({
          id: member.id || this.generateId(),
          name: member.name,
          email:
            member.email ||
            `${member.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          createdAt: new Date().toISOString(),
        }));
        localStorage.setItem("simple-contacts", JSON.stringify(simpleContacts));
        return simpleContacts;
      }

      return [];
    } catch {
      return [];
    }
  }

  saveContact(contact: Omit<SimpleContact, "id" | "createdAt">): SimpleContact {
    if (!this.isClient()) return contact as SimpleContact;

    const contacts = this.getContacts();

    // Check if contact already exists by email
    const existingContact = contacts.find((c) => c.email === contact.email);
    if (existingContact) {
      return existingContact;
    }

    const newContact: SimpleContact = {
      ...contact,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    localStorage.setItem("simple-contacts", JSON.stringify(contacts));

    // Also save to main storage for compatibility
    try {
      const mainContacts = JSON.parse(
        localStorage.getItem("sua-grana-contacts") || "[]",
      );
      const mainContact = {
        id: newContact.id,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        createdAt: newContact.createdAt,
      };
      mainContacts.push(mainContact);
      localStorage.setItem("sua-grana-contacts", JSON.stringify(mainContacts));
    } catch (error) {
      console.warn("Failed to sync contact to main storage:", error);
    }

    return newContact;
  }

  updateContact(id: string, updates: Partial<SimpleContact>): void {
    if (!this.isClient()) return;

    const contacts = this.getContacts();
    const index = contacts.findIndex((c) => c.id === id);

    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...updates };
      localStorage.setItem("simple-contacts", JSON.stringify(contacts));

      // Also update in main storage for compatibility
      try {
        const mainContacts = JSON.parse(
          localStorage.getItem("sua-grana-contacts") || "[]",
        );
        const mainIndex = mainContacts.findIndex((c: any) => c.id === id);
        if (mainIndex !== -1) {
          mainContacts[mainIndex] = { ...mainContacts[mainIndex], ...updates };
          localStorage.setItem(
            "sua-grana-contacts",
            JSON.stringify(mainContacts),
          );
        }
      } catch (error) {
        console.warn("Failed to sync contact update to main storage:", error);
      }
    }
  }

  deleteContact(id: string): void {
    if (!this.isClient()) return;

    const contacts = this.getContacts().filter((c) => c.id !== id);
    localStorage.setItem("simple-contacts", JSON.stringify(contacts));

    // Also delete from main storage for compatibility
    try {
      const mainContacts = JSON.parse(
        localStorage.getItem("sua-grana-contacts") || "[]",
      );
      const filteredMainContacts = mainContacts.filter((c: any) => c.id !== id);
      localStorage.setItem(
        "sua-grana-contacts",
        JSON.stringify(filteredMainContacts),
      );
    } catch (error) {
      console.warn("Failed to sync contact deletion to main storage:", error);
    }
  }

  // CLEAR ALL DATA (for testing)
  clearAllData(): void {
    if (!this.isClient()) return;

    localStorage.removeItem("simple-transactions");
    localStorage.removeItem("simple-accounts");
    localStorage.removeItem("simple-goals");
    localStorage.removeItem("simple-contacts");

    console.log("✅ Todos os dados foram limpos");
  }

  // POPULATE TEST DATA
  populateTestData(): void {
    if (!this.isClient()) return;

    // Limpar dados existentes
    this.clearAllData();

    // Criar contas
    const accounts = this.getAccounts(); // Isso criará as contas padrão

    // Criar algumas transações de exemplo
    const testTransactions = [
      {
        description: "Salário",
        amount: 5000,
        type: "income" as const,
        category: "Salário",
        account: "Conta Corrente",
        date: new Date().toISOString().slice(0, 10),
        notes: "Salário mensal",
      },
      {
        description: "Supermercado",
        amount: 350,
        type: "expense" as const,
        category: "Alimentação",
        account: "Conta Corrente",
        date: new Date().toISOString().slice(0, 10),
        notes: "Compras do mês",
      },
      {
        description: "Combustível",
        amount: 200,
        type: "expense" as const,
        category: "Transporte",
        account: "Conta Corrente",
        date: new Date().toISOString().slice(0, 10),
      },
    ];

    testTransactions.forEach((transaction) => {
      this.saveTransaction(transaction);
    });

    // Criar algumas metas
    const testGoals = [
      {
        name: "Reserva de Emergência",
        target: 10000,
        current: 2500,
        category: "Emergência",
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      },
      {
        name: "Viagem",
        target: 3000,
        current: 800,
        category: "Lazer",
      },
    ];

    testGoals.forEach((goal) => {
      this.saveGoal(goal);
    });

    console.log("✅ Dados de teste criados com sucesso!");
  }
}

export const simpleStorage = new SimpleStorage();
