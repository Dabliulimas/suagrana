'use client';

import { 
  TotalBalanceCard, 
  MonthlyResultCard, 
  ActiveGoalsCard, 
  MonthlyIncomeCard, 
  MonthlyExpensesCard, 
  SavingsRateCard, 
  InvestmentValueCard 
} from '@/components/cards/granular-cards'
import { CashFlowCard, GoalsProgressCard, CategoryBudgetCard } from '@/components/cards/dashboard-sections';

export default function FinancialDashboard() {

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Dados atualizados automaticamente em tempo real</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Cards de Patrimônio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TotalBalanceCard />
        <MonthlyResultCard />
        <ActiveGoalsCard />
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MonthlyIncomeCard />
        <MonthlyExpensesCard />
        <SavingsRateCard />
        <InvestmentValueCard />
      </div>

      {/* Fluxo de Caixa dos Últimos 6 Meses */}
      <CashFlowCard />

      {/* Metas e Orçamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsProgressCard />
        <CategoryBudgetCard />
      </div>
    </div>
  );
}
