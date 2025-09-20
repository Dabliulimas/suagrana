"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { type Account } from "@/lib/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Copy,
  Trash2,
  Edit,
  Eye,
  DollarSign,
  Search,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Wallet,
  Building2,
  BarChart3,
  ArrowRightLeft,
  Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { AddAccountModal } from "@/components/modals/accounts/add-account-modal";
import { AccountOperations } from "@/components/account-operations";
import { AccountHistory } from "@/components/account-history";
import { EditAccountModal } from "@/components/edit-account-modal";
import { useRouter } from "next/navigation";
import { useClientOnly } from "@/hooks/use-client-only";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  OptimizedPageTransition,
  useRenderPerformance,
  useOptimizedDebounce,
} from "@/components/optimized-page-transition";
import { useOptimizedFilters } from "@/hooks/use-optimized-storage";
import { useAccounts } from "@/contexts/unified-context";
import { BackButton } from "@/components/back-button";
import { formatCurrency, getCurrencySymbol, getSupportedCurrencies } from "@/lib/utils/currency";


export default function AccountsPage() {
  const { toast } = useToast();
  const isClient = useClientOnly();
  const router = useRouter();
  const {
    accounts: allAccounts = [],
    isLoading,
    refresh,
    delete: deleteAccount,
  } = useAccounts();
  const { renderCount } = useRenderPerformance("AccountsPage");
  
  // Log render count for debugging
  console.log('Accounts page render count:', renderCount);

  const [showOperations, setShowOperations] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  // Hook já declarado acima - removendo duplicata
  const debouncedSearchTerm = useOptimizedDebounce(searchTerm, 300);

  // 🎯 SISTEMA SIMPLIFICADO - Incluir todos os tipos (contas + cartões)
  // Antes: só contas bancárias | Agora: contas + cartões unificados
  const accounts = useMemo(() => {
    return Array.isArray(allAccounts) ? allAccounts : [];
  }, [allAccounts]);

  // Separar em contas e cartões para melhor visualização
  const bankAccounts = useMemo(() => {
    return accounts.filter((account) => account.type !== "credit");
  }, [accounts]);

  const creditCards = useMemo(() => {
    return accounts.filter((account) => account.type === "credit");
  }, [accounts]);

  const loadAccounts = useCallback(() => {
    if (isClient) {
      refresh();
    }
  }, [refresh, isClient]);

  const handleDeleteAccount = useCallback(
    async (accountId: string) => {
      try {
        await deleteAccount(accountId);
        toast({
          title: "Sucesso",
          description: "Conta excluída com sucesso.",
        });
      } catch {
        toast({
          title: "Erro",
          description: "Erro ao excluir conta.",
          variant: "destructive",
        });
      }
    },
    [deleteAccount, toast],
  );

  const handleCopyAccount = useCallback(async (accountId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(accountId);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = accountId;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      toast({
        title: "Sucesso",
        description: "ID da conta copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao copiar ID da conta.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Remove useEffect que pode estar causando loop infinito
  // O hook useAccounts já carrega os dados automaticamente

  // Usar hook otimizado para filtros
  const { filteredData: filteredAccounts } = useOptimizedFilters(
    accounts,
    (account, filters) => {
      const matchesSearch =
        account.name
          .toLowerCase()
          .includes(filters.debouncedSearchTerm.toLowerCase()) ||
        (account.bank &&
          account.bank
            .toLowerCase()
            .includes(filters.debouncedSearchTerm.toLowerCase()));
      const matchesType =
        filters.filterType === "all" || account.type === filters.filterType;
      return matchesSearch && matchesType;
    },
    { filterType, debouncedSearchTerm },
  );

  const filteredAndSortedAccounts = useMemo(() => {
    const sorted = [...filteredAccounts].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "balance":
          return b.balance - a.balance;
        case "type":
          return a.type.localeCompare(b.type);
        case "bank":
          return (a.bank || "").localeCompare(b.bank || "");
        default:
          return 0;
      }
    });

    return sorted.map((account) => ({
      ...account,
      formattedBalance: formatCurrency(account.balance, account.currency || 'BRL'),
    }));
  }, [filteredAccounts, sortBy]);

  const accountStats = useMemo(() => {
    // Agrupar contas por moeda
    const balancesByCurrency = accounts.reduce((acc, account) => {
      const currency = account.currency || 'BRL';
      if (!acc[currency]) {
        acc[currency] = { balance: 0, count: 0 };
      }
      acc[currency].balance += account.balance;
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, { balance: number; count: number }>);

    const accountsByType = accounts.reduce(
      (acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Para exibição, usar a primeira moeda com maior saldo
    const primaryCurrency = Object.keys(balancesByCurrency).reduce((a, b) => 
      balancesByCurrency[a].balance > balancesByCurrency[b].balance ? a : b
    , 'BRL');

    const totalBalance = balancesByCurrency[primaryCurrency]?.balance || 0;

    return {
      totalBalance,
      primaryCurrency,
      balancesByCurrency,
      totalAccounts: accounts.length,
      accountsByType,
      netWorth: totalBalance,
    };
  }, [accounts]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "checking":
        return <CreditCard className="h-5 w-5" />;
      case "savings":
        return <PiggyBank className="h-5 w-5" />;
      case "credit":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case "checking":
        return "Conta Corrente";
      case "savings":
        return "Poupanca";
      case "credit":
        return "Cartao de Credito";
      case "investment":
        return "Investimento";
      default:
        return "Conta";
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <ModernAppLayout
      title="Contas"
      subtitle="Gerencie suas contas bancárias e carteiras"
    >
      <OptimizedPageTransition>
        <div className="p-4 md:p-6 space-y-6">
          <BackButton />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Gestao de Contas
              </h1>
              <p className="text-muted-foreground">
                Gerencie suas contas bancarias
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/accounting")}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Sistema Contábil
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(accountStats.totalBalance, accountStats.primaryCurrency)}
                </div>
                {Object.keys(accountStats.balancesByCurrency).length > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.entries(accountStats.balancesByCurrency)
                      .filter(([currency]) => currency !== accountStats.primaryCurrency)
                      .map(([currency, data]) => (
                        <div key={currency}>
                          {formatCurrency(data.balance, currency)}
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Credito Disponivel
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(0, 'BRL')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Não implementado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Contas
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {accountStats.totalAccounts}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Patrimonio Liquido
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(accountStats.netWorth, accountStats.primaryCurrency)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar contas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupanca</SelectItem>
                  <SelectItem value="credit">Cartao de Credito</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="balance">Saldo</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                  <SelectItem value="bank">Banco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedAccounts.length > 0 ? (
              filteredAndSortedAccounts.map((account) => (
                <Card
                  key={account.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAccountIcon(account.type)}
                        <div>
                          <CardTitle className="text-lg">
                            {account.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {account.bank || "Banco nao informado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">
                          {getAccountTypeName(account.type)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getCurrencySymbol(account.currency || 'BRL')} {account.currency || 'BRL'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Saldo */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Saldo Atual
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          account.balance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {account.formattedBalance}
                      </p>
                      {account.type === "credit" && account.creditLimit && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Limite: {formatCurrency(account.creditLimit, account.currency || 'BRL')}
                        </p>
                      )}
                    </div>

                    {/* Operacoes Rapidas */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Operacoes Rapidas
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowOperations(true);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Adicionar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowOperations(true);
                          }}
                        >
                          <TrendingDown className="mr-1 h-3 w-3" />
                          Sacar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowOperations(true);
                          }}
                        >
                          <ArrowRightLeft className="mr-1 h-3 w-3" />
                          Transferir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowHistory(true);
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Historico
                        </Button>
                      </div>
                    </div>

                    {/* Acoes Administrativas */}
                    <div className="flex justify-between pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAccount(account.id)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar ID
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar exclusao
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acao nao pode ser desfeita. Isso excluira
                              permanentemente a conta "{account.name}" e
                              removera todos os dados associados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                {searchTerm || filterType !== "all" ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhuma conta encontrada com os filtros aplicados.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {!searchTerm && filterType === "all" && (
                      <div className="space-y-4">
                        <p className="text-muted-foreground">
                          Voce ainda nao possui contas cadastradas.
                        </p>
                        <Button
                          onClick={() => setShowAddModal(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Criar primeira conta
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modals */}
          {showOperations && selectedAccount && (
            <AccountOperations
              account={selectedAccount}
              onClose={() => {
                setShowOperations(false);
                setSelectedAccount(null);
              }}
              onUpdate={loadAccounts}
            />
          )}

          {showHistory && selectedAccount && (
            <AccountHistory
              account={selectedAccount}
              isOpen={showHistory}
              onClose={() => {
                setShowHistory(false);
                setSelectedAccount(null);
              }}
            />
          )}

          <EditAccountModal
            account={selectedAccount}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedAccount(null);
            }}
            onAccountUpdated={loadAccounts}
          />

          <AddAccountModal
            open={showAddModal}
            onOpenChange={setShowAddModal}
          />
        </div>
      </OptimizedPageTransition>
    </ModernAppLayout>
  );
}
