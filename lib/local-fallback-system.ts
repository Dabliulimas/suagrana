"use client";

// Sistema de fallback para quando a API não está disponível
export class LocalFallbackSystem {
  private static instance: LocalFallbackSystem;

  static getInstance(): LocalFallbackSystem {
    if (!LocalFallbackSystem.instance) {
      LocalFallbackSystem.instance = new LocalFallbackSystem();
    }
    return LocalFallbackSystem.instance;
  }

  // Dados padrão para cada tipo de recurso
  private getDefaultData(resourceType: string): any[] {
    const defaults = {
      accounts: [
        {
          id: "default-1",
          name: "Conta Corrente",
          type: "checking",
          balance: 0,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      transactions: [],
      goals: [],
      contacts: [],
      trips: [],
      investments: [],
    };

    return defaults[resourceType as keyof typeof defaults] || [];
  }

  // Obter dados com fallback
  async getData(resourceType: string): Promise<any[]> {
    try {
      // Tentar localStorage primeiro
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`sua-grana-${resourceType}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }

      // Retornar dados padrão
      return this.getDefaultData(resourceType);
    } catch (error) {
      console.log(`📦 Usando dados padrão para ${resourceType}`);
      return this.getDefaultData(resourceType);
    }
  }

  // Salvar dados localmente
  async saveData(resourceType: string, data: any[]): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`sua-grana-${resourceType}`, JSON.stringify(data));
      }
    } catch (error) {
      console.log(`⚠️ Não foi possível salvar ${resourceType} localmente`);
    }
  }
}

export const localFallback = LocalFallbackSystem.getInstance();
