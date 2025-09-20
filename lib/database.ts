// Enhanced Database Service with proper session management and debugging

import { logComponents } from "../logger";
interface DatabaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface User extends DatabaseRecord {
  email: string;
  name: string;
  password_hash: string;
  role: "admin" | "user" | "viewer";
  permissions: string[];
  mfa_enabled: boolean;
  mfa_secret?: string;
  login_attempts: number;
  locked_until?: string;
  last_login?: string;
  encryption_key: string;
  is_active: boolean;
}

interface Session extends DatabaseRecord {
  user_id: string;
  token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

interface AuditLog extends DatabaseRecord {
  action: string;
  user_id?: string;
  severity: "low" | "medium" | "high" | "critical";
  ip_address?: string;
  user_agent?: string;
  details?: any;
}

class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log("🗄️ Initializing database...");

    try {
      // Initialize tables if they don't exist
      await this.initializeTables();

      // Create demo user if no users exist
      await this.createDemoUser();

      // Set system configurations
      await this.initializeSystemConfig();

      this.isInitialized = true;
      console.log("✅ Database initialized successfully");
    } catch (error) {
      logComponents.error("❌ Database initialization failed:", error);
      throw error;
    }
  }

  private async initializeTables(): Promise<void> {
    const tables = ["users", "sessions", "audit_logs", "system_config"];

    for (const table of tables) {
      if (!localStorage.getItem(`sua-grana-${table}`)) {
        localStorage.setItem(`sua-grana-${table}`, JSON.stringify([]));
        console.log(`📋 Created table: ${table}`);
      }
    }
  }

  private async createDemoUser(): Promise<void> {
    const users = await this.getAll("users");
    if (users.length === 0) {
      console.log("👤 Creating demo user...");

      // Import crypto functions
      const { hashPassword } = await import("./crypto");
      const passwordHash = await hashPassword("Demo123!");

      const demoUser: Omit<User, "id" | "created_at" | "updated_at"> = {
        email: "demo@suagrana.com",
        name: "Usuario Demo",
        password_hash: passwordHash,
        role: "admin",
        permissions: ["read:all", "write:all", "admin:all"],
        mfa_enabled: false,
        login_attempts: 0,
        encryption_key: this.generateId(),
        is_active: true,
      };

      await this.create("users", demoUser);
      console.log("✅ Demo user created: demo@suagrana.com / Demo123!");
    }
  }

  private async initializeSystemConfig(): Promise<void> {
    const configs = [
      { key: "admin_password", value: "834702" },
      { key: "app_version", value: "2.0.0" },
      { key: "security_level", value: "high" },
      { key: "session_timeout", value: "24" }, // hours
    ];

    for (const config of configs) {
      const existing = await this.getSystemConfig(config.key);
      if (!existing) {
        await this.setSystemConfig(config.key, config.value);
      }
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getTableData(tableName: string): any[] {
    if (typeof window === "undefined") return [];

    const data = localStorage.getItem(`sua-grana-${tableName}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    return data ? JSON.parse(data) : [];
  }

  private setTableData(tableName: string, data: any[]): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(`sua-grana-${tableName}`, JSON.stringify(data));
  }

  // CRUD Operations
  async create(
    tableName: string,
    data: Omit<DatabaseRecord, "id" | "created_at" | "updated_at">,
  ): Promise<DatabaseRecord> {
    const now = new Date().toISOString();
    const record: DatabaseRecord = {
      ...data,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };

    const tableData = this.getTableData(tableName);
    tableData.push(record);
    this.setTableData(tableName, tableData);

    console.log(`➕ Created record in ${tableName}:`, record.id);
    return record;
  }

  async findById(
    tableName: string,
    id: string,
  ): Promise<DatabaseRecord | null> {
    const tableData = this.getTableData(tableName);
    const record = tableData.find((item) => item.id === id);

    console.log(
      `🔍 Find by ID in ${tableName}:`,
      tableName,
      record ? "Found" : "Not found",
    );
    return record || null;
  }

  async findBy(
    tableName: string,
    criteria: Partial<DatabaseRecord>,
  ): Promise<DatabaseRecord[]> {
    const tableData = this.getTableData(tableName);
    const results = tableData.filter((item) => {
      return Object.entries(criteria).every(
        ([key, value]) => item[key] === value,
      );
    });

    console.log(
      `🔍 Find by criteria in ${tableName}: Found ${results.length} records`,
    );
    return results;
  }

  async getAll(tableName: string): Promise<DatabaseRecord[]> {
    const tableData = this.getTableData(tableName);
    console.log(`📋 Get all from ${tableName}: ${tableData.length} records`);
    return tableData;
  }

  async update(
    tableName: string,
    id: string,
    updates: Partial<DatabaseRecord>,
  ): Promise<boolean> {
    const tableData = this.getTableData(tableName);
    const index = tableData.findIndex((item) => item.id === id);

    if (index === -1) {
      console.log(`❌ Update failed - record not found in ${tableName}`);
      return false;
    }

    tableData[index] = {
      ...tableData[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.setTableData(tableName, tableData);
    console.log(`✏️ Updated record in ${tableName}`);
    return true;
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    const tableData = this.getTableData(tableName);
    const index = tableData.findIndex((item) => item.id === id);

    if (index === -1) {
      console.log(`❌ Delete failed - record not found in ${tableName}`);
      return false;
    }

    tableData.splice(index, 1);
    this.setTableData(tableName, tableData);
    console.log(`🗑️ Deleted record from ${tableName}`);
    return true;
  }

  // User-specific methods
  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.findBy("users", { email: email.toLowerCase() });
    const user = users[0] as User | undefined;

    console.log(`👤 Get user by email: ${user ? "Found user" : "Not found"}`);
    return user || null;
  }

  // Session-specific methods
  async createSession(
    userId: string,
    token: string,
    expiresAt: string,
  ): Promise<Session> {
    console.log(`🎫 Creating session for user`);

    const session = (await this.create("sessions", {
      user_id: userId,
      token,
      expires_at: expiresAt,
      ip_address: "127.0.0.1", // Mock IP
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      is_active: true,
    })) as Session;

    console.log(`✅ Session created:`, session.id);
    return session;
  }

  async getActiveSession(token: string): Promise<Session | null> {
    console.log(
      `🔍 Looking for active session with token:`,
      token.substring(0, 8) + "...",
    );

    const sessions = await this.findBy("sessions", { token, is_active: true });
    const session = sessions[0] as Session | undefined;

    if (!session) {
      console.log(`❌ No active session found for token`);
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      console.log(`⏰ Session expired:`, session.id);
      await this.update("sessions", session.id, { is_active: false });
      return null;
    }

    console.log(`✅ Active session found:`, session.id);
    return session;
  }

  // Audit logging
  async logAudit(
    auditData: Omit<AuditLog, "id" | "created_at" | "updated_at">,
  ): Promise<void> {
    const auditLog = await this.create("audit_logs", {
      ...auditData,
      ip_address: auditData.ip_address || "127.0.0.1",
      user_agent:
        auditData.user_agent ||
        (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"),
    });

    console.log(`📝 Audit log created:`, auditData.action, auditData.severity);
  }

  // System configuration
  async getSystemConfig(key: string): Promise<string | null> {
    const configs = await this.findBy("system_config", { key });
    const config = configs[0];
    return config ? config.value : null;
  }

  async setSystemConfig(key: string, value: string): Promise<void> {
    const existing = await this.findBy("system_config", { key });

    if (existing.length > 0) {
      await this.update("system_config", existing[0].id, { value });
    } else {
      await this.create("system_config", { key, value });
    }

    console.log(`⚙️ System config set:`, key, value);
  }

  // Database maintenance
  async vacuum(): Promise<void> {
    console.log("🧹 Running database vacuum...");

    // Clean up expired sessions
    const sessions = await this.getAll("sessions");
    const now = new Date();
    let cleanedSessions = 0;

    for (const session of sessions) {
      if (new Date(session.expires_at) < now) {
        await this.update("sessions", session.id, { is_active: false });
        cleanedSessions++;
      }
    }

    // Clean up old audit logs (keep last 1000)
    const auditLogs = await this.getAll("audit_logs");
    if (auditLogs.length > 1000) {
      const sortedLogs = auditLogs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const logsToDelete = sortedLogs.slice(1000);

      for (const log of logsToDelete) {
        await this.delete("audit_logs", log.id);
      }

      console.log(`🗑️ Cleaned up ${logsToDelete.length} old audit logs`);
    }

    console.log(
      `✅ Database vacuum completed. Cleaned ${cleanedSessions} expired sessions`,
    );
  }

  // Database statistics
  async getStats(): Promise<any> {
    const stats = {
      users: (await this.getAll("users")).length,
      activeSessions: (await this.findBy("sessions", { is_active: true }))
        .length,
      auditLogs: (await this.getAll("audit_logs")).length,
      systemConfigs: (await this.getAll("system_config")).length,
      lastVacuum: (await this.getSystemConfig("last_vacuum")) || "Never",
    };

    console.log("📊 Database stats:", stats);
    return stats;
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const data = {
      users: await this.getAll("users"),
      sessions: await this.getAll("sessions"),
      audit_logs: await this.getAll("audit_logs"),
      system_config: await this.getAll("system_config"),
      exported_at: new Date().toISOString(),
      version: "2.0.0",
    };

    console.log("📤 Data exported");
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);

      // Validate data structure
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error("Invalid data format");
      }

      // Clear existing data (be careful!)
      const tables = ["users", "sessions", "audit_logs", "system_config"];
      for (const table of tables) {
        this.setTableData(table, []);
      }

      // Import data
      for (const table of tables) {
        if (data[table]) {
          this.setTableData(table, data[table]);
        }
      }

      console.log("📥 Data imported successfully");
      return true;
    } catch (error) {
      logComponents.error("❌ Data import failed:", error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const stats = await this.getStats();
      const demoUser = await this.getUserByEmail("demo@suagrana.com");

      const health = {
        status: "healthy",
        details: {
          initialized: this.isInitialized,
          demoUserExists: !!demoUser,
          stats,
          timestamp: new Date().toISOString(),
        },
      };

      console.log("🏥 Health check passed");
      return health;
    } catch (error) {
      logComponents.error("❌ Health check failed:", error);
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}

export const database = DatabaseService.getInstance();
