"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  DollarSign,
  Plus,
  Calendar,
  Receipt,
  Plane,
} from "lucide-react";
import { type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

export function SharedExpensesSimple() {
  const [sharedTransactions, setSharedTransactions] = useState<Transaction[]>(
    [],
  );
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ id: string; name: string; color?: string }>
  >([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const allTransactions = transactions || [];
      const sharedOnly = allTransactions.filter((t) => t.type === "shared");
      setSharedTransactions(sharedOnly);

      try {
        const saved = localStorage.getItem("familyMembers");
        if (typeof window === "undefined") return;
        const parsed = saved ? JSON.parse(saved) : [];
        const members = Array.isArray(parsed)
          ? parsed.map((m: any) => ({ id: m.id, name: m.name, color: m.color }))
          : [];
        setFamilyMembers(members);
      } catch {
        setFamilyMembers([]);
      }
    } catch (error) {
      logComponents.error("Error loading shared expenses:", error);
      setSharedTransactions([]);
      setFamilyMembers([]);
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = sharedTransactions.filter((t) =>
    t.date.startsWith(currentMonth),
  );

  const regularSharedTransactions = sharedTransactions.filter((t) => !t.tripId);
  const tripSharedTransactions = sharedTransactions.filter((t) => t.tripId);

  const totalRegularShared = regularSharedTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const totalTripShared = tripSharedTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );
  const totalSharedThisMonth = currentMonthExpenses.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0,
  );

  const getContactName = (identifier: string) => {
    const byId = familyMembers.find((m) => m.id === identifier);
    if (byId) return byId.name;

    const byName = familyMembers.find(
      (m) => m.name.toLowerCase() === identifier.toLowerCase(),
    );
    if (byName) return byName.name;

    return identifier;
  };

  const getContactInitials = (identifier: string) => {
    const name = getContactName(identifier);
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMyShare = (transaction: Transaction) => {
    if (!transaction.sharedWith) return Math.abs(transaction.amount);
    const totalParticipants = transaction.sharedWith.length + 1;
    return Math.abs(transaction.amount) / totalParticipants;
  };

  const createGroupedByContact = (transactions: Transaction[]) =>
    transactions.reduce(
      (acc, transaction) => {
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
      {} as Record<string, any>,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Despesas Compartilhadas</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Compartilhado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {(totalRegularShared + totalTripShared).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {sharedTransactions.length} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesas Regulares
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalRegularShared.toLocaleString("pt-BR", {
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
            <CardTitle className="text-sm font-medium">
              Despesas de Viagem
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {totalTripShared.toLocaleString("pt-BR", {
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
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
                          <h3 className="font-semibold">{contact.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
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
                              <span className="text-sm">
                                {transaction.description}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              R${" "}
                              {getMyShare(transaction).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
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
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma despesa regular compartilhada
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece adicionando despesas compartilhadas com familiares ou
                  amigos.
                </p>
                <Button>
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
                          <h3 className="font-semibold">{contact.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
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
                              <Plane className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {transaction.description}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              R${" "}
                              {getMyShare(transaction).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
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
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma despesa de viagem compartilhada
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Adicione despesas compartilhadas durante suas viagens.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Despesa de Viagem
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SharedExpensesSimple;
