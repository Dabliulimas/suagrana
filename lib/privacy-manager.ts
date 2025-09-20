export interface PrivacySettings {
  id: string;
  userId: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  dataRetentionPeriod: number; // in days
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  consentDate: string;
  lastUpdated: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  autoDelete: boolean;
  description: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PrivacyManager {
  private static instance: PrivacyManager;

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Default retention policies
  private readonly defaultPolicies: DataRetentionPolicy[] = [
    {
      dataType: "transactions",
      retentionPeriod: 2555, // 7 years for financial data
      autoDelete: false,
      description: "Financial transaction records (required for tax purposes)",
    },
    {
      dataType: "audit_logs",
      retentionPeriod: 1095, // 3 years
      autoDelete: true,
      description: "System audit and security logs",
    },
    {
      dataType: "session_data",
      retentionPeriod: 30,
      autoDelete: true,
      description: "User session and login data",
    },
    {
      dataType: "analytics",
      retentionPeriod: 365, // 1 year
      autoDelete: true,
      description: "Usage analytics and performance data",
    },
    {
      dataType: "marketing_data",
      retentionPeriod: 730, // 2 years
      autoDelete: true,
      description: "Marketing preferences and communication history",
    },
  ];

  // Privacy Settings Management
  getPrivacySettings(userId: string): PrivacySettings | null {
    if (!this.isClient()) return null;

    // DEPRECADO: localStorage será removido em favor do dataService para segurança
    console.warn('PrivacyManager: localStorage está deprecado, migre para dataService');
    const data = localStorage.getItem("sua-grana-privacy-settings");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    const settings: PrivacySettings[] = data ? JSON.parse(data) : [];

    return settings.find((s) => s.userId === userId) || null;
  }

  savePrivacySettings(
    settings: Omit<PrivacySettings, "id" | "lastUpdated">,
  ): PrivacySettings {
    if (!this.isClient()) return settings as PrivacySettings;

    // DEPRECADO: localStorage será removido em favor do dataService para segurança
    console.warn('PrivacyManager: localStorage está deprecado, migre para dataService');
    const data = localStorage.getItem("sua-grana-privacy-settings");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    const allSettings: PrivacySettings[] = data ? JSON.parse(data) : [];

    const existingIndex = allSettings.findIndex(
      (s) => s.userId === settings.userId,
    );

    const newSettings: PrivacySettings = {
      ...settings,
      id:
        existingIndex >= 0 ? allSettings[existingIndex].id : this.generateId(),
      lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      allSettings[existingIndex] = newSettings;
    } else {
      allSettings.push(newSettings);
    }

    // DEPRECADO: localStorage será removido em favor do dataService para segurança
    localStorage.setItem(
      "sua-grana-privacy-settings",
      JSON.stringify(allSettings),
    );

    // Record consent
    this.recordConsent(settings.userId, "privacy_settings", true);

    return newSettings;
  }

  // Consent Management
  recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
  ): ConsentRecord {
    if (!this.isClient()) return {} as ConsentRecord;

    const consent: ConsentRecord = {
      id: this.generateId(),
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
    };

    // DEPRECADO: localStorage será removido em favor do dataService para segurança
    console.warn('PrivacyManager: localStorage está deprecado para registros de consentimento');
    // DEPRECADO: localStorage será removido em favor do dataService para segurança
    console.warn('PrivacyManager: localStorage está deprecado para histórico de consentimento');
    const data = localStorage.getItem("sua-grana-consent-records");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    const records: ConsentRecord[] = data ? JSON.parse(data) : [];

    records.push(consent);

    // Keep only last 1000 records
    if (records.length > 1000) {
      records.splice(0, records.length - 1000);
    }

    localStorage.setItem("sua-grana-consent-records", JSON.stringify(records));

    return consent;
  }

  getConsentHistory(userId: string): ConsentRecord[] {
    if (!this.isClient()) return [];

    const data = localStorage.getItem("sua-grana-consent-records");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    const records: ConsentRecord[] = data ? JSON.parse(data) : [];

    return records
      .filter((r) => r.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }

  hasValidConsent(userId: string, consentType: string): boolean {
    const history = this.getConsentHistory(userId);
    const latestConsent = history.find((r) => r.consentType === consentType);

    return latestConsent ? latestConsent.granted : false;
  }

  // Data Export
  async exportUserData(
    userId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.isClient())
        return { success: false, error: "Client-side only" };

      const settings = this.getPrivacySettings(userId);
      if (!settings?.allowDataExport) {
        return { success: false, error: "Data export not allowed" };
      }

      // Collect all user data
      const userData = {
        user: this.getUserData(userId),
        transactions: this.getUserTransactions(userId),
        accounts: this.getUserAccounts(userId),
        goals: this.getUserGoals(userId),
        trips: this.getUserTrips(userId),
        investments: this.getUserInvestments(userId),
        contacts: this.getUserContacts(userId),
        privacySettings: settings,
        consentHistory: this.getConsentHistory(userId),
        exportDate: new Date().toISOString(),
      };

      return { success: true, data: userData };
    } catch (error) {
      return { success: false, error: "Export failed" };
    }
  }

  // Data Deletion
  async deleteUserData(
    userId: string,
    dataTypes?: string[],
  ): Promise<{ success: boolean; deleted: string[]; error?: string }> {
    try {
      if (!this.isClient())
        return { success: false, deleted: [], error: "Client-side only" };

      const settings = this.getPrivacySettings(userId);
      if (!settings?.allowDataDeletion) {
        return {
          success: false,
          deleted: [],
          error: "Data deletion not allowed",
        };
      }

      const deleted: string[] = [];
      const typesToDelete = dataTypes || ["all"];

      if (
        typesToDelete.includes("all") ||
        typesToDelete.includes("transactions")
      ) {
        this.deleteUserTransactions(userId);
        deleted.push("transactions");
      }

      if (typesToDelete.includes("all") || typesToDelete.includes("accounts")) {
        this.deleteUserAccounts(userId);
        deleted.push("accounts");
      }

      if (typesToDelete.includes("all") || typesToDelete.includes("goals")) {
        this.deleteUserGoals(userId);
        deleted.push("goals");
      }

      if (typesToDelete.includes("all") || typesToDelete.includes("trips")) {
        this.deleteUserTrips(userId);
        deleted.push("trips");
      }

      if (
        typesToDelete.includes("all") ||
        typesToDelete.includes("investments")
      ) {
        this.deleteUserInvestments(userId);
        deleted.push("investments");
      }

      if (typesToDelete.includes("all") || typesToDelete.includes("contacts")) {
        this.deleteUserContacts(userId);
        deleted.push("contacts");
      }

      // Record deletion
      this.recordConsent(userId, "data_deletion", true);

      return { success: true, deleted };
    } catch (error) {
      return { success: false, deleted: [], error: "Deletion failed" };
    }
  }

  // Data Retention
  getRetentionPolicies(): DataRetentionPolicy[] {
    if (!this.isClient()) return this.defaultPolicies;

    const data = localStorage.getItem("sua-grana-retention-policies");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    return data ? JSON.parse(data) : this.defaultPolicies;
  }

  updateRetentionPolicy(policy: DataRetentionPolicy): void {
    if (!this.isClient()) return;

    const policies = this.getRetentionPolicies();
    const index = policies.findIndex((p) => p.dataType === policy.dataType);

    if (index >= 0) {
      policies[index] = policy;
    } else {
      policies.push(policy);
    }

    localStorage.setItem(
      "sua-grana-retention-policies",
      JSON.stringify(policies),
    );
  }

  async enforceRetentionPolicies(): Promise<{
    deleted: number;
    errors: string[];
  }> {
    let deleted = 0;
    const errors: string[] = [];

    try {
      const policies = this.getRetentionPolicies();
      const now = new Date();

      for (const policy of policies) {
        if (!policy.autoDelete) continue;

        const cutoffDate = new Date(
          now.getTime() - policy.retentionPeriod * 24 * 60 * 60 * 1000,
        );

        try {
          switch (policy.dataType) {
            case "audit_logs":
              deleted += this.deleteOldAuditLogs(cutoffDate);
              break;
            case "session_data":
              deleted += this.deleteOldSessionData(cutoffDate);
              break;
            case "analytics":
              deleted += this.deleteOldAnalytics(cutoffDate);
              break;
            default:
              // Custom data types can be handled here
              break;
          }
        } catch (error) {
          errors.push(
            `Failed to enforce retention for ${policy.dataType}: ${error}`,
          );
        }
      }
    } catch (error) {
      errors.push(`Retention enforcement failed: ${error}`);
    }

    return { deleted, errors };
  }

  // Helper methods for data operations
  private getUserData(userId: string): any {
    // Implementation would depend on user storage structure
    return { userId, note: "User data would be collected here" };
  }

  private getUserTransactions(userId: string): any[] {
    // Implementation would filter transactions by user
    return [];
  }

  private getUserAccounts(userId: string): any[] {
    // Implementation would filter accounts by user
    return [];
  }

  private getUserGoals(userId: string): any[] {
    // Implementation would filter goals by user
    return [];
  }

  private getUserTrips(userId: string): any[] {
    // Implementation would filter trips by user
    return [];
  }

  private getUserInvestments(userId: string): any[] {
    // Implementation would filter investments by user
    return [];
  }

  private getUserContacts(userId: string): any[] {
    // Implementation would filter contacts by user
    return [];
  }

  private deleteUserTransactions(userId: string): void {
    // Implementation would delete user transactions
  }

  private deleteUserAccounts(userId: string): void {
    // Implementation would delete user accounts
  }

  private deleteUserGoals(userId: string): void {
    // Implementation would delete user goals
  }

  private deleteUserTrips(userId: string): void {
    // Implementation would delete user trips
  }

  private deleteUserInvestments(userId: string): void {
    // Implementation would delete user investments
  }

  private deleteUserContacts(userId: string): void {
    // Implementation would delete user contacts
  }

  private deleteOldAuditLogs(cutoffDate: Date): number {
    // Implementation would delete old audit logs
    return 0;
  }

  private deleteOldSessionData(cutoffDate: Date): number {
    // Implementation would delete old session data
    return 0;
  }

  private deleteOldAnalytics(cutoffDate: Date): number {
    // Implementation would delete old analytics data
    return 0;
  }

  private getClientIP(): string {
    // In production, get actual client IP
    return "127.0.0.1";
  }

  // Initialize default settings for new users
  initializeDefaultSettings(userId: string): PrivacySettings {
    const defaultSettings: Omit<PrivacySettings, "id" | "lastUpdated"> = {
      userId,
      dataProcessingConsent: false,
      marketingConsent: false,
      analyticsConsent: false,
      dataRetentionPeriod: 2555, // 7 years default
      allowDataExport: true,
      allowDataDeletion: true,
      consentDate: new Date().toISOString(),
    };

    return this.savePrivacySettings(defaultSettings);
  }

  // Check if user needs to update consent
  needsConsentUpdate(userId: string): boolean {
    const settings = this.getPrivacySettings(userId);
    if (!settings) return true;

    const consentDate = new Date(settings.consentDate);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    return consentDate < oneYearAgo;
  }
}

export const privacyManager = PrivacyManager.getInstance();
