// Enhanced Cryptography Module
import { logComponents } from "./logger";
export async function hashPassword(password: string): Promise<string> {
  if (typeof window === "undefined" || !crypto?.subtle) {
    // Fallback for SSR or when crypto.subtle is not available
    return btoa(password + "sua-grana-salt");
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "sua-grana-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    logComponents.error("Hash failed, using fallback:", error);
    return btoa(password + "sua-grana-salt");
  }
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(passwordHash, hash);
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function encryptData(data: string, key: string): string {
  if (typeof window === "undefined") return data; // Fallback for SSR

  try {
    // Simple XOR encryption for demo purposes
    // In production, use proper encryption like AES
    let encrypted = "";
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    return btoa(encrypted);
  } catch (error) {
    logComponents.error("Encryption failed:", error);
    return data;
  }
}

export function decryptData(encryptedData: string, key: string): string {
  if (typeof window === "undefined") return encryptedData; // Fallback for SSR

  try {
    const encrypted = atob(encryptedData);
    let decrypted = "";
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = encrypted.charCodeAt(i);
      decrypted += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return decrypted;
  } catch (error) {
    logComponents.error("Decryption failed:", error);
    return encryptedData;
  }
}

export function generateSecureToken(): string {
  if (typeof window === "undefined" || !crypto?.getRandomValues) {
    return Date.now().toString() + Math.random().toString(36);
  }

  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  } catch (error) {
    logComponents.error("Token generation failed, using fallback:", error);
    return Date.now().toString() + Math.random().toString(36);
  }
}

export function generateEncryptionKey(): string {
  if (typeof window === "undefined" || !crypto?.getRandomValues) {
    return "default-key-" + Date.now().toString();
  }

  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  } catch (error) {
    logComponents.error("Key generation failed, using fallback:", error);
    return "default-key-" + Date.now().toString();
  }
}

// CSRF Token generation
export function generateCSRFToken(): string {
  if (typeof window === "undefined" || !crypto?.getRandomValues) {
    return "csrf-token-" + Date.now().toString();
  }

  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  } catch (error) {
    logComponents.error("CSRF token generation failed, using fallback:", error);
    return "csrf-token-" + Date.now().toString();
  }
}

// Session token generation
export function generateSessionToken(): string {
  if (typeof window === "undefined" || !crypto?.getRandomValues) {
    return "session-token-" + Date.now().toString();
  }

  try {
    const array = new Uint8Array(48);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  } catch (error) {
    logComponents.error("Session token generation failed, using fallback:", error);
    return "session-token-" + Date.now().toString();
  }
}
