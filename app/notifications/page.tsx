"use client";

import { SmartNotifications } from "@/components/smart-notifications";
import { ModernAppLayout } from "@/components/modern-app-layout";

export default function NotificationsPage() {
  return (
    <ModernAppLayout
      title="Notificações"
      subtitle="Visualize e gerencie suas notificações"
    >
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <SmartNotifications />
        </div>
      </div>
    </ModernAppLayout>
  );
}
