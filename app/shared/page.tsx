"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SharedExpenses } from "@/components/shared-expenses";
import { SharedExpensesBilling } from "@/components/shared-expenses-billing";
import { BackButton } from "@/components/back-button";
import { Users, Receipt } from "lucide-react";

export default function SharedPage() {
  const [activeTab, setActiveTab] = useState("expenses");

  return (
    <ModernAppLayout
      title="Despesas e Faturas Compartilhadas"
      subtitle="Gerencie gastos divididos e sistema de faturamento mensal"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Despesas e Faturas Compartilhadas
            </h1>
            <p className="text-muted-foreground">
              Gerencie gastos divididos e sistema de faturamento mensal
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Despesas Compartilhadas
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Faturas Compartilhadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <SharedExpenses />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <SharedExpensesBilling />
          </TabsContent>
        </Tabs>
      </div>
    </ModernAppLayout>
  );
}
