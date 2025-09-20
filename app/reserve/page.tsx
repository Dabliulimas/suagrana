"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { EmergencyReserveComponent } from "@/components/emergency-reserve";
import { BackButton } from "@/components/back-button";

export default function ReservePage() {
  return (
    <ModernAppLayout
      title="Reserva de Emergência"
      subtitle="Gerencie sua reserva de emergência e segurança financeira"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Reserva de Emergência
            </h1>
            <p className="text-muted-foreground">
              Gerencie sua reserva de emergência e mantenha sua segurança
              financeira
            </p>
          </div>
        </div>

        <EmergencyReserveComponent />
      </div>
    </ModernAppLayout>
  );
}
