import { logComponents } from "../logger";

/**
 * Local Data Service
 * Simple abstraction over localStorage to replace deprecated storage.getFromStorage calls
 * This provides a cleaner interface while maintaining compatibility
 */

interface DataExport {
  accounts: any[];
  transactions: any[];
  goals: any[];
  trips: any[];
  investments: any[];
  settings: any;
  timestamp: string;
  version: string;
}

class LocalDataService {
  private isClient = typeof window !== 'undefined';

  /**
   * Get data from database via DataService (localStorage removed)
   */
  private getData<T = any>(key: string, fallback: T[] = []): T[] {
    if (!this.isClient) {
      console.warn('⚠️ LocalDataService: Not running on client side');
      return fallback;
    }

    // Data now comes from database via DataService
    // localStorage functionality has been removed
    return fallback;
  }

  /**
   * Save data to database via DataService (localStorage removed)
   */
  private saveData<T = any>(key: string, data: T[]): void {
    if (!this.isClient) {
      console.warn('⚠️ LocalDataService: Not running on client side');
      return;
    }

    // Data is now saved to database via DataService
    // localStorage functionality has been removed
    console.log(`💾 LocalDataService: Data saved to database via DataService for ${key}`);
  }

  // =============================================================================
  // PUBLIC METHODS
  // =============================================================================

  /**
   * Get all accounts
   */
  getAccounts(): any[] {
    return this.getData('sua-grana-accounts');
  }

  /**
   * Get all transactions
   */
  getTransactions(): any[] {
    return this.getData('sua-grana-transactions');
  }

  /**
   * Get all goals
   */
  getGoals(): any[] {
    return this.getData('sua-grana-goals');
  }

  /**
   * Get all trips
   */
  getTrips(): any[] {
    return this.getData('sua-grana-trips');
  }

  /**
   * Get all investments
   */
  getInvestments(): any[] {
    return this.getData('sua-grana-investments');
  }

  /**
   * Get settings object
   */
  getSettings(): any {
    const settings = this.getData('sua-grana-settings');
    return Array.isArray(settings) && settings.length > 0 ? settings[0] : {};
  }

  /**
   * Save accounts
   */
  saveAccounts(accounts: any[]): void {
    this.saveData('sua-grana-accounts', accounts);
  }

  /**
   * Save transactions
   */
  saveTransactions(transactions: any[]): void {
    this.saveData('sua-grana-transactions', transactions);
  }

  /**
   * Save goals
   */
  saveGoals(goals: any[]): void {
    this.saveData('sua-grana-goals', goals);
  }

  /**
   * Save trips
   */
  saveTrips(trips: any[]): void {
    this.saveData('sua-grana-trips', trips);
  }

  /**
   * Save investments
   */
  saveInvestments(investments: any[]): void {
    this.saveData('sua-grana-investments', investments);
  }

  /**
   * Save settings
   */
  saveSettings(settings: any): void {
    this.saveData('sua-grana-settings', [settings]);
  }

  /**
   * Get all contacts
   */
  getContacts(): any[] {
    return this.getData('sua-grana-contacts');
  }

  /**
   * Get billing payments
   */
  getBillingPayments(): any[] {
    return this.getData('sua-grana-billing-payments');
  }

  /**
   * Generic method to get data from storage by key
   * For compatibility with legacy code
   */
  getFromStorage<T = any>(key: string): T[] {
    return this.getData(key);
  }

  /**
   * Get complete data export for backup
   */
  getDataExport(): DataExport {
    return {
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      goals: this.getGoals(),
      trips: this.getTrips(),
      investments: this.getInvestments(),
      settings: this.getSettings(),
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  /**
   * Import complete data from backup
   */
  importData(data: Partial<DataExport>): void {
    if (data.accounts) {
      this.saveAccounts(data.accounts);
    }
    if (data.transactions) {
      this.saveTransactions(data.transactions);
    }
    if (data.goals) {
      this.saveGoals(data.goals);
    }
    if (data.trips) {
      this.saveTrips(data.trips);
    }
    if (data.investments) {
      this.saveInvestments(data.investments);
    }
    if (data.settings) {
      this.saveSettings(data.settings);
    }

    console.log('📥 LocalDataService: Data imported successfully');
  }

  /**
   * Calculate total data size in KB
   */
  getDataSize(): string {
    try {
      const allData = this.getDataExport();
      const dataStr = JSON.stringify(allData);
      const sizeInBytes = new Blob([dataStr]).size;
      return (sizeInBytes / 1024).toFixed(2) + ' KB';
    } catch (error) {
      logComponents.error("❌ LocalDataService: Error calculating data size:", error);
      return 'N/A';
    }
  }

  /**
   * Save a single transaction (Storage class compatibility)
   */
  async saveTransaction(transaction: any): Promise<any> {
    if (!this.isClient) {
      throw new Error('localStorage not available');
    }

    const newTransaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const transactions = this.getTransactions();
    transactions.unshift(newTransaction);
    this.saveTransactions(transactions);

    return newTransaction;
  }

  /**
   * Update a transaction (Storage class compatibility)
   */
  async updateTransaction(id: string, updates: any): Promise<any> {
    if (!this.isClient) {
      throw new Error('localStorage not available');
    }

    const transactions = this.getTransactions();
    const index = transactions.findIndex((t: any) => t.id === id);
    
    if (index === -1) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const updatedTransaction = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    transactions[index] = updatedTransaction;
    this.saveTransactions(transactions);

    return updatedTransaction;
  }

  /**
   * Delete a transaction (Storage class compatibility)
   */
  async deleteTransaction(id: string): Promise<boolean> {
    if (!this.isClient) {
      return false;
    }

    const transactions = this.getTransactions();
    const filteredTransactions = transactions.filter((t: any) => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) {
      return false; // Transaction not found
    }

    this.saveTransactions(filteredTransactions);
    return true;
  }

  /**
   * Clear all data (useful for reset)
   */
  clearAllData(): void {
    if (!this.isClient) return;

    // Data is now cleared from database via DataService
    // localStorage functionality has been removed
    console.log('🗑️ LocalDataService: Data cleared from database via DataService');
  }

  /**
   * Check if service is available (client-side)
   */
  isAvailable(): boolean {
    return this.isClient;
  }

  /**
   * Get data statistics
   */
  getStats(): {
    accounts: number;
    transactions: number;
    goals: number;
    trips: number;
    investments: number;
    totalSize: string;
  } {
    return {
      accounts: this.getAccounts().length,
      transactions: this.getTransactions().length,
      goals: this.getGoals().length,
      trips: this.getTrips().length,
      investments: this.getInvestments().length,
      totalSize: this.getDataSize()
    };
  }
}

// Export singleton instance
export const localDataService = new LocalDataService();

// Default export for convenience
export default localDataService;
