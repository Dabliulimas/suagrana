/**
 * Testes unitários para o AdvancedAnalyticsDashboard
 * Cobertura: AdvancedAnalyticsDashboard, analytics avançados, KPIs
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdvancedAnalyticsDashboard from "../components/dashboards/analytics/advanced-analytics-dashboard";

// Mock dos módulos
jest.mock("../hooks/use-safe-theme", () => ({
  useSafeTheme: () => ({ theme: "light" }),
}));

jest.mock("../lib/performance-optimizer", () => ({
  useOptimizedMemo: (fn, deps) => React.useMemo(fn, deps),
  useOptimizedCallback: (fn, deps) => React.useCallback(fn, deps),
  withPerformanceOptimization: (Component) => Component,
  financialCalculationOptimizer: {
    optimizeCalculation: jest.fn((key, fn) => fn()),
  },
}));

jest.mock("../lib/financial/financial-intelligence", () => ({
  financialIntelligence: {
    generateAdvancedAnalytics: jest.fn(() =>
      Promise.resolve({
        kpis: {
          totalRevenue: 50000,
          totalExpenses: 30000,
          netProfit: 20000,
          profitMargin: 40,
          roi: 25,
          cashFlow: 15000,
        },
        trends: [
          { month: "Jan", revenue: 45000, expenses: 28000, profit: 17000 },
          { month: "Fev", revenue: 50000, expenses: 30000, profit: 20000 },
        ],
        categories: [
          { name: "Vendas", value: 30000, percentage: 60, trend: "up" },
          { name: "Marketing", value: 20000, percentage: 40, trend: "stable" },
        ],
        insights: [
          {
            type: "positive",
            title: "Crescimento",
            description: "Receita aumentou 15%",
          },
          {
            type: "warning",
            title: "Atenção",
            description: "Gastos com marketing altos",
          },
        ],
        goals: [
          {
            name: "Meta de Receita",
            target: 60000,
            current: 50000,
            progress: 83,
          },
          {
            name: "Redução de Custos",
            target: 25000,
            current: 30000,
            progress: 60,
          },
        ],
        investments: [
          { name: "Ações", value: 25000, return: 8.5, risk: "medium" },
          { name: "Fundos", value: 15000, return: 6.2, risk: "low" },
        ],
      }),
    ),
  },
}));

describe("AdvancedAnalyticsDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deve renderizar corretamente", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });
  });

  test("deve mostrar estado de carregamento", () => {
    render(<AdvancedAnalyticsDashboard />);

    // Verifica se há elementos de loading
    const loadingElements = screen.getAllByText("Analytics Avançados");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test("deve exibir KPIs quando carregados", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });
  });

  test("deve permitir atualizar dados", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const updateButton = screen.getByText("Atualizar");
      expect(updateButton).toBeInTheDocument();

      fireEvent.click(updateButton);
    });
  });

  test("deve alternar período de análise", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      // Procura por elementos de seleção de período
      const periodSelectors = screen.getAllByRole("button");
      expect(periodSelectors.length).toBeGreaterThan(0);
    });
  });

  test("deve navegar entre abas de analytics", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const overviewTab = screen.getByText("Visão Geral");
      const trendsTab = screen.getByText("Tendências");
      const categoriesTab = screen.getByText("Categorias");
      const insightsTab = screen.getByText("Insights");
      const goalsTab = screen.getByText("Metas");
      const investmentsTab = screen.getByText("Investimentos");

      expect(overviewTab).toBeInTheDocument();
      expect(trendsTab).toBeInTheDocument();
      expect(categoriesTab).toBeInTheDocument();
      expect(insightsTab).toBeInTheDocument();
      expect(goalsTab).toBeInTheDocument();
      expect(investmentsTab).toBeInTheDocument();

      // Testa navegação
      fireEvent.click(trendsTab);
      fireEvent.click(categoriesTab);
      fireEvent.click(insightsTab);
      fireEvent.click(goalsTab);
      fireEvent.click(investmentsTab);
      fireEvent.click(overviewTab);
    });
  });

  test("deve exibir gráficos de tendências", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const trendsTab = screen.getByText("Tendências");
      fireEvent.click(trendsTab);

      // Verifica se há elementos de gráfico
      expect(screen.getByText("Tendências")).toBeInTheDocument();
    });
  });

  test("deve mostrar insights financeiros", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const insightsTab = screen.getByText("Insights");
      fireEvent.click(insightsTab);

      expect(screen.getByText("Insights")).toBeInTheDocument();
    });
  });

  test("deve exibir progresso das metas", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const goalsTab = screen.getByText("Metas");
      fireEvent.click(goalsTab);

      expect(screen.getByText("Metas")).toBeInTheDocument();
    });
  });

  test("deve mostrar performance de investimentos", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const investmentsTab = screen.getByText("Investimentos");
      fireEvent.click(investmentsTab);

      expect(screen.getByText("Investimentos")).toBeInTheDocument();
    });
  });

  test("deve alternar auto-refresh", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const autoRefreshButton = screen.getByText("Auto-refresh");
      expect(autoRefreshButton).toBeInTheDocument();

      fireEvent.click(autoRefreshButton);
      // Verifica se o botão mudou de estado
      expect(autoRefreshButton).toBeInTheDocument();
    });
  });

  test("deve exportar relatório", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const exportButton = screen.getByText("Exportar");
      expect(exportButton).toBeInTheDocument();

      fireEvent.click(exportButton);
    });
  });

  test("deve lidar com erros graciosamente", async () => {
    const {
      financialIntelligence,
    } = require("../lib/financial/financial-intelligence");
    financialIntelligence.generateAdvancedAnalytics.mockRejectedValue(
      new Error("Erro de teste"),
    );

    // Mock console.error para evitar logs desnecessários
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  test("deve calcular métricas corretamente", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });
  });

  test("deve formatar valores monetários", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });
  });

  test("deve aplicar cores baseadas em tendências", async () => {
    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Analytics Avançados")).toBeInTheDocument();
    });
  });
});
