import { redisClient } from "../config/database";
import { logger, loggerUtils } from "../utils/logger";
import { config } from "../config/config";

/**
 * Interface para configuração de cache
 */
interface CacheConfig {
  ttl?: number; // Time to live em segundos
  prefix?: string; // Prefixo para a chave
  tags?: string[]; // Tags para invalidação em grupo
}

/**
 * Interface para dados de cache com metadados
 */
interface CacheData<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: string;
}

/**
 * Interface para estatísticas de cache
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Serviço de cache Redis com funcionalidades avançadas
 */
class CacheService {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;
  private readonly version: string;
  private stats: CacheStats;

  constructor() {
    this.defaultTTL = config.cache.ttl;
    this.keyPrefix = "suagrana";
    this.version = process.env.npm_package_version || "1.0.0";
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Gera chave de cache com prefixo e versionamento
   */
  private generateKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || this.keyPrefix;
    return `${finalPrefix}:${this.version}:${key}`;
  }

  /**
   * Gera chave para tags
   */
  private generateTagKey(tag: string): string {
    return `${this.keyPrefix}:tags:${tag}`;
  }

  /**
   * Atualiza estatísticas de cache
   */
  private updateStats(operation: "hit" | "miss" | "set" | "delete"): void {
    this.stats[
      operation === "hit" ? "hits" : operation === "miss" ? "misses" : operation
    ]++;

    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Verifica se o Redis está disponível
   */
  private async isRedisAvailable(): Promise<boolean> {
    try {
      if (!redisClient.isOpen) {
        return false;
      }
      await redisClient.ping();
      return true;
    } catch (error) {
      logger.warn("Redis not available", { error: error.message });
      return false;
    }
  }

  /**
   * Obtém dados do cache
   */
  async get<T = any>(
    key: string,
    options: CacheConfig = {},
  ): Promise<T | null> {
    try {
      if (!(await this.isRedisAvailable())) {
        this.updateStats("miss");
        return null;
      }

      const cacheKey = this.generateKey(key, options.prefix);
      const cached = await redisClient.get(cacheKey);

      if (!cached) {
        this.updateStats("miss");
        loggerUtils.logCache("miss", cacheKey);
        return null;
      }

      const cacheData: CacheData<T> = JSON.parse(cached);

      // Verificar se o cache expirou
      const now = Date.now();
      if (now > cacheData.timestamp + cacheData.ttl * 1000) {
        await this.delete(key, options);
        this.updateStats("miss");
        loggerUtils.logCache("miss", cacheKey);
        return null;
      }

      // Verificar versão
      if (cacheData.version !== this.version) {
        await this.delete(key, options);
        this.updateStats("miss");
        loggerUtils.logCache("miss", cacheKey);
        return null;
      }

      this.updateStats("hit");
      loggerUtils.logCache("hit", cacheKey);
      return cacheData.data;
    } catch (error) {
      logger.error("Cache get failed", { key, error });
      this.updateStats("miss");
      return null;
    }
  }

  /**
   * Armazena dados no cache
   */
  async set<T = any>(
    key: string,
    data: T,
    options: CacheConfig = {},
  ): Promise<boolean> {
    try {
      if (!(await this.isRedisAvailable())) {
        return false;
      }

      const ttl = options.ttl || this.defaultTTL;
      const tags = options.tags || [];
      const cacheKey = this.generateKey(key, options.prefix);

      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        tags,
        version: this.version,
      };

      // Armazenar dados
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData));

      // Associar às tags
      for (const tag of tags) {
        const tagKey = this.generateTagKey(tag);
        await redisClient.sAdd(tagKey, cacheKey);
        await redisClient.expire(tagKey, ttl + 3600); // Tags vivem 1h a mais
      }

      this.updateStats("set");
      loggerUtils.logCache("set", cacheKey, ttl);
      return true;
    } catch (error) {
      logger.error("Cache set failed", { key, error });
      return false;
    }
  }

  /**
   * Remove dados do cache
   */
  async delete(key: string, options: CacheConfig = {}): Promise<boolean> {
    try {
      if (!(await this.isRedisAvailable())) {
        return false;
      }

      const cacheKey = this.generateKey(key, options.prefix);
      const result = await redisClient.del(cacheKey);

      this.updateStats("delete");
      loggerUtils.logCache("delete", cacheKey);
      return result > 0;
    } catch (error) {
      logger.error("Cache delete failed", { key, error });
      return false;
    }
  }

  /**
   * Invalida cache por tags (cache busting)
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      if (!(await this.isRedisAvailable())) {
        return 0;
      }

      let deletedCount = 0;

      for (const tag of tags) {
        const tagKey = this.generateTagKey(tag);
        const cacheKeys = await redisClient.sMembers(tagKey);

        if (cacheKeys.length > 0) {
          const deleted = await redisClient.del(...cacheKeys);
          deletedCount += deleted;

          // Remover a tag
          await redisClient.del(tagKey);
        }
      }

      logger.info("Cache invalidated by tags", { tags, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error("Cache invalidation by tags failed", { tags, error });
      return 0;
    }
  }

  /**
   * Invalida cache por padrão de chave
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      if (!(await this.isRedisAvailable())) {
        return 0;
      }

      const searchPattern = this.generateKey(pattern);
      const keys = await redisClient.keys(searchPattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await redisClient.del(...keys);
      logger.info("Cache invalidated by pattern", {
        pattern,
        deletedCount: deleted,
      });
      return deleted;
    } catch (error) {
      logger.error("Cache invalidation by pattern failed", { pattern, error });
      return 0;
    }
  }

  /**
   * Limpa todo o cache
   */
  async flush(): Promise<boolean> {
    try {
      if (!(await this.isRedisAvailable())) {
        return false;
      }

      const pattern = `${this.keyPrefix}:*`;
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(...keys);
      }

      logger.info("Cache flushed", { deletedKeys: keys.length });
      return true;
    } catch (error) {
      logger.error("Cache flush failed", { error });
      return false;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reseta estatísticas do cache
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Obtém informações do Redis
   */
  async getRedisInfo(): Promise<any> {
    try {
      const info = await redisClient.info();
      const memory = await redisClient.info("memory");
      const keyspace = await redisClient.info("keyspace");

      return {
        connected: redisClient.status === "ready",
        uptime: this.parseRedisInfo(info, "uptime_in_seconds"),
        memory: {
          used: this.parseRedisInfo(memory, "used_memory_human"),
          peak: this.parseRedisInfo(memory, "used_memory_peak_human"),
          rss: this.parseRedisInfo(memory, "used_memory_rss_human"),
        },
        keyspace: this.parseKeyspaceInfo(keyspace),
        clients: this.parseRedisInfo(info, "connected_clients"),
        version: this.parseRedisInfo(info, "redis_version"),
      };
    } catch (error) {
      logger.error("Failed to get Redis info", { error });
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Obtém estatísticas detalhadas do cache
   */
  async getDetailedStats(): Promise<any> {
    try {
      const keys = await redisClient.keys("*");
      const pipeline = redisClient.pipeline();

      // Agrupa chaves por prefixo
      const prefixStats: Record<string, number> = {};
      keys.forEach((key) => {
        const prefix = key.split(":")[0];
        prefixStats[prefix] = (prefixStats[prefix] || 0) + 1;
      });

      // Obtém TTL de algumas chaves para análise
      const sampleKeys = keys.slice(0, 10);
      sampleKeys.forEach((key) => {
        pipeline.ttl(key);
      });

      const ttlResults = await pipeline.exec();
      const avgTtl =
        ttlResults && ttlResults.length > 0
          ? ttlResults.reduce((sum, result) => {
              const ttl = result?.[1] as number;
              return sum + (ttl > 0 ? ttl : 0);
            }, 0) / ttlResults.length
          : 0;

      return {
        totalKeys: keys.length,
        prefixStats,
        averageTtl: Math.round(avgTtl),
        stats: this.getStats(),
      };
    } catch (error) {
      logger.error("Failed to get detailed cache stats", { error });
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        stats: this.getStats(),
      };
    }
  }

  /**
   * Analisa informações do Redis
   */
  private parseRedisInfo(info: string, key: string): string | number {
    const lines = info.split("\r\n");
    const line = lines.find((l) => l.startsWith(`${key}:`));
    if (!line) return "N/A";

    const value = line.split(":")[1];
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }

  /**
   * Analisa informações do keyspace do Redis
   */
  private parseKeyspaceInfo(keyspace: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = keyspace.split("\r\n");

    lines.forEach((line) => {
      if (line.startsWith("db")) {
        const [db, info] = line.split(":");
        const stats = info.split(",").reduce(
          (acc, stat) => {
            const [key, value] = stat.split("=");
            acc[key] = parseInt(value) || value;
            return acc;
          },
          {} as Record<string, any>,
        );
        result[db] = stats;
      }
    });

    return result;
  }

  /**
   * Wrapper para cache com função de fallback
   */
  async remember<T = any>(
    key: string,
    fallback: () => Promise<T>,
    options: CacheConfig = {},
  ): Promise<T> {
    // Tentar obter do cache
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Executar fallback e cachear resultado
    const data = await fallback();
    await this.set(key, data, options);
    return data;
  }
}

// Instância singleton do serviço de cache
export const cacheService = new CacheService();
export default cacheService;
