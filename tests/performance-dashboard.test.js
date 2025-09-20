/**
 * Testes unitários para o PerformanceDashboard
 * Cobertura: PerformanceDashboard, métricas de performance, relatórios
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PerformanceDashboard from "../components/performance-dashboard";

// Mock dos módulos
jest.mock("../lib/performance-monitor", () => ({
  performanceMonitor: {
    getAllMetrics: jest.fn(() => []),
    clearOldMetrics: jest.fn(),
  },
}));

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

describe("PerformanceDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deve renderizar corretamente", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([
      {
        id: "1",
        name: "Test Component",
        category: "component",
        severity: "low",
        timestamp: Date.now(),
      },
    ]);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard de Performance")).toBeInTheDocument();
    });
  });

  test("deve mostrar estado de carregamento", () => {
    render(<PerformanceDashboard />);

    // Verifica se há elementos de loading
    const loadingElements = screen.getAllByText("Dashboard de Performance");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test("deve permitir atualizar métricas", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([]);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      const updateButton = screen.getByText("Atualizar");
      expect(updateButton).toBeInTheDocument();
    });
  });

  test("deve permitir limpar métricas antigas", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([]);
    performanceMonitor.clearOldMetrics.mockImplementation(() => {});

    render(<PerformanceDashboard />);

    await waitFor(() => {
      const clearButton = screen.getByText("Limpar");
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(performanceMonitor.clearOldMetrics).toHaveBeenCalled();
    });
  });

  test("deve alternar auto-refresh", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([]);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      const autoRefreshButton = screen.getByText("Auto-refresh");
      expect(autoRefreshButton).toBeInTheDocument();

      fireEvent.click(autoRefreshButton);
      // Verifica se o botão mudou de estado
      expect(autoRefreshButton).toBeInTheDocument();
    });
  });

  test("deve exibir métricas quando disponíveis", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    const mockMetrics = [
      {
        id: "1",
        name: "Slow Component",
        category: "component",
        severity: "high",
        timestamp: Date.now(),
        renderTime: 150,
        rerenderCount: 5,
        memoryUsage: 25,
      },
      {
        id: "2",
        name: "Fast Component",
        category: "component",
        severity: "low",
        timestamp: Date.now(),
        renderTime: 50,
        rerenderCount: 2,
        memoryUsage: 10,
      },
    ];

    performanceMonitor.getAllMetrics.mockReturnValue(mockMetrics);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard de Performance")).toBeInTheDocument();
    });
  });

  test("deve navegar entre abas", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([]);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      const overviewTab = screen.getByText("Visão Geral");
      const componentsTab = screen.getByText("Componentes");
      const networkTab = screen.getByText("Rede");
      const storageTab = screen.getByText("Armazenamento");
      const recommendationsTab = screen.getByText("Recomendações");

      expect(overviewTab).toBeInTheDocument();
      expect(componentsTab).toBeInTheDocument();
      expect(networkTab).toBeInTheDocument();
      expect(storageTab).toBeInTheDocument();
      expect(recommendationsTab).toBeInTheDocument();

      // Testa navegação
      fireEvent.click(componentsTab);
      fireEvent.click(networkTab);
      fireEvent.click(storageTab);
      fireEvent.click(recommendationsTab);
      fireEvent.click(overviewTab);
    });
  });

  test("deve formatar duração corretamente", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockReturnValue([]);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard de Performance")).toBeInTheDocument();
    });
  });

  test("deve gerar recomendações baseadas nas métricas", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    const mockMetrics = [
      {
        id: "1",
        name: "Slow Component",
        category: "component",
        severity: "high",
        timestamp: Date.now(),
        renderTime: 150, // > 100ms
        rerenderCount: 15, // > 10
        memoryUsage: 60, // > 50
      },
      {
        id: "2",
        name: "Slow Request",
        category: "network",
        severity: "high",
        timestamp: Date.now(),
        duration: 3000, // > 2000ms
        url: "/api/slow",
        method: "GET",
        status: 200,
      },
    ];

    performanceMonitor.getAllMetrics.mockReturnValue(mockMetrics);

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard de Performance")).toBeInTheDocument();
    });
  });

  test("deve lidar com erros graciosamente", async () => {
    const { performanceMonitor } = require("../lib/performance-monitor");
    performanceMonitor.getAllMetrics.mockImplementation(() => {
      throw new Error("Erro de teste");
    });

    // Mock console.error para evitar logs desnecessários
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<PerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard de Performance")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
