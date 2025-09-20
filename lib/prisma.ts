import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Utility functions for common operations
export const db = {
  // User operations
  user: {
    async findByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
        include: {
          accounts: true,
          _count: {
            select: {
              transactions: true,
              goals: true,
              investments: true,
            }
          }
        }
      });
    },
    
    async findById(id: string) {
      return prisma.user.findUnique({
        where: { id },
        include: {
          accounts: true,
          _count: {
            select: {
              transactions: true,
              goals: true,
              investments: true,
            }
          }
        }
      });
    },

    async create(data: any) {
      return prisma.user.create({
        data,
        include: {
          accounts: true
        }
      });
    }
  },

  // Transaction operations
  transaction: {
    async findMany(userId: string, options?: {
      page?: number;
      limit?: number;
      category?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    }) {
      const { page = 1, limit = 50, category, type, startDate, endDate } = options || {};
      
      return prisma.transaction.findMany({
        where: {
          userId,
          ...(category && { category }),
          ...(type && { type }),
          ...(startDate && endDate && {
            date: {
              gte: startDate,
              lte: endDate
            }
          })
        },
        include: {
          account: true,
        },
        orderBy: {
          date: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      });
    },

    async getStats(userId: string, period?: { start: Date; end: Date }) {
      const where = {
        userId,
        ...(period && {
          date: {
            gte: period.start,
            lte: period.end
          }
        })
      };

      const [income, expenses, total] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...where, type: 'INCOME' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.transaction.aggregate({
          where: { ...where, type: 'EXPENSE' },
          _sum: { amount: true },
          _count: true
        }),
        prisma.transaction.count({ where })
      ]);

      return {
        totalIncome: income._sum.amount || 0,
        totalExpenses: Math.abs(Number(expenses._sum.amount) || 0),
        incomeCount: income._count,
        expenseCount: expenses._count,
        totalTransactions: total,
        netIncome: Number(income._sum.amount || 0) - Math.abs(Number(expenses._sum.amount) || 0)
      };
    }
  },

  // Account operations
  account: {
    async findByUserId(userId: string) {
      return prisma.account.findMany({
        where: { userId, isActive: true },
        include: {
          _count: {
            select: {
              transactions: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
    },

    async updateBalance(accountId: string, newBalance: number) {
      return prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance }
      });
    }
  },

  // Investment operations
  investment: {
    async findByUserId(userId: string) {
      return prisma.investment.findMany({
        where: { userId },
        include: {
          dividends: {
            orderBy: { paymentDate: 'desc' },
            take: 5
          }
        },
        orderBy: {
          purchaseDate: 'desc'
        }
      });
    },

    async getPortfolioStats(userId: string) {
      const investments = await prisma.investment.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          dividends: true
        }
      });

      const totalInvested = investments.reduce((sum, inv) => 
        sum + (Number(inv.quantity) * Number(inv.purchasePrice)), 0
      );

      const currentValue = investments.reduce((sum, inv) => 
        sum + (Number(inv.quantity) * Number(inv.currentPrice || inv.purchasePrice)), 0
      );

      const totalDividends = investments.reduce((sum, inv) => 
        sum + inv.dividends.reduce((divSum, div) => divSum + Number(div.amount), 0), 0
      );

      return {
        totalInvested,
        currentValue,
        totalReturn: currentValue - totalInvested,
        totalReturnPercentage: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
        totalDividends,
        totalAssets: investments.length
      };
    }
  },

  // Goal operations
  goal: {
    async findByUserId(userId: string) {
      return prisma.goal.findMany({
        where: { userId, isActive: true },
        orderBy: [
          { priority: 'desc' },
          { targetDate: 'asc' }
        ]
      });
    },

    async updateProgress(goalId: string, amount: number) {
      return prisma.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            increment: amount
          }
        }
      });
    }
  }
};

// Health check function
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', message: 'Database connection successful' };
  } catch (error) {
    return { 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
