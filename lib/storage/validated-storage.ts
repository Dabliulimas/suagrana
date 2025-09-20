import {
  validationService,
  ValidationResult,
  ValidationError,
} from "../validation/validation-service";
import {
  TransactionInput,
  TransactionOutput,
  ContactInput,
  ContactOutput,
  AccountInput,
  AccountOutput,
  GoalInput,
  GoalOutput,
  InvestmentInput,
  InvestmentOutput,
  TripInput,
  TripOutput,
  UserProfileInput,
  UserProfileOutput,
} from "../validation/zod-schemas";
import type {
  Transaction,
  Contact,
  Account,
  Goal,
  Investment,
  Trip,
  UserProfile,
} from "../data-layer/types";
import { logComponents } from "../utils/logger";

export interface StorageOperationResult<T = any> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings?: string[];
}

export class ValidatedStorage {
  private logOperation(
    operation: string,
    entity: string,
    success: boolean,
    errors?: ValidationError[],
  ) {
    const timestamp = new Date().toISOString();
    const logLevel = success ? "info" : "error";

    if (success) {
      logComponents.info(`Storage ${operation} ${entity} successful`);
    } else {
      logComponents.error(`Storage ${operation} ${entity} failed`, { errors });
    }
  }

  // Transaction operations with validation
  saveTransaction(
    transactionData: TransactionInput,
  ): StorageOperationResult<Transaction> {
    try {
      // Validate with business rules
      const validation =
        validationService.validateTransactionWithBusinessRules(transactionData);

      if (!validation.success) {
        this.logOperation("save", "transaction", false, validation.errors);
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // TODO: Replace with new data layer
      // const savedTransaction = await dataLayer.create('transactions', validation.data);
      throw new Error('ValidatedStorage needs to be updated to use new data layer');

      this.logOperation("save", "transaction", true);
      return {
        success: true,
        data: savedTransaction,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logOperation("save", "transaction", false, [
        {
          field: "system",
          message: errorMessage,
          code: "system_error",
        },
      ]);

      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  updateTransaction(
    id: string,
    transactionData: Partial<TransactionInput>,
  ): StorageOperationResult<Transaction> {
    try {
      // TODO: Get from new data layer
      // const existingTransaction = await dataLayer.read('transactions', id);
      const existingTransaction: Transaction | undefined = undefined;
      if (!existingTransaction) {
        return {
          success: false,
          errors: [
            {
              field: "id",
              message: "Transacao nao encontrada",
              code: "not_found",
            },
          ],
        };
      }

      // Merge with existing data
      const mergedData = { ...existingTransaction, ...transactionData };

      // Validate merged data
      const validation =
        validationService.validateTransactionWithBusinessRules(mergedData);

      if (!validation.success) {
        this.logOperation("update", "transaction", false, validation.errors);
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Update using original storage
      await updateTransaction(id, validation.data as any);

      // Get the updated transaction
      const updatedTransactions = transactions;
      const updatedTransaction = updatedTransactions.find((t) => t.id === id);

      this.logOperation("update", "transaction", true);
      return {
        success: true,
        data: updatedTransaction,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  getTransactions(): StorageOperationResult<Transaction[]> {
    try {
      const transactions = transactions;

      // Validate all transactions
      const validationResult =
        validationService.validateTransactions(transactions);

      if (!validationResult.success) {
        // Log validation errors but still return data
        this.logOperation(
          "get",
          "transactions",
          false,
          validationResult.errors,
        );
        return {
          success: false,
          data: transactions,
          errors: validationResult.errors,
          warnings: ["Some transactions have validation issues"],
        };
      }

      return {
        success: true,
        data: transactions,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  // Contact operations with validation
  saveContact(contactData: ContactInput): StorageOperationResult<Contact> {
    try {
      const validation = validationService.validateContact(contactData);

      if (!validation.success) {
        this.logOperation("save", "contact", false, validation.errors);
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check for duplicate email
      const existingContacts = contacts;
      const duplicateEmail = existingContacts.find(
        (c) => c.email === validation.data!.email,
      );

      if (duplicateEmail) {
        return {
          success: false,
          errors: [
            {
              field: "email",
              message: "Este email ja esta cadastrado",
              code: "duplicate_email",
            },
          ],
        };
      }

      const savedContact = storage.saveContact(validation.data as any);

      this.logOperation("save", "contact", true);
      return {
        success: true,
        data: savedContact,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  updateContact(
    id: string,
    contactData: Partial<ContactInput>,
  ): StorageOperationResult<Contact> {
    try {
      const contacts = contacts;
      const existingContact = contacts.find((c) => c.id === id);
      if (!existingContact) {
        return {
          success: false,
          errors: [
            {
              field: "id",
              message: "Contato nao encontrado",
              code: "not_found",
            },
          ],
        };
      }

      const mergedData = { ...existingContact, ...contactData };
      const validation = validationService.validateContact(mergedData);

      if (!validation.success) {
        this.logOperation("update", "contact", false, validation.errors);
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check for duplicate email (excluding current contact)
      if (contactData.email) {
        const allContacts = contacts;
        const duplicateEmail = allContacts.find(
          (c) => c.email === contactData.email && c.id !== id,
        );

        if (duplicateEmail) {
          return {
            success: false,
            errors: [
              {
                field: "email",
                message: "Este email ja esta cadastrado",
                code: "duplicate_email",
              },
            ],
          };
        }
      }

      storage.updateContact(id, validation.data as any);

      // Get the updated contact
      const updatedContacts = contacts;
      const updatedContact = updatedContacts.find((c) => c.id === id);

      this.logOperation("update", "contact", true);
      return {
        success: true,
        data: updatedContact,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  // Account operations with validation
  saveAccount(accountData: AccountInput): StorageOperationResult<Account> {
    try {
      const validation = validationService.validateAccount(accountData);

      if (!validation.success) {
        this.logOperation("save", "account", false, validation.errors);
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Check for duplicate account name
      const existingAccounts = accounts;
      const duplicateName = existingAccounts.find(
        (a) => a.name === validation.data!.name,
      );

      if (duplicateName) {
        return {
          success: false,
          errors: [
            {
              field: "name",
              message: "Ja existe uma conta com este nome",
              code: "duplicate_name",
            },
          ],
        };
      }

      const savedAccount = storage.saveAccount(validation.data as any);

      this.logOperation("save", "account", true);
      return {
        success: true,
        data: savedAccount,
        errors: [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  // Data integrity validation
  validateDataIntegrity(): StorageOperationResult<{
    transactions: ValidationError[];
    contacts: ValidationError[];
    summary: string;
  }> {
    try {
      const results = {
        transactions: [] as ValidationError[],
        contacts: [] as ValidationError[],
        summary: "",
      };

      // Validate all transactions
      const transactions = transactions;
      const transactionValidation =
        validationService.validateTransactions(transactions);
      if (!transactionValidation.success) {
        results.transactions = transactionValidation.errors;
      }

      // Validate all contacts
      const contacts = contacts;
      const contactValidation = validationService.validateContacts(contacts);
      if (!contactValidation.success) {
        results.contacts = contactValidation.errors;
      }

      const totalErrors = results.transactions.length + results.contacts.length;
      results.summary =
        totalErrors === 0
          ? "Todos os dados estao validos"
          : `${totalErrors} problemas de validacao encontrados`;

      return {
        success: totalErrors === 0,
        data: results,
        errors:
          totalErrors > 0
            ? [
                {
                  field: "integrity",
                  message: results.summary,
                  code: "integrity_violation",
                },
              ]
            : [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        errors: [
          {
            field: "system",
            message: errorMessage,
            code: "system_error",
          },
        ],
      };
    }
  }

  // Bulk operations with validation
  bulkSaveTransactions(
    transactions: TransactionInput[],
  ): StorageOperationResult<Transaction[]> {
    const results: Transaction[] = [];
    const errors: ValidationError[] = [];

    transactions.forEach((transaction, index) => {
      const result = this.saveTransaction(transaction);
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
      data: results,
      errors,
    };
  }

  // Proxy methods for backward compatibility
  getContacts() {
    return contacts;
  }
  getAccounts() {
    return accounts;
  }
  getGoals() {
    return goals;
  }
  getInvestments() {
    return storage.getInvestments();
  }
  getTrips() {
    return storage.getTrips();
  }
  getUserProfile() {
    return storage.getUserProfile();
  }
  getTransactionById(id: string) {
    const transactions = transactions;
    return transactions.find((t) => t.id === id) || null;
  }
  getContactById(id: string) {
    const contacts = contacts;
    return contacts.find((c) => c.id === id) || null;
  }

  deleteTransaction(id: string) {
    return await deleteTransaction(id);
  }
  deleteContact(id: string) {
    return storage.deleteContact(id);
  }
  deleteAccount(id: string) {
    return await deleteAccount(id);
  }
  deleteGoal(id: string) {
    return storage.deleteGoal(id);
  }
  deleteInvestment(id: string) {
    return storage.deleteInvestment(id);
  }
  deleteTrip(id: string) {
    return storage.deleteTrip(id);
  }
}

// Singleton instance
export const validatedStorage = new ValidatedStorage();

// Export for easy migration
export { storage as legacyStorage };
