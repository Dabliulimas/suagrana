"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { RecurringBillsManager } from "@/components/recurring-bills-manager";
import { ReminderSystem } from "@/components/reminder-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/back-button";
import { Calendar, Bell, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BillsRemindersPage() {
  return (
    <ModernAppLayout
      title="Contas e Lembretes"
      subtitle="Gerencie suas contas a pagar e lembretes financeiros"
    >
      <div className="p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Calendar className="w-8 h-8" />
                Contas e Lembretes
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas contas recorrentes e lembretes personalizados em
                um só lugar
              </p>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Repeat className="w-5 h-5" />
                  Contas Recorrentes
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700"
                  >
                    Automático
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600">
                  Assinaturas, contas fixas e gastos que se repetem mensalmente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Bell className="w-5 h-5" />
                  Lembretes Personalizados
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700"
                  >
                    Flexível
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-600">
                  Alertas customizados para pagamentos, metas e compromissos
                  financeiros
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="recurring" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="recurring"
                className="flex items-center gap-2"
              >
                <Repeat className="w-4 h-4" />
                Contas Recorrentes
              </TabsTrigger>
              <TabsTrigger
                value="reminders"
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Lembretes Personalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recurring" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Repeat className="w-5 h-5 text-blue-600" />
                    Gestão de Contas Recorrentes
                    <Badge variant="secondary">Funcional</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground dark:text-gray-300">
                    Cadastre e gerencie suas contas fixas mensais, assinaturas e
                    outros gastos recorrentes
                  </p>
                </CardHeader>
                <CardContent>
                  <RecurringBillsManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reminders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    Sistema de Lembretes
                    <Badge variant="secondary">Funcional</Badge>
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Configure lembretes personalizados para pagamentos, metas e
                    outros compromissos financeiros
                  </p>
                </CardHeader>
                <CardContent>
                  <ReminderSystem />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModernAppLayout>
  );
}
