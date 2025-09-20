import { Metadata } from "next";
import SmartBudgetConfig from "@/components/smart-budget-config";

export const metadata: Metadata = {
  title: "Configurações Avançadas - Orçamento Inteligente | SuaGrana",
  description:
    "Configure o sistema de orçamento inteligente com IA, machine learning, alertas e automação avançada.",
};

export default function SmartBudgetConfigPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SmartBudgetConfig />
    </div>
  );
}
