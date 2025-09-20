"use client";

import { storage, type Transaction } from "./storage";

import { logComponents } from "../logger";
// Interface para sugestões de auto-preenchimento
export interface AutoFillSuggestion {
  description: string;
  amount?: number;
  category: string;
  tags: string[];
  confidence: number;
  frequency: number;
  lastUsed: string;
  averageAmount: number;
  isRecurring: boolean;
  recurringPattern?: "weekly" | "monthly" | "yearly";
  nextExpectedDate?: string;
}

// Interface para padrões de receitas recorrentes
interface RecurringIncomePattern {
  description: string;
  normalizedDescription: string;
  amounts: number[];
  dates: string[];
  category: string;
  tags: string[];
  frequency: number;
  averageAmount: number;
  lastAmount: number;
  lastDate: string;
  intervalDays: number[];
  averageInterval: number;
  isStable: boolean; // Se o valor é consistente
  confidence: number;
}

// Classe principal para auto-preenchimento inteligente
export class AutoFillEngine {
  private patterns: RecurringIncomePattern[] = [];
  private minFrequency = 2; // Mínimo de ocorrências para considerar padrão
  private maxSuggestions = 8;
  private suggestionCache = new Map<string, AutoFillSuggestion[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos
  private lastCacheClean = Date.now();

  constructor() {
    this.loadPatterns();
    this.analyzeRecurringIncomes();
  }

  // Carrega padrões do localStorage
  private loadPatterns(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("auto-fill-patterns");
      if (stored) {
        this.patterns = JSON.parse(stored);
      }
    } catch (error) {
      logComponents.error("Erro ao carregar padrões de auto-preenchimento:", error);
      this.patterns = [];
    }
  }

  // Salva padrões no localStorage
  private savePatterns(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("auto-fill-patterns", JSON.stringify(this.patterns));
    } catch (error) {
      logComponents.error("Erro ao salvar padrões de auto-preenchimento:", error);
    }
  }

  // Normaliza descrição para comparação
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .trim()
      .replace(/\d+/g, "") // Remove números
      .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim();
  }

  // Calcula intervalo entre datas em dias
  private calculateDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Detecta padrão de recorrência baseado nos intervalos
  private detectRecurringPattern(
    intervals: number[],
  ): "weekly" | "monthly" | "yearly" | null {
    if (intervals.length < 2) return null;

    const avgInterval =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance =
      intervals.reduce(
        (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
        0,
      ) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Se a variação é muito alta, não é um padrão consistente
    if (stdDev > avgInterval * 0.3) return null;

    // Detecta padrões baseado no intervalo médio
    if (avgInterval >= 6 && avgInterval <= 8) return "weekly"; // ~7 dias
    if (avgInterval >= 28 && avgInterval <= 32) return "monthly"; // ~30 dias
    if (avgInterval >= 360 && avgInterval <= 370) return "yearly"; // ~365 dias

    return null;
  }

  // Analisa receitas recorrentes das transações históricas
  public analyzeRecurringIncomes(): void {
    const transactions = transactions;
    const incomeTransactions = transactions.filter((t) => t.type === "income");

    // Agrupa por descrição normalizada
    const groupedTransactions = new Map<string, Transaction[]>();

    incomeTransactions.forEach((transaction) => {
      const normalized = this.normalizeDescription(transaction.description);
      if (!groupedTransactions.has(normalized)) {
        groupedTransactions.set(normalized, []);
      }
      groupedTransactions.get(normalized)!.push(transaction);
    });

    // Analisa cada grupo para detectar padrões
    this.patterns = [];

    groupedTransactions.forEach((transactions, normalizedDesc) => {
      if (transactions.length < this.minFrequency) return;

      // Ordena por data
      transactions.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const amounts = transactions.map((t) => t.amount);
      const dates = transactions.map((t) => t.date);
      const categories = [...new Set(transactions.map((t) => t.category))];
      const allTags = transactions.flatMap((t) => t.tags || []);
      const uniqueTags = [...new Set(allTags)];

      // Calcula intervalos entre transações
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(this.calculateDaysBetween(dates[i - 1], dates[i]));
      }

      const averageAmount =
        amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const averageInterval =
        intervals.length > 0
          ? intervals.reduce((sum, interval) => sum + interval, 0) /
            intervals.length
          : 0;

      // Verifica se os valores são estáveis (variação < 20%)
      const amountVariance =
        amounts.reduce(
          (sum, amount) => sum + Math.pow(amount - averageAmount, 2),
          0,
        ) / amounts.length;
      const amountStdDev = Math.sqrt(amountVariance);
      const isStable = amountStdDev < averageAmount * 0.2;

      // Calcula confiança baseada na frequência, estabilidade e consistência temporal
      let confidence = Math.min(transactions.length / 10, 1) * 0.4; // Frequência (40%)
      confidence += isStable ? 0.3 : 0.1; // Estabilidade de valor (30%)
      confidence += intervals.length > 0 && averageInterval > 0 ? 0.3 : 0.1; // Consistência temporal (30%)

      const pattern: RecurringIncomePattern = {
        description: transactions[0].description, // Descrição original mais recente
        normalizedDescription: normalizedDesc,
        amounts,
        dates,
        category: categories[0], // Categoria mais comum
        tags: uniqueTags,
        frequency: transactions.length,
        averageAmount,
        lastAmount: amounts[amounts.length - 1],
        lastDate: dates[dates.length - 1],
        intervalDays: intervals,
        averageInterval,
        isStable,
        confidence,
      };

      this.patterns.push(pattern);
    });

    // Ordena por confiança e frequência
    this.patterns.sort((a, b) => {
      const scoreA = a.confidence * 0.7 + (a.frequency / 20) * 0.3;
      const scoreB = b.confidence * 0.7 + (b.frequency / 20) * 0.3;
      return scoreB - scoreA;
    });

    this.savePatterns();
  }

  // Obtém sugestões de auto-preenchimento baseadas na descrição parcial
  public getAutoFillSuggestions(
    partialDescription: string,
  ): AutoFillSuggestion[] {
    if (!partialDescription || partialDescription.length < 2) return [];

    const normalizedInput = this.normalizeDescription(partialDescription);

    // Verifica cache primeiro
    const cacheKey = normalizedInput.toLowerCase();
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    // Limpa cache antigo periodicamente
    this.cleanCacheIfNeeded();

    const suggestions: AutoFillSuggestion[] = [];

    // Busca otimizada: primeiro busca exata, depois similaridade
    const exactMatches: AutoFillSuggestion[] = [];
    const partialMatches: AutoFillSuggestion[] = [];

    for (const pattern of this.patterns) {
      // Busca rápida por substring primeiro
      if (
        pattern.normalizedDescription.includes(normalizedInput) ||
        normalizedInput.includes(pattern.normalizedDescription)
      ) {
        const suggestion = this.createSuggestionFromPattern(pattern, 0.9);
        exactMatches.push(suggestion);
      } else {
        // Só calcula similaridade se não houve match exato
        const similarity = this.calculateFastSimilarity(
          normalizedInput,
          pattern.normalizedDescription,
        );

        if (similarity > 0.4) {
          // Threshold mais alto para performance
          const suggestion = this.createSuggestionFromPattern(
            pattern,
            similarity,
          );
          partialMatches.push(suggestion);
        }
      }
    }

    // Combina resultados: matches exatos primeiro
    const allSuggestions = [...exactMatches, ...partialMatches]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.maxSuggestions);

    // Armazena no cache
    this.suggestionCache.set(cacheKey, allSuggestions);

    return allSuggestions;
  }

  // Cria sugestão a partir de um padrão (método auxiliar)
  private createSuggestionFromPattern(
    pattern: RecurringIncomePattern,
    similarity: number,
  ): AutoFillSuggestion {
    const recurringPattern = this.detectRecurringPattern(pattern.intervalDays);

    // Calcula próxima data esperada se for recorrente
    let nextExpectedDate: string | undefined;
    if (recurringPattern && pattern.averageInterval > 0) {
      const lastDate = new Date(pattern.lastDate);
      lastDate.setDate(lastDate.getDate() + pattern.averageInterval);
      nextExpectedDate = lastDate.toISOString().split("T")[0];
    }

    return {
      description: pattern.description,
      amount: pattern.isStable ? pattern.averageAmount : undefined,
      category: pattern.category,
      tags: pattern.tags,
      confidence: pattern.confidence * similarity,
      frequency: pattern.frequency,
      lastUsed: pattern.lastDate,
      averageAmount: pattern.averageAmount,
      isRecurring: !!recurringPattern,
      recurringPattern: recurringPattern || undefined,
      nextExpectedDate,
    };
  }

  // Limpa cache se necessário
  private cleanCacheIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCacheClean > this.cacheTimeout) {
      this.suggestionCache.clear();
      this.lastCacheClean = now;
    }
  }

  // Algoritmo rápido de similaridade (substitui Levenshtein pesado)
  private calculateFastSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Verifica se uma string contém a outra (mais rápido)
    if (str1.includes(str2) || str2.includes(str1)) {
      return (
        Math.max(str2.length / str1.length, str1.length / str2.length) * 0.9
      );
    }

    // Algoritmo baseado em caracteres comuns (muito mais rápido que Levenshtein)
    const set1 = new Set(str1.split(""));
    const set2 = new Set(str2.split(""));

    let commonChars = 0;
    for (const char of set1) {
      if (set2.has(char)) {
        commonChars++;
      }
    }

    const totalUniqueChars = set1.size + set2.size - commonChars;
    return commonChars / totalUniqueChars;
  }

  // Mantém o algoritmo completo para casos especiais (não usado na busca principal)
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Verifica se uma string contém a outra
    if (str1.includes(str2) || str2.includes(str1)) {
      return (
        Math.max(str2.length / str1.length, str1.length / str2.length) * 0.8
      );
    }

    // Usa algoritmo rápido por padrão
    return this.calculateFastSimilarity(str1, str2);
  }

  // Obtém estatísticas dos padrões
  public getPatternStats(): {
    totalPatterns: number;
    recurringPatterns: number;
    stablePatterns: number;
    averageConfidence: number;
  } {
    const recurringCount = this.patterns.filter(
      (p) => this.detectRecurringPattern(p.intervalDays) !== null,
    ).length;

    const stableCount = this.patterns.filter((p) => p.isStable).length;

    const avgConfidence =
      this.patterns.length > 0
        ? this.patterns.reduce((sum, p) => sum + p.confidence, 0) /
          this.patterns.length
        : 0;

    return {
      totalPatterns: this.patterns.length,
      recurringPatterns: recurringCount,
      stablePatterns: stableCount,
      averageConfidence: avgConfidence,
    };
  }

  // Aprende com uma nova transação de receita
  public learnFromTransaction(transaction: Transaction): void {
    if (transaction.type !== "income") return;

    // Re-analisa os padrões para incluir a nova transação
    this.analyzeRecurringIncomes();
  }

  // Limpa padrões antigos (mais de 1 ano sem uso)
  public cleanOldPatterns(): void {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().split("T")[0];

    this.patterns = this.patterns.filter(
      (pattern) => pattern.lastDate >= cutoffDate && pattern.frequency >= 2,
    );

    this.savePatterns();
  }
}

// Instância singleton
export const autoFillEngine = new AutoFillEngine();

// Executa limpeza de padrões antigos semanalmente
if (typeof window !== "undefined") {
  const lastCleanup = localStorage.getItem("last-autofill-cleanup");
  const now = new Date().toISOString().split("T")[0];

  if (!lastCleanup || lastCleanup !== now) {
    const daysSinceLastCleanup = lastCleanup
      ? Math.floor(
          (new Date(now).getTime() - new Date(lastCleanup).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 7;

    if (daysSinceLastCleanup >= 7) {
      setTimeout(() => {
        autoFillEngine.cleanOldPatterns();
        localStorage.setItem("last-autofill-cleanup", now);
      }, 2000);
    }
  }
}
