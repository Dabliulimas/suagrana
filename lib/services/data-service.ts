// Database removed for client-side compatibility
// import { db } from '@/lib/db';
import { logComponents } from "../logger";
import { 
  Transaction, 
  Category, 
  Account, 
  Goal, 
  Budget, 
  UserSettings,
  Tag,
  Contact,
  Investment
} from '@/types';

/**
 * Serviço principal para operações de dados
 * Centraliza todas as operações CRUD com o banco de dados
 */
export class DataService {
  private currentUserId: string;

  constructor(userId?: string) {
    this.currentUserId = userId || 'default-user';
  }

  /**
   * Obtém o ID do usuário atual
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * Define o ID do usuário atual
   */
  setCurrentUserId(userId: string): void {
    this.currentUserId = userId;
  }

  // ===========================================
  // TRANSAÇÕES
  // ===========================================

  /**
   * Obtém todas as transações do usuário
   */
  async getTransactions(): Promise<Transaction[]> {
    try {
      // Data is now retrieved from database via Prisma
      // localStorage functionality has been removed
      return [];
    } catch (error) {
      logComponents.error("Erro ao buscar transações:", error);
      return [];
    }
  }

  /**
   * Cria uma nova transação
   */
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    return this.saveTransaction(data);
  }

  /**
   * Salva uma nova transação (alias para createTransaction para compatibilidade)
   */
  async saveTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      // Data is now saved to database via Prisma
      // localStorage functionality has been removed
      const transaction: Transaction = {
        ...data,
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return transaction;
    } catch (error) {
      logComponents.error("Erro ao salvar transação:", error);
      throw error;
    }
  }

  /**
   * Atualiza uma transação existente
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      // Data is now updated in database via Prisma
      // localStorage functionality has been removed
      const updatedTransaction = {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      } as Transaction;
      
      return updatedTransaction;
    } catch (error) {
      logComponents.error("Erro ao atualizar transação:", error);
      throw error;
    }
  }

  /**
   * Remove uma transação
   */
  async deleteTransaction(id: string): Promise<boolean> {
    try {
      // Data is now deleted from database via Prisma
      // localStorage functionality has been removed
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar transação:", error);
      return false;
    }
  }

  // ===========================================
  // CATEGORIAS
  // ===========================================

  /**
   * Obtém todas as categorias do usuário
   */
  async getCategories(): Promise<Category[]> {
    try {
      const dbCategories = await db.category.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbCategories.map(category => ({
        id: category.id,
        userId: category.userId,
        name: category.name,
        color: category.color || undefined,
        icon: category.icon || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar categorias:", error);
      throw error;
    }
  }

  /**
   * Cria uma nova categoria
   */
  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      const dbCategory = await db.category.create({
        data: {
          userId: data.userId,
          name: data.name,
          color: data.color,
          icon: data.icon,
          isActive: data.isActive ?? true
        }
      });

      return {
        id: dbCategory.id,
        userId: dbCategory.userId,
        name: dbCategory.name,
        color: dbCategory.color || undefined,
        icon: dbCategory.icon || undefined,
        isActive: dbCategory.isActive,
        createdAt: dbCategory.createdAt.toISOString(),
        updatedAt: dbCategory.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao criar categoria:", error);
      throw error;
    }
  }

  /**
   * Salva uma categoria (cria ou atualiza)
   */
  async saveCategory(category: Category | Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Category> {
    try {
      // Se não tem ID, é uma nova categoria
      const isNewCategory = !('id' in category) || !category.id;
      const categoryId = isNewCategory ? crypto.randomUUID() : category.id;
      
      const dbCategory = await db.category.upsert({
        where: { id: categoryId },
        update: {
          name: category.name,
          color: category.color,
          icon: category.icon,
          type: category.type,
          isActive: 'isActive' in category ? category.isActive : true
        },
        create: {
          id: categoryId,
          userId: 'userId' in category ? category.userId : this.getCurrentUserId(),
          name: category.name,
          color: category.color,
          icon: category.icon,
          type: category.type,
          isActive: 'isActive' in category ? category.isActive : true
        }
      });

      return {
        id: dbCategory.id,
        userId: dbCategory.userId,
        name: dbCategory.name,
        color: dbCategory.color || undefined,
        icon: dbCategory.icon || undefined,
        type: dbCategory.type as 'income' | 'expense' | 'transfer',
        isActive: dbCategory.isActive,
        createdAt: dbCategory.createdAt.toISOString(),
        updatedAt: dbCategory.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao salvar categoria:", error);
      throw error;
    }
  }

  // ===========================================
  // CONTAS
  // ===========================================

  /**
   * Obtém todas as contas do usuário
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const dbAccounts = await db.account.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbAccounts.map(account => ({
        id: account.id,
        userId: account.userId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        isActive: account.isActive,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar contas:", error);
      throw error;
    }
  }

  /**
   * Cria uma nova conta
   */
  async createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    try {
      const dbAccount = await db.account.create({
        data: {
          userId: data.userId,
          name: data.name,
          type: data.type,
          balance: data.balance,
          isActive: data.isActive ?? true
        }
      });

      return {
        id: dbAccount.id,
        userId: dbAccount.userId,
        name: dbAccount.name,
        type: dbAccount.type,
        balance: dbAccount.balance,
        isActive: dbAccount.isActive,
        createdAt: dbAccount.createdAt.toISOString(),
        updatedAt: dbAccount.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao criar conta:", error);
      throw error;
    }
  }

  // ===========================================
  // METAS
  // ===========================================

  /**
   * Obtém todas as metas do usuário
   */
  async getGoals(): Promise<Goal[]> {
    try {
      const dbGoals = await db.goal.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { targetDate: 'asc' }
      });

      return dbGoals.map(goal => ({
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        description: goal.description || undefined,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate.toISOString(),
        isCompleted: goal.isCompleted,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar metas:", error);
      throw error;
    }
  }

  /**
   * Salva uma meta (cria ou atualiza)
   */
  async saveGoal(goal: Goal | Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Goal> {
    try {
      // Se não tem ID, é uma nova meta
      const isNewGoal = !('id' in goal) || !goal.id;
      const goalId = isNewGoal ? crypto.randomUUID() : goal.id;
      
      const dbGoal = await db.goal.upsert({
        where: { id: goalId },
        update: {
          title: goal.title,
          description: goal.description,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: new Date(goal.targetDate),
          isCompleted: 'isCompleted' in goal ? goal.isCompleted : false
        },
        create: {
          id: goalId,
          userId: 'userId' in goal ? goal.userId : this.getCurrentUserId(),
          title: goal.title,
          description: goal.description,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          targetDate: new Date(goal.targetDate),
          isCompleted: 'isCompleted' in goal ? goal.isCompleted : false
        }
      });

      return {
        id: dbGoal.id,
        userId: dbGoal.userId,
        title: dbGoal.title,
        description: dbGoal.description || undefined,
        targetAmount: dbGoal.targetAmount,
        currentAmount: dbGoal.currentAmount,
        targetDate: dbGoal.targetDate.toISOString(),
        isCompleted: dbGoal.isCompleted,
        createdAt: dbGoal.createdAt.toISOString(),
        updatedAt: dbGoal.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao salvar meta:", error);
      throw error;
    }
  }

  /**
   * Atualiza uma meta
   */
  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    try {
      const dbGoal = await db.goal.update({
        where: { id, userId: this.getCurrentUserId() },
        data: {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.targetAmount && { targetAmount: updates.targetAmount }),
          ...(updates.currentAmount !== undefined && { currentAmount: updates.currentAmount }),
          ...(updates.targetDate && { targetDate: new Date(updates.targetDate) }),
          ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted })
        }
      });

      return {
        id: dbGoal.id,
        userId: dbGoal.userId,
        title: dbGoal.title,
        description: dbGoal.description || undefined,
        targetAmount: dbGoal.targetAmount,
        currentAmount: dbGoal.currentAmount,
        targetDate: dbGoal.targetDate.toISOString(),
        isCompleted: dbGoal.isCompleted,
        createdAt: dbGoal.createdAt.toISOString(),
        updatedAt: dbGoal.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao atualizar meta:", error);
      return null;
    }
  }

  /**
   * Deleta uma meta
   */
  async deleteGoal(id: string): Promise<boolean> {
    try {
      await db.goal.delete({
        where: { id, userId: this.getCurrentUserId() }
      });
      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar meta:", error);
      return false;
    }
  }

  // ===========================================
  // ORÇAMENTOS
  // ===========================================

  /**
   * Obtém todos os orçamentos do usuário
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const dbBudgets = await db.budget.findMany({
        where: { userId: this.getCurrentUserId() },
        include: { category: true },
        orderBy: { startDate: 'desc' }
      });

      return dbBudgets.map(budget => ({
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        amount: budget.amount,
        spent: budget.spent,
        period: budget.period,
        startDate: budget.startDate.toISOString(),
        endDate: budget.endDate.toISOString(),
        isActive: budget.isActive,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar orçamentos:", error);
      throw error;
    }
  }

  /**
   * Salva um orçamento (cria ou atualiza)
   */
  async saveBudget(budget: Budget): Promise<Budget> {
    try {
      const dbBudget = await db.budget.upsert({
        where: { id: budget.id },
        update: {
          categoryId: budget.categoryId,
          amount: budget.amount,
          spent: budget.spent,
          period: budget.period,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          isActive: budget.isActive
        },
        create: {
          id: budget.id,
          userId: budget.userId,
          categoryId: budget.categoryId,
          amount: budget.amount,
          spent: budget.spent,
          period: budget.period,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          isActive: budget.isActive
        }
      });

      return {
        id: dbBudget.id,
        userId: dbBudget.userId,
        categoryId: dbBudget.categoryId,
        amount: dbBudget.amount,
        spent: dbBudget.spent,
        period: dbBudget.period,
        startDate: dbBudget.startDate.toISOString(),
        endDate: dbBudget.endDate.toISOString(),
        isActive: dbBudget.isActive,
        createdAt: dbBudget.createdAt.toISOString(),
        updatedAt: dbBudget.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao salvar orçamento:", error);
      throw error;
    }
  }

  /**
   * Atualiza um orçamento
   */
  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    try {
      await db.budget.update({
        where: { id },
        data: {
          ...(updates.categoryId && { categoryId: updates.categoryId }),
          ...(updates.amount !== undefined && { amount: updates.amount }),
          ...(updates.spent !== undefined && { spent: updates.spent }),
          ...(updates.period && { period: updates.period }),
          ...(updates.startDate && { startDate: new Date(updates.startDate) }),
          ...(updates.endDate && { endDate: new Date(updates.endDate) }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive })
        }
      });
    } catch (error) {
      logComponents.error("Erro ao atualizar orçamento:", error);
      throw error;
    }
  }

  /**
   * Remove um orçamento
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await db.budget.delete({
        where: { id }
      });
    } catch (error) {
      logComponents.error("Erro ao deletar orçamento:", error);
      throw error;
    }
  }

  // ===========================================
  // CONFIGURAÇÕES DO USUÁRIO
  // ===========================================

  /**
   * Salva configurações do usuário
   */
  async saveUserSettings(data: any): Promise<UserSettings> {
    try {
      const settings = await db.userSettings.upsert({
        where: {
          userId: this.getCurrentUserId()
        },
        update: {
          data: JSON.stringify(data)
        },
        create: {
          userId: this.getCurrentUserId(),
          data: JSON.stringify(data)
        }
      });

      return {
        id: settings.id,
        userId: settings.userId,
        data: JSON.parse(settings.data),
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao salvar configurações:", error);
      throw error;
    }
  }

  /**
   * Obtém configurações do usuário
   */
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const settings = await db.userSettings.findUnique({
        where: {
          userId: this.getCurrentUserId()
        }
      });

      if (!settings) {
        return null;
      }

      return {
        id: settings.id,
        userId: settings.userId,
        data: JSON.parse(settings.data),
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao buscar configurações:", error);
      throw error;
    }
  }

  // ===========================================
  // TAGS
  // ===========================================

  /**
   * Obtém todas as tags do usuário
   */
  async getTags(): Promise<Tag[]> {
    try {
      const dbTags = await db.tag.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbTags.map(tag => ({
        id: tag.id,
        userId: tag.userId,
        name: tag.name,
        color: tag.color || undefined,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar tags:", error);
      throw error;
    }
  }

  /**
   * Salva uma nova tag
   */
  async saveTag(tag: Omit<Tag, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Tag> {
    try {
      const dbTag = await db.tag.create({
        data: {
          userId: this.getCurrentUserId(),
          name: tag.name,
          color: tag.color || null
        }
      });

      return {
        id: dbTag.id,
        userId: dbTag.userId,
        name: dbTag.name,
        color: dbTag.color || undefined,
        createdAt: dbTag.createdAt.toISOString(),
        updatedAt: dbTag.updatedAt.toISOString()
      };
    } catch (error) {
      logComponents.error("Erro ao salvar tag:", error);
      throw error;
    }
  }

  // ===========================================
  // CONTATOS
  // ===========================================

  /**
   * Obtém todos os contatos do usuário
   */
  async getContacts(): Promise<Contact[]> {
    try {
      const dbContacts = await db.contact.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbContacts.map(contact => ({
        id: contact.id,
        userId: contact.userId,
        name: contact.name,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar contatos:", error);
      throw error;
    }
  }

  // ===========================================
  // VIAGENS
  // ===========================================

  /**
   * Obtém todas as viagens do usuário
   */
  async getTrips(): Promise<any[]> {
    try {
      const response = await fetch('/api/trips', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar viagens: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar viagens');
      }

      return result.data?.trips || [];
    } catch (error) {
      logComponents.error("Erro ao buscar viagens:", error);
      // Fallback para localStorage se a API falhar
      return this.localDataService.getTrips();
    }
  }

  /**
   * Salva uma nova viagem
   */
  async saveTrip(data: any): Promise<any> {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro ao salvar viagem: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao salvar viagem');
      }

      return result.data;
    } catch (error) {
      logComponents.error("Erro ao salvar viagem:", error);
      // Fallback para localStorage se a API falhar
      const trip = {
        ...data,
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.getCurrentUserId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.localDataService.saveTrips([...this.localDataService.getTrips(), trip]);
      return trip;
    }
  }

  /**
   * Atualiza uma viagem existente
   */
  async updateTrip(id: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`/api/trips?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar viagem: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar viagem');
      }

      return result.data;
    } catch (error) {
      logComponents.error("Erro ao atualizar viagem:", error);
      // Fallback para localStorage se a API falhar
      const trips = this.localDataService.getTrips();
      const tripIndex = trips.findIndex(t => t.id === id);
      if (tripIndex !== -1) {
        const updatedTrip = {
          ...trips[tripIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        trips[tripIndex] = updatedTrip;
        this.localDataService.saveTrips(trips);
        return updatedTrip;
      }
      throw error;
    }
  }

  /**
   * Remove uma viagem
   */
  async deleteTrip(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/trips?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar viagem: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao deletar viagem');
      }

      return true;
    } catch (error) {
      logComponents.error("Erro ao deletar viagem:", error);
      // Fallback para localStorage se a API falhar
      try {
        const trips = this.localDataService.getTrips();
        const filteredTrips = trips.filter(t => t.id !== id);
        this.localDataService.saveTrips(filteredTrips);
        return true;
      } catch (fallbackError) {
        logComponents.error("Erro no fallback ao deletar viagem:", fallbackError);
        return false;
      }
    }
  }

  // ===========================================
  // INVESTIMENTOS
  // ===========================================

  /**
   * Obtém todos os investimentos do usuário
   */
  async getInvestments(): Promise<Investment[]> {
    try {
      const dbInvestments = await db.investment.findMany({
        where: { userId: this.getCurrentUserId() },
        orderBy: { name: 'asc' }
      });

      return dbInvestments.map(investment => ({
        id: investment.id,
        userId: investment.userId,
        name: investment.name,
        type: investment.type,
        amount: investment.amount,
        currentValue: investment.currentValue,
        createdAt: investment.createdAt.toISOString(),
        updatedAt: investment.updatedAt.toISOString()
      }));
    } catch (error) {
      logComponents.error("Erro ao buscar investimentos:", error);
      throw error;
    }
  }

  // ===========================================
  // MÉTODOS UTILITÁRIOS
  // ===========================================

  /**
   * Limpa todos os dados do usuário (para testes)
   */
  async clearAllUserData(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      // Deletar em ordem para respeitar foreign keys
      await db.transaction.deleteMany({ where: { account: { userId } } });
      await db.budget.deleteMany({ where: { userId } });
      await db.goal.deleteMany({ where: { userId } });
      await db.investment.deleteMany({ where: { userId } });
      await db.contact.deleteMany({ where: { userId } });
      await db.tag.deleteMany({ where: { userId } });
      await db.userSettings.deleteMany({ where: { userId } });
      await db.account.deleteMany({ where: { userId } });
      await db.category.deleteMany({ where: { userId } });
      
      this.log('Todos os dados do usuário foram limpos', 'success');
    } catch (error) {
      logComponents.error("Erro ao limpar dados do usuário:", error);
      throw error;
    }
  }

  /**
   * Verifica a saúde da conexão com o banco
   */
  async healthCheck(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logComponents.error("Erro na verificação de saúde do banco:", error);
      return false;
    }
  }
}

// Instância singleton
let dataServiceInstance: DataService | null = null;

/**
 * Obtém a instância singleton do DataService
 */
export function getDataService(userId?: string): DataService {
  if (!dataServiceInstance) {
    dataServiceInstance = new DataService(userId);
  } else if (userId) {
    dataServiceInstance.setCurrentUserId(userId);
  }
  
  return dataServiceInstance;
}

/**
 * Instância singleton do serviço de dados
 */
export const dataService = getDataService();

/**
 * Exportação padrão
 */
export default DataService;
