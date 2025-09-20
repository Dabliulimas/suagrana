"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Search,
  Clock,
  TrendingUp,
  User,
  Calendar,
  DollarSign,
  Target,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  id: string;
  type: "transaction" | "investment" | "goal" | "contact" | "category";
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  category?: string;
  icon: React.ReactNode;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}

export function GlobalSearch({ isOpen, onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Carregar pesquisas recentes do localStorage
    const saved = localStorage.getItem("recent-searches");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);

    try {
      // Simular busca - em um app real, isso seria uma chamada à API
      await new Promise((resolve) => setTimeout(resolve, 300));

      const mockResults: SearchResult[] = [];

      // Filtrar resultados baseado na query
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setResults(filtered);
    } catch (error) {
      toast.error("Erro ao realizar busca");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    // Adicionar à lista de pesquisas recentes
    const newRecentSearches = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem("recent-searches", JSON.stringify(newRecentSearches));

    onSelect?.(result);
    onClose();
    setQuery("");
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      transaction: "Transacao",
      investment: "Investimento",
      goal: "Meta",
      contact: "Contato",
      category: "Categoria",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      transaction: "bg-blue-100 text-blue-800",
      investment: "bg-green-100 text-green-800",
      goal: "bg-purple-100 text-purple-800",
      contact: "bg-orange-100 text-orange-800",
      category: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar transacoes, investimentos, metas..."
            className="border-0 focus-visible:ring-0 text-lg"
          />
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.length <= 2 && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Pesquisas Recentes
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={`recent-search-${search}-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearch(search)}
                    className="text-xs"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0">{result.icon}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {result.title}
                      </span>
                      <Badge className={`text-xs ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </Badge>
                    </div>

                    {result.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-1">
                      {result.amount && (
                        <span
                          className={`text-sm font-medium ${
                            result.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.amount > 0 ? "+" : ""}R${" "}
                          {Math.abs(result.amount).toFixed(2)}
                        </span>
                      )}

                      {result.date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.length > 2 && results.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhum resultado encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente usar termos diferentes ou verifique a ortografia
              </p>
            </div>
          )}

          {query.length <= 2 && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Busca Global</h3>
              <p className="text-sm text-muted-foreground">
                Digite pelo menos 3 caracteres para começar a buscar
              </p>
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Use ↑↓ para navegar</span>
            <span>Enter para selecionar</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearch;
