/**
 * Traduções para o sistema
 */

export const ACCOUNT_TYPE_TRANSLATIONS = {
  checking: 'Conta Corrente',
  savings: 'Poupança', 
  credit: 'Cartão de Crédito',
  investment: 'Investimento',
  debit: 'Cartão de Débito'
} as const;

export const TRANSACTION_TYPE_TRANSLATIONS = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
  shared: 'Compartilhado'
} as const;

export const GOAL_TYPE_TRANSLATIONS = {
  savings: 'Poupança',
  investment: 'Investimento',
  vacation: 'Viagem',
  house: 'Casa',
  car: 'Carro',
  education: 'Educação',
  emergency: 'Emergência',
  other: 'Outro'
} as const;

export const INVESTMENT_TYPE_TRANSLATIONS = {
  stocks: 'Ações',
  bonds: 'Títulos',
  etf: 'ETF',
  mutual_fund: 'Fundo Mútuo',
  crypto: 'Criptomoedas',
  real_estate: 'Imóveis',
  commodities: 'Commodities',
  other: 'Outros'
} as const;

export function translateAccountType(type: string): string {
  return ACCOUNT_TYPE_TRANSLATIONS[type as keyof typeof ACCOUNT_TYPE_TRANSLATIONS] || type;
}

export function translateTransactionType(type: string): string {
  return TRANSACTION_TYPE_TRANSLATIONS[type as keyof typeof TRANSACTION_TYPE_TRANSLATIONS] || type;
}

export function translateGoalType(type: string): string {
  return GOAL_TYPE_TRANSLATIONS[type as keyof typeof GOAL_TYPE_TRANSLATIONS] || type;
}

export function translateInvestmentType(type: string): string {
  return INVESTMENT_TYPE_TRANSLATIONS[type as keyof typeof INVESTMENT_TYPE_TRANSLATIONS] || type;
}
