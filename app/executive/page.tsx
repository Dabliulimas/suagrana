import { Metadata } from "next";
import ExecutiveDashboard from "@/components/dashboards/executive/executive-dashboard";

export const metadata: Metadata = {
  title: "Dashboard Executivo | SuaGrana",
  description:
    "Visão estratégica e indicadores-chave de performance para tomada de decisões executivas com métricas financeiras, operacionais e estratégicas.",
};

export default function ExecutivePage() {
  return (
    <div className="container mx-auto p-6">
      <ExecutiveDashboard />
    </div>
  );
}
