import { Metadata } from "next";
import MLAnalyticsDashboard from "@/components/ml-analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics com IA | SuaGrana",
  description:
    "Dashboard avançado de analytics financeiro com inteligência artificial, insights preditivos e detecção de anomalias.",
};

export default function MLAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <MLAnalyticsDashboard />
    </div>
  );
}
