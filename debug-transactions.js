// Debug script para verificar transações no localStorage
console.log('=== DEBUG TRANSAÇÕES ===');

// Verificar todas as chaves do localStorage
console.log('Chaves no localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`- ${key}`);
}

// Verificar transações especificamente
const possibleKeys = [
  'transactions',
  'sua-grana-transactions',
  'suagrana-transactions',
  'financial-transactions'
];

possibleKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`\n${key}:`, {
        length: Array.isArray(parsed) ? parsed.length : 'não é array',
        data: parsed
      });
    } catch (e) {
      console.log(`\n${key}: erro ao parsear`, data);
    }
  } else {
    console.log(`\n${key}: não encontrado`);
  }
});

// Verificar se há dados no localDataService
try {
  const localDataService = window.localDataService;
  if (localDataService) {
    console.log('\nLocalDataService transactions:', localDataService.getTransactions());
  }
} catch (e) {
  console.log('\nLocalDataService não disponível:', e.message);
}

console.log('=== FIM DEBUG ===');