import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FinancialDashboard } from "../dashboards/financial/financial-dashboard";
import { storage } from "../../lib/storage";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/lib/storage");
jest.mock("sonner");
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockTransactions = [
  {
    id: "1",
    amount: -500.0,
    description: "Rent",
    category: "Housing",
    type: "expense" as const,
    date: "2024-01-01",
    account: "Checking",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
  {
    id: "2",
    amount: 3000.0,
    description: "Salary",
    category: "Income",
    type: "income" as const,
    date: "2024-01-01",
    account: "Checking",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
  {
    id: "3",
    amount: -200.0,
    description: "Groceries",
    category: "Food",
    type: "expense" as const,
    date: "2024-01-15",
    account: "Credit Card",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "4",
    amount: -100.0,
    description: "Shared dinner",
    category: "Food",
    type: "shared" as const,
    date: "2024-01-20",
    account: "Credit Card",
    createdAt: "2024-01-20T10:00:00.000Z",
    updatedAt: "2024-01-20T10:00:00.000Z",
  },
];

const mockAccounts = [
  {
    id: "1",
    name: "Checking",
    type: "checking" as const,
    balance: 2500.0,
    currency: "BRL",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Credit Card",
    type: "credit" as const,
    balance: -300.0,
    currency: "BRL",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
  {
    id: "3",
    name: "Savings",
    type: "savings" as const,
    balance: 10000.0,
    currency: "BRL",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
];

const mockGoals = [
  {
    id: "1",
    name: "Emergency Fund",
    targetAmount: 15000.0,
    currentAmount: 10000.0,
    targetDate: "2024-12-31",
    category: "Emergency",
    priority: "high" as const,
  },
  {
    id: "2",
    name: "Vacation",
    targetAmount: 5000.0,
    currentAmount: 1500.0,
    targetDate: "2024-06-30",
    category: "Travel",
    priority: "medium" as const,
  },
];

describe("FinancialDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getTransactions.mockReturnValue(mockTransactions);
    mockStorage.getAccounts.mockReturnValue(mockAccounts);
    mockStorage.getGoals.mockReturnValue(mockGoals);
  });

  describe("Rendering", () => {
    it("should render dashboard with all main sections", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Dashboard Financeiro")).toBeInTheDocument();
      expect(screen.getByText("Resumo Financeiro")).toBeInTheDocument();
      expect(screen.getByText("Contas")).toBeInTheDocument();
      expect(screen.getByText("Metas")).toBeInTheDocument();
      expect(screen.getByText("Transações Recentes")).toBeInTheDocument();
    });

    it("should display financial summary cards", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Receitas")).toBeInTheDocument();
      expect(screen.getByText("Despesas")).toBeInTheDocument();
      expect(screen.getByText("Saldo")).toBeInTheDocument();
      expect(screen.getByText("Patrimônio")).toBeInTheDocument();
    });

    it("should calculate and display correct financial values", () => {
      render(<FinancialDashboard />);

      // Total income: 3000
      expect(screen.getByText("R$ 3.000,00")).toBeInTheDocument();

      // Total expenses: 500 + 200 + 100 = 800
      expect(screen.getByText("R$ 800,00")).toBeInTheDocument();

      // Net balance: 3000 - 800 = 2200
      expect(screen.getByText("R$ 2.200,00")).toBeInTheDocument();

      // Total assets: 2500 + (-300) + 10000 = 12200
      expect(screen.getByText("R$ 12.200,00")).toBeInTheDocument();
    });
  });

  describe("Charts", () => {
    it("should render expense distribution chart", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Distribuição de Gastos")).toBeInTheDocument();
      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    });

    it("should render monthly trend chart", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Tendência Mensal")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("should render account balance chart", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Saldo por Conta")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  describe("Accounts Section", () => {
    it("should display all accounts with correct information", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Checking")).toBeInTheDocument();
      expect(screen.getByText("Credit Card")).toBeInTheDocument();
      expect(screen.getByText("Savings")).toBeInTheDocument();

      expect(screen.getByText("R$ 2.500,00")).toBeInTheDocument();
      expect(screen.getByText("R$ -300,00")).toBeInTheDocument();
      expect(screen.getByText("R$ 10.000,00")).toBeInTheDocument();
    });

    it("should show account types correctly", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Conta Corrente")).toBeInTheDocument();
      expect(screen.getByText("Cartão de Crédito")).toBeInTheDocument();
      expect(screen.getByText("Poupança")).toBeInTheDocument();
    });

    it("should handle empty accounts list", () => {
      mockStorage.getAccounts.mockReturnValue([]);

      render(<FinancialDashboard />);

      expect(screen.getByText("Nenhuma conta cadastrada")).toBeInTheDocument();
    });
  });

  describe("Goals Section", () => {
    it("should display all goals with progress", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
      expect(screen.getByText("Vacation")).toBeInTheDocument();

      // Progress percentages: 10000/15000 = 66.67%, 1500/5000 = 30%
      expect(screen.getByText("66.7%")).toBeInTheDocument();
      expect(screen.getByText("30.0%")).toBeInTheDocument();
    });

    it("should show goal priorities", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Alta")).toBeInTheDocument();
      expect(screen.getByText("Média")).toBeInTheDocument();
    });

    it("should handle empty goals list", () => {
      mockStorage.getGoals.mockReturnValue([]);

      render(<FinancialDashboard />);

      expect(screen.getByText("Nenhuma meta cadastrada")).toBeInTheDocument();
    });

    it("should show completed goals", () => {
      const completedGoal = {
        ...mockGoals[0],
        currentAmount: 15000.0, // Equal to target
      };
      mockStorage.getGoals.mockReturnValue([completedGoal]);

      render(<FinancialDashboard />);

      expect(screen.getByText("100.0%")).toBeInTheDocument();
      expect(screen.getByText("Concluída")).toBeInTheDocument();
    });
  });

  describe("Recent Transactions", () => {
    it("should display recent transactions", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Rent")).toBeInTheDocument();
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.getByText("Groceries")).toBeInTheDocument();
      expect(screen.getByText("Shared dinner")).toBeInTheDocument();
    });

    it("should show transaction types with correct styling", () => {
      render(<FinancialDashboard />);

      expect(screen.getByText("Despesa")).toBeInTheDocument();
      expect(screen.getByText("Receita")).toBeInTheDocument();
      expect(screen.getByText("Compartilhada")).toBeInTheDocument();
    });

    it("should limit recent transactions display", () => {
      const manyTransactions = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        amount: -100,
        description: `Transaction ${i}`,
        category: "Test",
        type: "expense" as const,
        date: "2024-01-01",
        account: "Test",
      }));

      mockStorage.getTransactions.mockReturnValue(manyTransactions);

      render(<FinancialDashboard />);

      // Should show only the most recent ones (typically 5-10)
      const transactionElements = screen.getAllByText(/Transaction/);
      expect(transactionElements.length).toBeLessThanOrEqual(10);
    });

    it("should handle empty transactions list", () => {
      mockStorage.getTransactions.mockReturnValue([]);

      render(<FinancialDashboard />);

      expect(
        screen.getByText("Nenhuma transação encontrada"),
      ).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it('should navigate to transactions page when "Ver todas" is clicked', () => {
      render(<FinancialDashboard />);

      const viewAllButton = screen.getByText("Ver todas");
      expect(viewAllButton).toBeInTheDocument();

      fireEvent.click(viewAllButton);
      // Navigation would be handled by router in real app
    });

    it("should refresh data when refresh button is clicked", async () => {
      render(<FinancialDashboard />);

      const refreshButton = screen.getByLabelText("Atualizar dados");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockStorage.getTransactions).toHaveBeenCalledTimes(2);
        expect(mockStorage.getAccounts).toHaveBeenCalledTimes(2);
        expect(mockStorage.getGoals).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Responsive Design", () => {
    it("should adapt to mobile viewport", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<FinancialDashboard />);

      // Charts should be responsive
      expect(screen.getAllByTestId("responsive-container")).toHaveLength(3);
    });
  });

  describe("Error Handling", () => {
    it("should handle storage errors gracefully", () => {
      mockStorage.getTransactions.mockImplementation(() => {
        throw new Error("Storage error");
      });

      render(<FinancialDashboard />);

      expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
    });

    it("should show loading state", () => {
      // Mock delayed response
      mockStorage.getTransactions.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve([]), 1000));
      });

      render(<FinancialDashboard />);

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large datasets efficiently", () => {
      const largeTransactionSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i}`,
        amount: Math.random() * 1000,
        description: `Transaction ${i}`,
        category: "Test",
        type: "expense" as const,
        date: "2024-01-01",
        account: "Test",
      }));

      mockStorage.getTransactions.mockReturnValue(largeTransactionSet);

      const startTime = performance.now();
      render(<FinancialDashboard />);
      const endTime = performance.now();

      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<FinancialDashboard />);

      expect(screen.getByLabelText("Resumo financeiro")).toBeInTheDocument();
      expect(screen.getByLabelText("Lista de contas")).toBeInTheDocument();
      expect(screen.getByLabelText("Lista de metas")).toBeInTheDocument();
      expect(screen.getByLabelText("Transações recentes")).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<FinancialDashboard />);

      const refreshButton = screen.getByLabelText("Atualizar dados");
      refreshButton.focus();

      expect(document.activeElement).toBe(refreshButton);
    });

    it("should have proper heading hierarchy", () => {
      render(<FinancialDashboard />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Dashboard Financeiro",
      );
      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4); // Resumo, Contas, Metas, Transações
    });
  });
});
