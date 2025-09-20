import { z } from "zod";
import {
  AccountType,
  TransactionType,
  InvestmentType,
  GoalPriority,
  GoalStatus,
} from "@/types";

// Schema para Account
export const CreateAccountSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["checking", "savings", "credit", "investment"]),
  balance: z.number().default(0),
  description: z.string().optional(),
});

export const UpdateAccountSchema = CreateAccountSchema.partial().omit({
  userId: true,
});

// Schema para Transaction
export const CreateTransactionSchema = z.object({
  userId: z.string().cuid(),
  accountId: z.string().cuid(),
  description: z.string().min(1, "Descrição é obrigatória").max(200),
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().min(1, "Categoria é obrigatória"),
  date: z.date(),
  notes: z.string().optional(),
  tags: z.string().optional(), // JSON string
  isShared: z.boolean().default(false),
  sharedWith: z.string().optional(), // JSON string
  installments: z.number().int().min(1).max(60).default(1),
  currentInstallment: z.number().int().min(1).default(1),
  parentId: z.string().cuid().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().omit({
  userId: true,
});

// Schema para Goal
export const CreateGoalSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().optional(),
  targetAmount: z.number().positive("Valor meta deve ser positivo"),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.date().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["active", "completed", "paused"]).default("active"),
});

export const UpdateGoalSchema = CreateGoalSchema.partial().omit({
  userId: true,
});

// Schema para Investment
export const CreateInvestmentSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["stock", "fii", "treasury", "crypto", "fund"]),
  symbol: z.string().optional(),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  purchasePrice: z.number().positive("Preço de compra deve ser positivo"),
  currentPrice: z.number().positive().optional(),
  purchaseDate: z.date(),
  broker: z.string().optional(),
  fees: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const UpdateInvestmentSchema = CreateInvestmentSchema.partial().omit({
  userId: true,
});

// Schema para Contact
export const CreateContactSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial().omit({
  userId: true,
});

// Schema para Dividend
export const CreateDividendSchema = z.object({
  investmentId: z.string().cuid(),
  amount: z.number().positive("Valor deve ser positivo"),
  paymentDate: z.date(),
  type: z.enum(["dividend", "jcp", "bonus"]).default("dividend"),
});

// Schemas para filtros
export const TransactionFiltersSchema = z.object({
  accountId: z.string().cuid().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  category: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
});

// Schema para paginação
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Utilitários de validação
export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T {
  return schema.parse(data);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
