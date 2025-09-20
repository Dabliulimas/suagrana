"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
// import { Button } from "./ui/button"; // Unused
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Search,
  // Filter, // Unused
  Calendar,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  transferAccountId?: string;
  transferAccountName?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  bank: string;
  balance: number;
  formattedBalance: string;
}

interface AccountHistoryProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountHistory({
  account,
  isOpen,
  onClose,
}: AccountHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && account) {
      loadTransactions();
    }
  }, [isOpen, account, loadTransactions]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterCategory, filterTransactions]);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Carregar transações do localStorage
      const storedTransactions = localStorage.getItem("sua-grana-transactions");
      if (typeof window === "undefined") return;
      const allTransactions: Transaction[] = storedTransactions
        ? JSON.parse(storedTransactions)
        : [];

      // Filtrar transações da conta específica
      const accountTransactions = allTransactions.filter(
        (transaction) =>
          transaction.accountId === account.id ||
          transaction.transferAccountId === account.id,
      );

      // Ordenar por data (mais recente primeiro)
      accountTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setTransactions(accountTransactions);
    } catch (error) {
      logComponents.error("Erro ao carregar transações:", error);
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  const filterTransactions = useCallback(() => {
    let filtered = transactions;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtrar por tipo
    if (filterType !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === filterType,
      );
    }

    // Filtrar por categoria
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.category === filterCategory,
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, filterType, filterCategory]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case "expense":
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case "transfer":
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Entrada";
      case "expense":
        return "Saída";
      case "transfer":
        return "Transferência";
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const safeAmount = amount || 0;
    const formattedAmount = safeAmount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    if (type === "expense") {
      return `- ${formattedAmount}`;
    } else if (type === "income") {
      return `+ ${formattedAmount}`;
    }
    return formattedAmount;
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(transactions.map((t) => t.category))];
    return categories.filter(Boolean);
  };

  // const calculateBalance = () => {
  //   return filteredTransactions.reduce((total, transaction) => {
  //     if (transaction.type === "income") {
  //       return total + transaction.amount;
  //     } else if (transaction.type === "expense") {
  //       return total - transaction.amount;
  //     }
  //     return total;
  //   }, 0);
  // };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            Histórico - {account.name}
          </DialogTitle>
          <DialogDescription>
            {account.bank} • Saldo atual: {account.formattedBalance}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Entradas</SelectItem>
                <SelectItem value="expense">Saídas</SelectItem>
                <SelectItem value="transfer">Transferências</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {getUniqueCategories()
                  .filter((category) => category && category.trim() !== "")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Total de Transações
                  </p>
                  <p className="text-2xl font-bold">
                    {filteredTransactions.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      filteredTransactions.filter((t) => t.type === "income")
                        .length
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saídas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {
                      filteredTransactions.filter((t) => t.type === "expense")
                        .length
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transações</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      Carregando transações...
                    </p>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTransactions.map((transaction, index) => (
                      <div key={transaction.id}>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {transaction.description}
                              </p>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{transaction.category}</span>
                                <span>•</span>
                                <span>
                                  {format(
                                    new Date(transaction.date),
                                    "dd/MM/yyyy",
                                    {
                                      locale: ptBR,
                                    },
                                  )}
                                </span>
                                {transaction.transferAccountName && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Para: {transaction.transferAccountName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">
                              {getTransactionTypeLabel(transaction.type)}
                            </Badge>
                            <div
                              className={`font-semibold ${getTransactionColor(transaction.type)}`}
                            >
                              {formatAmount(
                                transaction.amount,
                                transaction.type,
                              )}
                            </div>
                          </div>
                        </div>
                        {index < filteredTransactions.length - 1 && (
                          <Separator />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <Calendar className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Nenhuma transação encontrada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tente ajustar os filtros ou adicionar algumas transações
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
