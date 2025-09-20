import { z } from "zod";

// Utility schemas for common validations
const sanitizeString = (str: string) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
};

const sanitizeHtml = (str: string) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
};

// Base string schema with XSS protection
// SafeStringSchema and SafeHtmlSchema removed as they were unused

// Email schema with validation and sanitization
export const EmailSchema = z
  .string()
  .email("Email invalido")
  .transform((email) => email.toLowerCase().trim())
  .refine((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, "Formato de email invalido");

// Phone schema
export const PhoneSchema = z
  .string()
  .optional()
  .transform((phone) => (phone ? phone.replace(/\D/g, "") : undefined))
  .refine(
    (phone) => !phone || phone.length >= 10,
    "Telefone deve ter pelo menos 10 digitos",
  );

// Currency schema for monetary values
export const CurrencySchema = z
  .number()
  .or(
    z.string().transform((val) => {
      const num = parseFloat(val.replace(/[^\d.-]/g, ""));
      return isNaN(num) ? 0 : num;
    }),
  )
  .refine(
    (val) => typeof val === "number" && !isNaN(val),
    "Valor monetario invalido",
  );

// Date schema
export const DateSchema = z
  .string()
  .or(z.date())
  .transform((date) => {
    if (date instanceof Date) return date.toISOString();
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) throw new Error("Data invalida");
    return parsed.toISOString();
  });

// ID schema
export const IdSchema = z
  .string()
  .min(1, "ID e obrigatorio")
  .transform((id) => id.replace(/[^a-zA-Z0-9-_]/g, ""));

// Transaction schemas
export const TransactionTypeSchema = z.enum(["income", "expense", "shared"], {
  errorMap: () => ({ message: "Tipo de transacao invalido" }),
});

export const TransactionSchema = z
  .object({
    id: IdSchema.optional(),
    description: z
      .string()
      .min(1, "Descricao e obrigatoria")
      .max(200, "Descricao deve ter no maximo 200 caracteres")
      .transform(sanitizeHtml),
    amount: CurrencySchema.refine(
      (val) => val !== 0,
      "Valor nao pode ser zero",
    ),
    type: TransactionTypeSchema,
    category: z
      .string()
      .min(1, "Categoria e obrigatoria")
      .max(50, "Categoria deve ter no maximo 50 caracteres")
      .transform(sanitizeString),
    account: z
      .string()
      .min(1, "Conta e obrigatoria")
      .max(100, "Nome da conta deve ter no maximo 100 caracteres")
      .transform(sanitizeString),
    date: DateSchema,
    tags: z.array(z.string().transform(sanitizeString)).optional().default([]),
    installments: z.number().int().min(1).max(60).optional(),
    currentInstallment: z.number().int().min(1).optional(),
    sharedWith: z.array(EmailSchema).optional(),
    sharedPercentages: z
      .record(z.string(), z.number().min(0).max(100))
      .optional(),
    notes: z.string().transform(sanitizeHtml).optional(),
    attachments: z
      .array(z.string().transform(sanitizeString))
      .optional()
      .default([]),
  })
  .refine((data) => {
    // Validate installments consistency
    if (data.installments && data.installments > 1) {
      return (
        data.currentInstallment && data.currentInstallment <= data.installments
      );
    }
    return true;
  }, "Numero da parcela invalido")
  .refine((data) => {
    // Validate shared transaction requirements
    if (data.type === "shared") {
      return data.sharedWith && data.sharedWith.length > 0;
    }
    return true;
  }, "Transacao compartilhada deve ter participantes")
  .refine((data) => {
    // Validate shared percentages sum to 100
    if (data.sharedPercentages) {
      const total = Object.values(data.sharedPercentages).reduce(
        (sum, p) => sum + p,
        0,
      );
      return Math.abs(total - 100) < 0.01;
    }
    return true;
  }, "Percentuais de compartilhamento devem somar 100%");

// Contact schema
export const ContactSchema = z.object({
  id: IdSchema.optional(),
  name: z
    .string()
    .min(1, "Nome e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .transform(sanitizeString),
  email: EmailSchema,
  phone: PhoneSchema,
  notes: z.string().transform(sanitizeHtml).optional(),
});

// Account schema
export const AccountSchema = z.object({
  id: IdSchema.optional(),
  name: z
    .string()
    .min(1, "Nome da conta e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .transform(sanitizeString),
  bank: z.string().transform(sanitizeString).optional(),
  type: z
    .enum(["checking", "savings", "credit", "investment", "cash"], {
      errorMap: () => ({ message: "Tipo de conta invalido" }),
    })
    .optional()
    .default("checking"),
  balance: CurrencySchema.default(0),
  description: z.string().transform(sanitizeHtml).optional(),
  isActive: z.boolean().default(true),
});

// Goal schema
export const GoalSchema = z.object({
  id: IdSchema.optional(),
  name: z
    .string()
    .min(1, "Nome da meta e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .transform(sanitizeString),
  targetAmount: CurrencySchema.refine(
    (val) => val > 0,
    "Valor da meta deve ser positivo",
  ),
  currentAmount: CurrencySchema.default(0),
  targetDate: DateSchema.optional(),
  category: z.string().transform(sanitizeString).optional(),
  description: z.string().transform(sanitizeHtml).optional(),
  isCompleted: z.boolean().default(false),
});

// Investment schema
export const InvestmentSchema = z.object({
  id: IdSchema.optional(),
  name: z
    .string()
    .min(1, "Nome do investimento e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .transform(sanitizeString),
  type: z
    .string()
    .min(1, "Tipo de investimento e obrigatorio")
    .transform(sanitizeString),
  amount: CurrencySchema.refine(
    (val) => val > 0,
    "Valor do investimento deve ser positivo",
  ),
  purchaseDate: DateSchema,
  currentValue: CurrencySchema.optional(),
  broker: z.string().transform(sanitizeString).optional(),
  notes: z.string().transform(sanitizeHtml).optional(),
});

// Trip schema
export const TripSchema = z
  .object({
    id: IdSchema.optional(),
    name: z
      .string()
      .min(1, "Nome da viagem e obrigatorio")
      .max(100, "Nome deve ter no maximo 100 caracteres")
      .transform(sanitizeString),
    destination: z
      .string()
      .min(1, "Destino e obrigatorio")
      .max(100, "Destino deve ter no maximo 100 caracteres")
      .transform(sanitizeString),
    startDate: DateSchema,
    endDate: DateSchema,
    budget: CurrencySchema.refine(
      (val) => val > 0,
      "Orcamento deve ser positivo",
    ),
    spent: CurrencySchema.default(0),
    description: z.string().transform(sanitizeHtml).optional(),
  })
  .refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start.getTime() <= end.getTime();
  }, "Data de inicio deve ser anterior a data de fim");

// User profile schema
export const UserProfileSchema = z.object({
  id: IdSchema.optional(),
  name: z
    .string()
    .min(1, "Nome e obrigatorio")
    .max(100, "Nome deve ter no maximo 100 caracteres")
    .transform(sanitizeString),
  email: EmailSchema,
  phone: PhoneSchema,
  avatar: z.string().transform(sanitizeString).optional(),
  preferences: z.object({
    currency: z.string(),
    language: z.string(),
    theme: z.enum(["light", "dark", "system"]),
    notifications: z.object({
      billing: z.boolean(),
      goal: z.boolean(),
      investments: z.boolean(),
      general: z.boolean(),
    }),
  }),
});

// Validation helper functions
export const validateWithZod = <T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  data: unknown,
): {
  success: boolean;
  data: T | null;
  errors: Array<{ field: string; message: string; code: string }>;
} => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [
        {
          field: "unknown",
          message: "Erro de validação desconhecido",
          code: "unknown",
        },
      ],
    };
  }
};

export const safeParseWithZod = <T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  data: unknown,
) => {
  return schema.safeParse(data);
};

// Export all schemas for easy access
export const schemas = {
  Transaction: TransactionSchema,
  Contact: ContactSchema,
  Account: AccountSchema,
  Goal: GoalSchema,
  Investment: InvestmentSchema,
  Trip: TripSchema,
  UserProfile: UserProfileSchema,
  Email: EmailSchema,
  Phone: PhoneSchema,
  Currency: CurrencySchema,
  Date: DateSchema,
  Id: IdSchema,
};

export type TransactionInput = z.input<typeof TransactionSchema>;
export type TransactionOutput = z.output<typeof TransactionSchema>;
export type ContactInput = z.input<typeof ContactSchema>;
export type ContactOutput = z.output<typeof ContactSchema>;
export type AccountInput = z.input<typeof AccountSchema>;
export type AccountOutput = z.output<typeof AccountSchema>;
export type GoalInput = z.input<typeof GoalSchema>;
export type GoalOutput = z.output<typeof GoalSchema>;
export type InvestmentInput = z.input<typeof InvestmentSchema>;
export type InvestmentOutput = z.output<typeof InvestmentSchema>;
export type TripInput = z.input<typeof TripSchema>;
export type TripOutput = z.output<typeof TripSchema>;
export type UserProfileInput = z.input<typeof UserProfileSchema>;
export type UserProfileOutput = z.output<typeof UserProfileSchema>;
