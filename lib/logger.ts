/**
 * Centralized logging system for the application
 * @migrated Uses new unified logging system
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
  userId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLevel: LogLevel =
    process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO;

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    component?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
      userId: this.getCurrentUserId(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // In a real app, this would get the current user ID
    return "anonymous";
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // In production, send critical logs to external service
    if (
      process.env.NODE_ENV === "production" &&
      entry.level >= LogLevel.ERROR
    ) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // In a real app, this would send to your logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    // For production, external service would handle logging instead of console
  }

  debug(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.formatMessage(LogLevel.DEBUG, message, data, component);
    this.addLog(entry);
    if (typeof window !== 'undefined') {
      console.debug(`DEBUG ${component || "APP"}: ${message}`, data);
    }
  }

  info(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.formatMessage(LogLevel.INFO, message, data, component);
    this.addLog(entry);
    if (typeof window !== 'undefined') {
      console.info(`INFO ${component || "APP"}: ${message}`, data);
    }
  }

  warn(message: string, data?: any, component?: string) {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.formatMessage(LogLevel.WARN, message, data, component);
    this.addLog(entry);
    if (typeof window !== 'undefined') {
      console.warn(`WARN ${component || "APP"}: ${message}`, data);
    }
  }

  error(message: string, error?: Error | any, component?: string) {
    const entry = this.formatMessage(LogLevel.ERROR, message, error, component);
    this.addLog(entry);
    if (typeof window !== 'undefined') {
      console.error(`ERROR ${component || "APP"}: ${message}`, error);
    }
  }

  // Performance logging
  time(label: string, component?: string) {
    if (typeof window !== 'undefined') {
      console.time(`TIME ${component || "APP"}: ${label}`);
    }
  }

  timeEnd(label: string, component?: string) {
    if (typeof window !== 'undefined') {
      console.timeEnd(`TIME ${component || "APP"}: ${label}`);
    }
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level);
    }
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Set log level
  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, data?: any, component?: string) =>
    logger.debug(message, data, component),
  info: (message: string, data?: any, component?: string) =>
    logger.info(message, data, component),
  warn: (message: string, data?: any, component?: string) =>
    logger.warn(message, data, component),
  error: (message: string, error?: Error | any, component?: string) =>
    logger.error(message, error, component),
  time: (label: string, component?: string) => logger.time(label, component),
  timeEnd: (label: string, component?: string) =>
    logger.timeEnd(label, component),
};

// Export logComponents for backwards compatibility
export const logComponents = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  time: logger.time.bind(logger),
  timeEnd: logger.timeEnd.bind(logger),
};

// React hook for component logging
export function useLogger(componentName: string) {
  return {
    debug: (message: string, data?: any) =>
      logger.debug(message, data, componentName),
    info: (message: string, data?: any) =>
      logger.info(message, data, componentName),
    warn: (message: string, data?: any) =>
      logger.warn(message, data, componentName),
    error: (message: string, error?: Error | any) =>
      logger.error(message, error, componentName),
    time: (label: string) => logger.time(label, componentName),
    timeEnd: (label: string) => logger.timeEnd(label, componentName),
  };
}
