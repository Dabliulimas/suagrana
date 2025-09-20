import { 
  userSchema, 
  accountSchema, 
  transactionSchema, 
  investmentSchema, 
  goalSchema,
  validateCPF,
  validateCNPJ,
  validateBrazilianPhone,
  validateCurrency,
  validatePercentage 
} from '@/lib/validations/schemas';

describe('Validações Zod', () => {
  describe('Validação de CPF', () => {
    test('deve aceitar CPF válido', () => {
      expect(validateCPF('12345678909')).toBe(true);
      expect(validateCPF('11144477735')).toBe(true);
    });

    test('deve rejeitar CPF inválido', () => {
      expect(validateCPF('12345678900')).toBe(false);
      expect(validateCPF('11111111111')).toBe(false);
      expect(validateCPF('123456789')).toBe(false);
      expect(validateCPF('')).toBe(false);
    });
  });

  describe('Validação de CNPJ', () => {
    test('deve aceitar CNPJ válido', () => {
      expect(validateCNPJ('11444777000161')).toBe(true);
    });

    test('deve rejeitar CNPJ inválido', () => {
      expect(validateCNPJ('11444777000160')).toBe(false);
      expect(validateCNPJ('11111111111111')).toBe(false);
      expect(validateCNPJ('1144477700016')).toBe(false);
      expect(validateCNPJ('')).toBe(false);
    });
  });

  describe('Validação de telefone brasileiro', () => {
    test('deve aceitar telefones válidos', () => {
      expect(validateBrazilianPhone('(11) 99999-9999')).toBe(true);
      expect(validateBrazilianPhone('11999999999')).toBe(true);
      expect(validateBrazilianPhone('(11) 9999-9999')).toBe(true);
    });

    test('deve rejeitar telefones inválidos', () => {
      expect(validateBrazilianPhone('1199999999')).toBe(false);
      expect(validateBrazilianPhone('(11) 999999999')).toBe(false);
      expect(validateBrazilianPhone('abcd')).toBe(false);
    });
  });

  describe('Validação de moeda', () => {
    test('deve aceitar valores monetários válidos', () => {
      expect(validateCurrency('1000.50')).toBe(true);
      expect(validateCurrency('0.01')).toBe(true);
      expect(validateCurrency('999999999.99')).toBe(true);
    });

    test('deve rejeitar valores monetários inválidos', () => {
      expect(validateCurrency('-100')).toBe(false);
      expect(validateCurrency('1000.123')).toBe(false);
      expect(validateCurrency('abc')).toBe(false);
    });
  });

  describe('Schema de usuário', () => {
    test('deve validar usuário válido', () => {
      const validUser = {
        name: 'João Silva',
        email: 'joao@email.com'
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    test('deve rejeitar usuário com email inválido', () => {
      const invalidUser = {
        name: 'João Silva',
        email: 'email-invalido'
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema de conta', () => {
    test('deve validar conta válida', () => {
      const validAccount = {
        name: 'Conta Corrente',
        type: 'checking',
        balance: 1000.50,
        bank: 'Banco do Brasil'
      };

      const result = accountSchema.safeParse(validAccount);
      expect(result.success).toBe(true);
    });

    test('deve rejeitar conta com tipo inválido', () => {
      const invalidAccount = {
        name: 'Conta Corrente',
        type: 'invalid-type',
        balance: 1000.50
      };

      const result = accountSchema.safeParse(invalidAccount);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema de transação', () => {
    test('deve validar transação válida', () => {
      const validTransaction = {
        description: 'Compra de mercado',
        amount: 150.75,
        type: 'expense',
        category: 'alimentacao',
        date: new Date().toISOString(),
        accountId: 'account-123'
      };

      const result = transactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    test('deve rejeitar transação com valor negativo', () => {
      const invalidTransaction = {
        description: 'Compra de mercado',
        amount: -150.75,
        type: 'expense',
        category: 'alimentacao',
        date: new Date().toISOString(),
        accountId: 'account-123'
      };

      const result = transactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema de investimento', () => {
    test('deve validar investimento válido', () => {
      const validInvestment = {
        name: 'PETR4',
        type: 'stock',
        quantity: 100,
        purchasePrice: 25.50,
        currentPrice: 27.80,
        ticker: 'PETR4'
      };

      const result = investmentSchema.safeParse(validInvestment);
      expect(result.success).toBe(true);
    });

    test('deve rejeitar investimento com quantidade negativa', () => {
      const invalidInvestment = {
        name: 'PETR4',
        type: 'stock',
        quantity: -100,
        purchasePrice: 25.50,
        currentPrice: 27.80
      };

      const result = investmentSchema.safeParse(invalidInvestment);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema de meta', () => {
    test('deve validar meta válida', () => {
      const validGoal = {
        name: 'Viagem para Europa',
        targetAmount: 15000,
        currentAmount: 5000,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'viagem',
        status: 'active'
      };

      const result = goalSchema.safeParse(validGoal);
      expect(result.success).toBe(true);
    });

    test('deve rejeitar meta com valor alvo negativo', () => {
      const invalidGoal = {
        name: 'Meta Inválida',
        targetAmount: -1000,
        currentAmount: 0,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      };

      const result = goalSchema.safeParse(invalidGoal);
      expect(result.success).toBe(false);
    });
  });
});
