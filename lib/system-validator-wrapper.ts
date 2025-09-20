/**
 * Wrapper para SystemValidator que padroniza a saída no formato esperado pelos testes
 * Converte SystemHealth para formato legado compatível com testes existentes
 */

import { SystemValidator, SystemHealth, ValidationResult } from './system-validator';

interface ValidationIssue {
  id?: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affectedEntity?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  metadata?: any;
}

interface LegacyValidationResult {
  score: number;
  issues: ValidationIssue[];
  categories: {
    accounts: ValidationResult;
    transactions: ValidationResult;
    goals: ValidationResult;
    trips: ValidationResult;
    investments: ValidationResult;
    sharedExpenses: ValidationResult;
  };
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

class SystemValidatorWrapper {
  private validator = new SystemValidator();

  async validateSystem(): Promise<LegacyValidationResult> {
    const systemHealth = await this.validator.validateSystem();
    return this.convertToLegacyFormat(systemHealth);
  }

  private convertToLegacyFormat(health: SystemHealth): LegacyValidationResult {
    const allIssues: ValidationIssue[] = [];

    // Converter erros e warnings de cada categoria em issues
    this.addIssuesFromValidationResult(allIssues, health.accounts, 'accounts');
    this.addIssuesFromValidationResult(allIssues, health.transactions, 'transactions');
    this.addIssuesFromValidationResult(allIssues, health.goals, 'goals');
    this.addIssuesFromValidationResult(allIssues, health.trips, 'trips');
    this.addIssuesFromValidationResult(allIssues, health.investments, 'investments');
    this.addIssuesFromValidationResult(allIssues, health.sharedExpenses, 'sharedExpenses');

    // Adicionar verificações específicas de princípios contábeis para compatibilidade com testes legados
    this.addAccountingPrinciplesViolations(allIssues);

    // Calcular contadores
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    const highIssues = allIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = allIssues.filter(i => i.severity === 'medium').length;
    const lowIssues = allIssues.filter(i => i.severity === 'low').length;

    return {
      score: health.overall.score,
      issues: allIssues,
      categories: {
        accounts: health.accounts,
        transactions: health.transactions,
        goals: health.goals,
        trips: health.trips,
        investments: health.investments,
        sharedExpenses: health.sharedExpenses,
      },
      summary: {
        totalIssues: allIssues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
      },
    };
  }

  private addIssuesFromValidationResult(
    issues: ValidationIssue[],
    result: ValidationResult,
    category: string
  ): void {
    // Adicionar erros como issues de alta severidade
    result.errors.forEach((error, index) => {
      issues.push({
        id: `${category}-error-${index}`,
        type: 'validation_error',
        severity: this.determineSeverity(error, 'error'),
        category,
        description: error,
        autoFixable: false,
      });
    });

    // Adicionar warnings como issues de média/baixa severidade
    result.warnings.forEach((warning, index) => {
      issues.push({
        id: `${category}-warning-${index}`,
        type: 'validation_warning',
        severity: this.determineSeverity(warning, 'warning'),
        category,
        description: warning,
        autoFixable: true,
      });
    });
  }

  private determineSeverity(message: string, type: 'error' | 'warning'): 'critical' | 'high' | 'medium' | 'low' {
    const lowerMessage = message.toLowerCase();

    // Palavras-chave que indicam severidade crítica
    const criticalKeywords = ['missing_data', 'corrupted', 'inconsistencia', 'critical'];
    
    // Palavras-chave que indicam alta severidade
    const highKeywords = ['invalid', 'incorrect', 'mismatch', 'negative'];

    if (type === 'error') {
      if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'critical';
      }
      if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'high';
      }
      return 'medium';
    } else {
      // Warnings são geralmente média ou baixa severidade
      if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'medium';
      }
      return 'low';
    }
  }

  private addAccountingPrinciplesViolations(issues: ValidationIssue[]): void {
    try {
      // Verificar violações de partida dobrada
      this.checkDoubleEntryViolations(issues);
      
      // Verificar violações de conservadorismo
      this.checkConservatismViolations(issues);
      
      // Verificar competência temporal (datas futuras)
      this.checkTemporalCompetencyViolations(issues);
    } catch (error) {
      console.warn('Erro ao verificar princípios contábeis:', error);
    }
  }

  private checkDoubleEntryViolations(issues: ValidationIssue[]): void {
    try {
      const transactions = JSON.parse(localStorage.getItem('sua-grana-transactions') || '[]');
      
      // Buscar transações que podem violar partida dobrada
      // (transações sem contrapartida aparente)
      const suspiciousTransactions = transactions.filter((t: any) => {
        // Se é uma transação de receita sem referência a transferência ou origem clara
        if (t.type === 'income' && t.amount > 0 && 
            !t.description.toLowerCase().includes('transferência') &&
            !t.description.toLowerCase().includes('transfer') &&
            !t.fromAccount && !t.toAccount) {
          return true;
        }
        return false;
      });

      if (suspiciousTransactions.length > 0) {
        issues.push({
          id: 'double-entry-violation',
          type: 'accounting_principle',
          severity: 'high',
          category: 'transactions',
          description: 'Possível violação do princípio da partida dobrada detectada em transações sem contrapartida',
          affectedEntity: `${suspiciousTransactions.length} transações`,
          suggestedFix: 'Verificar e adicionar contas de contrapartida para todas as transações',
          autoFixable: false,
          metadata: { 
            principle: 'double-entry',
            affectedTransactions: suspiciousTransactions.map((t: any) => t.id)
          }
        });
      }
    } catch (error) {
      console.warn('Erro na verificação de partida dobrada:', error);
    }
  }

  private checkConservatismViolations(issues: ValidationIssue[]): void {
    try {
      const investments = JSON.parse(localStorage.getItem('sua-grana-investments') || '[]');
      
      // Verificar rendimentos irreais (muito altos)
      const unrealisticInvestments = investments.filter((inv: any) => {
        // Rendimento anual acima de 100% é considerado irreal para a maioria dos investimentos
        if (typeof inv.yield === 'number' && inv.yield > 1.0) {
          return true;
        }
        // Rendimento acima de 50% para investimentos de baixo risco
        if (inv.risk === 'low' && typeof inv.yield === 'number' && inv.yield > 0.5) {
          return true;
        }
        return false;
      });

      if (unrealisticInvestments.length > 0) {
        issues.push({
          id: 'conservatism-violation',
          type: 'accounting_principle', 
          severity: 'medium',
          category: 'investments',
          description: 'Valores não conservadores detectados - rendimentos irreais ou muito otimistas',
          affectedEntity: `${unrealisticInvestments.length} investimentos`,
          suggestedFix: 'Revisar e ajustar projeções de rendimento para valores mais conservadores',
          autoFixable: false,
          metadata: {
            principle: 'conservatism',
            affectedInvestments: unrealisticInvestments.map((inv: any) => inv.id)
          }
        });
      }
    } catch (error) {
      console.warn('Erro na verificação de conservadorismo:', error);
    }
  }

  private checkTemporalCompetencyViolations(issues: ValidationIssue[]): void {
    try {
      const transactions = JSON.parse(localStorage.getItem('sua-grana-transactions') || '[]');
      const currentDate = new Date();
      
      // Verificar transações com datas futuras
      const futureTransactions = transactions.filter((t: any) => {
        if (t.date) {
          const transactionDate = new Date(t.date);
          return transactionDate > currentDate;
        }
        return false;
      });

      if (futureTransactions.length > 0) {
        issues.push({
          id: 'temporal-competency-violation',
          type: 'accounting_principle',
          severity: 'medium', 
          category: 'transactions',
          description: 'Violação do princípio da competência - transações com data futura registradas',
          affectedEntity: `${futureTransactions.length} transações`,
          suggestedFix: 'Revisar datas das transações ou criar como transações programadas',
          autoFixable: false,
          metadata: {
            principle: 'temporal-competency',
            affectedTransactions: futureTransactions.map((t: any) => t.id)
          }
        });
      }
    } catch (error) {
      console.warn('Erro na verificação de competência temporal:', error);
    }
  }

  // Método para correção automática (compatibilidade)
  async autoFixIssues(): Promise<{ fixed: number; errors: string[] }> {
    // Implementação básica - pode ser expandida conforme necessário
    return { fixed: 0, errors: [] };
  }
}

// Instância singleton para compatibilidade
const systemValidatorWrapper = new SystemValidatorWrapper();

// Exportações para compatibilidade com testes existentes
export { systemValidatorWrapper as systemValidator };
export type { LegacyValidationResult, ValidationIssue };
export default systemValidatorWrapper;
