import { memoryOptimizer } from "../memory-optimizer";

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
      // Buscar apenas do cache em memória
      const cached = memoryOptimizer.get(key);
      if (cached !== null) {
        return cached as T;
      }

      // Se não estiver em cache, retornar null (dados vêm do banco)
      return null;
    } catch (error) {
      logComponents.error("Error ao buscar item ${key}:", error);
      return null;
    }
  }

  /** @deprecated Use dataService instead */
  async setItem<T>(key: string, value: T): Promise<void> {
    console.warn(`DEPRECATED: enhanced-storage setItem(${key}) - Use dataService instead`);
    try {
      // Apenas atualizar cache em memória (dados vão para o banco via dataService)
      memoryOptimizer.set(key, value, 5);

      await this.auditChange(key, "SET", value);
    } catch (error) {
      logComponents.error("Error ao salvar item ${key}:", error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Apenas remover do cache em memória (dados são removidos do banco via dataService)
      memoryOptimizer.remove(key);
      await this.auditChange(key, "REMOVE", null);
    } catch (error) {
      logComponents.error("Error ao remover item ${key}:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      // Apenas limpar cache em memória (dados são gerenciados pelo banco via dataService)
      memoryOptimizer.clear();
      await this.auditChange("ALL", "CLEAR", null);
    } catch (error) {
      logComponents.error("Error ao limpar o storage:", error);
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
