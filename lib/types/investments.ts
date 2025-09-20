// Tipos para o Sistema Inteligente de Investimentos

export interface Broker {
  id: string;
  userId: string;
  name: string;
  logo?: string;
  color: string;
  isCustom: boolean; // true para corretoras personalizadas
  createdAt: Date;
  updatedAt: Date;
}

// Corretoras tradicionais pré-configuradas
export const DEFAULT_BROKERS: Omit<
  Broker,
  "id" | "userId" | "createdAt" | "updatedAt"
>[] = [
  { name: "XP Investimentos", color: "#FF6B35", isCustom: false },
  { name: "NuInvest", color: "#8A05BE", isCustom: false },
  { name: "Clear Corretora", color: "#00D4AA", isCustom: false },
  { name: "Modal Mais", color: "#1E3A8A", isCustom: false },
  { name: "BTG Pactual", color: "#FFD700", isCustom: false },
  { name: "Itaú Corretora", color: "#EC7000", isCustom: false },
  { name: "Rico Investimentos", color: "#0066CC", isCustom: false },
  { name: "Inter Invest", color: "#FF8C00", isCustom: false },
  { name: "Toro Investimentos", color: "#FF4444", isCustom: false },
  { name: "Avenue Securities", color: "#4A90E2", isCustom: false },
  { name: "C6 Bank", color: "#FFD23F", isCustom: false },
  { name: "Easynvest", color: "#00C851", isCustom: false },
];

export type AssetType =
  | "stock" // Ações
  | "fii" // Fundos Imobiliários
  | "etf" // ETFs
  | "crypto" // Criptomoedas
  | "fixed_income" // Renda Fixa
  | "fund" // Fundos de Investimento
  | "bdr" // BDRs
  | "option" // Opções
  | "future" // Futuros
  | "other"; // Outros

export type OperationType =
  | "buy"
  | "sell"
  | "dividend"
  | "jscp"
  | "bonus"
  | "split";

export type DividendType = "dividend" | "jscp" | "bonus" | "split";

export interface DividendOperation {
  id: string;
  investmentId: string;
  accountId: string; // Conta que recebeu o dividendo
  dividendType: DividendType;
  valuePerShare: number; // Valor por cota
  totalShares: number; // Quantidade de cotas na data
  totalValue: number; // Valor total recebido
  exDividendDate: Date; // Data ex-dividendo
  paymentDate: Date; // Data de pagamento
  notes?: string;
  createdAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  identifier: string; // Ticker, CNPJ, código
  name?: string; // Nome do ativo
  assetType: AssetType;
  brokerId: string;
  totalQuantity: number;
  averagePrice: number; // Preço médio ponderado
  totalInvested: number; // Valor total investido
  currentPrice?: number; // Cotação atual
  currentValue?: number; // Valor atual da posição
  profitLoss?: number; // Lucro/Prejuízo atual
  profitLossPercentage?: number; // % de lucro/prejuízo
  // Campos relacionados a dividendos
  totalDividendsReceived?: number; // Total de dividendos recebidos
  dividendYield?: number; // Yield de dividendos (%)
  lastDividendDate?: Date; // Data do último dividendo
  lastDividendValue?: number; // Valor do último dividendo
  status: "active" | "closed"; // Ativo ou zerado
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestmentOperation {
  id: string;
  investmentId: string;
  accountId: string; // Conta obrigatória para movimentação
  brokerId: string;
  operationType: OperationType;
  quantity: number;
  unitPrice: number;
  totalValue: number; // quantity * unitPrice
  fees: number; // Taxas e custos
  netValue: number; // Valor líquido (totalValue + fees para compra, totalValue - fees para venda)
  operationDate: Date;
  profitLoss?: number; // Apenas para vendas
  notes?: string;
  // Campos específicos para dividendos
  dividendType?: DividendType;
  valuePerShare?: number;
  exDividendDate?: Date;
  paymentDate?: Date;
  createdAt: Date;
}

// Interface para consolidação da carteira
export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  // Métricas de dividendos
  totalDividendsReceived: number;
  monthlyDividendIncome: number;
  averageYield: number;
  assetDistribution: {
    assetType: AssetType;
    value: number;
    percentage: number;
    count: number;
  }[];
  brokerDistribution: {
    brokerId: string;
    brokerName: string;
    value: number;
    percentage: number;
    count: number;
  }[];
}

// Interface para operações de compra
export interface BuyOperationData {
  investmentId?: string; // Se já existe o ativo
  identifier: string;
  name?: string;
  assetType: AssetType;
  brokerId: string;
  accountId: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  operationDate: Date;
  notes?: string;
}

// Interface para operações de venda
export interface SellOperationData {
  investmentId: string; // Obrigatório para venda
  accountId: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  operationDate: Date;
  notes?: string;
}

export interface DividendOperationData {
  investmentId: string;
  accountId: string; // Conta que receberá o dividendo
  dividendType: DividendType;
  valuePerShare: number;
  exDividendDate: Date;
  paymentDate: Date;
  notes?: string;
}

export interface RebalancingTarget {
  assetType: AssetType;
  currentPercentage: number;
  targetPercentage: number;
  currentValue: number;
  targetValue: number;
  difference: number;
  action: "buy" | "sell" | "hold";
}

export interface RebalancingSuggestion {
  investmentId: string;
  identifier: string;
  action: "buy" | "sell";
  currentValue: number;
  suggestedValue: number;
  difference: number;
  priority: "high" | "medium" | "low";
  reason: string;
}

// Interface para resultado de operação
export interface OperationResult {
  success: boolean;
  message: string;
  investment?: Investment;
  operation?: InvestmentOperation;
  accountMovement?: {
    accountId: string;
    amount: number;
    type: "debit" | "credit";
  };
}

// Interface para filtros de investimentos
export interface InvestmentFilters {
  assetType?: AssetType;
  brokerId?: string;
  status?: "active" | "closed" | "all";
  searchTerm?: string;
}

// Interface para relatórios
export interface InvestmentReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: PortfolioSummary;
  topPerformers: {
    investment: Investment;
    profitLossPercentage: number;
  }[];
  worstPerformers: {
    investment: Investment;
    profitLossPercentage: number;
  }[];
  recentOperations: InvestmentOperation[];
  monthlyEvolution: {
    month: string;
    invested: number;
    value: number;
    profitLoss: number;
  }[];
}

// Utilitários para cálculos
export interface PriceCalculation {
  newAveragePrice: number;
  newTotalQuantity: number;
  newTotalInvested: number;
}

export interface SaleCalculation {
  profitLoss: number;
  remainingQuantity: number;
  netValue: number;
}
