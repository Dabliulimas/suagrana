"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle,
  Calculator,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  storage,
  type Trip,
  type Transaction,
  type Contact,
} from "../lib/storage";
import { toast } from "sonner";

interface TripSharedExpensesProps {
  trip: Trip;
  onUpdate: () => void;
}

interface DebtSummary {
  personA: string;
  personB: string;
  amount: number;
  direction: "owes" | "owed"; // personA owes/is owed by personB
}

interface PersonBalance {
  person: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = owed money, negative = owes money
}

export function TripSharedExpenses({
  trip,
  onUpdate,
}: TripSharedExpensesProps) {
  const [sharedExpenses, setSharedExpenses] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary[]>([]);
  const [personBalances, setPersonBalances] = useState<PersonBalance[]>([]);

  useEffect(() => {
    loadData();
  }, [trip.id]);

  const loadData = () => {
    // Load shared expenses for this trip
    const allTransactions = transactions;
    const tripSharedExpenses = allTransactions.filter(
      (t) => t.tripId === trip.id && t.type === "shared",
    );
    setSharedExpenses(tripSharedExpenses);

    // Load contacts
    setContacts(contacts);

    // Calculate balances and debts
    calculateBalancesAndDebts(tripSharedExpenses);
  };

  const calculateBalancesAndDebts = (expenses: Transaction[]) => {
    const balances = new Map<string, PersonBalance>();

    // Initialize balances for all participants
    const allParticipants = new Set<string>();
    expenses.forEach((expense) => {
      allParticipants.add("Você"); // Current user
      if (expense.sharedWith) {
        expense.sharedWith.forEach((participantId) => {
          // Primeiro tenta encontrar por ID (novo formato)
          const familyMember = familyMembers.find(
            (m) => m.id === participantId,
          );
          if (familyMember) {
            allParticipants.add(familyMember.name);
            return;
          }

          // Fallback para formato antigo (email/nome)
          const contact = contacts.find(
            (c) => c.email === participantId || c.name === participantId,
          );
          allParticipants.add(contact?.name || participantId);
        });
      }
    });

    allParticipants.forEach((person) => {
      balances.set(person, {
        person,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
      });
    });

    // Calculate who paid what and who owes what
    expenses.forEach((expense) => {
      const totalAmount = Math.abs(expense.amount);
      const participants = [
        "Você",
        ...(expense.sharedWith?.map((participantId) => {
          // Primeiro tenta encontrar por ID (novo formato)
          const familyMember = familyMembers.find(
            (m) => m.id === participantId,
          );
          if (familyMember) {
            return familyMember.name;
          }

          // Fallback para formato antigo (email/nome)
          const contact = contacts.find(
            (c) => c.email === participantId || c.name === participantId,
          );
          return contact?.name || participantId;
        }) || []),
      ];

      const amountPerPerson = totalAmount / participants.length;

      // Person who paid (assuming current user paid)
      const payer = "Você";
      const payerBalance = balances.get(payer)!;
      payerBalance.totalPaid += totalAmount;

      // Everyone owes their share
      participants.forEach((participant) => {
        const participantBalance = balances.get(participant)!;
        participantBalance.totalOwed += amountPerPerson;
      });
    });

    // Calculate final balances
    const finalBalances: PersonBalance[] = [];
    balances.forEach((balance) => {
      balance.balance = balance.totalPaid - balance.totalOwed;
      finalBalances.push(balance);
    });

    setPersonBalances(finalBalances);

    // Calculate simplified debts
    calculateSimplifiedDebts(finalBalances);
  };

  const calculateSimplifiedDebts = (balances: PersonBalance[]) => {
    const debts: DebtSummary[] = [];

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = balances
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    const debtors = balances
      .filter((b) => b.balance < 0)
      .sort((a, b) => a.balance - b.balance);

    let i = 0,
      j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (amount > 0) {
        debts.push({
          personA: debtor.person,
          personB: creditor.person,
          amount,
          direction: "owes",
        });
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance === 0) i++;
      if (debtor.balance === 0) j++;
    }

    setDebtSummary(debts);
  };

  const getContactName = (email: string): string => {
    const contact = contacts.find((c) => c.email === email);
    return contact?.name || email;
  };

  const getTotalSharedAmount = (): number => {
    return sharedExpenses.reduce(
      (sum, expense) => sum + Math.abs(expense.amount),
      0,
    );
  };

  const getMyBalance = (): number => {
    const myBalance = personBalances.find((b) => b.person === "Você");
    return myBalance?.balance || 0;
  };

  const markDebtAsPaid = (debt: DebtSummary) => {
    // In a real app, this would update the debt status
    toast.success(
      `Dívida de ${debt.personA} para ${debt.personB} marcada como paga!`,
    );
    // Here you could update the debt status in storage
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total Compartilhado
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {trip.currency} {getTotalSharedAmount().toFixed(2)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Meu Saldo
                </p>
                <p
                  className={`text-2xl font-bold ${getMyBalance() >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {trip.currency} {Math.abs(getMyBalance()).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getMyBalance() >= 0 ? "A receber" : "A pagar"}
                </p>
              </div>
              {getMyBalance() >= 0 ? (
                <ArrowUpRight className="w-8 h-8 text-green-600" />
              ) : (
                <ArrowDownLeft className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Participantes
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {personBalances.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="debts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="debts">Quem Deve</TabsTrigger>
          <TabsTrigger value="balances">Saldos</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="debts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Resumo de Dívidas Simplificado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debtSummary.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Todas as contas estão quitadas!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {debtSummary.map((debt, index) => (
                    <div
                      key={`participant-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <ArrowDownLeft className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            <span className="text-red-600">{debt.personA}</span>{" "}
                            deve para{" "}
                            <span className="text-green-600">
                              {debt.personB}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.currency} {debt.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markDebtAsPaid(debt)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Marcar como Pago
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Saldos por Pessoa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personBalances.map((balance, index) => (
                  <div key={`split-${index}`} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{balance.person}</h4>
                      <Badge
                        variant={
                          balance.balance >= 0 ? "default" : "destructive"
                        }
                      >
                        {balance.balance >= 0 ? "A receber" : "Deve"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">
                          Pagou
                        </p>
                        <p className="font-semibold text-blue-600">
                          {trip.currency} {balance.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Deve</p>
                        <p className="font-semibold text-orange-600">
                          {trip.currency} {balance.totalOwed.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">
                          Saldo
                        </p>
                        <p
                          className={`font-semibold ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {trip.currency} {Math.abs(balance.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Compartilhados</CardTitle>
            </CardHeader>
            <CardContent>
              {sharedExpenses.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Nenhum gasto compartilhado registrado para esta viagem
                </p>
              ) : (
                <div className="space-y-3">
                  {sharedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex justify-between items-start p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{expense.description}</h4>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>
                            Data:{" "}
                            {new Date(expense.date).toLocaleDateString("pt-BR")}
                          </p>
                          <p>
                            Compartilhado com:{" "}
                            {expense.sharedWith
                              ?.map((email) => getContactName(email))
                              .join(", ")}
                          </p>
                          <p>
                            Divisão: {trip.currency}{" "}
                            {(
                              Math.abs(expense.amount) /
                              ((expense.sharedWith?.length || 0) + 1)
                            ).toFixed(2)}{" "}
                            por pessoa
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {trip.currency} {Math.abs(expense.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Gastos Compartilhados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Resumo Financeiro</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total de gastos compartilhados:</span>
                      <span className="font-medium">
                        {trip.currency} {getTotalSharedAmount().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Número de transações:</span>
                      <span className="font-medium">
                        {sharedExpenses.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Média por transação:</span>
                      <span className="font-medium">
                        {trip.currency}{" "}
                        {sharedExpenses.length > 0
                          ? (
                              getTotalSharedAmount() / sharedExpenses.length
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Status das Dívidas</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Quitadas: 0</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">
                        Pendentes: {debtSummary.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Em atraso: 0</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Próximas Ações</h4>
                {debtSummary.length === 0 ? (
                  <p className="text-green-600 text-sm">
                    ✅ Todas as contas estão em dia!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {debtSummary.slice(0, 3).map((debt, index) => (
                      <div
                        key={`summary-${index}`}
                        className="flex items-center gap-2 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span>
                          {debt.personA} precisa pagar {trip.currency}{" "}
                          {debt.amount.toFixed(2)} para {debt.personB}
                        </span>
                      </div>
                    ))}
                    {debtSummary.length > 3 && (
                      <p className="text-sm text-gray-600">
                        ... e mais {debtSummary.length - 3} pendências
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
