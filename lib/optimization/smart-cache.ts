// Cache inteligente para otimização de performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live em milliseconds
  maxSize?: number; // Tamanho máximo do cache
  enableCompression?: boolean; // Compressão de dados grandes
}

class SmartCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;
  private readonly maxSize: number;
  private readonly enableCompression: boolean;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutos padrão
    this.maxSize = options.maxSize || 100;
    this.enableCompression = options.enableCompression || false;

    // Limpeza automática a cada minuto
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    if (typeof window !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000); // 1 minuto
    }
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remover entradas expiradas
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }

    // Se ainda exceder o tamanho máximo, remover as menos acessadas
    if (this.cache.size > this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key)) // Apenas entradas que ainda existem
        .sort((a, b) => {
          // Ordenar por frequência de acesso e recência
          const scoreA = a[1].accessCount * (1 / (now - a[1].lastAccessed));
          const scoreB = b[1].accessCount * (1 / (now - b[1].lastAccessed));
          return scoreA - scoreB;
        });

      // Remover as menos importantes
      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  private compressData(data: T): string {
    if (!this.enableCompression) return JSON.stringify(data);

    try {
      // Compressão simples usando JSON + base64
      const jsonString = JSON.stringify(data);
      if (typeof window !== "undefined" && "btoa" in window) {
        return btoa(jsonString);
      }
      return jsonString;
    } catch {
      return JSON.stringify(data);
    }
  }

  private decompressData(compressedData: string): T {
    if (!this.enableCompression) return JSON.parse(compressedData);

    try {
      if (typeof window !== "undefined" && "atob" in window) {
        const jsonString = atob(compressedData);
        return JSON.parse(jsonString);
      }
      return JSON.parse(compressedData);
    } catch {
      return JSON.parse(compressedData);
    }
  }

  set(key: string, data: T): void {
    const now = Date.now();

    // Se o cache está cheio, fazer limpeza
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Verificar se expirou
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Método para obter estatísticas do cache
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) /
            entries.length
          : 0,
      averageAge:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) /
            entries.length
          : 0,
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((entry) => entry.timestamp))
          : 0,
    };
  }

  // Método para pré-carregar dados
  async preload<K extends string>(
    keys: K[],
    loader: (key: K) => Promise<T>,
  ): Promise<void> {
    const promises = keys
      .filter((key) => !this.has(key))
      .map(async (key) => {
        try {
          const data = await loader(key);
          this.set(key, data);
        } catch (error) {
          console.warn(`Failed to preload cache key: ${key}`, error);
        }
      });

    await Promise.all(promises);
  }

  // Método para invalidar cache baseado em padrão
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Cache global para dados financeiros
export const financialCache = new SmartCache({
  ttl: 3 * 60 * 1000, // 3 minutos
  maxSize: 50,
  enableCompression: true,
});

// Cache para cálculos pesados
export const calculationCache = new SmartCache({
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 30,
  enableCompression: false,
});

// Cache para dados de UI
export const uiCache = new SmartCache({
  ttl: 10 * 60 * 1000, // 10 minutos
  maxSize: 20,
  enableCompression: false,
});

export { SmartCache };
export type { CacheOptions, CacheEntry };
