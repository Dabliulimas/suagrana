import { prisma } from './prisma';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schema para validação dos dados de backup
const backupDataSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  userId: z.string(),
  userData: z.object({
    user: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string()
    }),
    accounts: z.array(z.any()),
    transactions: z.array(z.any()),
    investments: z.array(z.any()),
    goals: z.array(z.any())
  })
});

export type BackupData = z.infer<typeof backupDataSchema>;

/**
 * Cria um backup completo dos dados do usuário
 */
export async function createBackup(userId: string): Promise<BackupData> {
  try {
    // Buscar todos os dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const [accounts, transactions, investments, goals] = await Promise.all([
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.investment.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId,
      userData: {
        user,
        accounts,
        transactions,
        investments,
        goals
      }
    };

    return backupData;

  } catch (error) {
    console.error('Erro ao criar backup:', error);
    throw new Error('Erro ao criar backup dos dados');
  }
}

/**
 * Restaura dados de um backup
 */
export async function restoreBackup(
  userId: string, 
  backupData: unknown, 
  options: {
    replaceExisting?: boolean;
    preserveIds?: boolean;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  restored: {
    accounts: number;
    transactions: number;
    investments: number;
    goals: number;
  }
}> {
  try {
    // Validar dados do backup
    const validatedData = backupDataSchema.parse(backupData);

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { replaceExisting = false, preserveIds = false } = options;
    let restored = {
      accounts: 0,
      transactions: 0,
      investments: 0,
      goals: 0
    };

    // Usar uma transação para garantir consistência
    await prisma.$transaction(async (tx) => {
      // Se replaceExisting for true, deletar dados existentes
      if (replaceExisting) {
        await tx.transaction.deleteMany({ where: { userId } });
        await tx.investment.deleteMany({ where: { userId } });
        await tx.goal.deleteMany({ where: { userId } });
        await tx.account.deleteMany({ where: { userId } });
      }

      // Restaurar contas
      for (const account of validatedData.userData.accounts) {
        const accountData = {
          ...account,
          userId,
          ...(preserveIds ? {} : { id: undefined }),
          createdAt: new Date(account.createdAt),
          updatedAt: new Date(account.updatedAt)
        };

        await tx.account.create({
          data: accountData
        });
        restored.accounts++;
      }

      // Restaurar investimentos
      for (const investment of validatedData.userData.investments) {
        const investmentData = {
          ...investment,
          userId,
          ...(preserveIds ? {} : { id: undefined }),
          createdAt: new Date(investment.createdAt),
          updatedAt: new Date(investment.updatedAt),
          purchaseDate: investment.purchaseDate ? new Date(investment.purchaseDate) : null
        };

        await tx.investment.create({
          data: investmentData
        });
        restored.investments++;
      }

      // Restaurar metas
      for (const goal of validatedData.userData.goals) {
        const goalData = {
          ...goal,
          userId,
          ...(preserveIds ? {} : { id: undefined }),
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt),
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null
        };

        await tx.goal.create({
          data: goalData
        });
        restored.goals++;
      }

      // Restaurar transações (por último devido às dependências)
      for (const transaction of validatedData.userData.transactions) {
        const transactionData = {
          ...transaction,
          userId,
          ...(preserveIds ? {} : { id: undefined }),
          date: new Date(transaction.date),
          createdAt: new Date(transaction.createdAt),
          updatedAt: new Date(transaction.updatedAt)
        };

        await tx.transaction.create({
          data: transactionData
        });
        restored.transactions++;
      }
    });

    return {
      success: true,
      message: `Backup restaurado com sucesso! ${restored.accounts} contas, ${restored.transactions} transações, ${restored.investments} investimentos e ${restored.goals} metas foram restauradas.`,
      restored
    };

  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error('Formato de backup inválido');
    }
    
    throw new Error('Erro ao restaurar backup dos dados');
  }
}

/**
 * Valida se um arquivo é um backup válido
 */
export function validateBackup(data: unknown): {
  valid: boolean;
  errors?: string[];
} {
  try {
    backupDataSchema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      valid: false,
      errors: ['Formato de backup inválido']
    };
  }
}

/**
 * Gera nome de arquivo para backup
 */
export function generateBackupFilename(userEmail: string): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: ptBR });
  const sanitizedEmail = userEmail.replace(/[@.]/g, '_');
  return `suagrana_backup_${sanitizedEmail}_${timestamp}.json`;
}

/**
 * Cria backup automático (pode ser usado em cron jobs)
 */
export async function createAutomaticBackup(userId: string): Promise<string> {
  try {
    const backupData = await createBackup(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const filename = generateBackupFilename(user.email);
    
    // Em produção, você salvaria isso em um storage como AWS S3, Google Cloud Storage, etc.
    // Aqui vamos apenas retornar o JSON como string
    const backupJson = JSON.stringify(backupData, null, 2);
    
    // Registrar backup no banco para histórico
    await prisma.backupHistory.create({
      data: {
        userId,
        filename,
        size: backupJson.length,
        status: 'completed'
      }
    }).catch(() => {
      // Se a tabela não existir, apenas ignore
      console.log('Tabela de histórico de backup não encontrada');
    });

    return backupJson;

  } catch (error) {
    console.error('Erro no backup automático:', error);
    
    // Registrar falha no banco
    await prisma.backupHistory.create({
      data: {
        userId,
        filename: `failed_backup_${Date.now()}.json`,
        size: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }).catch(() => {
      // Se a tabela não existir, apenas ignore
      console.log('Tabela de histórico de backup não encontrada');
    });

    throw error;
  }
}
