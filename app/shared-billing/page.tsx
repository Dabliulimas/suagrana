"use client";

export const dynamic = "force-dynamic";

import { SharedExpensesBilling } from "@/components/shared-expenses-billing";
import { BackButton } from "@/components/back-button";

export default function SharedBillingPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <BackButton />
      <SharedExpensesBilling />
    </div>
  );
}
