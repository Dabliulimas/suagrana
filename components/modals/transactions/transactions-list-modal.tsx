"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  account?: string;
  tags?: string[];
  notes?: string;
}

interface TransactionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
  onView?: (transaction: Transaction) => void;
}

export function TransactionsListModal({
  isOpen,
  onClose,
  transactions = [],
  onEdit,
  onDelete,
  onView,
}: TransactionsListModalProps) {
  const { toast } = useToast();
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">(
    "date",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Memoize transactions to prevent unnecessary re-renders
  const memoizedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions;
  }, [JSON.stringify(transactions)]);

  useEffect(() => {
    if (!memoizedTransactions || memoizedTransactions.length === 0) {
      setFilteredTransactions([]);
      return;
    }

    let filtered = [...memoizedTransactions];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === typeFilter,
      );
    }

    // Filtro por categoria
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.category === categoryFilter,
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredTransactions(filtered);
  }, [
    memoizedTransactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (field: "date" | "amount" | "description") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(transactions.map((t) => t.category))];
    return categories.sort();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getTotalIncome = () => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lista de Transações
            <Badge variant="secondary" className="ml-2">
              {filteredTransactions.length} transação(ões)
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Filtros e Busca */}
        <div className="px-6 pb-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value: "all" | "income" | "expense") =>
                setTypeFilter(value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
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
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Receitas</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(getTotalIncome())}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Despesas</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(getTotalExpense())}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Saldo</div>
              <div
                className={`text-lg font-semibold ${
                  getBalance() >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(getBalance())}
              </div>
            </div>
          </div>
        </div>

        {/* Cabeçalho da Tabela */}
        <div className="px-6 py-2 border-t border-b bg-muted/30">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("description")}
                className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
              >
                Descrição
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="col-span-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("amount")}
                className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
              >
                Valor
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("date")}
                className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
              >
                Data
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="col-span-2 text-center">Ações</div>
          </div>
        </div>

        {/* Lista de Transacoes */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-2 pb-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  Nenhuma transacao encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou adicionar novas transacoes
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-12 gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="font-medium">{transaction.description}</div>
                    {transaction.notes && (
                      <div className="text-sm text-muted-foreground truncate">
                        {transaction.notes}
                      </div>
                    )}
                    {transaction.tags && transaction.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {transaction.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={`tag-${tag}-${index}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {transaction.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{transaction.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <div
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Badge variant="secondary">{transaction.category}</Badge>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.date)}
                    </div>
                    {transaction.account && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.account}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-center gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              "Tem certeza que deseja excluir esta transação?",
                            )
                          ) {
                            onDelete(transaction.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          <div className="flex justify-end">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionsListModal;
