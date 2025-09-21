const express = require('express');
const cors = require('cors');

console.log('🚀 Iniciando teste do servidor...');

const app = express();
const port = 3001;

// Middleware básico
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rota de teste para transações
app.get('/api/transactions', (req, res) => {
  res.json({ 
    success: true,
    data: [],
    message: 'Endpoint de transações funcionando'
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor de teste rodando na porta ${port}`);
  console.log(`🔗 Teste: http://localhost:${port}/api/health`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
});