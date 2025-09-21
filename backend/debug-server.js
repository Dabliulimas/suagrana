console.log('🔍 Iniciando debug do servidor...');

// Registrar ts-node e tsconfig-paths
require('ts-node/register');
require('tsconfig-paths/register');

console.log('✅ TypeScript configurado');

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
  process.exit(1);
});

console.log('✅ Handlers de erro configurados');

try {
  console.log('📦 Carregando configuração...');
  const config = require('./src/config/config');
  console.log('✅ Configuração carregada');

  console.log('🗄️ Testando conexão com banco...');
  const { connectDatabases } = require('./src/config/database');
  
  connectDatabases()
    .then(() => {
      console.log('✅ Banco conectado com sucesso');
      
      console.log('🚀 Carregando servidor...');
      require('./src/server');
      console.log('✅ Servidor carregado');
    })
    .catch((error) => {
      console.error('❌ Erro ao conectar banco:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Erro durante inicialização:', error);
  process.exit(1);
}