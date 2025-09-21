'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, Target, PieChart } from 'lucide-react'
import { useGranularCards } from '@/hooks/use-granular-cards'
import { useGranularGoals } from '@/hooks/use-granular-goals-reports'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const getProgressColor = (percentage: number) => {
  if (percentage <= 50) return 'bg-green-500'
  if (percentage <= 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getCategoryAlert = (percentage: number) => {
  if (percentage <= 50) return 'text-green-600'
  if (percentage <= 80) return 'text-yellow-600'
  return 'text-red-600'
}

export function CashFlowCard() {
  const { data: cashFlowData, isLoading } = useGranularCards().useCashFlow()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fluxo de Caixa - Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded mt-1"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const last6Months = cashFlowData || []
  const maxValor = Math.max(...last6Months.map(m => Math.max(m.receitas, m.despesas)))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Fluxo de Caixa - Últimos 6 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-4">
            {last6Months.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium mb-2">{item.mes}</div>
                <div className="space-y-1">
                  <div 
                    className="bg-green-500 rounded-t"
                    style={{ 
                      height: `${maxValor > 0 ? (item.receitas / maxValor) * 100 : 4}px`,
                      minHeight: '4px'
                    }}
                  ></div>
                  <div 
                    className="bg-red-500 rounded-b"
                    style={{ 
                      height: `${maxValor > 0 ? (item.despesas / maxValor) * 100 : 4}px`,
                      minHeight: '4px'
                    }}
                  ></div>
                </div>
                <div className={`text-xs mt-1 ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.saldo >= 0 ? '+' : ''}{formatCurrency(item.saldo)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Receitas</div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(last6Months.reduce((acc, item) => acc + item.receitas, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Despesas</div>
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(last6Months.reduce((acc, item) => acc + item.despesas, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Saldo Líquido</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(last6Months.reduce((acc, item) => acc + item.saldo, 0))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GoalsProgressCard() {
  const { data: goalsData, isLoading } = useGranularCards().useGoalProgress()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Financeiras
            <Badge variant="secondary">Carregando...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const goals = goalsData?.goals || []
  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Financeiras
          <Badge variant="secondary">
            {completedGoals.length} de {goals.length} concluídas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeGoals.slice(0, 6).map((goal) => {
            const progress = (Number(goal.currentAmount || 0) / Number(goal.targetAmount || 1)) * 100
            const daysLeft = goal.deadline 
              ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 0
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(Number(goal.currentAmount || 0))} de {formatCurrency(Number(goal.targetAmount || 0))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{Math.min(progress, 100).toFixed(1)}%</div>
                    {daysLeft > 0 && (
                      <div className="text-xs text-muted-foreground">{daysLeft} dias</div>
                    )}
                  </div>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
              </div>
            )
          })}
          
          {activeGoals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta ativa encontrada</p>
              <p className="text-sm">Crie suas primeiras metas financeiras!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryBudgetCard() {
  const { data: categoryData, isLoading } = useGranularCards().useCategorySpending()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Orçamento por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const categoryBudget = categoryData?.categories || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Orçamento por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoryBudget.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.categoria}</span>
                <span className={`text-sm font-medium ${getCategoryAlert(item.percentual)}`}>
                  {item.percentual.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(item.gasto)} gasto</span>
                <span>{formatCurrency(item.orcado)} orçado</span>
              </div>
              <Progress 
                value={Math.min(item.percentual, 100)} 
                className={`h-2 ${getProgressColor(item.percentual)}`}
              />
            </div>
          ))}
          
          {categoryBudget.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria com gastos encontrada</p>
              <p className="text-sm">Adicione transações para ver o orçamento por categoria</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}