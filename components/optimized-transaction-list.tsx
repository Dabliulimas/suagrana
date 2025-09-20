"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
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
} from "./ui/alert-dialog";
import { type Transaction } from "../lib/data-layer/types";
import { toast } from "sonner";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import { AddTransactionModal } from "./modals/transactions/add-transaction-modal";
import {
  useOptimizedFilters,
  useOptimizedPagination,
} from "../hooks/use-optimized-storage";
import { useOptimizedDebounce } from "./optimized-page-transition";
import { useTransactions, useAccounts } from "../contexts/unified-context";

interface OptimizedTransactionListProps {
  onUpdate?: () => void;
  preloadedTransactions?: Transaction[];
  loading?: boolean;
}

// Componente memoizado para item de transação
const TransactionItem = React.memo<{
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}>(({ transaction, onEdit, onDelete }) => {
  const isIncome = transaction.type === "income";
  const isShared = transaction.type === "shared";
  const isExpense = transaction.type === "expense";

  const handleEdit = useCallback(() => {
    onEdit(transaction);
  }, [transaction, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(transaction.id);
  }, [transaction.id, onDelete]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mobile-padding p-2 sm:p-4 border-b hover:bg-muted/50 transition-colors mobile-card touch-feedback touch-manipulation">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 mb-2 sm:mb-0">
        <div
          className={`p-2 rounded-full touch-target ${
            isIncome
              ? "bg-green-100 text-green-600"
              : isShared
                ? "bg-blue-100 text-blue-600"
                : "bg-red-100 text-red-600"
          }`}
        >
          {isIncome ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : isShared ? (
            <Users className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <p className="font-medium text-sm sm:text-base truncate mobile-title">
              {transaction.description}
            </p>
            {transaction.tripId && (
              <Badge variant="outline" className="text-xs w-fit">
                Viagem
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="mobile-subtitle">{transaction.category}</span>
            <span className="mobile-subtitle hidden sm:inline">
              {transaction.account}
            </span>
            <span className="mobile-subtitle">
              {new Date(transaction.date).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
        <div className="text-left sm:text-right">
          <p
            className={`font-semibold text-sm sm:text-base ${
              isIncome ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIncome ? "+" : "-"}R${" "}
            {Math.abs(transaction.amount).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          {transaction.type === "shared" && transaction.sharedWith && (
            <p className="text-xs text-muted-foreground">
              Compartilhado com {transaction.sharedWith.length} pessoa(s)
            </p>
          )}
          <p className="text-xs text-muted-foreground sm:hidden">
            {transaction.account}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 touch-target btn-touch touch-feedback"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 touch-target btn-touch touch-feedback"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mobile-modal">
              <AlertDialogHeader>
                <AlertDialogTitle className="mobile-title">
                  Excluir transação
                </AlertDialogTitle>
                <AlertDialogDescription className="mobile-subtitle">
                  Tem certeza que deseja excluir esta transação? Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="btn-touch touch-feedback">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 btn-touch touch-feedback"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
});
TransactionItem.displayName = "TransactionItem";

// Componente memoizado para filtros
const TransactionFilters = React.memo<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onTypeChange: (value: string) => void;
  filterCategory: string;
  onCategoryChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  categories: string[];
}>(
  ({
    searchTerm,
    onSearchChange,
    filterType,
    onTypeChange,
    filterCategory,
    onCategoryChange,
    showFilters,
    onToggleFilters,
    categories,
  }) => (
    <Card className="mobile-card">
      <CardHeader className="mobile-padding">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 mobile-title">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="mobile-padding">
        <div className="mobile-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium mobile-subtitle">
              Buscar
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descrição, categoria..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 mobile-input touch-target"
                />
              </div>
              <Button
                onClick={onToggleFilters}
                variant={showFilters ? "default" : "outline"}
                className="btn-touch touch-target"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mobile-subtitle">Tipo</label>
            <Select value={filterType} onValueChange={onTypeChange}>
              <SelectTrigger className="mobile-input touch-target">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent className="mobile-modal">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
                <SelectItem value="shared">Compartilhadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mobile-subtitle">
              Categoria
            </label>
            <Select value={filterCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="mobile-input touch-target">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="mobile-modal">
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mobile-subtitle">
              Filtros de Data
            </label>
            <Button
              onClick={onToggleFilters}
              variant={showFilters ? "default" : "outline"}
              className="w-full mobile-input touch-target justify-start"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar Filtros" : "Filtros de Data"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
);
TransactionFilters.displayName = "TransactionFilters";

// Componente memoizado para paginação
const PaginationControls = React.memo<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}>(({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mobile-padding">
      <p className="text-sm text-muted-foreground mobile-subtitle text-center sm:text-left">
        Mostrando {startItem} a {endItem} de {totalItems} transações
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-touch touch-target"
        >
          Anterior
        </Button>

        <span className="text-sm mobile-subtitle px-2">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-touch touch-target"
        >
          Próxima
        </Button>
      </div>
    </div>
  );
});
PaginationControls.displayName = "PaginationControls";

export function OptimizedTransactionList({
  onUpdate,
  preloadedTransactions,
  loading = false,
}: OptimizedTransactionListProps) {
  const {
    transactions,
    create,
    update,
    delete: deleteTransaction,
  } = useTransactions();
  const { accounts } = useAccounts();
  const transactions = preloadedTransactions || transactions;
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Debounce para busca
  const debouncedSearchTerm = useOptimizedDebounce(searchTerm, 300);

  // Não precisamos mais carregar transações manualmente, o contexto cuida disso

  // Função de filtro memoizada
  const filterFunction = useCallback(
    (transaction: Transaction) => {
      // Search filter
      const matchesSearch =
        !debouncedSearchTerm ||
        transaction.description
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.category
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.account
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      // Type filter
      const matchesType =
        filterType === "all" || transaction.type === filterType;

      // Category filter
      const matchesCategory =
        filterCategory === "all" || transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    },
    [debouncedSearchTerm, filterType, filterCategory],
  );

  // Usar hook otimizado para filtros
  const { filteredData: baseFilteredTransactions } = useOptimizedFilters(
    transactions,
    filterFunction,
    { searchTerm: debouncedSearchTerm, filterType, filterCategory },
  );

  // Aplicar filtros de data personalizados
  const filteredTransactions = useMemo(() => {
    return filterByPeriod(
      baseFilteredTransactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
    );
  }, [
    baseFilteredTransactions,
    selectedPeriod,
    customStartDate,
    customEndDate,
  ]);

  // Usar hook otimizado para paginação
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedTransactions,
    goToPage,
    itemsPerPage,
  } = useOptimizedPagination(filteredTransactions, 20);

  // Memoizar categorias únicas
  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  // Handlers memoizados
  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTransaction(id);
        onUpdate?.();
      } catch (error) {
        logComponents.error("Error deleting transaction:", error);
        toast.error("Erro ao excluir transação");
      }
    },
    [actions, onUpdate],
  );

  const handleModalClose = useCallback(() => {
    setShowEditModal(false);
    setEditingTransaction(null);
    onUpdate?.();
  }, [onUpdate]);

  // Memoizar handlers de filtro
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFilterType(value);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setFilterCategory(value);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 mobile-padding">
      {/* Filtros */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterType={filterType}
        onTypeChange={handleTypeChange}
        filterCategory={filterCategory}
        onCategoryChange={handleCategoryChange}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        categories={uniqueCategories}
      />

      {showFilters && (
        <CustomDateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customStartDate={customStartDate}
          onStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onEndDateChange={setCustomEndDate}
        />
      )}

      {/* Lista de Transações */}
      <Card className="mobile-card">
        <CardHeader className="mobile-padding">
          <CardTitle className="text-lg font-semibold mobile-title">
            Transações ({filteredTransactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedTransactions.length > 0 ? (
            <>
              <div className="divide-y mobile-table mobile-scroll">
                {paginatedTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="border-t">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    totalItems={filteredTransactions.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 mobile-padding">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4 mobile-subtitle">
                {transactions.length === 0
                  ? "Nenhuma transação encontrada"
                  : "Nenhuma transação corresponde aos filtros selecionados"}
              </p>
              <Button
                onClick={() => setShowEditModal(true)}
                className="btn-touch touch-target"
              >
                Adicionar primeira transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <AddTransactionModal
        open={showEditModal}
        onOpenChange={(open) => !open && handleModalClose()}
      />
    </div>
  );
}
