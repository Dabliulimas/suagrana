"use client";

import { EnhancedAccountingDashboard } from "@/components/enhanced-accounting-dashboard";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { BackButton } from "@/components/back-button";

export default function AccountingPage() {
  return (
    <ModernAppLayout
      title="Sistema Contábil Aprimorado"
      subtitle="Gestão contábil com princípios de partida dobrada, balancetes e demonstrações financeiras"
    >
      <div className="p-4 md:p-6 space-y-6">
        <BackButton />
        <EnhancedAccountingDashboard />
      </div>
    </ModernAppLayout>
  );
}
