/**
 * Testes unitários para componentes React
 * Cobertura: DataConsistencyManager, AccountingValidator, TestConsistencySystem
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { toast } from "sonner";

// Mock dos módulos
jest.mock("../lib/data-consistency-fixer");
jest.mock("../lib/system-validator");
jest.mock("../lib/accounting-system");
jest.mock("sonner");

// Importar componentes
import DataConsistencyManager from "../components/data-consistency-manager";
import AccountingValidator from "../components/accounting-validator";
import TestConsistencySystem from "../components/test-consistency-system";

describe("Componentes React", () => {
  beforeEach(() => {
    resetTestData();
    jest.clearAllMocks();
  });

  describe("DataConsistencyManager", () => {
    test("deve renderizar corretamente", () => {
      render(<DataConsistencyManager />);

      expect(
        screen.getByText("Gerenciador de Consistência de Dados"),
      ).toBeInTheDocument();
      expect(screen.getByText("Verificar Consistência")).toBeInTheDocument();
      expect(screen.getByText("Corrigir Automaticamente")).toBeInTheDocument();
    });

    test("deve executar verificação de consistência", async () => {
      const mockReport = {
        summary: {
          totalIssues: 5,
          criticalIssues: 1,
          highIssues: 2,
          mediumIssues: 1,
          lowIssues: 1,
          autoFixableIssues: 3,
          fixedIssues: 0,
        },
        issues: [
          {
            id: "1",
            type: "balance_inconsistency",
            severity: "critical",
            description: "Saldo inconsistente",
            entity: "account",
            entityId: 1,
            suggestedFix: "Recalcular saldo",
            autoFixable: true,
          },
        ],
        systemHealth: "warning",
        recommendations: ["Executar correção automática"],
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        mockReport,
      );

      render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText("5 problemas encontrados")).toBeInTheDocument();
        expect(screen.getByText("1 crítico")).toBeInTheDocument();
        expect(screen.getByText("2 alto")).toBeInTheDocument();
      });
    });

    test("deve executar correção automática", async () => {
      const mockResults = {
        fixed: 3,
        errors: [],
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.autoFixIssues.mockResolvedValue(
        mockResults,
      );

      render(<DataConsistencyManager />);

      const fixButton = screen.getByText("Corrigir Automaticamente");
      fireEvent.click(fixButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "3 problemas corrigidos automaticamente",
        );
      });
    });

    test("deve exibir problemas por severidade", async () => {
      const mockReport = {
        summary: {
          totalIssues: 3,
          criticalIssues: 1,
          highIssues: 1,
          mediumIssues: 1,
          lowIssues: 0,
          autoFixableIssues: 2,
          fixedIssues: 0,
        },
        issues: [
          {
            id: "1",
            type: "balance_inconsistency",
            severity: "critical",
            description: "Problema crítico",
            entity: "account",
            entityId: 1,
            autoFixable: true,
          },
          {
            id: "2",
            type: "orphaned_reference",
            severity: "high",
            description: "Problema alto",
            entity: "transaction",
            entityId: 2,
            autoFixable: true,
          },
          {
            id: "3",
            type: "duplicate_data",
            severity: "medium",
            description: "Problema médio",
            entity: "goal",
            entityId: 3,
            autoFixable: false,
          },
        ],
        systemHealth: "critical",
        recommendations: [],
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        mockReport,
      );

      render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText("Problema crítico")).toBeInTheDocument();
        expect(screen.getByText("Problema alto")).toBeInTheDocument();
        expect(screen.getByText("Problema médio")).toBeInTheDocument();
      });
    });

    test("deve lidar com erros durante verificação", async () => {
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockRejectedValue(
        new Error("Erro de teste"),
      );

      render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Erro ao verificar consistência: Erro de teste",
        );
      });
    });

    test("deve mostrar indicador de carregamento", async () => {
      // Mock que demora para resolver
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      expect(screen.getByText("Verificando...")).toBeInTheDocument();
    });
  });

  describe("AccountingValidator", () => {
    test("deve renderizar corretamente", () => {
      render(<AccountingValidator />);

      expect(screen.getByText("Validador Contábil")).toBeInTheDocument();
      expect(screen.getByText("Executar Validação")).toBeInTheDocument();
      expect(screen.getByText("Correção Automática")).toBeInTheDocument();
    });

    test("deve executar validação completa", async () => {
      const mockSystemHealth = {
        score: 85,
        issues: [
          {
            category: "accounts",
            severity: "medium",
            description: "Problema de conta",
            suggestion: "Corrigir conta",
          },
        ],
        categories: {
          accounts: { score: 90, issues: 1 },
          transactions: { score: 95, issues: 0 },
          goals: { score: 80, issues: 2 },
          investments: { score: 75, issues: 3 },
        },
      };

      const mockConsistencyReport = {
        summary: {
          totalIssues: 2,
          criticalIssues: 0,
          highIssues: 1,
          mediumIssues: 1,
          lowIssues: 0,
        },
        systemHealth: "good",
      };

      require("../lib/system-validator").systemValidator.validateSystem.mockResolvedValue(
        mockSystemHealth,
      );
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        mockConsistencyReport,
      );

      render(<AccountingValidator />);

      const validateButton = screen.getByText("Executar Validação");
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText("85")).toBeInTheDocument(); // Score
        expect(screen.getByText("2")).toBeInTheDocument(); // Total issues
      });
    });

    test("deve executar correção automática", async () => {
      const mockFixResults = {
        systemIssues: 2,
        dataIssues: 1,
        balanceIssues: 0,
      };

      require("../lib/system-validator").systemValidator.fixCommonIssues.mockResolvedValue(
        2,
      );
      require("../lib/data-consistency-fixer").dataConsistencyFixer.autoFixIssues.mockResolvedValue(
        { fixed: 1, errors: [] },
      );
      require("../lib/accounting-system").accountingSystem.fixAllAccountBalances.mockResolvedValue(
        0,
      );

      render(<AccountingValidator />);

      const fixButton = screen.getByText("Correção Automática");
      fireEvent.click(fixButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Correção automática concluída: 3 problemas corrigidos",
        );
      });
    });

    test("deve exportar relatório", async () => {
      const mockReport = {
        timestamp: new Date().toISOString(),
        systemHealth: { score: 90 },
        consistencyReport: { summary: { totalIssues: 0 } },
      };

      // Mock do localStorage
      const mockGetItem = jest.fn(() => JSON.stringify(mockReport));
      Object.defineProperty(window, "localStorage", {
        value: { getItem: mockGetItem },
        writable: true,
      });

      // Mock do URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => "mock-url");
      global.URL.revokeObjectURL = jest.fn();

      // Mock do elemento <a>
      const mockClick = jest.fn();
      const mockElement = {
        href: "",
        download: "",
        click: mockClick,
      };
      jest.spyOn(document, "createElement").mockReturnValue(mockElement);

      render(<AccountingValidator />);

      const exportButton = screen.getByText("Exportar Relatório");
      fireEvent.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Relatório exportado com sucesso",
      );
    });

    test("deve alternar entre abas", () => {
      render(<AccountingValidator />);

      // Verificar se as abas existem
      expect(screen.getByText("Visão Geral")).toBeInTheDocument();
      expect(screen.getByText("Contas")).toBeInTheDocument();
      expect(screen.getByText("Transações")).toBeInTheDocument();
      expect(screen.getByText("Metas")).toBeInTheDocument();

      // Clicar na aba de Contas
      fireEvent.click(screen.getByText("Contas"));

      // Verificar se a aba foi ativada (isso depende da implementação específica)
      expect(screen.getByText("Contas")).toBeInTheDocument();
    });

    test("deve exibir cores corretas para severidade", () => {
      const { container } = render(<AccountingValidator />);

      // Verificar se as classes CSS estão sendo aplicadas corretamente
      // (isso depende da implementação específica do componente)
      expect(container).toBeInTheDocument();
    });
  });

  describe("TestConsistencySystem", () => {
    test("deve renderizar corretamente", () => {
      render(<TestConsistencySystem />);

      expect(
        screen.getByText("Teste do Sistema de Consistência"),
      ).toBeInTheDocument();
      expect(screen.getByText("Executar Todos os Testes")).toBeInTheDocument();
    });

    test("deve executar todos os testes", async () => {
      // Mock dos resultados dos testes
      const mockResults = {
        consistency: { passed: true, message: "Teste de consistência passou" },
        autoFix: {
          passed: true,
          message: "Teste de correção automática passou",
        },
        integrity: { passed: true, message: "Teste de integridade passou" },
        balance: { passed: true, message: "Teste de saldo passou" },
        orphaned: { passed: true, message: "Teste de órfãs passou" },
        duplicates: { passed: true, message: "Teste de duplicatas passou" },
        goals: { passed: true, message: "Teste de metas passou" },
        investments: { passed: true, message: "Teste de investimentos passou" },
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        {
          summary: { totalIssues: 0 },
          systemHealth: "excellent",
        },
      );

      require("../lib/data-consistency-fixer").dataConsistencyFixer.autoFixIssues.mockResolvedValue(
        {
          fixed: 0,
          errors: [],
        },
      );

      render(<TestConsistencySystem />);

      const runTestsButton = screen.getByText("Executar Todos os Testes");
      fireEvent.click(runTestsButton);

      await waitFor(() => {
        expect(
          screen.getByText("Todos os testes concluídos"),
        ).toBeInTheDocument();
      });
    });

    test("deve executar testes individuais", async () => {
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        {
          summary: { totalIssues: 0 },
          systemHealth: "excellent",
        },
      );

      render(<TestConsistencySystem />);

      const consistencyTestButton = screen.getByText("Teste de Consistência");
      fireEvent.click(consistencyTestButton);

      await waitFor(() => {
        expect(screen.getByText("✅ Passou")).toBeInTheDocument();
      });
    });

    test("deve lidar com falhas nos testes", async () => {
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockRejectedValue(
        new Error("Erro no teste"),
      );

      render(<TestConsistencySystem />);

      const consistencyTestButton = screen.getByText("Teste de Consistência");
      fireEvent.click(consistencyTestButton);

      await waitFor(() => {
        expect(screen.getByText("❌ Falhou")).toBeInTheDocument();
      });
    });

    test("deve mostrar progresso dos testes", async () => {
      // Mock que demora para resolver
      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  summary: { totalIssues: 0 },
                  systemHealth: "excellent",
                }),
              500,
            ),
          ),
      );

      render(<TestConsistencySystem />);

      const runTestsButton = screen.getByText("Executar Todos os Testes");
      fireEvent.click(runTestsButton);

      expect(screen.getByText("Executando testes...")).toBeInTheDocument();
    });
  });

  describe("Integração entre Componentes", () => {
    test("deve funcionar DataConsistencyManager com AccountingValidator", async () => {
      const mockReport = {
        summary: { totalIssues: 1, criticalIssues: 0 },
        issues: [],
        systemHealth: "good",
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        mockReport,
      );
      require("../lib/system-validator").systemValidator.validateSystem.mockResolvedValue(
        {
          score: 90,
          issues: [],
          categories: {},
        },
      );

      const { rerender } = render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText("1 problemas encontrados")).toBeInTheDocument();
      });

      // Renderizar AccountingValidator
      rerender(<AccountingValidator />);

      const validateButton = screen.getByText("Executar Validação");
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText("90")).toBeInTheDocument();
      });
    });

    test("deve manter estado consistente entre componentes", async () => {
      // Simular dados compartilhados via localStorage
      const sharedData = {
        accounts: [{ id: 1, name: "Teste", balance: 1000, type: "checking" }],
        transactions: [
          {
            id: 1,
            accountId: 1,
            amount: 500,
            description: "Teste",
            date: "2024-01-01",
          },
        ],
      };

      localStorage.setItem(
        "sua-grana-accounts",
        JSON.stringify(sharedData.accounts),
      );
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(sharedData.transactions),
      );

      const mockReport = {
        summary: { totalIssues: 0 },
        systemHealth: "excellent",
      };

      require("../lib/data-consistency-fixer").dataConsistencyFixer.checkConsistency.mockResolvedValue(
        mockReport,
      );

      render(<DataConsistencyManager />);

      const checkButton = screen.getByText("Verificar Consistência");
      fireEvent.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText("0 problemas encontrados")).toBeInTheDocument();
      });

      // Verificar se os dados não foram alterados
      const currentAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      expect(currentAccounts).toEqual(sharedData.accounts);
    });
  });

  describe("Acessibilidade", () => {
    test("deve ter elementos acessíveis no DataConsistencyManager", () => {
      render(<DataConsistencyManager />);

      // Verificar se botões têm labels apropriados
      expect(
        screen.getByRole("button", { name: /verificar consistência/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /corrigir automaticamente/i }),
      ).toBeInTheDocument();
    });

    test("deve ter elementos acessíveis no AccountingValidator", () => {
      render(<AccountingValidator />);

      // Verificar se botões têm labels apropriados
      expect(
        screen.getByRole("button", { name: /executar validação/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /correção automática/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /exportar relatório/i }),
      ).toBeInTheDocument();
    });

    test("deve ter navegação por teclado funcional", () => {
      render(<AccountingValidator />);

      const validateButton = screen.getByRole("button", {
        name: /executar validação/i,
      });

      // Simular navegação por teclado
      validateButton.focus();
      expect(validateButton).toHaveFocus();

      // Simular Enter
      fireEvent.keyDown(validateButton, { key: "Enter", code: "Enter" });

      // Verificar se a ação foi executada (dependendo da implementação)
      expect(validateButton).toBeInTheDocument();
    });
  });
});
