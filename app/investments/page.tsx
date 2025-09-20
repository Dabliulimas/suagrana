"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { LazyInvestmentDashboard, LazyWrapper } from "@/components/optimization/lazy-loader";
import { BackButton } from "@/components/back-button";

export default function InvestmentsPage() {
  return (
    <ModernAppLayout
      title="Investimentos"
      subtitle="Gerencie e acompanhe seus investimentos"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
        </div>

        <LazyWrapper height="500px">
          <LazyInvestmentDashboard />
        </LazyWrapper>
      </div>
    </ModernAppLayout>
  );
}
