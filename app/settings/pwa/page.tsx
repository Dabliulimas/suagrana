import { Metadata } from "next";
import { AdvancedPWASettings } from "@/components/advanced-pwa-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Smartphone, Zap, Bell } from "lucide-react";

export const metadata: Metadata = {
  title: "Configurações PWA - SuaGrana",
  description:
    "Configure as funcionalidades do Progressive Web App do SuaGrana",
};

export default function PWASettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações PWA</h1>
        <p className="text-muted-foreground">
          Configure as funcionalidades avançadas do Progressive Web App para uma
          melhor experiência.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-blue-600" />
              Notificações Push
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Receba lembretes inteligentes sobre contas, metas e investimentos
              mesmo quando o app não estiver aberto.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-green-600" />
              Modo Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Acesse seus dados financeiros mesmo sem conexão com a internet,
              com sincronização automática.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-purple-600" />
              App Nativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Instale o SuaGrana como um aplicativo nativo em seu dispositivo
              para acesso rápido.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Advanced PWA Settings Component */}
      <AdvancedPWASettings />
    </div>
  );
}
