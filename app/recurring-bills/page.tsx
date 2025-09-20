"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { RecurringBillsManager } from "@/components/recurring-bills-manager";

export default function RecurringBillsPage() {
  return (
    <ModernAppLayout
      title="Contas Recorrentes"
      subtitle="Gerencie suas contas e despesas recorrentes"
    >
      <div className="p-4 md:p-6 space-y-6">
        <RecurringBillsManager />
      </div>
    </ModernAppLayout>
  );
}
