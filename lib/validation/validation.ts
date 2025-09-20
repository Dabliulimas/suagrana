/**
 * Utility functions for data validation
 */

/**
 * Validates email format using regex
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates if a string is not empty after trimming
 */
export const validateRequiredString = (value: string): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Validates if a value is a positive number
 */
export const validatePositiveNumber = (value: unknown): boolean => {
  return typeof value === "number" && !isNaN(value) && value > 0;
};

/**
 * Validates if an array contains only valid string IDs
 */
export const validateStringArray = (arr: unknown): boolean => {
  return (
    Array.isArray(arr) &&
    arr.every((item) => typeof item === "string" && item.trim().length > 0)
  );
};

/**
 * Validates contact object structure
 */
export const validateContact = (contact: unknown): boolean => {
  if (!contact || typeof contact !== "object") return false;
  if (!validateRequiredString(contact.name)) return false;
  if (!validateEmail(contact.email)) return false;
  return true;
};

/**
 * Validates trip object structure
 */
export const validateTrip = (trip: unknown): boolean => {
  if (!trip || typeof trip !== "object") return false;
  if (!validateRequiredString(trip.id)) return false;
  if (!validateRequiredString(trip.name)) return false;
  if (!validateRequiredString(trip.destination)) return false;
  if (!validatePositiveNumber(trip.budget)) return false;
  if (!validateStringArray(trip.participants)) return false;
  return true;
};

/**
 * Validates investment object structure
 */
export const validateInvestment = (investment: unknown): boolean => {
  if (!investment || typeof investment !== "object") return false;
  if (!validateRequiredString(investment.name)) return false;
  if (!validatePositiveNumber(investment.quantity)) return false;
  if (!validatePositiveNumber(investment.price)) return false;
  if (!validatePositiveNumber(investment.totalValue)) return false;
  if (!["buy", "sell"].includes(investment.operation)) return false;
  return true;
};

/**
 * Sanitizes string input by trimming and removing dangerous characters
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, ""); // Remove basic HTML tags
};

/**
 * Sanitizes numeric input
 */
export const sanitizeNumber = (input: unknown): number => {
  const num = parseFloat(input);
  return isNaN(num) ? 0 : num;
};

/**
 * Deep validates an object against a schema
 */
export const validateObject = (
  obj: unknown,
  schema: Record<string, (value: unknown) => boolean>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(obj[key])) {
      errors.push(`Invalid ${key}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
