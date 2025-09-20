import { Budget, Tag, Category } from '@/types';

import { logComponents } from "../logger";
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "shared";
  category: string;
  account: string;
  date: string;
  installments?: number;
  currentInstallment?: number;
  recurring?: boolean;
  notes?: string;
  sharedWith?: string[];
  myShare?: number;
  sharedPercentages?: Record<string, number>;
  tripId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  operation: "buy" | "sell";
  type: "stock" | "fii" | "treasury" | "cdb" | "crypto" | "fund";
  ticker?: string;
  name: string;
  quantity: number;
  price: number;
  totalValue: number;
  date: string;
  account: string;
  fees: number;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dividend {
  id: string;
  ticker: string;
  amount: number;
  quantity: number;
  totalAmount: number;
  exDate: string;
  payDate: string;
  type: "dividend" | "jscp" | "bonus" | "split";
  account: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentPosition {
  ticker: string;
  name: string;
  type: Investment["type"];
  sector?: string;
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  returnValue: number;
  returnPercent: number;
  allocation: number;
  operations: Investment[];
  dividends: Dividend[];
  totalDividends: number;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  deadline?: string;
  category: string;
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
}

// Removendo definição duplicada de Budget - usando a do types/index.ts

export interface UserSettings {
  id: string;
  userId: string;
  type: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

// Category interface is defined in types/index.ts

// Tag interface is defined in types/index.ts

export interface IncomeSettings {
  id: string;
  monthlyIncome: number;
  currency: string;
  paymentDay: number;
  autoCalculate: boolean;
  includeBonus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  currency: string;
  status: "planejamento" | "andamento" | "finalizada" | "cancelada";
  participants: string[];
  description?: string;
  averageExchangeRate?: number; // Taxa média de câmbio calculada
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyExchange {
  id: string;
  tripId: string;
  date: string;
  amountBRL: number; // Valor em reais gasto
  amountForeign: number; // Valor em moeda estrangeira obtido
  exchangeRate: number; // Taxa de câmbio no momento
  cet: number; // Custo Efetivo Total (%)
  location?: string; // Onde foi feita a compra (casa de câmbio, banco, etc)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  currency: string;
  bank?: string;
  creditLimit?: number;
  interestRate?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPayment {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  paidDate?: string;
  dueDate?: string;
  month: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedBill {
  id: string;
  userEmail: string;
  month: string; // YYYY-MM
  year: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  closingDate: string;
  status: "open" | "closed" | "overdue";
  items: string[]; // Array of BillingPayment IDs
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "billing" | "goal" | "investments" | "general";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  billing: boolean;
  goal: boolean;
  investments: boolean;
  general: boolean;
}

export interface Itinerary {
  id: string;
  tripId: string;
  day: number;
  date: string;
  items: ItineraryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: string;
  type: "attraction" | "restaurant" | "hotel" | "transport" | "activity";
  name: string;
  time: string;
  duration?: number;
  cost?: number;
  location?: string;
  notes?: string;
  order: number;
}

export interface EmergencyReserve {
  id: string;
  targetAmount: number;
  currentAmount: number;
  monthlyGoal: number;
  targetMonths: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedDebt {
  id: string;
  creditor: string; // Nome da pessoa que deve receber
  debtor: string; // Nome da pessoa que deve pagar
  originalAmount: number;
  currentAmount: number;
  description: string;
  transactionId?: string; // ID da transação relacionada
  status: "active" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

import { localDataService } from "../services/local-data-service";

class Storage {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.cache.has(key)) return null;

    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  // Métodos de compatibilidade com localStorage (DEPRECATED)
  // Estes métodos são mantidos apenas para compatibilidade
  // TODO: Remover após migração completa
  private getFromStorage<T>(key: string): T[] {
    console.warn(`DEPRECATED: getFromStorage(${key}) - Use DataService instead`);
    if (!this.isClient()) return [];

    const cached = this.getFromCache<T[]>(key);
    if (cached) return cached;

    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    console.warn(`DEPRECATED: saveToStorage(${key}) - Use DataService instead`);
    if (!this.isClient()) return;

    try {
      if (!Array.isArray(data)) {
        logComponents.error("Attempting to save non-array data for key ${key}:", data,
        );
        return;
      }

      // Apenas salvar no cache - dados vão para o banco via DataService
      this.setCache(key, data);

      // Disparar evento customizado para notificar mudanças no storage
      if (typeof window !== "undefined") {
        const event = new CustomEvent("storageChange", {
          detail: {
            key,
            action: "save",
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      logComponents.error("Error saving data for key ${key}:", error);
    }
  }

  // Transactions - Migrado para usar DataService
  getTransactions(): Transaction[] {
    console.warn("DEPRECATED: Storage.getTransactions() - Use localDataService.getTransactions() instead");
    // Para compatibilidade com testes, retornar dados do localStorage
    if (!this.isClient()) return [];
    return this.getFromStorage<Transaction>("sua-grana-transactions");
  }

  async getTransactionsAsync(): Promise<Transaction[]> {
    return await localDataService.getTransactions();
  }

  saveTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Transaction {
    console.warn("DEPRECATED: Storage.saveTransaction() - Use localDataService.saveTransaction() instead");
    if (!this.isClient()) {
      // Create a temporary transaction for server-side rendering
      return {
        ...transaction,
        id: `temp-${Date.now()}`,
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      } as Transaction;
    }
    
    // Para compatibilidade, criar um ID temporário
    const tempTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };

    // Salvar usando DataService de forma assíncrona
    localDataService.saveTransaction(transaction).then((savedTransaction) => {
      if (savedTransaction) {
        // Create billing payments for shared expenses
        if (savedTransaction.type === "shared" && savedTransaction.sharedWith) {
          this.createBillingPayments(savedTransaction);
        }

        // Learn from this transaction for smart suggestions
        if (
          typeof window !== "undefined" &&
          savedTransaction.description &&
          savedTransaction.category
        ) {
          try {
            console.log("Transaction saved, smart suggestions learning disabled");
          } catch (error) {
            console.warn("Smart suggestions learning failed:", error);
          }
        }
      }
    }).catch((error) => {
      logComponents.error("Erro ao salvar transação via DataService:", error);
    });

    return tempTransaction;
  }

  async saveTransactionAsync(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction | null> {
    const savedTransaction = await localDataService.saveTransaction(transaction);
    
    if (savedTransaction) {
      // Create billing payments for shared expenses
      if (savedTransaction.type === "shared" && savedTransaction.sharedWith) {
        this.createBillingPayments(savedTransaction);
      }

      // Learn from this transaction for smart suggestions
      if (
        typeof window !== "undefined" &&
        savedTransaction.description &&
        savedTransaction.category
      ) {
        try {
          console.log("Transaction saved, smart suggestions learning disabled");
        } catch (error) {
          console.warn("Smart suggestions learning failed:", error);
        }
      }
    }
    
    return savedTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): void {
    console.warn("DEPRECATED: Storage.updateTransaction() - Use localDataService.updateTransaction() instead");
    if (!this.isClient()) return;
    
    // Atualizar usando DataService de forma assíncrona
    localDataService.updateTransaction(id, updates).catch((error) => {
      logComponents.error("Erro ao atualizar transação via DataService:", error);
    });
  }

  async updateTransactionAsync(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    return await localDataService.updateTransaction(id, updates);
  }

  deleteTransaction(id: string): void {
    console.warn("DEPRECATED: Storage.deleteTransaction() - Use localDataService.deleteTransaction() instead");
    if (!this.isClient()) return;
    
    // Deletar usando DataService de forma assíncrona
    localDataService.deleteTransaction(id).then((success) => {
      if (success) {
        // Delete related billing payments
        this.deleteBillingPaymentsByTransaction(id);
      }
    }).catch((error) => {
      logComponents.error("Erro ao deletar transação via DataService:", error);
    });
  }

  async deleteTransactionAsync(id: string): Promise<boolean> {
    const success = await localDataService.deleteTransaction(id);
    if (success) {
      // Delete related billing payments
      this.deleteBillingPaymentsByTransaction(id);
    }
    return success;
  }

  // Billing Payments
  getBillingPayments(): BillingPayment[] {
    if (!this.isClient()) return [];
    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  saveBillingPayments(payments: BillingPayment[]): void {
    this.saveToStorage("billing-payments", payments);
    this.invalidateCache("billing-payments");
  }

  createBillingPayments(transaction: Transaction): void {
    if (!this.isClient() || !transaction.sharedWith) return;

    const payments = this.getBillingPayments();
    const totalParticipants = transaction.sharedWith.length + 1;
    const amountPerPerson = Math.abs(transaction.amount) / totalParticipants;

    transaction.sharedWith.forEach((memberId) => {
      // Encontrar membro pelo ID para obter o email
      const contacts = this.getContacts();
      const member = contacts.find((c) => c.id === memberId);
      const memberEmail = member?.email || memberId;

      const payment: BillingPayment = {
        id: this.generateId(),
        transactionId: transaction.id,
        userEmail: memberEmail,
        amount: amountPerPerson,
        description: transaction.description,
        date: transaction.date,
        category: transaction.category,
        isPaid: false,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        month: new Date(transaction.date).toISOString().slice(0, 7), // YYYY-MM format
        year: new Date(transaction.date).getFullYear(),
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      };
      payments.push(payment);
    });

    // Dados são salvos no banco via DataService
  }

  updateBillingPayment(id: string, updates: Partial<BillingPayment>): void {
    if (!this.isClient()) return;
    const payments = this.getBillingPayments();
    const index = payments.findIndex((p) => p.id === id);
    if (index !== -1) {
      payments[index] = {
        ...payments[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      // Dados são salvos no banco via DataService
    }
  }

  deleteBillingPaymentsByTransaction(transactionId: string): void {
    if (!this.isClient()) return;
    const payments = this.getBillingPayments().filter(
      (p) => p.transactionId !== transactionId,
    );
    // Dados são removidos do banco via DataService
  }

  // Shared Bills
  getSharedBills(): SharedBill[] {
    if (!this.isClient()) return [];
    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  saveSharedBill(
    bill: Omit<SharedBill, "id" | "createdAt" | "updatedAt">,
  ): SharedBill {
    if (!this.isClient()) throw new Error("Not running in client");

    const bills = this.getSharedBills();
    const newBill: SharedBill = {
      ...bill,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bills.push(newBill);
    // Dados são salvos no banco via DataService
    return newBill;
  }

  updateSharedBill(id: string, updates: Partial<SharedBill>): void {
    if (!this.isClient()) return;
    const bills = this.getSharedBills();
    const index = bills.findIndex((b) => b.id === id);
    if (index !== -1) {
      bills[index] = {
        ...bills[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      // Dados são salvos no banco via DataService
    }
  }

  deleteSharedBill(id: string): void {
    if (!this.isClient()) return;
    const bills = this.getSharedBills().filter((b) => b.id !== id);
    // Dados são removidos do banco via DataService
  }

  generateMonthlyBills(): void {
    if (!this.isClient()) return;

    const payments = this.getBillingPayments();
    const existingBills = this.getSharedBills();

    // Agrupar pagamentos por usuario e mes
    const billsMap: Record<
      string,
      {
        userEmail: string;
        month: string;
        year: number;
        items: BillingPayment[];
      }
    > = {};

    payments.forEach((payment) => {
      const date = new Date(payment.dueDate || payment.createdAt);
      const month = date.toISOString().slice(0, 7); // YYYY-MM
      const key = `${payment.userEmail}-${month}`;

      if (!billsMap[key]) {
        billsMap[key] = {
          userEmail: payment.userEmail,
          month,
          year: date.getFullYear(),
          items: [],
        };
      }

      billsMap[key].items.push(payment);
    });

    // Criar ou atualizar faturas
    Object.values(billsMap).forEach((billData) => {
      const existingBill = existingBills.find(
        (b) => b.userEmail === billData.userEmail && b.month === billData.month,
      );

      const totalAmount = billData.items.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const paidAmount = billData.items
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      const closingDate = new Date(
        billData.year,
        parseInt(billData.month.split("-")[1]),
        0,
      ); // Ultimo dia do mes
      const dueDate = new Date(
        billData.year,
        parseInt(billData.month.split("-")[1]),
        10,
      ); // Dia 10 do proximo mes
      const today = new Date();

      let status: "open" | "closed" | "overdue" = "open";
      if (today > dueDate && pendingAmount > 0) {
        status = "overdue";
      } else if (today > closingDate) {
        status = "closed";
      }

      if (existingBill) {
        this.updateSharedBill(existingBill.id, {
          totalAmount,
          paidAmount,
          pendingAmount,
          status,
          items: billData.items.map((item) => item.id),
          updatedAt: new Date().toISOString(),
        });
      } else {
        this.saveSharedBill({
          userEmail: billData.userEmail,
          month: billData.month,
          year: billData.year,
          totalAmount,
          paidAmount,
          pendingAmount,
          dueDate: dueDate.toISOString().split("T")[0],
          closingDate: closingDate.toISOString().split("T")[0],
          status,
          items: billData.items.map((item) => item.id),
        });
      }
    });
  }

  // Notifications
  getNotifications(): Notification[] {
    if (!this.isClient()) return [];
    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  saveNotification(
    notification: Omit<Notification, "id" | "createdAt">,
  ): Notification | null {
    if (!this.isClient()) return null;

    const preferences = this.getNotificationPreferences();
    if (!preferences[notification.type]) {
      return null; // User has disabled this type of notification
    }

    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
    };
    notifications.unshift(newNotification); // Add to beginning
    // Dados são salvos no banco via DataService
    return newNotification;
  }

  markNotificationAsRead(id: string): void {
    if (!this.isClient()) return;
    const notifications = this.getNotifications();
    const index = notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      // Dados são salvos no banco via DataService
    }
  }

  getUnreadNotificationsCount(): number {
    return this.getNotifications().filter((n) => !n.isRead).length;
  }

  // Check for overdue bills and create notifications
  checkOverdueBills(): void {
    if (!this.isClient()) return;

    const payments = this.getBillingPayments();
    const contacts = this.getContacts();
    const now = new Date();

    payments.forEach((payment) => {
      if (!payment.isPaid && payment.dueDate) {
        const dueDate = new Date(payment.dueDate);
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysOverdue > 0) {
          const contact = contacts.find((c) => c.email === payment.userEmail);
          const transaction = this.getTransactions().find(
            (t) => t.id === payment.transactionId,
          );

          if (transaction) {
            this.saveNotification({
              type: "billing",
              title: "Fatura em Atraso",
              message: `${contact?.name || payment.userEmail} tem uma fatura de R$ ${payment.amount.toFixed(2)} em atraso ha ${daysOverdue} dias (${transaction.description})`,
              isRead: false,
              actionUrl: "/billing",
            });
          }
        }
      }
    });
  }

  // Check for goal progress and create notifications
  checkGoalProgress(goalId: string): void {
    if (!this.isClient()) return;

    const goal = this.getGoals().find((g) => g.id === goalId);
    if (!goal) return;

    if (goal.current >= goal.target) {
      this.saveNotification({
        type: "goal",
        title: "Meta Atingida!",
        message: `Parabens! Voce alcancou sua meta "${goal.name}".`,
        isRead: false,
        actionUrl: `/goals`,
      });
    }
  }

  // Notification Preferences
  getNotificationPreferences(): NotificationPreferences {
    if (!this.isClient()) {
      return { billing: true, goal: true, investments: true, general: true };
    }
    // Retornar preferências padrão - dados vêm do banco via DataService
    return { billing: true, goal: true, investments: true, general: true };
  }

  setNotificationPreferences(preferences: NotificationPreferences): void {
    if (!this.isClient()) return;
    // Dados são salvos no banco via DataService
  }

  // Contacts
  getContacts(): Contact[] {
    if (!this.isClient()) return [];
    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  saveContact(contact: Omit<Contact, "id" | "createdAt">): Contact {
    if (!this.isClient()) {
      return {
        ...contact,
        id: `temp-${Date.now()}`,
        createdAt: this.getTimestamp(),
      } as Contact;
    }
    const contacts = this.getContacts();
    const existingContact = contacts.find((c) => c.email === contact.email);
    if (existingContact) {
      return existingContact;
    }

    const newContact: Contact = {
      ...contact,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
    };
    contacts.push(newContact);
    // Dados são salvos no banco via DataService
    return newContact;
  }

  createContactAndAddToTrip(
    contact: Omit<Contact, "id" | "createdAt">,
    tripId: string,
  ): Contact {
    const newContact = this.saveContact(contact);
    this.addParticipantToTrip(tripId, newContact.name);
    return newContact;
  }

  updateContact(id: string, updates: Partial<Contact>): void {
    if (!this.isClient()) return;
    const contacts = this.getContacts();
    const index = contacts.findIndex((c) => c.id === id);
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...updates };
      // Dados são salvos no banco via DataService
    }
  }

  deleteContact(id: string): void {
    if (!this.isClient()) return;
    const contacts = this.getContacts().filter((c) => c.id !== id);
    // Dados são removidos do banco via DataService
  }

  // Investments
  getInvestments(): Investment[] {
    return this.getFromStorage<Investment>("sua-grana-investments");
  }

  saveInvestment(
    investment: Omit<Investment, "id" | "createdAt" | "updatedAt">,
  ): Investment {
    if (!this.isClient()) return investment as Investment;
    const investments = this.getInvestments();
    const newInvestment: Investment = {
      ...investment,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    investments.push(newInvestment);
    this.saveToStorage("sua-grana-investments", investments);

    // Auto-consolidate if ticker exists and is a buy operation
    if (newInvestment.ticker && newInvestment.operation === "buy") {
      this.consolidateDuplicateInvestments(newInvestment.ticker);
    }

    return newInvestment;
  }

  consolidateDuplicateInvestments(ticker: string): void {
    if (!this.isClient()) return;

    const investments = this.getInvestments();
    const tickerInvestments = investments.filter(
      (inv) => inv.ticker === ticker && inv.operation === "buy",
    );

    if (tickerInvestments.length <= 1) return;

    // Calculate consolidated values
    const totalQuantity = tickerInvestments.reduce(
      (sum, inv) => sum + inv.quantity,
      0,
    );
    const totalValue = tickerInvestments.reduce(
      (sum, inv) => sum + inv.totalValue,
      0,
    );
    const totalFees = tickerInvestments.reduce((sum, inv) => sum + inv.fees, 0);
    const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Keep the most recent investment and update it with consolidated values
    const mostRecent = tickerInvestments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    const consolidatedInvestment: Investment = {
      ...mostRecent,
      quantity: totalQuantity,
      price: averagePrice,
      totalValue: totalValue,
      fees: totalFees,
      updatedAt: this.getTimestamp(),
    };

    // Remove all ticker investments and add the consolidated one
    const otherInvestments = investments.filter(
      (inv) => !(inv.ticker === ticker && inv.operation === "buy"),
    );
    otherInvestments.push(consolidatedInvestment);

    this.saveToStorage("sua-grana-investments", otherInvestments);
  }

  updateInvestment(id: string, updates: Partial<Investment>): void {
    if (!this.isClient()) return;
    const investments = this.getInvestments();
    const index = investments.findIndex((i) => i.id === id);
    if (index !== -1) {
      investments[index] = {
        ...investments[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      // Dados são salvos no banco via DataService
    }
  }

  deleteInvestment(id: string): void {
    if (!this.isClient()) return;
    const investments = this.getInvestments().filter((i) => i.id !== id);
    // Dados são removidos do banco via DataService
  }

  // Public method to manually consolidate investments
  manuallyConsolidateInvestments(ticker: string): boolean {
    if (!this.isClient()) return false;

    const investments = this.getInvestments();
    const tickerInvestments = investments.filter(
      (inv) => inv.ticker === ticker && inv.operation === "buy",
    );

    if (tickerInvestments.length <= 1) {
      return false; // No consolidation needed
    }

    this.consolidateDuplicateInvestments(ticker);
    this.invalidateCache("sua-grana-investments");
    return true;
  }

  // Get duplicate tickers that can be consolidated
  getDuplicateTickers(): string[] {
    if (!this.isClient()) return [];

    const investments = this.getInvestments();
    const tickerCounts: Record<string, number> = {};

    investments.forEach((inv) => {
      if (inv.ticker && inv.operation === "buy") {
        tickerCounts[inv.ticker] = (tickerCounts[inv.ticker] || 0) + 1;
      }
    });

    return Object.keys(tickerCounts).filter(
      (ticker) => tickerCounts[ticker] > 1,
    );
  }

  // Goals
  /** @deprecated Use getGoalsAsync() instead */
  getGoals(): Goal[] {
    console.warn('getGoals() is deprecated. Use getGoalsAsync() instead.');
    return this.getFromStorage<Goal>("sua-grana-goals");
  }

  async getGoalsAsync(): Promise<Goal[]> {
    return await localDataService.getGoals();
  }

  /** @deprecated Use saveGoalAsync() instead */
  saveGoal(goal: Omit<Goal, "id" | "createdAt" | "updatedAt">): Goal {
    console.warn('saveGoal() is deprecated. Use saveGoalAsync() instead.');
    if (!this.isClient()) {
      return {
        ...goal,
        id: `temp-${Date.now()}`,
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      } as Goal;
    }
    const goals = this.getGoals();
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    goals.push(newGoal);
    // this.saveToStorage("sua-grana-goals", goals); // Removed localStorage write
    return newGoal;
  }

  async saveGoalAsync(goal: Omit<Goal, "id" | "createdAt" | "updatedAt">): Promise<Goal> {
    return await localDataService.saveGoal(goal);
  }

  /** @deprecated Use updateGoalAsync() instead */
  updateGoal(id: string, updates: Partial<Goal>): void {
    console.warn('updateGoal() is deprecated. Use updateGoalAsync() instead.');
    if (!this.isClient()) return;
    const goals = this.getGoals();
    const index = goals.findIndex((g) => g.id === id);
    if (index !== -1) {
      goals[index] = {
        ...goals[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      // this.saveToStorage("sua-grana-goals", goals); // Removed localStorage write
    }
  }

  async updateGoalAsync(id: string, updates: Partial<Goal>): Promise<void> {
    await localDataService.updateGoal(id, updates);
  }

  /** @deprecated Use deleteGoalAsync() instead */
  deleteGoal(id: string): void {
    console.warn('deleteGoal() is deprecated. Use deleteGoalAsync() instead.');
    if (!this.isClient()) return;
    const goals = this.getGoals().filter((g) => g.id !== id);
    // this.saveToStorage("sua-grana-goals", goals); // Removed localStorage write
  }

  async deleteGoalAsync(id: string): Promise<void> {
    await localDataService.deleteGoal(id);
  }



  // Trips
  getTrips(): Trip[] {
    return this.getFromStorage<Trip>("sua-grana-trips");
  }

  saveTrip(trip: Omit<Trip, "id" | "createdAt" | "updatedAt">): Trip {
    if (!this.isClient()) return trip as Trip;
    const trips = this.getTrips();
    const newTrip: Trip = {
      ...trip,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    trips.push(newTrip);
    this.saveToStorage("sua-grana-trips", trips);
    return newTrip;
  }

  updateTrip(id: string, updates: Partial<Trip>): void {
    if (!this.isClient()) return;

    if (!id || typeof id !== "string") {
      logComponents.error("Invalid trip ID provided:", id);
      return;
    }

    if (!updates || typeof updates !== "object") {
      logComponents.error("Invalid updates provided:", updates);
      return;
    }

    try {
      const trips = this.getTrips();
      const index = trips.findIndex((t) => t && t.id === id);

      if (index !== -1) {
        // Validate participants if being updated
        if (updates.participants !== undefined) {
          if (!Array.isArray(updates.participants)) {
            logComponents.error("Participants must be an array:", updates.participants,
            );
            return;
          }
          // Ensure all participants are strings
          updates.participants = updates.participants.filter(
            (p) => typeof p === "string" && p.trim().length > 0,
          );
        }

        trips[index] = {
          ...trips[index],
          ...updates,
          updatedAt: this.getTimestamp(),
        };
        this.saveToStorage("sua-grana-trips", trips);
      } else {
        console.warn(`Trip with ID ${id} not found`);
      }
    } catch (error) {
      logComponents.error("Error updating trip:", error);
    }
  }

  deleteTrip(id: string): void {
    if (!this.isClient()) return;
    const trips = this.getTrips().filter((t) => t.id !== id);
    // Dados são removidos do banco via DataService
  }

  addParticipantToTrip(tripId: string, participantName: string): void {
    if (!this.isClient()) return;
    const trips = this.getTrips();
    const tripIndex = trips.findIndex((t) => t.id === tripId);

    if (tripIndex !== -1) {
      const trip = trips[tripIndex];
      if (!trip.participants.includes(participantName)) {
        trip.participants.push(participantName);
        trip.updatedAt = this.getTimestamp();
        this.saveToStorage("sua-grana-trips", trips);
      }
    }
  }

  // Accounts
  getAccounts(): Account[] {
    return this.getFromStorage<Account>("sua-grana-accounts");
  }

  addAccount(account: Account): Account {
    if (!this.isClient()) return account;
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...account,
      id: account.id || this.generateId(),
      createdAt: account.createdAt || this.getTimestamp(),
      updatedAt: account.updatedAt || this.getTimestamp(),
    };
    accounts.push(newAccount);
    this.saveToStorage("sua-grana-accounts", accounts);
    return newAccount;
  }

  saveAccount(
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
  ): Account {
    if (!this.isClient()) {
      return {
        ...accountData,
        id: `temp-${Date.now()}`,
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      } as Account;
    }
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...accountData,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    accounts.push(newAccount);
    this.saveToStorage("sua-grana-accounts", accounts);
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): void {
    if (!this.isClient()) return;
    const accounts = this.getAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index !== -1) {
      accounts[index] = {
        ...accounts[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      this.saveToStorage("sua-grana-accounts", accounts);
    }
  }

  deleteAccount(id: string): void {
    if (!this.isClient()) return;
    const accounts = this.getAccounts().filter((a) => a.id !== id);
    this.saveToStorage("sua-grana-accounts", accounts);
  }

  updateAccountBalance(accountName: string, amount: number): void {
    if (!this.isClient()) return;
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.name === accountName);
    if (account) {
      account.balance += amount;
      account.updatedAt = this.getTimestamp();
      this.saveToStorage("sua-grana-accounts", accounts);
    }
  }

  // Trip expenses
  addTripExpense(tripId: string, amount: number): void {
    if (!this.isClient()) return;
    const trips = this.getTrips();
    const trip = trips.find((t) => t.id === tripId);
    if (trip) {
      trip.spent += amount;
      trip.updatedAt = this.getTimestamp();
      // Dados são salvos no banco via DataService
    }
  }

  // Get active trips
  getActiveTrips(): Trip[] {
    return this.getTrips().filter((trip) => trip.status === "active");
  }

  // Itineraries
  getItineraries(tripId: string): Itinerary[] {
    if (!this.isClient()) return [];
    // Retornar array vazio - dados vêm do banco via DataService
    return [];
  }

  saveItinerary(
    itinerary: Omit<Itinerary, "id" | "createdAt" | "updatedAt">,
  ): Itinerary {
    if (!this.isClient()) return itinerary as Itinerary;
    const itineraries = this.getItineraries(itinerary.tripId);
    const newItinerary: Itinerary = {
      ...itinerary,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    itineraries.push(newItinerary);
    // Dados são salvos no banco via DataService
    return newItinerary;
  }

  updateItinerary(
    tripId: string,
    dayId: string,
    updates: Partial<Itinerary>,
  ): void {
    if (!this.isClient()) return;
    const itineraries = this.getItineraries(tripId);
    const index = itineraries.findIndex((i) => i.id === dayId);
    if (index !== -1) {
      itineraries[index] = {
        ...itineraries[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      // Dados são salvos no banco via DataService
    }
  }

  // User Profile Management
  getUserProfile(): UserProfile | null {
    if (!this.isClient()) return null;
    // Retornar null - dados vêm do banco via DataService
    return null;
  }

  saveUserProfile(
    profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">,
  ): UserProfile {
    if (!this.isClient()) return profile as UserProfile;

    const existingProfile = this.getUserProfile();
    const newProfile: UserProfile = {
      ...profile,
      id: existingProfile?.id || this.generateId(),
      createdAt: existingProfile?.createdAt || this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };

    // Dados são salvos no banco via DataService
    return newProfile;
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
    if (!this.isClient()) return null;

    const existingProfile = this.getUserProfile();
    if (!existingProfile) return null;

    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: this.getTimestamp(),
    };

    // Dados são salvos no banco via DataService
    return updatedProfile;
  }

  deleteUserProfile(): void {
    if (!this.isClient()) return;
    // Dados são removidos do banco via DataService
  }

  // Dividends Management
  getDividends(): Dividend[] {
    return this.getFromStorage<Dividend>("sua-grana-dividends");
  }

  saveDividend(
    dividend: Omit<Dividend, "id" | "createdAt" | "updatedAt">,
  ): Dividend {
    if (!this.isClient()) return dividend as Dividend;
    const dividends = this.getDividends();
    const newDividend: Dividend = {
      ...dividend,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    dividends.push(newDividend);
    this.saveToStorage("sua-grana-dividends", dividends);
    return newDividend;
  }

  updateDividend(id: string, updates: Partial<Dividend>): void {
    if (!this.isClient()) return;
    const dividends = this.getDividends();
    const index = dividends.findIndex((d) => d.id === id);
    if (index !== -1) {
      dividends[index] = {
        ...dividends[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      this.saveToStorage("sua-grana-dividends", dividends);
    }
  }

  deleteDividend(id: string): void {
    if (!this.isClient()) return;
    const dividends = this.getDividends().filter((d) => d.id !== id);
    this.saveToStorage("sua-grana-dividends", dividends);
  }

  getDividendsByTicker(ticker: string): Dividend[] {
    return this.getDividends().filter((d) => d.ticker === ticker);
  }

  // Emergency Reserve methods
  getEmergencyReserve(): EmergencyReserve | null {
    const reserves = this.getFromStorage<EmergencyReserve>(
      "sua-grana-emergency-reserve",
    );
    return reserves.length > 0 ? reserves[0] : null;
  }

  saveEmergencyReserve(
    reserve: Omit<EmergencyReserve, "id" | "createdAt" | "updatedAt">,
  ): EmergencyReserve {
    const newReserve: EmergencyReserve = {
      ...reserve,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };

    // Only one emergency reserve allowed, so replace existing one
    this.saveToStorage("sua-grana-emergency-reserve", [newReserve]);
    this.invalidateCache("sua-grana-emergency-reserve");
    return newReserve;
  }

  updateEmergencyReserve(
    updates: Partial<EmergencyReserve>,
  ): EmergencyReserve | null {
    const existing = this.getEmergencyReserve();
    if (!existing) return null;

    const updated: EmergencyReserve = {
      ...existing,
      ...updates,
      updatedAt: this.getTimestamp(),
    };

    this.saveToStorage("sua-grana-emergency-reserve", [updated]);
    this.invalidateCache("sua-grana-emergency-reserve");
    return updated;
  }

  deleteEmergencyReserve(): void {
    this.saveToStorage("sua-grana-emergency-reserve", []);
    this.invalidateCache("sua-grana-emergency-reserve");
  }

  addToEmergencyReserve(amount: number): EmergencyReserve | null {
    const existing = this.getEmergencyReserve();
    if (!existing) return null;

    return this.updateEmergencyReserve({
      currentAmount: existing.currentAmount + amount,
    });
  }

  getEmergencyReserveProgress(): {
    percentage: number;
    monthsLeft: number;
    isComplete: boolean;
  } {
    const reserve = this.getEmergencyReserve();
    if (!reserve) return { percentage: 0, monthsLeft: 0, isComplete: false };

    const percentage =
      reserve.targetAmount > 0
        ? (reserve.currentAmount / reserve.targetAmount) * 100
        : 0;
    const remaining = Math.max(0, reserve.targetAmount - reserve.currentAmount);
    const monthsLeft =
      reserve.monthlyGoal > 0 ? Math.ceil(remaining / reserve.monthlyGoal) : 0;
    const isComplete = reserve.currentAmount >= reserve.targetAmount;

    return { percentage, monthsLeft, isComplete };
  }

  // Generic methods for debt management
  // Income Settings methods (DEPRECATED)
  /** @deprecated Use getIncomeSettingsAsync() instead */
  getIncomeSettings(): any | null {
    console.warn('getIncomeSettings() is deprecated. Use getIncomeSettingsAsync() instead.');
    return this.getFromStorage("income_settings")[0] || null;
  }

  async getIncomeSettingsAsync(): Promise<IncomeSettings | null> {
    const settings = await localDataService.getUserSettings('income');
    return settings ? settings.data : null;
  }

  /** @deprecated Use saveIncomeSettingsAsync() instead */
  saveIncomeSettings(settings: any): void {
    console.warn('saveIncomeSettings() is deprecated. Use saveIncomeSettingsAsync() instead.');
    // this.saveToStorage("income_settings", [settings]); // Removed localStorage write
    this.invalidateCache("income_settings");
  }

  async saveIncomeSettingsAsync(settings: Omit<IncomeSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await localDataService.saveUserSettings('income', settings);
  }

  /** @deprecated Use getCategoriesAsync() instead */
  getCategories(): any[] {
    console.warn('getCategories() is deprecated. Use getCategoriesAsync() instead.');
    return this.getFromStorage<any>("categories");
  }

  async getCategoriesAsync(): Promise<Category[]> {
    return await localDataService.getCategories();
  }

  /** @deprecated Use saveCategoryAsync() instead */
  saveCategories(categories: any[]): void {
    console.warn('saveCategories() is deprecated. Use saveCategoryAsync() instead.');
    // this.saveToStorage("categories", categories); // Removed localStorage write
    this.invalidateCache("categories");
  }

  async saveCategoryAsync(category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    return await localDataService.saveCategory(category);
  }

  /** @deprecated Use getTagsAsync() instead */
  getTags(): any[] {
    console.warn('getTags() is deprecated. Use getTagsAsync() instead.');
    return this.getFromStorage<any>("tags");
  }

  async getTagsAsync(): Promise<Tag[]> {
    return await localDataService.getTags();
  }

  /** @deprecated Use saveTagAsync() instead */
  saveTags(tags: any[]): void {
    console.warn('saveTags() is deprecated. Use saveTagAsync() instead.');
    // this.saveToStorage("tags", tags); // Removed localStorage write
    this.invalidateCache("tags");
  }

  async saveTagAsync(tag: Omit<Tag, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    return await localDataService.saveTag(tag);
  }

  /** @deprecated Use getFamilyMembersAsync() instead */
  getFamilyMembers(): any[] {
    console.warn('getFamilyMembers() is deprecated. Use getFamilyMembersAsync() instead.');
    return this.getFromStorage<any>("familyMembers");
  }

  async getFamilyMembersAsync(): Promise<any[]> {
    const settings = await localDataService.getUserSettings();
    return settings && settings.data && settings.data.family ? settings.data.family : [];
  }

  /** @deprecated Use saveFamilyMembersAsync() instead */
  saveFamilyMembers(familyMembers: any[]): void {
    console.warn('saveFamilyMembers() is deprecated. Use saveFamilyMembersAsync() instead.');
    // this.saveToStorage("familyMembers", familyMembers); // Removed localStorage write
    this.invalidateCache("familyMembers");
  }

  async saveFamilyMembersAsync(members: any[]): Promise<void> {
    const currentSettings = await localDataService.getUserSettings();
    const settingsData = currentSettings ? currentSettings.data : {};
    settingsData.family = members;
    await localDataService.saveUserSettings(settingsData);
  }

  /** @deprecated Use getBudgetsAsync() instead */
  getBudgetCategories(): any[] {
    console.warn('getBudgetCategories() is deprecated. Use getBudgetsAsync() instead.');
    if (!this.isClient()) return [];
    return this.getFromStorage<any>("budgetCategories");
  }

  async getBudgetsAsync(): Promise<Budget[]> {
    return await localDataService.getBudgets();
  }

  /** @deprecated Use saveBudgetAsync() instead */
  saveBudgetCategories(budgetCategories: any[]): void {
    console.warn('saveBudgetCategories() is deprecated. Use saveBudgetAsync() instead.');
    if (!this.isClient()) return;
    // this.saveToStorage("budgetCategories", budgetCategories); // Removed localStorage write
    this.invalidateCache("budgetCategories");
  }

  async saveBudgetAsync(budget: Omit<Budget, "id" | "createdAt" | "updatedAt">): Promise<Budget> {
    return await localDataService.saveBudget(budget);
  }

  async updateBudgetAsync(id: string, updates: Partial<Budget>): Promise<void> {
    await localDataService.updateBudget(id, updates);
  }

  async deleteBudgetAsync(id: string): Promise<void> {
    await localDataService.deleteBudget(id);
  }

  // Shared Debts Management
  getSharedDebts(): SharedDebt[] {
    return this.getFromStorage("shared_debts");
  }

  saveSharedDebt(
    debt: Omit<SharedDebt, "id" | "createdAt" | "updatedAt">,
  ): SharedDebt {
    const newDebt: SharedDebt = {
      ...debt,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };

    const debts = this.getSharedDebts();
    debts.push(newDebt);
    this.saveToStorage("shared_debts", debts);
    this.invalidateCache("shared_debts");

    return newDebt;
  }

  updateSharedDebt(id: string, updates: Partial<SharedDebt>): void {
    const debts = this.getSharedDebts();
    const index = debts.findIndex((d) => d.id === id);
    if (index !== -1) {
      debts[index] = {
        ...debts[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      this.saveToStorage("shared_debts", debts);
      this.invalidateCache("shared_debts");
    }
  }

  deleteSharedDebt(id: string): void {
    const debts = this.getSharedDebts().filter((d) => d.id !== id);
    this.saveToStorage("shared_debts", debts);
    this.invalidateCache("shared_debts");
  }

  getDebtsByCreditor(creditor: string): SharedDebt[] {
    return this.getSharedDebts().filter(
      (debt) => debt.creditor === creditor && debt.status === "active",
    );
  }

  getDebtsByDebtor(debtor: string): SharedDebt[] {
    return this.getSharedDebts().filter(
      (debt) => debt.debtor === debtor && debt.status === "active",
    );
  }

  processDebtPayment(
    creditor: string,
    debtor: string,
    amount: number,
    description: string,
    transactionId?: string,
  ): {
    paidDebts: SharedDebt[];
    remainingAmount: number;
    newDebt?: SharedDebt;
  } {
    const existingDebts = this.getSharedDebts()
      .filter(
        (debt) =>
          debt.creditor === creditor &&
          debt.debtor === debtor &&
          debt.status === "active",
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ); // Mais antigas primeiro

    let remainingAmount = amount;
    const paidDebts: SharedDebt[] = [];

    // Quitar dívidas existentes primeiro
    for (const debt of existingDebts) {
      if (remainingAmount <= 0) break;

      if (remainingAmount >= debt.currentAmount) {
        // Quita a dívida completamente
        remainingAmount -= debt.currentAmount;
        this.updateSharedDebt(debt.id, {
          currentAmount: 0,
          status: "paid",
        });
        paidDebts.push({ ...debt, currentAmount: 0, status: "paid" });
      } else {
        // Pagamento parcial
        const newAmount = debt.currentAmount - remainingAmount;
        this.updateSharedDebt(debt.id, {
          currentAmount: newAmount,
        });
        remainingAmount = 0;
      }
    }

    let newDebt: SharedDebt | undefined;

    // Se ainda sobrou valor, criar nova dívida (agora o devedor vira credor)
    if (remainingAmount > 0) {
      newDebt = this.saveSharedDebt({
        creditor: debtor, // Quem pagou vira o credor
        debtor: creditor, // Quem devia vira o devedor
        originalAmount: remainingAmount,
        currentAmount: remainingAmount,
        description,
        transactionId,
        status: "active",
      });
    }

    return { paidDebts, remainingAmount, newDebt };
  }

  // Broker management methods
  getBrokers(): any[] {
    return this.getFromStorage<any>("brokers");
  }

  saveBroker(broker: any): any {
    const brokers = this.getBrokers();
    const newBroker = {
      ...broker,
      id: this.generateId(),
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp(),
    };
    brokers.push(newBroker);
    this.saveToStorage("brokers", brokers);
    this.invalidateCache("brokers");
    return newBroker;
  }

  updateBroker(id: string, updates: any): void {
    const brokers = this.getBrokers();
    const index = brokers.findIndex((broker) => broker.id === id);
    if (index !== -1) {
      brokers[index] = {
        ...brokers[index],
        ...updates,
        updatedAt: this.getTimestamp(),
      };
      this.saveToStorage("brokers", brokers);
      this.invalidateCache("brokers");
    }
  }

  deleteBroker(id: string): void {
    const brokers = this.getBrokers().filter((broker) => broker.id !== id);
    this.saveToStorage("brokers", brokers);
    this.invalidateCache("brokers");
  }

  /** @deprecated Use dataService instead */
  getItem<T>(key: string): T | null {
    console.warn(`DEPRECATED: getItem(${key}) - Use dataService instead`);
    if (!this.isClient()) {
      return null;
    }

    try {
      const cached = this.getFromCache<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Retornar null - dados vêm do banco via DataService
      return null;
    } catch (error) {
      logComponents.error("Error getting item ${key}:", error);
      return null;
    }
  }

  /** @deprecated Use dataService instead */
  setItem<T>(key: string, value: T): void {
    console.warn(`DEPRECATED: setItem(${key}) - Use dataService instead`);
    if (!this.isClient()) {
      return;
    }

    try {
      // Apenas cache em memória - dados são salvos no banco via DataService
      this.setCache(key, value);
    } catch (error) {
      logComponents.error("Error setting item ${key}:", error);
    }
  }
}

export const storage = new Storage();

