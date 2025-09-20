/**
 * Sistema centralizado de logging
 * Proporciona controle centralizado sobre todos os logs do sistema
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = 'DataLayer' | 'SyncManager' | 'UnifiedContext' | 'Components' | 'General';

interface LogEntry {
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  timestamp: Date;
}

class SystemLogger {
  private isDev = process.env.NODE_ENV === 'development';
  private enabledLevels: LogLevel[] = this.isDev 
    ? ['debug', 'info', 'warn', 'error'] 
    : ['warn', 'error'];
  
  private enabledContexts: LogContext[] = ['DataLayer', 'SyncManager', 'UnifiedContext', 'Components', 'General'];
  
  // Lista de mensagens para filtrar (spam)
  private filteredMessages: string[] = [
    'Network connection failed',
    'fetch',
    'Unknown error',
    '{}',
    'undefined'
  ];

  private shouldLog(level: LogLevel, context: LogContext, message: string): boolean {
    // Verificar se o nível está habilitado
    if (!this.enabledLevels.includes(level)) {
      return false;
    }

    // Verificar se o contexto está habilitado
    if (!this.enabledContexts.includes(context)) {
      return false;
    }

    // Filtrar mensagens de spam
    if (this.filteredMessages.some(filtered => message.includes(filtered))) {
      return false;
    }

    return true;
  }

  private formatMessage(entry: LogEntry): string {
    const time = entry.timestamp.toISOString().substring(11, 19);
    return `[${time}] ${entry.context}: ${entry.message}`;
  }

  private logToConsole(entry: LogEntry): void {
    const formatted = this.formatMessage(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted, entry.data);
        break;
      case 'info':
        console.info(formatted, entry.data);
        break;
      case 'warn':
        console.warn(formatted, entry.data);
        break;
      case 'error':
        console.error(formatted, entry.data);
        break;
    }
  }

  public log(level: LogLevel, context: LogContext, message: string, data?: any): void {
    if (!this.shouldLog(level, context, message)) {
      return;
    }

    const entry: LogEntry = {
      level,
      context,
      message,
      data,
      timestamp: new Date()
    };

    this.logToConsole(entry);
  }

  public debug(context: LogContext, message: string, data?: any): void {
    this.log('debug', context, message, data);
  }

  public info(context: LogContext, message: string, data?: any): void {
    this.log('info', context, message, data);
  }

  public warn(context: LogContext, message: string, data?: any): void {
    this.log('warn', context, message, data);
  }

  public error(context: LogContext, message: string, data?: any): void {
    this.log('error', context, message, data);
  }

  // Configuração dinâmica
  public setEnabledLevels(levels: LogLevel[]): void {
    this.enabledLevels = levels;
  }

  public setEnabledContexts(contexts: LogContext[]): void {
    this.enabledContexts = contexts;
  }

  public addFilteredMessage(message: string): void {
    if (!this.filteredMessages.includes(message)) {
      this.filteredMessages.push(message);
    }
  }

  public removeFilteredMessage(message: string): void {
    this.filteredMessages = this.filteredMessages.filter(m => m !== message);
  }
}

// Instância singleton
export const logger = new SystemLogger();

// Helper functions para contextos específicos
export const logDataLayer = {
  debug: (message: string, data?: any) => logger.debug('DataLayer', message, data),
  info: (message: string, data?: any) => logger.info('DataLayer', message, data),
  warn: (message: string, data?: any) => logger.warn('DataLayer', message, data),
  error: (message: string, data?: any) => logger.error('DataLayer', message, data),
};

export const logSyncManager = {
  debug: (message: string, data?: any) => logger.debug('SyncManager', message, data),
  info: (message: string, data?: any) => logger.info('SyncManager', message, data),
  warn: (message: string, data?: any) => logger.warn('SyncManager', message, data),
  error: (message: string, data?: any) => logger.error('SyncManager', message, data),
};

export const logUnifiedContext = {
  debug: (message: string, data?: any) => logger.debug('UnifiedContext', message, data),
  info: (message: string, data?: any) => logger.info('UnifiedContext', message, data),
  warn: (message: string, data?: any) => logger.warn('UnifiedContext', message, data),
  error: (message: string, data?: any) => logger.error('UnifiedContext', message, data),
};

export const logComponents = {
  debug: (message: string, data?: any) => logger.debug('Components', message, data),
  info: (message: string, data?: any) => logger.info('Components', message, data),
  warn: (message: string, data?: any) => logger.warn('Components', message, data),
  error: (message: string, data?: any) => logger.error('Components', message, data),
};
