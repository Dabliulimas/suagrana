"use client";

import { useState, useEffect, useRef } from "react";
import { logComponents } from "../../lib/logger";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
// Substituindo pelos novos hooks otimizados
import { useTransactions } from "../../hooks/use-optimized-transactions";
import { useAccounts } from "../../hooks/use-optimized-accounts";
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  TrendingUp,
  Plane,
  Users,
  Clock,
  Command,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "transaction" | "goal" | "investment" | "trip" | "account";
  title: string;
  subtitle?: string;
  url: string;
  relevance: number;
  amount?: number;
  date?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Usar os novos hooks otimizados
  const { data: transactionsData } = useTransactions();
  const { data: accountsData } = useAccounts();
  
  const transactions = transactionsData?.transactions || [];
  const accounts = accountsData?.accounts || [];
  const goals: any[] = []; // TODO: Implementar hook para goals
  const investments: any[] = []; // TODO: Implementar hook para investments

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("suagrana-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        logComponents.error("Error loading recent searches:", error);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchTimeout = setTimeout(() => {
      performSearch(query);
      setIsLoading(false);
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]); // Removed data dependencies to prevent infinite loop

  const performSearch = (searchQuery: string) => {
    const searchResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    // Search transactions
    transactions.forEach((transaction) => {
      const relevance = calculateRelevance(lowerQuery, [
        transaction.description,
        transaction.category,
        transaction.amount.toString(),
      ]);

      if (relevance > 0) {
        searchResults.push({
          id: transaction.id,
          type: "transaction",
          title: transaction.description,
          subtitle: `${transaction.category} • ${transaction.type === "income" ? "+" : "-"}R$ ${Math.abs(transaction.amount).toFixed(2)}`,
          url: `/transactions?id=${transaction.id}`,
          relevance,
          amount: transaction.amount,
          date: transaction.date,
        });
      }
    });

    // Search goals
    goals.forEach((goal) => {
      const relevance = calculateRelevance(lowerQuery, [
        goal.name,
        goal.description || "",
        goal.category || "",
      ]);

      if (relevance > 0) {
        const progress = (goal.current / goal.target) * 100;
        searchResults.push({
          id: goal.id,
          type: "goal",
          title: goal.name,
          subtitle: `${progress.toFixed(1)}% concluído • R$ ${goal.current.toFixed(2)} de R$ ${goal.target.toFixed(2)}`,
          url: `/goals?id=${goal.id}`,
          relevance,
          amount: goal.target,
        });
      }
    });

    // Search investments
    investments.forEach((investment) => {
      const relevance = calculateRelevance(lowerQuery, [
        investment.name,
        investment.type,
        investment.broker || "",
      ]);

      if (relevance > 0) {
        searchResults.push({
          id: investment.id,
          type: "investment",
          title: investment.name,
          subtitle: `${investment.type} • R$ ${investment.currentValue.toFixed(2)}`,
          url: `/investments?id=${investment.id}`,
          relevance,
          amount: investment.currentValue,
        });
      }
    });

    // Search accounts
    accounts.forEach((account) => {
      const relevance = calculateRelevance(lowerQuery, [
        account.name,
        account.bank,
        account.type,
      ]);

      if (relevance > 0) {
        searchResults.push({
          id: account.id,
          type: "account",
          title: account.name,
          subtitle: `${account.bank} • R$ ${account.balance.toFixed(2)}`,
          url: `/accounts?id=${account.id}`,
          relevance,
          amount: account.balance,
        });
      }
    });

    // Sort by relevance and limit results
    const sortedResults = searchResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);

    setResults(sortedResults);
    setSelectedIndex(0);
  };

  const calculateRelevance = (query: string, fields: string[]): number => {
    let relevance = 0;

    fields.forEach((field) => {
      const fieldLower = field.toLowerCase();

      // Exact match gets highest score
      if (fieldLower === query) {
        relevance += 100;
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(query)) {
        relevance += 80;
      }
      // Contains query gets medium score
      else if (fieldLower.includes(query)) {
        relevance += 50;
      }
      // Fuzzy match gets low score
      else if (fuzzyMatch(fieldLower, query)) {
        relevance += 20;
      }
    });

    return relevance;
  };

  const fuzzyMatch = (text: string, query: string): boolean => {
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Add to recent searches
    const newRecentSearches = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem(
      "suagrana-recent-searches",
      JSON.stringify(newRecentSearches),
    );

    // Navigate to result
    router.push(result.url);
    onClose();
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "transaction":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "goal":
        return <Target className="w-4 h-4 text-orange-600" />;
      case "investment":
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case "trip":
        return <Plane className="w-4 h-4 text-purple-600" />;
      case "account":
        return <Users className="w-4 h-4 text-gray-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "transaction":
        return "Transação";
      case "goal":
        return "Meta";
      case "investment":
        return "Investimento";
      case "trip":
        return "Viagem";
      case "account":
        return "Conta";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <div className="flex flex-col max-h-[80vh]">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              placeholder="Buscar transações, metas, investimentos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 text-lg"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {query.trim().length < 2 ? (
              // Recent Searches
              <div className="p-4">
                {recentSearches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Buscas Recentes
                    </h3>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Dicas de Busca
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      • Digite o nome de uma transação, meta ou investimento
                    </p>
                    <p>• Busque por categoria: "alimentação", "transporte"</p>
                    <p>• Procure por valores: "150", "1000"</p>
                    <p>
                      • Use as setas ↑↓ para navegar e Enter para selecionar
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Search Results
              <div className="p-2">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p>Buscando...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum resultado encontrado</p>
                    <p className="text-sm mt-1">Tente usar termos diferentes</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={`w-full text-left p-3 rounded-md transition-colors ${
                          index === selectedIndex
                            ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {result.title}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {getTypeLabel(result.type)}
                              </Badge>
                            </div>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded">
                    ↑↓
                  </kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded">
                    ↵
                  </kbd>
                  selecionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border rounded">
                    esc
                  </kbd>
                  fechar
                </span>
              </div>
              {results.length > 0 && (
                <span>
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
