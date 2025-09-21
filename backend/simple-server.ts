import express from 'express';

console.log('🚀 Iniciando servidor TypeScript simples...');

const app = express();
const port = 3002;

app.get('/', (req, res) => {
  res.json({ message: 'Servidor TypeScript funcionando!' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor TypeScript rodando na porta ${port}`);
});