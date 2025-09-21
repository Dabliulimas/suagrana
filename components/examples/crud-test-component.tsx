'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGranularMutations } from '@/hooks/use-granular-mutations';
import { useGranularCards } from '@/hooks/use-granular-cards';
import { useSelectiveInvalidation } from '@/hooks/use-selective-invalidation';
import { toast } from 'sonner';

interface TestFormData {
  type: 'transaction' | 'account' | 'goal';
  name: string;
  amount?: number;
  description?: string;
  category?: string;
  accountType?: string;
  goalType?: string;
}

export default function CrudTestComponent() {
  const [formData, setFormData] = useState<TestFormData>({
    type: 'transaction',
    name: '',
    amount: 0,
    description: '',
    category: 'food',
    accountType: 'checking',
    goalType: 'savings'
  });

  const [selectedId, setSelectedId] = useState<string>('');
  const [testResults, setTestResults] = useState<string[]>([]);

  // Hooks para mutações e dados
  const mutations = useGranularMutations();
  const { transactions, accounts, goals } = useGranularCards();
  const { 
    invalidateTransactions, 
    invalidateAccounts, 
    invalidateGoals,
    smartInvalidate,
    batchInvalidate 
  } = useSelectiveInvalidation();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCreate = async () => {
    try {
      addTestResult(`Iniciando criação de ${formData.type}...`);
      
      switch (formData.type) {
        case 'transaction':
          await mutations.createTransaction.mutateAsync({
            description: formData.name,
            amount: formData.amount || 0,
            category: formData.category || 'other',
            type: 'expense',
            date: new Date().toISOString(),
            accountId: accounts.data?.[0]?.id || 'default'
          });
          break;
        case 'account':
          await mutations.createAccount.mutateAsync({
            name: formData.name,
            type: formData.accountType as any,
            balance: formData.amount || 0,
            description: formData.description
          });
          break;
        case 'goal':
          await mutations.createGoal.mutateAsync({
            name: formData.name,
            targetAmount: formData.amount || 0,
            currentAmount: 0,
            type: formData.goalType as any,
            description: formData.description,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          break;
      }
      
      addTestResult(`✅ ${formData.type} criado com sucesso! Invalidação automática executada.`);
    } catch (error: any) {
      addTestResult(`❌ Erro ao criar ${formData.type}: ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) {
      toast.error('Selecione um item para atualizar');
      return;
    }

    try {
      addTestResult(`Iniciando atualização de ${formData.type} (ID: ${selectedId})...`);
      
      switch (formData.type) {
        case 'transaction':
          await mutations.updateTransaction.mutateAsync({
            id: selectedId,
            description: formData.name,
            amount: formData.amount || 0,
            category: formData.category || 'other'
          });
          break;
        case 'account':
          await mutations.updateAccount.mutateAsync({
            id: selectedId,
            name: formData.name,
            balance: formData.amount || 0,
            description: formData.description
          });
          break;
        case 'goal':
          await mutations.updateGoal.mutateAsync({
            id: selectedId,
            name: formData.name,
            targetAmount: formData.amount || 0,
            description: formData.description
          });
          break;
      }
      
      addTestResult(`✅ ${formData.type} atualizado com sucesso! Invalidação granular executada.`);
    } catch (error: any) {
      addTestResult(`❌ Erro ao atualizar ${formData.type}: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      toast.error('Selecione um item para deletar');
      return;
    }

    try {
      addTestResult(`Iniciando exclusão de ${formData.type} (ID: ${selectedId})...`);
      
      switch (formData.type) {
        case 'transaction':
          await mutations.deleteTransaction.mutateAsync(selectedId);
          break;
        case 'account':
          await mutations.deleteAccount.mutateAsync(selectedId);
          break;
        case 'goal':
          await mutations.deleteGoal.mutateAsync(selectedId);
          break;
      }
      
      addTestResult(`✅ ${formData.type} deletado com sucesso! Invalidação inteligente executada.`);
      setSelectedId('');
    } catch (error: any) {
      addTestResult(`❌ Erro ao deletar ${formData.type}: ${error.message}`);
    }
  };

  const handleTransfer = async () => {
    const accountsList = accounts.data || [];
    if (accountsList.length < 2) {
      toast.error('Necessário pelo menos 2 contas para transferência');
      return;
    }

    try {
      addTestResult('Iniciando transferência entre contas...');
      
      await mutations.transferBetweenAccounts.mutateAsync({
        fromAccountId: accountsList[0].id,
        toAccountId: accountsList[1].id,
        amount: formData.amount || 100,
        description: 'Teste de transferência'
      });
      
      addTestResult('✅ Transferência realizada! Invalidação múltipla executada.');
    } catch (error: any) {
      addTestResult(`❌ Erro na transferência: ${error.message}`);
    }
  };

  const testManualInvalidation = () => {
    addTestResult('Testando invalidação manual...');
    
    // Teste de invalidação por categoria
    invalidateTransactions('all');
    addTestResult('✅ Invalidação manual de transações executada');
    
    // Teste de invalidação inteligente
    smartInvalidate('accounts', 'update', 'test-id');
    addTestResult('✅ Invalidação inteligente de contas executada');
    
    // Teste de invalidação em lote
    batchInvalidate([
      { category: 'goals', scope: 'all' },
      { category: 'transactions', scope: 'related' }
    ]);
    addTestResult('✅ Invalidação em lote executada');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getCurrentData = () => {
    switch (formData.type) {
      case 'transaction':
        return transactions.data || [];
      case 'account':
        return accounts.data || [];
      case 'goal':
        return goals.data || [];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de CRUD com Invalidação Seletiva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção do tipo */}
          <div>
            <Label>Tipo de Entidade</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transaction">Transação</SelectItem>
                <SelectItem value="account">Conta</SelectItem>
                <SelectItem value="goal">Meta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formulário dinâmico */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome/Descrição</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome..."
              />
            </div>
            
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {formData.type === 'transaction' && (
            <div>
              <Label>Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Alimentação</SelectItem>
                  <SelectItem value="transport">Transporte</SelectItem>
                  <SelectItem value="entertainment">Entretenimento</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === 'account' && (
            <div>
              <Label>Tipo de Conta</Label>
              <Select 
                value={formData.accountType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional..."
            />
          </div>

          {/* Seleção de item existente para update/delete */}
          <div>
            <Label>Item Existente (para Update/Delete)</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item..." />
              </SelectTrigger>
              <SelectContent>
                {getCurrentData().map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name || item.description || `Item ${item.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Botões de ação */}
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={handleCreate} className="w-full">
              Criar {formData.type}
            </Button>
            <Button onClick={handleUpdate} variant="outline" className="w-full">
              Atualizar {formData.type}
            </Button>
            <Button onClick={handleDelete} variant="destructive" className="w-full">
              Deletar {formData.type}
            </Button>
            <Button onClick={handleTransfer} variant="secondary" className="w-full">
              Testar Transferência
            </Button>
          </div>

          <Button onClick={testManualInvalidation} variant="outline" className="w-full">
            Testar Invalidação Manual
          </Button>
        </CardContent>
      </Card>

      {/* Status das queries */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant={transactions.isLoading ? "secondary" : "default"}>
                Transações: {transactions.isLoading ? "Carregando..." : `${transactions.data?.length || 0} itens`}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant={accounts.isLoading ? "secondary" : "default"}>
                Contas: {accounts.isLoading ? "Carregando..." : `${accounts.data?.length || 0} itens`}
              </Badge>
            </div>
            <div className="text-center">
              <Badge variant={goals.isLoading ? "secondary" : "default"}>
                Metas: {goals.isLoading ? "Carregando..." : `${goals.data?.length || 0} itens`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log de resultados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Log de Testes</CardTitle>
          <Button onClick={clearResults} variant="outline" size="sm">
            Limpar Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum teste executado ainda...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}