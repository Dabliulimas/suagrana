"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  DollarSign,
  Plus,
  Calendar,
  Receipt,
  Plane,
  Filter,
} from "lucide-react";
import { type Trip } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { Transaction } from "../lib/data-layer/types";
import { storage } from "../lib/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

import { useGlobalModal } from "../contexts/ui/global-modal-context";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import { SharedDebtsDisplay } from "./shared-debts-display";

export function SharedExpenses() {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const { openSharedExpenseModal } = useGlobalModal();
  const [sharedTransactions, setSharedTransactions] = useState<Transaction[]>(
    [],
  );
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // Use unified contact system
  const { contacts } = useContacts();

  useEffect(() => {
    loadData();
  }, [transactions]); // Dependência do transactions

  const loadData = () => {
    try {
      // Usar contexto unificado - converter tipos se necessário
      const sharedOnly = transactions
        .filter((t) => t.type === "shared")
        .map((t) => ({
          ...t,
          account: t.accountId || "default", // Converter accountId para account para compatibilidade
        })) as Transaction[];
      setSharedTransactions(sharedOnly);

      // Trips ainda vêm do storage local
      setTrips(storage.getTrips() || []);
    } catch (error) {
      logComponents.error("Error loading shared expenses:", error);
      setSharedTransactions([]);
      setTrips([]);
    }
  };

  // Filter transactions based on selected period
  const getFilteredTransactions = (transactions: Transaction[]) => {
    return filterByPeriod(
      transactions,
      selectedPeriod,
      customStartDate,
      customEndDate,
    );
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const filteredSharedTransactions =
    getFilteredTransactions(sharedTransactions);
  const currentMonthExpenses = sharedTransactions.filter((t) =>
    t.date.startsWith(currentMonth),
  );

  // Separate regular and trip shared expenses (filtered)
  const regularSharedTransactions = filteredSharedTransactions.filter(
    (t) => !t.tripId,
  );
  const tripSharedTransactions = filteredSharedTransactions.filter(
    (t) => t.tripId,
  );

  // Current month data (unfiltered for comparison)
  const totalRegularSharedFiltered = regularSharedTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const totalTripSharedFiltered = tripSharedTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const totalSharedThisMonth = currentMonthExpenses.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );

  const getContactName = (identifier: string) => {
    // Primeiro, tenta encontrar por ID (novo formato)
    const byId = contacts.find((c) => c.id === identifier);
    if (byId) return byId.name;

    // Depois, tenta encontrar por nome (formato antigo)
    const byName = contacts.find(
      (c) => c.name.toLowerCase() === identifier.toLowerCase(),
    );
    if (byName) return byName.name;

    // Por último, tenta encontrar por email (formato antigo)
    const byEmail = contacts.find(
      (c) =>
        c.email === identifier ||
        (identifier.includes("@") &&
          c.name
            .toLowerCase()
            .includes(identifier.split("@")[0].toLowerCase())),
    );
    if (byEmail) return byEmail.name;

    // Se não encontrar, retorna o identificador original
    return identifier;
  };

  const getContactInitials = (identifier: string) => {
    // Primeiro, tenta encontrar por ID (novo formato)
    const byId = contacts.find((c) => c.id === identifier);
    if (byId) {
      return byId.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    // Depois, tenta encontrar por nome (formato antigo)
    const byName = contacts.find(
      (c) => c.name.toLowerCase() === identifier.toLowerCase(),
    );
    if (byName) {
      return byName.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    // Por último, tenta encontrar por email (formato antigo)
    const byEmail = contacts.find(
      (c) =>
        c.email === identifier ||
        (identifier.includes("@") &&
          c.name
            .toLowerCase()
            .includes(identifier.split("@")[0].toLowerCase())),
    );
    if (byEmail) {
      return byEmail.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    // Se não encontrar, usa o identificador original
    return identifier
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTripName = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    return trip ? trip.name : "Viagem Desconhecida";
  };

  const getMyShare = (transaction: Transaction) => {
    if (!transaction.sharedWith) return Math.abs(transaction.amount);
    const totalParticipants = transaction.sharedWith.length + 1;
    return Math.abs(transaction.amount) / totalParticipants;
  };

  const createGroupedByContact = (transactions: Transaction[]) =>
    transactions.reduce(
      (acc: Record<string, any>, transaction: Transaction) => {
        if (!transaction.sharedWith) return acc;

        transaction.sharedWith.forEach((identifier) => {
          if (!acc[identifier]) {
            acc[identifier] = {
              email: identifier,
              name: getContactName(identifier),
              transactions: [],
              totalOwed: 0,
              totalTransactions: 0,
            };
          }

          const amountOwed = getMyShare(transaction);
          acc[identifier].transactions.push(transaction);
          acc[identifier].totalOwed += amountOwed;
          acc[identifier].totalTransactions += 1;
        });

        return acc;
      },
      {},
    );

  const regularGroupedByContact = createGroupedByContact(
    regularSharedTransactions,
  );
  const tripGroupedByContact = createGroupedByContact(tripSharedTransactions);

  const regularContactSummaries = Object.values(regularGroupedByContact).sort(
    (a: any, b: any) => b.totalOwed - a.totalOwed,
  );
  const tripContactSummaries = Object.values(tripGroupedByContact).sort(
    (a: any, b: any) => b.totalOwed - a.totalOwed,
  );

  const getFilterDescription = () => {
    switch (selectedPeriod) {
      case "all":
        return "Todos os períodos";
      case "thisMonth":
        return "Este mês";
      case "lastMonth":
        return "Mês passado";
      case "thisYear":
        return "Este ano";
      case "lastYear":
        return "Ano passado";
      case "custom":
        if (customStartDate && customEndDate) {
          return `${customStartDate.toLocaleDateString("pt-BR")} - ${customEndDate.toLocaleDateString("pt-BR")}`;
        }
        return "Período personalizado";
      default:
        return "Todos os períodos";
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground dark:text-white">
            Despesas Compartilhadas
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros de Data
            </Button>
            <Button
              onClick={() => openSharedExpenseModal()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <CustomDateFilter
                selectedPeriod={selectedPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onPeriodChange={setSelectedPeriod}
                onCustomStartDateChange={setCustomStartDate}
                onCustomEndDateChange={setCustomEndDate}
              />
            </CardContent>
          </Card>
        )}

        <div className="text-sm text-muted-foreground mb-4">
          Mostrando dados para:{" "}
          <span className="font-medium">{getFilterDescription()}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                Total Compartilhado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground dark:text-white">
                R${" "}
                {(
                  totalRegularSharedFiltered + totalTripSharedFiltered
                ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredSharedTransactions.length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                Despesas Regulares
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground dark:text-white">
                R${" "}
                {totalRegularSharedFiltered.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {regularSharedTransactions.length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                Despesas de Viagem
              </CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground dark:text-white">
                R${" "}
                {totalTripSharedFiltered.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {tripSharedTransactions.length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                Este Mês
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground dark:text-white">
                R${" "}
                {totalSharedThisMonth.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentMonthExpenses.length} transações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shared Debts Display */}
        <SharedDebtsDisplay />

        {/* Tabs for Regular and Trip Expenses */}
        <Tabs defaultValue="regular" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regular">Despesas Regulares</TabsTrigger>
            <TabsTrigger value="trips">Despesas de Viagem</TabsTrigger>
          </TabsList>

          <TabsContent value="regular" className="space-y-4">
            {regularContactSummaries.length > 0 ? (
              <div className="grid gap-4">
                {regularContactSummaries.map((contact: any) => (
                  <Card key={contact.email}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getContactInitials(contact.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground dark:text-white">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground dark:text-white">
                            R${" "}
                            {contact.totalOwed.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contact.totalTransactions} transações
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {contact.transactions
                          .slice(0, 3)
                          .map((transaction: Transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-foreground dark:text-white">
                                  {transaction.description}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-foreground dark:text-white">
                                R${" "}
                                {getMyShare(transaction).toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </div>
                            </div>
                          ))}
                        {contact.transactions.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{contact.transactions.length - 3} transações
                            adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    Nenhuma despesa regular compartilhada
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece adicionando despesas compartilhadas com familiares ou
                    amigos.
                  </p>
                  <Button onClick={() => openSharedExpenseModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Despesa
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            {tripContactSummaries.length > 0 ? (
              <div className="grid gap-4">
                {tripContactSummaries.map((contact: any) => (
                  <Card key={contact.email}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getContactInitials(contact.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground dark:text-white">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {contact.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground dark:text-white">
                            R${" "}
                            {contact.totalOwed.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contact.totalTransactions} transações
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {contact.transactions
                          .slice(0, 3)
                          .map((transaction: Transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Plane className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {getTripName(transaction.tripId!)}
                                  </span>
                                </div>
                                <span className="text-sm text-foreground dark:text-white">
                                  {transaction.description}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-foreground dark:text-white">
                                R${" "}
                                {getMyShare(transaction).toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </div>
                            </div>
                          ))}
                        {contact.transactions.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{contact.transactions.length - 3} transações
                            adicionais
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    Nenhuma despesa de viagem compartilhada
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Adicione despesas compartilhadas durante suas viagens.
                  </p>
                  <Button onClick={() => openSharedExpenseModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Despesa de Viagem
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
