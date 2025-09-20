"use client";

import { useState, useEffect, useMemo } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
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
} from "../../ui/alert-dialog";
import { type Transaction } from "../../../lib/storage";
import { toast } from "sonner";
import { EnhancedTransactionModal } from "./enhanced-transaction-modal";
import { useTransactions } from "../../../contexts/unified-context";
import {
  CustomDateFilter,
  filterByPeriod,
} from "../../ui/custom-date-filter";

interface TransactionListProps {
  onUpdate?: () => void;
}

export function TransactionList({ onUpdate }: TransactionListProps) {
  const { transactions, update, delete: deleteTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filtrar transações por período usando a função filterByPeriod
  const periodFilteredTransactions = useMemo(() => {
    return filterByPeriod(
      transactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
    );
  }, [transactions, selectedPeriod, customStartDate, customEndDate]);

  const filteredTransactions = useMemo(() => {
    return periodFilteredTransactions
      .filter((transaction) => {
        // Search filter
        const matchesSearch =
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.category
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.account.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter
        const matchesType =
          filterType === "all" || transaction.type === filterType;

        // Category filter
        const matchesCategory =
          filterCategory === "all" || transaction.category === filterCategory;

        // Legacy period filter (mantido para compatibilidade)
        let matchesPeriod = true;
        if (filterPeriod !== "all") {
          const transactionDate = new Date(transaction.date);
          const now = new Date();

          switch (filterPeriod) {
            case "current-month":
              matchesPeriod =
                transactionDate.getMonth() === now.getMonth() &&
                transactionDate.getFullYear() === now.getFullYear();
              break;
            case "last-month":
              const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
              matchesPeriod =
                transactionDate.getMonth() === lastMonth.getMonth() &&
                transactionDate.getFullYear() === lastMonth.getFullYear();
              break;
            case "current-year":
              matchesPeriod =
                transactionDate.getFullYear() === now.getFullYear();
              break;
            case "last-30-days":
              const thirtyDaysAgo = new Date(
                now.getTime() - 30 * 24 * 60 * 60 * 1000,
              );
              matchesPeriod = transactionDate >= thirtyDaysAgo;
              break;
          }
        }

        // Custom date range filter (overrides period if provided)
        let matchesCustomRange = true;
        if (startDate || endDate) {
          const txDate = new Date(transaction.date);
          if (startDate) {
            const sd = new Date(startDate);
            sd.setHours(0, 0, 0, 0);
            if (txDate < sd) matchesCustomRange = false;
          }
          if (endDate) {
            const ed = new Date(endDate);
            ed.setHours(23, 59, 59, 999);
            if (txDate > ed) matchesCustomRange = false;
          }
        }

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesPeriod &&
          matchesCustomRange
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    periodFilteredTransactions,
    searchTerm,
    filterType,
    filterCategory,
    filterPeriod,
    startDate,
    endDate,
  ]);

  const categories = useMemo(() => {
    // categorias vindas das transações
    const fromTransactions = new Set(transactions.map((t) => t.category));
    // categorias persistidas no localStorage (se existirem)
    try {
      const saved = localStorage.getItem("categories");
      if (typeof window === "undefined") return;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: any) => {
            if (c?.name) fromTransactions.add(c.name);
          });
        }
      }
    } catch {}
    return Array.from(fromTransactions).sort();
  }, [transactions]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      onUpdate?.();
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      logComponents.error("Error deleting transaction:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    onUpdate?.();
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "income":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "shared":
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    }
  };

  const getTransactionBadge = (type: Transaction["type"]) => {
    switch (type) {
      case "income":
        return <Badge className="bg-green-100 text-green-800">Receita</Badge>;
      case "shared":
        return (
          <Badge className="bg-blue-100 text-blue-800">Compartilhada</Badge>
        );
      default:
        return <Badge variant="destructive">Despesa</Badge>;
    }
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="space-y-4 sm:space-y-6 mobile-padding">
      {/* Summary Cards */}
      <div className="mobile-grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-subtitle">
              Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-green-600 mobile-title">
              R${" "}
              {totalIncome.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter((t) => t.type === "income").length}{" "}
              transações
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-subtitle">
              Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div className="text-xl sm:text-2xl font-bold text-red-600 mobile-title">
              R${" "}
              {totalExpenses.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                filteredTransactions.filter(
                  (t) => t.type === "expense" || t.type === "shared",
                ).length
              }{" "}
              transações
            </p>
          </CardContent>
        </Card>

        <Card className="mobile-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 mobile-padding">
            <CardTitle className="text-sm font-medium mobile-subtitle">
              Saldo
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="mobile-padding">
            <div
              className={`text-xl sm:text-2xl font-bold mobile-title ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.length} transações total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mobile-card">
        <CardHeader className="mobile-padding">
          <CardTitle className="flex items-center gap-2 mobile-subtitle">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-padding">
          <div className="mobile-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 mobile-input"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="mobile-input">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="shared">Compartilhadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="mobile-input">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories
                  .filter((category) => category && category.trim() !== "")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mobile-input flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Filtros de Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Date Filter */}
      {showFilters && (
        <CustomDateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customStartDate={
            customStartDate ? new Date(customStartDate) : undefined
          }
          customEndDate={customEndDate ? new Date(customEndDate) : undefined}
          onCustomStartDateChange={(date) =>
            setCustomStartDate(date ? date.toISOString().split("T")[0] : "")
          }
          onCustomEndDateChange={(date) =>
            setCustomEndDate(date ? date.toISOString().split("T")[0] : "")
          }
        />
      )}

      {/* Transactions */}
      <Card className="mobile-card">
        <CardHeader className="mobile-padding">
          <CardTitle className="mobile-subtitle">
            Transações ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="mobile-padding">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            {getTransactionBadge(transaction.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {transaction.description}
                            </p>
                            {transaction.notes && (
                              <p className="text-sm text-gray-500">
                                {transaction.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.account}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(transaction.date).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              transaction.type === "income"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "income" ? "+" : "-"}R${" "}
                            {Math.abs(transaction.amount).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                          </span>
                          {transaction.installments &&
                            transaction.currentInstallment && (
                              <p className="text-xs text-gray-500">
                                {transaction.currentInstallment}/
                                {transaction.installments}
                              </p>
                            )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirmar exclusão
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta
                                    transação? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(transaction.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {filteredTransactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="mobile-card border-l-4 border-l-blue-500"
                  >
                    <CardContent className="mobile-padding">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          {getTransactionBadge(transaction.type)}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mobile-dialog">
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmar exclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta transação?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(transaction.id)}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-sm mobile-text">
                            {transaction.description}
                          </p>
                          {transaction.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {transaction.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>{transaction.category}</span>
                          <span>{transaction.account}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(transaction.date).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-semibold text-sm ${
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}R${" "}
                              {Math.abs(transaction.amount).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 },
                              )}
                            </span>
                            {transaction.installments &&
                              transaction.currentInstallment && (
                                <p className="text-xs text-gray-500">
                                  {transaction.currentInstallment}/
                                  {transaction.installments}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showEditModal && (
        <EnhancedTransactionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onSave={async (updatedTransaction) => {
            if (editingTransaction?.id) {
              await update(editingTransaction.id, updatedTransaction);
              handleEditSave();
              toast.success('Transação atualizada com sucesso!');
            }
          }}
          transaction={editingTransaction || undefined}
          categories={categories}
        />
      )}
    </div>
  );
}

export default TransactionList;
