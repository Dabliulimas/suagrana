"use client";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import type { Transaction, Goal, Contact, Investment } from "@/lib/types";

/**
 * Serviço responsável por migrar dados do localStorage para o banco de dados
 * Este serviço garante que todos os dados sejam transferidos de forma segura
 */
export class MigrationService {
  private static instance: MigrationService;
  private migrationLog: string[] = [];

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.migrationLog.push(logMessage);
    console.log(`🔄 Migration: ${logMessage}`);
  }

  /**
   * Executa a migração completa do localStorage para o banco de dados
   */
  async migrateAllData(): Promise<{
    success: boolean;
    migratedCounts: Record<string, number>;
    errors: string[];
    log: string[];
  }> {
    this.log("Iniciando migração completa do localStorage para banco de dados");
    
    const migratedCounts = {
      transactions: 0,
      accounts: 0,
      goals: 0,
      contacts: 0,
      investments: 0,
    };
    const errors: string[] = [];

    try {
      // 1. Migrar transações
      this.log("Migrando transações...");
      migratedCounts.transactions = await this.migrateTransactions();
      
      // 2. Migrar contas
      this.log("Migrando contas...");
      migratedCounts.accounts = await this.migrateAccounts();
      
      // 3. Migrar metas
      this.log("Migrando metas...");
      migratedCounts.goals = await this.migrateGoals();
      
      // 4. Migrar contatos
      this.log("Migrando contatos...");
      migratedCounts.contacts = await this.migrateContacts();
      
      // 5. Migrar investimentos
      this.log("Migrando investimentos...");
      migratedCounts.investments = await this.migrateInvestments();
      
      this.log("Migração completa finalizada com sucesso");
      
      return {
        success: true,
        migratedCounts,
        errors,
        log: this.migrationLog,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      this.log(`Erro durante migração: ${errorMessage}`);
      errors.push(errorMessage);
      
      return {
        success: false,
        migratedCounts,
        errors,
        log: this.migrationLog,
      };
    }
  }

  /**
   * @deprecated Migração não é mais necessária - dados já estão no banco
   */
  private async migrateTransactions(): Promise<number> {
    // Dados agora são salvos diretamente no banco via Prisma
    this.log("migrateTransactions foi removida - dados já estão no banco");
    return 0;
  }

  /**
   * @deprecated Migração não é mais necessária - dados já estão no banco
   */
  private async migrateAccounts(): Promise<number> {
    // Dados agora são salvos diretamente no banco via Prisma
    this.log("migrateAccounts foi removida - dados já estão no banco");
    return 0;
  }

  /**
   * @deprecated Migração não é mais necessária - dados já estão no banco
   */
  private async migrateGoals(): Promise<number> {
    // Dados agora são salvos diretamente no banco via Prisma
    this.log("migrateGoals foi removida - dados já estão no banco");
    return 0;
  }

  /**
   * @deprecated Migração não é mais necessária - dados já estão no banco
   */
  private async migrateContacts(): Promise<number> {
    // Dados agora são salvos diretamente no banco via Prisma
    this.log("migrateContacts foi removida - dados já estão no banco");
    return 0;
  }

  /**
   * @deprecated Migração não é mais necessária - dados já estão no banco
   */
  private async migrateInvestments(): Promise<number> {
    // Dados agora são salvos diretamente no banco via Prisma
    this.log("migrateInvestments foi removida - dados já estão no banco");
    return 0;
  }

  /**
   * Obtém dados do banco de dados (substituindo localStorage)
   * @deprecated Esta função foi removida pois não usamos mais localStorage
   */
  private getLocalStorageData(key: string): any[] {
    // Dados agora vêm do banco de dados via Prisma
    this.log(`Função getLocalStorageData(${key}) foi removida - dados agora vêm do banco`);
    return [];
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  async clearLocalStorageAfterMigration(): Promise<void> {
    this.log("clearLocalStorageAfterMigration foi removida - localStorage não é mais usado");
  }

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  hasDataToMigrate(): boolean {
    this.log("hasDataToMigrate foi removida - localStorage não é mais usado");
    return false;
  }
}

// Instância singleton
export const migrationService = MigrationService.getInstance();