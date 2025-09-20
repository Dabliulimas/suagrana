"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { type Account, type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

interface CardInvoiceManagerProps {
  card: Account;
  onClose: () => void;
}

interface Invoice {
  month: string;
  year: number;
  transactions: Transaction[];
  total: number;
  dueDate: string;
  isPaid: boolean;
}

export function CardInvoiceManager({ card, onClose }: CardInvoiceManagerProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    generateInvoices();
  }, []);

  const generateInvoices = () => {
    const transactions = transactions;
    const cardTransactions = transactions.filter(
      (t) => t.account === card.name && t.type === "expense",
    );

    // Agrupar transações por mês/ano
    const invoiceMap = new Map<string, Transaction[]>();

    cardTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!invoiceMap.has(key)) {
        invoiceMap.set(key, []);
      }
      invoiceMap.get(key)!.push(transaction);
    });

    // Gerar faturas dos últimos 12 meses
    const invoiceList: Invoice[] = [];
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthTransactions = invoiceMap.get(key) || [];

      const total = monthTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0,
      );
      const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 10); // Vencimento dia 10

      invoiceList.push({
        month: date.toLocaleDateString("pt-BR", { month: "long" }),
        year: date.getFullYear(),
        transactions: monthTransactions,
        total,
        dueDate: dueDate.toISOString().split("T")[0],
        isPaid: dueDate < new Date(), // Considera pago se já passou do vencimento
      });
    }

    setInvoices(invoiceList.reverse());
  };

  const currentInvoice = invoices.find(
    (inv) =>
      inv.year === selectedYear &&
      inv.month ===
        new Date(selectedYear, selectedMonth).toLocaleDateString("pt-BR", {
          month: "long",
        }),
  );

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getInvoiceStatus = (invoice: Invoice) => {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);

    if (invoice.total === 0)
      return { status: "Sem gastos", color: "bg-gray-100 text-gray-800" };
    if (dueDate < today)
      return { status: "Vencida", color: "bg-red-100 text-red-800" };
    if (dueDate.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000) {
      return {
        status: "Vence em breve",
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    return { status: "Em aberto", color: "bg-blue-100 text-blue-800" };
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Faturas - {card.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Fatura Atual</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {new Date(selectedYear, selectedMonth).toLocaleDateString(
                  "pt-BR",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {currentInvoice && (
              <>
                {/* Invoice Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          R${" "}
                          {currentInvoice.total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Vencimento:{" "}
                          {new Date(currentInvoice.dueDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                      <Badge className={getInvoiceStatus(currentInvoice).color}>
                        {getInvoiceStatus(currentInvoice).status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Transações ({currentInvoice.transactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentInvoice.transactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhuma transação neste período
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {currentInvoice.transactions
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime(),
                          )
                          .map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex justify-between items-center p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      transaction.date,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                  <span>•</span>
                                  <span>{transaction.category}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-red-600">
                                  R${" "}
                                  {Math.abs(transaction.amount).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                                {transaction.installments && (
                                  <p className="text-xs text-gray-500">
                                    {transaction.currentInstallment}/
                                    {transaction.installments}x
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              {invoices.map((invoice, index) => (
                <Card
                  key={`invoice-${invoice.month}-${invoice.year}-${index}`}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold capitalize">
                          {invoice.month} {invoice.year}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Vencimento:{" "}
                          {new Date(invoice.dueDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.transactions.length} transações
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          R${" "}
                          {invoice.total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <Badge className={getInvoiceStatus(invoice).color}>
                          {getInvoiceStatus(invoice).status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
