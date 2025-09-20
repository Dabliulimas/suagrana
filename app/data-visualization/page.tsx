import { Metadata } from "next";
import InteractiveDataVisualization from "@/components/interactive-data-visualization";

export const metadata: Metadata = {
  title: "Visualização de Dados | SuaGrana",
  description:
    "Ferramenta interativa para criar visualizações personalizadas dos seus dados financeiros com gráficos avançados e filtros dinâmicos.",
};

export default function DataVisualizationPage() {
  return (
    <div className="container mx-auto p-6">
      <InteractiveDataVisualization />
    </div>
  );
}
