"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTransactions } from "../contexts/unified-context";
import { Transaction } from "../lib/types";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionListFixedProps {
  height?: number;
  itemHeight?: number;
  className?: string;
}

interface FilterState {
  search: string;
  type: "all" | "income" | "expense";
  category: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const TransactionListFixed: React.FC<TransactionListFixedProps> = ({
  height = 600,
  itemHeight = 80,
  className = "",
}) => {
  const { transactions, isLoading: loading, error } = useTransactions();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    category: "",
    dateRange: {
      start: null,
      end: null,
    },
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filtrar transações baseado nos filtros aplicados
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction) => {
      // Filtro de busca por descrição
      if (
        filters.search &&
        !transaction.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Filtro por tipo
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Filtro por categoria
      if (filters.category && filters.category !== "all" && transaction.category !== filters.category) {
        return false;
      }

      // Filtro por data
      if (
        filters.dateRange.start &&
        new Date(transaction.date) < filters.dateRange.start
      ) {
        return false;
      }
      if (
        filters.dateRange.end &&
        new Date(transaction.date) > filters.dateRange.end
      ) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Obter categorias únicas para o filtro
  const categories = useMemo(() => {
    if (!transactions) return [];
    const uniqueCategories = [...new Set(transactions.map((t) => t.category))];
    return uniqueCategories.filter(Boolean);
  }, [transactions]);

  // Componente de item da lista
  const TransactionItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const transaction = filteredTransactions[index];

      if (!transaction) {
        return (
          <div style={style} className="p-4">
            <div className="animate-pulse bg-gray-200 h-16 rounded"></div>
          </div>
        );
      }

      const isIncome = transaction.type === "income";
      const formattedDate = format(new Date(transaction.date), "dd/MM/yyyy", {
        locale: ptBR,
      });
      const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Math.abs(transaction.amount));

      return (
        <div style={style} className="p-2">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardContent className="p-4 h-full flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div
                  className={`p-2 rounded-full ${
                    isIncome
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {isIncome ? (
                    <TrendingUp size={20} />
                  ) : (
                    <TrendingDown size={20} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {transaction.description}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {formattedDate}
                    </span>
                    {transaction.category && (
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`font-semibold text-lg ${
                    isIncome ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formattedAmount}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    },
    [filteredTransactions],
  );

  // Handlers para filtros
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleTypeChange = useCallback((type: FilterState["type"]) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setFilters((prev) => ({ ...prev, category: category === "all" ? "" : category }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      type: "all",
      category: "",
      dateRange: {
        start: null,
        end: null,
      },
    });
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <DollarSign size={48} className="mx-auto mb-2" />
          <p className="text-lg font-medium">Erro ao carregar transações</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de busca e filtros */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Buscar transações..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2"
          >
            <Filter size={16} />
            <span>Filtros</span>
          </Button>
        </div>

        {/* Painel de filtros */}
        {isFilterOpen && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { value: "all", label: "Todos" },
                      { value: "income", label: "Receitas" },
                      { value: "expense", label: "Despesas" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          filters.type === option.value ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleTypeChange(option.value as FilterState["type"])
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filtro por categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <Select
                    value={filters.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão para limpar filtros */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Transações</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.length}
                </p>
              </div>
              <DollarSign className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    filteredTransactions.filter((t) => t.type === "income")
                      .length
                  }
                </p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    filteredTransactions.filter((t) => t.type === "expense")
                      .length
                  }
                </p>
              </div>
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista virtualizada */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma transação encontrada
            </h3>
            <p className="text-gray-500">
              {filters.search || filters.type !== "all" || filters.category
                ? "Tente ajustar os filtros para ver mais resultados."
                : "Adicione sua primeira transação para começar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTransactions.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id}
                  index={index}
                  style={{}}
                  data={filteredTransactions}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export { TransactionListFixed };
export default TransactionListFixed;
