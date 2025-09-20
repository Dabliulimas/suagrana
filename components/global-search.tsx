"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Search,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Plane,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { storage } from "../lib/storage/storage";
import type { Transaction, Goal, Investment, Trip, Contact } from "../types";

interface SearchResult {
  id: string;
  type: "transaction" | "goal" | "investment" | "trip" | "contact";
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  category?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all data for search
  const searchData = useMemo(() => {
    if (!open)
      return {
        transactions: [],
        goals: [],
        investments: [],
        trips: [],
        contacts: [],
      };

    const transactions = transactions || [];
    const goals = goals || [];
    const investments = storage.getInvestments() || [];
    const trips = storage.getTrips() || [];
    const contacts = contacts || [];

    return {
      transactions,
      goals,
      investments,
      trips,
      contacts,
    };
  }, [open]);

  // Search function
  const performSearch = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search transactions
    searchData.transactions.forEach((transaction) => {
      if (
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm) ||
        transaction.account?.toLowerCase().includes(searchTerm) ||
        transaction.notes?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: transaction.id,
          type: "transaction",
          title: transaction.description,
          subtitle: `${transaction.category} • ${new Date(transaction.date).toLocaleDateString("pt-BR")}`,
          amount: transaction.amount,
          date: transaction.date,
          category: transaction.category,
          icon: <DollarSign className="w-4 h-4" />,
          action: () => {
            // Navigate to transactions with filter
            window.location.href = `/transactions?search=${encodeURIComponent(transaction.description)}`;
            onOpenChange(false);
          },
        });
      }
    });

    // Search goals
    searchData.goals.forEach((goal) => {
      if (
        goal.name.toLowerCase().includes(searchTerm) ||
        goal.description?.toLowerCase().includes(searchTerm) ||
        goal.category.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: goal.id,
          type: "goal",
          title: goal.name,
          subtitle: `Meta: R$ ${goal.target.toLocaleString("pt-BR")} • ${((goal.current / goal.target) * 100).toFixed(1)}% concluída`,
          amount: goal.target,
          category: goal.category,
          icon: <Target className="w-4 h-4" />,
          action: () => {
            window.location.href = `/goals?highlight=${goal.id}`;
            onOpenChange(false);
          },
        });
      }
    });

    // Search investments
    searchData.investments.forEach((investment) => {
      if (
        investment.name.toLowerCase().includes(searchTerm) ||
        investment.ticker?.toLowerCase().includes(searchTerm) ||
        investment.sector?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: investment.id,
          type: "investment",
          title: investment.ticker
            ? `${investment.ticker} - ${investment.name}`
            : investment.name,
          subtitle: `${investment.type} • ${investment.quantity} unidades • R$ ${investment.price.toFixed(2)}`,
          amount: investment.totalValue,
          date: investment.date,
          icon: <TrendingUp className="w-4 h-4" />,
          action: () => {
            window.location.href = `/investments?highlight=${investment.id}`;
            onOpenChange(false);
          },
        });
      }
    });

    // Search trips
    searchData.trips.forEach((trip) => {
      if (
        trip.name.toLowerCase().includes(searchTerm) ||
        trip.destination.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: trip.id,
          type: "trip",
          title: trip.name,
          subtitle: `${trip.destination} • ${new Date(trip.startDate).toLocaleDateString("pt-BR")} - ${new Date(trip.endDate).toLocaleDateString("pt-BR")}`,
          amount: trip.budget,
          date: trip.startDate,
          icon: <Plane className="w-4 h-4" />,
          action: () => {
            window.location.href = `/travel/${trip.id}`;
            onOpenChange(false);
          },
        });
      }
    });

    // Search contacts
    searchData.contacts.forEach((contact) => {
      if (
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm) ||
        contact.phone?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: contact.id,
          type: "contact",
          title: contact.name,
          subtitle: contact.email || contact.phone || "Contato",
          icon: <Users className="w-4 h-4" />,
          action: () => {
            window.location.href = `/contacts?highlight=${contact.id}`;
            onOpenChange(false);
          },
        });
      }
    });

    // Sort results by relevance (exact matches first, then partial matches)
    return results
      .sort((a, b) => {
        const aExact = a.title.toLowerCase() === searchTerm;
        const bExact = b.title.toLowerCase() === searchTerm;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Sort by date for transactions and trips
        if (a.date && b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }

        return a.title.localeCompare(b.title);
      })
      .slice(0, 20); // Limit to 20 results
  }, [query, searchData]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setResults(performSearch);
      setIsLoading(false);
    }, 200); // Debounce search

    return () => clearTimeout(timer);
  }, [performSearch]);

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "transaction":
        return "bg-blue-100 text-blue-800";
      case "goal":
        return "bg-green-100 text-green-800";
      case "investment":
        return "bg-purple-100 text-purple-800";
      case "trip":
        return "bg-orange-100 text-orange-800";
      case "contact":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeName = (type: SearchResult["type"]) => {
    switch (type) {
      case "transaction":
        return "Transação";
      case "goal":
        return "Meta";
      case "investment":
        return "Investimento";
      case "trip":
        return "Viagem";
      case "contact":
        return "Contato";
      default:
        return "Item";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Busca Global
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar transacoes, metas, investimentos, viagens..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading && (
              <div className="text-center py-8 text-gray-500">Buscando...</div>
            )}

            {!isLoading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum resultado encontrado para "{query}"</p>
                <p className="text-sm">Tente usar termos diferentes</p>
              </div>
            )}

            {!isLoading && query.length < 2 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Digite pelo menos 2 caracteres para buscar</p>
                <p className="text-sm">
                  Busque por transacoes, metas, investimentos e mais
                </p>
              </div>
            )}

            {!isLoading &&
              results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-gray-50"
                  onClick={result.action}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center gap-2">
                      {result.icon}
                      <Badge
                        variant="outline"
                        className={getTypeColor(result.type)}
                      >
                        {getTypeName(result.type)}
                      </Badge>
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    </div>

                    {result.amount && (
                      <div className="text-right">
                        <p className="font-semibold">
                          R${" "}
                          {Math.abs(result.amount).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    )}

                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Button>
              ))}
          </div>

          {results.length > 0 && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              {results.length} resultado{results.length !== 1 ? "s" : ""}{" "}
              encontrado{results.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
