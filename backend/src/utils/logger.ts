import winston from "winston";
import path from "path";
import fs from "fs";
import { config } from "@/config/config";

// Criar diretório de logs se não existir
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint(),
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Adicionar metadados se existirem
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  }),
);

// Configurar transports
const transports: winston.transport[] = [
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: config.logging.file,
    level: config.logging.level,
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),

  // Arquivo separado para erros
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),
];

// Adicionar console apenas em desenvolvimento
if (config.server.nodeEnv === "development") {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      format: consoleFormat,
    }),
  );
}

// Criar logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false,
  // Capturar exceções não tratadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: logFormat,
    }),
  ],
  // Capturar rejeições não tratadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
      format: logFormat,
    }),
  ],
});

// Métodos de conveniência para logging estruturado
export const loggerUtils = {
  // Log de requisição HTTP
  logRequest: (req: any, res: any, responseTime?: number) => {
    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      userId: req.user?.id,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
    });
  },

  // Log de operação de banco de dados
  logDatabase: (
    operation: string,
    table: string,
    duration?: number,
    error?: any,
  ) => {
    if (error) {
      logger.error("Database Error", {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.debug("Database Operation", {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
      });
    }
  },

  // Log de autenticação
  logAuth: (
    action: string,
    userId?: string,
    email?: string,
    success: boolean = true,
    error?: any,
  ) => {
    const logData = {
      action,
      userId,
      email,
      success,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      logger.info("Authentication Success", logData);
    } else {
      logger.warn("Authentication Failed", {
        ...logData,
        error: error?.message,
      });
    }
  },

  // Log de operação financeira
  logFinancial: (
    operation: string,
    userId: string,
    amount?: number,
    accountId?: string,
    transactionId?: string,
  ) => {
    logger.info("Financial Operation", {
      operation,
      userId,
      amount,
      accountId,
      transactionId,
      timestamp: new Date().toISOString(),
    });
  },

  // Log de erro de validação
  logValidation: (field: string, value: any, rule: string, userId?: string) => {
    logger.warn("Validation Error", {
      field,
      value: typeof value === "object" ? JSON.stringify(value) : value,
      rule,
      userId,
    });
  },

  // Log de performance
  logPerformance: (operation: string, duration: number, metadata?: any) => {
    const level = duration > 1000 ? "warn" : "info"; // Warn se > 1s

    logger.log(level, "Performance Metric", {
      operation,
      duration: `${duration}ms`,
      slow: duration > 1000,
      ...metadata,
    });
  },

  // Log de cache
  logCache: (
    operation: "hit" | "miss" | "set" | "delete",
    key: string,
    ttl?: number,
  ) => {
    logger.debug("Cache Operation", {
      operation,
      key,
      ttl: ttl ? `${ttl}s` : undefined,
    });
  },

  // Log de segurança
  logSecurity: (
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    details: any,
  ) => {
    const logLevel =
      severity === "critical" ? "error" : severity === "high" ? "warn" : "info";

    logger.log(logLevel, "Security Event", {
      event,
      severity,
      ...details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Middleware para capturar logs de requisição
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    loggerUtils.logRequest(req, res, duration);
  });

  next();
};

export default logger;
