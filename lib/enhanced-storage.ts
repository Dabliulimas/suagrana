import { memoryOptimizer } from "./memory-optimizer";

import { logComponents } from "../logger";
class EnhancedStorage {
  private auditChange: (
    key: string,
    operation: string,
    value: any,
  ) => Promise<void>;

  constructor(
    auditChange: (key: string, operation: string, value: any) => Promise<void>,
  ) {
    this.auditChange = auditChange;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      // Tentar buscar do cache primeiro
      const cached = memoryOptimizer.get(key);
      if (cached !== null) {
        return cached as T;
      }

      // Se não estiver em cache, buscar do storage
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item) as T;

      // Adicionar ao cache
      memoryOptimizer.set(key, parsed, 5); // 5 minutos de TTL

      return parsed;
    } catch (error) {
      logComponents.error("Erro ao buscar item ${key}:", error);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      }

      // Atualizar cache
      memoryOptimizer.set(key, value, 5);

      await this.auditChange(key, "SET", value);
    } catch (error) {
      logComponents.error("Erro ao salvar item ${key}:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      memoryOptimizer.remove(key);
      await this.auditChange(key, "REMOVE", null);
    } catch (error) {
      logComponents.error("Erro ao remover item ${key}:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
      memoryOptimizer.clear();
      await this.auditChange("ALL", "CLEAR", null);
    } catch (error) {
      logComponents.error("Erro ao limpar o storage:", error);
      throw error;
    }
  }
}

export default EnhancedStorage;
export { EnhancedStorage };

// Create a default instance for convenience
const defaultAuditFunction = async (
  key: string,
  operation: string,
  value: any,
) => {
  // Default audit function - can be enhanced later
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`Storage ${operation}: ${key}`, value);
  }
};

export const enhancedStorage = new EnhancedStorage(defaultAuditFunction);
