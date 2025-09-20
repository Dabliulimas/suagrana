import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
// Importar configurações
import { config } from "@/config/config";
// import { logger } from '@/utils/logger';
import { errorHandler } from "@/middleware/errorHandler";
import { authMiddleware } from "@/middleware/auth";
import { connectDatabases, disconnectDatabases } from "@/config/database";

// Importar rotas
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/users";
import accountRoutes from "@/routes/accounts";
import transactionRoutes from "@/routes/transactions";
import investmentRoutes from "@/routes/investments";
import goalRoutes from "@/routes/goals";
import reportRoutes from "@/routes/reports";
import contactRoutes from "@/routes/contacts";
// import categoriesRoutes from "@/routes/categories";
import healthRoutes from "@/routes/health";
import testRoutes from "@/routes/test";

// Carregar variáveis de ambiente primeiro
dotenv.config();

// Logs de depuração
console.log("🚀 Iniciando servidor principal...");
console.log("📁 Diretório atual:", process.cwd());
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
console.log(
  "🔑 DATABASE_URL:",
  process.env.DATABASE_URL ? "Configurado" : "Não configurado",
);
console.log("🔧 PORT:", process.env.PORT || 3002);

// Os clientes de banco de dados agora estão em @/config/database

class Server {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Segurança
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }),
    );

    // CORS
    this.app.use(
      cors({
        origin: config.server.corsOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Cookie"],
        exposedHeaders: ["Set-Cookie"],
      }),
    );

    // Compressão
    this.app.use(compression());

    // Logging
    this.app.use(
      morgan("combined", {
        stream: {
          write: (message: string) => console.log(message.trim()),
        },
      }),
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: "Muitas requisições. Tente novamente em alguns minutos.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Cookie parsing
    this.app.use(cookieParser());

    // Trust proxy
    this.app.set("trust proxy", 1);
  }

  private initializeRoutes(): void {
    // Health check (sem autenticação)
    this.app.use("/api/health", healthRoutes);

    // Rotas de teste (sem autenticação)
    this.app.use("/api/test", testRoutes);

    // Rotas de autenticação (sem middleware de auth)
    this.app.use("/api/auth", authRoutes);

    // Rota raiz da API
    this.app.get("/api", (req, res) => {
      res.json({
        success: true,
        message: "SuaGrana API está funcionando!",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
          health: "/api/health",
          auth: "/api/auth",
          users: "/api/users",
          accounts: "/api/accounts",
          transactions: "/api/transactions",
          investments: "/api/investments",
          goals: "/api/goals",
          reports: "/api/reports",
          contacts: "/api/contacts",
        },
      });
    });

    // Rotas sem autenticação (acesso direto)
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/accounts", accountRoutes);
    this.app.use("/api/transactions", transactionRoutes);
    // this.app.use("/api/categories", categoriesRoutes);
    this.app.use("/api/investments", investmentRoutes);
    this.app.use("/api/goals", goalRoutes);
    this.app.use("/api/reports", reportRoutes);
    this.app.use("/api/contacts", contactRoutes);

    // Rota 404
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Endpoint não encontrado",
        code: "ENDPOINT_NOT_FOUND",
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Conectar aos bancos de dados
      await connectDatabases();

      // Iniciar servidor
      this.app.listen(this.port, () => {
        console.log(`🚀 Servidor rodando na porta ${this.port}`);
        console.log(`📊 Ambiente: ${config.server.nodeEnv}`);
        console.log(`🔗 CORS habilitado para: ${config.server.corsOrigin}`);
      });
    } catch (error) {
      console.error("❌ Erro ao iniciar servidor:", error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await disconnectDatabases();
      console.log("🛑 Servidor encerrado graciosamente");
    } catch (error) {
      console.error("❌ Erro ao encerrar servidor:", error);
    }
  }
}

// Inicializar servidor
const server = new Server();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Recebido SIGTERM, encerrando servidor...");
  await server.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Recebido SIGINT, encerrando servidor...");
  await server.stop();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Iniciar servidor
server.start();

export default server;
