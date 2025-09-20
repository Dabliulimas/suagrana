"use client";

import { useState } from "react";
import { ModernAppLayout } from "@/components/modern-app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  Download,
  Upload,
  ArrowLeft,
  UserCheck,
  Lock,
  Info,
  HelpCircle,
  Zap,
  Calculator,
  CheckCircle2,
  Activity,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const handleExportData = () => {
    toast.success("Dados exportados com sucesso!");
  };

  const settingsCategories = [
    {
      title: "Perfil & Conta",
      description: "Gerencie seus dados pessoais e informacoes da conta",
      icon: UserCheck,
      href: "/settings/profile",
      badge: null,
    },
    {
      title: "Notificacoes",
      description: "Configure alertas, lembretes e avisos do sistema",
      icon: Bell,
      href: "/settings/notifications",
      badge: null,
    },
    {
      title: "Seguranca",
      description: "Senha, autenticacao e configuracoes de seguranca",
      icon: Shield,
      href: "/settings/security",
      badge: null,
    },
    {
      title: "Backup & Dados",
      description: "Exportar, importar e gerenciar seus dados",
      icon: Database,
      href: "/settings/backup",
      badge: null,
    },
    {
      title: "Configuracoes Financeiras",
      description: "Configuracoes especificas do sistema financeiro",
      icon: Calculator,
      href: "/financial-settings",
      badge: "Novo",
    },
    {
      title: "Performance",
      description: "Monitorar e otimizar performance do sistema",
      icon: Activity,
      href: "/settings/performance",
      badge: null,
    },
    {
      title: "PWA & Mobile",
      description:
        "Configurações do Progressive Web App e funcionalidades mobile",
      icon: Smartphone,
      href: "/settings/pwa",
      badge: "Novo",
    },
    {
      title: "Aparencia",
      description: "Tema, cores e personalizacao da interface",
      icon: Palette,
      href: "/settings/appearance",
      badge: null,
    },
    {
      title: "Privacidade",
      description: "Controle de dados e configuracoes de privacidade",
      icon: Lock,
      href: "/settings/privacy",
      badge: null,
    },
    {
      title: "Sobre",
      description: "Informacoes do sistema, versao e suporte",
      icon: Info,
      href: "/settings/about",
      badge: null,
    },
  ];

  return (
    <ModernAppLayout
      title="Configurações"
      subtitle="Gerencie suas preferências e configurações do sistema"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Quick Settings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Moeda</span>
              </div>
              <p className="text-lg font-semibold">Real Brasileiro (R$)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Notificacoes</span>
              </div>
              <p className="text-lg font-semibold">Ativadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Tema
                </span>
              </div>
              <p className="text-lg font-semibold">Claro</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Categorias de Configuracao
          </h2>
          <div className="grid gap-4">
            {settingsCategories.map((category) => (
              <Link key={category.title} href={category.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <category.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            {category.title}
                            {category.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {category.badge}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Acoes Rapidas
            </CardTitle>
            <CardDescription>
              Acoes frequentes e utilitarios do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Dados
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar Dados
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Central de Ajuda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Informacoes do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Versao:</span>
                <span className="font-medium">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ultima Atualizacao:</span>
                <span className="font-medium">27/08/2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plano:</span>
                <span className="font-medium">Premium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Suporte:</span>
                <span className="font-medium">Ativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
