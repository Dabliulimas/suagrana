"use client";

import { useEffect, useRef } from "react";
import { AutoFillEngine } from "../lib/auto-fill-engine";
import { type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

// Hook personalizado para gerenciar o AutoFillEngine
export function useAutoFill() {
  const engineRef = useRef<AutoFillEngine | null>(null);

  // Inicializa o engine apenas uma vez
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AutoFillEngine();
    }
  }, []);

  // Função para aprender com uma nova transação de receita
  const learnFromTransaction = (transaction: Transaction) => {
    if (engineRef.current && transaction.type === "income") {
      engineRef.current.learnFromTransaction(transaction);
    }
  };

  // Função para obter sugestões
  const getSuggestions = (description: string) => {
    if (!engineRef.current) return [];
    return engineRef.current.getAutoFillSuggestions(description);
  };

  // Função para obter estatísticas dos padrões
  const getPatternStats = () => {
    if (!engineRef.current)
      return {
        totalPatterns: 0,
        averageConfidence: 0,
        mostFrequentPattern: null,
      };
    return engineRef.current.getPatternStats();
  };

  return {
    learnFromTransaction,
    getSuggestions,
    getPatternStats,
    engine: engineRef.current,
  };
}

// Hook para integração automática com o sistema de storage
export function useAutoFillIntegration() {
  const { learnFromTransaction, getSuggestions, getPatternStats } =
    useAutoFill();

  // Monitora novas transações e aprende automaticamente
  useEffect(() => {
    // Auto-learning is handled in the context
  }, []);

  return {
    getSuggestions,
    getPatternStats,
  };
}
