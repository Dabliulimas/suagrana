/**
 * Testes básicos para o componente FinancialDashboard
 */

const React = require("react");
const { render, screen } = require("@testing-library/react");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
require("@testing-library/jest-dom");

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

// Test wrapper with providers
const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children
  );
};

// Custom render function
const renderWithProviders = (ui, options) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options,
  });
};

// Mock básico do Next.js
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock dos hooks principais
jest.mock("@/hooks/use-optimized-financial-calculations", () => ({
  useOptimizedFinancialCalculations: () => ({
    totalIncome: 5000,
    totalExpenses: 3000,
    netIncome: 2000,
    accountsBalance: 15000,
    investmentsValue: 25000,
    goalsProgress: 65,
    monthlyTrend: "up",
    expensesByCategory: [],
  }),
}));

// Mock do sistema de performance
jest.mock("@/lib/performance-optimizer", () => ({
  useOptimizedMemo: jest.fn((fn) => fn()),
  useOptimizedCallback: jest.fn((fn) => fn),
  withPerformanceOptimization: jest.fn((Component) => Component),
  usePerformanceOptimization: () => ({ measureRender: jest.fn() }),
  financialCalculationOptimizer: {
    clearCache: jest.fn(),
    optimizeCalculation: jest.fn((key, fn) => fn()),
  },
}));

// Mock do storage
jest.mock("@/lib/storage", () => ({
  storage: {
    getTransactions: jest.fn(() => []),
    getAccounts: jest.fn(() => []),
    getGoals: jest.fn(() => []),
    getInvestments: jest.fn(() => []),
    getTrips: jest.fn(() => []),
  },
}));

// Mock dos outros hooks
jest.mock("@/hooks/use-performance-monitor", () => ({
  usePerformanceMonitor: () => ({ measureRender: jest.fn() }),
}));

jest.mock("@/contexts/ui/global-modal-context", () => ({
  useGlobalModal: () => ({
    openTransactionModal: jest.fn(),
    openSharedExpenseModal: jest.fn(),
    openInvestmentModal: jest.fn(),
    openGoalModal: jest.fn(),
    openTripModal: jest.fn(),
    openTransactionsListModal: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-safe-theme", () => ({
  useSafeTheme: () => ({
    settings: { colorfulIcons: true, theme: "light" },
  }),
}));

// Mock dos componentes UI básicos
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }) =>
    React.createElement("div", { "data-testid": "card" }, children),
  CardContent: ({ children }) => React.createElement("div", null, children),
  CardDescription: ({ children }) => React.createElement("div", null, children),
  CardHeader: ({ children }) => React.createElement("div", null, children),
  CardTitle: ({ children }) => React.createElement("h2", null, children),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }) =>
    React.createElement("span", { "data-testid": "badge" }, children),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }) =>
    React.createElement(
      "button",
      { onClick, "data-testid": "button" },
      children,
    ),
}));

jest.mock("@/components/ui/progress", () => ({
  Progress: ({ value }) =>
    React.createElement("div", {
      "data-testid": "progress",
      "data-value": value,
    }),
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }) =>
    React.createElement("div", { "data-testid": "tabs" }, children),
  TabsContent: ({ children }) =>
    React.createElement("div", { "data-testid": "tabs-content" }, children),
  TabsList: ({ children }) =>
    React.createElement("div", { "data-testid": "tabs-list" }, children),
  TabsTrigger: ({ children }) =>
    React.createElement("button", { "data-testid": "tabs-trigger" }, children),
}));

// Mock dos componentes lazy
jest.mock("@/components/lazy-components", () => ({
  FinancialChartsWithSuspense: () =>
    React.createElement("div", { "data-testid": "financial-charts" }, "Charts"),
}));

jest.mock("@/components/interactive-budget", () => ({
  InteractiveBudget: () =>
    React.createElement(
      "div",
      { "data-testid": "interactive-budget" },
      "Budget",
    ),
}));

jest.mock("@/components/optimization/virtualized-list", () => ({
  VirtualizedList: ({ items = [] }) => {
    return React.createElement(
      "div",
      { "data-testid": "virtualized-list" },
      `${items.length} items`,
    );
  },
}));

// Mock de ícones
jest.mock("lucide-react", () => ({
  TrendingUp: () =>
    React.createElement("div", { "data-testid": "trending-up-icon" }),
  TrendingDown: () =>
    React.createElement("div", { "data-testid": "trending-down-icon" }),
  DollarSign: () =>
    React.createElement("div", { "data-testid": "dollar-sign-icon" }),
  PiggyBank: () =>
    React.createElement("div", { "data-testid": "piggy-bank-icon" }),
  Target: () => React.createElement("div", { "data-testid": "target-icon" }),
  Plus: () => React.createElement("div", { "data-testid": "plus-icon" }),
}));

describe("FinancialDashboard", () => {
  let FinancialDashboard;

  beforeAll(() => {
    // Importar o componente após todos os mocks
    FinancialDashboard =
      require("@/components/dashboards/financial/financial-dashboard").default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar sem erros", () => {
      expect(() => {
        renderWithProviders(React.createElement(FinancialDashboard));
      }).not.toThrow();
    });

    it("deve renderizar elementos básicos", () => {
      renderWithProviders(React.createElement(FinancialDashboard));

      // Verifica se pelo menos um card foi renderizado
      const cards = screen.getAllByTestId("card");
      expect(cards.length).toBeGreaterThan(0);
    });

    it("deve renderizar sistema de tabs", () => {
      renderWithProviders(React.createElement(FinancialDashboard));

      expect(screen.getByTestId("tabs")).toBeInTheDocument();
    });
  });

  describe("Componentes Integrados", () => {
    it("deve renderizar gráficos financeiros", () => {
      renderWithProviders(React.createElement(FinancialDashboard));

      expect(screen.getByTestId("financial-charts")).toBeInTheDocument();
    });

    it("deve renderizar orçamento interativo", () => {
      renderWithProviders(React.createElement(FinancialDashboard));

      expect(screen.getByTestId("interactive-budget")).toBeInTheDocument();
    });
  });

  describe("Sistema de Otimização", () => {
    it("deve usar hooks de otimização", () => {
      const {
        useOptimizedMemo,
        useOptimizedCallback,
      } = require("@/lib/performance-optimizer");

      renderWithProviders(React.createElement(FinancialDashboard));

      expect(useOptimizedMemo).toHaveBeenCalled();
      expect(useOptimizedCallback).toHaveBeenCalled();
    });
  });
});
