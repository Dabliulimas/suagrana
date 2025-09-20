"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { EnhancedFinancialNavigation } from "@/components/enhanced-financial-navigation";
import { IntelligentFinancialDashboard } from "@/components/intelligent-financial-dashboard";
// import FinancialPerformanceDashboard from '@/components/financial-performance-dashboard'
import FinancialAutomationManager from "@/components/financial-automation-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Zap,
  Target,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";

export default function FinancialOverviewPage() {
  const quickStats = [
    {
      title: "Módulos Ativos",
      value: "14",
      description: "Funcionalidades disponíveis",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Recursos Novos",
      value: "3",
      description: "Adicionados recentemente",
      icon: Star,
      color: "text-blue-600",
    },
    {
      title: "Em Desenvolvimento",
      value: "2",
      description: "Recursos em beta",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Categorias",
      value: "6",
      description: "Áreas organizadas",
      icon: Target,
      color: "text-purple-600",
    },
  ];

  const highlights = [
    {
      title: "Sistema de Orçamento Inteligente",
      description:
        "Novo sistema com alertas automáticos e projeções baseadas em IA",
      status: "Novo",
      category: "Gestão Financeira",
      icon: Target,
    },
    {
      title: "Fluxo de Caixa Preditivo",
      description: "Previsões financeiras com análise de tendências e cenários",
      status: "Novo",
      category: "Análises",
      icon: TrendingUp,
    },
    {
      title: "Contas e Lembretes Unificados",
      description:
        "Sistema integrado para gerenciar todas as suas contas e lembretes",
      status: "Melhorado",
      category: "Gestão",
      icon: Clock,
    },
  ];

  return (
    <ModernAppLayout
      title="Visão Geral Financeira"
      subtitle="Análise completa da sua situação financeira"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Sistema Financeiro Completo
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Gerencie todas as suas finanças em um só lugar com ferramentas
              profissionais e intuitivas
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Destaques Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {highlights.map((highlight, index) => {
                  const Icon = highlight.icon;
                  return (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-sm">
                              {highlight.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {highlight.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {highlight.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {highlight.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Intelligent Financial Dashboard */}
          <IntelligentFinancialDashboard />

          {/* Performance Analytics */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Análise de Performance</h2>
            <Card>
              <CardContent className="p-6">
                <p>Dashboard de performance em desenvolvimento</p>
              </CardContent>
            </Card>
          </div>

          {/* Automação Financeira */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Automação Financeira</h2>
            <FinancialAutomationManager />
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
              <TabsTrigger value="all">Todos os Módulos</TabsTrigger>
              <TabsTrigger value="compact">Visão Compacta</TabsTrigger>
            </TabsList>

            <TabsContent value="categories">
              <EnhancedFinancialNavigation
                showCategories={true}
                compactMode={false}
              />
            </TabsContent>

            <TabsContent value="all">
              <EnhancedFinancialNavigation
                showCategories={false}
                compactMode={false}
              />
            </TabsContent>

            <TabsContent value="compact">
              <EnhancedFinancialNavigation
                showCategories={false}
                compactMode={true}
              />
            </TabsContent>
          </Tabs>

          {/* System Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sistema Financeiro v2.0
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plataforma completa para gestão financeira pessoal e
                    familiar com recursos profissionais
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Gestão Completa</Badge>
                    <Badge variant="secondary">Análises Avançadas</Badge>
                    <Badge variant="secondary">Colaborativo</Badge>
                    <Badge variant="secondary">Seguro</Badge>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">100%</div>
                    <div className="text-sm text-muted-foreground">
                      Funcional
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernAppLayout>
  );
}
