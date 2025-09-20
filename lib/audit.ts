export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

class AuditLogger {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  async log(
    entry: Omit<AuditLog, "id" | "timestamp" | "severity"> & {
      severity?: AuditLog["severity"];
    },
  ): Promise<void> {
    if (!this.isClient()) return;

    const auditEntry: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity: entry.severity || this.determineSeverity(entry.action),
      ...entry,
    };

    const logs = this.getLogs();
    logs.push(auditEntry);

    // Keep only last 10000 logs
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("sua-grana-audit-logs", JSON.stringify(logs));
    }

    // Log critical events to console
    if (auditEntry.severity === "critical") {
      console.warn("CRITICAL AUDIT EVENT:", auditEntry);
    }
  }

  getLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    severity?: AuditLog["severity"];
  }): AuditLog[] {
    if (!this.isClient()) return [];

    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    const data = localStorage.getItem("sua-grana-audit-logs");
    let logs: AuditLog[] = data ? JSON.parse(data) : [];

    if (filters) {
      logs = logs.filter((log) => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.severity && log.severity !== filters.severity) return false;
        if (filters.startDate && log.timestamp < filters.startDate)
          return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        return true;
      });
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  getSecurityEvents(): AuditLog[] {
    return this.getLogs().filter((log) =>
      [
        "USER_LOGIN",
        "USER_LOGOUT",
        "LOGIN_FAILED",
        "MFA_ENABLED",
        "ROLE_CHANGED",
        "PERMISSION_DENIED",
      ].includes(log.action),
    );
  }

  getFinancialEvents(): AuditLog[] {
    return this.getLogs().filter((log) =>
      [
        "TRANSACTION_CREATED",
        "TRANSACTION_UPDATED",
        "TRANSACTION_DELETED",
        "INVESTMENT_CREATED",
        "GOAL_UPDATED",
      ].includes(log.action),
    );
  }

  private determineSeverity(action: string): AuditLog["severity"] {
    const criticalActions = [
      "LOGIN_FAILED",
      "PERMISSION_DENIED",
      "DATA_BREACH",
      "UNAUTHORIZED_ACCESS",
    ];
    const highActions = [
      "USER_ROLE_UPDATED",
      "TRANSACTION_DELETED",
      "LARGE_TRANSACTION",
    ];
    const mediumActions = [
      "USER_LOGIN",
      "USER_LOGOUT",
      "TRANSACTION_CREATED",
      "INVESTMENT_CREATED",
    ];

    if (criticalActions.includes(action)) return "critical";
    if (highActions.includes(action)) return "high";
    if (mediumActions.includes(action)) return "medium";
    return "low";
  }

  exportLogs(format: "json" | "csv" = "json"): string {
    const logs = this.getLogs();

    if (format === "csv") {
      const headers = [
        "ID",
        "Action",
        "User ID",
        "Timestamp",
        "Severity",
        "IP Address",
        "Details",
      ];
      const rows = logs.map((log) => [
        log.id,
        log.action,
        log.userId || "",
        log.timestamp,
        log.severity,
        log.ipAddress || "",
        JSON.stringify(log.details),
      ]);

      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }

    return JSON.stringify(logs, null, 2);
  }
}

export const auditLogger = new AuditLogger();
export const auditLog = auditLogger; // Alias for compatibility

// Export the class as well for type checking
export { AuditLogger };
