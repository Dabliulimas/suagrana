/**
 * Transaction Data Loader
 * Sistema de carregamento paginado e cache para transações
 * Implementa otimizações de performance e gerenciamento de memória
 */

import { type Transaction } from "@/lib/storage";

import { logComponents } from "../logger";
interface PageData {
  items: Transaction[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CacheEntry {
  data: PageData;
  timestamp: number;
  filters: any;
}

class TransactionDataLoader {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private readonly MAX_CACHE_SIZE = 50;

  /**
   * Gera chave única para cache baseada nos parâmetros
   */
  private generateCacheKey(
    page: number,
    filters: any,
    pageSize: number = 50,
  ): string {
    const filterString = JSON.stringify(filters || {});
    return `page_${page}_size_${pageSize}_filters_${btoa(filterString)}`;
  }

  /**
   * Verifica se entrada do cache ainda é válida
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Limpa entradas expiradas do cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gerencia tamanho do cache removendo entradas mais antigas
   */
  private manageCacheSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove as 10 entradas mais antigas
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      );

      for (let i = 0; i < 10 && this.cache.size > this.MAX_CACHE_SIZE; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Aplica filtros às transações
   */
  private applyFilters(
    transactions: Transaction[],
    filters: any,
  ): Transaction[] {
    if (!filters) return transactions;

    let filtered = [...transactions];

    // Filtro por tipo
    if (filters.type && filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    // Filtro por categoria
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    // Filtro por busca textual
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          (t.account && t.account.toLowerCase().includes(searchLower)) ||
          (t.notes && t.notes.toLowerCase().includes(searchLower)),
      );
    }

    // Filtro por data
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate) {
        filtered = filtered.filter(
          (t) => new Date(t.date) >= new Date(startDate),
        );
      }
      if (endDate) {
        filtered = filtered.filter(
          (t) => new Date(t.date) <= new Date(endDate),
        );
      }
    }

    // Ordenação por data (mais recente primeiro)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return filtered;
  }

  /**
   * Carrega página de dados com cache e filtros
   */
  async loadPage(
    dataProvider: () => Promise<Transaction[]> | Transaction[],
    page: number = 1,
    filters: any = null,
    pageSize: number = 50,
  ): Promise<PageData> {
    // Limpa cache expirado
    this.cleanExpiredCache();

    // Verifica cache
    const cacheKey = this.generateCacheKey(page, filters, pageSize);
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      return cachedEntry.data;
    }

    try {
      // Carrega dados
      const allTransactions = await Promise.resolve(dataProvider());

      // Aplica filtros
      const filteredTransactions = this.applyFilters(allTransactions, filters);

      // Calcula paginação
      const totalItems = filteredTransactions.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items = filteredTransactions.slice(startIndex, endIndex);

      const pageData: PageData = {
        items,
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      // Armazena no cache
      this.cache.set(cacheKey, {
        data: pageData,
        timestamp: Date.now(),
        filters: filters,
      });

      // Gerencia tamanho do cache
      this.manageCacheSize();

      return pageData;
    } catch (error) {
      logComponents.error("Erro ao carregar dados da página:", error);
      throw new Error("Falha ao carregar dados das transações");
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Limpa cache específico por filtros
   */
  clearCacheByFilters(filters: any): void {
    const filterString = JSON.stringify(filters || {});
    for (const [key, entry] of this.cache.entries()) {
      if (JSON.stringify(entry.filters) === filterString) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalida cache quando dados são modificados
   */
  invalidateCache(): void {
    this.clearCache();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; timestamp: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // Implementar contador de hits se necessário
      entries,
    };
  }

  /**
   * Pré-carrega próximas páginas para melhor UX
   */
  async preloadNextPages(
    dataProvider: () => Promise<Transaction[]> | Transaction[],
    currentPage: number,
    filters: any = null,
    pageSize: number = 50,
    pagesToPreload: number = 2,
  ): Promise<void> {
    const preloadPromises: Promise<PageData>[] = [];

    for (let i = 1; i <= pagesToPreload; i++) {
      const nextPage = currentPage + i;
      preloadPromises.push(
        this.loadPage(dataProvider, nextPage, filters, pageSize).catch(
          (error) => {
            console.warn(`Falha ao pré-carregar página ${nextPage}:`, error);
            return null as any;
          },
        ),
      );
    }

    await Promise.allSettled(preloadPromises);
  }
}

// Instância singleton
export const transactionDataLoader = new TransactionDataLoader();

// Exporta também a classe para testes
export { TransactionDataLoader };
export type { PageData };
