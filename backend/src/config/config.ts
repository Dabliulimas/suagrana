import dotenv from "dotenv";

dotenv.config();

interface Config {
  server: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptRounds: number;
    sessionSecret: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  cache: {
    ttl: number;
    maxItems: number;
  };
  upload: {
    maxFileSize: number;
    uploadPath: string;
  };
  email?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  monitoring: {
    healthCheckInterval: number;
    metricsEnabled: boolean;
  };
}

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

// Verificar variáveis de ambiente obrigatórias
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Variável de ambiente obrigatória não encontrada: ${envVar}`,
    );
  }
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    sessionSecret: process.env.SESSION_SECRET || "default-session-secret",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "logs/app.log",
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || "3600", 10), // 1 hora
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || "1000", 10),
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || "uploads/",
  },
  email: process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
        from: process.env.SMTP_FROM || "noreply@suagrana.com",
      }
    : undefined,
  monitoring: {
    healthCheckInterval: parseInt(
      process.env.HEALTH_CHECK_INTERVAL || "30000",
      10,
    ),
    metricsEnabled: process.env.METRICS_ENABLED === "true",
  },
};

// Validações adicionais
if (config.server.port < 1 || config.server.port > 65535) {
  throw new Error("PORT deve estar entre 1 e 65535");
}

if (config.security.bcryptRounds < 10 || config.security.bcryptRounds > 15) {
  throw new Error("BCRYPT_ROUNDS deve estar entre 10 e 15");
}

if (config.rateLimit.windowMs < 60000) {
  // Mínimo 1 minuto
  throw new Error("RATE_LIMIT_WINDOW_MS deve ser pelo menos 60000 (1 minuto)");
}

if (config.cache.ttl < 60) {
  // Mínimo 1 minuto
  throw new Error("CACHE_TTL deve ser pelo menos 60 segundos");
}

export default config;
