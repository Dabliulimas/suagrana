import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EnhancedTransactionModal } from "../enhanced-transaction-modal";
import { storage } from "../../lib/storage";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/lib/storage");
jest.mock("sonner");
jest.mock("@/lib/logger", () => ({
  Logger: {
    getInstance: () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    }),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockAccounts = [
  {
    id: "1",
    name: "Checking Account",
    type: "checking" as const,
    balance: 1000,
    currency: "BRL",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Credit Card",
    type: "credit" as const,
    balance: -500,
    currency: "BRL",
    createdAt: "2024-01-01T10:00:00.000Z",
    updatedAt: "2024-01-01T10:00:00.000Z",
  },
];

const mockTransaction = {
  id: "1",
  amount: -250.0,
  description: "Grocery shopping",
  category: "Food",
  type: "expense" as const,
  date: "2024-01-15",
  account: "Checking Account",
  tags: ["grocery", "food"],
  notes: "Weekly grocery shopping",
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  editingTransaction: undefined,
};

describe("EnhancedTransactionModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getAccounts.mockReturnValue(mockAccounts);
    mockStorage.saveTransaction.mockReturnValue(true);
    mockStorage.updateTransaction.mockReturnValue(true);
  });

  describe("Rendering", () => {
    it("should render modal when open", () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      expect(screen.getByText("Nova Transação")).toBeInTheDocument();
      expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
      expect(screen.getByLabelText("Valor")).toBeInTheDocument();
      expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
      expect(screen.getByLabelText("Data")).toBeInTheDocument();
      expect(screen.getByLabelText("Conta")).toBeInTheDocument();
    });

    it("should not render modal when closed", () => {
      render(<EnhancedTransactionModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Nova Transação")).not.toBeInTheDocument();
    });

    it("should render edit mode when transaction is provided", () => {
      render(
        <EnhancedTransactionModal
          {...defaultProps}
          editingTransaction={mockTransaction}
        />,
      );

      expect(screen.getByText("Editar Transação")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Grocery shopping")).toBeInTheDocument();
      expect(screen.getByDisplayValue("250.00")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Food")).toBeInTheDocument();
    });

    it("should populate form fields with transaction data in edit mode", () => {
      render(
        <EnhancedTransactionModal
          {...defaultProps}
          editingTransaction={mockTransaction}
        />,
      );

      expect(screen.getByDisplayValue("Grocery shopping")).toBeInTheDocument();
      expect(screen.getByDisplayValue("250.00")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Food")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Checking Account")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Weekly grocery shopping"),
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for empty required fields", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
        expect(
          screen.getByText("Valor deve ser maior que zero"),
        ).toBeInTheDocument();
        expect(screen.getByText("Categoria é obrigatória")).toBeInTheDocument();
      });
    });

    it("should validate amount is positive", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const amountInput = screen.getByLabelText("Valor");
      fireEvent.change(amountInput, { target: { value: "-100" } });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Valor deve ser maior que zero"),
        ).toBeInTheDocument();
      });
    });

    it("should validate description length", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");
      fireEvent.change(descriptionInput, {
        target: { value: "a".repeat(101) },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Descrição deve ter no máximo 100 caracteres"),
        ).toBeInTheDocument();
      });
    });

    it("should validate future dates", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split("T")[0];

      const dateInput = screen.getByLabelText("Data");
      fireEvent.change(dateInput, { target: { value: futureDateString } });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Data não pode ser no futuro"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Interactions", () => {
    it("should update amount sign based on transaction type", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const amountInput = screen.getByLabelText("Valor");
      const typeSelect = screen.getByLabelText("Tipo");

      // Set amount
      fireEvent.change(amountInput, { target: { value: "100" } });

      // Change to expense
      fireEvent.change(typeSelect, { target: { value: "expense" } });

      await waitFor(() => {
        expect(amountInput).toHaveValue("100"); // Display value remains positive
      });
    });

    it("should suggest categories based on description", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");
      fireEvent.change(descriptionInput, { target: { value: "Supermarket" } });

      await waitFor(() => {
        const categoryInput = screen.getByLabelText("Categoria");
        expect(categoryInput).toHaveValue("Food");
      });
    });

    it("should handle tag input", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const tagInput = screen.getByLabelText("Tags (separadas por vírgula)");
      fireEvent.change(tagInput, {
        target: { value: "grocery, food, weekly" },
      });

      await waitFor(() => {
        expect(tagInput).toHaveValue("grocery, food, weekly");
      });
    });

    it("should handle notes input", () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const notesInput = screen.getByLabelText("Observações");
      fireEvent.change(notesInput, { target: { value: "Additional notes" } });

      expect(notesInput).toHaveValue("Additional notes");
    });
  });

  describe("Transaction Types", () => {
    it("should handle income transaction", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Descrição"), {
        target: { value: "Salary" },
      });
      fireEvent.change(screen.getByLabelText("Valor"), {
        target: { value: "3000" },
      });
      fireEvent.change(screen.getByLabelText("Categoria"), {
        target: { value: "Income" },
      });
      fireEvent.change(screen.getByLabelText("Tipo"), {
        target: { value: "income" },
      });
      fireEvent.change(screen.getByLabelText("Conta"), {
        target: { value: "Checking Account" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStorage.saveTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 3000,
            type: "income",
            description: "Salary",
          }),
        );
      });
    });

    it("should handle expense transaction", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Descrição"), {
        target: { value: "Rent" },
      });
      fireEvent.change(screen.getByLabelText("Valor"), {
        target: { value: "1200" },
      });
      fireEvent.change(screen.getByLabelText("Categoria"), {
        target: { value: "Housing" },
      });
      fireEvent.change(screen.getByLabelText("Tipo"), {
        target: { value: "expense" },
      });
      fireEvent.change(screen.getByLabelText("Conta"), {
        target: { value: "Checking Account" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStorage.saveTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: -1200,
            type: "expense",
            description: "Rent",
          }),
        );
      });
    });

    it("should handle shared transaction", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      // Fill form
      fireEvent.change(screen.getByLabelText("Descrição"), {
        target: { value: "Dinner" },
      });
      fireEvent.change(screen.getByLabelText("Valor"), {
        target: { value: "80" },
      });
      fireEvent.change(screen.getByLabelText("Categoria"), {
        target: { value: "Food" },
      });
      fireEvent.change(screen.getByLabelText("Tipo"), {
        target: { value: "shared" },
      });
      fireEvent.change(screen.getByLabelText("Conta"), {
        target: { value: "Credit Card" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStorage.saveTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: -80,
            type: "shared",
            description: "Dinner",
          }),
        );
      });
    });
  });

  describe("Save Operations", () => {
    it("should save new transaction successfully", async () => {
      const onSave = jest.fn();
      render(<EnhancedTransactionModal {...defaultProps} onSave={onSave} />);

      // Fill valid form
      fireEvent.change(screen.getByLabelText("Descrição"), {
        target: { value: "Test Transaction" },
      });
      fireEvent.change(screen.getByLabelText("Valor"), {
        target: { value: "100" },
      });
      fireEvent.change(screen.getByLabelText("Categoria"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByLabelText("Conta"), {
        target: { value: "Checking Account" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStorage.saveTransaction).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          "Transação salva com sucesso!",
        );
      });
    });

    it("should update existing transaction successfully", async () => {
      const onSave = jest.fn();
      render(
        <EnhancedTransactionModal
          {...defaultProps}
          editingTransaction={mockTransaction}
          onSave={onSave}
        />,
      );

      // Modify description
      const descriptionInput = screen.getByDisplayValue("Grocery shopping");
      fireEvent.change(descriptionInput, {
        target: { value: "Updated grocery shopping" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStorage.updateTransaction).toHaveBeenCalledWith(
          "1",
          expect.objectContaining({
            description: "Updated grocery shopping",
          }),
        );
        expect(onSave).toHaveBeenCalled();
        expect(mockToast.success).toHaveBeenCalledWith(
          "Transação atualizada com sucesso!",
        );
      });
    });

    it("should handle save errors", async () => {
      mockStorage.saveTransaction.mockReturnValue(false);

      render(<EnhancedTransactionModal {...defaultProps} />);

      // Fill valid form
      fireEvent.change(screen.getByLabelText("Descrição"), {
        target: { value: "Test Transaction" },
      });
      fireEvent.change(screen.getByLabelText("Valor"), {
        target: { value: "100" },
      });
      fireEvent.change(screen.getByLabelText("Categoria"), {
        target: { value: "Test" },
      });
      fireEvent.change(screen.getByLabelText("Conta"), {
        target: { value: "Checking Account" },
      });

      const saveButton = screen.getByText("Salvar");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          "Erro ao salvar transação",
        );
      });
    });
  });

  describe("Modal Controls", () => {
    it("should close modal when cancel button is clicked", () => {
      const onClose = jest.fn();
      render(<EnhancedTransactionModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText("Cancelar");
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should close modal when X button is clicked", () => {
      const onClose = jest.fn();
      render(<EnhancedTransactionModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText("Fechar modal");
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should close modal when clicking outside", () => {
      const onClose = jest.fn();
      render(<EnhancedTransactionModal {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByTestId("modal-overlay");
      fireEvent.click(overlay);

      expect(onClose).toHaveBeenCalled();
    });

    it("should handle escape key press", () => {
      const onClose = jest.fn();
      render(<EnhancedTransactionModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
      expect(screen.getByLabelText("Valor")).toBeInTheDocument();
      expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
      expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
      expect(screen.getByLabelText("Data")).toBeInTheDocument();
      expect(screen.getByLabelText("Conta")).toBeInTheDocument();
    });

    it("should focus first input when opened", () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");
      expect(document.activeElement).toBe(descriptionInput);
    });

    it("should trap focus within modal", () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");
      const saveButton = screen.getByText("Salvar");

      // Tab should cycle through modal elements
      descriptionInput.focus();
      fireEvent.keyDown(descriptionInput, { key: "Tab" });

      expect(document.activeElement).not.toBe(descriptionInput);
    });
  });

  describe("Performance", () => {
    it("should debounce category suggestions", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");

      // Rapid typing
      fireEvent.change(descriptionInput, { target: { value: "S" } });
      fireEvent.change(descriptionInput, { target: { value: "Su" } });
      fireEvent.change(descriptionInput, { target: { value: "Sup" } });
      fireEvent.change(descriptionInput, { target: { value: "Super" } });

      // Should only trigger suggestion after debounce
      await waitFor(
        () => {
          const categoryInput = screen.getByLabelText("Categoria");
          expect(categoryInput).toHaveValue("Food");
        },
        { timeout: 1000 },
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing accounts gracefully", () => {
      mockStorage.getAccounts.mockReturnValue([]);

      render(<EnhancedTransactionModal {...defaultProps} />);

      expect(screen.getByText("Nenhuma conta disponível")).toBeInTheDocument();
    });

    it("should handle very large amounts", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const amountInput = screen.getByLabelText("Valor");
      fireEvent.change(amountInput, { target: { value: "999999999.99" } });

      expect(amountInput).toHaveValue("999999999.99");
    });

    it("should handle special characters in description", async () => {
      render(<EnhancedTransactionModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText("Descrição");
      fireEvent.change(descriptionInput, {
        target: { value: "Café & Açúcar - R$ 10,50" },
      });

      expect(descriptionInput).toHaveValue("Café & Açúcar - R$ 10,50");
    });
  });
});
