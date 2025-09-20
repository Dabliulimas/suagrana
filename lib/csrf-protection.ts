// CSRF Protection utilities

import { generateCSRFToken } from "./crypto";

class CSRFProtection {
  private static instance: CSRFProtection;
  private currentToken: string | null = null;

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    this.currentToken = generateCSRFToken();

    // Store in sessionStorage (not localStorage for security)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("csrf-token", this.currentToken);
    }

    return this.currentToken;
  }

  /**
   * Get the current CSRF token
   */
  getToken(): string | null {
    if (this.currentToken) {
      return this.currentToken;
    }

    // Try to get from sessionStorage
    if (typeof window !== "undefined") {
      this.currentToken = sessionStorage.getItem("csrf-token");
    }

    return this.currentToken;
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return currentToken !== null && currentToken === token;
  }

  /**
   * Clear the current CSRF token
   */
  clearToken(): void {
    this.currentToken = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("csrf-token");
    }
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToHeaders(
    headers: Record<string, string> = {},
  ): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
    return headers;
  }

  /**
   * Create a fetch wrapper with CSRF protection
   */
  createProtectedFetch() {
    return async (url: string, options: RequestInit = {}) => {
      const token = this.getToken();

      // Add CSRF token for state-changing requests
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(
          options.method?.toUpperCase() || "GET",
        )
      ) {
        if (!token) {
          throw new Error("CSRF token not available");
        }

        options.headers = {
          ...options.headers,
          "X-CSRF-Token": token,
        };
      }

      return fetch(url, options);
    };
  }
}

export const csrfProtection = CSRFProtection.getInstance();

/**
 * React hook for CSRF protection
 */
export function useCSRFProtection() {
  const generateToken = () => csrfProtection.generateToken();
  const getToken = () => csrfProtection.getToken();
  const validateToken = (token: string) => csrfProtection.validateToken(token);
  const clearToken = () => csrfProtection.clearToken();
  const protectedFetch = csrfProtection.createProtectedFetch();

  return {
    generateToken,
    getToken,
    validateToken,
    clearToken,
    protectedFetch,
  };
}
