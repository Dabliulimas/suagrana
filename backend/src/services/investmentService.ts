import { PrismaClient, InvestmentType } from "@prisma/client";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from "../middleware/errorHandler";
import { logger, loggerUtils } from "../utils/logger";

const prisma = new PrismaClient();

export interface CreateInvestmentData {
  symbol: string;
  name: string;
  type: InvestmentType;
  sector?: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  notes?: string;
}

export interface UpdateInvestmentData {
  name?: string;
  type?: InvestmentType;
  sector?: string;
  quantity?: number;
  averagePrice?: number;
  currentPrice?: number;
  notes?: string;
}

export interface CreateDividendData {
  investmentId: string;
  amount: number;
  paymentDate: Date;
  exDividendDate?: Date;
  type?: string;
  notes?: string;
}

export interface InvestmentWithMetrics {
  id: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  sector?: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Métricas calculadas
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  totalDividends: number;
  dividendYield: number;
  lastDividendDate?: Date;
}

export interface DividendWithInvestment {
  id: string;
  amount: number;
  paymentDate: Date;
  exDividendDate?: Date;
  type?: string;
  notes?: string;
  createdAt: Date;
  investment: {
    id: string;
    symbol: string;
    name: string;
    type: InvestmentType;
  };
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalDividends: number;
  totalDividendYield: number;
  totalInvestments: number;
  allocationByType: Array<{
    type: InvestmentType;
    count: number;
    totalInvested: number;
    currentValue: number;
    percentage: number;
    gainLoss: number;
    gainLossPercentage: number;
  }>;
  allocationBySector: Array<{
    sector: string;
    count: number;
    totalInvested: number;
    currentValue: number;
    percentage: number;
    gainLoss: number;
    gainLossPercentage: number;
  }>;
  topPerformers: Array<{
    symbol: string;
    name: string;
    gainLossPercentage: number;
    gainLoss: number;
  }>;
  worstPerformers: Array<{
    symbol: string;
    name: string;
    gainLossPercentage: number;
    gainLoss: number;
  }>;
}

export interface InvestmentFilters {
  type?: InvestmentType;
  sector?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
  minGainLoss?: number;
  maxGainLoss?: number;
}

class InvestmentService {
  /**
   * Lista investimentos com filtros e métricas
   */
  async getInvestments(
    userId: string,
    filters: InvestmentFilters = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {},
  ): Promise<{
    investments: InvestmentWithMetrics[];
    portfolio: PortfolioSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        type,
        sector,
        search,
        minValue,
        maxValue,
        minGainLoss,
        maxGainLoss,
      } = filters;
      const {
        page = 1,
        limit = 20,
        sortBy = "symbol",
        sortOrder = "asc",
      } = pagination;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = { userId };

      if (type) where.type = type;
      if (sector) where.sector = { contains: sector, mode: "insensitive" };
      if (search) {
        where.OR = [
          { symbol: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ];
      }

      // Buscar investimentos
      const [investments, totalCount] = await Promise.all([
        prisma.investment.findMany({
          where,
          include: {
            dividends: {
              select: {
                amount: true,
                paymentDate: true,
              },
            },
          },
          skip,
          take: limit,
        }),
        prisma.investment.count({ where }),
      ]);

      // Calcular métricas para cada investimento
      const investmentsWithMetrics: InvestmentWithMetrics[] = investments.map(
        (investment) => {
          const metrics = this.calculateInvestmentMetrics(
            investment,
            investment.dividends,
          );
          return metrics;
        },
      );

      // Aplicar filtros baseados em métricas calculadas
      let filteredInvestments = investmentsWithMetrics;

      if (minValue !== undefined || maxValue !== undefined) {
        filteredInvestments = filteredInvestments.filter((inv) => {
          if (minValue !== undefined && inv.currentValue < minValue)
            return false;
          if (maxValue !== undefined && inv.currentValue > maxValue)
            return false;
          return true;
        });
      }

      if (minGainLoss !== undefined || maxGainLoss !== undefined) {
        filteredInvestments = filteredInvestments.filter((inv) => {
          if (minGainLoss !== undefined && inv.gainLossPercentage < minGainLoss)
            return false;
          if (maxGainLoss !== undefined && inv.gainLossPercentage > maxGainLoss)
            return false;
          return true;
        });
      }

      // Ordenar
      filteredInvestments.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case "currentValue":
            aValue = a.currentValue;
            bValue = b.currentValue;
            break;
          case "gainLoss":
            aValue = a.gainLoss;
            bValue = b.gainLoss;
            break;
          case "gainLossPercentage":
            aValue = a.gainLossPercentage;
            bValue = b.gainLossPercentage;
            break;
          case "totalDividends":
            aValue = a.totalDividends;
            bValue = b.totalDividends;
            break;
          default:
            aValue = a.symbol;
            bValue = b.symbol;
        }

        if (typeof aValue === "string") {
          return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      });

      // Buscar todos os investimentos para o resumo da carteira
      const allInvestments = await prisma.investment.findMany({
        where: { userId },
        include: {
          dividends: {
            select: {
              amount: true,
              paymentDate: true,
            },
          },
        },
      });

      const portfolio = this.calculatePortfolioSummary(allInvestments);

      return {
        investments: filteredInvestments,
        portfolio,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Get investments failed", {
        userId,
        filters,
        pagination,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém um investimento específico com métricas
   */
  async getInvestmentById(
    userId: string,
    investmentId: string,
  ): Promise<
    InvestmentWithMetrics & {
      dividends: DividendWithInvestment[];
    }
  > {
    try {
      const investment = await prisma.investment.findFirst({
        where: { id: investmentId, userId },
        include: {
          dividends: {
            orderBy: { paymentDate: "desc" },
            include: {
              investment: {
                select: {
                  id: true,
                  symbol: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!investment) {
        throw new NotFoundError("Investimento não encontrado");
      }

      const metrics = this.calculateInvestmentMetrics(
        investment,
        investment.dividends,
      );

      const dividends: DividendWithInvestment[] = investment.dividends.map(
        (dividend) => ({
          id: dividend.id,
          amount: Number(dividend.amount),
          paymentDate: dividend.paymentDate,
          exDividendDate: dividend.exDividendDate || undefined,
          type: dividend.type || undefined,
          notes: dividend.notes || undefined,
          createdAt: dividend.createdAt,
          investment: dividend.investment,
        }),
      );

      return {
        ...metrics,
        dividends,
      };
    } catch (error) {
      logger.error("Get investment by ID failed", {
        userId,
        investmentId,
        error,
      });
      throw error;
    }
  }

  /**
   * Cria um novo investimento
   */
  async createInvestment(
    userId: string,
    data: CreateInvestmentData,
  ): Promise<InvestmentWithMetrics> {
    try {
      const {
        symbol,
        name,
        type,
        sector,
        quantity,
        averagePrice,
        currentPrice,
        notes,
      } = data;

      // Validações
      if (quantity <= 0) {
        throw new ValidationError("A quantidade deve ser maior que zero");
      }

      if (averagePrice <= 0) {
        throw new ValidationError("O preço médio deve ser maior que zero");
      }

      if (currentPrice !== undefined && currentPrice < 0) {
        throw new ValidationError("O preço atual não pode ser negativo");
      }

      // Verificar se já existe um investimento com o mesmo símbolo
      const existingInvestment = await prisma.investment.findFirst({
        where: { userId, symbol: symbol.toUpperCase() },
      });

      if (existingInvestment) {
        throw new ConflictError("Já existe um investimento com este símbolo");
      }

      const investment = await prisma.investment.create({
        data: {
          userId,
          symbol: symbol.toUpperCase(),
          name: name.trim(),
          type,
          sector: sector?.trim() || null,
          quantity,
          averagePrice,
          currentPrice: currentPrice || averagePrice,
          notes: notes?.trim() || null,
        },
      });

      loggerUtils.logFinancial("Investment created", {
        userId,
        investmentId: investment.id,
        symbol: investment.symbol,
        type,
        quantity,
        averagePrice,
      });

      return this.calculateInvestmentMetrics(investment, []);
    } catch (error) {
      logger.error("Create investment failed", { userId, data, error });
      throw error;
    }
  }

  /**
   * Atualiza um investimento
   */
  async updateInvestment(
    userId: string,
    investmentId: string,
    data: UpdateInvestmentData,
  ): Promise<InvestmentWithMetrics> {
    try {
      // Verificar se o investimento existe e pertence ao usuário
      const existingInvestment = await prisma.investment.findFirst({
        where: { id: investmentId, userId },
      });

      if (!existingInvestment) {
        throw new NotFoundError("Investimento não encontrado");
      }

      const {
        name,
        type,
        sector,
        quantity,
        averagePrice,
        currentPrice,
        notes,
      } = data;

      const updateData: any = { updatedAt: new Date() };

      if (name !== undefined) {
        updateData.name = name.trim();
      }

      if (type !== undefined) {
        updateData.type = type;
      }

      if (sector !== undefined) {
        updateData.sector = sector?.trim() || null;
      }

      if (quantity !== undefined) {
        if (quantity <= 0) {
          throw new ValidationError("A quantidade deve ser maior que zero");
        }
        updateData.quantity = quantity;
      }

      if (averagePrice !== undefined) {
        if (averagePrice <= 0) {
          throw new ValidationError("O preço médio deve ser maior que zero");
        }
        updateData.averagePrice = averagePrice;
      }

      if (currentPrice !== undefined) {
        if (currentPrice < 0) {
          throw new ValidationError("O preço atual não pode ser negativo");
        }
        updateData.currentPrice = currentPrice;
      }

      if (notes !== undefined) {
        updateData.notes = notes?.trim() || null;
      }

      const updatedInvestment = await prisma.investment.update({
        where: { id: investmentId },
        data: updateData,
        include: {
          dividends: {
            select: {
              amount: true,
              paymentDate: true,
            },
          },
        },
      });

      loggerUtils.logFinancial("Investment updated", {
        userId,
        investmentId,
        updatedFields: Object.keys(updateData),
        symbol: updatedInvestment.symbol,
      });

      return this.calculateInvestmentMetrics(
        updatedInvestment,
        updatedInvestment.dividends,
      );
    } catch (error) {
      logger.error("Update investment failed", {
        userId,
        investmentId,
        data,
        error,
      });
      throw error;
    }
  }

  /**
   * Deleta um investimento
   */
  async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    try {
      // Verificar se o investimento existe e pertence ao usuário
      const investment = await prisma.investment.findFirst({
        where: { id: investmentId, userId },
      });

      if (!investment) {
        throw new NotFoundError("Investimento não encontrado");
      }

      // Deletar em uma transação (cascata para dividendos)
      await prisma.$transaction(async (tx) => {
        // Deletar dividendos primeiro
        await tx.dividend.deleteMany({
          where: { investmentId },
        });

        // Deletar o investimento
        await tx.investment.delete({
          where: { id: investmentId },
        });
      });

      loggerUtils.logFinancial("Investment deleted", {
        userId,
        investmentId,
        symbol: investment.symbol,
      });
    } catch (error) {
      logger.error("Delete investment failed", { userId, investmentId, error });
      throw error;
    }
  }

  /**
   * Adiciona um dividendo a um investimento
   */
  async addDividend(
    userId: string,
    data: CreateDividendData,
  ): Promise<DividendWithInvestment> {
    try {
      const { investmentId, amount, paymentDate, exDividendDate, type, notes } =
        data;

      // Validações
      if (amount <= 0) {
        throw new ValidationError(
          "O valor do dividendo deve ser maior que zero",
        );
      }

      // Verificar se o investimento existe e pertence ao usuário
      const investment = await prisma.investment.findFirst({
        where: { id: investmentId, userId },
      });

      if (!investment) {
        throw new NotFoundError("Investimento não encontrado");
      }

      const dividend = await prisma.dividend.create({
        data: {
          investmentId,
          amount,
          paymentDate,
          exDividendDate: exDividendDate || null,
          type: type?.trim() || null,
          notes: notes?.trim() || null,
        },
        include: {
          investment: {
            select: {
              id: true,
              symbol: true,
              name: true,
              type: true,
            },
          },
        },
      });

      loggerUtils.logFinancial("Dividend added", {
        userId,
        investmentId,
        dividendId: dividend.id,
        amount,
        symbol: investment.symbol,
      });

      return {
        id: dividend.id,
        amount: Number(dividend.amount),
        paymentDate: dividend.paymentDate,
        exDividendDate: dividend.exDividendDate || undefined,
        type: dividend.type || undefined,
        notes: dividend.notes || undefined,
        createdAt: dividend.createdAt,
        investment: dividend.investment,
      };
    } catch (error) {
      logger.error("Add dividend failed", { userId, data, error });
      throw error;
    }
  }

  /**
   * Lista todos os dividendos do usuário
   */
  async getDividends(
    userId: string,
    filters: {
      investmentId?: string;
      year?: number;
      month?: number;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {},
  ): Promise<{
    dividends: DividendWithInvestment[];
    summary: {
      totalDividends: number;
      totalAmount: number;
      averageAmount: number;
      byMonth: Array<{
        month: string;
        count: number;
        amount: number;
      }>;
      byInvestment: Array<{
        symbol: string;
        name: string;
        count: number;
        totalAmount: number;
      }>;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { investmentId, year, month } = filters;
      const {
        page = 1,
        limit = 20,
        sortBy = "paymentDate",
        sortOrder = "desc",
      } = pagination;
      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        investment: { userId },
      };

      if (investmentId) {
        where.investmentId = investmentId;
      }

      if (year || month) {
        where.paymentDate = {};
        if (year) {
          const startDate = new Date(year, month ? month - 1 : 0, 1);
          const endDate = new Date(year, month ? month : 12, 0, 23, 59, 59);
          where.paymentDate.gte = startDate;
          where.paymentDate.lte = endDate;
        }
      }

      // Buscar dividendos
      const [dividends, totalCount] = await Promise.all([
        prisma.dividend.findMany({
          where,
          include: {
            investment: {
              select: {
                id: true,
                symbol: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.dividend.count({ where }),
      ]);

      // Buscar todos os dividendos para o resumo
      const allDividends = await prisma.dividend.findMany({
        where: { investment: { userId } },
        include: {
          investment: {
            select: {
              symbol: true,
              name: true,
            },
          },
        },
      });

      const summary = this.calculateDividendSummary(allDividends);

      const formattedDividends: DividendWithInvestment[] = dividends.map(
        (dividend) => ({
          id: dividend.id,
          amount: Number(dividend.amount),
          paymentDate: dividend.paymentDate,
          exDividendDate: dividend.exDividendDate || undefined,
          type: dividend.type || undefined,
          notes: dividend.notes || undefined,
          createdAt: dividend.createdAt,
          investment: dividend.investment,
        }),
      );

      return {
        dividends: formattedDividends,
        summary,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Get dividends failed", {
        userId,
        filters,
        pagination,
        error,
      });
      throw error;
    }
  }

  /**
   * Obtém resumo da carteira de investimentos
   */
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    try {
      const investments = await prisma.investment.findMany({
        where: { userId },
        include: {
          dividends: {
            select: {
              amount: true,
              paymentDate: true,
            },
          },
        },
      });

      return this.calculatePortfolioSummary(investments);
    } catch (error) {
      logger.error("Get portfolio summary failed", { userId, error });
      throw error;
    }
  }

  /**
   * Calcula métricas de um investimento
   */
  private calculateInvestmentMetrics(
    investment: any,
    dividends: Array<{ amount: any; paymentDate: Date }>,
  ): InvestmentWithMetrics {
    const quantity = Number(investment.quantity);
    const averagePrice = Number(investment.averagePrice);
    const currentPrice = Number(investment.currentPrice);

    const totalInvested = quantity * averagePrice;
    const currentValue = quantity * currentPrice;
    const gainLoss = currentValue - totalInvested;
    const gainLossPercentage =
      totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    const totalDividends = dividends.reduce(
      (sum, div) => sum + Number(div.amount),
      0,
    );
    const dividendYield =
      totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

    const lastDividendDate =
      dividends.length > 0
        ? dividends.sort(
            (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
          )[0].paymentDate
        : undefined;

    return {
      id: investment.id,
      symbol: investment.symbol,
      name: investment.name,
      type: investment.type,
      sector: investment.sector || undefined,
      quantity,
      averagePrice,
      currentPrice,
      notes: investment.notes || undefined,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
      totalDividends: Math.round(totalDividends * 100) / 100,
      dividendYield: Math.round(dividendYield * 100) / 100,
      lastDividendDate,
    };
  }

  /**
   * Calcula resumo da carteira
   */
  private calculatePortfolioSummary(investments: any[]): PortfolioSummary {
    const investmentsWithMetrics = investments.map((inv) =>
      this.calculateInvestmentMetrics(inv, inv.dividends || []),
    );

    const totals = investmentsWithMetrics.reduce(
      (acc, inv) => {
        acc.totalInvested += inv.totalInvested;
        acc.currentValue += inv.currentValue;
        acc.totalDividends += inv.totalDividends;
        return acc;
      },
      { totalInvested: 0, currentValue: 0, totalDividends: 0 },
    );

    const totalGainLoss = totals.currentValue - totals.totalInvested;
    const totalGainLossPercentage =
      totals.totalInvested > 0
        ? (totalGainLoss / totals.totalInvested) * 100
        : 0;
    const totalDividendYield =
      totals.totalInvested > 0
        ? (totals.totalDividends / totals.totalInvested) * 100
        : 0;

    // Alocação por tipo
    const allocationByType = investmentsWithMetrics.reduce((acc, inv) => {
      const existing = acc.find((item) => item.type === inv.type);

      if (existing) {
        existing.count += 1;
        existing.totalInvested += inv.totalInvested;
        existing.currentValue += inv.currentValue;
        existing.gainLoss += inv.gainLoss;
      } else {
        acc.push({
          type: inv.type,
          count: 1,
          totalInvested: inv.totalInvested,
          currentValue: inv.currentValue,
          gainLoss: inv.gainLoss,
          percentage: 0,
          gainLossPercentage: 0,
        });
      }

      return acc;
    }, [] as any[]);

    // Calcular percentuais por tipo
    allocationByType.forEach((item) => {
      item.percentage =
        totals.currentValue > 0
          ? (item.currentValue / totals.currentValue) * 100
          : 0;
      item.gainLossPercentage =
        item.totalInvested > 0 ? (item.gainLoss / item.totalInvested) * 100 : 0;
      item.totalInvested = Math.round(item.totalInvested * 100) / 100;
      item.currentValue = Math.round(item.currentValue * 100) / 100;
      item.gainLoss = Math.round(item.gainLoss * 100) / 100;
      item.percentage = Math.round(item.percentage * 100) / 100;
      item.gainLossPercentage = Math.round(item.gainLossPercentage * 100) / 100;
    });

    // Alocação por setor
    const allocationBySector = investmentsWithMetrics
      .filter((inv) => inv.sector)
      .reduce((acc, inv) => {
        const existing = acc.find((item) => item.sector === inv.sector);

        if (existing) {
          existing.count += 1;
          existing.totalInvested += inv.totalInvested;
          existing.currentValue += inv.currentValue;
          existing.gainLoss += inv.gainLoss;
        } else {
          acc.push({
            sector: inv.sector!,
            count: 1,
            totalInvested: inv.totalInvested,
            currentValue: inv.currentValue,
            gainLoss: inv.gainLoss,
            percentage: 0,
            gainLossPercentage: 0,
          });
        }

        return acc;
      }, [] as any[]);

    // Calcular percentuais por setor
    allocationBySector.forEach((item) => {
      item.percentage =
        totals.currentValue > 0
          ? (item.currentValue / totals.currentValue) * 100
          : 0;
      item.gainLossPercentage =
        item.totalInvested > 0 ? (item.gainLoss / item.totalInvested) * 100 : 0;
      item.totalInvested = Math.round(item.totalInvested * 100) / 100;
      item.currentValue = Math.round(item.currentValue * 100) / 100;
      item.gainLoss = Math.round(item.gainLoss * 100) / 100;
      item.percentage = Math.round(item.percentage * 100) / 100;
      item.gainLossPercentage = Math.round(item.gainLossPercentage * 100) / 100;
    });

    // Top e worst performers
    const sortedByPerformance = [...investmentsWithMetrics].sort(
      (a, b) => b.gainLossPercentage - a.gainLossPercentage,
    );

    const topPerformers = sortedByPerformance.slice(0, 5).map((inv) => ({
      symbol: inv.symbol,
      name: inv.name,
      gainLossPercentage: inv.gainLossPercentage,
      gainLoss: inv.gainLoss,
    }));

    const worstPerformers = sortedByPerformance
      .slice(-5)
      .reverse()
      .map((inv) => ({
        symbol: inv.symbol,
        name: inv.name,
        gainLossPercentage: inv.gainLossPercentage,
        gainLoss: inv.gainLoss,
      }));

    return {
      totalInvested: Math.round(totals.totalInvested * 100) / 100,
      currentValue: Math.round(totals.currentValue * 100) / 100,
      totalGainLoss: Math.round(totalGainLoss * 100) / 100,
      totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
      totalDividends: Math.round(totals.totalDividends * 100) / 100,
      totalDividendYield: Math.round(totalDividendYield * 100) / 100,
      totalInvestments: investmentsWithMetrics.length,
      allocationByType: allocationByType.sort(
        (a, b) => b.currentValue - a.currentValue,
      ),
      allocationBySector: allocationBySector.sort(
        (a, b) => b.currentValue - a.currentValue,
      ),
      topPerformers,
      worstPerformers,
    };
  }

  /**
   * Calcula resumo dos dividendos
   */
  private calculateDividendSummary(dividends: any[]): {
    totalDividends: number;
    totalAmount: number;
    averageAmount: number;
    byMonth: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
    byInvestment: Array<{
      symbol: string;
      name: string;
      count: number;
      totalAmount: number;
    }>;
  } {
    const totalAmount = dividends.reduce(
      (sum, div) => sum + Number(div.amount),
      0,
    );
    const averageAmount =
      dividends.length > 0 ? totalAmount / dividends.length : 0;

    // Agrupar por mês
    const byMonth = dividends.reduce((acc, div) => {
      const date = new Date(div.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = acc.find((item) => item.month === monthKey);
      const amount = Number(div.amount);

      if (existing) {
        existing.count += 1;
        existing.amount += amount;
      } else {
        acc.push({ month: monthKey, count: 1, amount: amount });
      }

      return acc;
    }, [] as any[]);

    // Agrupar por investimento
    const byInvestment = dividends.reduce((acc, div) => {
      const existing = acc.find(
        (item) => item.symbol === div.investment.symbol,
      );
      const amount = Number(div.amount);

      if (existing) {
        existing.count += 1;
        existing.totalAmount += amount;
      } else {
        acc.push({
          symbol: div.investment.symbol,
          name: div.investment.name,
          count: 1,
          totalAmount: amount,
        });
      }

      return acc;
    }, [] as any[]);

    return {
      totalDividends: dividends.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
      byMonth: byMonth
        .map((item) => ({
          ...item,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byInvestment: byInvestment
        .map((item) => ({
          ...item,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount),
    };
  }
}

export const investmentService = new InvestmentService();
export default investmentService;
