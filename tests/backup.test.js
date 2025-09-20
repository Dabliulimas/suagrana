import { validateBackup, generateBackupFilename } from '@/lib/backup';

// Mock do Prisma para testes
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    account: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    investment: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
    backupHistory: {
      create: jest.fn().mockResolvedValue({}),
    }
  }
}));

describe('Sistema de Backup', () => {
  describe('validateBackup', () => {
    test('deve validar backup com estrutura correta', () => {
      const validBackup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [],
          transactions: [],
          investments: [],
          goals: []
        }
      };

      const result = validateBackup(validBackup);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('deve rejeitar backup sem versão', () => {
      const invalidBackup = {
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [],
          transactions: [],
          investments: [],
          goals: []
        }
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('deve rejeitar backup sem dados do usuário', () => {
      const invalidBackup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          accounts: [],
          transactions: [],
          investments: [],
          goals: []
        }
      };

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('deve rejeitar backup com estrutura completamente inválida', () => {
      const invalidBackup = 'string-invalida';

      const result = validateBackup(invalidBackup);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('deve validar backup com dados completos', () => {
      const validBackup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [
            {
              id: 'acc-1',
              name: 'Conta Corrente',
              type: 'checking',
              balance: 1000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          transactions: [
            {
              id: 'trans-1',
              description: 'Salário',
              amount: 5000,
              type: 'income',
              date: new Date().toISOString(),
              accountId: 'acc-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          investments: [
            {
              id: 'inv-1',
              name: 'PETR4',
              type: 'stock',
              quantity: 100,
              purchasePrice: 25.5,
              currentPrice: 27.8,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          goals: [
            {
              id: 'goal-1',
              name: 'Emergência',
              targetAmount: 10000,
              currentAmount: 2000,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      };

      const result = validateBackup(validBackup);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateBackupFilename', () => {
    test('deve gerar nome de arquivo correto', () => {
      const userEmail = 'joao@email.com';
      const filename = generateBackupFilename(userEmail);

      expect(filename).toMatch(/^suagrana_backup_joao_email_com_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('deve sanitizar caracteres especiais no email', () => {
      const userEmail = 'user.test+123@domain.co.uk';
      const filename = generateBackupFilename(userEmail);

      expect(filename).toMatch(/^suagrana_backup_user_test\+123_domain_co_uk_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('deve incluir timestamp no nome do arquivo', () => {
      const userEmail = 'test@example.com';
      const filename1 = generateBackupFilename(userEmail);
      
      // Aguardar um pouco para garantir timestamp diferente
      setTimeout(() => {
        const filename2 = generateBackupFilename(userEmail);
        expect(filename1).not.toBe(filename2);
      }, 1000);
    });
  });

  describe('Estrutura de dados do backup', () => {
    test('deve aceitar backup com diferentes tipos de conta', () => {
      const backupWithDifferentAccountTypes = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [
            { id: '1', name: 'Corrente', type: 'checking', balance: 1000 },
            { id: '2', name: 'Poupança', type: 'savings', balance: 5000 },
            { id: '3', name: 'Investimento', type: 'investment', balance: 10000 },
            { id: '4', name: 'Cartão', type: 'credit', balance: -500 }
          ],
          transactions: [],
          investments: [],
          goals: []
        }
      };

      const result = validateBackup(backupWithDifferentAccountTypes);
      expect(result.valid).toBe(true);
    });

    test('deve aceitar backup com diferentes tipos de transação', () => {
      const backupWithDifferentTransactionTypes = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [],
          transactions: [
            { id: '1', description: 'Salário', amount: 5000, type: 'income', date: new Date().toISOString() },
            { id: '2', description: 'Compra', amount: 100, type: 'expense', date: new Date().toISOString() },
            { id: '3', description: 'Transferência', amount: 200, type: 'transfer', date: new Date().toISOString() }
          ],
          investments: [],
          goals: []
        }
      };

      const result = validateBackup(backupWithDifferentTransactionTypes);
      expect(result.valid).toBe(true);
    });

    test('deve aceitar backup com diferentes tipos de investimento', () => {
      const backupWithDifferentInvestmentTypes = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [],
          transactions: [],
          investments: [
            { id: '1', name: 'PETR4', type: 'stock', quantity: 100, purchasePrice: 25.5, currentPrice: 27.8 },
            { id: '2', name: 'Bitcoin', type: 'crypto', quantity: 0.1, purchasePrice: 50000, currentPrice: 55000 },
            { id: '3', name: 'Tesouro Direto', type: 'bond', quantity: 1, purchasePrice: 1000, currentPrice: 1050 }
          ],
          goals: []
        }
      };

      const result = validateBackup(backupWithDifferentInvestmentTypes);
      expect(result.valid).toBe(true);
    });

    test('deve aceitar backup com diferentes status de meta', () => {
      const backupWithDifferentGoalStatuses = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: 'user-123',
        userData: {
          user: {
            id: 'user-123',
            name: 'João Silva',
            email: 'joao@email.com'
          },
          accounts: [],
          transactions: [],
          investments: [],
          goals: [
            { id: '1', name: 'Emergência', targetAmount: 10000, currentAmount: 10000, status: 'completed' },
            { id: '2', name: 'Viagem', targetAmount: 5000, currentAmount: 2000, status: 'active' },
            { id: '3', name: 'Carro', targetAmount: 50000, currentAmount: 1000, status: 'paused' }
          ]
        }
      };

      const result = validateBackup(backupWithDifferentGoalStatuses);
      expect(result.valid).toBe(true);
    });
  });
});
