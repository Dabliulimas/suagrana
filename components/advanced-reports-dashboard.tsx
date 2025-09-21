"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  FileText,
  Download,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useReportsDashboard, useRefreshReports, type ReportFilters } from "@/hooks/use-reports";
import { useTransactions } from "@/hooks/use-optimized-transactions";
import { useAccounts } from "@/hooks";
import { toast } from "sonner";
import { translateAccountType } from '@/lib/translations';

interface ReportData {
  period: string;
  income: number;
  expenses: number;
  netFlow: number;
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    netFlow: number;
  }>;
  accountsBreakdown: Array<{
    name: string;
    balance: number;
    type: string;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function AdvancedReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedReport, setSelectedReport] = useState('summary');
  
  // Usar hooks do React Query para buscar dados da API do Neon
  const filters: ReportFilters = useMemo(() => {
    const now = new Date();
    let startDate: string;
    let endDate: string = now.toISOString().split('T')[0];

    switch (selectedPeriod) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    }

    return { startDate, endDate, period: selectedPeriod };
  }, [selectedPeriod]);

  const { data: reportData, isLoading, error, refetch } = useReportsDashboard(filters);
  const refreshReports = useRefreshReports();
  
  // Fallback para transações e contas (para compatibilidade)
  const { data: transactionsData } = useTransactions();
  const transactions = transactionsData?.transactions || [];
  const { accounts } = useAccounts();

  // Dados calculados localmente como fallback se a API não retornar dados
  const fallbackReportData = useMemo((): ReportData => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = totalIncome - totalExpenses;

    // Gastos por categoria
    const categoryData: { [key: string]: number } = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + Math.abs(t.amount);
      });

    const categories = Object.entries(categoryData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: COLORS[index % COLORS.length]
      }));

    // Tendência mensal
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(t.amount);
      }
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        }),
        income: data.income,
        expenses: data.expenses,
        netFlow: data.income - data.expenses
      }));

    // Breakdown de contas
    const accountsBreakdown = accounts.map(account => ({
      name: account.name,
      balance: account.balance || 0,
      type: account.type
    }));


    return {
      period: selectedPeriod,
      income: totalIncome,
      expenses: totalExpenses,
      netFlow,
      categories,
      monthlyTrend,
      accountsBreakdown
    };
  }, [transactions, accounts, selectedPeriod]);

  // Usar dados da API quando disponíveis, senão usar fallback
  const finalReportData = reportData || fallbackReportData;

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const data = {
        reportData: finalReportData,
        period: selectedPeriod,
        generatedAt: new Date().toISOString()
      };
      
      if (format === 'csv') {
        // Exportar como CSV
        const csvContent = generateCSV(data);
        downloadFile(csvContent, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      } else if (format === 'excel') {
        // Simular exportação Excel
        toast.info('Funcionalidade Excel em desenvolvimento');
      } else if (format === 'pdf') {
        // Simular exportação PDF
        toast.info('Funcionalidade PDF em desenvolvimento');
      }
      
      toast.success(`Relatório ${format.toUpperCase()} baixado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };
  
  const generateCSV = (data: any) => {
    const headers = ['Categoria', 'Valor', 'Percentual'];
    const rows = data.reportData.categories.map((cat: any) => [
      cat.name,
      `R$ ${cat.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${cat.percentage.toFixed(1)}%`
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
      
    return csvContent;
  };
  
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const shareReport = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Relatório Financeiro',
        text: 'Confira meu relatório financeiro',
        url: window.location.href
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground">
            Análises detalhadas com dados em tempo real
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
              <SelectItem value="ytd">Ano até hoje</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={refreshReports}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </Button>
          
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          
          <Button variant="outline" onClick={printReport}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          
          <Button variant="outline" onClick={shareReport}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">
                  Receitas Totais
                </p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {finalReportData.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Despesas Totais
                </p>
                <p className="text-2xl font-bold text-red-700">
                  R$ {finalReportData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${finalReportData.netFlow >= 0 ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Fluxo Líquido
                </p>
                <p className={`text-2xl font-bold ${finalReportData.netFlow >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  R$ {finalReportData.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {finalReportData.netFlow >= 0 ? (
                <TrendingUp className="w-8 h-8 text-blue-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Taxa de Economia
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  {finalReportData.income > 0 ? ((finalReportData.netFlow / finalReportData.income) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Resumo */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fluxo de Caixa Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Fluxo de Caixa Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {finalReportData.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={finalReportData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Valor'
                      ]} />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" name="Receitas" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Despesas" />
                      <Line type="monotone" dataKey="netFlow" stroke="#3B82F6" strokeWidth={3} name="Fluxo Líquido" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Dados insuficientes para o período selecionado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição de Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  Distribuição de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {finalReportData.categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={finalReportData.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {finalReportData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        'Valor'
                      ]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma despesa encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Breakdown de Contas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-600" />
                Breakdown de Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {finalReportData.accountsBreakdown.map((account, index) => {
                  const totalBalance = finalReportData.accountsBreakdown.reduce((sum, acc) => sum + acc.balance, 0);
                  const percentage = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          account.type === 'checking' ? 'bg-blue-500' :
                          account.type === 'savings' ? 'bg-green-500' : 'bg-purple-500'
                        }`} />
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-500">{translateAccountType(account.type)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          R$ {account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-500">{percentage.toFixed(1)}% do total</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Análise de Tendências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={finalReportData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    'Valor'
                  ]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Receitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Despesas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                Análise Detalhada por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {finalReportData.categories.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-semibold">{category.name}</h3>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R$ {category.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <Badge variant="outline">
                          {category.percentage.toFixed(1)}% do total
                        </Badge>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Insights Finais */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Insights do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💰 Performance Financeira</h4>
              <p className="text-sm text-blue-700">
                {finalReportData.netFlow >= 0 ? (
                  `Excelente! Você teve um saldo positivo de R$ ${finalReportData.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                ) : (
                  `Atenção: Déficit de R$ ${Math.abs(finalReportData.netFlow).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Revise seus gastos.`
                )}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">📈 Maior Categoria</h4>
              <p className="text-sm text-green-700">
                {finalReportData.categories.length > 0 ? (
                  `${finalReportData.categories[0].name} representa ${finalReportData.categories[0].percentage.toFixed(1)}% dos seus gastos`
                ) : (
                  'Nenhuma categoria de gastos identificada'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
