// Data sanitization utilities to prevent injection attacks

/**
 * Sanitizes string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return String(input);
  }

  return input
    .replace(/[<>\"'&]/g, "") // Remove potentially dangerous characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Sanitizes object properties recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ""); // Only allow word characters, @, ., and -
}

/**
 * Sanitizes numeric input
 */
export function sanitizeNumber(input: any): number {
  const num = Number(input);
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitizes boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === "boolean") {
    return input;
  }

  if (typeof input === "string") {
    return input.toLowerCase() === "true";
  }

  return Boolean(input);
}

/**
 * Validates and sanitizes ID strings
 */
export function sanitizeId(id: any): string {
  if (typeof id !== "string") {
    return String(id);
  }

  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Sanitizes log messages to prevent log injection
 */
export function sanitizeLogMessage(message: string): string {
  if (typeof message !== "string") {
    return String(message);
  }

  return message
    .replace(/[\r\n]/g, " ") // Replace newlines with spaces
    .replace(/\t/g, " ") // Replace tabs with spaces
    .trim();
}
