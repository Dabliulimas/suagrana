import { Metadata } from "next";
import EnhancedReportsSystem from "@/components/enhanced-reports-system";

export const metadata: Metadata = {
  title: "Sistema de Relatórios Avançados | SuaGrana",
  description:
    "Crie relatórios personalizados com visualizações avançadas e exportação em múltiplos formatos.",
};

export default function EnhancedReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EnhancedReportsSystem />
    </div>
  );
}
