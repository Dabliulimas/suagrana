/**
 * Data Migration System
 * Migrates data from localStorage to backend APIs
 */

import { getDataLayer } from "@/lib/data-layer";
import { logComponents } from "../logger";
import type {
  Transaction,
  Account,
  Goal,
  Contact,
  Trip,
  Investment,
  SharedDebt,
  ResourceType,
} from "@/lib/data-layer";

export interface MigrationProgress {
  resource: ResourceType;
  total: number;
  completed: number;
  failed: number;
  errors: string[];
  status: "pending" | "running" | "completed" | "failed";
}

export interface MigrationResult {
  success: boolean;
  totalMigrated: number;
  totalFailed: number;
  results: Record<ResourceType, MigrationProgress>;
  errors: string[];
  duration: number;
}

export interface MigrationBackup {
  timestamp: string;
  data: Record<string, any>;
  version: string;
}

export class MigrationSystem {
  private dataLayer = getDataLayer();
  private backupKey = "migration-backup";
  private progressKey = "migration-progress";

  // Create backup of existing localStorage data
  async createBackup(): Promise<MigrationBackup> {
    const backup: MigrationBackup = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      data: {},
    };

    // Backup all localStorage data
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              backup.data[key] = JSON.parse(value);
            }
          } catch {
            // Store as string if not JSON
            backup.data[key] = localStorage.getItem(key);
          }
        }
      }
    }

    // Save backup
    if (typeof window !== "undefined") {
      localStorage.setItem(this.backupKey, JSON.stringify(backup));
    }

    return backup;
  }

  // Restore from backup
  async restoreFromBackup(): Promise<void> {
    if (typeof window === "undefined") return;

    const backupData = localStorage.getItem(this.backupKey);
    if (!backupData) {
      throw new Error("No backup found");
    }

    try {
      const backup: MigrationBackup = JSON.parse(backupData);

      // Clear current localStorage (except backup)
      const keysToKeep = [this.backupKey, this.progressKey];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Restore backup data
      Object.entries(backup.data).forEach(([key, value]) => {
        if (!keysToKeep.includes(key)) {
          localStorage.setItem(
            key,
            typeof value === "string" ? value : JSON.stringify(value),
          );
        }
      });
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  // Extract data from localStorage
  private extractLocalStorageData(): Record<ResourceType, any[]> {
    const data: Record<ResourceType, any[]> = {
      transactions: [],
      accounts: [],
      goals: [],
      contacts: [],
      trips: [],
      investments: [],
      "shared-debts": [],
    };

    if (typeof window === "undefined") return data;

    try {
      // Extract transactions
      const simpleTransactions = localStorage.getItem("simple-transactions");
      const mainTransactions = localStorage.getItem("sua-grana-transactions");

      if (simpleTransactions) {
        data.transactions = JSON.parse(simpleTransactions);
      } else if (mainTransactions) {
        data.transactions = JSON.parse(mainTransactions);
      }

      // Extract accounts
      const simpleAccounts = localStorage.getItem("simple-accounts");
      const mainAccounts = localStorage.getItem("sua-grana-accounts");

      if (simpleAccounts) {
        data.accounts = JSON.parse(simpleAccounts);
      } else if (mainAccounts) {
        data.accounts = JSON.parse(mainAccounts);
      }

      // Extract goals
      const simpleGoals = localStorage.getItem("simple-goals");
      const mainGoals = localStorage.getItem("sua-grana-goals");

      if (simpleGoals) {
        data.goals = JSON.parse(simpleGoals);
      } else if (mainGoals) {
        data.goals = JSON.parse(mainGoals);
      }

      // Extract contacts
      const simpleContacts = localStorage.getItem("simple-contacts");
      const mainContacts = localStorage.getItem("sua-grana-contacts");
      const familyMembers = localStorage.getItem("familyMembers");

      if (simpleContacts) {
        data.contacts = JSON.parse(simpleContacts);
      } else if (mainContacts) {
        data.contacts = JSON.parse(mainContacts);
      }

      if (familyMembers) {
        const family = JSON.parse(familyMembers);
        data.contacts = [...data.contacts, ...family];
      }
    } catch (error) {
      logComponents.error("Erro ao extrair contatos:", error);
    }

    return data;
  }
}
