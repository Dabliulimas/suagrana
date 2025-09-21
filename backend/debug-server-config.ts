import express from "express";
import dotenv from "dotenv";

// Carregar variáveis de ambiente primeiro
dotenv.config();

console.log("🚀 Iniciando servidor com config...");

try {
  // Testar importação de configurações
  const { config } = require("./src/config/config");
  console.log("✅ Config importada com sucesso");
  console.log("📊 Config:", {
    server: config.server,
    database: config.database?.type
  });
} catch (error) {
  console.error("❌ Erro ao importar config:", error);
  process.exit(1);
}

const app = express();
const port = 3002; // Usar porta diferente

app.get('/', (req, res) => {
  res.json({ message: 'Servidor com config funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Servidor com config rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});