import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Account,
  Transaction,
  Goal,
  Investment,
  Contact,
  CreateAccountInput,
  CreateTransactionInput,
  CreateGoalInput,
  CreateInvestmentInput,
  CreateContactInput,
  UpdateAccountInput,
  UpdateTransactionInput,
  UpdateGoalInput,
  UpdateInvestmentInput,
  MonthlyStats,
  CategoryStats,
  DashboardData,
} from "@/types";

interface FinancialStore {
  // Estado
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;

  // Actions - Accounts
  fetchAccounts: () => Promise<void>;
  createAccount: (data: Omit<CreateAccountInput, "userId">) => Promise<void>;
  updateAccount: (id: string, data: UpdateAccountInput) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Actions - Transactions
  fetchTransactions: () => Promise<void>;
  createTransaction: (
    data: Omit<CreateTransactionInput, "userId">,
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    data: UpdateTransactionInput,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Actions - Goals
  fetchGoals: () => Promise<void>;
  createGoal: (data: Omit<CreateGoalInput, "userId">) => Promise<void>;
  updateGoal: (id: string, data: UpdateGoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Actions - Investments
  fetchInvestments: () => Promise<void>;
  createInvestment: (
    data: Omit<CreateInvestmentInput, "userId">,
  ) => Promise<void>;
  updateInvestment: (id: string, data: UpdateInvestmentInput) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  // Actions - Contacts
  fetchContacts: () => Promise<void>;
  createContact: (data: Omit<CreateContactInput, "userId">) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Actions - Gerais
  fetchAllData: () => Promise<void>;
  clearError: () => void;

  // Computed values
  getTotalBalance: () => number;
  getMonthlyStats: (month?: string) => MonthlyStats;
  getCategoryStats: (month?: string) => CategoryStats[];
  getDashboardData: () => DashboardData;
}

const CURRENT_USER_ID = "user_1"; // Temporário - será substituído por auth real

export const useFinancialStore = create<FinancialStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      accounts: [],
      transactions: [],
      goals: [],
      investments: [],
      contacts: [],
      isLoading: false,
      error: null,

      // Actions - Accounts
      fetchAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/accounts");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ accounts: data.accounts, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createAccount: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, userId: CURRENT_USER_ID }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            accounts: [...state.accounts, result.account],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateAccount: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/accounts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? result.account : account,
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteAccount: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/accounts/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          set((state) => ({
            accounts: state.accounts.filter((account) => account.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Actions - Transactions
      fetchTransactions: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/transactions");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ transactions: data.transactions, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createTransaction: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              userId: CURRENT_USER_ID,
              date:
                data.date instanceof Date ? data.date.toISOString() : data.date,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            transactions: [...state.transactions, result.transaction],
            isLoading: false,
          }));

          // Atualizar saldo da conta
          await get().fetchAccounts();
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateTransaction: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/transactions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              date:
                data.date instanceof Date ? data.date.toISOString() : data.date,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            transactions: state.transactions.map((transaction) =>
              transaction.id === id ? result.transaction : transaction,
            ),
            isLoading: false,
          }));

          // Atualizar saldo da conta
          await get().fetchAccounts();
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteTransaction: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/transactions/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          set((state) => ({
            transactions: state.transactions.filter(
              (transaction) => transaction.id !== id,
            ),
            isLoading: false,
          }));

          // Atualizar saldo da conta
          await get().fetchAccounts();
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Actions - Goals
      fetchGoals: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/goals");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ goals: data.goals, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createGoal: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              userId: CURRENT_USER_ID,
              targetDate:
                data.targetDate instanceof Date
                  ? data.targetDate.toISOString()
                  : data.targetDate,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            goals: [...state.goals, result.goal],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateGoal: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/goals/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              targetDate:
                data.targetDate instanceof Date
                  ? data.targetDate.toISOString()
                  : data.targetDate,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === id ? result.goal : goal,
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteGoal: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/goals/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          set((state) => ({
            goals: state.goals.filter((goal) => goal.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Actions - Investments
      fetchInvestments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/investments");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ investments: data.investments, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createInvestment: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/investments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              userId: CURRENT_USER_ID,
              purchaseDate:
                data.purchaseDate instanceof Date
                  ? data.purchaseDate.toISOString()
                  : data.purchaseDate,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            investments: [...state.investments, result.investment],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateInvestment: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/investments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              purchaseDate:
                data.purchaseDate instanceof Date
                  ? data.purchaseDate.toISOString()
                  : data.purchaseDate,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            investments: state.investments.map((investment) =>
              investment.id === id ? result.investment : investment,
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteInvestment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/investments/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          set((state) => ({
            investments: state.investments.filter(
              (investment) => investment.id !== id,
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Actions - Contacts
      fetchContacts: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/contacts");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ contacts: data.contacts, isLoading: false });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      createContact: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, userId: CURRENT_USER_ID }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            contacts: [...state.contacts, result.contact],
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateContact: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/contacts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const result = await response.json();
          set((state) => ({
            contacts: state.contacts.map((contact) =>
              contact.id === id ? result.contact : contact,
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteContact: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/contacts/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          set((state) => ({
            contacts: state.contacts.filter((contact) => contact.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Actions - Gerais
      fetchAllData: async () => {
        await Promise.all([
          get().fetchAccounts(),
          get().fetchTransactions(),
          get().fetchGoals(),
          get().fetchInvestments(),
          get().fetchContacts(),
        ]);
      },

      clearError: () => set({ error: null }),

      // Computed values
      getTotalBalance: () => {
        const { accounts } = get();
        return accounts.reduce(
          (total, account) => total + Number(account.balance),
          0,
        );
      },

      getMonthlyStats: (month) => {
        const { transactions } = get();
        const targetMonth = month || new Date().toISOString().slice(0, 7);

        const monthTransactions = transactions.filter((t) =>
          t.date.toString().startsWith(targetMonth),
        );

        const income = monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          month: targetMonth,
          income,
          expenses,
          balance: income - expenses,
          transactionCount: monthTransactions.length,
        };
      },

      getCategoryStats: (month) => {
        const { transactions } = get();
        const targetMonth = month || new Date().toISOString().slice(0, 7);

        const monthTransactions = transactions.filter(
          (t) =>
            t.date.toString().startsWith(targetMonth) && t.type === "expense",
        );

        const categoryTotals = monthTransactions.reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
          },
          {} as Record<string, number>,
        );

        const totalExpenses = Object.values(categoryTotals).reduce(
          (sum, amount) => sum + amount,
          0,
        );

        return Object.entries(categoryTotals).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          transactionCount: monthTransactions.filter(
            (t) => t.category === category,
          ).length,
        }));
      },

      getDashboardData: () => {
        const state = get();
        return {
          totalBalance: state.getTotalBalance(),
          monthlyStats: state.getMonthlyStats(),
          categoryStats: state.getCategoryStats(),
          accountBalances: state.accounts.map((account) => ({
            accountId: account.id,
            accountName: account.name,
            balance: Number(account.balance),
            type: account.type,
          })),
          recentTransactions: state.transactions
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 10),
          goalProgress: state.goals.filter((g) => g.status === "active"),
        };
      },
    }),
    {
      name: "financial-store",
    },
  ),
);
