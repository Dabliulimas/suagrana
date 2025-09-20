import { z } from "zod";
import {
  schemas,
  validateWithZod,
  safeParseWithZod,
  TransactionOutput,
  ContactOutput,
  AccountOutput,
  GoalOutput,
  InvestmentOutput,
  TripOutput,
  UserProfileOutput,
} from "./zod-schemas";

// Legacy validation functions for backward compatibility
import {
  validateEmail,
  validateRequiredString,
  validatePositiveNumber,
  sanitizeString,
  sanitizeNumber,
} from "./validation";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data: T | null;
  errors: ValidationError[];
}

export class ValidationService {
  // Transaction validation
  validateTransaction(data: unknown): ValidationResult<TransactionOutput> {
    return validateWithZod(schemas.Transaction, data);
  }

  safeParseTransaction(data: unknown) {
    return safeParseWithZod(schemas.Transaction, data);
  }

  // Contact validation
  validateContact(data: unknown): ValidationResult<ContactOutput> {
    return validateWithZod(schemas.Contact, data);
  }

  safeParseContact(data: unknown) {
    return safeParseWithZod(schemas.Contact, data);
  }

  // Account validation
  validateAccount(data: unknown): ValidationResult<AccountOutput> {
    return validateWithZod(schemas.Account, data);
  }

  safeParseAccount(data: unknown) {
    return safeParseWithZod(schemas.Account, data);
  }

  // Goal validation
  validateGoal(data: unknown): ValidationResult<GoalOutput> {
    return validateWithZod(schemas.Goal, data);
  }

  safeParseGoal(data: unknown) {
    return safeParseWithZod(schemas.Goal, data);
  }

  // Investment validation
  validateInvestment(data: unknown): ValidationResult<InvestmentOutput> {
    return validateWithZod(schemas.Investment, data);
  }

  safeParseInvestment(data: unknown) {
    return safeParseWithZod(schemas.Investment, data);
  }

  // Trip validation
  validateTrip(data: unknown): ValidationResult<TripOutput> {
    return validateWithZod(schemas.Trip, data);
  }

  safeParseTrip(data: unknown) {
    return safeParseWithZod(schemas.Trip, data);
  }

  // User profile validation
  validateUserProfile(data: unknown): ValidationResult<UserProfileOutput> {
    return validateWithZod(schemas.UserProfile, data);
  }

  safeParseUserProfile(data: unknown) {
    return safeParseWithZod(schemas.UserProfile, data);
  }

  // Individual field validations
  validateEmail(email: string): ValidationResult<string> {
    return validateWithZod(schemas.Email, email);
  }

  validateCurrency(amount: unknown): ValidationResult<number> {
    const result = validateWithZod(schemas.Currency, amount);
    return {
      success: result.success,
      data: result.success && result.data ? Number(result.data) : null,
      errors: result.errors,
    };
  }

  validateDate(date: unknown): ValidationResult<string> {
    const result = validateWithZod(schemas.Date, date);
    return {
      success: result.success,
      data: result.success && result.data ? result.data.toString() : null,
      errors: result.errors,
    };
  }

  validateId(id: unknown): ValidationResult<string> {
    return validateWithZod(schemas.Id, id);
  }

  // Batch validation for arrays
  validateTransactions(
    transactions: unknown[],
  ): ValidationResult<TransactionOutput[]> {
    const results: TransactionOutput[] = [];
    const errors: ValidationError[] = [];

    transactions.forEach((transaction, index) => {
      const result = this.validateTransaction(transaction);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(
          ...result.errors.map((err) => ({
            ...err,
            field: `transactions[${index}].${err.field}`,
          })),
        );
      }
    });

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? results : null,
      errors,
    };
  }

  validateContacts(contacts: unknown[]): ValidationResult<ContactOutput[]> {
    const results: ContactOutput[] = [];
    const errors: ValidationError[] = [];

    contacts.forEach((contact, index) => {
      const result = this.validateContact(contact);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(
          ...result.errors.map((err) => ({
            ...err,
            field: `contacts[${index}].${err.field}`,
          })),
        );
      }
    });

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? results : null,
      errors,
    };
  }

  // Legacy compatibility methods
  legacyValidateEmail(email: string): boolean {
    return validateEmail(email);
  }

  legacyValidateRequiredString(value: string): boolean {
    return validateRequiredString(value);
  }

  legacyValidatePositiveNumber(value: unknown): boolean {
    return validatePositiveNumber(value);
  }

  legacySanitizeString(input: string): string {
    return sanitizeString(input);
  }

  legacySanitizeNumber(input: unknown): number {
    return sanitizeNumber(input);
  }

  // Enhanced validation with business rules
  validateTransactionWithBusinessRules(
    data: unknown,
  ): ValidationResult<TransactionOutput> {
    const baseResult = this.validateTransaction(data);

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const transaction = baseResult.data;
    const businessErrors: ValidationError[] = [];

    // Business rule: Income should be positive, expenses should be negative or positive (we'll handle the sign)
    if (transaction.type === "income" && transaction.amount < 0) {
      businessErrors.push({
        field: "amount",
        message: "Receitas devem ter valor positivo",
        code: "business_rule_violation",
      });
    }

    // Business rule: Future transactions should not be too far in the future
    const transactionDate = new Date(transaction.date);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (transactionDate > oneYearFromNow) {
      businessErrors.push({
        field: "date",
        message: "Data da transacao nao pode ser superior a 1 ano no futuro",
        code: "business_rule_violation",
      });
    }

    // Business rule: Shared transactions must have valid percentages
    if (transaction.type === "shared" && transaction.sharedPercentages) {
      const emails = transaction.sharedWith || [];
      const percentageEmails = Object.keys(transaction.sharedPercentages);

      const missingPercentages = emails.filter(
        (email) => !percentageEmails.includes(email),
      );
      if (missingPercentages.length > 0) {
        businessErrors.push({
          field: "sharedPercentages",
          message: `Percentuais faltando para: ${missingPercentages.join(", ")}`,
          code: "business_rule_violation",
        });
      }
    }

    if (businessErrors.length > 0) {
      return {
        success: false,
        data: null,
        errors: [...baseResult.errors, ...businessErrors],
      };
    }

    return baseResult;
  }

  // Sanitization methods
  sanitizeForStorage<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = safeParseWithZod(schema, data);
    return result.success ? result.data : null;
  }

  // Validation with custom error messages
  validateWithCustomMessages<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    customMessages: Record<string, string> = {},
  ): ValidationResult<T> {
    const result = validateWithZod(schema, data);

    if (!result.success) {
      const enhancedErrors = result.errors.map((error) => ({
        ...error,
        message: customMessages[error.field] || error.message,
      }));

      return {
        ...result,
        errors: enhancedErrors,
      };
    }

    return result;
  }

  // Runtime type checking
  isValidTransaction(data: unknown): data is TransactionOutput {
    return this.validateTransaction(data).success;
  }

  isValidContact(data: unknown): data is ContactOutput {
    return this.validateContact(data).success;
  }

  isValidAccount(data: unknown): data is AccountOutput {
    return this.validateAccount(data).success;
  }

  isValidGoal(data: unknown): data is GoalOutput {
    return this.validateGoal(data).success;
  }

  isValidInvestment(data: unknown): data is InvestmentOutput {
    return this.validateInvestment(data).success;
  }

  isValidTrip(data: unknown): data is TripOutput {
    return this.validateTrip(data).success;
  }

  isValidUserProfile(data: unknown): data is UserProfileOutput {
    return this.validateUserProfile(data).success;
  }
}

// Singleton instance
export const validationService = new ValidationService();

// Export for backward compatibility
export {
  validateEmail as legacyValidateEmail,
  validateRequiredString as legacyValidateRequiredString,
  validatePositiveNumber as legacyValidatePositiveNumber,
  sanitizeString as legacySanitizeString,
  sanitizeNumber as legacySanitizeNumber,
} from "./validation";

// Export new validation functions
export const {
  validateTransaction,
  validateContact,
  validateAccount,
  validateGoal,
  validateInvestment,
  validateTrip,
  validateUserProfile,
  validateEmail: validateEmailZod,
  validateCurrency,
  validateDate,
  validateId,
  validateTransactions,
  validateContacts,
  validateTransactionWithBusinessRules,
  sanitizeForStorage,
  validateWithCustomMessages,
  isValidTransaction,
  isValidContact,
  isValidAccount,
  isValidGoal,
  isValidInvestment,
  isValidTrip,
  isValidUserProfile,
} = validationService;
