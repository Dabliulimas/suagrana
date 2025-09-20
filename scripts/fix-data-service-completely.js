#!/usr/bin/env node

/**
 * Script específico para corrigir completamente o arquivo data-service.ts
 * que contém a maioria dos 2181 erros TypeScript restantes
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const DATA_SERVICE_PATH = path.join(PROJECT_ROOT, 'lib', 'services', 'data-service.ts');

class DataServiceFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  /**
   * Reconstrói completamente o arquivo data-service.ts com estrutura correta
   */
  rebuildDataService() {
    this.log('Reconstruindo data-service.ts completamente...');

    const newContent = `import { db } from '@/lib/db';
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
      const dbTransactions = await db.transaction.findMany({
        where: { 
          account: { userId: this.getCurrentUserId() }
        },
        include: {
          category: true,
          account: true
        },
        orderBy: { date: 'desc' }
      });

      return dbTransactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        notes: transaction.notes || undefined,
        sharedWith: transaction.sharedWith || undefined,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova transação
   */
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const dbTransaction = await db.transaction.create({
        data: {
          amount: data.amount,
          description: data.description,
          date: new Date(data.date),
          categoryId: data.categoryId,
          accountId: data.accountId,
          notes: data.notes,
          sharedWith: data.sharedWith
        }
      });

      return {
        id: dbTransaction.id,
        amount: dbTransaction.amount,
        description: dbTransaction.description,
        date: dbTransaction.date.toISOString(),
        categoryId: dbTransaction.categoryId,
        accountId: dbTransaction.accountId,
        notes: dbTransaction.notes || undefined,
        sharedWith: dbTransaction.sharedWith || undefined,
        createdAt: dbTransaction.createdAt.toISOString(),
        updatedAt: dbTransaction.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma transação existente
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const dbTransaction = await db.transaction.update({
        where: { id },
        data: {
          ...(updates.amount && { amount: updates.amount }),
          ...(updates.description && { description: updates.description }),
          ...(updates.date && { date: new Date(updates.date) }),
          ...(updates.categoryId && { categoryId: updates.categoryId }),
          ...(updates.accountId && { accountId: updates.accountId }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.sharedWith !== undefined && { sharedWith: updates.sharedWith })
        }
      });

      return {
        id: dbTransaction.id,
        amount: dbTransaction.amount,
        description: dbTransaction.description,
        date: dbTransaction.date.toISOString(),
        categoryId: dbTransaction.categoryId,
        accountId: dbTransaction.accountId,
        notes: dbTransaction.notes || undefined,
        sharedWith: dbTransaction.sharedWith || undefined,
        createdAt: dbTransaction.createdAt.toISOString(),
        updatedAt: dbTransaction.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  /**
   * Remove uma transação
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      await db.transaction.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
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
      console.error('Erro ao buscar categorias:', error);
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
      console.error('Erro ao criar categoria:', error);
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
      console.error('Erro ao buscar contas:', error);
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
      console.error('Erro ao criar conta:', error);
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
      console.error('Erro ao buscar metas:', error);
      throw error;
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
      console.error('Erro ao buscar orçamentos:', error);
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
      console.error('Erro ao salvar configurações:', error);
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
      console.error('Erro ao buscar configurações:', error);
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
      console.error('Erro ao buscar tags:', error);
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
      console.error('Erro ao buscar contatos:', error);
      throw error;
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
      console.error('Erro ao buscar investimentos:', error);
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
      console.error('Erro ao limpar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Verifica a saúde da conexão com o banco
   */
  async healthCheck(): Promise<boolean> {
    try {
      await db.$queryRaw\`SELECT 1\`;
      return true;
    } catch (error) {
      console.error('Erro na verificação de saúde do banco:', error);
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
 * Exportação padrão
 */
export default DataService;
`;

    try {
      fs.writeFileSync(DATA_SERVICE_PATH, newContent);
      this.fixes.push('data-service.ts completamente reconstruído');
      this.log('✅ data-service.ts reconstruído com sucesso', 'success');
    } catch (error) {
      this.errors.push(`Erro ao escrever data-service.ts: ${error.message}`);
      this.log(`❌ Erro ao escrever arquivo: ${error.message}`, 'error');
    }
  }

  /**
   * Executa todas as correções
   */
  async run() {
    this.log('🚀 INICIANDO CORREÇÃO COMPLETA DO DATA-SERVICE...');
    this.log('=' .repeat(60));

    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(DATA_SERVICE_PATH)) {
        this.log(`❌ Arquivo não encontrado: ${DATA_SERVICE_PATH}`, 'error');
        return;
      }

      // Fazer backup do arquivo original
      const backupPath = DATA_SERVICE_PATH + '.backup';
      fs.copyFileSync(DATA_SERVICE_PATH, backupPath);
      this.log(`📋 Backup criado: ${backupPath}`);

      // Reconstruir o arquivo
      this.rebuildDataService();

      // Relatório final
      this.log('\n📊 RELATÓRIO DE CORREÇÕES:');
      this.log('=' .repeat(40));
      
      if (this.fixes.length > 0) {
        this.log('\n✅ CORREÇÕES APLICADAS:');
        this.fixes.forEach((fix, index) => {
          this.log(`${index + 1}. ${fix}`);
        });
      }

      if (this.errors.length > 0) {
        this.log('\n❌ ERROS ENCONTRADOS:');
        this.errors.forEach((error, index) => {
          this.log(`${index + 1}. ${error}`);
        });
      }

      this.log('\n🎯 PRÓXIMOS PASSOS:');
      this.log('1. Execute npx tsc --noEmit para verificar erros');
      this.log('2. Teste as funcionalidades do data-service');
      this.log('3. Se houver problemas, restaure o backup');
      this.log('4. Execute os testes automatizados');

      if (this.errors.length === 0) {
        this.log('\n🎉 DATA-SERVICE CORRIGIDO COM SUCESSO!', 'success');
        process.exit(0);
      } else {
        this.log('\n⚠️ Algumas correções precisam de atenção manual.', 'warning');
        process.exit(1);
      }

    } catch (error) {
      this.log(`❌ Erro crítico: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Execução principal
if (require.main === module) {
  const fixer = new DataServiceFixer();
  fixer.run().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = DataServiceFixer;