"use client";
import { useState, useEffect, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import {
  type Transaction,
  type Account,
  type Investment,
  type Goal,
} from "../lib/storage";
import {
  FinancialPerformanceAnalyzer,
  type PerformanceMetrics,
  type AnalysisConfig,
  type TrendAnalysis,
  type RiskAssessment,
  type PortfolioOptimization,
} from "../lib/financial/financial-performance-analyzer";

export interface FinancialAnalysis {
  performance: PerformanceMetrics | null;
  trends: TrendAnalysis | null;
  categoryAnalysis: CategoryAnalysis[] | null;
  predictions: PredictiveInsights | null;
}

export function useFinancialAnalysis(
  transactions: Transaction[],
  accounts: Account[],
  investments: Investment[],
  goals: Goal[],
): { analysis: FinancialAnalysis | null; isLoading: boolean } {
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const inputsReady = useMemo(() => {
    return transactions && accounts && investments && goals;
  }, [transactions, accounts, investments, goals]);

  useEffect(() => {
    if (!inputsReady) {
      setIsLoading(true);
      return;
    }

    const analyzer = new FinancialPerformanceAnalyzer();

    const runAnalysis = async () => {
      setIsLoading(true);
      try {
        const [performance, trends, categoryAnalysis, predictions] =
          await Promise.all([
            analyzer.analyzePerformance(),
            analyzer.analyzeTrends(),
            analyzer.analyzeCategoryTrends(),
            analyzer.generatePredictiveInsights(),
          ]);

        setAnalysis({
          performance,
          trends,
          categoryAnalysis,
          predictions,
        });
      } catch (error) {
        logComponents.error("Error during financial analysis:", error);
        setAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [inputsReady, transactions, accounts, investments, goals]);

  return { analysis, isLoading };
}
