"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import AdvancedReportsDashboard from "@/components/advanced-reports-dashboard";

export default function ReportsPage() {
  return (
    <ModernAppLayout
      title="Relatórios"
      subtitle="Análises detalhadas e insights sobre seus padrões financeiros"
    >
      <div className="p-4 md:p-6">
        <AdvancedReportsDashboard />
      </div>
    </ModernAppLayout>
  );
}
