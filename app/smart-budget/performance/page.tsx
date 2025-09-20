import { Metadata } from "next";
import BudgetPerformanceAnalyzer from "@/components/budget-performance-analyzer";

export const metadata: Metadata = {
  title: "Análise de Performance - Orçamento Inteligente | SuaGrana",
  description:
    "Análise detalhada da performance do sistema de orçamento inteligente com métricas avançadas e insights de IA.",
};

export default function BudgetPerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BudgetPerformanceAnalyzer />
    </div>
  );
}
