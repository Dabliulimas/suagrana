# Guia de Migração de Testes

Este guia explica como migrar testes existentes para usar as novas APIs e estruturas modernizadas do sistema.

## 🚀 O que foi migrado?

### 1. Sistema de Storage
- **Antes**: `storage.getTransactions()`, `storage.getAccounts()`
- **Agora**: `localDataService.getTransactions()`, `localDataService.getAccounts()`

### 2. Validadores
- **Antes**: `SystemValidator` retornava estrutura personalizada
- **Agora**: `SystemValidatorWrapper` retorna formato padronizado compatível

### 3. Componentes React
- **Antes**: Componentes falhavam por falta de providers
- **Agora**: Setup automático com `QueryClientProvider` e outros providers

## 📝 Como migrar seus testes

### 1. Importações

```javascript
// ❌ ANTES
const { storage } = require('../lib/storage');
const { systemValidator } = require('../lib/system-validator');

// ✅ AGORA
import { localDataService } from '../lib/services/local-data-service';
import { systemValidator } from '../lib/system-validator-wrapper';
import { render, setupTest, cleanupTest, mockData } from '../tests/setup/test-utils';
```

### 2. Setup/Teardown dos testes

```javascript
// ❌ ANTES
beforeEach(() => {
  localStorage.clear();
});

// ✅ AGORA
beforeEach(() => {
  setupTest(); // Configura mocks, localStorage, console
});

afterEach(() => {
  cleanupTest(); // Limpa mocks e restaura console
});
```

### 3. Acesso aos dados

```javascript
// ❌ ANTES
const accounts = storage.getAccounts();
const transactions = storage.getTransactions();
storage.saveAccount(account);

// ✅ AGORA
const accounts = localDataService.getAccounts();
const transactions = localDataService.getTransactions();
localDataService.saveAccounts([account]);
```

### 4. Validação do sistema

```javascript
// ❌ ANTES
const result = await systemValidator.validateSystem();
// result tinha estrutura inconsistente

// ✅ AGORA
const result = await systemValidator.validateSystem();
expect(result).toHaveProperty('score');
expect(result).toHaveProperty('issues');
expect(result).toHaveProperty('categories');
expect(result).toHaveProperty('summary');
```

### 5. Testes de componentes React

```javascript
// ❌ ANTES
import { render } from '@testing-library/react';

test('componente', () => {
  render(<MyComponent />); // Falhava por falta de providers
});

// ✅ AGORA
import { render } from '../tests/setup/test-utils'; // Render customizado

test('componente', () => {
  render(<MyComponent />); // Funciona com todos os providers
});
```

### 6. Geração de dados de teste

```javascript
// ❌ ANTES
const transaction = {
  id: '1',
  amount: -150.5,
  description: 'Test',
  // ... muitos campos manuais
};

// ✅ AGORA
const transaction = mockData.transaction({
  amount: -150.5,
  description: 'Test',
  // Outros campos são preenchidos automaticamente
});
```

## 🔧 APIs modernas disponíveis

### LocalDataService
```javascript
// Métodos principais
localDataService.getAccounts()
localDataService.saveAccounts(accounts)
localDataService.getTransactions()
localDataService.saveTransactions(transactions)
localDataService.getGoals()
localDataService.saveGoals(goals)
localDataService.getInvestments()
localDataService.saveInvestments(investments)
localDataService.getTrips()
localDataService.saveTrips(trips)

// Métodos de backup/restore
localDataService.getDataExport()
localDataService.importData(data)
localDataService.clearAllData()

// Utilidades
localDataService.getStats()
localDataService.getDataSize()
localDataService.isAvailable()
```

### SystemValidatorWrapper
```javascript
const result = await systemValidator.validateSystem();

// Estrutura padronizada:
{
  score: number, // 0-100
  issues: [
    {
      id: string,
      type: string,
      severity: 'critical' | 'high' | 'medium' | 'low',
      category: string,
      description: string,
      autoFixable: boolean
    }
  ],
  categories: {
    accounts: ValidationResult,
    transactions: ValidationResult,
    goals: ValidationResult,
    // ...
  },
  summary: {
    totalIssues: number,
    criticalIssues: number,
    highIssues: number,
    mediumIssues: number,
    lowIssues: number
  }
}
```

### Test Utils
```javascript
// Setup/cleanup
setupTest() // Configura mocks e ambiente
cleanupTest() // Limpa tudo

// Geradores de dados
mockData.transaction(overrides?)
mockData.account(overrides?)
mockData.goal(overrides?)
mockData.investment(overrides?)
mockData.trip(overrides?)

// Utilitários
testUtils.generateDate(daysAgo?)
testUtils.generateCategory()
testUtils.generateAccount()
testUtils.generateAmount(min?, max?)

// Render com providers
render(component) // Inclui QueryClient, Toast, etc
```

## ⚠️ Problemas comuns e soluções

### 1. Testes assíncronos
```javascript
// ❌ PROBLEMA: Teste síncrono com API assíncrona
const result = systemValidator.validateSystem(); // sem await

// ✅ SOLUÇÃO: Adicionar async/await
const result = await systemValidator.validateSystem();
```

### 2. Mock de localStorage
```javascript
// ❌ PROBLEMA: localStorage não mockado
localStorage.getItem('key');

// ✅ SOLUÇÃO: Usar setupTest()
beforeEach(() => {
  setupTest(); // Mocka localStorage automaticamente
});
```

### 3. Console noise nos testes
```javascript
// ❌ PROBLEMA: Muitos warnings e logs
// console.warn: DEPRECATED: getTransactions...

// ✅ SOLUÇÃO: setupTest() silencia console
beforeEach(() => {
  setupTest(); // Mocka console.warn, console.error
});
```

### 4. Componentes sem providers
```javascript
// ❌ PROBLEMA: No QueryClient set, use QueryClientProvider
render(<ComponentWithQuery />);

// ✅ SOLUÇÃO: Usar render customizado
import { render } from '../tests/setup/test-utils';
render(<ComponentWithQuery />); // Providers incluídos
```

## 📋 Checklist de migração

- [ ] Atualizar importações para usar novos serviços
- [ ] Trocar `storage` por `localDataService`
- [ ] Usar `systemValidator` wrapper ao invés do original
- [ ] Adicionar `setupTest()` e `cleanupTest()`
- [ ] Usar `mockData` para gerar dados de teste
- [ ] Importar `render` do test-utils ao invés do @testing-library
- [ ] Adicionar `async/await` onde necessário
- [ ] Testar se testes passam com as mudanças

## 🎯 Próximos passos

1. **Migrar testes críticos primeiro**: Comece pelos testes mais importantes
2. **Executar suíte regularmente**: `npm test` para verificar progressos
3. **Usar exemplo como referência**: Consulte `tests/examples/updated-test-example.test.js`
4. **Documentar casos especiais**: Adicione casos específicos do seu projeto

## 💡 Dicas

- Use o VS Code com extensão Jest para execução individual de testes
- Mantenha dados de teste pequenos e focados no que está sendo testado
- Prefira `mockData` ao invés de objetos manuais
- Teste tanto cenários de sucesso quanto de erro
- Use `describe` para agrupar testes relacionados logicamente
