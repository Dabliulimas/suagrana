import express from "express";
import dotenv from "dotenv";

// Carregar variáveis de ambiente primeiro
dotenv.config();

console.log("🚀 Iniciando servidor com database...");

try {
  // Testar importação de configurações
  const { config } = require("./src/config/config");
  console.log("✅ Config importada com sucesso");
  
  // Testar importação de database
  const { connectDatabases, disconnectDatabases } = require("./src/config/database");
  console.log("✅ Database importado com sucesso");
  
} catch (error) {
  console.error("❌ Erro ao importar:", error);
  process.exit(1);
}

const app = express();
const port = 3003; // Usar porta diferente

app.get('/', (req, res) => {
  res.json({ message: 'Servidor com database funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Servidor com database rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});