"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { ReminderSystem } from "@/components/reminder-system";
import { BackButton } from "@/components/back-button";

export default function RemindersPage() {
  return (
    <ModernAppLayout
      title="Lembretes"
      subtitle="Gerencie seus lembretes financeiros"
    >
      <div className="p-4 md:p-6 space-y-6">
        <BackButton />
        <ReminderSystem />
      </div>
    </ModernAppLayout>
  );
}
