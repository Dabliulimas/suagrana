import { z } from "zod";

// Utilitários para validações brasileiras
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const PHONE_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

// Função para validar CPF
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (parseInt(cleanCPF[9]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return parseInt(cleanCPF[10]) === digit;
}

// Schemas base reutilizáveis
export const BaseSchemas = {
  id: z.string().uuid("ID deve ser um UUID válido"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(PHONE_REGEX, "Telefone deve estar no formato (XX) XXXXX-XXXX"),
  cpf: z.string().regex(CPF_REGEX, "CPF deve estar no formato XXX.XXX.XXX-XX").refine(validateCPF, "CPF inválido"),
  cnpj: z.string().regex(CNPJ_REGEX, "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX"),
  currency: z.number().min(0, "Valor deve ser positivo").max(999999999, "Valor muito alto"),
  percentage: z.number().min(0, "Porcentagem deve ser positiva").max(100, "Porcentagem não pode ser maior que 100"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data inválida"),
  dateTime: z.date(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  description: z.string().max(500, "Descrição muito longa"),
};

// Schema para transações
export const TransactionSchema = z.object({
  id: BaseSchemas.id.optional(),
  description: z.string().min(1, "Descrição é obrigatória").max(255, "Descrição muito longa"),
  amount: z.number().refine((val) => val !== 0, "Valor não pode ser zero"),
  type: z.enum(["income", "expense", "transfer"], {
    errorMap: () => ({ message: "Tipo deve ser receita, despesa ou transferência" })
  }),
  category: z.string().min(1, "Categoria é obrigatória"),
  subcategory: z.string().optional(),
  account: z.string().min(1, "Conta é obrigatória"),
  date: BaseSchemas.date,
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().max(1000, "Notas muito longas").optional(),
  recurring: z.object({
    enabled: z.boolean(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
    interval: z.number().positive().optional(),
    endDate: BaseSchemas.date.optional(),
  }).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }).optional(),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
}).refine(
  (data) => {
    if (data.type === "transfer") {
      return data.amount > 0;
    }
    return true;
  },
  {
    message: "Transferências devem ter valor positivo",
    path: ["amount"],
  }
);

// Schema para contas
export const AccountSchema = z.object({
  id: BaseSchemas.id.optional(),
  name: BaseSchemas.name,
  type: z.enum(["checking", "savings", "credit", "investment", "cash"], {
    errorMap: () => ({ message: "Tipo de conta inválido" })
  }),
  bank: z.string().min(1, "Banco é obrigatório"),
  balance: z.number().default(0),
  creditLimit: z.number().positive("Limite deve ser positivo").optional(),
  interestRate: BaseSchemas.percentage.optional(),
  dueDay: z.number().min(1).max(31).optional(),
  isActive: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex válido").optional(),
  icon: z.string().optional(),
  currency: z.string().default("BRL"),
  accountNumber: z.string().optional(),
  agency: z.string().optional(),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
}).refine(
  (data) => {
    if (data.type === "credit" && data.dueDay === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "Cartões de crédito devem ter dia de vencimento",
    path: ["dueDay"],
  }
);

// Schema para investimentos
export const InvestmentSchema = z.object({
  id: BaseSchemas.id.optional(),
  symbol: z.string().min(1, "Símbolo é obrigatório").max(20, "Símbolo muito longo"),
  name: BaseSchemas.name,
  type: z.enum(["stock", "fii", "etf", "crypto", "fixed_income", "other"], {
    errorMap: () => ({ message: "Tipo de investimento inválido" })
  }),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  purchasePrice: z.number().positive("Preço de compra deve ser positivo"),
  currentPrice: z.number().positive("Preço atual deve ser positivo").optional(),
  purchaseDate: BaseSchemas.date,
  broker: z.string().min(1, "Corretora é obrigatória"),
  sector: z.string().optional(),
  fees: z.number().min(0, "Taxas não podem ser negativas").optional(),
  notes: z.string().max(1000, "Notas muito longas").optional(),
  status: z.enum(["active", "sold", "partial"]).default("active"),
  dividendYield: BaseSchemas.percentage.optional(),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
});

// Schema para dividendos
export const DividendSchema = z.object({
  id: BaseSchemas.id.optional(),
  investmentId: BaseSchemas.id,
  amount: z.number().positive("Valor deve ser positivo"),
  exDividendDate: BaseSchemas.date,
  paymentDate: BaseSchemas.date,
  type: z.enum(["dividend", "jscp", "bonus", "split"], {
    errorMap: () => ({ message: "Tipo de provento inválido" })
  }),
  taxWithheld: z.number().min(0, "Imposto não pode ser negativo").optional(),
  createdAt: BaseSchemas.dateTime.optional(),
});

// Schema para metas
export const GoalSchema = z.object({
  id: BaseSchemas.id.optional(),
  name: BaseSchemas.name,
  description: BaseSchemas.description.optional(),
  targetAmount: z.number().positive("Valor alvo deve ser positivo"),
  currentAmount: z.number().min(0, "Valor atual não pode ser negativo").default(0),
  targetDate: BaseSchemas.date,
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(["low", "medium", "high", "critical"], {
    errorMap: () => ({ message: "Prioridade inválida" })
  }),
  isActive: z.boolean().default(true),
  linkedAccounts: z.array(BaseSchemas.id).optional(),
  autoContribute: z.object({
    enabled: z.boolean(),
    amount: z.number().positive(),
    frequency: z.enum(["daily", "weekly", "monthly"]),
  }).optional(),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
});

// Schema para viagens
export const TripSchema = z.object({
  id: BaseSchemas.id.optional(),
  name: BaseSchemas.name,
  destination: z.string().min(1, "Destino é obrigatório"),
  startDate: BaseSchemas.date,
  endDate: BaseSchemas.date,
  budget: z.number().positive("Orçamento deve ser positivo"),
  currency: z.string().length(3, "Moeda deve ter 3 caracteres"),
  exchangeRate: z.number().positive("Taxa de câmbio deve ser positiva"),
  participants: z.array(z.object({
    id: BaseSchemas.id,
    name: BaseSchemas.name,
    email: BaseSchemas.email,
  })),
  categories: z.array(z.object({
    name: z.string(),
    budget: z.number().positive(),
    spent: z.number().min(0).default(0),
  })),
  expenses: z.array(TransactionSchema).optional(),
  notes: z.string().max(2000, "Notas muito longas").optional(),
  status: z.enum(["planning", "active", "completed", "cancelled"]).default("planning"),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "Data de fim deve ser posterior à data de início",
    path: ["endDate"],
  }
);

// Schema para usuário
export const UserSchema = z.object({
  id: BaseSchemas.id.optional(),
  email: BaseSchemas.email,
  name: BaseSchemas.name,
  avatar: z.string().url().optional(),
  phone: BaseSchemas.phone.optional(),
  cpf: BaseSchemas.cpf.optional(),
  birthDate: BaseSchemas.date.optional(),
  address: z.object({
    street: z.string(),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}-\d{3}$/, "CEP deve estar no formato XXXXX-XXX"),
  }).optional(),
  preferences: z.object({
    currency: z.string().default("BRL"),
    language: z.string().default("pt-BR"),
    timezone: z.string().default("America/Sao_Paulo"),
    theme: z.enum(["light", "dark", "system"]).default("system"),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }).default({}),
  }).optional(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  createdAt: BaseSchemas.dateTime.optional(),
  updatedAt: BaseSchemas.dateTime.optional(),
});

// Schema para configurações do sistema
export const SettingsSchema = z.object({
  general: z.object({
    currency: z.string().default("BRL"),
    language: z.string().default("pt-BR"),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
    numberFormat: z.enum(["1,234.56", "1.234,56", "1 234,56"]).default("1.234,56"),
  }),
  notifications: z.object({
    budgetAlerts: z.boolean().default(true),
    goalReminders: z.boolean().default(true),
    billReminders: z.boolean().default(true),
    investmentUpdates: z.boolean().default(false),
    weeklyReports: z.boolean().default(true),
  }),
  privacy: z.object({
    shareData: z.boolean().default(false),
    analytics: z.boolean().default(true),
    marketing: z.boolean().default(false),
  }),
  backup: z.object({
    enabled: z.boolean().default(true),
    frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
    cloudProvider: z.enum(["google", "dropbox", "onedrive"]).optional(),
  }),
});

// Schema para formulários de autenticação
export const AuthSchemas = {
  login: z.object({
    email: BaseSchemas.email,
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    remember: z.boolean().optional(),
  }),

  register: z.object({
    name: BaseSchemas.name,
    email: BaseSchemas.email,
    password: z.string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve ter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve ter pelo menos um número")
      .regex(/[^A-Za-z0-9]/, "Senha deve ter pelo menos um caractere especial"),
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  }),

  forgotPassword: z.object({
    email: BaseSchemas.email,
  }),

  resetPassword: z.object({
    token: z.string().min(1, "Token é obrigatório"),
    password: z.string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve ter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve ter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve ter pelo menos um número"),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  }),
};

// Tipos TypeScript inferidos dos schemas
export type Transaction = z.infer<typeof TransactionSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Investment = z.infer<typeof InvestmentSchema>;
export type Dividend = z.infer<typeof DividendSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Trip = z.infer<typeof TripSchema>;
export type User = z.infer<typeof UserSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// Schemas parciais para updates
export const UpdateSchemas = {
  transaction: TransactionSchema.partial(),
  account: AccountSchema.partial(),
  investment: InvestmentSchema.partial(),
  goal: GoalSchema.partial(),
  trip: TripSchema.partial(),
  user: UserSchema.partial(),
};

// Aliases para compatibilidade com as rotas API
export const transactionSchema = TransactionSchema;
export const accountSchema = AccountSchema;
export const investmentSchema = InvestmentSchema;
export const dividendSchema = DividendSchema;
export const goalSchema = GoalSchema;
export const tripSchema = TripSchema;
export const userSchema = UserSchema;
export const settingsSchema = SettingsSchema;

// Utilitário para validação com tratamento de erros
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>, 
  data: unknown,
  options?: { throwOnError?: boolean }
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      
      if (options?.throwOnError) {
        throw new Error(`Validation failed: ${errors.join(', ')}`);
      }
      
      return { success: false, errors };
    }
  } catch (error) {
    if (options?.throwOnError) {
      throw error;
    }
    return { 
      success: false, 
      errors: [error instanceof Error ? error.message : 'Validation error'] 
    };
  }
}
