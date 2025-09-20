import {
  Investment,
  PriceCalculation,
  SaleCalculation,
  BuyOperationData,
  SellOperationData,
  AssetType,
} from "../types/investments";

/**
 * Calcula o novo preço médio ponderado após uma compra
 */
export function calculateNewAveragePrice(
  currentInvestment: Investment | null,
  buyData: BuyOperationData,
): PriceCalculation {
  if (!currentInvestment) {
    // Primeira compra do ativo
    const totalCost = buyData.quantity * buyData.unitPrice + buyData.fees;
    return {
      newAveragePrice: totalCost / buyData.quantity,
      newTotalQuantity: buyData.quantity,
      newTotalInvested: totalCost,
    };
  }

  // Compra adicional - recalcula preço médio ponderado
  const currentTotalCost = currentInvestment.totalInvested;
  const newOperationCost = buyData.quantity * buyData.unitPrice + buyData.fees;
  const totalCost = currentTotalCost + newOperationCost;
  const totalQuantity = currentInvestment.totalQuantity + buyData.quantity;

  return {
    newAveragePrice: totalCost / totalQuantity,
    newTotalQuantity: totalQuantity,
    newTotalInvested: totalCost,
  };
}

/**
 * Calcula o resultado de uma venda
 */
export function calculateSaleResult(
  investment: Investment,
  sellData: SellOperationData,
): SaleCalculation {
  if (sellData.quantity > investment.totalQuantity) {
    throw new Error("Quantidade de venda maior que a posição atual");
  }

  // Valor bruto da venda
  const grossValue = sellData.quantity * sellData.unitPrice;

  // Valor líquido (descontando taxas)
  const netValue = grossValue - sellData.fees;

  // Custo médio da quantidade vendida
  const averageCost = investment.averagePrice * sellData.quantity;

  // Lucro ou prejuízo
  const profitLoss = netValue - averageCost;

  // Quantidade restante
  const remainingQuantity = investment.totalQuantity - sellData.quantity;

  return {
    profitLoss,
    remainingQuantity,
    netValue,
  };
}

/**
 * Calcula o valor atual de uma posição
 */
export function calculateCurrentValue(
  investment: Investment,
  currentPrice?: number,
): { currentValue: number; profitLoss: number; profitLossPercentage: number };
export function calculateCurrentValue(investment: Investment): number;
export function calculateCurrentValue(
  investment: Investment,
  currentPrice?: number,
):
  | { currentValue: number; profitLoss: number; profitLossPercentage: number }
  | number {
  // Se apenas um parâmetro for passado, retorna apenas o valor atual
  if (arguments.length === 1) {
    if (investment.currentValue !== undefined) {
      return investment.currentValue;
    }
    if (investment.currentPrice && investment.totalQuantity > 0) {
      return investment.totalQuantity * investment.currentPrice;
    }
    return investment.totalInvested; // Fallback para valor investido
  }

  // Comportamento original com dois parâmetros
  if (!currentPrice || investment.totalQuantity === 0) {
    return {
      currentValue: investment.currentValue || 0,
      profitLoss: investment.profitLoss || 0,
      profitLossPercentage: investment.profitLossPercentage || 0,
    };
  }

  const currentValue = investment.totalQuantity * currentPrice;
  const profitLoss = currentValue - investment.totalInvested;
  const profitLossPercentage = (profitLoss / investment.totalInvested) * 100;

  return {
    currentValue,
    profitLoss,
    profitLossPercentage,
  };
}

/**
 * Valida se uma operação de compra é válida
 */
export function validateBuyOperation(
  buyData: BuyOperationData,
  accountBalance: number,
): { isValid: boolean; error?: string } {
  const totalCost = buyData.quantity * buyData.unitPrice + buyData.fees;

  if (buyData.quantity <= 0) {
    return { isValid: false, error: "Quantidade deve ser maior que zero" };
  }

  if (buyData.unitPrice <= 0) {
    return { isValid: false, error: "Preço unitário deve ser maior que zero" };
  }

  if (buyData.fees < 0) {
    return { isValid: false, error: "Taxas não podem ser negativas" };
  }

  if (totalCost > accountBalance) {
    return {
      isValid: false,
      error: `Saldo insuficiente. Necessário: R$ ${totalCost.toFixed(2)}, Disponível: R$ ${accountBalance.toFixed(2)}`,
    };
  }

  return { isValid: true };
}

/**
 * Valida se uma operação de venda é válida
 */
export function validateSellOperation(
  sellData: SellOperationData,
  investment: Investment,
): { isValid: boolean; error?: string } {
  if (sellData.quantity <= 0) {
    return { isValid: false, error: "Quantidade deve ser maior que zero" };
  }

  if (sellData.unitPrice <= 0) {
    return { isValid: false, error: "Preço unitário deve ser maior que zero" };
  }

  if (sellData.fees < 0) {
    return { isValid: false, error: "Taxas não podem ser negativas" };
  }

  if (sellData.quantity > investment.totalQuantity) {
    return {
      isValid: false,
      error: `Quantidade insuficiente. Disponível: ${investment.totalQuantity}, Solicitado: ${sellData.quantity}`,
    };
  }

  return { isValid: true };
}

/**
 * Formata valores monetários para exibição
 */
export function formatCurrency(
  value: number,
  compact: boolean = false,
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: compact ? "compact" : "standard",
    compactDisplay: compact ? "short" : undefined,
  }).format(value);
}

/**
 * Formata percentuais para exibição
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Calcula a distribuição percentual de ativos
 */
export function calculateAssetDistribution(investments: Investment[]): {
  assetType: AssetType;
  value: number;
  percentage: number;
  count: number;
}[] {
  const totalValue = investments.reduce((sum, inv) => {
    const currentValue = inv.currentValue || inv.totalInvested;
    return sum + currentValue;
  }, 0);

  if (totalValue === 0) return [];

  const distribution = investments.reduce(
    (acc, inv) => {
      const currentValue = inv.currentValue || inv.totalInvested;
      const existing = acc.find((item) => item.assetType === inv.assetType);

      if (existing) {
        existing.value += currentValue;
        existing.count += 1;
      } else {
        acc.push({
          assetType: inv.assetType,
          value: currentValue,
          percentage: 0,
          count: 1,
        });
      }

      return acc;
    },
    [] as {
      assetType: AssetType;
      value: number;
      percentage: number;
      count: number;
    }[],
  );

  // Calcula percentuais
  distribution.forEach((item) => {
    item.percentage = (item.value / totalValue) * 100;
  });

  return distribution.sort((a, b) => b.value - a.value);
}

/**
 * Calcula métricas de performance
 */
export function calculatePerformanceMetrics(investments: Investment[]) {
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.totalInvested,
    0,
  );
  const totalCurrentValue = investments.reduce((sum, inv) => {
    return sum + (inv.currentValue || inv.totalInvested);
  }, 0);

  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercentage =
    totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const activeInvestments = investments.filter(
    (inv) => inv.status === "active",
  );
  const closedInvestments = investments.filter(
    (inv) => inv.status === "closed",
  );

  return {
    totalInvested,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercentage,
    activeCount: activeInvestments.length,
    closedCount: closedInvestments.length,
    totalCount: investments.length,
  };
}
