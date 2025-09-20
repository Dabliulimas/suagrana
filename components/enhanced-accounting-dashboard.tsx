"use client";

import React, { useState, useEffect, useMemo } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  enhancedAccountingSystem,
  type EnhancedTrialBalance,
  type BalanceSheet,
  type IncomeStatement,
  type ChartOfAccounts,
  type EnhancedAccountingEntry,
} from "../lib/enhanced-accounting-system";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { formatCurrency } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calculator,
  BarChart3,
  PieChart,
  DollarSign,
  Target,
  Activity,
  Zap,
} from "lucide-react";

interface AccountingMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  debtToEquityRatio: number;
  currentRatio: number;
  isBalanced: boolean;
  entriesCount: number;
  validationErrors: number;
}

interface ValidationSummary {
  totalEntries: number;
  validEntries: number;
  invalidEntries: number;
  warningEntries: number;
  errors: string[];
  warnings: string[];
}

export function EnhancedAccountingDashboard() {
  const [trialBalance, setTrialBalance] = useState<EnhancedTrialBalance | null>(
    null,
  );
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] =
    useState<IncomeStatement | null>(null);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts[]>([]);
  const [validationSummary, setValidationSummary] =
    useState<ValidationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean;
    count: number;
  } | null>(null);

  // Calcular métricas contábeis
  const metrics = useMemo((): AccountingMetrics => {
    if (!balanceSheet || !incomeStatement) {
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        debtToEquityRatio: 0,
        currentRatio: 0,
        isBalanced: false,
        entriesCount: 0,
        validationErrors: 0,
      };
    }

    const totalAssets = balanceSheet.assets.total;
    const totalLiabilities = balanceSheet.liabilities.total;
    const totalEquity = balanceSheet.equity.total;
    const totalRevenue = incomeStatement.revenue.total;
    const totalExpenses = incomeStatement.expenses.total;
    const netProfit = incomeStatement.netProfit;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const debtToEquityRatio =
      totalEquity > 0 ? totalLiabilities / totalEquity : 0;

    // Calcular índice de liquidez corrente
    const currentAssets = Object.values(balanceSheet.assets.current).reduce(
      (sum, val) => sum + val,
      0,
    );
    const currentLiabilities = Object.values(
      balanceSheet.liabilities.current,
    ).reduce((sum, val) => sum + val, 0);
    const currentRatio =
      currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

    const entries = enhancedAccountingSystem.getEnhancedAccountingEntries();
    const validationErrors = validationSummary?.invalidEntries || 0;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      debtToEquityRatio,
      currentRatio,
      isBalanced: balanceSheet.isBalanced,
      entriesCount: entries.length,
      validationErrors,
    };
  }, [balanceSheet, incomeStatement, validationSummary]);

  // Carregar dados contábeis
  const loadAccountingData = async () => {
    setIsLoading(true);
    try {
      // Definir período baseado na seleção
      const now = new Date();
      let startDate: string;
      let endDate = now.toISOString().split("T")[0];

      switch (selectedPeriod) {
        case "current-month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          startDate = lastMonth.toISOString().split("T")[0];
          endDate = new Date(now.getFullYear(), now.getMonth(), 0)
            .toISOString()
            .split("T")[0];
          break;
        case "current-year":
          startDate = new Date(now.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-year":
          startDate = new Date(now.getFullYear() - 1, 0, 1)
            .toISOString()
            .split("T")[0];
          endDate = new Date(now.getFullYear() - 1, 11, 31)
            .toISOString()
            .split("T")[0];
          break;
        default:
          startDate = new Date(now.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
      }

      // Gerar relatórios
      const trial = enhancedAccountingSystem.generateEnhancedTrialBalance(
        startDate,
        endDate,
      );
      const balance = enhancedAccountingSystem.generateBalanceSheet(endDate);
      const income = enhancedAccountingSystem.generateIncomeStatement(
        startDate,
        endDate,
      );
      const chart = enhancedAccountingSystem.getChartOfAccounts();

      setTrialBalance(trial);
      setBalanceSheet(balance);
      setIncomeStatement(income);
      setChartOfAccounts(chart);

      // Validar entradas contábeis
      await validateAccountingEntries();
    } catch (error) {
      logComponents.error("Erro ao carregar dados contábeis:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validar todas as entradas contábeis
  const validateAccountingEntries = async () => {
    const entries = enhancedAccountingSystem.getEnhancedAccountingEntries();
    const batchGroups = entries.reduce(
      (groups, entry) => {
        if (!groups[entry.batchId]) {
          groups[entry.batchId] = [];
        }
        groups[entry.batchId].push(entry);
        return groups;
      },
      {} as Record<string, EnhancedAccountingEntry[]>,
    );

    let validEntries = 0;
    let invalidEntries = 0;
    let warningEntries = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar cada lote de lançamentos
    Object.entries(batchGroups).forEach(([batchId, batchEntries]) => {
      const totalDebits = batchEntries.reduce(
        (sum, entry) => sum + entry.debit,
        0,
      );
      const totalCredits = batchEntries.reduce(
        (sum, entry) => sum + entry.credit,
        0,
      );

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        invalidEntries += batchEntries.length;
        errors.push(
          `Lote ${batchId}: Débitos (${formatCurrency(totalDebits)}) ≠ Créditos (${formatCurrency(totalCredits)})`,
        );
      } else {
        validEntries += batchEntries.length;
      }

      // Verificar entradas com valores zerados
      batchEntries.forEach((entry) => {
        if (entry.debit === 0 && entry.credit === 0) {
          warningEntries++;
          warnings.push(`Entrada ${entry.id}: Valor zerado`);
        }
      });
    });

    setValidationSummary({
      totalEntries: entries.length,
      validEntries,
      invalidEntries,
      warningEntries,
      errors: errors.slice(0, 10), // Limitar a 10 erros
      warnings: warnings.slice(0, 10), // Limitar a 10 avisos
    });
  };

  // Migrar sistema antigo
  const handleMigration = async () => {
    try {
      const result = await enhancedAccountingSystem.migrateFromOldSystem();
      setMigrationStatus({ completed: result.success, count: result.migrated });
      if (result.success) {
        await loadAccountingData();
      }
    } catch (error) {
      logComponents.error("Erro na migração:", error);
    }
  };

  // Processar transações pendentes
  const processTransactions = async () => {
    const transactions = transactions;
    const entries = enhancedAccountingSystem.getEnhancedAccountingEntries();
    const processedTransactionIds = new Set(
      entries.map((e) => e.transactionId),
    );

    let processed = 0;
    for (const transaction of transactions) {
      if (!processedTransactionIds.has(transaction.id)) {
        const result =
          await enhancedAccountingSystem.createEnhancedDoubleEntry(transaction);
        if (result.success) {
          processed++;
        }
      }
    }

    if (processed > 0) {
      await loadAccountingData();
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, [selectedPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados contábeis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema Contábil Aprimorado</h1>
          <p className="text-muted-foreground">
            Gestão contábil com princípios de partida dobrada
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="current-month">Mês Atual</option>
            <option value="last-month">Mês Anterior</option>
            <option value="current-year">Ano Atual</option>
            <option value="last-year">Ano Anterior</option>
          </select>
          <Button onClick={processTransactions} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Processar Transações
          </Button>
          <Button onClick={loadAccountingData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status de Validação */}
      {validationSummary && (
        <Alert
          className={
            validationSummary.invalidEntries > 0
              ? "border-destructive"
              : "border-green-500"
          }
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-4">
              <span>
                <strong>{validationSummary.validEntries}</strong> entradas
                válidas,
                <strong className="text-destructive">
                  {validationSummary.invalidEntries}
                </strong>{" "}
                inválidas,
                <strong className="text-yellow-600">
                  {validationSummary.warningEntries}
                </strong>{" "}
                com avisos
              </span>
              {validationSummary.invalidEntries === 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sistema Balanceado
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Ativos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalAssets)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.isBalanced ? "Balanceado" : "Desbalanceado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Patrimônio Líquido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalEquity)}
            </div>
            <p className="text-xs text-muted-foreground">
              Índice D/E: {metrics.debtToEquityRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            {metrics.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                metrics.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {metrics.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Liquidez Corrente
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.currentRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.currentRatio >= 1 ? "Saudável" : "Atenção"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Migração */}
      {!migrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Migração do Sistema Antigo</CardTitle>
            <CardDescription>
              Migre os lançamentos do sistema contábil anterior para o novo
              sistema aprimorado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleMigration}>
              <FileText className="h-4 w-4 mr-2" />
              Iniciar Migração
            </Button>
          </CardContent>
        </Card>
      )}

      {migrationStatus && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Migração concluída com sucesso! {migrationStatus.count} lançamentos
            migrados.
          </AlertDescription>
        </Alert>
      )}

      {/* Relatórios Contábeis */}
      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trial-balance">Balancete</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balanço Patrimonial</TabsTrigger>
          <TabsTrigger value="income-statement">DRE</TabsTrigger>
          <TabsTrigger value="chart-accounts">Plano de Contas</TabsTrigger>
          <TabsTrigger value="validation">Validação</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Balancete de Verificação
              </CardTitle>
              <CardDescription>
                Período: {trialBalance?.period.start} a{" "}
                {trialBalance?.period.end}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialBalance && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b pb-2">
                    <div>Conta</div>
                    <div className="text-right">Débito</div>
                    <div className="text-right">Crédito</div>
                    <div className="text-right">Saldo</div>
                  </div>

                  {Object.values(trialBalance.accounts).map((account) => (
                    <div
                      key={account.code}
                      className="grid grid-cols-4 gap-4 text-sm"
                    >
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {account.code}
                        </div>
                      </div>
                      <div className="text-right">
                        {account.debitMovements > 0 &&
                          formatCurrency(account.debitMovements)}
                      </div>
                      <div className="text-right">
                        {account.creditMovements > 0 &&
                          formatCurrency(account.creditMovements)}
                      </div>
                      <div
                        className={`text-right font-medium ${
                          account.currentBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(account.currentBalance))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="grid grid-cols-4 gap-4 text-sm font-bold">
                    <div>TOTAIS</div>
                    <div className="text-right">
                      {formatCurrency(trialBalance.totals.debitMovements)}
                    </div>
                    <div className="text-right">
                      {formatCurrency(trialBalance.totals.creditMovements)}
                    </div>
                    <div className="text-right">
                      {formatCurrency(trialBalance.totals.currentBalance)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {trialBalance.isBalanced ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Balanceado
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Desbalanceado
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Balanço Patrimonial
              </CardTitle>
              <CardDescription>
                Posição em {balanceSheet?.period.end}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balanceSheet && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ativo */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">ATIVO</h3>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Ativo Circulante
                      </h4>
                      {Object.entries(balanceSheet.assets.current).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Ativo Não Circulante
                      </h4>
                      {Object.entries(balanceSheet.assets.nonCurrent).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}
                    </div>

                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>TOTAL DO ATIVO</span>
                      <span>{formatCurrency(balanceSheet.assets.total)}</span>
                    </div>
                  </div>

                  {/* Passivo + Patrimônio Líquido */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      PASSIVO + PATRIMÔNIO LÍQUIDO
                    </h3>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Passivo Circulante
                      </h4>
                      {Object.entries(balanceSheet.liabilities.current).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Passivo Não Circulante
                      </h4>
                      {Object.entries(balanceSheet.liabilities.nonCurrent).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">
                        Patrimônio Líquido
                      </h4>
                      <div className="flex justify-between text-sm">
                        <span>Capital Social</span>
                        <span>
                          {formatCurrency(balanceSheet.equity.capital)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reservas</span>
                        <span>
                          {formatCurrency(balanceSheet.equity.reserves)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Lucros Acumulados</span>
                        <span>
                          {formatCurrency(balanceSheet.equity.retainedEarnings)}
                        </span>
                      </div>
                    </div>

                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>TOTAL DO PASSIVO + PL</span>
                      <span>
                        {formatCurrency(
                          balanceSheet.liabilities.total +
                            balanceSheet.equity.total,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Demonstração do Resultado do Exercício (DRE)
              </CardTitle>
              <CardDescription>
                Período: {incomeStatement?.period.start} a{" "}
                {incomeStatement?.period.end}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomeStatement && (
                <div className="space-y-4">
                  {/* Receitas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">RECEITAS</h3>

                    <div className="ml-4 space-y-1">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Receitas Operacionais
                      </h4>
                      {Object.entries(incomeStatement.revenue.operating).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm ml-4"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}

                      <h4 className="font-medium text-sm text-muted-foreground mt-2">
                        Receitas Não Operacionais
                      </h4>
                      {Object.entries(incomeStatement.revenue.nonOperating).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm ml-4"
                          >
                            <span>{name}</span>
                            <span>{formatCurrency(value)}</span>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>TOTAL DAS RECEITAS</span>
                      <span>
                        {formatCurrency(incomeStatement.revenue.total)}
                      </span>
                    </div>
                  </div>

                  {/* Despesas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">DESPESAS</h3>

                    <div className="ml-4 space-y-1">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Despesas Operacionais
                      </h4>
                      {Object.entries(incomeStatement.expenses.operating).map(
                        ([name, value]) => (
                          <div
                            key={name}
                            className="flex justify-between text-sm ml-4"
                          >
                            <span>{name}</span>
                            <span>({formatCurrency(value)})</span>
                          </div>
                        ),
                      )}

                      <h4 className="font-medium text-sm text-muted-foreground mt-2">
                        Despesas Não Operacionais
                      </h4>
                      {Object.entries(
                        incomeStatement.expenses.nonOperating,
                      ).map(([name, value]) => (
                        <div
                          key={name}
                          className="flex justify-between text-sm ml-4"
                        >
                          <span>{name}</span>
                          <span>({formatCurrency(value)})</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>TOTAL DAS DESPESAS</span>
                      <span>
                        ({formatCurrency(incomeStatement.expenses.total)})
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Resultados */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span>LUCRO OPERACIONAL</span>
                      <span
                        className={
                          incomeStatement.operatingProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(incomeStatement.operatingProfit)}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-lg">
                      <span>LUCRO LÍQUIDO</span>
                      <span
                        className={
                          incomeStatement.netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(incomeStatement.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart-accounts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plano de Contas
              </CardTitle>
              <CardDescription>
                Estrutura hierárquica das contas contábeis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chartOfAccounts
                  .filter((account) => account.level <= 3) // Mostrar até nível 3
                  .map((account) => (
                    <div
                      key={account.code}
                      className={`flex items-center justify-between p-2 rounded ${
                        account.acceptsLaunches ? "bg-blue-50" : "bg-gray-50"
                      }`}
                      style={{ marginLeft: `${(account.level - 1) * 20}px` }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {account.code}
                          </span>
                          <span
                            className={
                              account.acceptsLaunches
                                ? "font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {account.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {account.type}
                        </Badge>
                        <Badge
                          variant={
                            account.nature === "DEVEDORA"
                              ? "default"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {account.nature}
                        </Badge>
                        {account.acceptsLaunches && (
                          <Badge
                            variant="outline"
                            size="sm"
                            className="bg-blue-100"
                          >
                            Aceita Lançamentos
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Validação Contábil
              </CardTitle>
              <CardDescription>
                Verificação da integridade dos lançamentos contábeis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationSummary && (
                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {validationSummary.validEntries}
                      </div>
                      <div className="text-sm text-green-700">
                        Entradas Válidas
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {validationSummary.invalidEntries}
                      </div>
                      <div className="text-sm text-red-700">
                        Entradas Inválidas
                      </div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationSummary.warningEntries}
                      </div>
                      <div className="text-sm text-yellow-700">Avisos</div>
                    </div>
                  </div>

                  {/* Progresso */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Integridade dos Dados</span>
                      <span>
                        {(
                          (validationSummary.validEntries /
                            validationSummary.totalEntries) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (validationSummary.validEntries /
                          validationSummary.totalEntries) *
                        100
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Erros */}
                  {validationSummary.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        Erros Encontrados
                      </h4>
                      <div className="space-y-1">
                        {validationSummary.errors.map((error, index) => (
                          <div
                            key={index}
                            className="text-sm text-red-700 bg-red-50 p-2 rounded"
                          >
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avisos */}
                  {validationSummary.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-600 mb-2">
                        Avisos
                      </h4>
                      <div className="space-y-1">
                        {validationSummary.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {validationSummary.invalidEntries === 0 &&
                    validationSummary.warningEntries === 0 && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Parabéns! Todos os lançamentos contábeis estão válidos
                          e em conformidade com os princípios de partida
                          dobrada.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
