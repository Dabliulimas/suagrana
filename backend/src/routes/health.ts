import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { redisClient } from "@/config/database";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import { config } from "@/config/config";

const router = Router();
const prisma = new PrismaClient();

// Interface para status de saúde
interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    memory: MemoryStatus;
    disk?: DiskStatus;
  };
  metrics?: {
    requestsPerMinute?: number;
    averageResponseTime?: number;
    errorRate?: number;
  };
}

interface ServiceStatus {
  status: "up" | "down" | "degraded";
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

interface MemoryStatus {
  used: number;
  total: number;
  percentage: number;
  status: "normal" | "warning" | "critical";
}

interface DiskStatus {
  used: number;
  total: number;
  percentage: number;
  status: "normal" | "warning" | "critical";
}

// Função para verificar status do PostgreSQL
async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 1000 ? "degraded" : "up",
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Database health check failed:", error);
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      lastCheck: new Date().toISOString(),
    };
  }
}

// Função para verificar status do Redis
async function checkRedis(): Promise<ServiceStatus> {
  const startTime = Date.now();
  try {
    await redisClient.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 500 ? "degraded" : "up",
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Redis health check failed:", error);
    return {
      status: "down",
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
      lastCheck: new Date().toISOString(),
    };
  }
}

// Função para verificar uso de memória
function checkMemory(): MemoryStatus {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;

  let status: "normal" | "warning" | "critical" = "normal";
  if (percentage > 90) {
    status = "critical";
  } else if (percentage > 75) {
    status = "warning";
  }

  return {
    used: usedMemory,
    total: totalMemory,
    percentage: Math.round(percentage * 100) / 100,
    status,
  };
}

// Função para determinar status geral
function determineOverallStatus(
  database: ServiceStatus,
  redis: ServiceStatus,
  memory: MemoryStatus,
): "healthy" | "degraded" | "unhealthy" {
  // Se algum serviço crítico estiver down, sistema está unhealthy
  if (database.status === "down") {
    return "unhealthy";
  }

  // Se Redis estiver down ou memória crítica, sistema está degraded
  if (redis.status === "down" || memory.status === "critical") {
    return "degraded";
  }

  // Se algum serviço estiver degraded ou memória em warning, sistema está degraded
  if (
    database.status === "degraded" ||
    redis.status === "degraded" ||
    memory.status === "warning"
  ) {
    return "degraded";
  }

  return "healthy";
}

// GET /api/health - Health check básico
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Verificar serviços em paralelo
    const [database, redis] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    const memory = checkMemory();
    const overallStatus = determineOverallStatus(database, redis, memory);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: config.server.nodeEnv,
      services: {
        database,
        redis,
        memory,
      },
    };

    const responseTime = Date.now() - startTime;

    // Log health check
    logger.info("Health check completed", {
      status: overallStatus,
      responseTime,
      services: {
        database: database.status,
        redis: redis.status,
        memory: memory.status,
      },
    });

    // Retornar status HTTP apropriado
    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json({
      success: overallStatus !== "unhealthy",
      data: healthStatus,
    });
  }),
);

// GET /api/health/live - Liveness probe (Kubernetes)
router.get(
  "/live",
  asyncHandler(async (req: Request, res: Response) => {
    // Verificação básica se o processo está rodando
    res.status(200).json({
      success: true,
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }),
);

// GET /api/health/ready - Readiness probe (Kubernetes)
router.get(
  "/ready",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Verificar se serviços críticos estão prontos
      const [database, redis] = await Promise.all([
        checkDatabase(),
        checkRedis(),
      ]);

      const isReady = database.status !== "down" && redis.status !== "down";

      if (isReady) {
        res.status(200).json({
          success: true,
          status: "ready",
          timestamp: new Date().toISOString(),
          services: {
            database: database.status,
            redis: redis.status,
          },
        });
      } else {
        res.status(503).json({
          success: false,
          status: "not_ready",
          timestamp: new Date().toISOString(),
          services: {
            database: database.status,
            redis: redis.status,
          },
        });
      }
    } catch (error) {
      logger.error("Readiness check failed:", error);
      res.status(503).json({
        success: false,
        status: "not_ready",
        error: "Internal error during readiness check",
      });
    }
  }),
);

// GET /api/health/metrics - Métricas detalhadas
router.get(
  "/metrics",
  asyncHandler(async (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      environment: {
        nodeEnv: config.server.nodeEnv,
        port: config.server.port,
      },
    };

    res.json({
      success: true,
      data: metrics,
    });
  }),
);

// GET /api/health/version - Informações de versão
router.get(
  "/version",
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        version: process.env.npm_package_version || "1.0.0",
        name: "SuaGrana Backend API",
        environment: config.server.nodeEnv,
        node: process.version,
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

export default router;
