"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Search,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  storage,
  type Transaction,
  type Investment,
  type Dividend,
} from "../lib/storage";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import { useTransactions } from "../contexts/unified-context";

// Interface para transação consolidada que inclui todos os tipos de operações financeiras
interface ConsolidatedTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "shared" | "investment" | "dividend";
  category: string;
  date: string;
  account?: string;
  notes?: string;
  originalType?: string; // Para distinguir entre buy/sell nos investimentos
}

interface TransactionsListModalProps {
  onClose: () => void;
}

export function TransactionsListModal({ onClose }: TransactionsListModalProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const { transactions } = useTransactions();
  const [consolidatedTransactions, setConsolidatedTransactions] = useState<
    ConsolidatedTransaction[]
  >([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    ConsolidatedTransaction[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Função para consolidar todas as operações financeiras
  const consolidateAllTransactions = () => {
    const consolidated: ConsolidatedTransaction[] = [];

    // Adicionar transações regulares
    transactions.forEach((transaction) => {
      consolidated.push({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        account: transaction.account,
        notes: transaction.notes,
      });
    });

    // Adicionar investimentos como transações
    state.investments.forEach((investment) => {
      consolidated.push({
        id: investment.id,
        description: `${investment.operation === "buy" ? "Compra" : "Venda"}: ${investment.name || investment.ticker}`,
        amount: investment.totalValue,
        type: "investment",
        category: `Investimentos - ${investment.type}`,
        date: investment.date,
        account: investment.account,
        notes: `${investment.quantity} ${investment.ticker ? `(${investment.ticker})` : ""} @ R$ ${investment.price.toFixed(2)}`,
        originalType: investment.operation,
      });
    });

    // Adicionar dividendos
    const dividends = storage.getDividends();
    dividends.forEach((dividend) => {
      consolidated.push({
        id: dividend.id,
        description: `Dividendo: ${dividend.ticker}`,
        amount: dividend.totalAmount,
        type: "dividend",
        category: "Dividendos",
        date: dividend.payDate,
        account: dividend.account,
        notes: `${dividend.quantity} cotas @ R$ ${dividend.amount.toFixed(4)}`,
      });
    });

    // Ordenar por data (mais recente primeiro)
    consolidated.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return consolidated;
  };

  useEffect(() => {
    const consolidated = consolidateAllTransactions();
    setConsolidatedTransactions(consolidated);
    setFilteredTransactions(consolidated);

    // Load categories from all sources
    const storedCategories = storage.getCategories();
    const transactionCategories = Array.from(
      new Set(consolidated.map((t) => t.category)),
    ).filter(Boolean);

    // Combine stored categories with transaction categories
    const allCategories = Array.from(
      new Set([
        ...storedCategories.map((cat: any) => cat.name || cat),
        ...transactionCategories,
      ]),
    ).filter(Boolean);

    setCategories(allCategories);
  }, [transactions, state.investments]);

  useEffect(() => {
    let filtered = consolidatedTransactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === typeFilter,
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Filter by period/date
    filtered = filterByPeriod(
      filtered,
      periodFilter,
      customStartDate,
      customEndDate,
    );

    // Sort by date (newest first)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setFilteredTransactions(filtered);
  }, [
    consolidatedTransactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    periodFilter,
    customStartDate,
    customEndDate,
  ]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <ArrowUpRight className="w-4 h-4" />;
      case "shared":
        return <Users className="w-4 h-4" />;
      case "investment":
        return <TrendingUp className="w-4 h-4" />;
      case "dividend":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <ArrowDownRight className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400";
      case "shared":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400";
      case "investment":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400";
      case "dividend":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400";
      default:
        return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400";
    }
  };

  const getAmountColor = (type: string, originalType?: string) => {
    switch (type) {
      case "income":
      case "dividend":
        return "text-green-600 dark:text-green-400";
      case "investment":
        return originalType === "sell"
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400";
      default:
        return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Todas as Transações</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="shared">Compartilhada</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                      <SelectItem value="dividend">Dividendo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories
                        .filter(
                          (category) => category && category.trim() !== "",
                        )
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTypeFilter("all");
                      setCategoryFilter("all");
                      setPeriodFilter("all");
                      setCustomStartDate(undefined);
                      setCustomEndDate(undefined);
                      setSearchTerm("");
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                </div>

                <CustomDateFilter
                  period={periodFilter}
                  onPeriodChange={setPeriodFilter}
                  startDate={customStartDate}
                  onStartDateChange={setCustomStartDate}
                  endDate={customEndDate}
                  onEndDateChange={setCustomEndDate}
                />
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            {filteredTransactions.length} de {consolidatedTransactions.length}{" "}
            transações
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || typeFilter !== "all" || categoryFilter !== "all"
                  ? "Nenhuma transação encontrada com os filtros aplicados"
                  : "Nenhuma transação encontrada"}
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}
                        >
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {transaction.description}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.type === "income"
                                ? "Receita"
                                : transaction.type === "shared"
                                  ? "Compartilhada"
                                  : transaction.type === "investment"
                                    ? "Investimento"
                                    : transaction.type === "dividend"
                                      ? "Dividendo"
                                      : "Despesa"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                            {transaction.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-40">
                                  {transaction.notes}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${getAmountColor(transaction.type, transaction.originalType)}`}
                        >
                          {transaction.type === "income" ||
                          transaction.type === "dividend" ||
                          (transaction.type === "investment" &&
                            transaction.originalType === "sell")
                            ? "+"
                            : "-"}
                          R${" "}
                          {Math.abs(transaction.amount).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 },
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
