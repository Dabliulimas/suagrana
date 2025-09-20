import { Metadata } from "next";
import AdvancedAIDashboard from "@/components/advanced-ai-dashboard";

export const metadata: Metadata = {
  title: "Assistente IA | SuaGrana",
  description:
    "Análises preditivas e recomendações personalizadas com inteligência artificial",
};

export default function AIDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <AdvancedAIDashboard />
    </div>
  );
}
