/**
import { logComponents } from "../logger";
 * Retry mechanism for failed operations
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error,
  ) {
    super(message);
    this.name = "RetryError";
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw new RetryError(
          `Operation failed after ${maxAttempts} attempts`,
          attempt,
          lastError,
        );
      }

      // Calculate delay with optional exponential backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      // Call retry callback if provided
      onRetry?.(attempt, lastError);

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry specifically for storage operations
 */
export async function retryStorageOperation<T>(
  operation: () => T,
  operationName: string,
): Promise<T> {
  return retry(
    () => {
      try {
        return operation();
      } catch (error) {
        logComponents.error("Storage operation failed: ${operationName}", error);
        throw error;
      }
    },
    {
      maxAttempts: 3,
      delay: 500,
      backoff: true,
      onRetry: (attempt, error) => {
        console.warn(
          `Retrying storage operation ${operationName} (attempt ${attempt})`,
          error,
        );
      },
    },
  );
}

/**
 * Retry for network operations (future use)
 */
export async function retryNetworkOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> {
  return retry(operation, {
    maxAttempts: 5,
    delay: 1000,
    backoff: true,
    onRetry: (attempt, error) => {
      console.warn(
        `Retrying network operation ${operationName} (attempt ${attempt})`,
        error,
      );
    },
  });
}
