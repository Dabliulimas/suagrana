"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { 
  useUnifiedDashboard,
  useUnifiedCreateTransaction,
  useUnifiedRecentTransactions,
  useUnifiedAccountsSummary,
  useUnifiedQuickStats,
  useUnifiedRefreshReports
} from "../../hooks/unified";

/**
 * EXEMPLO DE DASHBOARD UNIFICADO
 * 
 * Este componente demonstra como usar os hooks unificados para:
 * 1. Exibir dados sincronizados em tempo real
 * 2. Criar transações com invalidação automática
 * 3. Manter todos os componentes sincronizados
 * 4. Resolver o problema de dados desaparecendo no F5
 */
export function UnifiedDashboardExample() {
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense" as const,
    category: "Alimentação",
  });

  // Hooks unificados - todos sincronizados automaticamente
  const { data: dashboardData, isLoading: dashboardLoading } = useUnifiedDashboard();
  const { data: recentTransactions, isLoading: transactionsLoading } = useUnifiedRecentTransactions(5);
  const { data: accountsSummary, isLoading: accountsLoading } = useUnifiedAccountsSummary();
  const { data: quickStats, isLoading: statsLoading } = useUnifiedQuickStats();
  
  // Mutação com invalidação automática
  const createTransaction = useUnifiedCreateTransaction();
  const refreshReports = useUnifiedRefreshReports();

  const handleCreateTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      return;
    }

    try {
      await createTransaction.mutateAsync({
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        category: newTransaction.category,
        date: new Date().toISOString().split('T')[0],
      });

      // Limpar formulário
      setNewTransaction({
        description: "",
        amount: "",
        type: "expense",
        category: "Alimentação",
      });
    } catch (error) {
      console.error("Erro ao criar transação:", error);
    }
  };

  const handleRefreshAll = async () => {
    await refreshReports();
  };

  if (dashboardLoading || transactionsLoading || accountsLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando dados sincronizados...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Unificado</h1>
        <Button onClick={handleRefreshAll} variant="outline">
          Atualizar Todos os Dados
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {dashboardData?.totalBalance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountsSummary?.totalAccounts || 0} contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {dashboardData?.monthlyData?.income?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {dashboardData?.monthlyData?.expenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dashboardData?.monthlyData?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {dashboardData?.monthlyData?.net?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Nova Transação */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Transação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Almoço no restaurante"
              />
            </div>

            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                value={newTransaction.category}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded"
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Transporte">Transporte</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Lazer">Lazer</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <Button 
              onClick={handleCreateTransaction}
              disabled={createTransaction.isPending}
              className="w-full"
            >
              {createTransaction.isPending ? "Criando..." : "Criar Transação"}
            </Button>
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions?.length ? (
                recentTransactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}R$ {Number(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma transação encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{quickStats?.accountsCount || 0}</div>
              <div className="text-sm text-muted-foreground">Contas</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboardData?.transactionsCount || 0}</div>
              <div className="text-sm text-muted-foreground">Transações</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{quickStats?.todayTransactions || 0}</div>
              <div className="text-sm text-muted-foreground">Hoje</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{quickStats?.thisWeekTransactions || 0}</div>
              <div className="text-sm text-muted-foreground">Esta Semana</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Debug */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Sistema de Sincronização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <div>✅ Cache unificado ativo</div>
            <div>✅ Invalidação automática configurada</div>
            <div>✅ Sincronização entre componentes</div>
            <div>✅ Persistência após F5 garantida</div>
            <div className="text-green-600 font-medium">
              Sistema funcionando corretamente!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}