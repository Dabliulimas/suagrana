import express from "express";
import cors from "cors";
import { config } from "@/config/config";
import { authMiddleware, optionalAuthMiddleware } from "@/middleware/auth";
import { errorHandler } from "@/middleware/errorHandler";

const app = express();

// Middleware básico
app.use(
  cors({
    origin: config.server.corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste sem autenticação
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// Rota de teste da configuração JWT
app.get("/test-config", (req, res) => {
  res.json({
    jwtConfigured: !!(config.jwt.secret && config.jwt.refreshSecret),
    jwtSecretLength: config.jwt.secret?.length || 0,
    jwtRefreshSecretLength: config.jwt.refreshSecret?.length || 0,
  });
});

// Rota de teste com autenticação opcional
app.get("/test-optional-auth", optionalAuthMiddleware, (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user || null,
    message: req.user ? `Olá, ${req.user.name}!` : "Usuário não autenticado",
  });
});

// Rota de teste com autenticação obrigatória
app.get("/test-auth", authMiddleware, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
    message: `Olá, ${req.user?.name}! Você está autenticado.`,
  });
});

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${config.server.nodeEnv}`);
  console.log(`🔗 CORS Origin: ${config.server.corsOrigin}`);
  console.log(
    `🔑 JWT Configurado: ${!!(config.jwt.secret && config.jwt.refreshSecret)}`,
  );
  console.log(`✅ Servidor iniciado com sucesso!`);
  console.log(`\n📋 Rotas disponíveis:`);
  console.log(`   GET /health - Status do servidor`);
  console.log(`   GET /test-config - Configuração JWT`);
  console.log(`   GET /test-optional-auth - Teste autenticação opcional`);
  console.log(`   GET /test-auth - Teste autenticação obrigatória`);
});

export default app;
