import { NextRequest } from 'next/server';

// Mock das dependências
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {}
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    account: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn()
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn()
    },
    investment: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn()
    },
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn()
    }
  }
}));

jest.mock('../../../lib/logger', () => ({
  logComponents: {
    error: jest.fn()
  }
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Import das funções de API após os mocks
let GET, POST;

describe('API Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    name: 'João Silva',
    email: 'joao@email.com'
  };

  const mockSession = {
    user: {
      email: 'joao@email.com'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue(mockSession);
    prisma.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('Accounts API', () => {
    beforeAll(async () => {
      const accountsApi = await import('../app/api/accounts/route.ts');
      GET = accountsApi.GET;
      POST = accountsApi.POST;
    });

    describe('GET /api/accounts', () => {
      test('deve retornar contas do usuário autenticado', async () => {
        const mockAccounts = [
          {
            id: 'acc-1',
            name: 'Conta Corrente',
            type: 'checking',
            balance: 1000,
            _count: { transactions: 5 }
          }
        ];

        prisma.account.findMany.mockResolvedValue(mockAccounts);

        const request = new NextRequest('http://localhost:3000/api/accounts');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.accounts).toEqual(mockAccounts);
        expect(prisma.account.findMany).toHaveBeenCalledWith({
          where: { userId: mockUser.id },
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: {
                transactions: true
              }
            }
          }
        });
      });

      test('deve retornar erro 401 se não autenticado', async () => {
        getServerSession.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/accounts');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Não autorizado');
      });

      test('deve retornar erro 404 se usuário não encontrado', async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/accounts');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Usuário não encontrado');
      });
    });

    describe('POST /api/accounts', () => {
      test('deve criar nova conta com sucesso', async () => {
        const newAccount = {
          name: 'Nova Conta',
          type: 'savings',
          balance: 500
        };

        const createdAccount = {
          id: 'acc-new',
          ...newAccount,
          userId: mockUser.id
        };

        prisma.account.findFirst.mockResolvedValue(null);
        prisma.account.create.mockResolvedValue(createdAccount);

        const request = new NextRequest('http://localhost:3000/api/accounts', {
          method: 'POST',
          body: JSON.stringify(newAccount)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.account).toEqual(createdAccount);
      });

      test('deve retornar erro se conta com mesmo nome já existe', async () => {
        const newAccount = {
          name: 'Conta Existente',
          type: 'checking',
          balance: 1000
        };

        const existingAccount = {
          id: 'acc-existing',
          name: 'Conta Existente',
          userId: mockUser.id
        };

        prisma.account.findFirst.mockResolvedValue(existingAccount);

        const request = new NextRequest('http://localhost:3000/api/accounts', {
          method: 'POST',
          body: JSON.stringify(newAccount)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Já existe uma conta com este nome');
      });

      test('deve retornar erro de validação para dados inválidos', async () => {
        const invalidAccount = {
          name: '', // Nome vazio
          type: 'invalid-type',
          balance: -100 // Balance negativo pode ser válido para alguns tipos
        };

        const request = new NextRequest('http://localhost:3000/api/accounts', {
          method: 'POST',
          body: JSON.stringify(invalidAccount)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Dados inválidos');
        expect(data.details).toBeDefined();
      });
    });
  });

  describe('Transactions API', () => {
    beforeAll(async () => {
      const transactionsApi = await import('../app/api/transactions/route.ts');
      GET = transactionsApi.GET;
      POST = transactionsApi.POST;
    });

    describe('GET /api/transactions', () => {
      test('deve retornar transações com paginação', async () => {
        const mockTransactions = [
          {
            id: 'trans-1',
            description: 'Salário',
            amount: 5000,
            type: 'income',
            date: new Date()
          }
        ];

        prisma.transaction.count.mockResolvedValue(1);
        prisma.transaction.findMany.mockResolvedValue(mockTransactions);

        const request = new NextRequest('http://localhost:3000/api/transactions?page=1&limit=10');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockTransactions);
        expect(data.pagination).toBeDefined();
        expect(data.pagination.page).toBe(1);
        expect(data.pagination.limit).toBe(10);
        expect(data.pagination.total).toBe(1);
      });

      test('deve aplicar filtros de query parameters', async () => {
        prisma.transaction.count.mockResolvedValue(0);
        prisma.transaction.findMany.mockResolvedValue([]);

        const request = new NextRequest('http://localhost:3000/api/transactions?type=income&category=salary&startDate=2024-01-01&endDate=2024-12-31');
        await GET(request);

        expect(prisma.transaction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              userId: mockUser.id,
              type: 'income',
              category: { contains: 'salary', mode: 'insensitive' },
              date: {
                gte: expect.any(Date),
                lte: expect.any(Date)
              }
            })
          })
        );
      });
    });

    describe('POST /api/transactions', () => {
      test('deve criar nova transação com sucesso', async () => {
        const newTransaction = {
          description: 'Compra de mercado',
          amount: 150.75,
          type: 'expense',
          category: 'alimentacao',
          date: new Date().toISOString(),
          accountId: 'account-123'
        };

        const createdTransaction = {
          id: 'trans-new',
          ...newTransaction,
          userId: mockUser.id
        };

        prisma.transaction.create.mockResolvedValue(createdTransaction);

        const request = new NextRequest('http://localhost:3000/api/transactions', {
          method: 'POST',
          body: JSON.stringify(newTransaction)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.transaction).toEqual(createdTransaction);
      });

      test('deve retornar erro de validação para dados inválidos', async () => {
        const invalidTransaction = {
          description: '',
          amount: -100, // Valor negativo inválido
          type: 'invalid-type',
          date: 'invalid-date'
        };

        const request = new NextRequest('http://localhost:3000/api/transactions', {
          method: 'POST',
          body: JSON.stringify(invalidTransaction)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Dados inválidos');
      });
    });
  });

  describe('Investments API', () => {
    beforeAll(async () => {
      const investmentsApi = await import('../app/api/investments/route.ts');
      GET = investmentsApi.GET;
      POST = investmentsApi.POST;
    });

    describe('GET /api/investments', () => {
      test('deve retornar investimentos com estatísticas', async () => {
        const mockInvestments = [
          {
            id: 'inv-1',
            name: 'PETR4',
            type: 'stock',
            quantity: 100,
            purchasePrice: 25.50,
            currentPrice: 27.80
          }
        ];

        prisma.investment.count.mockResolvedValue(1);
        prisma.investment.findMany.mockResolvedValue(mockInvestments);

        const request = new NextRequest('http://localhost:3000/api/investments');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockInvestments);
        expect(data.summary).toBeDefined();
        expect(data.summary.totalValue).toBe(2780); // 100 * 27.80
        expect(data.summary.totalCost).toBe(2550); // 100 * 25.50
        expect(data.summary.totalGainLoss).toBe(230); // 2780 - 2550
      });
    });

    describe('POST /api/investments', () => {
      test('deve criar novo investimento com sucesso', async () => {
        const newInvestment = {
          name: 'VALE3',
          type: 'stock',
          quantity: 50,
          purchasePrice: 65.00,
          currentPrice: 70.00,
          ticker: 'VALE3'
        };

        const createdInvestment = {
          id: 'inv-new',
          ...newInvestment,
          userId: mockUser.id
        };

        prisma.investment.findFirst.mockResolvedValue(null);
        prisma.investment.create.mockResolvedValue(createdInvestment);

        const request = new NextRequest('http://localhost:3000/api/investments', {
          method: 'POST',
          body: JSON.stringify(newInvestment)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.investment).toEqual(createdInvestment);
      });
    });
  });

  describe('Goals API', () => {
    beforeAll(async () => {
      const goalsApi = await import('../app/api/goals/route.ts');
      GET = goalsApi.GET;
      POST = goalsApi.POST;
    });

    describe('GET /api/goals', () => {
      test('deve retornar metas com estatísticas', async () => {
        const mockGoals = [
          {
            id: 'goal-1',
            name: 'Emergência',
            targetAmount: 10000,
            currentAmount: 7000,
            status: 'active'
          },
          {
            id: 'goal-2',
            name: 'Viagem',
            targetAmount: 5000,
            currentAmount: 5000,
            status: 'completed'
          }
        ];

        prisma.goal.count.mockResolvedValue(2);
        prisma.goal.findMany.mockResolvedValue(mockGoals);

        const request = new NextRequest('http://localhost:3000/api/goals');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(mockGoals);
        expect(data.summary).toBeDefined();
        expect(data.summary.totalTargetAmount).toBe(15000);
        expect(data.summary.totalCurrentAmount).toBe(12000);
        expect(data.summary.completedGoals).toBe(1);
        expect(data.summary.activeGoals).toBe(1);
      });
    });

    describe('POST /api/goals', () => {
      test('deve criar nova meta com sucesso', async () => {
        const newGoal = {
          name: 'Casa Própria',
          targetAmount: 200000,
          currentAmount: 50000,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'imovel',
          status: 'active'
        };

        const createdGoal = {
          id: 'goal-new',
          ...newGoal,
          userId: mockUser.id
        };

        prisma.goal.findFirst.mockResolvedValue(null);
        prisma.goal.create.mockResolvedValue(createdGoal);

        const request = new NextRequest('http://localhost:3000/api/goals', {
          method: 'POST',
          body: JSON.stringify(newGoal)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.goal).toEqual(createdGoal);
      });
    });
  });

  describe('Backup API', () => {
    beforeAll(async () => {
      const backupApi = await import('../app/api/backup/route.ts');
      GET = backupApi.GET;
      POST = backupApi.POST;
    });

    describe('GET /api/backup', () => {
      test('deve gerar backup como download', async () => {
        // Mock dos dados para backup
        prisma.account.findMany.mockResolvedValue([]);
        prisma.transaction.findMany.mockResolvedValue([]);
        prisma.investment.findMany.mockResolvedValue([]);
        prisma.goal.findMany.mockResolvedValue([]);

        const request = new NextRequest('http://localhost:3000/api/backup');
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Content-Disposition')).toMatch(/attachment; filename="suagrana_backup_.*\.json"/);
      });
    });

    describe('POST /api/backup', () => {
      test('deve restaurar backup válido', async () => {
        const validBackupData = {
          version: '1.0.0',
          exportDate: new Date().toISOString(),
          userId: 'user-123',
          userData: {
            user: mockUser,
            accounts: [],
            transactions: [],
            investments: [],
            goals: []
          }
        };

        const requestBody = {
          backupData: validBackupData,
          options: { replaceExisting: false }
        };

        const request = new NextRequest('http://localhost:3000/api/backup', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('sucesso');
      });

      test('deve rejeitar backup inválido', async () => {
        const invalidBackupData = {
          version: '1.0.0',
          // Faltando campos obrigatórios
        };

        const requestBody = {
          backupData: invalidBackupData
        };

        const request = new NextRequest('http://localhost:3000/api/backup', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Dados de backup inválidos');
      });
    });
  });
});
