"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";

import { BillingInvoices } from "@/components/billing-invoices";

export default function BillingPage() {
  return (
    <ModernAppLayout title="Cobrança" subtitle="Gerencie cobranças e faturas">
      <div className="p-4 md:p-6 space-y-6">
        <BillingInvoices />
      </div>
    </ModernAppLayout>
  );
}
