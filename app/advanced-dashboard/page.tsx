"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../lib/logger";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { 
  LazyAdvancedAnalyticsDashboard, 
  LazyFinancialAnalysisDashboard, 
  LazySmartNotificationCenter,
  LazyWrapper 
} from "@/components/optimization/lazy-loader";
import { AdvancedFinancialManagement } from "@/components/advanced-financial-management";
import { AutomationRulesManager } from "@/components/features/automation";
import { BudgetInsights } from "@/components/budget-insights";
import { InstallmentsManager } from "@/components/installments-manager";
import { RecurringBillsManager } from "@/components/recurring-bills-manager";
import { CashFlowProjections } from "@/components/cash-flow-projections";
import { useTransactions, useAccounts, useGoals } from "@/contexts/unified-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Settings,
  Zap,
  Shield,
  PieChart,
  TrendingUp,
  Users,
  Target
} from "lucide-react";

export default function AdvancedDashboardPage() {
  const [activeTab, setActiveTab] = useState("analytics");
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { goals } = useGoals();

  useEffect(() => {
    // Get tab from URL if needed (only on client side)
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");
        if (
          tab &&
          ["analytics", "management", "features", "analysis"].includes(tab)
        ) {
          setActiveTab(tab);
        }
      } catch (error) {
        logComponents.error("Error parsing URL params:", error);
      }
    }
  }, []);

  // Calcular estatísticas reais
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const avgGoalProgress = goals.length > 0 ? 
    goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / goals.length * 100 : 0;

  return (
    <ModernAppLayout
      title="Análises Avançadas"
      subtitle="Analytics, gestão avançada e recursos profissionais em um só lugar"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats Overview com dados reais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {transactions.length}
                  </p>
                  <p className="text-sm text-purple-600">
                    Transações Registradas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-green-600">Saldo Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{accounts.length}</p>
                  <p className="text-sm text-blue-600">Contas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-700">
                    {avgGoalProgress.toFixed(0)}%
                  </p>
                  <p className="text-sm text-orange-600">
                    Progresso das Metas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="analysis">Análise Financeira</TabsTrigger>
            <TabsTrigger value="management">Gestão Avançada</TabsTrigger>
            <TabsTrigger value="features">Recursos Avançados</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  Análises
                </h2>
                <p className="text-muted-foreground">
                  Análises inteligentes com IA para seus dados financeiros
                </p>
              </div>
              <LazyWrapper height="500px">
                <LazyAdvancedAnalyticsDashboard />
              </LazyWrapper>
            </div>
          </TabsContent>

          {/* Financial Analysis Tab */}
          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
                  <PieChart className="w-6 h-6 text-blue-600" />
                  Análise Financeira Completa
                </h2>
                <p className="text-muted-foreground">
                  Análise detalhada de suas finanças com insights sobre dívidas
                  e investimentos
                </p>
              </div>
              <LazyWrapper height="500px">
                <LazyFinancialAnalysisDashboard />
              </LazyWrapper>
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="mt-6">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
                  <Settings className="w-6 h-6 text-green-600" />
                  Gestão Pro
                </h2>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                  Atribua categorias, subcategorias, tags e membros da família
                  às suas transações para ter uma gestão financeira mais
                  detalhada e personalizada.
                </p>
              </div>

              <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                  <TabsTrigger value="insights">
                    Insights de Orçamento
                  </TabsTrigger>
                  <TabsTrigger value="automation">Automação</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="mt-6">
                  <AdvancedFinancialManagement />
                </TabsContent>

                <TabsContent value="insights" className="mt-6">
                  <BudgetInsights />
                </TabsContent>

                <TabsContent value="automation" className="mt-6">
                  <AutomationRulesManager />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Advanced Features Tab */}
          <TabsContent value="features" className="mt-6">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Recursos Avançados
                </h2>
                <p className="text-muted-foreground">
                  Ferramentas profissionais para gestão financeira completa
                </p>
              </div>

              <Tabs defaultValue="installments" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="installments">Parcelamentos</TabsTrigger>
                  <TabsTrigger value="recurring">
                    Contas Recorrentes
                  </TabsTrigger>
                  <TabsTrigger value="projections">Projeções</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                </TabsList>

                <TabsContent value="installments" className="mt-6">
                  <InstallmentsManager />
                </TabsContent>

                <TabsContent value="recurring" className="mt-6">
                  <RecurringBillsManager />
                </TabsContent>

                <TabsContent value="projections" className="mt-6">
                  <CashFlowProjections />
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <LazyWrapper height="400px">
                    <LazySmartNotificationCenter />
                  </LazyWrapper>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ModernAppLayout>
  );
}
