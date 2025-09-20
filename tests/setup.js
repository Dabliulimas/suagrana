/**
 * Configuração global para testes automatizados
 * Framework de testes para o sistema SuaGrana
 */

// Configuração do ambiente de teste
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_APP_ENV = "test";

// Mock do localStorage para ambiente Node.js
global.localStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
  get length() {
    return Object.keys(this.data).length;
  },
  key: function (index) {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  },
};

// Mock do sessionStorage
global.sessionStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
  get length() {
    return Object.keys(this.data).length;
  },
  key: function (index) {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  },
};

// Mock do window object
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  location: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
  },
  navigator: {
    userAgent: "test-agent",
  },
  document: {
    createElement: () => ({
      href: "",
      click: () => {},
      remove: () => {},
    }),
    body: {
      appendChild: () => {},
      removeChild: () => {},
    },
  },
  URL: {
    createObjectURL: () => "blob:test-url",
    revokeObjectURL: () => {},
  },
};

// Mock do console para testes silenciosos
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: process.env.VERBOSE_TESTS ? originalConsole.log : () => {},
  info: process.env.VERBOSE_TESTS ? originalConsole.info : () => {},
  warn: originalConsole.warn,
  error: originalConsole.error,
};

// Mock de funções de toast
global.mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};

// Dados de teste padrão
global.testData = {
  accounts: [
    {
      id: 1,
      name: "Conta Corrente",
      balance: 1500.0,
      type: "checking",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      name: "Poupança",
      balance: 5000.0,
      type: "savings",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: 3,
      name: "Cartão de Crédito",
      balance: -800.0,
      type: "credit",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  transactions: [
    {
      id: 1,
      accountId: 1,
      amount: -50.0,
      description: "Supermercado",
      category: "alimentacao",
      date: "2024-01-15T00:00:00.000Z",
      type: "expense",
    },
    {
      id: 2,
      accountId: 1,
      amount: 2000.0,
      description: "Salário",
      category: "salario",
      date: "2024-01-01T00:00:00.000Z",
      type: "income",
    },
    {
      id: 3,
      accountId: 2,
      amount: 100.0,
      description: "Transferência",
      category: "transferencia",
      date: "2024-01-10T00:00:00.000Z",
      type: "transfer",
    },
  ],
  goals: [
    {
      id: 1,
      name: "Viagem Europa",
      targetAmount: 10000,
      currentAmount: 2500,
      deadline: "2024-12-31",
      category: "viagem",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: 2,
      name: "Emergência",
      targetAmount: 5000,
      currentAmount: 5000,
      deadline: "2024-06-30",
      category: "emergencia",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
  ],
  investments: [
    {
      id: 1,
      name: "Tesouro Direto",
      amount: 15000,
      type: "government_bond",
      yield: 0.12,
      purchaseDate: "2024-01-01",
      maturityDate: "2026-01-01",
    },
    {
      id: 2,
      name: "Ações PETR4",
      amount: 8000,
      type: "stock",
      yield: 0.08,
      purchaseDate: "2024-01-15",
      quantity: 100,
    },
  ],
  trips: [
    {
      id: 1,
      name: "Férias Bahia",
      startDate: "2024-07-01",
      endDate: "2024-07-15",
      budget: 3000,
      spent: 0,
      status: "planned",
    },
  ],
};

// Função para resetar dados de teste
global.resetTestData = () => {
  localStorage.clear();
  sessionStorage.clear();

  // Carregar dados de teste padrão
  localStorage.setItem("sua-grana-accounts", JSON.stringify(testData.accounts));
  localStorage.setItem(
    "sua-grana-transactions",
    JSON.stringify(testData.transactions),
  );
  localStorage.setItem("sua-grana-goals", JSON.stringify(testData.goals));
  localStorage.setItem(
    "sua-grana-investments",
    JSON.stringify(testData.investments),
  );
  localStorage.setItem("sua-grana-trips", JSON.stringify(testData.trips));
};

// Função para criar dados de teste customizados
global.createTestData = (type, data) => {
  const key = `sua-grana-${type}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  if (typeof window === "undefined") return;
  if (typeof window === "undefined") return;
  if (typeof window === "undefined") return;
  if (typeof window === "undefined") return;
  const newData = Array.isArray(data) ? data : [data];
  localStorage.setItem(key, JSON.stringify([...existing, ...newData]));
};

// Função para limpar dados de teste
global.clearTestData = (type) => {
  if (type) {
    localStorage.removeItem(`sua-grana-${type}`);
  } else {
    localStorage.clear();
  }
};

// Utilitários de teste
global.testUtils = {
  // Gerar ID único para testes
  generateId: () => Math.floor(Math.random() * 1000000),

  // Gerar data aleatória
  generateDate: (daysFromNow = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  },

  // Gerar valor monetário aleatório
  generateAmount: (min = -1000, max = 1000) => {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  },

  // Aguardar tempo específico
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Verificar se objeto tem propriedades específicas
  hasProperties: (obj, properties) => {
    return properties.every((prop) => obj.hasOwnProperty(prop));
  },

  // Comparar objetos ignorando propriedades específicas
  compareObjects: (obj1, obj2, ignoreProps = []) => {
    const clean1 = { ...obj1 };
    const clean2 = { ...obj2 };

    ignoreProps.forEach((prop) => {
      delete clean1[prop];
      delete clean2[prop];
    });

    return JSON.stringify(clean1) === JSON.stringify(clean2);
  },
};

// Configuração de timeouts para testes
jest.setTimeout(30000); // 30 segundos

// Hook para executar antes de cada teste
beforeEach(() => {
  resetTestData();
  jest.clearAllMocks();
});

// Hook para executar após cada teste
afterEach(() => {
  clearTestData();
});

// Configuração de matchers customizados
expect.extend({
  toBeValidAmount(received) {
    const pass =
      typeof received === "number" && !isNaN(received) && isFinite(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid amount`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid amount`,
        pass: false,
      };
    }
  },

  toBeValidDate(received) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toHaveValidStructure(received, expectedStructure) {
    const hasAllProps = Object.keys(expectedStructure).every((key) =>
      received.hasOwnProperty(key),
    );

    if (hasAllProps) {
      return {
        message: () => `expected object not to have valid structure`,
        pass: true,
      };
    } else {
      const missingProps = Object.keys(expectedStructure).filter(
        (key) => !received.hasOwnProperty(key),
      );
      return {
        message: () =>
          `expected object to have properties: ${missingProps.join(", ")}`,
        pass: false,
      };
    }
  },
});

console.log("🧪 Ambiente de testes configurado com sucesso!");
