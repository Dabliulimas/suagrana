import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TransactionList } from "../transaction-list";
import { storage } from "../../lib/storage";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/lib/storage");
jest.mock("sonner");
jest.mock("../enhanced-transaction-modal", () => ({
  EnhancedTransactionModal: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="transaction-modal">
        <button onClick={onClose}>Close</button>
        <button
          onClick={() => onSave({ id: "1", amount: 100, description: "Test" })}
        >
          Save
        </button>
      </div>
    ) : null,
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockTransactions = [
  {
    id: "1",
    amount: -50.0,
    description: "Grocery shopping",
    category: "Food",
    type: "expense" as const,
    date: "2024-01-15",
    account: "Checking",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "2",
    amount: 1000.0,
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
    amount: -25.0,
    description: "Shared dinner",
    category: "Food",
    type: "shared" as const,
    date: "2024-01-10",
    account: "Credit Card",
    createdAt: "2024-01-10T10:00:00.000Z",
    updatedAt: "2024-01-10T10:00:00.000Z",
  },
];

describe("TransactionList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getTransactions.mockReturnValue(mockTransactions);
    mockStorage.getAccounts.mockReturnValue([
      {
        id: "1",
        name: "Checking",
        type: "checking",
        balance: 1000,
        currency: "BRL",
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T10:00:00.000Z",
      },
      {
        id: "2",
        name: "Credit Card",
        type: "credit",
        balance: -500,
        currency: "BRL",
        createdAt: "2024-01-01T10:00:00.000Z",
        updatedAt: "2024-01-01T10:00:00.000Z",
      },
    ]);
  });

  describe("Rendering", () => {
    it("should render transaction list", () => {
      render(<TransactionList />);

      expect(screen.getByText("Transações")).toBeInTheDocument();
      expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
      expect(screen.getByText("Salary")).toBeInTheDocument();
      expect(screen.getByText("Shared dinner")).toBeInTheDocument();
    });

    it("should display transaction amounts correctly", () => {
      render(<TransactionList />);

      expect(screen.getByText("R$ 50,00")).toBeInTheDocument(); // Expense (absolute value)
      expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument(); // Income
      expect(screen.getByText("R$ 25,00")).toBeInTheDocument(); // Shared expense
    });

    it("should display transaction types with correct badges", () => {
      render(<TransactionList />);

      expect(screen.getByText("Despesa")).toBeInTheDocument();
      expect(screen.getByText("Receita")).toBeInTheDocument();
      expect(screen.getByText("Compartilhada")).toBeInTheDocument();
    });

    it("should show empty state when no transactions", () => {
      mockStorage.getTransactions.mockReturnValue([]);

      render(<TransactionList />);

      expect(
        screen.getByText("Nenhuma transação encontrada"),
      ).toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("should filter transactions by search term", async () => {
      render(<TransactionList />);

      const searchInput = screen.getByPlaceholderText("Buscar transações...");
      fireEvent.change(searchInput, { target: { value: "Grocery" } });

      await waitFor(() => {
        expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
        expect(screen.queryByText("Salary")).not.toBeInTheDocument();
        expect(screen.queryByText("Shared dinner")).not.toBeInTheDocument();
      });
    });

    it("should filter transactions by type", async () => {
      render(<TransactionList />);

      const typeFilter = screen.getByDisplayValue("Todos os tipos");
      fireEvent.click(typeFilter);

      const expenseOption = screen.getByText("Despesas");
      fireEvent.click(expenseOption);

      await waitFor(() => {
        expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
        expect(screen.getByText("Shared dinner")).toBeInTheDocument();
        expect(screen.queryByText("Salary")).not.toBeInTheDocument();
      });
    });

    it("should filter transactions by category", async () => {
      render(<TransactionList />);

      const categoryFilter = screen.getByDisplayValue("Todas as categorias");
      fireEvent.click(categoryFilter);

      const foodOption = screen.getByText("Food");
      fireEvent.click(foodOption);

      await waitFor(() => {
        expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
        expect(screen.getByText("Shared dinner")).toBeInTheDocument();
        expect(screen.queryByText("Salary")).not.toBeInTheDocument();
      });
    });

    it("should filter transactions by account", async () => {
      render(<TransactionList />);

      const accountFilter = screen.getByDisplayValue("Todas as contas");
      fireEvent.click(accountFilter);

      const checkingOption = screen.getByText("Checking");
      fireEvent.click(checkingOption);

      await waitFor(() => {
        expect(screen.getByText("Grocery shopping")).toBeInTheDocument();
        expect(screen.getByText("Salary")).toBeInTheDocument();
        expect(screen.queryByText("Shared dinner")).not.toBeInTheDocument();
      });
    });
  });

  describe("Sorting", () => {
    it("should sort transactions by date (newest first by default)", () => {
      render(<TransactionList />);

      const rows = screen.getAllByRole("row");
      // Skip header row, check data rows
      expect(rows[1]).toHaveTextContent("Grocery shopping"); // 2024-01-15
      expect(rows[2]).toHaveTextContent("Shared dinner"); // 2024-01-10
      expect(rows[3]).toHaveTextContent("Salary"); // 2024-01-01
    });

    it("should sort transactions by amount when amount header is clicked", async () => {
      render(<TransactionList />);

      const amountHeader = screen.getByText("Valor");
      fireEvent.click(amountHeader);

      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        // Should be sorted by amount (ascending)
        expect(rows[1]).toHaveTextContent("Grocery shopping"); // -50
        expect(rows[2]).toHaveTextContent("Shared dinner"); // -25
        expect(rows[3]).toHaveTextContent("Salary"); // 1000
      });
    });
  });

  describe("Transaction Actions", () => {
    it("should open edit modal when edit button is clicked", async () => {
      render(<TransactionList />);

      const editButtons = screen.getAllByLabelText("Editar transação");
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("transaction-modal")).toBeInTheDocument();
      });
    });

    it("should open delete confirmation when delete button is clicked", async () => {
      render(<TransactionList />);

      const deleteButtons = screen.getAllByLabelText("Excluir transação");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
        expect(
          screen.getByText("Esta ação não pode ser desfeita."),
        ).toBeInTheDocument();
      });
    });

    it("should delete transaction when confirmed", async () => {
      mockStorage.deleteTransaction.mockReturnValue(true);

      render(<TransactionList />);

      const deleteButtons = screen.getAllByLabelText("Excluir transação");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButton = screen.getByText("Excluir");
        fireEvent.click(confirmButton);
      });

      expect(mockStorage.deleteTransaction).toHaveBeenCalledWith("1");
      expect(mockToast.success).toHaveBeenCalledWith(
        "Transação excluída com sucesso!",
      );
    });

    it("should handle delete error", async () => {
      mockStorage.deleteTransaction.mockReturnValue(false);

      render(<TransactionList />);

      const deleteButtons = screen.getAllByLabelText("Excluir transação");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButton = screen.getByText("Excluir");
        fireEvent.click(confirmButton);
      });

      expect(mockToast.error).toHaveBeenCalledWith("Erro ao excluir transação");
    });
  });

  describe("Statistics", () => {
    it("should display correct statistics", () => {
      render(<TransactionList />);

      // Total income: 1000
      expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();

      // Total expenses: 50 + 25 = 75
      expect(screen.getByText("R$ 75,00")).toBeInTheDocument();

      // Net balance: 1000 - 75 = 925
      expect(screen.getByText("R$ 925,00")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<TransactionList />);

      expect(screen.getByLabelText("Buscar transações")).toBeInTheDocument();
      expect(screen.getByLabelText("Filtrar por tipo")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Filtrar por categoria"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Filtrar por conta")).toBeInTheDocument();
    });

    it("should support keyboard navigation", () => {
      render(<TransactionList />);

      const searchInput = screen.getByPlaceholderText("Buscar transações...");
      searchInput.focus();

      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe("Performance", () => {
    it("should handle large number of transactions", () => {
      const manyTransactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        amount: Math.random() * 1000,
        description: `Transaction ${i}`,
        category: "Test",
        type: "expense" as const,
        date: "2024-01-01",
        account: "Test Account",
      }));

      mockStorage.getTransactions.mockReturnValue(manyTransactions);

      const { container } = render(<TransactionList />);

      // Should render without performance issues
      expect(container).toBeInTheDocument();
      expect(screen.getByText("1000 transações")).toBeInTheDocument();
    });
  });
});
