// Script para adicionar dados de teste de viagens no localStorage
// Execute no console do navegador: fetch('/test-trips-data.js').then(r => r.text()).then(eval)

console.log('🧪 Adicionando dados de teste para viagens...');

// Dados de teste para viagens
const testTrips = [
  {
    id: 'trip-001',
    name: 'Viagem para São Paulo',
    destination: 'São Paulo, SP',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    budget: 2000,
    spent: 800,
    participants: ['Eu', 'Maria'],
    description: 'Viagem de negócios para São Paulo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'trip-002', 
    name: 'Férias no Rio',
    destination: 'Rio de Janeiro, RJ',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'planned',
    budget: 5000,
    spent: 0,
    participants: ['Eu', 'João', 'Ana'],
    description: 'Férias em família no Rio de Janeiro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'trip-003',
    name: 'Workshop em Curitiba', 
    destination: 'Curitiba, PR',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    budget: 1500,
    spent: 200,
    participants: ['Eu'],
    description: 'Workshop de desenvolvimento web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

try {
  // Salvar em ambas as chaves possíveis
  localStorage.setItem('trips', JSON.stringify(testTrips));
  localStorage.setItem('sua-grana-trips', JSON.stringify(testTrips));
  
  console.log('✅ Dados de viagens salvos com sucesso!');
  console.log(`📊 ${testTrips.length} viagens adicionadas:`);
  testTrips.forEach(trip => {
    console.log(`  - ${trip.name} (${trip.status})`);
  });
  
  // Verificar se os dados foram salvos
  const saved = localStorage.getItem('trips');
  const parsed = JSON.parse(saved);
  console.log(`🔍 Verificação: ${parsed.length} viagens no localStorage`);
  
} catch (error) {
  console.error('❌ Erro ao salvar dados de viagens:', error);
}

console.log('🎯 Script de teste de viagens concluído!');
