import express from "express";
import dotenv from "dotenv";

// Carregar variáveis de ambiente primeiro
dotenv.config();

console.log("🚀 Iniciando servidor minimal...");
console.log("📁 Diretório atual:", process.cwd());
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
console.log("🔧 PORT:", process.env.PORT || 3001);

const app = express();
const port = Number(process.env.PORT) || 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Servidor minimal funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Servidor minimal rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});