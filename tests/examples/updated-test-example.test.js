/**
 * Exemplo de teste atualizado para usar as APIs modernas
 * Este arquivo mostra como migrar testes antigos para usar:
 * - LocalDataService ao invés do storage antigo
 * - SystemValidatorWrapper para formato compatível
 * - Setup de testes com providers React
 */

import { render, screen, setupTest, cleanupTest, mockData } from '../setup/test-utils';
import { systemValidator } from '../../lib/system-validator-wrapper';
import { localDataService } from '../../lib/services/local-data-service';

describe('Exemplo de Teste Atualizado', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    cleanupTest();
  });

  describe('Validação do Sistema (Moderno)', () => {
    test('deve executar validação completa do sistema', async () => {
      // Setup dos dados usando localDataService
      const testAccounts = [
        mockData.account({ id: '1', name: 'Conta Corrente', balance: 1500 }),
        mockData.account({ id: '2', name: 'Poupança', balance: 5000 }),
      ];
      
      const testTransactions = [
        mockData.transaction({ id: '1', account: 'Conta Corrente', amount: -150.5 }),
        mockData.transaction({ id: '2', account: 'Conta Corrente', amount: 3000, type: 'income' }),
      ];

      // Mockar dados no localStorage
      localDataService.saveAccounts(testAccounts);
      localDataService.saveTransactions(testTransactions);

      // Executar validação usando o wrapper moderno
      const result = await systemValidator.validateSystem();

      // Verificações usando formato padronizado
      expect(result).toBeDefined();
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('summary');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);

      // Verificar estrutura do summary
      expect(result.summary).toHaveProperty('totalIssues');
      expect(result.summary).toHaveProperty('criticalIssues');
      expect(result.summary).toHaveProperty('highIssues');
    });

    test('deve processar dados usando LocalDataService', () => {
      // Teste de integração com o novo serviço
      const testData = [
        mockData.account(),
        mockData.account({ name: 'Poupança', balance: 2000 }),
      ];

      // Salvar usando novo serviço
      localDataService.saveAccounts(testData);

      // Recuperar e verificar
      const retrieved = localDataService.getAccounts();
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].name).toBe('Conta Corrente');
      expect(retrieved[1].name).toBe('Poupança');
    });
  });

  describe('Migração de Testes Legacy', () => {
    test('exemplo de como migrar teste antigo', async () => {
      // ❌ ANTES (não funciona mais):
      // const result = storage.getTransactions();
      // const accounts = storage.getAccounts();
      
      // ✅ AGORA (novo formato):
      const transactions = localDataService.getTransactions();
      const accounts = localDataService.getAccounts();
      
      // Testes funcionam normalmente
      expect(Array.isArray(transactions)).toBe(true);
      expect(Array.isArray(accounts)).toBe(true);
    });

    test('exemplo de validação com estrutura atualizada', async () => {
      // Preparar dados de teste
      const mockAccounts = [mockData.account()];
      localDataService.saveAccounts(mockAccounts);

      // ❌ ANTES:
      // const result = await systemValidator.validateSystem();
      // expect(result.issues.filter(i => i.category === 'accounts')).toBeDefined();

      // ✅ AGORA:
      const result = await systemValidator.validateSystem();
      const accountIssues = result.issues.filter(i => i.category === 'accounts');
      
      expect(accountIssues).toBeDefined();
      expect(Array.isArray(accountIssues)).toBe(true);
    });
  });

  describe('Async APIs', () => {
    test('exemplo de teste com APIs assíncronas', async () => {
      // Muitas das novas APIs são assíncronas
      const result = await systemValidator.validateSystem();
      
      // Processar resultado assíncrono
      expect(result).toBeDefined();
      
      // Se houver correções automáticas
      if (result.summary.totalIssues > 0) {
        const fixResults = await systemValidator.autoFixIssues();
        expect(fixResults).toHaveProperty('fixed');
        expect(fixResults).toHaveProperty('errors');
      }
    });
  });
});

// Exemplo de como testar componentes React com providers
describe('Componentes React (com providers)', () => {
  test('deve renderizar componente com QueryClient', () => {
    // O render já inclui todos os providers necessários
    render(<div>Test Component</div>);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});

// Exemplo de mock de dados para testes específicos
describe('Dados de Teste Estruturados', () => {
  test('deve usar mockData para criar dados consistentes', () => {
    const transaction = mockData.transaction({
      amount: -100,
      description: 'Teste personalizado',
      category: 'teste',
    });

    expect(transaction.amount).toBe(-100);
    expect(transaction.description).toBe('Teste personalizado');
    expect(transaction.category).toBe('teste');
    // Outros campos mantêm valores padrão
    expect(transaction.type).toBe('expense');
    expect(transaction.id).toBeDefined();
  });
});
