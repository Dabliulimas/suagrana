"use client";

import { useState, useEffect } from "react";
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
// import { Progress } from "./ui/progress"; // Unused
import { accountingSystem } from "../lib/accounting-system";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import {
  Calculator,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  TrendingUp,
} from "lucide-react";
import { toast } from "../hooks/use-toast";

interface TrialBalanceData {
  accounts: Record<string, { debit: number; credit: number }>;
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
}

interface AccountBalance {
  name: string;
  currentBalance: number;
  calculatedBalance: number;
  difference: number;
  needsCorrection: boolean;
}

export function AccountingDashboard() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceData | null>(
    null,
  );
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    completed: boolean;
    migrated: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = () => {
    // Carregar balancete de verificação
    const balance = accountingSystem.generateTrialBalance();
    setTrialBalance(balance);

    // Carregar comparação de saldos
    const accounts = accounts;
    const balanceComparison = accounts.map((account) => {
      const calculatedBalance = accountingSystem.calculateAccountBalance(
        account.name,
      );
      const difference = calculatedBalance - account.balance;

      return {
        name: account.name,
        currentBalance: account.balance,
        calculatedBalance,
        difference,
        needsCorrection: Math.abs(difference) > 0.01,
      };
    });

    setAccountBalances(balanceComparison);

    // Verificar status da migração
    const transactions = transactions;
    const entries = accountingSystem.getAccountingEntries();
    const migratedTransactions = new Set(entries.map((e) => e.transactionId));

    setMigrationStatus({
      completed: migratedTransactions.size === transactions.length,
      migrated: migratedTransactions.size,
      total: transactions.length,
    });
  };

  const handleMigrateTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await accountingSystem.migrateExistingTransactions();
      if (result.success) {
        toast({
          title: "Migração concluída",
          description: `${result.migrated} transações foram migradas para o sistema de partidas dobradas.`,
        });
        loadAccountingData();
      } else {
        toast({
          title: "Erro na migração",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na migração",
        description: "Ocorreu um erro inesperado durante a migração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixBalances = async () => {
    setIsLoading(true);
    try {
      const result = await accountingSystem.fixAccountBalances();
      if (result.success) {
        toast({
          title: "Saldos corrigidos",
          description: `${result.corrections} contas tiveram seus saldos corrigidos.`,
        });
        loadAccountingData();
      } else {
        toast({
          title: "Erro na correção",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na correção",
        description: "Ocorreu um erro inesperado durante a correção.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDebits = trialBalance
    ? Object.values(trialBalance.accounts).reduce(
        (sum, acc) => sum + acc.debit,
        0,
      )
    : 0;
  const totalCredits = trialBalance
    ? Object.values(trialBalance.accounts).reduce(
        (sum, acc) => sum + acc.credit,
        0,
      )
    : 0;
  const accountsNeedingCorrection = accountBalances.filter(
    (acc) => acc.needsCorrection,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sistema Contábil
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de partidas dobradas e balancete de verificação
          </p>
        </div>
        <Button onClick={loadAccountingData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balancete</CardTitle>
            {trialBalance?.isBalanced ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trialBalance?.isBalanced ? "Balanceado" : "Desbalanceado"}
            </div>
            <p className="text-xs text-muted-foreground">
              Débitos: R$ {totalDebits.toFixed(2)} | Créditos: R${" "}
              {totalCredits.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contas Desatualizadas
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accountsNeedingCorrection}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountsNeedingCorrection === 0
                ? "Todos os saldos estão corretos"
                : "Contas precisam de correção"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Migração</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {migrationStatus
                ? `${migrationStatus.migrated}/${migrationStatus.total}`
                : "0/0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {migrationStatus?.completed
                ? "Migração completa"
                : "Transações migradas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lançamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accountingSystem.getAccountingEntries().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de lançamentos contábeis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Migration Alert */}
      {migrationStatus && !migrationStatus.completed && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Existem {migrationStatus.total - migrationStatus.migrated}{" "}
              transações que ainda não foram migradas para o sistema de partidas
              dobradas.
            </span>
            <Button
              onClick={handleMigrateTransactions}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? "Migrando..." : "Migrar Agora"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Correction Alert */}
      {accountsNeedingCorrection > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {accountsNeedingCorrection} conta(s) possuem saldos incorretos que
              precisam ser corrigidos.
            </span>
            <Button onClick={handleFixBalances} disabled={isLoading} size="sm">
              {isLoading ? "Corrigindo..." : "Corrigir Saldos"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trial-balance">
            Balancete de Verificação
          </TabsTrigger>
          <TabsTrigger value="account-balances">Saldos das Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balancete de Verificação</CardTitle>
              <CardDescription>
                Resumo de todos os débitos e créditos por conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trialBalance && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {Object.entries(trialBalance.accounts).map(
                      ([accountName, balance]) => (
                        <div
                          key={accountName}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="font-medium">{accountName}</div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">
                              Débito: R$ {balance.debit.toFixed(2)}
                            </span>
                            <span className="text-red-600">
                              Crédito: R$ {balance.credit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>TOTAIS:</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">
                          R$ {trialBalance.totalDebits.toFixed(2)}
                        </span>
                        <span className="text-red-600">
                          R$ {trialBalance.totalCredits.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge
                        variant={
                          trialBalance.isBalanced ? "default" : "destructive"
                        }
                      >
                        {trialBalance.isBalanced
                          ? "✓ Balanceado"
                          : "✗ Desbalanceado"}
                      </Badge>
                      {!trialBalance.isBalanced && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Diferença: R${" "}
                          {Math.abs(
                            trialBalance.totalDebits -
                              trialBalance.totalCredits,
                          ).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account-balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Saldos</CardTitle>
              <CardDescription>
                Comparação entre saldos atuais e calculados pelo sistema
                contábil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountBalances.map((account) => (
                  <div key={account.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{account.name}</h3>
                      {account.needsCorrection && (
                        <Badge variant="destructive">Precisa Correção</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Saldo Atual:
                        </span>
                        <div className="font-medium">
                          R$ {account.currentBalance.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Saldo Calculado:
                        </span>
                        <div className="font-medium">
                          R$ {account.calculatedBalance.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Diferença:
                        </span>
                        <div
                          className={`font-medium ${
                            account.difference > 0
                              ? "text-green-600"
                              : account.difference < 0
                                ? "text-red-600"
                                : "text-gray-600"
                          }`}
                        >
                          {account.difference > 0 ? "+" : ""}R${" "}
                          {account.difference.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
